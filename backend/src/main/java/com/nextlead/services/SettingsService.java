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
        settings.put("gemini.system.prompt", getSetting("gemini.system.prompt"));
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
            case "gemini.system.prompt":
                return DEFAULT_GEMINI_SYSTEM_PROMPT;
            default:
                return null;
        }
    }
}
