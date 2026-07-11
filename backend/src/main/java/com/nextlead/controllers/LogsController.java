package com.nextlead.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/admin/logs")
public class LogsController {

    private static final String LOG_FILE_PATH = "logs/nextlead.log";

    @GetMapping
    public ResponseEntity<List<String>> getLogs(@RequestParam(value = "lines", defaultValue = "200") int lines) {
        File file = new File(LOG_FILE_PATH);
        if (!file.exists()) {
            return new ResponseEntity<>(Collections.singletonList("El archivo de logs aún no ha sido creado o no existe en: " + file.getAbsolutePath()), HttpStatus.OK);
        }

        List<String> lastLines = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = reader.readLine()) != null) {
                lastLines.add(line);
                if (lastLines.size() > lines) {
                    lastLines.remove(0);
                }
            }
        } catch (IOException e) {
            return new ResponseEntity<>(Collections.singletonList("Error al leer el archivo de logs: " + e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return new ResponseEntity<>(lastLines, HttpStatus.OK);
    }
}
