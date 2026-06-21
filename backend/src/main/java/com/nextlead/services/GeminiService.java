package com.nextlead.services;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.nextlead.models.Contact;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    private static final Logger logger = LoggerFactory.getLogger(GeminiService.class);

    private final SettingsService settingsService;
    private final RestTemplate restTemplate = new RestTemplate();

    @Autowired
    public GeminiService(SettingsService settingsService) {
        this.settingsService = settingsService;
    }

    private String getApiKey() {
        return settingsService.getSetting("gemini.api.key");
    }

    /**
     * Genera una respuesta automática basada en el mensaje del cliente usando Gemini.
     *
     * @param userMessage Mensaje recibido por el cliente.
     * @return Respuesta generada por la IA.
     */
    public String generateResponse(String userMessage) {
        return generateResponse(userMessage, null);
    }

    public String generateResponse(String userMessage, Contact contact) {
        String apiKey = getApiKey();

        if (apiKey == null || apiKey.trim().isEmpty()) {
            logger.warn("La API Key de Google Gemini no está configurada. Se omitirá la respuesta de la IA.");
            return null;
        }

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" + apiKey;

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Construir el cuerpo de la solicitud JSON para Gemini API
            Map<String, Object> body = new HashMap<>();
            
            // 1. Instrucciones de comportamiento del sistema (System Prompt)
            String systemPrompt = settingsService.getSetting("gemini.system.prompt");
            if (systemPrompt != null && !systemPrompt.trim().isEmpty()) {
                String clientName = "DESCONOCIDO";
                String phoneVal = "DESCONOCIDO";
                String statusVal = "NO REGISTRADO";

                if (contact != null) {
                    statusVal = "REGISTRADO";
                    phoneVal = contact.getTelefonoPrincipal() != null ? contact.getTelefonoPrincipal() : "DESCONOCIDO";
                    if ("NATURAL".equals(contact.getTipoPersona())) {
                        clientName = (contact.getNombres() != null ? contact.getNombres() : "") 
                                + " " + (contact.getApellidos() != null ? contact.getApellidos() : "");
                        clientName = clientName.trim();
                    } else if ("EMPRESA".equals(contact.getTipoPersona())) {
                        clientName = contact.getRazonSocial() != null ? contact.getRazonSocial().trim() : "DESCONOCIDO";
                    }
                }

                String injectedContext = "CONTEXTO REAL DEL CLIENTE (INYECCIÓN DE SISTEMA):\n"
                        + "- Cliente: " + clientName + "\n"
                        + "- Teléfono: " + phoneVal + "\n"
                        + "- Estado: " + statusVal + "\n"
                        + "- NOTA: No tienes herramientas ni funciones disponibles. NO intentes llamar a 'consultar_nombre_cliente' "
                        + "ni a 'consultar_direccion_cliente'. Ya te estamos dando los datos del cliente aquí. "
                        + "Responde directamente al cliente con texto usando las reglas de formato indicadas abajo.\n\n";

                String fullSystemPrompt = injectedContext + systemPrompt;

                Map<String, Object> systemInstruction = new HashMap<>();
                systemInstruction.put("parts", List.of(Map.of("text", fullSystemPrompt)));
                body.put("systemInstruction", systemInstruction);
            }

            // 2. Contenido del mensaje del usuario
            Map<String, Object> contentPart = new HashMap<>();
            contentPart.put("text", userMessage);
            
            Map<String, Object> content = new HashMap<>();
            content.put("parts", List.of(contentPart));
            body.put("contents", List.of(content));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            logger.info("Enviando consulta a la API de Gemini...");
            JsonNode responseNode = restTemplate.postForObject(url, entity, JsonNode.class);

            // Extraer y validar la respuesta de forma segura con JsonNode
            if (responseNode != null && responseNode.has("candidates")) {
                JsonNode candidates = responseNode.get("candidates");
                if (candidates.isArray() && candidates.size() > 0) {
                    JsonNode contentNode = candidates.get(0).get("content");
                    if (contentNode != null && contentNode.has("parts")) {
                        JsonNode partsNode = contentNode.get("parts");
                        if (partsNode.isArray() && partsNode.size() > 0) {
                            JsonNode textNode = partsNode.get(0).get("text");
                            if (textNode != null) {
                                String responseText = textNode.asText();
                                logger.info("Respuesta de Gemini generada correctamente.");
                                return responseText;
                            } else {
                                logger.warn("El primer part de la respuesta no contiene texto (posible llamada a función o formato inesperado). Respuesta cruda: {}", responseNode);
                            }
                        }
                    }
                }
            }

            logger.warn("La API de Gemini devolvió una estructura vacía o inesperada: {}", responseNode);
            return null;

        } catch (Exception e) {
            logger.error("Excepción al consultar la API de Gemini: {}", e.getMessage(), e);
            return null;
        }
    }
}
