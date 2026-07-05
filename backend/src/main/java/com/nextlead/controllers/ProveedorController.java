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
@RequestMapping("/api/proveedores")
public class ProveedorController {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public ProveedorController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<?> getAll() {
        try {
            List<Map<String, Object>> list = jdbcTemplate.queryForList(
                "SELECT * FROM proveedores ORDER BY razon_social ASC"
            );
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al obtener proveedores: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            List<Map<String, Object>> list = jdbcTemplate.queryForList(
                "SELECT * FROM proveedores WHERE id = ?", id
            );
            if (list.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(list.get(0));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al obtener proveedor: " + e.getMessage()));
        }
    }

    @PostMapping("/save")
    @Transactional
    public ResponseEntity<?> save(@RequestBody SaveProveedorRequest req) {
        try {
            if (req.razon_social == null || req.razon_social.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "La Razón Social es obligatoria."));
            }

            boolean isEdit = req.id != null;

            if (isEdit) {
                jdbcTemplate.update(
                    "UPDATE proveedores SET ruc = ?, razon_social = ?, contacto_nombre = ?, telefono = ?, email = ?, direccion = ?, activo = ? WHERE id = ?",
                    req.ruc, req.razon_social, req.contacto_nombre, req.telefono, req.email, req.direccion,
                    req.activo != null ? req.activo : true, req.id
                );
                return ResponseEntity.ok(Map.of("message", "Proveedor actualizado con éxito.", "id", req.id));
            } else {
                jdbcTemplate.update(
                    "INSERT INTO proveedores (ruc, razon_social, contacto_nombre, telefono, email, direccion, activo) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    req.ruc, req.razon_social, req.contacto_nombre, req.telefono, req.email, req.direccion,
                    req.activo != null ? req.activo : true
                );
                Long newId = jdbcTemplate.queryForObject("SELECT lastval()", Long.class);
                return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("message", "Proveedor registrado con éxito.", "id", newId));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al guardar el proveedor: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            // Check for associated expenses or purchases
            Integer expensesCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM gastos WHERE proveedor_id = ?", Integer.class, id);
            Integer purchasesCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM compras WHERE proveedor_id = ?", Integer.class, id);

            if ((expensesCount != null && expensesCount > 0) || (purchasesCount != null && purchasesCount > 0)) {
                return ResponseEntity.badRequest().body(Map.of("message", "No se puede eliminar: El proveedor tiene gastos o compras asociadas."));
            }

            int rows = jdbcTemplate.update("DELETE FROM proveedores WHERE id = ?", id);
            if (rows == 0) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(Map.of("message", "Proveedor eliminado con éxito."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al eliminar proveedor: " + e.getMessage()));
        }
    }

    public static class SaveProveedorRequest {
        public Long id;
        public String ruc;
        public String razon_social;
        public String contacto_nombre;
        public String telefono;
        public String email;
        public String direccion;
        public Boolean activo;
    }
}
