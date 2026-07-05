package com.nextlead.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/opportunities")
public class OpportunityController {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public OpportunityController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // ==========================================
    // 1. KANBAN BOARD DATA BUNDLE
    // ==========================================
    @GetMapping("/kanban")
    public ResponseEntity<?> getKanbanData() {
        try {
            // Columns (Stages)
            List<Map<String, Object>> columns = jdbcTemplate.queryForList(
                "SELECT * FROM kanban_columnas ORDER BY orden ASC"
            );

            // Opportunities
            List<Map<String, Object>> opps = jdbcTemplate.queryForList(
                "SELECT o.*, " +
                "       c.tipo_persona as contacto_tipo_persona, c.numero_documento, " +
                "       COALESCE(c.razon_social, CONCAT(c.nombres, ' ', c.apellidos)) as contacto_nombre_completo, " +
                "       CONCAT(u.first_name, ' ', u.last_name) as vendedor_nombre " +
                "FROM oportunidades o " +
                "LEFT JOIN contacts c ON o.contacto_id = c.id " +
                "LEFT JOIN users u ON o.usuario_id = u.id " +
                "ORDER BY o.orden ASC, o.id DESC"
            );

            // Master Tags
            List<Map<String, Object>> tags = jdbcTemplate.queryForList(
                "SELECT * FROM kanban_etiquetas ORDER BY nombre ASC"
            );

            // All Contacts for dropdown
            List<Map<String, Object>> contacts = jdbcTemplate.queryForList(
                "SELECT id, tipo_persona, COALESCE(razon_social, CONCAT(nombres, ' ', apellidos)) as display_name " +
                "FROM contacts " +
                "ORDER BY display_name ASC"
            );

            return ResponseEntity.ok(Map.of(
                "columns", columns,
                "opportunities", opps,
                "tags", tags,
                "contacts", contacts
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al obtener datos de oportunidades: " + e.getMessage()));
        }
    }

    // ==========================================
    // 2. OPPORTUNITY CRUD
    // ==========================================
    @PostMapping("/save")
    @Transactional
    public ResponseEntity<?> saveOpportunity(@RequestBody SaveOpportunityRequest req) {
        try {
            if (req.titulo == null || req.titulo.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "El título de la oportunidad es obligatorio."));
            }
            if (req.etapa_id == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "La etapa o columna es obligatoria."));
            }

            boolean isEdit = req.id != null;
            Long oppId;

            if (isEdit) {
                jdbcTemplate.update(
                    "UPDATE oportunidades SET titulo = ?, contacto_id = ?, etapa_id = ?, valor = ?, prioridad = ?, etiquetas = ? WHERE id = ?",
                    req.titulo, req.contacto_id, req.etapa_id, req.valor, req.prioridad, req.etiquetas, req.id
                );
                oppId = req.id;
            } else {
                // Fetch default user id to assign
                Integer defaultUserId = 1;
                try {
                    defaultUserId = jdbcTemplate.queryForObject("SELECT id FROM users LIMIT 1", Integer.class);
                } catch (Exception ignored) {}

                // Get max order
                Integer maxOrder = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(MAX(orden), 0) FROM oportunidades WHERE etapa_id = ?",
                    Integer.class, req.etapa_id
                );

                jdbcTemplate.update(
                    "INSERT INTO oportunidades (titulo, contacto_id, etapa_id, valor, prioridad, etiquetas, usuario_id, orden) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    req.titulo, req.contacto_id, req.etapa_id, req.valor, req.prioridad, req.etiquetas, defaultUserId, (maxOrder != null ? maxOrder : 0) + 1
                );
                oppId = jdbcTemplate.queryForObject("SELECT lastval()", Long.class);
            }

            return ResponseEntity.ok(Map.of("message", "Oportunidad guardada con éxito.", "id", oppId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al guardar oportunidad: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteOpportunity(@PathVariable Long id) {
        try {
            int rows = jdbcTemplate.update("DELETE FROM oportunidades WHERE id = ?", id);
            if (rows == 0) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(Map.of("message", "Oportunidad eliminada con éxito."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al eliminar oportunidad: " + e.getMessage()));
        }
    }

    @PostMapping("/move")
    @Transactional
    public ResponseEntity<?> moveOpportunity(@RequestBody MoveOpportunityRequest req) {
        try {
            if (req.opp_id == null || req.etapa_id == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "IDs de oportunidad y etapa son obligatorios."));
            }

            jdbcTemplate.update("UPDATE oportunidades SET etapa_id = ? WHERE id = ?", req.etapa_id, req.opp_id);
            return ResponseEntity.ok(Map.of("message", "Oportunidad movida con éxito."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al mover oportunidad: " + e.getMessage()));
        }
    }

    // ==========================================
    // 3. KANBAN COLUMNS CRUD
    // ==========================================
    @PostMapping("/columns/save")
    @Transactional
    public ResponseEntity<?> saveColumn(@RequestBody SaveColumnRequest req) {
        try {
            if (req.nombre == null || req.nombre.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "El nombre de la columna es obligatorio."));
            }

            if (req.id != null) {
                jdbcTemplate.update(
                    "UPDATE kanban_columnas SET nombre = ?, es_ganada = ?, label_ganada = ?, es_perdida = ?, label_perdida = ? WHERE id = ?",
                    req.nombre, req.es_ganada, req.label_ganada, req.es_perdida, req.label_perdida, req.id
                );
            } else {
                Integer maxOrder = jdbcTemplate.queryForObject("SELECT COALESCE(MAX(orden), 0) FROM kanban_columnas", Integer.class);
                jdbcTemplate.update(
                    "INSERT INTO kanban_columnas (nombre, orden, es_ganada, es_perdida) VALUES (?, ?, ?, ?)",
                    req.nombre, (maxOrder != null ? maxOrder : 0) + 1, req.es_ganada, req.es_perdida
                );
            }
            return ResponseEntity.ok(Map.of("message", "Columna de Kanban guardada con éxito."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al guardar columna: " + e.getMessage()));
        }
    }

    @DeleteMapping("/columns/{id}")
    @Transactional
    public ResponseEntity<?> deleteColumn(@PathVariable Integer id) {
        try {
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM oportunidades WHERE etapa_id = ?",
                Integer.class, id
            );

            if (count != null && count > 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "No se puede eliminar la columna: Tiene oportunidades asociadas."));
            }

            int rows = jdbcTemplate.update("DELETE FROM kanban_columnas WHERE id = ?", id);
            if (rows == 0) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(Map.of("message", "Columna de Kanban eliminada con éxito."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al eliminar columna: " + e.getMessage()));
        }
    }

    @PostMapping("/columns/order")
    @Transactional
    public ResponseEntity<?> updateColumnOrder(@RequestBody List<Integer> order) {
        try {
            for (int i = 0; i < order.size(); i++) {
                jdbcTemplate.update("UPDATE kanban_columnas SET orden = ? WHERE id = ?", i + 1, order.get(i));
            }
            return ResponseEntity.ok(Map.of("message", "Orden de columnas guardado con éxito."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al actualizar orden de columnas: " + e.getMessage()));
        }
    }

    // ==========================================
    // 4. KANBAN MASTER TAGS CRUD
    // ==========================================
    @PostMapping("/tags/save")
    @Transactional
    public ResponseEntity<?> saveTag(@RequestBody SaveTagRequest req) {
        try {
            if (req.nombre == null || req.nombre.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "El nombre de la etiqueta es obligatorio."));
            }

            jdbcTemplate.update(
                "INSERT INTO kanban_etiquetas (nombre, color) VALUES (?, ?) ON CONFLICT (nombre) DO UPDATE SET color = EXCLUDED.color",
                req.nombre, req.color != null ? req.color : "#6366f1"
            );
            return ResponseEntity.ok(Map.of("message", "Etiqueta guardada con éxito."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al guardar etiqueta: " + e.getMessage()));
        }
    }

    @DeleteMapping("/tags/{id}")
    @Transactional
    public ResponseEntity<?> deleteTag(@PathVariable Integer id) {
        try {
            int rows = jdbcTemplate.update("DELETE FROM kanban_etiquetas WHERE id = ?", id);
            if (rows == 0) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(Map.of("message", "Etiqueta eliminada con éxito."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al eliminar etiqueta: " + e.getMessage()));
        }
    }


    // ==========================================
    // DTO REQUESTS CLASSES
    // ==========================================
    public static class SaveOpportunityRequest {
        public Long id;
        public String titulo;
        public Long contacto_id;
        public Integer etapa_id;
        public Double valor = 0.0;
        public String prioridad = "Media";
        public String etiquetas;
    }

    public static class MoveOpportunityRequest {
        public Long opp_id;
        public Integer etapa_id;
    }

    public static class SaveColumnRequest {
        public Integer id;
        public String nombre;
        public Boolean es_ganada = false;
        public String label_ganada = "Ganada";
        public Boolean es_perdida = false;
        public String label_perdida = "Perdida";
    }

    public static class SaveTagRequest {
        public String nombre;
        public String color;
    }
}
