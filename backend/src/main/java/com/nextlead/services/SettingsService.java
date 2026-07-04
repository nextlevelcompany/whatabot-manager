package com.nextlead.services;

import com.nextlead.dao.SystemSettingsDao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import java.util.TimeZone;

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

    @PostConstruct
    public void initTimeZone() {
        try {
            String tz = getSetting("timezone");
            if (tz != null && !tz.trim().isEmpty()) {
                TimeZone.setDefault(TimeZone.getTimeZone(tz));
                System.out.println("Default JVM TimeZone set to: " + tz);
            } else {
                TimeZone.setDefault(TimeZone.getTimeZone("America/Lima"));
                System.out.println("Default JVM TimeZone set to fallback: America/Lima");
            }
        } catch (Exception e) {
            System.err.println("Failed to set default JVM TimeZone: " + e.getMessage());
        }
    }

    public String getSetting(String key) {
        return settingsDao.getSetting(key).orElseGet(() -> getFallback(key));
    }

    public void saveSetting(String key, String value) {
        settingsDao.saveSetting(key, value);
        if ("timezone".equals(key) && value != null && !value.trim().isEmpty()) {
            try {
                TimeZone.setDefault(TimeZone.getTimeZone(value));
                System.out.println("Default JVM TimeZone dynamically changed to: " + value);
            } catch (Exception e) {
                System.err.println("Failed to update default JVM TimeZone dynamically: " + e.getMessage());
            }
        }
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
        settings.put("ai.order.collect", getSetting("ai.order.collect"));
        settings.put("ai.order.collect.text", getSetting("ai.order.collect.text"));
        settings.put("ai.custom.instructions", getSetting("ai.custom.instructions"));
        settings.put("ai.flow.order", getSetting("ai.flow.order"));
        settings.put("empresa.nombre", getSetting("empresa.nombre"));
        settings.put("empresa.ruc", getSetting("empresa.ruc"));
        settings.put("empresa.telefono", getSetting("empresa.telefono"));
        settings.put("timezone", getSetting("timezone"));
        settings.put("formato.fecha", getSetting("formato.fecha"));
        settings.put("formato.hora", getSetting("formato.hora"));
        settings.put("igv.porcentaje", getSetting("igv.porcentaje"));
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
            case "ai.order.collect":
                return "true";
            case "ai.order.collect.text":
                return "REGLA: Cada vez que el cliente elija o pida un producto (ya sea desde el flujo inicial, la promo, upselling, o una solicitud directa), CONFIRMA lo agregado y pregunta si desea algo más.\n\nFormato del mensaje de confirmación:\n\n\"✅ *¡Agregado!*\n\n🛒 *[Cantidad]x [Nombre del Producto]*\n💲 Precio unitario: *S/ [Precio_Unitario]*\n💰 Subtotal: *S/ [Subtotal]*\n\n[Si el carrito tiene más de 1 ítem, mostrar resumen parcial:]\n📦 *Tu carrito actual:*\n▫️ [Cantidad]x [Producto 1] (S/ [Precio_Unitario] c/u) — S/ [Subtotal1]\n▫️ [Cantidad]x [Producto 2] (S/ [Precio_Unitario] c/u) — S/ [Subtotal2]\n[...]\n💰 *Subtotal parcial: S/ [suma]*\n\n¿Deseas agregar *otro producto* o *confirmamos tu pedido*? 🤔\"\n\nComportamiento según respuesta:\n- QUIERE AGREGAR MÁS → Consulta Productos para mostrarle las opciones disponibles (los que NO tiene ya en el carrito o variantes diferentes). Cuando elija, agrega al CARRITO y vuelve a mostrar CONFIRMACIÓN DE AGREGADO.\n- CONFIRMA / ESTÁ CONFORME → Continuar al siguiente paso pendiente del FLUJO DEL PEDIDO (COBERTURA, FORMULARIO, etc.).\n\nExcepciones donde NO se pregunta \"¿algo más?\":\n- Ninguna. SIEMPRE se confirma el agregado y se pregunta.";
            case "ai.ask.container":
                return "true";
            case "ai.ask.container.text":
                return "Veo que llevas una recarga de agua de 20L. 💧 ¿Cuentas con envase retornable vacío en casa para entregar al repartidor? Si no tienes, podemos cotizarte la venta de un envase nuevo.";
            case "ai.collect.location":
                return "true";
            case "ai.collect.location.text":
                return "Cuando el cliente registrado ya tiene productos confirmados en el carrito y va a pasar a la etapa de datos de entrega, llama a \"consultar_direccion_cliente\".\n\nSi devuelve dirección y ubicación guardadas:\n\nMensaje:\n\"📍 *[Nombre]*, tenemos registrada esta dirección de entrega:\n\n✅ *Dirección:* [Dirección guardada]\n✅ *Distrito:* [Distrito guardado]\n✅ *Ubicación:* [URL Google Maps guardada]\n\n¿Enviamos a esta *misma dirección* o prefieres indicar una *dirección diferente*? 🏠\"\n\nComportamiento según respuesta:\n- MISMA DIRECCIÓN → Usar los datos guardados (dirección, distrito, ubicación). Saltar VERIFICACIÓN DE COBERTURA (ya fue validada antes) y FORMULARIO DE ENTREGA (solo pedir datos faltantes como Nombres/Apellidos si no están y Tipo de Comprobante). Ir directo a VALIDACIÓN DE COMPROBANTE.\n- DIRECCIÓN DIFERENTE → Ir a VERIFICACIÓN DE COBERTURA (sacar de Zonas de Envío) y FORMULARIO DE ENTREGA normal (pedir todos los datos desde cero).\n\nSi es CLIENTE NUEVO o el CLIENTE REGISTRADO NO tiene dirección guardada:\n- VERIFICACIÓN DE COBERTURA → Solicita su ubicación GPS nativa de WhatsApp. Cruza el distrito/coordenadas con la lista de \"Zonas de Envío\" para validar si el delivery está cubierto y calcular el costo de envío.\n- FORMULARIO DE ENTREGA → Solicita todos los datos desde cero: Nombres/Apellidos, Dirección exacta, Referencia de domicilio, Distrito y Tipo de Comprobante.\n- VALIDACIÓN DE COMPROBANTE → Pasa al siguiente paso.";
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
                return "💳 MEDIOS DE PAGO - ANTARQUI\n\nPara tu comodidad, aceptamos las siguientes opciones:\n\n🏦 Transferencia Bancaria (Empresa)\nRazón Social: ASCENDO PERÚ E.I.R.L\nRUC: 20611846721\nBanco: Interbank\nCuenta Soles: 200-3005845511\nCCI: 003-200-003005845511-31\n\n📱 Billeteras Digitales (Yape/Plin)\nNombre: Anabel Laime\nNúmero: 948 613 380\n\n💵 Otras opciones:\nEfectivo: Monto exacto contraentrega.\nTarjeta de Crédito/Débito: Aceptamos todas las tarjetas.\nPago por QR: Escanea el código que te proporcionaremos desde tu móvil.\n\n¡Gracias por elegir Antarqui! Si tienes alguna duda, escríbenos.";
            case "ai.custom.instructions":
                return "Ofrecer la promoción especial de 3 recargas si muestran interés en compras familiares o de consumo recurrente.";
            case "ai.flow.order":
                return "business,welcome,registered,order,location,promotion,billing,container,payment,custom";
            case "empresa.nombre":
                return "NextLead CRM";
            case "empresa.ruc":
                return "20611846721";
            case "empresa.telefono":
                return "948613380";
            case "timezone":
                return "America/Lima";
            case "formato.fecha":
                return "d/m/Y";
            case "formato.hora":
                return "24h";
            case "igv.porcentaje":
                return "18";
            default:
                return null;
        }
    }
}
