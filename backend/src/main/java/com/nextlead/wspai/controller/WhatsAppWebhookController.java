package com.nextlead.wspai.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nextlead.wspai.dao.WhatsAppMessageDao;
import com.nextlead.dao.ContactDao;
import com.nextlead.wspai.model.AiDecisionResponse;
import com.nextlead.wspai.model.WhatsAppMessage;
import com.nextlead.models.Contact;
import com.nextlead.wspai.dao.AiConfigDao;
import com.nextlead.wspai.model.AiProductConfig;
import com.nextlead.wspai.service.GeminiService;
import com.nextlead.wspai.service.WhatsAppApiService;
import com.nextlead.services.SettingsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import org.springframework.jdbc.core.JdbcTemplate;

import java.text.Normalizer;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/whatsapp/webhook")
public class WhatsAppWebhookController {

    private static final Logger logger = LoggerFactory.getLogger(WhatsAppWebhookController.class);

    private final SettingsService settingsService;
    private final WhatsAppMessageDao messageDao;
    private final ContactDao contactDao;
    private final SimpMessagingTemplate messagingTemplate;
    private final WhatsAppApiService apiService;
    private final GeminiService geminiService;
    private final AiConfigDao aiConfigDao;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    @Autowired
    public WhatsAppWebhookController(WhatsAppMessageDao messageDao, 
                                     SimpMessagingTemplate messagingTemplate,
                                     WhatsAppApiService apiService,
                                     GeminiService geminiService,
                                     SettingsService settingsService,
                                     ContactDao contactDao,
                                     AiConfigDao aiConfigDao,
                                     JdbcTemplate jdbcTemplate,
                                     ObjectMapper objectMapper) {
        this.messageDao = messageDao;
        this.messagingTemplate = messagingTemplate;
        this.apiService = apiService;
        this.geminiService = geminiService;
        this.settingsService = settingsService;
        this.contactDao = contactDao;
        this.aiConfigDao = aiConfigDao;
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    private String getVerifyToken() {
        return settingsService.getSetting("whatsapp.verify.token");
    }

    private String getDisplayPhoneNumber() {
        return settingsService.getSetting("whatsapp.display.number");
    }

    /**
     * Handshake de verificación del Webhook de Meta.
     */
    @GetMapping
    public ResponseEntity<String> verifyWebhook(
            @RequestParam(value = "hub.mode", required = false) String mode,
            @RequestParam(value = "hub.verify_token", required = false) String token,
            @RequestParam(value = "hub.challenge", required = false) String challenge) {

        logger.info("Petición de verificación del webhook de WhatsApp recibida: mode={}, token={}, challenge={}", mode, token, challenge);

        String verifyToken = getVerifyToken();
        if ("subscribe".equals(mode) && verifyToken != null && verifyToken.equals(token)) {
            logger.info("Verificación de webhook de WhatsApp EXITOSA");
            return ResponseEntity.ok(challenge);
        } else {
            logger.warn("Verificación de webhook de WhatsApp FALLIDA. Token esperado: {}, Token recibido: {}", verifyToken, token);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Error de verificación");
        }
    }

    /**
     * Receptor de notificaciones y mensajes en tiempo real enviados por Meta.
     */
    @PostMapping
    public ResponseEntity<Void> receiveWebhook(@RequestBody JsonNode payload) {
        logger.info("Webhook de WhatsApp recibido.");
        logger.debug("Payload completo del Webhook: {}", payload);

        try {
            JsonNode entryNode = payload.get("entry");
            if (entryNode != null && entryNode.isArray() && entryNode.size() > 0) {
                for (JsonNode entry : entryNode) {
                    JsonNode changesNode = entry.get("changes");
                    if (changesNode != null && changesNode.isArray()) {
                        for (JsonNode change : changesNode) {
                            JsonNode valueNode = change.get("value");
                            if (valueNode != null) {
                                // 1. Procesar mensajes de texto entrantes
                                processMessages(valueNode);
                                
                                // 2. Procesar estados de mensajes (sent, delivered, read) si es necesario
                                processStatuses(valueNode);
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Error al procesar el webhook de WhatsApp: {}", e.getMessage(), e);
        }

        // Siempre responder 200 OK a Meta de inmediato
        return ResponseEntity.ok().build();
    }

    private void processMessages(JsonNode valueNode) {
        JsonNode messagesNode = valueNode.get("messages");
        if (messagesNode != null && messagesNode.isArray() && messagesNode.size() > 0) {
            JsonNode metadataNode = valueNode.get("metadata");
            String ourNumber = (metadataNode != null && metadataNode.has("display_phone_number")) 
                    ? metadataNode.get("display_phone_number").asText() 
                    : getDisplayPhoneNumber();

            for (JsonNode messageNode : messagesNode) {
                String type = messageNode.has("type") ? messageNode.get("type").asText() : "";
                
                // Procesar mensajes de tipo texto, imagen, audio, video o ubicación
                if ("text".equals(type) || "image".equals(type) || "audio".equals(type) || "video".equals(type) || "location".equals(type)) {
                    String fromPhone = messageNode.has("from") ? messageNode.get("from").asText() : null;
                    long unixTime = messageNode.has("timestamp") ? messageNode.get("timestamp").asLong() : Instant.now().getEpochSecond();
                    String messageId = messageNode.has("id") ? messageNode.get("id").asText() : null;
                    String textBody = "";

                    if (messageId != null && messageDao.findByWamid(messageId).isPresent()) {
                        logger.info("El mensaje con wamid {} ya fue procesado. Omitiendo duplicado.", messageId);
                        continue;
                    }

                    if ("text".equals(type)) {
                        textBody = messageNode.path("text").path("body").asText();
                    } else if ("location".equals(type)) {
                        JsonNode locNode = messageNode.get("location");
                        if (locNode != null) {
                            double lat = locNode.path("latitude").asDouble();
                            double lng = locNode.path("longitude").asDouble();
                            String name = locNode.path("name").asText("");
                            String address = locNode.path("address").asText("");
                            textBody = "[UBICACIÓN] Latitud: " + lat + ", Longitud: " + lng;
                            if (!name.isEmpty()) {
                                textBody += " | Nombre: " + name;
                            }
                            if (!address.isEmpty()) {
                                textBody += " | Dirección: " + address;
                            }
                        } else {
                            textBody = "[UBICACIÓN sin coordenadas]";
                        }
                    } else {
                        // type es "image", "audio" o "video"
                        JsonNode mediaNode = messageNode.get(type);
                        if (mediaNode != null) {
                            String mediaId = mediaNode.path("id").asText();
                            String mimeType = mediaNode.path("mime_type").asText();
                            if (mediaId != null && !mediaId.isEmpty()) {
                                // Descargar el archivo de Meta y guardarla en /app/uploads/
                                String localUrl = apiService.downloadMedia(mediaId, mimeType);
                                if (localUrl != null) {
                                    textBody = "[" + type.toUpperCase() + "]" + localUrl;
                                } else {
                                    textBody = "[" + type.substring(0, 1).toUpperCase() + type.substring(1) + " no disponible]";
                                }
                            } else {
                                textBody = "[" + type.substring(0, 1).toUpperCase() + type.substring(1) + " vacío]";
                            }
                        }
                    }
                    
                    if (fromPhone != null && !textBody.isEmpty()) {
                        LocalDateTime timestamp = LocalDateTime.ofInstant(
                                Instant.ofEpochSecond(unixTime), 
                                ZoneId.systemDefault()
                        );

                        // Crear y guardar el mensaje entrante en la BD
                        WhatsAppMessage message = new WhatsAppMessage();
                        message.setSender(fromPhone); // Quien envía es el cliente
                        message.setReceiver(ourNumber); // Quien recibe es nuestra cuenta de negocio
                        message.setMessageText(textBody);
                        message.setTimestamp(timestamp);
                        message.setStatus("RECEIVED");
                        message.setWamid(messageId);

                        messageDao.save(message);
                        logger.info("Guardado mensaje de WhatsApp recibido desde {} con wamid {} : {}", fromPhone, messageId, textBody);

                        // Transmitir vía WebSocket al canal correspondiente de este cliente (últimos 9 dígitos)
                        String last9 = fromPhone.length() >= 9 ? fromPhone.substring(fromPhone.length() - 9) : fromPhone;
                        String destination = "/topic/chat/" + last9;
                        messagingTemplate.convertAndSend(destination, message);
                        messagingTemplate.convertAndSend("/topic/chat/global-updates", message);
                        logger.info("Mensaje transmitido en tiempo real vía WebSocket a {}", destination);

                        // Responder asíncronamente con Gemini para textos, audios y ubicaciones. Imágenes/video solo se guardan y muestran en el CRM.
                        if ("text".equals(type) || "audio".equals(type) || "location".equals(type)) {
                            // Obtener el contacto para verificar su configuración individual
                            Optional<Contact> contactOpt = contactDao.findByPhone(fromPhone);
                            if (contactOpt.isEmpty()) {
                                try {
                                    String profileName = "Nuevo Contacto";
                                    JsonNode contactsNode = valueNode.get("contacts");
                                    if (contactsNode != null && contactsNode.isArray() && contactsNode.size() > 0) {
                                        JsonNode firstContact = contactsNode.get(0);
                                        JsonNode profileNode = firstContact.get("profile");
                                        if (profileNode != null && profileNode.has("name")) {
                                            profileName = profileNode.get("name").asText();
                                        }
                                    }

                                    Contact newContact = new Contact();
                                    newContact.setTipoPersona("NATURAL");
                                    newContact.setTipoDocumento("DNI");
                                    newContact.setNumeroDocumento(fromPhone);
                                    
                                    if (profileName != null && profileName.contains(" ")) {
                                        int spaceIndex = profileName.indexOf(" ");
                                        newContact.setNombres(profileName.substring(0, spaceIndex).trim());
                                        newContact.setApellidos(profileName.substring(spaceIndex).trim());
                                    } else {
                                        newContact.setNombres(profileName);
                                        newContact.setApellidos("");
                                    }
                                    
                                    newContact.setTelefonoPrincipal(fromPhone);
                                    newContact.setStarred(false);
                                    newContact.setAiActive(true);
                                    Contact savedContact = contactDao.save(newContact);
                                    contactOpt = Optional.of(savedContact);
                                    logger.info("Creado nuevo contacto automáticamente en base de datos: {} ({})", profileName, fromPhone);
                                } catch (Exception e) {
                                    logger.error("Error al crear automáticamente el contacto para el teléfono {}: ", fromPhone, e);
                                }
                            }

                            // Guardar la dirección y ubicación de WhatsApp si el mensaje es de tipo location
                            if ("location".equals(type) && contactOpt.isPresent()) {
                                try {
                                    JsonNode locNode = messageNode.get("location");
                                    if (locNode != null) {
                                        double lat = locNode.path("latitude").asDouble();
                                        double lng = locNode.path("longitude").asDouble();
                                        String addressText = locNode.path("address").asText("");
                                        if (addressText.isEmpty()) {
                                            addressText = locNode.path("name").asText("Ubicación WhatsApp");
                                        }
                                        
                                        Long contactId = contactOpt.get().getId();
                                        // Verificar si ya existe una dirección "WhatsApp GPS" para este contacto
                                        Integer count = jdbcTemplate.queryForObject(
                                            "SELECT COUNT(*) FROM direcciones WHERE id_contacto = ? AND nombre_ubicacion = 'WhatsApp GPS'",
                                            Integer.class, contactId
                                        );
                                        if (count != null && count > 0) {
                                            jdbcTemplate.update(
                                                "UPDATE direcciones SET direccion_completa = ?, latitud = ?, longitud = ? " +
                                                "WHERE id_contacto = ? AND nombre_ubicacion = 'WhatsApp GPS'",
                                                addressText, lat, lng, contactId
                                            );
                                            logger.info("Actualizada dirección GPS de WhatsApp para el contacto ID: {}", contactId);
                                        } else {
                                            jdbcTemplate.update(
                                                "INSERT INTO direcciones (id_contacto, nombre_ubicacion, direccion_completa, latitud, longitud) " +
                                                "VALUES (?, ?, ?, ?, ?)",
                                                contactId, "WhatsApp GPS", addressText, lat, lng
                                            );
                                            logger.info("Insertada nueva dirección GPS de WhatsApp para el contacto ID: {}", contactId);
                                        }
                                    }
                                } catch (Exception e) {
                                    logger.error("Error al guardar la ubicación de WhatsApp para el contacto: ", e);
                                }
                            }

                             // Guardar dirección si es un link de Google Maps en un mensaje de texto
                             if ("text".equals(type) && textBody != null && contactOpt.isPresent() &&
                                 (textBody.contains("google.com/maps") || textBody.contains("maps.google.com") || textBody.contains("maps.app.goo.gl"))) {
                                 try {
                                     Double lat = null;
                                     Double lng = null;
                                     String addressText = "Enlace Google Maps";
                                     String districtName = null;
                                     String resolvedUbigeo = null;
                                     
                                     // Intentar extraer coordenadas del URL usando regex
                                     java.util.regex.Matcher coordMatcher = java.util.regex.Pattern.compile("/@(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)").matcher(textBody);
                                     if (coordMatcher.find()) {
                                         lat = Double.parseDouble(coordMatcher.group(1));
                                         lng = Double.parseDouble(coordMatcher.group(2));
                                     } else {
                                         java.util.regex.Matcher qMatcher = java.util.regex.Pattern.compile("[?&]q=(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)").matcher(textBody);
                                         if (qMatcher.find()) {
                                             lat = Double.parseDouble(qMatcher.group(1));
                                             lng = Double.parseDouble(qMatcher.group(2));
                                         }
                                     }
                                     
                                     // Intentar extraer la dirección de búsqueda
                                     java.util.regex.Matcher searchMatcher = java.util.regex.Pattern.compile("/maps/search/([^/&?#]+)").matcher(textBody);
                                     if (searchMatcher.find()) {
                                         String rawSearch = searchMatcher.group(1);
                                         addressText = java.net.URLDecoder.decode(rawSearch, "UTF-8").replace("+", " ").trim();
                                         
                                         // Intentar resolver el distrito a partir del texto
                                         String[] parts = addressText.split(",");
                                         if (parts.length > 1) {
                                             districtName = parts[parts.length - 1].trim();
                                         } else {
                                             String[] spaceParts = addressText.split(" ");
                                             if (spaceParts.length > 1) {
                                                 districtName = spaceParts[spaceParts.length - 1].trim();
                                             }
                                         }
                                         
                                         if (districtName != null && !districtName.isEmpty()) {
                                             try {
                                                 java.util.List<String> codes = jdbcTemplate.queryForList(
                                                     "SELECT codigo_ubigeo FROM ubigeo_peru WHERE UPPER(distrito) = ? OR UPPER(distrito) LIKE ? ORDER BY codigo_ubigeo ASC LIMIT 1",
                                                     String.class,
                                                     districtName.toUpperCase(), "%" + districtName.toUpperCase() + "%"
                                                 );
                                                 if (!codes.isEmpty()) {
                                                    resolvedUbigeo = codes.get(0);
                                                 }
                                             } catch (Exception uex) {
                                                 logger.warn("No se pudo resolver ubigeo para distrito {} en link: {}", districtName, uex.getMessage());
                                             }
                                         }
                                     }
                                     
                                     Long contactId = contactOpt.get().getId();
                                     Integer count = jdbcTemplate.queryForObject(
                                         "SELECT COUNT(*) FROM direcciones WHERE id_contacto = ? AND nombre_ubicacion = 'WhatsApp Link'",
                                         Integer.class, contactId
                                     );
                                     
                                     if (count != null && count > 0) {
                                         jdbcTemplate.update(
                                             "UPDATE direcciones SET direccion_completa = ?, codigo_ubigeo = ?, latitud = ?, longitud = ? " +
                                             "WHERE id_contacto = ? AND nombre_ubicacion = 'WhatsApp Link'",
                                             addressText, resolvedUbigeo, lat, lng, contactId
                                         );
                                         logger.info("Actualizada dirección desde enlace Google Maps para el contacto ID: {}", contactId);
                                     } else {
                                         jdbcTemplate.update(
                                             "INSERT INTO direcciones (id_contacto, nombre_ubicacion, codigo_ubigeo, direccion_completa, latitud, longitud) " +
                                             "VALUES (?, ?, ?, ?, ?, ?)",
                                             contactId, "WhatsApp Link", resolvedUbigeo, addressText, lat, lng
                                         );
                                         logger.info("Insertada nueva dirección desde enlace Google Maps para el contacto ID: {}", contactId);
                                     }
                                     
                                     // También actualizar referencia en contacts para visualización general
                                     jdbcTemplate.update("UPDATE contacts SET referencia = ? WHERE id = ?", addressText, contactId);
                                 } catch (Exception e) {
                                     logger.error("Error al procesar el enlace de Google Maps para el contacto: ", e);
                                 }
                             }

                            // Verificar palabras clave para derivación a humano (solo texto)
                            boolean isHumanFallback = "text".equals(type) && isHumanFallback(textBody);

                            if (isHumanFallback) {
                                logger.info("Derivación a humano detectada para {}: '{}'", fromPhone, textBody);
                                
                                // 1. Desactivar la IA para el contacto en la BD
                                contactOpt.ifPresent(contact -> {
                                    contactDao.updateAiActive(contact.getId(), false);
                                    logger.info("IA desactivada para el contacto ID: {}", contact.getId());
                                });

                                // 2. Enviar mensaje de WhatsApp al cliente
                                String fallbackMsg = "He derivado tu caso con un asesor, en breve te atenderán.";
                                String wamid = apiService.sendMessage(fromPhone, fallbackMsg);

                                // 3. Guardar el mensaje en la BD
                                WhatsAppMessage fallbackReply = new WhatsAppMessage();
                                fallbackReply.setSender(ourNumber);
                                fallbackReply.setReceiver(fromPhone);
                                fallbackReply.setMessageText(fallbackMsg);
                                fallbackReply.setTimestamp(LocalDateTime.now());
                                fallbackReply.setStatus(wamid != null ? "SENT" : "FAILED");
                                fallbackReply.setWamid(wamid);
                                messageDao.save(fallbackReply);

                                // 4. Transmitir el mensaje por WebSocket
                                messagingTemplate.convertAndSend("/topic/chat/" + last9, fallbackReply);
                                messagingTemplate.convertAndSend("/topic/chat/global-updates", fallbackReply);

                                // 5. Registrar una alerta del sistema en la BD y transmitirla por WebSocket
                                sendSystemAlert(fromPhone, "⚠️ *Alerta del Sistema:* Chatbot desactivado y caso derivado a un asesor humano.", ourNumber);
                            } else {
                                // Flujo normal de Gemini
                                boolean isGlobalAiActive = "true".equalsIgnoreCase(settingsService.getSetting("ai.active"));
                                boolean shouldReply = contactOpt.map(Contact::getAiActive).orElse(isGlobalAiActive);

                                if (shouldReply) {
                                    // Fase 4: Límite de cuota de mensajes automática para evitar bucles (Dinámico)
                                    int countLast24h = messageDao.countOutgoingMessagesInLast24Hours(fromPhone);
                                    
                                    String quotaStr = settingsService.getSetting("ai.max.quota");
                                    int maxQuota = 30; // fallback por defecto
                                    try {
                                        if (quotaStr != null && !quotaStr.trim().isEmpty()) {
                                            maxQuota = Integer.parseInt(quotaStr.trim());
                                        }
                                    } catch (NumberFormatException e) {
                                        logger.warn("El valor de ai.max.quota no es un entero válido: {}, usando fallback 30.", quotaStr);
                                    }
                                    
                                    if (countLast24h >= maxQuota) {
                                        logger.warn("El contacto {} ha excedido la cuota diaria de mensajes automáticos ({} de {} enviados). Desactivando IA.", fromPhone, countLast24h, maxQuota);
                                        contactOpt.ifPresent(contact -> {
                                            contactDao.updateAiActive(contact.getId(), false);
                                        });
                                        sendSystemAlert(fromPhone, "⚠️ *Alerta del Sistema:* Límite de respuestas automáticas excedido (máximo " + maxQuota + " mensajes por día). Chatbot desactivado para evitar bucles infinitos.", ourNumber);
                                    } else {
                                        final String cleanFromPhone = fromPhone;
                                        final String cleanTextBody = textBody;
                                        final String cleanOurNumber = ourNumber;
                                        
                                        CompletableFuture.runAsync(() -> {
                                            respondWithAI(cleanFromPhone, cleanTextBody, cleanOurNumber);
                                        });
                                    }
                                } else {
                                    logger.info("Respuestas automáticas de IA desactivadas (individualmente desactivado o globalmente apagado) para contacto: {}", fromPhone);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private byte[] getImageBytes(String urlString) {
        try {
            // 1. Intentar buscar localmente si es un archivo en /app/uploads/
            String filename = urlString.substring(urlString.lastIndexOf("/") + 1);
            java.io.File file = new java.io.File("/app/uploads/" + filename);
            if (file.exists()) {
                logger.info("Cargando imagen localmente desde: /app/uploads/{}", filename);
                return java.nio.file.Files.readAllBytes(file.toPath());
            }
            
            // 2. Si no es local, descargarlo por HTTP
            String targetUrl = urlString.replace("localhost", "host.docker.internal");
            logger.info("Descargando imagen desde URL: {}", targetUrl);
            org.springframework.web.client.RestTemplate downloadTemplate = new org.springframework.web.client.RestTemplate();
            return downloadTemplate.getForObject(targetUrl, byte[].class);
        } catch (Exception e) {
            logger.error("Error al obtener los bytes de la imagen: " + urlString, e);
            return null;
        }
    }

    private void respondWithAI(String clientPhone, String clientMessage, String ourNumber) {
        try {
            logger.info("Iniciando procesamiento de respuesta automática de IA para el contacto: {}", clientPhone);

            Contact contact = contactDao.findByPhone(clientPhone).orElse(null);
            String aiResponse = geminiService.generateResponse(clientMessage, contact);

            if (aiResponse != null && aiResponse.startsWith("ERROR_GEMINI_")) {
                String errorDetails = aiResponse.substring("ERROR_GEMINI_".length());
                String userFriendlyAlert = "⚠️ *Alerta del Sistema:* Ocurrió un error al conectar con Gemini API.\n\n*Detalles del error:* `" + errorDetails + "`";
                sendSystemAlert(clientPhone, userFriendlyAlert, ourNumber);
                return;
            }

            if (aiResponse == null || aiResponse.trim().isEmpty()) {
                sendSystemAlert(clientPhone, "⚠️ *Alerta del Sistema:* El Agente de IA no devolvió ninguna respuesta.", ourNumber);
                return;
            }

            AiDecisionResponse decision = parseAiDecision(aiResponse);
            String replyText;
            String mediaType;
            String mediaId;
            String imageUrl;
            String caption;
            boolean sendMedia;
            boolean needsHuman;

            if (decision != null) {
                replyText = decision.getReplyText();
                sendMedia = decision.isSendMedia();
                mediaType = firstNonBlank(decision.getMediaType(), "image");
                mediaId = decision.getMediaId();
                imageUrl = decision.getImageUrl();
                caption = firstNonBlank(decision.getCaption(), replyText);
                needsHuman = decision.isNeedsHuman();

                // Procesar y guardar información extraída por la IA (pedido, dirección, pago, etc.)
                if (decision.getExtractedInfo() != null && !decision.getExtractedInfo().isNull() && contact != null) {
                    processExtractedInfo(contact, decision.getExtractedInfo());
                }

                // Si la IA marca next_state como pedido_confirmado por confirmación del cliente
                if (decision != null && "pedido_confirmado".equalsIgnoreCase(decision.getNextState()) && contact != null) {
                    try {
                        // 1. Buscar la oportunidad activa del contacto
                        java.util.List<java.util.Map<String, Object>> activeOpps = jdbcTemplate.queryForList(
                            "SELECT id FROM oportunidades WHERE contacto_id = ? " +
                            "AND etapa_id NOT IN (SELECT id FROM kanban_columnas WHERE es_ganada = true OR es_perdida = true) " +
                            "ORDER BY id DESC LIMIT 1",
                            contact.getId()
                        );
                        
                        if (!activeOpps.isEmpty()) {
                            Long oppId = ((Number) activeOpps.get(0).get("id")).longValue();
                            // Actualizar etapa de oportunidad a 5 (Ganada)
                            jdbcTemplate.update("UPDATE oportunidades SET etapa_id = 5 WHERE id = ?", oppId);
                            logger.info("Oportunidad ID {} marcada como GANADA automáticamente por confirmación de pedido.", oppId);
                            
                            // Convertir a pedido y pedido_detalles
                            convertOpportunityToOrder(oppId);
                        } else {
                            logger.warn("No se encontró una oportunidad activa para el contacto ID {} al confirmar el pedido.", contact.getId());
                        }
                        
                        // 2. Cambiar estado del lead a 'Pedido'
                        jdbcTemplate.update("UPDATE contacts SET status = 'Pedido' WHERE id = ?", contact.getId());
                        logger.info("Contacto ID {} cambiado a estado 'Pedido' por confirmación de la IA.", contact.getId());
                    } catch (Exception e) {
                        logger.error("Error al procesar la confirmación automática del pedido:", e);
                    }
                }

                // SAFEGUARD: If intent is "promocion", automatically force promotion media if configured
                if ("promocion".equalsIgnoreCase(decision.getIntent())) {
                    String globalPromoType = settingsService.getSetting("ai.products.promotion.media.type");
                    String globalPromoMediaIds = settingsService.getSetting("ai.products.promotion.media.ids");
                    if ("IMAGE".equalsIgnoreCase(globalPromoType) && globalPromoMediaIds != null && !globalPromoMediaIds.trim().isEmpty()) {
                        sendMedia = true;
                        mediaType = "image";
                        mediaId = globalPromoMediaIds.trim();
                    }
                }
            } else {
                // Fallback defensivo: si Gemini no devolvió JSON, se envía como texto normal.
                replyText = stripLegacyImageTags(aiResponse).trim();
                sendMedia = false;
                mediaType = "image";
                mediaId = null;
                imageUrl = null;
                caption = null;
                needsHuman = false;

                // Even on raw fallback, check if we want to force promotion media
                if (containsAny(normalize(aiResponse), "promo", "promocion", "oferta", "descuento")) {
                    String globalPromoType = settingsService.getSetting("ai.products.promotion.media.type");
                    String globalPromoMediaIds = settingsService.getSetting("ai.products.promotion.media.ids");
                    if ("IMAGE".equalsIgnoreCase(globalPromoType) && globalPromoMediaIds != null && !globalPromoMediaIds.trim().isEmpty()) {
                        sendMedia = true;
                        mediaType = "image";
                        mediaId = globalPromoMediaIds.trim();
                        caption = replyText;
                    }
                }
            }

            String wamid = null;
            boolean mediaSent = false;

            if (sendMedia) {
                java.util.List<AiProductConfig> allAiProducts = aiConfigDao.getAllAiProductsConfig();
                if (mediaType == null || mediaType.trim().isEmpty() || "null".equalsIgnoreCase(mediaType.trim())) {
                    mediaType = "image";
                }
                mediaType = mediaType.trim().toLowerCase();

                // Separar por comas si hay múltiples imágenes o IDs
                String[] mediaIds = mediaId != null && !mediaId.trim().isEmpty() ? mediaId.split(",") : new String[0];
                String[] imageUrls = imageUrl != null && !imageUrl.trim().isEmpty() ? imageUrl.split(",") : new String[0];

                int count = Math.max(mediaIds.length, imageUrls.length);
                if (count == 0 && imageUrl != null && !imageUrl.trim().isEmpty()) {
                    imageUrls = new String[]{imageUrl};
                    count = 1;
                }
                if (count == 0 && mediaId != null && !mediaId.trim().isEmpty()) {
                    mediaIds = new String[]{mediaId};
                    count = 1;
                }

                for (int i = 0; i < count; i++) {
                    String currentId = i < mediaIds.length ? mediaIds[i].trim() : null;
                    String currentUrl = i < imageUrls.length ? imageUrls[i].trim() : null;

                    // Si el ID contiene una URL, tratar como URL
                    if (currentId != null && currentId.startsWith("http")) {
                        if (currentUrl == null || currentUrl.isEmpty()) {
                            currentUrl = currentId;
                        }
                        currentId = null;
                    }

                    // Descargar y subir a Meta si no hay ID
                    if ((currentId == null || currentId.isEmpty()) && currentUrl != null && !currentUrl.isEmpty()) {
                        byte[] imgBytes = getImageBytes(currentUrl);
                        if (imgBytes != null && imgBytes.length > 0) {
                            String mimeType = detectMimeType(currentUrl);
                            String filename = "ai_media_" + System.currentTimeMillis() + "_" + i + extensionFromMime(mimeType);
                            currentId = apiService.uploadMedia(imgBytes, filename, mimeType);
                        }
                    }

                    if (currentId != null && !currentId.isEmpty()) {
                        // Buscar si coincide con algún producto del catálogo para extraer su caption correspondiente
                        String currentCaption = null;
                        final String cid = currentId;
                        final String curl = currentUrl;
                        
                        AiProductConfig matchedProd = allAiProducts.stream()
                            .filter(p -> (p.getMediaIdWhatsapp() != null && p.getMediaIdWhatsapp().trim().equals(cid)) ||
                                         (curl != null && p.getProductoId() != null && curl.contains("/api/productos/" + p.getProductoId() + "/imagen")))
                            .findFirst().orElse(null);
                            
                        if (matchedProd != null) {
                            currentCaption = matchedProd.getImageCaption();
                            if (currentCaption == null || currentCaption.trim().isEmpty()) {
                                currentCaption = "*" + matchedProd.getProductName() + "*\n💵 *Precio:* S/ " + (matchedProd.getProductPrice() != null ? matchedProd.getProductPrice().toString() : "0.00") + "\n\n" + (matchedProd.getCustomAiDescription() != null ? matchedProd.getCustomAiDescription().trim() : "");
                            }
                        } else {
                            // Enviar caption solo en la primera imagen (o si es la única)
                            currentCaption = (i == 0) ? (caption != null && !caption.trim().isEmpty() ? caption.trim() : replyText) : null;
                        }

                        String currentWamid = apiService.sendMediaMessage(clientPhone, currentId, mediaType, null, currentCaption);
                        
                        String dbText = (currentCaption != null ? currentCaption.trim() : "") + 
                                        "\n[MEDIA:" + mediaType + "] id=" + (currentUrl != null && !currentUrl.isEmpty() ? currentUrl : currentId);
                        
                        WhatsAppMessage imgMsg = new WhatsAppMessage();
                        imgMsg.setSender(ourNumber);
                        imgMsg.setReceiver(clientPhone);
                        imgMsg.setMessageText(dbText);
                        imgMsg.setTimestamp(LocalDateTime.now());
                        imgMsg.setStatus(currentWamid != null ? "SENT" : "FAILED");
                        imgMsg.setWamid(currentWamid);
                        messageDao.save(imgMsg);
                        
                        String last9 = clientPhone.length() >= 9 ? clientPhone.substring(clientPhone.length() - 9) : clientPhone;
                        messagingTemplate.convertAndSend("/topic/chat/" + last9, imgMsg);
                        messagingTemplate.convertAndSend("/topic/chat/global-updates", imgMsg);

                        if (currentWamid != null) {
                            wamid = currentWamid; // Guardamos el último wamid
                            mediaSent = true;
                        }
                        // Pequeña pausa para asegurar orden de entrega en WhatsApp
                        try { Thread.sleep(800); } catch (InterruptedException ignored) {}
                    }
                }

                if (!mediaSent) {
                    logger.warn("Gemini solicitó envío de media, pero no se pudo enviar ningún media_id ni image_url válido.");
                } else {
                    // Send post-text if intent is promocion and post-text is configured
                    boolean isPromo = false;
                    if (decision != null && "promocion".equalsIgnoreCase(decision.getIntent())) {
                        isPromo = true;
                    } else if (decision == null && containsAny(normalize(aiResponse), "promo", "promocion", "oferta", "descuento")) {
                        isPromo = true;
                    }
                    if (isPromo) {
                        String postText = settingsService.getSetting("ai.products.promotion.post.text");
                        if (postText != null && !postText.trim().isEmpty()) {
                            try { Thread.sleep(1000); } catch (InterruptedException ignored) {}
                            String postWamid = apiService.sendMessage(clientPhone, postText.trim());
                            
                            WhatsAppMessage postMsg = new WhatsAppMessage();
                            postMsg.setSender(ourNumber);
                            postMsg.setReceiver(clientPhone);
                            postMsg.setMessageText(postText.trim());
                            postMsg.setTimestamp(LocalDateTime.now());
                            postMsg.setStatus(postWamid != null ? "SENT" : "FAILED");
                            postMsg.setWamid(postWamid);
                            messageDao.save(postMsg);
                            
                            String last9 = clientPhone.length() >= 9 ? clientPhone.substring(clientPhone.length() - 9) : clientPhone;
                            messagingTemplate.convertAndSend("/topic/chat/" + last9, postMsg);
                            messagingTemplate.convertAndSend("/topic/chat/global-updates", postMsg);

                            if (postWamid != null) {
                                wamid = postWamid;
                            }
                        }
                    }
                }
            }

            if (!mediaSent && replyText != null && !replyText.trim().isEmpty()) {
                wamid = apiService.sendMessage(clientPhone, replyText.trim());
                
                WhatsAppMessage textMsg = new WhatsAppMessage();
                textMsg.setSender(ourNumber);
                textMsg.setReceiver(clientPhone);
                textMsg.setMessageText(replyText.trim());
                textMsg.setTimestamp(LocalDateTime.now());
                textMsg.setStatus(wamid != null ? "SENT" : "FAILED");
                textMsg.setWamid(wamid);
                messageDao.save(textMsg);
                
                String last9 = clientPhone.length() >= 9 ? clientPhone.substring(clientPhone.length() - 9) : clientPhone;
                messagingTemplate.convertAndSend("/topic/chat/" + last9, textMsg);
                messagingTemplate.convertAndSend("/topic/chat/global-updates", textMsg);
            }

            if (needsHuman) {
                Contact contactToDisable = contact != null ? contact : contactDao.findByPhone(clientPhone).orElse(null);
                if (contactToDisable != null) {
                    contactDao.updateAiActive(contactToDisable.getId(), false);
                    logger.info("IA desactivada para el contacto ID: {} por decisión de Gemini.", contactToDisable.getId());
                }
                sendSystemAlert(clientPhone, "⚠️ *Alerta del Sistema:* Gemini marcó esta conversación para atención humana. Chatbot desactivado para este contacto.", ourNumber);
            }

            logger.info("Respuesta de la IA procesada y enviada a {}", clientPhone);

            if (wamid == null) {
                sendSystemAlert(clientPhone, "⚠️ *Alerta del Sistema:* Meta WhatsApp API no pudo enviar el mensaje. Verifica token, phone_number_id, saldo/permisos o validez del número.", ourNumber);
            }

        } catch (Exception e) {
            logger.error("Error al procesar la respuesta automática de la IA: {}", e.getMessage(), e);
            sendSystemAlert(clientPhone, "⚠️ *Alerta del Sistema:* Error al procesar la IA: " + e.getMessage(), ourNumber);
        }
    }

    private AiDecisionResponse parseAiDecision(String aiResponse) {
        try {
            String json = extractJson(aiResponse);
            if (json == null || json.trim().isEmpty()) return null;
            return objectMapper.readValue(json, AiDecisionResponse.class);
        } catch (Exception e) {
            logger.warn("No se pudo parsear la respuesta de Gemini como JSON. Se usará fallback de texto. Respuesta: {}", aiResponse);
            return null;
        }
    }

    private String extractJson(String raw) {
        if (raw == null) return null;
        String text = raw.trim();
        if (text.startsWith("```")) {
            text = text.replaceFirst("^```(?:json)?", "").replaceFirst("```$", "").trim();
        }
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return text.substring(start, end + 1);
        }
        return text;
    }

    private String textValue(JsonNode node, String field) {
        if (node == null || !node.has(field) || node.get(field).isNull()) return null;
        String value = node.get(field).asText();
        if (value == null) return null;
        value = value.trim();
        return value.isEmpty() || "null".equalsIgnoreCase(value) ? null : value;
    }

    private boolean booleanValue(JsonNode node, String field) {
        return node != null && node.has(field) && node.get(field).asBoolean(false);
    }

    private String firstNonBlank(String first, String second) {
        if (first != null && !first.trim().isEmpty()) return first.trim();
        if (second != null && !second.trim().isEmpty()) return second.trim();
        return null;
    }

    private String buildStoredMessageText(String replyText, boolean mediaSent, String mediaType, String imageUrl, String mediaId) {
        StringBuilder sb = new StringBuilder();
        if (replyText != null && !replyText.trim().isEmpty()) {
            sb.append(replyText.trim());
        }
        if (mediaSent) {
            if (sb.length() > 0) sb.append("\n");
            sb.append("[MEDIA:").append(mediaType != null ? mediaType : "image").append("]");
            if (mediaId != null && !mediaId.trim().isEmpty()) {
                sb.append(" id=").append(mediaId.trim());
            }
            if (imageUrl != null && !imageUrl.trim().isEmpty()) {
                sb.append(" url=").append(imageUrl.trim());
            }
        }
        return sb.toString();
    }

    private String detectMimeType(String url) {
        String lower = url != null ? url.toLowerCase() : "";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".gif")) return "image/gif";
        return "image/jpeg";
    }

    private String extensionFromMime(String mimeType) {
        if ("image/png".equals(mimeType)) return ".png";
        if ("image/webp".equals(mimeType)) return ".webp";
        if ("image/gif".equals(mimeType)) return ".gif";
        return ".jpg";
    }

    private String stripLegacyImageTags(String text) {
        if (text == null) return "";
        return text.replaceAll("\\[IMG:[^\\]]+\\]", "").trim();
    }

    private boolean isHumanFallback(String text) {
        String msg = normalize(text);
        return msg.contains("asesor")
                || msg.contains("humano")
                || msg.contains("persona")
                || msg.contains("agente")
                || msg.contains("hablar con alguien")
                || msg.contains("atiendeme")
                || msg.contains("atiendeme")
                || msg.contains("reclamo")
                || msg.contains("queja")
                || msg.contains("no me entiendes")
                || msg.contains("no entiendes")
                || "stop".equals(msg);
    }

    private String normalize(String text) {
        if (text == null) return "";
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD);
        normalized = normalized.replaceAll("\\p{M}", "");
        return normalized.toLowerCase().trim();
    }

    private boolean containsAny(String text, String... terms) {
        if (text == null) return false;
        for (String term : terms) {
            if (text.contains(normalize(term))) return true;
        }
        return false;
    }

    private void sendSystemAlert(String clientPhone, String text, String ourNumber) {
        WhatsAppMessage alertMessage = new WhatsAppMessage();
        alertMessage.setSender("SYSTEM");
        alertMessage.setReceiver(clientPhone);
        alertMessage.setMessageText(text);
        alertMessage.setTimestamp(LocalDateTime.now());
        alertMessage.setStatus("SENT");
        alertMessage.setWamid("system-alert-" + java.time.Instant.now().toEpochMilli());
        
        messageDao.save(alertMessage);
        
        // Transmitir vía WebSocket
        String last9 = clientPhone.length() >= 9 ? clientPhone.substring(clientPhone.length() - 9) : clientPhone;
        messagingTemplate.convertAndSend("/topic/chat/" + last9, alertMessage);
        messagingTemplate.convertAndSend("/topic/chat/global-updates", alertMessage);
        logger.info("Alerta de sistema transmitida vía WebSocket a /topic/chat/{}", last9);
    }

    private void processStatuses(JsonNode valueNode) {
        JsonNode statusesNode = valueNode.get("statuses");
        if (statusesNode != null && statusesNode.isArray() && statusesNode.size() > 0) {
            for (JsonNode statusNode : statusesNode) {
                String messageId = statusNode.has("id") ? statusNode.get("id").asText() : null;
                String status = statusNode.has("status") ? statusNode.get("status").asText() : null;
                
                if (messageId != null && status != null) {
                    String upperStatus = status.toUpperCase();
                    // 1. Actualizar el estado en la base de datos
                    messageDao.updateStatusByWamid(messageId, upperStatus);
                    logger.info("Notificación de estado procesada: id={}, estado={}", messageId, upperStatus);

                    // 2. Buscar el mensaje y transmitir la actualización en tiempo real por WebSocket
                    messageDao.findByWamid(messageId).ifPresent(msg -> {
                        String clientPhone = msg.getReceiver(); // El destinatario original del mensaje enviado
                        String last9 = clientPhone.length() >= 9 ? clientPhone.substring(clientPhone.length() - 9) : clientPhone;
                        messagingTemplate.convertAndSend("/topic/chat/" + last9, msg);
                        messagingTemplate.convertAndSend("/topic/chat/global-updates", msg);
                        logger.info("Estado de mensaje transmitido vía WebSocket a /topic/chat/{}", last9);
                    });
                }
            }
        }
    }

    private void processExtractedInfo(Contact contact, JsonNode info) {
        try {
            logger.info("Procesando información extraída por la IA para el contacto ID {}: {}", contact.getId(), info);

            // 1. Extraer nombre del cliente si corresponde
            if (info.has("client_name") && !info.get("client_name").isNull()) {
                String clientName = info.get("client_name").asText().trim();
                if (!clientName.isEmpty() && !"null".equalsIgnoreCase(clientName)) {
                    String currentName = (contact.getNombreDisplay() != null ? contact.getNombreDisplay() : "").trim();
                    boolean isGeneric = currentName.isEmpty() 
                        || currentName.toLowerCase().contains("whatsapp") 
                        || currentName.toLowerCase().contains("nuevo")
                        || currentName.length() <= 3;
                    boolean isMoreComplete = clientName.length() > currentName.length() && clientName.contains(" ") && !currentName.contains(" ");
                    
                    if (isGeneric || isMoreComplete) {
                        String firstName = clientName;
                        String lastName = "";
                        int spaceIdx = clientName.indexOf(" ");
                        if (spaceIdx > 0) {
                            firstName = clientName.substring(0, spaceIdx).trim();
                            lastName = clientName.substring(spaceIdx).trim();
                        }
                        jdbcTemplate.update("UPDATE contacts SET nombres = ?, apellidos = ? WHERE id = ?", firstName, lastName, contact.getId());
                        logger.info("Nombre de contacto ID {} actualizado a: {} {}", contact.getId(), firstName, lastName);
                    }
                }
            }

            // 1.1 Extraer DNI del cliente si corresponde
            if (info.has("client_dni") && !info.get("client_dni").isNull()) {
                String clientDni = info.get("client_dni").asText().trim();
                // Limpiar caracteres no numéricos para DNI
                clientDni = clientDni.replaceAll("\\D", "");
                if (clientDni.length() == 8) {
                    jdbcTemplate.update("UPDATE contacts SET numero_documento = ?, tipo_documento = 'DNI' WHERE id = ?", clientDni, contact.getId());
                    logger.info("DNI/Documento de contacto ID {} actualizado a DNI: {}", contact.getId(), clientDni);
                }
            }

            // 2. Extraer dirección
            String district = null;
            String street = null;
            String reference = null;
            if (info.has("address") && !info.get("address").isNull()) {
                JsonNode addr = info.get("address");
                if (addr.has("district") && !addr.get("district").isNull()) district = addr.get("district").asText().trim();
                if (addr.has("street") && !addr.get("street").isNull()) street = addr.get("street").asText().trim();
                if (addr.has("reference") && !addr.get("reference").isNull()) reference = addr.get("reference").asText().trim();
            }

            String resolvedUbigeo = null;
            if (district != null && !district.trim().isEmpty()) {
                try {
                    String cleanDistrict = district.trim().toUpperCase();
                    java.util.List<String> codes = jdbcTemplate.queryForList(
                        "SELECT codigo_ubigeo FROM ubigeo_peru WHERE UPPER(distrito) = ? OR UPPER(distrito) LIKE ? ORDER BY codigo_ubigeo ASC LIMIT 1",
                        String.class,
                        cleanDistrict, "%" + cleanDistrict + "%"
                    );
                    if (!codes.isEmpty()) {
                        resolvedUbigeo = codes.get(0);
                    }
                } catch (Exception e) {
                    logger.warn("Error al intentar resolver ubigeo para distrito {}: {}", district, e.getMessage());
                }
            }

            if ((district != null && !district.isEmpty()) || (street != null && !street.isEmpty())) {
                district = (district == null || "null".equalsIgnoreCase(district)) ? "" : district;
                street = (street == null || "null".equalsIgnoreCase(street)) ? "" : street;
                reference = (reference == null || "null".equalsIgnoreCase(reference)) ? "" : reference;

                // Verificar si ya existe una dirección asociada al contacto
                Integer addrCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM direcciones WHERE id_contacto = ?", Integer.class, contact.getId());
                if (addrCount == null || addrCount == 0) {
                    jdbcTemplate.update("INSERT INTO direcciones (id_contacto, nombre_ubicacion, codigo_ubigeo, direccion_completa, referencia) VALUES (?, 'Entrega', ?, ?, ?)",
                            contact.getId(), resolvedUbigeo, street, reference);
                    logger.info("Dirección de entrega insertada para contacto ID {}: {}, ubigeo={} (Ref: {})", contact.getId(), street, resolvedUbigeo, reference);
                } else {
                    jdbcTemplate.update("UPDATE direcciones SET codigo_ubigeo = COALESCE(?, codigo_ubigeo), direccion_completa = COALESCE(NULLIF(?, ''), direccion_completa), referencia = COALESCE(NULLIF(?, ''), referencia) WHERE id_contacto = ?",
                            resolvedUbigeo, street, reference, contact.getId());
                    logger.info("Dirección de entrega actualizada para contacto ID {}: {}, ubigeo={} (Ref: {})", contact.getId(), street, resolvedUbigeo, reference);
                }

                // Actualizar la columna 'referencia' en 'contacts' para fallback
                String formattedRef = (street + " " + district + " " + reference).trim();
                if (!formattedRef.isEmpty()) {
                    jdbcTemplate.update("UPDATE contacts SET referencia = ? WHERE id = ?", formattedRef, contact.getId());
                }
            }

            // 3. Obtener Oportunidad Activa
            java.util.List<java.util.Map<String, Object>> activeOpps = jdbcTemplate.queryForList(
                "SELECT id, titulo, valor, productos_json, notas FROM oportunidades " +
                "WHERE contacto_id = ? " +
                "  AND etapa_id NOT IN (SELECT id FROM kanban_columnas WHERE es_ganada = true OR es_perdida = true) " +
                "ORDER BY id DESC LIMIT 1",
                contact.getId()
            );

            if (!activeOpps.isEmpty()) {
                java.util.Map<String, Object> opp = activeOpps.get(0);
                Long oppId = ((Number) opp.get("id")).longValue();
                String currentNotas = opp.get("notas") != null ? opp.get("notas").toString() : "";
                String currentProdJson = opp.get("productos_json") != null ? opp.get("productos_json").toString() : "[]";

                // Extraer productos
                if (info.has("products") && info.get("products").isArray() && info.get("products").size() > 0) {
                    JsonNode productsNode = info.get("products");
                    
                    // Cargar productos del catálogo
                    java.util.List<java.util.Map<String, Object>> dbProducts = jdbcTemplate.queryForList("SELECT id, nombre, precio_venta FROM productos WHERE activo = true");
                    
                    // Parsear productos existentes o inicializar lista
                    java.util.List<java.util.Map<String, Object>> mappedProducts = new java.util.ArrayList<>();
                    try {
                        if (currentProdJson != null && !currentProdJson.trim().isEmpty() && !currentProdJson.trim().equals("[]")) {
                            mappedProducts = objectMapper.readValue(currentProdJson, new com.fasterxml.jackson.core.type.TypeReference<java.util.List<java.util.Map<String, Object>>>() {});
                        }
                    } catch (Exception ex) {
                        logger.warn("Error parseando productos_json actual para oportunidad ID {}: {}", oppId, ex.getMessage());
                    }

                    boolean updatedAnyProduct = false;

                    for (JsonNode prodNode : productsNode) {
                        if (!prodNode.has("name") || prodNode.get("name").isNull()) continue;
                        String extProdName = prodNode.get("name").asText().trim().toLowerCase();
                        int extQty = prodNode.has("quantity") ? prodNode.get("quantity").asInt(1) : 1;

                        String extProdNameNorm = normalizeString(extProdName);

                        // Buscar coincidencia en DB
                        java.util.Map<String, Object> matchedDbProd = null;
                        for (java.util.Map<String, Object> dbProd : dbProducts) {
                            String dbProdNameNorm = normalizeString(dbProd.get("nombre").toString());
                            if (dbProdNameNorm.contains(extProdNameNorm) || extProdNameNorm.contains(dbProdNameNorm)) {
                                matchedDbProd = dbProd;
                                break;
                            }
                        }

                        if (matchedDbProd != null) {
                            Long matchedProdId = ((Number) matchedDbProd.get("id")).longValue();
                            String matchedProdName = matchedDbProd.get("nombre").toString();
                            double matchedProdPrice = ((Number) matchedDbProd.get("precio_venta")).doubleValue();

                            // Verificar si ya existe en la oportunidad para actualizar cantidad
                            int existIdx = -1;
                            for (int i = 0; i < mappedProducts.size(); i++) {
                                Number pIdNum = (Number) mappedProducts.get(i).get("id");
                                if (pIdNum != null && pIdNum.longValue() == matchedProdId) {
                                    existIdx = i;
                                    break;
                                }
                            }

                            if (existIdx != -1) {
                                // Reemplazar cantidad (Gemini nos da la cantidad total actual del carrito o última modificación)
                                mappedProducts.get(existIdx).put("cantidad", extQty);
                            } else {
                                // Añadir nuevo
                                java.util.Map<String, Object> newProd = new java.util.HashMap<>();
                                newProd.put("id", matchedProdId);
                                newProd.put("nombre", matchedProdName);
                                newProd.put("precio", matchedProdPrice);
                                newProd.put("cantidad", extQty);
                                mappedProducts.add(newProd);
                            }
                            updatedAnyProduct = true;
                        }
                    }

                    if (updatedAnyProduct) {
                        // Calcular nuevo valor total
                        double newTotalValue = 0.0;
                        for (java.util.Map<String, Object> p : mappedProducts) {
                            double price = ((Number) p.get("precio")).doubleValue();
                            int qty = ((Number) p.get("cantidad")).intValue();
                            newTotalValue += price * qty;
                        }

                        String newProdJson = objectMapper.writeValueAsString(mappedProducts);
                        jdbcTemplate.update("UPDATE oportunidades SET productos_json = ?, valor = ? WHERE id = ?", newProdJson, newTotalValue, oppId);
                        logger.info("Oportunidad ID {} actualizada con productos: {} y total valor: {}", oppId, newProdJson, newTotalValue);
                    }
                }

                // Extraer forma de pago
                if (info.has("payment_method") && !info.get("payment_method").isNull()) {
                    String payMethod = info.get("payment_method").asText().trim();
                    if (!payMethod.isEmpty() && !"null".equalsIgnoreCase(payMethod)) {
                        String cleanPayMethod = payMethod.substring(0, 1).toUpperCase() + payMethod.substring(1).toLowerCase();
                        String payTag = "[Método de Pago: " + cleanPayMethod + "]";
                        if (!currentNotas.contains("[Método de Pago:")) {
                            String newNotas = currentNotas.trim();
                            if (!newNotas.isEmpty()) newNotas += "\n";
                            newNotas += payTag;
                            jdbcTemplate.update("UPDATE oportunidades SET notas = ? WHERE id = ?", newNotas, oppId);
                            logger.info("Oportunidad ID {} actualizada con notas de pago: {}", oppId, payTag);
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Error al procesar la información extraída de la oportunidad:", e);
        }
    }

    private void convertOpportunityToOrder(Long oppId) {
        try {
            // Check if already converted to avoid duplicate orders
            Integer existingCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM pedidos WHERE oportunidad_id = ?",
                Integer.class, oppId
            );
            if (existingCount != null && existingCount > 0) {
                logger.info("La oportunidad ID {} ya fue convertida a pedido anteriormente.", oppId);
                return;
            }

            // Fetch opportunity details
            java.util.Map<String, Object> opp = jdbcTemplate.queryForMap(
                "SELECT titulo, contacto_id, valor, prioridad, notas, productos_json FROM oportunidades WHERE id = ?",
                oppId
            );

            Long contactoId = opp.get("contacto_id") != null ? ((Number) opp.get("contacto_id")).longValue() : null;
            Double total = opp.get("valor") != null ? ((Number) opp.get("valor")).doubleValue() : 0.0;
            String prioridad = opp.get("prioridad") != null ? opp.get("prioridad").toString() : "Media";
            String notas = opp.get("notes") != null ? opp.get("notes").toString() : (opp.get("notas") != null ? opp.get("notas").toString() : "");
            String productosJson = opp.get("productos_json") != null ? opp.get("productos_json").toString() : null;

            // Fetch contact name
            String contactoNombre = "";
            if (contactoId != null) {
                try {
                    contactoNombre = jdbcTemplate.queryForObject(
                        "SELECT COALESCE(razon_social, CONCAT(nombres, ' ', apellidos)) FROM contacts WHERE id = ?",
                        String.class, contactoId
                    );
                } catch (Exception ignored) {}
            }

            // Fetch primary address of contact
            String direccion = null;
            String referencia = null;
            Double latitud = null;
            Double longitud = null;
            String distrito = null;
            if (contactoId != null) {
                try {
                    java.util.List<java.util.Map<String, Object>> addrs = jdbcTemplate.queryForList(
                        "SELECT d.direccion_completa, d.referencia, d.latitud, d.longitud, u.distrito " +
                        "FROM direcciones d " +
                        "LEFT JOIN ubigeo_peru u ON d.codigo_ubigeo = u.codigo_ubigeo " +
                        "WHERE d.id_contacto = ? " +
                        "ORDER BY d.id_direccion ASC LIMIT 1",
                        contactoId
                    );
                    if (!addrs.isEmpty()) {
                        java.util.Map<String, Object> addr = addrs.get(0);
                        direccion = addr.get("direccion_completa") != null ? addr.get("direccion_completa").toString() : null;
                        referencia = addr.get("referencia") != null ? addr.get("referencia").toString() : null;
                        latitud = addr.get("latitud") != null ? ((Number) addr.get("latitud")).doubleValue() : null;
                        longitud = addr.get("longitud") != null ? ((Number) addr.get("longitud")).doubleValue() : null;
                        distrito = addr.get("distrito") != null ? addr.get("distrito").toString() : null;
                    }
                } catch (Exception ignored) {}
            }

            // Generate order number
            String todayStr = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
            java.util.Random random = new java.util.Random();
            int randNum = 1000 + random.nextInt(9000);
            String numeroPedido = "PED-" + todayStr + "-" + randNum;

            // Get initial stage for pedidos
            Integer stageId = null;
            try {
                stageId = jdbcTemplate.queryForObject(
                    "SELECT id FROM etapas_pedido ORDER BY orden ASC LIMIT 1",
                    Integer.class
                );
            } catch (Exception ignored) {}

            // Ensure column exists
            try {
                jdbcTemplate.execute("ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS oportunidad_id BIGINT");
            } catch (Exception ignored) {}

            // Insert the order into pedidos
            jdbcTemplate.update(
                "INSERT INTO pedidos (" +
                "numero_pedido, contacto_id, contacto_persona_nombre, metodo_pago, estado_pago, " +
                "subtotal, igv, total, direccion_entrega, distrito, latitud, longitud, notas, " +
                "fecha_entrega, hora_entrega, prioridad, tipo_envio, etapa_id, oportunidad_id, created_at" +
                ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE, ?, ?, ?, ?, ?, timezone(COALESCE((SELECT value_text FROM system_settings WHERE key_name = 'timezone' LIMIT 1), 'America/Lima'), now()))",
                numeroPedido, contactoId, contactoNombre, "Efectivo", "Pendiente",
                total, 0.0, total, direccion, distrito, latitud, longitud,
                "Creado desde Oportunidad Ganada de forma automática por la IA. " + notas,
                "12:00", prioridad, "Despacho", stageId, oppId
            );

            // Fetch the newly created order ID
            Long newPedidoId = jdbcTemplate.queryForObject(
                "SELECT id FROM pedidos WHERE numero_pedido = ?",
                Long.class, numeroPedido
            );

            // Insert products into pedido_detalles
            if (productosJson != null && !productosJson.trim().isEmpty()) {
                try {
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    java.util.List<?> products = mapper.readValue(productosJson, java.util.List.class);
                    for (Object prodObj : products) {
                        if (prodObj instanceof java.util.Map) {
                            java.util.Map<?, ?> prodMap = (java.util.Map<?, ?>) prodObj;
                            Number prodId = (Number) prodMap.get("id");
                            Number cantidad = (Number) prodMap.get("cantidad");
                            Number precio = (Number) prodMap.get("precio");
                            if (prodId != null && cantidad != null) {
                                jdbcTemplate.update(
                                    "INSERT INTO pedido_detalles (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)",
                                    newPedidoId, prodId.longValue(), cantidad.intValue(), (precio != null ? precio.doubleValue() : 0.0)
                                );
                            }
                        }
                    }
                } catch (Exception e) {
                    logger.error("Error al parsear productos de la oportunidad para convertirlos a pedido:", e);
                }
            }
            logger.info("Oportunidad ID {} convertida exitosamente a Pedido ID {}", oppId, newPedidoId);
        } catch (Exception e) {
            logger.error("Error al convertir oportunidad a pedido de forma automática:", e);
        }
    }

    private String normalizeString(String input) {
        if (input == null) return "";
        try {
            // Normalizar acentos y diacríticos
            String normalized = java.text.Normalizer.normalize(input.toLowerCase().trim(), java.text.Normalizer.Form.NFD);
            normalized = normalized.replaceAll("\\p{M}", "");
            
            // Reemplazar caracteres no alfanuméricos por espacios
            normalized = normalized.replaceAll("[^a-z0-9\\s]", " ");
            
            // Normalizar unidades de volumen (ej: 20 l, 20lts, 20 litros -> 20l)
            normalized = normalized.replaceAll("(\\d+)\\s*(l|litros|litro|lts|lt|trs|tr)\\b", "$1l");
            
            // Colapsar espacios consecutivos
            normalized = normalized.replaceAll("\\s+", " ").trim();
            return normalized;
        } catch (Exception e) {
            return input.toLowerCase().trim();
        }
    }
}

