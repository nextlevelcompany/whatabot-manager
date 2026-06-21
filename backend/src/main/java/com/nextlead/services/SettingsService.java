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
            default:
                return null;
        }
    }
}
