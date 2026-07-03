package com.nextlead.services;

import com.nextlead.dao.SystemSettingsDao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class SettingsService {

    private final SystemSettingsDao settingsDao;

    @Value("${whatsapp.api.token}")
    private String fallbackApiToken;

    @Value("${whatsapp.phone.id}")
    private String fallbackPhoneId;

    @Value("${whatsapp.verify.token}")
    private String fallbackVerifyToken;

    @Value("${whatsapp.display.number}")
    private String fallbackDisplayNumber;

    @Value("${gemini.api.key}")
    private String fallbackGeminiApiKey;

    private static final String DEFAULT_GEMINI_SYSTEM_PROMPT = 
        "Eres un asistente virtual automatizado para NextLead CRM. " +
        "Responde de manera muy concisa, amable, directa y en español a las consultas de los clientes. " +
        "Si el usuario pregunta por precios, horarios u ofertas simples, respóndele amablemente. " +
        "Si el usuario hace preguntas muy complejas, técnicas o solicita asistencia humana directa, " +
        "indícale amablemente que has derivado su caso con un asesor especializado de nuestro equipo.";

    @Autowired
    public SettingsService(SystemSettingsDao settingsDao) {
        this.settingsDao = settingsDao;
    }

    public String getSetting(String key) {
        return settingsDao.getSetting(key).orElseGet(() -> getFallback(key));
    }

    public void saveSetting(String key, String value) {
        settingsDao.saveSetting(key, value);
    }

    public Map<String, String> getAllSettings() {
        Map<String, String> settings = new HashMap<>();
        settings.put("whatsapp.api.token", getSetting("whatsapp.api.token"));
        settings.put("whatsapp.phone.id", getSetting("whatsapp.phone.id"));
        settings.put("whatsapp.verify.token", getSetting("whatsapp.verify.token"));
        settings.put("whatsapp.display.number", getSetting("whatsapp.display.number"));
        settings.put("gemini.api.key", getSetting("gemini.api.key"));
        settings.put("gemini.model", getSetting("gemini.model"));
        settings.put("gemini.system.prompt", getSetting("gemini.system.prompt"));
        settings.put("ai.active", getSetting("ai.active"));
        settings.put("ai.agent.name", getSetting("ai.agent.name"));
        settings.put("ai.business.description", getSetting("ai.business.description"));
        settings.put("ai.tone", getSetting("ai.tone"));
        settings.put("ai.max.quota", getSetting("ai.max.quota"));
        
        // Visual flow builder settings
        settings.put("ai.business.type", getSetting("ai.business.type"));
        settings.put("ai.ask.container", getSetting("ai.ask.container"));
        settings.put("ai.ask.container.text", getSetting("ai.ask.container.text"));
        settings.put("ai.collect.location", getSetting("ai.collect.location"));
        settings.put("ai.collect.location.text", getSetting("ai.collect.location.text"));
        settings.put("ai.products.promotion", getSetting("ai.products.promotion"));
        settings.put("ai.products.promotion.text", getSetting("ai.products.promotion.text"));
        settings.put("ai.products.promotion.media.ids", getSetting("ai.products.promotion.media.ids"));
        settings.put("ai.products.promotion.media.type", getSetting("ai.products.promotion.media.type"));
        settings.put("ai.products.promotion.post.text", getSetting("ai.products.promotion.post.text"));
        settings.put("ai.products.promotion.keywords", getSetting("ai.products.promotion.keywords"));
        settings.put("ai.collect.document", getSetting("ai.collect.document"));
        settings.put("ai.collect.document.text", getSetting("ai.collect.document.text"));
        settings.put("ai.greeting.new", getSetting("ai.greeting.new"));
        settings.put("ai.greeting.new.media.type", getSetting("ai.greeting.new.media.type"));
        settings.put("ai.greeting.new.media.ids", getSetting("ai.greeting.new.media.ids"));
        settings.put("ai.greeting.registered", getSetting("ai.greeting.registered"));
        settings.put("ai.greeting.registered.media.type", getSetting("ai.greeting.registered.media.type"));
        settings.put("ai.greeting.registered.media.ids", getSetting("ai.greeting.registered.media.ids"));
        settings.put("ai.payment.methods", getSetting("ai.payment.methods"));
        settings.put("ai.custom.instructions", getSetting("ai.custom.instructions"));
        settings.put("ai.flow.order", getSetting("ai.flow.order"));
        return settings;
    }

    private String getFallback(String key) {
        switch (key) {
            case "whatsapp.api.token":
                return fallbackApiToken;
            case "whatsapp.phone.id":
                return fallbackPhoneId;
            case "whatsapp.verify.token":
                return fallbackVerifyToken;
            case "whatsapp.display.number":
                return fallbackDisplayNumber;
            case "gemini.api.key":
                return fallbackGeminiApiKey;
            case "gemini.model":
                return "gemini-1.5-flash";
            case "gemini.system.prompt":
                return DEFAULT_GEMINI_SYSTEM_PROMPT;
            case "ai.active":
                return "true";
            case "ai.agent.name":
                return "Antarqui Bot";
            case "ai.business.description":
                return "Venta de agua alcalina premium Antarqui en Lima";
            case "ai.tone":
                return "Amigable y cercano";
            case "ai.max.quota":
                return "30";
            case "ai.business.type":
                return "ECOMMERCE";
            case "ai.ask.container":
                return "true";
            case "ai.ask.container.text":
                return "Veo que llevas una recarga de agua de 20L. 💧 ¿Cuentas con envase retornable vacío en casa para entregar al repartidor? Si no tienes, podemos cotizarte la venta de un envase nuevo.";
            case "ai.collect.location":
                return "true";
            case "ai.collect.location.text":
                return "Por favor, compárteme tu ubicación actual por el GPS nativo de WhatsApp 📍 para coordinar tu envío gratis a domicilio.";
            case "ai.products.promotion":
                return "true";
            case "ai.products.promotion.text":
                return "🎁 ¡Tenemos excelentes noticias! Contamos con nuestra *Promoción Especial del Mes*: 3 Recargas de Agua Alcalina de 20L por solo *S/ 39.00* (¡ahorras S/ 15.00!). Además, te podemos brindar información de nuestros bidones nuevos de policarbonato. ¿Te gustaría llevar la promoción o prefieres ver otros productos? 💧";
            case "ai.products.promotion.media.type":
                return "NONE";
            case "ai.products.promotion.media.ids":
                return "";
            case "ai.products.promotion.post.text":
                return "";
            case "ai.products.promotion.keywords":
                return "promocion, especial, oferta, descuento, promo, combo, paquete, pack, promociones, ofertas, combos, paquetes, packs, precio, precios, tarifas, costo, costos, catalogos, catalogo, rebaja, rebajas, regalo, gratis, info, informacion";
            case "ai.collect.document":
                return "true";
            case "ai.collect.document.text":
                return "Para procesar tu pedido, ¿requieres boleta de venta o factura? 🧾 Si es boleta facilítame tu DNI (8 dígitos) o tu RUC (11 dígitos) con la razón social si es factura.";
            case "ai.greeting.new":
                return "¡Hola! 💧 Bienvenido a *Antarqui Perú*. Impulsa tu bienestar con la mejor hidratación:\n\n✅ *Agua Alcalina* (PH 8.2)\n✅ *Ionizada*\n✅ *Ozonizada*\n✅ *12 procesos de purificación*\n\n🚚 ¡*DELIVERY GRATIS* en Zonas de Cobertura! 🏠💨\n\n👉 *NUESTROS PRODUCTOS*:\n🎁 ¿Te gustaría ver también nuestra *PROMOCIÓN ESPECIAL* de 3 recargas con un precio increíble?";
            case "ai.greeting.new.media.type":
                return "NONE";
            case "ai.greeting.new.media.ids":
                return "";
            case "ai.greeting.registered":
                return "¡Hola *[Nombre]*, bienvenido de nuevo a *Antarqui Perú*! 💧 ¿Te gustaría pedir tu recarga de siempre o prefieres conocer nuestras promociones del día?";
            case "ai.greeting.registered.media.type":
                return "NONE";
            case "ai.greeting.registered.media.ids":
                return "";
            case "ai.payment.methods":
                return "Yape, Plin, Efectivo contra entrega, Transferencias bancarias";
            case "ai.custom.instructions":
                return "Ofrecer la promoción especial de 3 recargas si muestran interés en compras familiares o de consumo recurrente.";
            case "ai.flow.order":
                return "business,welcome,registered,location,promotion,billing,container,payment,custom";
            default:
                return null;
        }
    }
}
