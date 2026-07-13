package com.nextlead.wspai.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.nextlead.wspai.dao.AiConfigDao;
import com.nextlead.wspai.dao.WhatsAppMessageDao;
import com.nextlead.services.SettingsService;
import com.nextlead.models.Contact;
import com.nextlead.wspai.model.AiProductConfig;
import com.nextlead.wspai.model.AiKnowledgeBase;
import com.nextlead.wspai.model.ShippingCoverage;
import com.nextlead.wspai.model.WhatsAppMessage;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
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

    /**
     * Genera una DECISIÓN estructurada en JSON para que el backend ejecute texto/media.
     * No devuelve texto libre salvo que Gemini falle y devuelva un error controlado.
     */
    public String generateResponse(String userMessage, Contact contact) {
        String apiKey = getApiKey();

        if (apiKey == null || apiKey.trim().isEmpty()) {
            logger.warn("La API Key de Google Gemini no está configurada. Se omitirá la respuesta de la IA.");
            return null;
        }

        String model = settingsService.getSetting("gemini.model");
        if (model == null || model.trim().isEmpty()) {
            model = "gemini-1.5-flash";
        }
        logger.info("Usando modelo de Gemini: {}", model);
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = new HashMap<>();

            String agentName = settingsService.getSetting("ai.agent.name");
            if (agentName == null || agentName.trim().isEmpty()) agentName = "Asesor Comercial";

            String businessDesc = settingsService.getSetting("ai.business.description");
            if (businessDesc == null || businessDesc.trim().isEmpty()) businessDesc = "Venta de productos/servicios";

            String tone = settingsService.getSetting("ai.tone");
            if (tone == null || tone.trim().isEmpty()) tone = "Amigable y cercano";
            String customRules = buildSystemPromptRules();
            String normalizedMessage = normalize(userMessage);

            boolean wantsProducts = containsAny(normalizedMessage,
                    "precio", "cuanto", "vende", "tienen", "carta", "menu", "comprar", "quiero",
                    "pedido", "costo", "producto", "catalogo", "promocion", "promociones", "promo",
                    "oferta", "ofertas", "informacion", "info", "detalle", "detalles", "paquete",
                    "paquetes", "pack", "bidon", "recarga", "agua");

            boolean wantsDelivery = containsAny(normalizedMessage,
                    "envio", "delivery", "cobertura", "donde", "lleg", "direccion", "direc",
                    "distrito", "tarifa", "reparto", "envian", "entregan");
            String publicBaseUrl = getPublicBaseUrl();
            StringBuilder contextBuilder = new StringBuilder();

            appendProductContext(contextBuilder, normalizedMessage, publicBaseUrl);
            appendDeliveryContext(contextBuilder, normalizedMessage, wantsDelivery);
            appendFaqContext(contextBuilder, normalizedMessage, publicBaseUrl);

            StringBuilder customerContextBuilder = new StringBuilder("\nCLIENTE:\n");
            boolean isFullyRegistered = contact != null && 
                                        ((contact.getDirecciones() != null && !contact.getDirecciones().isEmpty()) || 
                                         (contact.getReferencia() != null && !contact.getReferencia().trim().isEmpty()));

            if (isFullyRegistered) {
                String clientName = "DESCONOCIDO";
                String typePers = contact.getTipoPersona() != null ? contact.getTipoPersona() : "NATURAL";
                if ("NATURAL".equals(typePers)) {
                    clientName = ((contact.getNombres() != null ? contact.getNombres() : "") + " " +
                                  (contact.getApellidos() != null ? contact.getApellidos() : "")).trim();
                } else {
                    clientName = contact.getRazonSocial() != null ? contact.getRazonSocial().trim() : "DESCONOCIDO";
                }
                customerContextBuilder.append("- Nombre: ").append(emptyToDefault(clientName, "DESCONOCIDO")).append(" (Registrado)\n");
                
                if (contact.getDirecciones() != null && !contact.getDirecciones().isEmpty()) {
                    customerContextBuilder.append("- Direcciones del Cliente:\n");
                    for (com.nextlead.models.Direccion dir : contact.getDirecciones()) {
                        String fullAddr = (dir.getDireccionCompleta() != null ? dir.getDireccionCompleta() : "").trim();
                        String dist = (dir.getDistrito() != null ? dir.getDistrito() : "").trim();
                        String ref = (dir.getReferencia() != null ? dir.getReferencia() : "").trim();
                        
                        customerContextBuilder.append("  * Dirección: ").append(fullAddr.isEmpty() ? "No registrada" : fullAddr).append("\n");
                        customerContextBuilder.append("    Distrito: ").append(dist.isEmpty() ? "No registrado" : dist).append("\n");
                        if (!ref.isEmpty()) {
                            customerContextBuilder.append("    Referencia: ").append(ref).append("\n");
                        }
                        if (dir.getLatitud() != null && dir.getLongitud() != null) {
                            customerContextBuilder.append("    Google Maps URL: https://www.google.com/maps?q=").append(dir.getLatitud()).append(",").append(dir.getLongitud()).append("\n");
                        } else {
                            customerContextBuilder.append("    Google Maps URL: No disponible\n");
                        }
                    }
                } else if (contact.getReferencia() != null && !contact.getReferencia().trim().isEmpty()) {
                    customerContextBuilder.append("- Dirección registrada: ").append(contact.getReferencia()).append("\n");
                }
            } else {
                String clientName = "DESCONOCIDO";
                if (contact != null) {
                    String typePers = contact.getTipoPersona() != null ? contact.getTipoPersona() : "NATURAL";
                    if ("NATURAL".equals(typePers)) {
                        clientName = ((contact.getNombres() != null ? contact.getNombres() : "") + " " +
                                      (contact.getApellidos() != null ? contact.getApellidos() : "")).trim();
                    } else {
                        clientName = contact.getRazonSocial() != null ? contact.getRazonSocial().trim() : "DESCONOCIDO";
                    }
                }
                customerContextBuilder.append("- Nombre: ").append(emptyToDefault(clientName, "DESCONOCIDO")).append("\n");
                customerContextBuilder.append("- Estado: Nuevo cliente. Preséntate de forma cordial si corresponde.\n");
            }

            StringBuilder finalSystemPrompt = new StringBuilder();
            finalSystemPrompt.append("Eres ").append(agentName).append(", asesor virtual de: ").append(businessDesc).append("\n")
                    .append("Tono: ").append(tone).append("\n\n")
                    .append("REGLAS OBLIGATORIAS:\n")
                    .append("1. Devuelve únicamente JSON válido. No uses markdown. No agregues texto fuera del JSON.\n")
                    .append("2. No inventes precios, productos, promociones, imágenes, zonas ni condiciones. Usa solo el contexto disponible.\n")
                    .append("3. Responde breve, natural y comercial en español peruano.\n")
                    .append("4. Para enviar una imagen, coloca send_media=true solo si el contexto trae media_id_whatsapp o image_url.\n")
                    .append("5. Si hay media_id_whatsapp, úsalo como media_id. Si no hay media_id_whatsapp pero sí image_url, usa image_url.\n")
                    .append("6. Si el cliente quiere comprar, solicita solo los datos faltantes: nombre, distrito, dirección, referencia, producto, cantidad y forma de pago. Si el cliente corrige o actualiza la cantidad de un producto solicitado anteriormente (por ejemplo, 'mejor 4' o 'cambia a 3'), actualiza el carrito modificando la cantidad de dicho producto y muestra el total actualizado.\n")
                    .append("7. Si el cliente pide asesor, reclama o indica que no entiende, marca needs_human=true.\n")
                    .append("8. No repitas todo el catálogo si el cliente no lo pidió.\n")
                    .append("9. No uses etiquetas [IMG]. El backend enviará la imagen según el JSON.\n")
                    .append("10. Si falta información, formula una pregunta concreta.\n")
                    .append("11. El campo \"next_state\" debe ser muy corto (máximo 3 palabras o vacío). OBLIGATORIAMENTE coloca \"pedido_confirmado\" en \"next_state\" si el cliente está confirmando su pedido final y ya se tienen todos los datos requeridos (productos, dirección y forma de pago).\n")
                    .append("12. Si el cliente ya tiene una dirección registrada en su contexto (debajo de 'Direcciones del Cliente'), reemplaza OBLIGATORIAMENTE los marcadores '[Dirección guardada]', '[Distrito guardado]' y '[URL Google Maps guardada]' del flujo por la dirección, distrito y coordenadas de Google Maps reales del cliente. Si no cuenta con coordenadas de Google Maps, omite esa línea.\n\n")
                    .append("FORMATO JSON OBLIGATORIO:\n")
                    .append("{\n")
                    .append("  \"intent\": \"saludo|producto|promocion|delivery|pedido|faq|reclamo|humano|desconocido\",\n")
                    .append("  \"reply_text\": \"mensaje principal para el cliente\",\n")
                    .append("  \"send_media\": false,\n")
                    .append("  \"media_type\": null,\n")
                    .append("  \"media_id\": null,\n")
                    .append("  \"image_url\": null,\n")
                    .append("  \"caption\": null,\n")
                    .append("  \"buttons\": [],\n")
                    .append("  \"next_state\": \"\",\n")
                    .append("  \"needs_human\": false,\n")
                    .append("  \"extracted_info\": {\n")
                    .append("     \"client_name\": \"Nombre completo del cliente (solo si lo mencionó explícitamente)\",\n")
                    .append("     \"client_dni\": \"Número de DNI (8 dígitos) o documento de identidad del cliente (solo si lo mencionó explícitamente)\",\n")
                    .append("     \"products\": [\n")
                    .append("        { \"name\": \"Nombre del producto del catálogo que desea ordenar\", \"quantity\": 1 }\n")
                    .append("     ],\n")
                    .append("     \"address\": {\n")
                    .append("        \"district\": \"Nombre del distrito en Lima/Arequipa/etc. que indicó para la entrega\",\n")
                    .append("        \"street\": \"Calle, avenida, jirón y número indicado para la entrega\",\n")
                    .append("        \"reference\": \"Referencia física o indicación de cómo llegar a su domicilio\"\n")
                    .append("     },\n")
                    .append("     \"payment_method\": \"Método de pago elegido (yape|plin|efectivo|transferencia)\"\n")
                    .append("  }\n")
                    .append("}\n")
                    .append("Nota: Si el cliente no indicó o no actualizó ningún dato de 'extracted_info' en su mensaje, pon el campo 'extracted_info' como null. Si indicó solo parte de los datos (por ejemplo, solo los productos, o solo la dirección de entrega), llena únicamente esos campos dentro de 'extracted_info' y deja los demás como null.\n\n")
                    .append(customerContextBuilder)
                    .append(contextBuilder);
            if (customRules != null && !customRules.trim().isEmpty()) {
                finalSystemPrompt.append("\nREGLAS DE NEGOCIO ADICIONALES:\n").append(customRules).append("\n");
            }

            logger.info("Prompt RAG estructurado preparado. Longitud: {} caracteres", finalSystemPrompt.length());

            Map<String, Object> systemInstruction = new HashMap<>();
            systemInstruction.put("parts", List.of(Map.of("text", finalSystemPrompt.toString())));
            body.put("systemInstruction", systemInstruction);

            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.35);
            generationConfig.put("topP", 0.85);
            generationConfig.put("maxOutputTokens", 4000);
            generationConfig.put("responseMimeType", "application/json");
            generationConfig.put("responseSchema", buildResponseSchema());
            body.put("generationConfig", generationConfig);

            List<Map<String, Object>> contentsList = buildConversationContents(userMessage, contact);
            body.put("contents", contentsList);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            try {
                logger.info("Cuerpo de solicitud Gemini: {}", new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(body));
            } catch (Exception e) {
                logger.error("Error al loguear cuerpo de solicitud: {}", e.getMessage());
            }

            logger.info("Enviando consulta a Gemini API...");
            JsonNode responseNode = executeGeminiRequestWithRetry(url, entity);
            logger.info("Respuesta cruda de Gemini: {}", responseNode);

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
                                logger.info("Decisión JSON de Gemini generada correctamente: {}", responseText);
                                return responseText;
                            }
                        }
                    }
                }
            }

            logger.warn("Gemini devolvió una estructura vacía o inesperada: {}", responseNode);
            return null;

        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            logger.error("Error HTTP ({}) al consultar Gemini API: {}", e.getStatusCode(), e.getResponseBodyAsString());
            return "ERROR_GEMINI_" + e.getStatusCode().value() + ": " + e.getResponseBodyAsString();
        } catch (Exception e) {
            logger.error("Excepción general al consultar Gemini API: {}", e.getMessage(), e);
            return "ERROR_GEMINI_EXCEPTION: " + e.getMessage();
        }
    }

    private void appendProductContext(StringBuilder contextBuilder, String normalizedMessage, String publicBaseUrl) {
        List<AiProductConfig> allAiProducts = aiConfigDao.getAllAiProductsConfig().stream()
                .filter(p -> p.getAiEnabled() != null && p.getAiEnabled())
                .sorted(Comparator.comparing(p -> p.getPriority() == null ? 100 : p.getPriority()))
                .collect(Collectors.toList());

        contextBuilder.append("\nCATÁLOGO/PRODUCTOS RELEVANTES:\n");
        if (allAiProducts.isEmpty()) {
            contextBuilder.append("- No hay productos activos para IA.\n");
            return;
        }

        for (AiProductConfig prod : allAiProducts) {
            contextBuilder.append("- nombre: ").append(nullSafe(prod.getProductName())).append("\n")
                    .append("  codigo: ").append(nullSafe(prod.getProductCode())).append("\n")
                    .append("  precio: S/ ").append(nullSafe(prod.getProductPrice())).append("\n")
                    .append("  intent: ").append(nullSafe(prod.getIntent())).append("\n")
                    .append("  keywords: ").append(nullSafe(prod.getSearchKeywords())).append("\n");

            if (prod.getCustomAiDescription() != null && !prod.getCustomAiDescription().trim().isEmpty()) {
                contextBuilder.append("  descripcion_venta: ").append(prod.getCustomAiDescription().trim()).append("\n");
            }
            if (prod.getMediaIdWhatsapp() != null && !prod.getMediaIdWhatsapp().trim().isEmpty()) {
                contextBuilder.append("  media_id_whatsapp: ").append(prod.getMediaIdWhatsapp().trim()).append("\n");
            }
            if (prod.getImageCaption() != null && !prod.getImageCaption().trim().isEmpty()) {
                contextBuilder.append("  caption_sugerido: ").append(prod.getImageCaption().trim()).append("\n");
            }
            if (prod.getProductImage() != null && !prod.getProductImage().trim().isEmpty()) {
                contextBuilder.append("  image_url: ").append(buildProductImageUrl(publicBaseUrl, prod)).append("\n");
            }
            contextBuilder.append("\n");
        }
    }

    private void appendDeliveryContext(StringBuilder contextBuilder, String normalizedMessage, boolean wantsDelivery) {
        List<ShippingCoverage> allCoverage = aiConfigDao.getAllShippingCoverage().stream()
                .filter(c -> c.getIsActive() != null && c.getIsActive())
                .collect(Collectors.toList());

        List<ShippingCoverage> matchedCoverage = allCoverage.stream()
                .filter(c -> containsAny(normalizedMessage, c.getDistrictName()) || 
                             (c.getAliases() != null && containsAny(normalizedMessage, c.getAliases().split(","))))
                .collect(Collectors.toList());

        List<ShippingCoverage> coverageToSend = (wantsDelivery && !matchedCoverage.isEmpty()) 
                ? matchedCoverage.stream().limit(10).collect(Collectors.toList())
                : allCoverage.stream().limit(10).collect(Collectors.toList());

        contextBuilder.append("\nCOBERTURA Y TARIFAS DE ENVÍO:\n");
        if (coverageToSend.isEmpty()) {
            contextBuilder.append("- No hay zonas activas configuradas.\n");
            return;
        }

        for (ShippingCoverage cov : coverageToSend) {
            contextBuilder.append("- distrito: ").append(nullSafe(cov.getDistrictName()))
                    .append(" | envio: S/ ").append(cov.getDeliveryFee() != null ? cov.getDeliveryFee().toString() : "0.00")
                    .append(" | compra_minima: S/ ").append(cov.getMinOrderAmount() != null ? cov.getMinOrderAmount().toString() : "0.00");
            if (cov.getAliases() != null && !cov.getAliases().trim().isEmpty()) {
                contextBuilder.append(" | aliases: ").append(cov.getAliases().trim());
            }
            contextBuilder.append("\n");
        }
    }

    private void appendFaqContext(StringBuilder contextBuilder, String normalizedMessage, String publicBaseUrl) {
        List<AiKnowledgeBase> faqs = aiConfigDao.getAllAiKnowledgeBase().stream()
                .filter(kb -> kb.getActive() == null || kb.getActive())
                .sorted(Comparator.comparing(kb -> kb.getPriority() == null ? 100 : kb.getPriority()))
                .collect(Collectors.toList());

        List<AiKnowledgeBase> matchedFaqs = faqs.stream()
                .filter(faq -> faqMatches(faq, normalizedMessage))
                .limit(5)
                .collect(Collectors.toList());

        if (matchedFaqs.isEmpty()) {
            contextBuilder.append("\nFAQS: No se encontraron FAQs directamente relacionadas con el mensaje actual.\n");
            return;
        }

        contextBuilder.append("\nPREGUNTAS FRECUENTES RELEVANTES:\n");
        for (AiKnowledgeBase faq : matchedFaqs) {
            contextBuilder.append("- categoria: ").append(nullSafe(faq.getCategory())).append("\n")
                    .append("  intent: ").append(nullSafe(faq.getIntent())).append("\n")
                    .append("  keywords: ").append(nullSafe(faq.getKeywords())).append("\n")
                    .append("  respuesta: ").append(nullSafe(faq.getAnswer())).append("\n");
            if (faq.getAttachmentType() != null && !faq.getAttachmentType().trim().isEmpty()) {
                contextBuilder.append("  attachment_type: ").append(faq.getAttachmentType().trim()).append("\n");
            }
            if (faq.getMediaIdWhatsapp() != null && !faq.getMediaIdWhatsapp().trim().isEmpty()) {
                contextBuilder.append("  media_id_whatsapp: ").append(faq.getMediaIdWhatsapp().trim()).append("\n");
            }
            if (faq.getMediaCaption() != null && !faq.getMediaCaption().trim().isEmpty()) {
                contextBuilder.append("  caption_sugerido: ").append(faq.getMediaCaption().trim()).append("\n");
            }
            if (faq.getAttachmentUrl() != null && !faq.getAttachmentUrl().trim().isEmpty()) {
                contextBuilder.append("  image_url: ").append(buildAttachmentUrl(publicBaseUrl, faq.getAttachmentUrl().trim())).append("\n");
            }
        }
    }

    private List<Map<String, Object>> buildConversationContents(String userMessage, Contact contact) {
        List<Map<String, Object>> contentsList = new ArrayList<>();

        if (contact != null && contact.getTelefonoPrincipal() != null) {
            List<WhatsAppMessage> history = messageDao.findConversation(contact.getTelefonoPrincipal());
            List<WhatsAppMessage> pastMessages = new ArrayList<>();
            for (WhatsAppMessage msg : history) {
                if ("SYSTEM".equals(msg.getSender())) continue;
                if (msg.getSender().equals(contact.getTelefonoPrincipal()) && msg.getMessageText().equals(userMessage)) {
                    continue;
                }
                pastMessages.add(msg);
            }

            int start = Math.max(0, pastMessages.size() - 8);
            for (int i = start; i < pastMessages.size(); i++) {
                WhatsAppMessage msg = pastMessages.get(i);
                String role = msg.getSender().equals(contact.getTelefonoPrincipal()) ? "user" : "model";
                String text = msg.getMessageText();
                if (text == null) {
                    text = "";
                } else if (text.startsWith("data:") || text.length() > 5000) {
                    text = "[Contenido multimedia / extenso omitido]";
                }
                Map<String, Object> part = new HashMap<>();
                part.put("text", text);
                Map<String, Object> contentMap = new HashMap<>();
                contentMap.put("role", role);
                contentMap.put("parts", List.of(part));
                contentsList.add(contentMap);
            }
        }

        Map<String, Object> currentContent = new HashMap<>();
        currentContent.put("role", "user");

        if (userMessage != null && userMessage.startsWith("[AUDIO]")) {
            String localPath = userMessage.substring("[AUDIO]".length());
            String fullPath = "/app" + localPath;
            try {
                java.io.File audioFile = new java.io.File(fullPath);
                if (audioFile.exists()) {
                    byte[] fileBytes = java.nio.file.Files.readAllBytes(audioFile.toPath());
                    String base64Data = java.util.Base64.getEncoder().encodeToString(fileBytes);

                    String mimeType = "audio/ogg";
                    if (localPath.endsWith(".mp3")) mimeType = "audio/mp3";
                    else if (localPath.endsWith(".m4a")) mimeType = "audio/m4a";
                    else if (localPath.endsWith(".amr")) mimeType = "audio/amr";

                    Map<String, Object> inlineData = new HashMap<>();
                    inlineData.put("mimeType", mimeType);
                    inlineData.put("data", base64Data);

                    Map<String, Object> audioPart = new HashMap<>();
                    audioPart.put("inlineData", inlineData);

                    Map<String, Object> instructionPart = new HashMap<>();
                    instructionPart.put("text", "El cliente envió un audio por WhatsApp. Interprétalo y responde según el contexto comercial.");

                    currentContent.put("parts", List.of(instructionPart, audioPart));
                    logger.info("Enviando audio multimodal a Gemini desde: {}", fullPath);
                } else {
                    currentContent.put("parts", List.of(Map.of("text", "El cliente envió un audio, pero no se encontró el archivo local.")));
                }
            } catch (Exception e) {
                logger.error("Error al codificar audio para Gemini: {}", e.getMessage(), e);
                currentContent.put("parts", List.of(Map.of("text", "El cliente envió un audio, pero ocurrió un error al procesarlo.")));
            }
        } else {
            currentContent.put("parts", List.of(Map.of("text", userMessage == null ? "" : userMessage)));
        }

        contentsList.add(currentContent);
        return contentsList;
    }

    private JsonNode executeGeminiRequestWithRetry(String url, HttpEntity<Map<String, Object>> entity) {
        JsonNode responseNode = null;
        int maxRetries = 3;
        int attempt = 0;
        org.springframework.web.client.HttpStatusCodeException lastEx = null;

        while (attempt < maxRetries) {
            try {
                responseNode = restTemplate.postForObject(url, entity, JsonNode.class);
                break;
            } catch (org.springframework.web.client.HttpStatusCodeException e) {
                lastEx = e;
                int statusCode = e.getStatusCode().value();
                if (statusCode == 503 || statusCode == 429) {
                    attempt++;
                    if (attempt >= maxRetries) break;
                    long waitTime = attempt * 1500L;
                    logger.warn("Gemini API devolvió HTTP {}. Reintentando en {} ms ({} de {})...", statusCode, waitTime, attempt, maxRetries);
                    try {
                        Thread.sleep(waitTime);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                } else {
                    throw e;
                }
            }
        }

        if (responseNode == null && lastEx != null) {
            throw lastEx;
        }
        return responseNode;
    }

    private Map<String, Object> buildResponseSchema() {
        Map<String, Object> schema = new HashMap<>();
        schema.put("type", "OBJECT");
        schema.put("required", List.of("intent", "reply_text", "send_media", "needs_human"));

        Map<String, Object> properties = new HashMap<>();
        properties.put("intent", Map.of("type", "STRING"));
        properties.put("reply_text", Map.of("type", "STRING"));
        properties.put("send_media", Map.of("type", "BOOLEAN"));
        properties.put("media_type", Map.of("type", "STRING"));
        properties.put("media_id", Map.of("type", "STRING"));
        properties.put("image_url", Map.of("type", "STRING"));
        properties.put("caption", Map.of("type", "STRING"));
        properties.put("buttons", Map.of("type", "ARRAY", "items", Map.of("type", "STRING")));
        properties.put("next_state", Map.of("type", "STRING"));
        properties.put("needs_human", Map.of("type", "BOOLEAN"));

        // Schema para extracted_info (pedido, dirección, pago, etc.)
        Map<String, Object> extractedInfoSchema = new HashMap<>();
        extractedInfoSchema.put("type", "OBJECT");
        
        Map<String, Object> extProps = new HashMap<>();
        extProps.put("client_name", Map.of("type", "STRING"));
        extProps.put("client_dni", Map.of("type", "STRING"));
        
        // Products array schema
        Map<String, Object> prodArraySchema = new HashMap<>();
        prodArraySchema.put("type", "ARRAY");
        Map<String, Object> prodItemSchema = new HashMap<>();
        prodItemSchema.put("type", "OBJECT");
        Map<String, Object> prodItemProps = new HashMap<>();
        prodItemProps.put("name", Map.of("type", "STRING"));
        prodItemProps.put("quantity", Map.of("type", "INTEGER"));
        prodItemSchema.put("properties", prodItemProps);
        prodArraySchema.put("items", prodItemSchema);
        extProps.put("products", prodArraySchema);
        
        // Address schema
        Map<String, Object> addrSchema = new HashMap<>();
        addrSchema.put("type", "OBJECT");
        Map<String, Object> addrProps = new HashMap<>();
        addrProps.put("district", Map.of("type", "STRING"));
        addrProps.put("street", Map.of("type", "STRING"));
        addrProps.put("reference", Map.of("type", "STRING"));
        addrSchema.put("properties", addrProps);
        extProps.put("address", addrSchema);
        
        extProps.put("payment_method", Map.of("type", "STRING"));
        extractedInfoSchema.put("properties", extProps);
        
        properties.put("extracted_info", extractedInfoSchema);

        schema.put("properties", properties);
        return schema;
    }

    private boolean productMatches(AiProductConfig product, String normalizedMessage) {
        String name = normalize(product.getProductName());
        String code = normalize(product.getProductCode());
        String keywords = normalize(product.getSearchKeywords());
        String intent = normalize(product.getIntent());

        if (!code.isEmpty() && normalizedMessage.contains(code)) return true;
        if (!name.isEmpty() && normalizedMessage.contains(name)) return true;
        if (matchesKeywords(normalizedMessage, product.getSearchKeywords())) return true;

        if (containsAny(normalizedMessage, "promo", "promocion", "oferta", "descuento", "pack", "paquete")) {
            return containsAny(name + " " + keywords + " " + intent, "promo", "promocion", "oferta", "pack", "paquete", "combo");
        }

        String[] nameTokens = name.split("\\s+");
        int hits = 0;
        for (String token : nameTokens) {
            if (token.length() >= 3 && normalizedMessage.contains(token)) hits++;
        }
        return hits >= 2;
    }

    private boolean faqMatches(AiKnowledgeBase faq, String normalizedMessage) {
        if (matchesKeywords(normalizedMessage, faq.getKeywords())) return true;
        String category = normalize(faq.getCategory());
        String intent = normalize(faq.getIntent());
        if (!category.isEmpty() && normalizedMessage.contains(category)) return true;
        if (!intent.isEmpty() && normalizedMessage.contains(intent)) return true;
        if (containsAny(normalizedMessage, "hola", "buenos dias", "buenas tardes", "buenas noches")
                && containsAny(category + " " + intent + " " + normalize(faq.getKeywords()), "bienvenida", "saludo", "hola")) {
            return true;
        }
        return false;
    }

    private boolean coverageMatches(ShippingCoverage coverage, String normalizedMessage) {
        String district = normalize(coverage.getDistrictName());
        if (!district.isEmpty() && normalizedMessage.contains(district)) return true;
        return matchesKeywords(normalizedMessage, coverage.getAliases());
    }

    private boolean matchesKeywords(String normalizedMessage, String keywordsCsv) {
        if (keywordsCsv == null || keywordsCsv.trim().isEmpty()) return false;
        for (String kw : keywordsCsv.split(",")) {
            String keyword = normalize(kw);
            if (!keyword.isEmpty() && normalizedMessage.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private boolean containsAny(String text, String... terms) {
        if (text == null) return false;
        for (String term : terms) {
            if (text.contains(normalize(term))) return true;
        }
        return false;
    }

    private String normalize(String text) {
        if (text == null) return "";
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD);
        normalized = normalized.replaceAll("\\p{M}", "");
        return normalized.toLowerCase().trim();
    }

    private String getPublicBaseUrl() {
        String baseUrl = settingsService.getSetting("app.public.base.url");
        if (baseUrl == null || baseUrl.trim().isEmpty()) {
            baseUrl = settingsService.getSetting("frontend.public.url");
        }
        if (baseUrl == null || baseUrl.trim().isEmpty()) {
            baseUrl = "http://localhost:8080";
        }
        return baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }

    private String buildProductImageUrl(String publicBaseUrl, AiProductConfig prod) {
        return publicBaseUrl + "/api/productos/" + prod.getProductoId() + "/imagen";
    }

    private String buildAttachmentUrl(String publicBaseUrl, String attachmentUrl) {
        if (attachmentUrl.startsWith("http://") || attachmentUrl.startsWith("https://")) {
            return attachmentUrl;
        }
        if (attachmentUrl.startsWith("/")) {
            return publicBaseUrl + attachmentUrl;
        }
        return publicBaseUrl + "/uploads/" + attachmentUrl;
    }

    private String nullSafe(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private String emptyToDefault(String value, String defaultValue) {
        return value == null || value.trim().isEmpty() ? defaultValue : value.trim();
    }

    private String buildSystemPromptRules() {
        StringBuilder sb = new StringBuilder();
        
        String businessType = settingsService.getSetting("ai.business.type");
        if (businessType == null || businessType.trim().isEmpty()) {
            businessType = "ECOMMERCE";
        }
        
        sb.append("=== CONFIGURACIÓN DEL GIRO DE NEGOCIO ===\n")
          .append("Tipo de Negocio Activo: ").append(businessType).append("\n");
        
        if ("ECOMMERCE".equals(businessType)) {
            sb.append("- Sigues un flujo de e-commerce: Presentación de productos del catálogo -> Configuración del Carrito -> Validación de Cobertura -> Dirección de entrega -> Facturación/Comprobante -> Resumen -> Ticket final.\n");
            if ("true".equalsIgnoreCase(settingsService.getSetting("ai.ask.container"))) {
                String ruleText = settingsService.getSetting("ai.ask.container.text");
                if (ruleText == null || ruleText.trim().isEmpty()) {
                    ruleText = "Si el cliente selecciona un bidón o producto de 20L, pregúntale en un turno separado si cuenta con envase retornable en casa. Ofrece préstamo o venta de envase nuevo según corresponda.";
                }
                sb.append("- REGLA DE ENVASE: ").append(ruleText.trim()).append("\n");
            }
        } else if ("SERVICES".equals(businessType)) {
            sb.append("- Sigues un flujo de servicios/citas: Presentación de catálogo de servicios -> Selección de servicio -> Selección de fecha/hora de preferencia -> Validación de disponibilidad -> Reserva -> Comprobante -> Confirmación de cita.\n");
        } else if ("RESERVATIONS".equals(businessType)) {
            sb.append("- Sigues un flujo de reservas/hotelería: Presentación de tarifas/habitaciones/mesas -> Selección de fecha/hora y número de huéspedes -> Validación de disponibilidad -> Confirmación de reserva -> Ticket/Código de reserva.\n");
        } else if ("LEADS".equals(businessType)) {
            sb.append("- Sigues un flujo de captación de clientes B2B/Leads: Presentación de brochure/servicios corporativos -> Calificación del prospecto (Preguntar nombre, cargo, empresa, necesidad y número telefónico) -> Registro en CRM -> Derivación humana inmediata (marca needs_human=true al final).\n");
        }

        sb.append("\n=== REGLAS DE SALUDO Y BIENVENIDA ===\n");
        String greetingNew = settingsService.getSetting("ai.greeting.new");
        if (greetingNew != null && !greetingNew.trim().isEmpty()) {
            sb.append("- Mensaje de bienvenida para CLIENTES NUEVOS (usa este saludo o estructura exacta para presentarte): \"")
              .append(greetingNew.trim()).append("\"\n");
        }
        String greetingNewMediaType = settingsService.getSetting("ai.greeting.new.media.type");
        String greetingNewMediaIds = settingsService.getSetting("ai.greeting.new.media.ids");
        if ("IMAGE".equalsIgnoreCase(greetingNewMediaType) && greetingNewMediaIds != null && !greetingNewMediaIds.trim().isEmpty()) {
            sb.append("- Este saludo inicial tiene imágenes asociadas. Al dar la bienvenida por primera vez, debes responder con send_media=true, media_type=\"IMAGE\", media_id=\"")
              .append(greetingNewMediaIds.trim()).append("\", y el texto del saludo en reply_text o caption.\n");
        }

        String greetingRegistered = settingsService.getSetting("ai.greeting.registered");
        if (greetingRegistered != null && !greetingRegistered.trim().isEmpty()) {
            sb.append("- Mensaje de bienvenida para CLIENTES REGISTRADOS (usa este saludo o estructura exacta saludando por su nombre): \"")
              .append(greetingRegistered.trim()).append("\"\n");
        }
        String greetingRegMediaType = settingsService.getSetting("ai.greeting.registered.media.type");
        String greetingRegMediaIds = settingsService.getSetting("ai.greeting.registered.media.ids");
        if ("IMAGE".equalsIgnoreCase(greetingRegMediaType) && greetingRegMediaIds != null && !greetingRegMediaIds.trim().isEmpty()) {
            sb.append("- Este saludo de cliente registrado tiene imágenes asociadas. Al dar la bienvenida, debes responder con send_media=true, media_type=\"IMAGE\", media_id=\"")
              .append(greetingRegMediaIds.trim()).append("\", y el texto del saludo en reply_text o caption.\n");
        }

        sb.append("\n=== PARÁMETROS OBLIGATORIOS DURANTE EL PROCESO ===\n");
        if ("true".equalsIgnoreCase(settingsService.getSetting("ai.order.collect"))) {
            String ruleText = settingsService.getSetting("ai.order.collect.text");
            if (ruleText == null || ruleText.trim().isEmpty()) {
                ruleText = "Debes solicitar detalladamente al cliente qué productos, combos o recargas desea pedir de nuestro catálogo.";
            }
            sb.append("- SOLICITUD DE PEDIDO: ").append(ruleText.trim()).append("\n");
        }
        if ("true".equalsIgnoreCase(settingsService.getSetting("ai.collect.location"))) {
            String ruleText = settingsService.getSetting("ai.collect.location.text");
            if (ruleText == null || ruleText.trim().isEmpty()) {
                ruleText = "Es obligatorio solicitar al cliente que comparta su ubicación GPS nativa por WhatsApp para el delivery.";
            }
            sb.append("- UBICACIÓN: ").append(ruleText.trim()).append("\n");
        }
        if ("true".equalsIgnoreCase(settingsService.getSetting("ai.collect.document"))) {
            String ruleText = settingsService.getSetting("ai.collect.document.text");
            if (ruleText == null || ruleText.trim().isEmpty()) {
                ruleText = "Debes solicitar el tipo de comprobante. Si es Boleta con DNI exige exactamente 8 dígitos numéricos. Si es Factura exige Razón Social y exactamente 11 dígitos numéricos para el RUC.";
            }
            sb.append("- FACTURACIÓN: ").append(ruleText.trim()).append("\n");
        }
        
        if ("true".equalsIgnoreCase(settingsService.getSetting("ai.products.promotion"))) {
            String promoText = settingsService.getSetting("ai.products.promotion.text");
            String mediaType = settingsService.getSetting("ai.products.promotion.media.type");
            String mediaIds = settingsService.getSetting("ai.products.promotion.media.ids");
            String promoKeywords = settingsService.getSetting("ai.products.promotion.keywords");
            
            sb.append("\n=== PROMOCIÓN Y PRODUCTOS ESPECIALES ===\n");
            if (promoText != null && !promoText.trim().isEmpty()) {
                sb.append("- Ofrece al cliente la promoción especial: \"")
                  .append(promoText.trim()).append("\"\n");
            }
            if (promoKeywords != null && !promoKeywords.trim().isEmpty()) {
                sb.append("- Debes sugerir u ofrecer esta promoción si el usuario pregunta o menciona palabras relacionadas con: ")
                  .append(promoKeywords.trim()).append("\n");
            }
            if ("IMAGE".equalsIgnoreCase(mediaType) && mediaIds != null && !mediaIds.trim().isEmpty()) {
                sb.append("- Esta promoción tiene una o varias imágenes asociadas. Debes responder con send_media=true, media_type=\"IMAGE\", media_id=\"")
                  .append(mediaIds.trim()).append("\", y el texto descriptivo en reply_text o caption. El backend gestionará su envío múltiple a WhatsApp.\n");
            }
        }

        String paymentMethods = settingsService.getSetting("ai.payment.methods");
        if (paymentMethods != null && !paymentMethods.trim().isEmpty()) {
            sb.append("- MÉTODOS DE PAGO: Informa al cliente que los métodos de pago aceptados son únicamente: ")
              .append(paymentMethods.trim()).append("\n");
        }

        String customInstructions = settingsService.getSetting("ai.custom.instructions");
        if (customInstructions != null && !customInstructions.trim().isEmpty()) {
            sb.append("\n=== INSTRUCCIONES DE NEGOCIO ADICIONALES ===\n")
              .append(customInstructions.trim()).append("\n");
        }
        
        return sb.toString();
    }
}
