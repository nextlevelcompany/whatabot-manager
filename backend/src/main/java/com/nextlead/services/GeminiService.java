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
import com.nextlead.dao.WhatsAppMessageDao;
import com.nextlead.models.Contact;
import com.nextlead.models.AiProductConfig;
import com.nextlead.models.AiKnowledgeBase;
import com.nextlead.models.ShippingCoverage;
import com.nextlead.models.WhatsAppMessage;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class GeminiService {

    private static final Logger logger = LoggerFactory.getLogger(GeminiService.class);

    private final SettingsService settingsService;
    private final AiConfigDao aiConfigDao;
    private final WhatsAppMessageDao messageDao;
    private final RestTemplate restTemplate = new RestTemplate();

    @Autowired
    public GeminiService(SettingsService settingsService, AiConfigDao aiConfigDao, WhatsAppMessageDao messageDao) {
        this.settingsService = settingsService;
        this.aiConfigDao = aiConfigDao;
        this.messageDao = messageDao;
    }

    private String getApiKey() {
        return settingsService.getSetting("gemini.api.key");
    }

    public String generateResponse(String userMessage) {
        return generateResponse(userMessage, null);
    }

    public String generateResponse(String userMessage, Contact contact) {
        String apiKey = getApiKey();
        logger.info("Usando API Key que empieza con: " + (apiKey != null && apiKey.length() > 6 ? apiKey.substring(0, 6) : "null"));

        if (apiKey == null || apiKey.trim().isEmpty()) {
            logger.warn("La API Key de Google Gemini no está configurada. Se omitirá la respuesta de la IA.");
            return null;
        }

        String model = settingsService.getSetting("gemini.model");
        if (model == null || model.trim().isEmpty()) {
            model = "gemini-1.5-flash";
        }
        logger.info("Usando modelo de Gemini: " + model);
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;

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


            // 2. DETECCIÓN DE INTENCIÓN (Lógica RAG)
            String lowerMessage = userMessage.toLowerCase();
            
            boolean wantsProducts = lowerMessage.contains("precio") || lowerMessage.contains("cuanto") || 
                                     lowerMessage.contains("cuánto") || lowerMessage.contains("vende") || 
                                     lowerMessage.contains("tienen") || lowerMessage.contains("carta") || 
                                     lowerMessage.contains("menu") || lowerMessage.contains("menú") || 
                                     lowerMessage.contains("comprar") || lowerMessage.contains("quiero") || 
                                     lowerMessage.contains("pedido") || lowerMessage.contains("costo") ||
                                     lowerMessage.contains("producto") || lowerMessage.contains("catálogo") ||
                                     lowerMessage.contains("catalogo") || lowerMessage.contains("promocion") ||
                                     lowerMessage.contains("promoción") || lowerMessage.contains("promociones") ||
                                     lowerMessage.contains("oferta") || lowerMessage.contains("ofertas") ||
                                     lowerMessage.contains("informacion") || lowerMessage.contains("información") ||
                                     lowerMessage.contains("info") || lowerMessage.contains("detalle") ||
                                     lowerMessage.contains("detalles") || lowerMessage.contains("paquete") ||
                                     lowerMessage.contains("paquetes");

            boolean wantsDelivery = lowerMessage.contains("envio") || lowerMessage.contains("envío") || 
                                     lowerMessage.contains("delivery") || lowerMessage.contains("cobertura") || 
                                     lowerMessage.contains("donde") || lowerMessage.contains("dónde") ||
                                     lowerMessage.contains("lleg") || lowerMessage.contains("direc") ||
                                     lowerMessage.contains("distrito") || lowerMessage.contains("tarifa");

            // 3. CONSTRUCCIÓN DE CONTEXTO BAJO DEMANDA (RETRIEVAL)
            StringBuilder contextBuilder = new StringBuilder();

            // RAG de Productos: Solo si quiere ver productos o cotizar
            if (wantsProducts) {
                List<AiProductConfig> allAiProducts = aiConfigDao.getAllAiProductsConfig().stream()
                        .filter(p -> p.getAiEnabled() != null && p.getAiEnabled())
                        .collect(Collectors.toList());

                // Filtrar por palabras coincidentes
                List<AiProductConfig> matchedProducts = allAiProducts.stream()
                        .filter(p -> {
                            String name = p.getProductName() != null ? p.getProductName().toLowerCase() : "";
                            String keywords = p.getSearchKeywords() != null ? p.getSearchKeywords().toLowerCase() : "";
                            
                            // Optimización: si el mensaje contiene términos de oferta/promoción, priorizar productos con "pack" o "promo"
                            if (lowerMessage.contains("promo") || lowerMessage.contains("oferta") || 
                                lowerMessage.contains("descuento") || lowerMessage.contains("paquete")) {
                                if (name.contains("pack") || name.contains("promo") || 
                                    keywords.contains("pack") || keywords.contains("promo")) {
                                    return true;
                                }
                            }
                            
                            return name.contains(lowerMessage) || lowerMessage.contains(name) ||
                                   (!keywords.isEmpty() && (keywords.contains(lowerMessage) || lowerMessage.contains(keywords)));
                        })
                        .collect(Collectors.toList());

                // Si no hay coincidencias directas, enviar un máximo de 3 sugerencias destacadas, de lo contrario máximo 5 coincidencias
                List<AiProductConfig> productsToSend = matchedProducts.isEmpty() ? 
                        allAiProducts.stream().limit(3).collect(Collectors.toList()) : 
                        matchedProducts.stream().limit(5).collect(Collectors.toList());

                contextBuilder.append("\n📦 CATÁLOGO DE PRODUCTOS DISPONIBLES:\n");
                for (AiProductConfig prod : productsToSend) {
                    contextBuilder.append(String.format("- %s (Cod: %s) | S/ %s\n", 
                            prod.getProductName(), prod.getProductCode(), prod.getProductPrice()));
                    if (prod.getCustomAiDescription() != null && !prod.getCustomAiDescription().trim().isEmpty()) {
                        contextBuilder.append("  Detalle: ").append(prod.getCustomAiDescription()).append("\n");
                    }
                    if (prod.getProductImage() != null && !prod.getProductImage().trim().isEmpty()) {
                        contextBuilder.append("  Img: http://localhost:8080/api/productos/").append(prod.getProductoId()).append("/imagen\n");
                    }
                }
            } else {
                contextBuilder.append("\n📦 PRODUCTOS: (El cliente no ha solicitado información de productos en este mensaje. Si saluda o pregunta otra cosa, no menciones precios ni productos a menos que te lo pida).\n");
            }

            // RAG de Delivery: Solo si pregunta por costos de envío o cobertura
            if (wantsDelivery) {
                List<ShippingCoverage> allCoverage = aiConfigDao.getAllShippingCoverage().stream()
                        .filter(c -> c.getIsActive() != null && c.getIsActive())
                        .collect(Collectors.toList());

                // Si menciona un distrito específico, filtrar solo ese distrito para ahorrar tokens
                List<ShippingCoverage> matchedCoverage = allCoverage.stream()
                        .filter(cov -> lowerMessage.contains(cov.getDistrictName().toLowerCase()))
                        .collect(Collectors.toList());

                List<ShippingCoverage> coverageToSend = matchedCoverage.isEmpty() ? 
                        allCoverage.stream().limit(5).collect(Collectors.toList()) : matchedCoverage;

                contextBuilder.append("\n📍 COBERTURA Y TARIFAS DE ENVÍO:\n");
                for (ShippingCoverage cov : coverageToSend) {
                    contextBuilder.append(String.format("- %s (Envío: S/ %s, Min. compra: S/ %s)\n",
                            cov.getDistrictName(), cov.getDeliveryFee().toString(), cov.getMinOrderAmount().toString()));
                }
            } else {
                contextBuilder.append("\n📍 DELIVERY: (El cliente no ha consultado sobre delivery. Si pregunta por envíos, pregúntale su distrito para validar cobertura).\n");
            }

            // RAG de FAQs: Búsqueda exacta de preguntas frecuentes (Máximo 3 coincidencias para ahorrar tokens)
            List<AiKnowledgeBase> faqs = aiConfigDao.getAllAiKnowledgeBase();
            StringBuilder faqContext = new StringBuilder();
            boolean foundFaq = false;
            int matchedFaqCount = 0;
            for (AiKnowledgeBase faq : faqs) {
                if (matchedFaqCount >= 3) break;
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
                    faqContext.append(String.format("- Pregunta: %s\n  Respuesta: %s\n", faq.getCategory(), faq.getAnswer()));
                    if ("IMAGE".equalsIgnoreCase(faq.getAttachmentType()) && faq.getAttachmentUrl() != null && !faq.getAttachmentUrl().trim().isEmpty()) {
                        faqContext.append(String.format("  Img: http://localhost:8080/uploads/%s\n", faq.getAttachmentUrl().trim()));
                    }
                    matchedFaqCount++;
                }
            }
            if (foundFaq) {
                contextBuilder.append("\nℹ️ PREGUNTAS FRECUENTES RELEVANTES:\n").append(faqContext.toString());
            }

            // Contexto de cliente simplificado
            StringBuilder customerContextBuilder = new StringBuilder("\n👤 CLIENTE:\n");
            if (contact != null) {
                String clientName = "DESCONOCIDO";
                String typePers = contact.getTipoPersona() != null ? contact.getTipoPersona() : "NATURAL";
                if ("NATURAL".equals(typePers)) {
                    clientName = ((contact.getNombres() != null ? contact.getNombres() : "") + " " +
                                  (contact.getApellidos() != null ? contact.getApellidos() : "")).trim();
                } else {
                    clientName = contact.getRazonSocial() != null ? contact.getRazonSocial().trim() : "DESCONOCIDO";
                }
                customerContextBuilder.append("- Nombre: ").append(clientName).append(" (Registrado)\n");
                if (contact.getReferencia() != null && !contact.getReferencia().trim().isEmpty()) {
                    customerContextBuilder.append("- Dirección: ").append(contact.getReferencia()).append("\n");
                }
            } else {
                customerContextBuilder.append("- Estado: Nuevo cliente (no registrado. Preséntate de forma cordial).\n");
            }

            // 4. ENSAMBLAR PROMPT DEL SISTEMA ULTRA-COMPACTO
            StringBuilder finalSystemPrompt = new StringBuilder();
            finalSystemPrompt.append("Eres ").append(agentName).append(", asesor virtual de: ").append(businessDesc).append("\n")
                    .append("Tono: ").append(tone).append("\n\n")
                    .append("🚨 REGLAS:\n")
                    .append("1. Tu respuesta es SOLO el mensaje final al cliente. NO incluyas razonamiento.\n")
                    .append("2. Sé breve, amigable y escribe en español.\n")
                    .append("3. Para enviar imágenes usa el formato al final de tu respuesta:\n")
                    .append("   [IMG:Nombre|http://localhost:8080/api/productos/ID/imagen|Descripción|Precio]\n\n")
                    .append(customerContextBuilder.toString())
                    .append(contextBuilder.toString());

            if (customRules != null && !customRules.trim().isEmpty()) {
                finalSystemPrompt.append("\n📝 REGLAS DE NEGOCIO:\n").append(customRules);
            }

            logger.info("Prompt RAG Optimizado:\n{}", finalSystemPrompt.toString());

            Map<String, Object> systemInstruction = new HashMap<>();
            systemInstruction.put("parts", List.of(Map.of("text", finalSystemPrompt.toString())));
            body.put("systemInstruction", systemInstruction);

            // 2. Construir el historial de la conversación (Fase 3: memoria de conversación)
            List<Map<String, Object>> contentsList = new java.util.ArrayList<>();
            if (contact != null && contact.getTelefonoPrincipal() != null) {
                List<WhatsAppMessage> history = messageDao.findConversation(contact.getTelefonoPrincipal());
                
                List<WhatsAppMessage> pastMessages = new java.util.ArrayList<>();
                for (WhatsAppMessage msg : history) {
                    if ("SYSTEM".equals(msg.getSender())) continue;
                    
                    // Si es exactamente el mensaje actual, lo omitimos para agregarlo limpiamente al final
                    if (msg.getSender().equals(contact.getTelefonoPrincipal()) && msg.getMessageText().equals(userMessage)) {
                        continue;
                    }
                    pastMessages.add(msg);
                }
                
                // Limitar a los últimos 8 mensajes previos para ahorrar tokens
                int start = Math.max(0, pastMessages.size() - 8);
                for (int i = start; i < pastMessages.size(); i++) {
                    WhatsAppMessage msg = pastMessages.get(i);
                    String role = msg.getSender().equals(contact.getTelefonoPrincipal()) ? "user" : "model";
                    Map<String, Object> part = new HashMap<>();
                    part.put("text", msg.getMessageText());
                    Map<String, Object> contentMap = new HashMap<>();
                    contentMap.put("role", role);
                    contentMap.put("parts", List.of(part));
                    contentsList.add(contentMap);
                }
            }
            
            // Agregar el mensaje actual del cliente (Fase 5: soporte de audio multimodal)
            Map<String, Object> currentContent = new HashMap<>();
            currentContent.put("role", "user");
            
            if (userMessage.startsWith("[AUDIO]")) {
                String localPath = userMessage.substring("[AUDIO]".length()); // /uploads/filename.ogg
                String fullPath = "/app" + localPath; // Ruta absoluta dentro de docker
                try {
                    java.io.File audioFile = new java.io.File(fullPath);
                    if (audioFile.exists()) {
                        byte[] fileBytes = java.nio.file.Files.readAllBytes(audioFile.toPath());
                        String base64Data = java.util.Base64.getEncoder().encodeToString(fileBytes);
                        
                        String mimeType = "audio/ogg";
                        if (localPath.endsWith(".mp3")) mimeType = "audio/mp3";
                        else if (localPath.endsWith(".m4a")) mimeType = "audio/m4a";
                        
                        Map<String, Object> inlineData = new HashMap<>();
                        inlineData.put("mimeType", mimeType);
                        inlineData.put("data", base64Data);
                        
                        Map<String, Object> part = new HashMap<>();
                        part.put("inlineData", inlineData);
                        currentContent.put("parts", List.of(part));
                        
                        logger.info("Enviando audio multimodal a Gemini desde la ruta: " + fullPath);
                    } else {
                        // Fallback a texto si el archivo no existe
                        Map<String, Object> part = new HashMap<>();
                        part.put("text", "El cliente envió un audio pero no se encontró en el disco local.");
                        currentContent.put("parts", List.of(part));
                    }
                } catch (Exception e) {
                    logger.error("Error al codificar audio para Gemini: " + e.getMessage(), e);
                    Map<String, Object> part = new HashMap<>();
                    part.put("text", "El cliente envió un audio pero ocurrió un error al procesarlo.");
                    currentContent.put("parts", List.of(part));
                }
            } else {
                Map<String, Object> currentPart = new HashMap<>();
                currentPart.put("text", userMessage);
                currentContent.put("parts", List.of(currentPart));
            }
            contentsList.add(currentContent);
            
            body.put("contents", contentsList);

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

        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            logger.error("Error HTTP ({}) al consultar Gemini API: {}", e.getStatusCode(), e.getResponseBodyAsString());
            return "ERROR_GEMINI_" + e.getStatusCode().value() + ": " + e.getResponseBodyAsString();
        } catch (Exception e) {
            logger.error("Excepción general al consultar la API de Gemini: {}", e.getMessage(), e);
            return "ERROR_GEMINI_EXCEPTION: " + e.getMessage();
        }
    }
}
