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
            default:
                return null;
        }
    }
}
