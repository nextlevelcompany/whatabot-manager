package com.nextlead.controllers;

import com.nextlead.services.SettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    private final SettingsService settingsService;

    @Autowired
    public SettingsController(SettingsService settingsService) {
        this.settingsService = settingsService;
    }

    @GetMapping
    public ResponseEntity<Map<String, String>> getSettings() {
        return new ResponseEntity<>(settingsService.getAllSettings(), HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<Void> updateSettings(@RequestBody Map<String, String> newSettings) {
        if (newSettings != null) {
            for (Map.Entry<String, String> entry : newSettings.entrySet()) {
                settingsService.saveSetting(entry.getKey(), entry.getValue());
            }
        }
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
