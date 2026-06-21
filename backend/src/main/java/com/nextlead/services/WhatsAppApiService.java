package com.nextlead.services;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class WhatsAppApiService {

    private static final Logger logger = LoggerFactory.getLogger(WhatsAppApiService.class);

    @Value("${whatsapp.api.token}")
    private String apiToken;

    @Value("${whatsapp.phone.id}")
    private String phoneId;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Envía un mensaje de texto al número especificado usando la API de nube de WhatsApp de Meta.
     */
    public boolean sendMessage(String toPhone, String text) {
        if (apiToken == null || apiToken.contains("YOUR_PERMANENT_WHATSAPP_API_TOKEN") 
            || phoneId == null || phoneId.contains("YOUR_WHATSAPP_PHONE_NUMBER_ID")) {
            logger.warn("Las credenciales de WhatsApp Meta API no están configuradas correctamente. Se omitirá el envío real.");
            return false;
        }

        String url = String.format("https://graph.facebook.com/v18.0/%s/messages", phoneId);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiToken);

            Map<String, Object> body = new HashMap<>();
            body.put("messaging_product", "whatsapp");
            body.put("recipient_type", "individual");
            body.put("to", toPhone);
            body.put("type", "text");

            Map<String, Object> textObj = new HashMap<>();
            textObj.put("preview_url", false);
            textObj.put("body", text);
            body.put("text", textObj);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            logger.info("Enviando WhatsApp a {} vía URL: {}", toPhone, url);
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                logger.info("Mensaje de WhatsApp enviado exitosamente a {}. Respuesta: {}", toPhone, response.getBody());
                return true;
            } else {
                logger.error("Error al enviar mensaje. Código de estado: {}, Respuesta: {}", response.getStatusCode(), response.getBody());
                return false;
            }
        } catch (Exception e) {
            logger.error("Excepción al intentar enviar WhatsApp a {}: {}", toPhone, e.getMessage(), e);
            return false;
        }
    }

    /**
     * Envía un mensaje multimedia de tipo imagen usando el identificador de contenido (Media ID) de Meta.
     */
    public boolean sendImageMessage(String toPhone, String mediaId) {
        if (apiToken == null || apiToken.contains("YOUR_PERMANENT_WHATSAPP_API_TOKEN") 
            || phoneId == null || phoneId.contains("YOUR_WHATSAPP_PHONE_NUMBER_ID")) {
            logger.warn("Las credenciales de WhatsApp Meta API no están configuradas. Se omitirá el envío de imagen.");
            return false;
        }

        String url = String.format("https://graph.facebook.com/v18.0/%s/messages", phoneId);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiToken);

            Map<String, Object> body = new HashMap<>();
            body.put("messaging_product", "whatsapp");
            body.put("recipient_type", "individual");
            body.put("to", toPhone);
            body.put("type", "image");

            Map<String, Object> imageObj = new HashMap<>();
            imageObj.put("id", mediaId);
            body.put("image", imageObj);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            logger.info("Enviando imagen WhatsApp a {} con MediaID: {}", toPhone, mediaId);
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            logger.error("Error al enviar imagen de WhatsApp a {}: {}", toPhone, e.getMessage(), e);
            return false;
        }
    }

    /**
     * Sube un archivo multimedia a los servidores de Meta y obtiene su Media ID único.
     */
    public String uploadMedia(byte[] fileBytes, String filename, String mimeType) {
        if (apiToken == null || apiToken.contains("YOUR_PERMANENT_WHATSAPP_API_TOKEN") 
            || phoneId == null || phoneId.contains("YOUR_WHATSAPP_PHONE_NUMBER_ID")) {
            logger.warn("Las credenciales de WhatsApp Meta API no están configuradas. Se omitirá la subida de multimedia.");
            return null;
        }

        String url = String.format("https://graph.facebook.com/v18.0/%s/media", phoneId);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.setBearerAuth(apiToken);

            LinkedMultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("messaging_product", "whatsapp");
            body.add("type", mimeType);

            // Pasar bytes como ByteArrayResource para simular multipart file upload
            org.springframework.core.io.ByteArrayResource resource = new org.springframework.core.io.ByteArrayResource(fileBytes) {
                @Override
                public String getFilename() {
                    return filename;
                }
            };
            
            HttpHeaders fileHeaders = new HttpHeaders();
            fileHeaders.setContentType(MediaType.parseMediaType(mimeType));
            HttpEntity<org.springframework.core.io.ByteArrayResource> fileEntity = new HttpEntity<>(resource, fileHeaders);
            
            body.add("file", fileEntity);

            HttpEntity<LinkedMultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            logger.info("Subiendo archivo multimedia a Meta: {}, Tipo: {}", filename, mimeType);
            ResponseEntity<JsonNode> response = restTemplate.postForEntity(url, requestEntity, JsonNode.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String mediaId = response.getBody().path("id").asText();
                logger.info("Archivo subido a Meta exitosamente. Media ID: {}", mediaId);
                return mediaId;
            }
        } catch (Exception e) {
            logger.error("Error al subir archivo a Meta: {}", e.getMessage(), e);
        }
        return null;
    }

    /**
     * Descarga un archivo de imagen desde Meta usando el Media ID y lo guarda en /app/uploads/
     * Retorna la ruta relativa local (ejemplo: "/uploads/filename.jpg") o null si falla.
     */
    public String downloadMedia(String mediaId, String mimeType) {
        if (apiToken == null || apiToken.contains("YOUR_PERMANENT_WHATSAPP_API_TOKEN")) {
            logger.warn("Las credenciales de WhatsApp Meta API no están configuradas. Se omitirá la descarga.");
            return null;
        }

        try {
            // 1. Obtener la URL de descarga del objeto multimedia
            String infoUrl = String.format("https://graph.facebook.com/v18.0/%s", mediaId);
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(apiToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            logger.info("Obteniendo información del media {} desde Meta...", mediaId);
            ResponseEntity<JsonNode> infoResponse = restTemplate.exchange(infoUrl, org.springframework.http.HttpMethod.GET, entity, JsonNode.class);

            if (!infoResponse.getStatusCode().is2xxSuccessful() || infoResponse.getBody() == null) {
                logger.error("Error al obtener la información del media: {}", infoResponse.getStatusCode());
                return null;
            }

            JsonNode body = infoResponse.getBody();
            String downloadUrl = body.path("url").asText();
            if (downloadUrl == null || downloadUrl.isEmpty()) {
                logger.error("No se encontró la URL de descarga en la respuesta de Meta");
                return null;
            }

            // 2. Descargar los bytes del archivo
            HttpHeaders downloadHeaders = new HttpHeaders();
            downloadHeaders.setBearerAuth(apiToken);
            downloadHeaders.set("User-Agent", "Mozilla/5.0");
            HttpEntity<Void> downloadEntity = new HttpEntity<>(downloadHeaders);

            logger.info("Descargando bytes desde URL de Meta...");
            ResponseEntity<byte[]> fileResponse = restTemplate.exchange(downloadUrl, org.springframework.http.HttpMethod.GET, downloadEntity, byte[].class);

            if (!fileResponse.getStatusCode().is2xxSuccessful() || fileResponse.getBody() == null) {
                logger.error("Error al descargar los bytes del media: {}", fileResponse.getStatusCode());
                return null;
            }

            byte[] fileBytes = fileResponse.getBody();

            // 3. Determinar extensión y guardar archivo localmente en /app/uploads/
            String extension = ".bin";
            if (mimeType != null) {
                mimeType = mimeType.toLowerCase();
                if (mimeType.contains("image/png")) extension = ".png";
                else if (mimeType.contains("image/jpeg") || mimeType.contains("image/jpg")) extension = ".jpg";
                else if (mimeType.contains("image/gif")) extension = ".gif";
                else if (mimeType.contains("image/webp")) extension = ".webp";
                else if (mimeType.contains("audio/ogg") || mimeType.contains("ogg")) extension = ".ogg";
                else if (mimeType.contains("audio/mp4") || mimeType.contains("audio/m4a")) extension = ".m4a";
                else if (mimeType.contains("audio/mpeg") || mimeType.contains("mp3")) extension = ".mp3";
                else if (mimeType.contains("audio/amr")) extension = ".amr";
                else if (mimeType.contains("video/mp4")) extension = ".mp4";
                else if (mimeType.contains("video/3gpp") || mimeType.contains("3gp")) extension = ".3gp";
                else if (mimeType.contains("application/pdf")) extension = ".pdf";
            }
            
            String filename = "incoming_" + mediaId + "_" + System.currentTimeMillis() + extension;
            String uploadDir = "/app/uploads/";
            java.io.File dir = new java.io.File(uploadDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            java.io.File destFile = new java.io.File(dir, filename);
            java.nio.file.Files.write(destFile.toPath(), fileBytes);

            String localPath = "/uploads/" + filename;
            logger.info("Imagen de Meta descargada y guardada localmente en: {}", localPath);
            return localPath;
        } catch (Exception e) {
            logger.error("Excepción al intentar descargar multimedia desde Meta con ID {}: {}", mediaId, e.getMessage(), e);
        }
        return null;
    }
}
