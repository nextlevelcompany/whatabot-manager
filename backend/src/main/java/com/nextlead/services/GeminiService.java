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

import com.nextlead.dao.AiConfigDao;
import com.nextlead.models.Contact;
import com.nextlead.models.AiProductConfig;
import com.nextlead.models.AiKnowledgeBase;
import com.nextlead.models.ShippingCoverage;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class GeminiService {

    private static final Logger logger = LoggerFactory.getLogger(GeminiService.class);

    private final SettingsService settingsService;
    private final AiConfigDao aiConfigDao;
    private final RestTemplate restTemplate = new RestTemplate();

    @Autowired
    public GeminiService(SettingsService settingsService, AiConfigDao aiConfigDao) {
        this.settingsService = settingsService;
        this.aiConfigDao = aiConfigDao;
    }

    private String getApiKey() {
        return settingsService.getSetting("gemini.api.key");
    }

    public String generateResponse(String userMessage) {
        return generateResponse(userMessage, null);
    }

    public String generateResponse(String userMessage, Contact contact) {
        String apiKey = getApiKey();

        if (apiKey == null || apiKey.trim().isEmpty()) {
            logger.warn("La API Key de Google Gemini no está configurada. Se omitirá la respuesta de la IA.");
            return null;
        }

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" + apiKey;

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = new HashMap<>();

            // 1. Obtener configuraciones dinámicas de la base de datos
            String agentName = settingsService.getSetting("ai.agent.name");
            if (agentName == null || agentName.trim().isEmpty()) agentName = "Asesor Comercial";

            String businessDesc = settingsService.getSetting("ai.business.description");
            if (businessDesc == null || businessDesc.trim().isEmpty()) businessDesc = "Venta de productos/servicios";

            String tone = settingsService.getSetting("ai.tone");
            if (tone == null || tone.trim().isEmpty()) tone = "Amigable y cercano";

            String customRules = settingsService.getSetting("gemini.system.prompt");

            // 2. Construir catálogo de productos habilitados para la IA
            List<AiProductConfig> aiProducts = aiConfigDao.getAllAiProductsConfig().stream()
                    .filter(p -> p.getAiEnabled() != null && p.getAiEnabled())
                    .collect(Collectors.toList());

            StringBuilder catalogBuilder = new StringBuilder("\n📦 CATÁLOGO DE PRODUCTOS DISPONIBLES:\n");
            for (AiProductConfig prod : aiProducts) {
                catalogBuilder.append(String.format("- %s (Código: %s) | Precio: S/ %s\n", 
                        prod.getProductName(), prod.getProductCode(), prod.getProductPrice()));
                if (prod.getSearchKeywords() != null && !prod.getSearchKeywords().trim().isEmpty()) {
                    catalogBuilder.append("  Palabras clave: ").append(prod.getSearchKeywords()).append("\n");
                }
                if (prod.getCustomAiDescription() != null && !prod.getCustomAiDescription().trim().isEmpty()) {
                    catalogBuilder.append("  Detalle de venta: ").append(prod.getCustomAiDescription()).append("\n");
                }
                if (prod.getProductImage() != null && !prod.getProductImage().trim().isEmpty()) {
                    catalogBuilder.append("  Imagen: http://localhost:3001/productos/view/").append(prod.getProductImage()).append("\n");
                }
            }

            // 3. Construir lista de zonas de cobertura de despacho
            List<ShippingCoverage> coverageList = aiConfigDao.getAllShippingCoverage().stream()
                    .filter(c -> c.getIsActive() != null && c.getIsActive())
                    .collect(Collectors.toList());

            StringBuilder coverageBuilder = new StringBuilder("\n📍 COBERTURA DE ENVÍO (DELIVERY):\n");
            for (ShippingCoverage cov : coverageList) {
                coverageBuilder.append(String.format("- %s (Costo de envío: S/ %s, Compra mínima: S/ %s)\n",
                        cov.getDistrictName(), cov.getDeliveryFee().toString(), cov.getMinOrderAmount().toString()));
            }

            // 4. Buscar FAQs coincidentes mediante análisis simple de palabras clave del mensaje del usuario
            List<AiKnowledgeBase> faqs = aiConfigDao.getAllAiKnowledgeBase();
            StringBuilder faqsBuilder = new StringBuilder("\nℹ️ INFORMACIÓN Y PREGUNTAS FRECUENTES COINCIDENTES:\n");
            boolean foundFaq = false;
            String lowerMessage = userMessage.toLowerCase();
            for (AiKnowledgeBase faq : faqs) {
                boolean match = false;
                if (faq.getKeywords() != null) {
                    for (String kw : faq.getKeywords().split(",")) {
                        if (!kw.trim().isEmpty() && lowerMessage.contains(kw.trim().toLowerCase())) {
                            match = true;
                            break;
                        }
                    }
                }
                if (match) {
                    foundFaq = true;
                    faqsBuilder.append(String.format("Pregunta/Categoría: %s\nRespuesta: %s\n", faq.getCategory(), faq.getAnswer()));
                    if (faq.getAttachmentUrl() != null && !faq.getAttachmentUrl().trim().isEmpty()) {
                        faqsBuilder.append("Archivo adjunto a enviar (si aplica): ").append(faq.getAttachmentUrl()).append("\n");
                    }
                }
            }
            if (!foundFaq) {
                faqsBuilder.append("(No se encontraron respuestas preconfiguradas específicas para este mensaje. Usa la información general).\n");
            }

            // 5. Reconocimiento de Cliente y Personalización
            StringBuilder customerContextBuilder = new StringBuilder("\n👤 CONTEXTO DEL CLIENTE:\n");
            if (contact != null) {
                String clientName = "DESCONOCIDO";
                String typePers = contact.getTipoPersona() != null ? contact.getTipoPersona() : "NATURAL";
                if ("NATURAL".equals(typePers)) {
                    clientName = ((contact.getNombres() != null ? contact.getNombres() : "") + " " +
                                  (contact.getApellidos() != null ? contact.getApellidos() : "")).trim();
                } else {
                    clientName = contact.getRazonSocial() != null ? contact.getRazonSocial().trim() : "DESCONOCIDO";
                }
                customerContextBuilder.append("- Estado: REGISTRADO (¡Trátalo como un cliente de confianza!)\n")
                                      .append("- Nombre de Cliente: ").append(clientName).append("\n")
                                      .append("- Teléfono: ").append(contact.getTelefonoPrincipal() != null ? contact.getTelefonoPrincipal() : "DESCONOCIDO").append("\n");
                
                if (contact.getReferencia() != null && !contact.getReferencia().trim().isEmpty()) {
                    customerContextBuilder.append("- Dirección guardada: ").append(contact.getReferencia()).append("\n");
                }
            } else {
                customerContextBuilder.append("- Estado: NUEVO CLIENTE (No registrado. Sé cortés, preséntate, y busca registrar su pedido e información básica).\n");
            }

            // 6. Ensamblar prompt completo
            StringBuilder finalSystemPrompt = new StringBuilder();
            finalSystemPrompt.append("Eres ").append(agentName).append(", el asesor virtual inteligente de: ").append(businessDesc).append("\n")
                    .append("Tono de comunicación: ").append(tone).append("\n\n")
                    .append("🚨 REGLAS DE OUTPUT Conversacionales:\n")
                    .append("1. Tu respuesta es SOLO el mensaje final al cliente. NO incluyas razonamiento ni explicaciones.\n")
                    .append("2. Escribe en español de manera concisa y clara.\n")
                    .append("3. Para enviar imágenes de productos, DEBES usar este formato exacto al final de tu mensaje:\n")
                    .append("   [IMG:Nombre|http://localhost:3001/productos/view/Imagen|Descripción|Precio]\n")
                    .append("   (donde Imagen es el nombre del archivo de imagen y Nombre, Descripción, Precio coinciden con el producto).\n\n")
                    .append(customerContextBuilder.toString())
                    .append(catalogBuilder.toString())
                    .append(coverageBuilder.toString())
                    .append(faqsBuilder.toString());

            if (customRules != null && !customRules.trim().isEmpty()) {
                finalSystemPrompt.append("\n📝 REGLAS ADICIONALES DEL NEGOCIO:\n").append(customRules);
            }

            logger.debug("Prompt del Sistema Ensamblado:\n{}", finalSystemPrompt.toString());

            Map<String, Object> systemInstruction = new HashMap<>();
            systemInstruction.put("parts", List.of(Map.of("text", finalSystemPrompt.toString())));
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

        } catch (org.springframework.web.client.HttpClientErrorException.TooManyRequests e) {
            logger.error("Límite de cuota excedido (429) en Gemini API: {}", e.getMessage());
            return "ERROR_GEMINI_429";
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            logger.error("Error HTTP al consultar Gemini API: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            if (e.getStatusCode().value() == 429) {
                return "ERROR_GEMINI_429";
            }
            return "ERROR_GEMINI_GENERAL";
        } catch (Exception e) {
            logger.error("Excepción general al consultar la API de Gemini: {}", e.getMessage(), e);
            return "ERROR_GEMINI_GENERAL";
        }
    }
}
