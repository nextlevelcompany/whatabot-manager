package com.nextlead.services;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    private static final Logger logger = LoggerFactory.getLogger(GeminiService.class);

    @Value("${gemini.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Genera una respuesta automática basada en el mensaje del cliente usando Gemini 1.5 Flash.
     *
     * @param userMessage Mensaje recibido por el cliente.
     * @return Respuesta generada por la IA.
     */
    public String generateResponse(String userMessage) {
        if (apiKey == null || apiKey.contains("AIzaSyCP-Zl8liO4zwQaP0pP-VPPI0bn_5hxT00")) {
            logger.warn("La API Key de Google Gemini no está configurada. Se omitirá la respuesta de la IA.");
            return null;
        }

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Construir el cuerpo de la solicitud JSON para Gemini API
            Map<String, Object> body = new HashMap<>();
            
            // 1. Instrucciones de comportamiento del sistema (System Prompt)
            Map<String, Object> systemInstruction = new HashMap<>();
            systemInstruction.put("parts", List.of(Map.of(
                "text", "Eres un asistente virtual automatizado para NextLead CRM. " +
                        "Responde de manera muy concisa, amable, directa y en español a las consultas de los clientes. " +
                        "Si el usuario pregunta por precios, horarios u ofertas simples, respóndele amablemente. " +
                        "Si el usuario hace preguntas muy complejas, técnicas o solicita asistencia humana directa, " +
                        "indícale amablemente que has derivado su caso con un asesor especializado de nuestro equipo."
            )));
            body.put("systemInstruction", systemInstruction);

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
                            String responseText = partsNode.get(0).get("text").asText();
                            logger.info("Respuesta de Gemini generada correctamente.");
                            return responseText;
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
