package com.nextlead.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/zonas-reparto")
public class ZonaController {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public ZonaController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<?> getAll() {
        try {
            List<Map<String, Object>> list = jdbcTemplate.queryForList(
                "SELECT * FROM zonas ORDER BY id DESC"
            );
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al obtener zonas: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Integer id) {
        try {
            List<Map<String, Object>> list = jdbcTemplate.queryForList(
                "SELECT * FROM zonas WHERE id = ?", id
            );
            if (list.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(list.get(0));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al obtener zona: " + e.getMessage()));
        }
    }

    @PostMapping("/save")
    @Transactional
    public ResponseEntity<?> save(@RequestBody SaveZonaRequest req) {
        try {
            if (req.nombre == null || req.nombre.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "El nombre es obligatorio."));
            }

            boolean isEdit = req.id != null;

            if (isEdit) {
                jdbcTemplate.update(
                    "UPDATE zonas SET nombre = ?, activo = ? WHERE id = ?",
                    req.nombre, req.activo != null ? req.activo : true, req.id
                );
                return ResponseEntity.ok(Map.of("message", "Zona actualizada con éxito.", "id", req.id));
            } else {
                jdbcTemplate.update(
                    "INSERT INTO zonas (nombre, activo) VALUES (?, ?)",
                    req.nombre, req.activo != null ? req.activo : true
                );
                Integer newId = jdbcTemplate.queryForObject("SELECT lastval()", Integer.class);
                return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("message", "Zona registrada con éxito.", "id", newId));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al guardar zona: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        try {
            int rows = jdbcTemplate.update("DELETE FROM zonas WHERE id = ?", id);
            if (rows == 0) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(Map.of("message", "Zona de reparto eliminada con éxito."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al eliminar la zona: " + e.getMessage()));
        }
    }

    public static class SaveZonaRequest {
        public Integer id;
        public String nombre;
        public Boolean activo;
    }
}
