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
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    public WhatsAppWebhookController(WhatsAppMessageDao messageDao, 
                                     SimpMessagingTemplate messagingTemplate,
                                     WhatsAppApiService apiService,
                                     GeminiService geminiService,
                                     SettingsService settingsService,
                                     ContactDao contactDao,
                                     AiConfigDao aiConfigDao) {
        this.messageDao = messageDao;
        this.messagingTemplate = messagingTemplate;
        this.apiService = apiService;
        this.geminiService = geminiService;
        this.settingsService = settingsService;
        this.contactDao = contactDao;
        this.aiConfigDao = aiConfigDao;
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
                
                // Procesar mensajes de tipo texto, imagen, audio o video
                if ("text".equals(type) || "image".equals(type) || "audio".equals(type) || "video".equals(type)) {
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
                        logger.info("Mensaje transmitido en tiempo real vía WebSocket a {}", destination);

                        // Responder asíncronamente con Gemini para textos y audios. Imágenes/video solo se guardan y muestran en el CRM.
                        if ("text".equals(type) || "audio".equals(type)) {
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
            } else {
                // Fallback defensivo: si Gemini no devolvió JSON, se envía como texto normal.
                replyText = stripLegacyImageTags(aiResponse).trim();
                sendMedia = false;
                mediaType = "image";
                mediaId = null;
                imageUrl = null;
                caption = null;
                needsHuman = false;
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
                }
            }

            if (!mediaSent && replyText != null && !replyText.trim().isEmpty()) {
                wamid = apiService.sendMessage(clientPhone, replyText.trim());
            }

            if (needsHuman) {
                Contact contactToDisable = contact != null ? contact : contactDao.findByPhone(clientPhone).orElse(null);
                if (contactToDisable != null) {
                    contactDao.updateAiActive(contactToDisable.getId(), false);
                    logger.info("IA desactivada para el contacto ID: {} por decisión de Gemini.", contactToDisable.getId());
                }
                sendSystemAlert(clientPhone, "⚠️ *Alerta del Sistema:* Gemini marcó esta conversación para atención humana. Chatbot desactivado para este contacto.", ourNumber);
            }

            String storedMessageText = buildStoredMessageText(replyText, mediaSent, mediaType, imageUrl, mediaId);
            if (storedMessageText == null || storedMessageText.trim().isEmpty()) {
                storedMessageText = aiResponse;
            }

            WhatsAppMessage aiMessage = new WhatsAppMessage();
            aiMessage.setSender(ourNumber);
            aiMessage.setReceiver(clientPhone);
            aiMessage.setMessageText(storedMessageText);
            aiMessage.setTimestamp(LocalDateTime.now());
            aiMessage.setStatus(wamid != null ? "SENT" : "FAILED");
            aiMessage.setWamid(wamid);

            messageDao.save(aiMessage);
            logger.info("Respuesta de la IA guardada y enviada a {} con estado: {}", clientPhone, aiMessage.getStatus());

            String last9 = clientPhone.length() >= 9 ? clientPhone.substring(clientPhone.length() - 9) : clientPhone;
            messagingTemplate.convertAndSend("/topic/chat/" + last9, aiMessage);
            logger.info("Respuesta de la IA transmitida en tiempo real al chat de la pantalla.");

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
                        logger.info("Estado de mensaje transmitido vía WebSocket a /topic/chat/{}", last9);
                    });
                }
            }
        }
    }
}
