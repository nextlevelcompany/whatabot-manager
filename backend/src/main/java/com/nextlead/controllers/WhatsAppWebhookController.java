package com.nextlead.controllers;

import com.fasterxml.jackson.databind.JsonNode;
import com.nextlead.dao.WhatsAppMessageDao;
import com.nextlead.models.WhatsAppMessage;
import com.nextlead.services.GeminiService;
import com.nextlead.services.WhatsAppApiService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/whatsapp/webhook")
public class WhatsAppWebhookController {

    private static final Logger logger = LoggerFactory.getLogger(WhatsAppWebhookController.class);

    @Value("${whatsapp.verify.token}")
    private String verifyToken;

    @Value("${whatsapp.display.number}")
    private String displayPhoneNumber;

    private final WhatsAppMessageDao messageDao;
    private final SimpMessagingTemplate messagingTemplate;
    private final WhatsAppApiService apiService;
    private final GeminiService geminiService;

    @Autowired
    public WhatsAppWebhookController(WhatsAppMessageDao messageDao, 
                                     SimpMessagingTemplate messagingTemplate,
                                     WhatsAppApiService apiService,
                                     GeminiService geminiService) {
        this.messageDao = messageDao;
        this.messagingTemplate = messagingTemplate;
        this.apiService = apiService;
        this.geminiService = geminiService;
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

        if ("subscribe".equals(mode) && verifyToken.equals(token)) {
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
                    : displayPhoneNumber;

            for (JsonNode messageNode : messagesNode) {
                String type = messageNode.has("type") ? messageNode.get("type").asText() : "";
                
                // Procesar mensajes de tipo texto, imagen, audio o video
                if ("text".equals(type) || "image".equals(type) || "audio".equals(type) || "video".equals(type)) {
                    String fromPhone = messageNode.has("from") ? messageNode.get("from").asText() : null;
                    long unixTime = messageNode.has("timestamp") ? messageNode.get("timestamp").asLong() : Instant.now().getEpochSecond();
                    String textBody = "";

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

                        messageDao.save(message);
                        logger.info("Guardado mensaje de WhatsApp recibido desde {} : {}", fromPhone, textBody);

                        // Transmitir vía WebSocket al canal correspondiente de este cliente (últimos 9 dígitos)
                        String last9 = fromPhone.length() >= 9 ? fromPhone.substring(fromPhone.length() - 9) : fromPhone;
                        String destination = "/topic/chat/" + last9;
                        messagingTemplate.convertAndSend(destination, message);
                        logger.info("Mensaje transmitido en tiempo real vía WebSocket a {}", destination);

                        // Responder asíncronamente con la Inteligencia Artificial de Gemini (solo para textos, no imágenes)
                        if ("text".equals(type)) {
                            final String cleanFromPhone = fromPhone;
                            final String cleanTextBody = textBody;
                            final String cleanOurNumber = ourNumber;
                            
                            CompletableFuture.runAsync(() -> {
                                respondWithAI(cleanFromPhone, cleanTextBody, cleanOurNumber);
                            });
                        }
                    }
                }
            }
        }
    }

    /**
     * Lógica asíncrona para consultar a la IA y responder al cliente en segundo plano.
     */
    private void respondWithAI(String clientPhone, String clientMessage, String ourNumber) {
        try {
            logger.info("Iniciando procesamiento de respuesta automática de IA para el contacto: {}", clientPhone);
            
            // 1. Llamar a la API de Gemini
            String aiResponse = geminiService.generateResponse(clientMessage);
            
            // 2. Si la IA generó una respuesta y la clave de la API está configurada
            if (aiResponse != null && !aiResponse.trim().isEmpty()) {
                // Enviar respuesta real vía WhatsApp (requiere el número completo con código de país)
                String wamid = apiService.sendMessage(clientPhone, aiResponse);
                
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
            }
        } catch (Exception e) {
            logger.error("Error al procesar la respuesta automática de la IA: {}", e.getMessage(), e);
        }
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
