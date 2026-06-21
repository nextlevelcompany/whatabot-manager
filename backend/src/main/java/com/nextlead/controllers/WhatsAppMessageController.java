package com.nextlead.controllers;

import com.nextlead.dao.WhatsAppMessageDao;
import com.nextlead.models.WhatsAppMessage;
import com.nextlead.services.WhatsAppApiService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
public class WhatsAppMessageController {

    private static final Logger logger = LoggerFactory.getLogger(WhatsAppMessageController.class);

    private final WhatsAppMessageDao messageDao;
    private final WhatsAppApiService apiService;
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public WhatsAppMessageController(WhatsAppMessageDao messageDao, 
                                     WhatsAppApiService apiService, 
                                     SimpMessagingTemplate messagingTemplate) {
        this.messageDao = messageDao;
        this.apiService = apiService;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Envía un mensaje de WhatsApp a un cliente y lo registra en el sistema.
     * Soporta tanto texto plano como imágenes (si el texto inicia con [IMAGE]/uploads/...).
     */
    @PostMapping
    public ResponseEntity<WhatsAppMessage> sendMessage(@RequestBody WhatsAppMessage message) {
        if (message.getTimestamp() == null) {
            message.setTimestamp(LocalDateTime.now());
        }
        
        // Si el número tiene 9 dígitos (local de Perú), le agregamos el prefijo '51'
        String receiverPhone = message.getReceiver();
        if (receiverPhone != null) {
            receiverPhone = receiverPhone.replaceAll("\\D", "");
            if (receiverPhone.length() == 9) {
                receiverPhone = "51" + receiverPhone;
            }
        }
        
        String wamid = null;
        String textContent = message.getMessageText();

        if (textContent != null && (textContent.startsWith("[IMAGE]") || textContent.startsWith("[AUDIO]") 
                || textContent.startsWith("[VIDEO]") || textContent.startsWith("[PDF]") || textContent.startsWith("[FILE]"))) {
            
            // Determinar prefijo y tipo de multimedia
            int prefixLen = 7;
            String mediaType = "document"; // por defecto
            if (textContent.startsWith("[PDF]")) {
                prefixLen = 5;
                mediaType = "document";
            } else if (textContent.startsWith("[IMAGE]")) {
                mediaType = "image";
            } else if (textContent.startsWith("[AUDIO]")) {
                mediaType = "audio";
            } else if (textContent.startsWith("[VIDEO]")) {
                mediaType = "video";
            }
            
            String localPath = textContent.substring(prefixLen); // "/uploads/filename.ext"
            String filename = localPath.substring(localPath.lastIndexOf("/") + 1);
            File file = new File("/app/uploads/", filename);

            if (file.exists()) {
                try {
                    byte[] fileBytes = Files.readAllBytes(file.toPath());
                    String mimeType = getMimeType(filename);
                    
                    // 1. Subir archivo a Meta
                    String mediaId = apiService.uploadMedia(fileBytes, filename, mimeType);
                    
                    if (mediaId != null) {
                        // 2. Enviar el mensaje multimedia con el ID de Meta
                        wamid = apiService.sendMediaMessage(receiverPhone, mediaId, mediaType, filename);
                    }
                } catch (Exception e) {
                    logger.error("Error al leer y subir archivo local a Meta: {}", e.getMessage(), e);
                }
            } else {
                logger.warn("El archivo físico no se encuentra en el servidor: {}", file.getAbsolutePath());
            }
        } else {
            // Mensaje de texto plano estándar
            wamid = apiService.sendMessage(receiverPhone, textContent);
        }
        
        if (wamid != null) {
            message.setStatus("SENT");
            message.setWamid(wamid);
        } else {
            message.setStatus("FAILED");
        }

        // Guardar el mensaje en la base de datos
        messageDao.save(message);

        // Transmitir vía WebSocket al canal de la conversación usando los últimos 9 dígitos
        String last9 = message.getReceiver().length() >= 9 
                ? message.getReceiver().substring(message.getReceiver().length() - 9) 
                : message.getReceiver();
        String destination = "/topic/chat/" + last9;
        messagingTemplate.convertAndSend(destination, message);

        return new ResponseEntity<>(message, HttpStatus.CREATED);
    }

    /**
     * Endpoint para que el frontend suba archivos locales de imagen al servidor CRM.
     */
    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            }

            String uploadDir = "/app/uploads/";
            File dir = new File(uploadDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            // Generar un nombre único de archivo
            String filename = System.currentTimeMillis() + "_" + file.getOriginalFilename().replaceAll("\\s+", "_");
            File destFile = new File(dir, filename);
            file.transferTo(destFile);

            String localPath = "/uploads/" + filename;
            logger.info("Archivo local subido al servidor: {}", localPath);
            return new ResponseEntity<>(Map.of("url", localPath), HttpStatus.OK);
        } catch (Exception e) {
            logger.error("Error al subir archivo local en el backend: {}", e.getMessage(), e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping
    public ResponseEntity<List<WhatsAppMessage>> getAllMessages() {
        List<WhatsAppMessage> messages = messageDao.findAll();
        return new ResponseEntity<>(messages, HttpStatus.OK);
    }

    @GetMapping("/sender/{sender}")
    public ResponseEntity<List<WhatsAppMessage>> getMessagesBySender(@PathVariable String sender) {
        List<WhatsAppMessage> messages = messageDao.findBySender(sender);
        return new ResponseEntity<>(messages, HttpStatus.OK);
    }

    /**
     * Obtiene el historial de mensajes de conversación con un número de teléfono específico.
     */
    @GetMapping("/conversation/{phone}")
    public ResponseEntity<List<WhatsAppMessage>> getConversation(@PathVariable String phone) {
        List<WhatsAppMessage> messages = messageDao.findConversation(phone);
        return new ResponseEntity<>(messages, HttpStatus.OK);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Void> updateMessageStatus(@PathVariable Long id, @RequestParam String status) {
        messageDao.updateStatus(id, status);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMessage(@PathVariable Long id) {
        messageDao.delete(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    private String getMimeType(String filename) {
        String name = filename.toLowerCase();
        if (name.endsWith(".png")) return "image/png";
        if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
        if (name.endsWith(".gif")) return "image/gif";
        if (name.endsWith(".webp")) return "image/webp";
        if (name.endsWith(".ogg")) return "audio/ogg";
        if (name.endsWith(".mp3")) return "audio/mpeg";
        if (name.endsWith(".m4a") || name.endsWith(".mp4a")) return "audio/mp4";
        if (name.endsWith(".amr")) return "audio/amr";
        if (name.endsWith(".mp4")) return "video/mp4";
        if (name.endsWith(".3gp")) return "video/3gpp";
        if (name.endsWith(".pdf")) return "application/pdf";
        if (name.endsWith(".doc") || name.endsWith(".docx")) return "application/msword";
        if (name.endsWith(".xls") || name.endsWith(".xlsx")) return "application/vnd.ms-excel";
        if (name.endsWith(".txt")) return "text/plain";
        return "application/octet-stream";
    }
}
