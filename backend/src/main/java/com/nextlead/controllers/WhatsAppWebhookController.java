package com.nextlead.controllers;

import com.fasterxml.jackson.databind.JsonNode;
import com.nextlead.dao.WhatsAppMessageDao;
import com.nextlead.dao.ContactDao;
import com.nextlead.models.WhatsAppMessage;
import com.nextlead.models.Contact;
import com.nextlead.services.GeminiService;
import com.nextlead.services.WhatsAppApiService;
import com.nextlead.services.SettingsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

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

    @Autowired
    public WhatsAppWebhookController(WhatsAppMessageDao messageDao, 
                                     SimpMessagingTemplate messagingTemplate,
                                     WhatsAppApiService apiService,
                                     GeminiService geminiService,
                                     SettingsService settingsService,
                                     ContactDao contactDao) {
        this.messageDao = messageDao;
        this.messagingTemplate = messagingTemplate;
        this.apiService = apiService;
        this.geminiService = geminiService;
        this.settingsService = settingsService;
        this.contactDao = contactDao;
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

                        // Responder asíncronamente con la Inteligencia Artificial de Gemini (solo para textos, no imágenes)
                        if ("text".equals(type)) {
                            // Obtener el contacto para verificar su configuración individual
                            Optional<Contact> contactOpt = contactDao.findByPhone(fromPhone);
                            
                            // Verificar palabras clave para derivación a humano (humanFallback)
                            String cleanText = textBody.trim().toLowerCase();
                            boolean isHumanFallback = cleanText.matches("^(humano|persona|ayuda|stop|asesor|agente|hablar con alguien)$");

                            if (isHumanFallback) {
                                logger.info("Palabra clave de derivación detectada para {}: '{}'", fromPhone, cleanText);
                                
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
            
            // 1. Obtener datos del contacto e inyectar contexto
            Contact contact = contactDao.findByPhone(clientPhone).orElse(null);

            // 2. Llamar a la API de Gemini
            String aiResponse = geminiService.generateResponse(clientMessage, contact);

            // Verificar códigos de error de la API
            if (aiResponse != null && aiResponse.startsWith("ERROR_GEMINI_")) {
                String errorDetails = aiResponse.substring("ERROR_GEMINI_".length());
                String userFriendlyAlert = "⚠️ *Alerta del Sistema:* Ocurrió un error al conectar con Gemini API.\n\n*Detalles del error:* `" + errorDetails + "`";
                sendSystemAlert(clientPhone, userFriendlyAlert, ourNumber);
                return;
            } else if (aiResponse == null || aiResponse.trim().isEmpty()) {
                sendSystemAlert(clientPhone, "⚠️ *Alerta del Sistema:* El Agente de IA no devolvió ninguna respuesta (respuesta vacía).", ourNumber);
                return;
            }
            
            String cleanedResponse = aiResponse;
            String mediaId = null;
            
            // Patrón para buscar: [IMG:Nombre|URL|Descripción|Precio] o [IMG:Nombre|URL]
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\[IMG:([^\\]|]+)\\|([^\\]|\\s]+)[^\\]]*\\]");
            java.util.regex.Matcher matcher = pattern.matcher(aiResponse);
            
            if (matcher.find()) {
                String imgName = matcher.group(1);
                String imgUrl = matcher.group(2);
                
                logger.info("Etiqueta [IMG] detectada. Nombre: {}, URL: {}", imgName, imgUrl);
                
                // Remover la etiqueta del mensaje de texto final
                cleanedResponse = matcher.replaceAll("").trim();
                
                // Descargar y subir la imagen a Meta
                byte[] imgBytes = getImageBytes(imgUrl);
                if (imgBytes != null && imgBytes.length > 0) {
                    String mimeType = "image/jpeg";
                    if (imgUrl.toLowerCase().endsWith(".png")) mimeType = "image/png";
                    else if (imgUrl.toLowerCase().endsWith(".webp")) mimeType = "image/webp";
                    
                    mediaId = apiService.uploadMedia(imgBytes, imgName + ".jpg", mimeType);
                }
            }
            
            // Enviar respuesta real vía WhatsApp (si quedó texto disponible)
            String wamid = null;
            if (!cleanedResponse.isEmpty()) {
                wamid = apiService.sendMessage(clientPhone, cleanedResponse);
            }
            
            // Si detectamos una imagen y la subimos correctamente, la enviamos al cliente
            if (mediaId != null) {
                String imgWamid = apiService.sendMediaMessage(clientPhone, mediaId, "image", null);
                if (wamid == null) {
                    wamid = imgWamid;
                }
            }
            
            // Guardar la respuesta de la IA en la Base de Datos
            WhatsAppMessage aiMessage = new WhatsAppMessage();
            aiMessage.setSender(ourNumber); // El CRM envía
            aiMessage.setReceiver(clientPhone); // El cliente recibe
            aiMessage.setMessageText(aiResponse);
            aiMessage.setTimestamp(LocalDateTime.now());
            aiMessage.setStatus(wamid != null ? "SENT" : "FAILED");
            aiMessage.setWamid(wamid);
            
            messageDao.save(aiMessage);
            logger.info("Respuesta de la IA guardada y enviada a {} con estado: {}", clientPhone, aiMessage.getStatus());

            // Transmitir respuesta de la IA vía WebSocket usando los últimos 9 dígitos
            String last9 = clientPhone.length() >= 9 ? clientPhone.substring(clientPhone.length() - 9) : clientPhone;
            messagingTemplate.convertAndSend("/topic/chat/" + last9, aiMessage);
            logger.info("Respuesta de la IA transmitida en tiempo real al chat de la pantalla.");

            // Si Meta falló al enviar el mensaje de WhatsApp
            if (wamid == null) {
                sendSystemAlert(clientPhone, "⚠️ *Alerta del Sistema:* Meta WhatsApp API no pudo enviar el mensaje. Verifica tu saldo de Meta Cloud, vigencia del Token o que el número sea válido.", ourNumber);
            }

        } catch (Exception e) {
            logger.error("Error al procesar la respuesta automática de la IA: {}", e.getMessage(), e);
            sendSystemAlert(clientPhone, "⚠️ *Alerta del Sistema:* Error al procesar la IA: " + e.getMessage(), ourNumber);
        }
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
