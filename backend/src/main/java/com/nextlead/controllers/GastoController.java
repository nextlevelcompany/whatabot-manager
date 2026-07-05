package com.nextlead.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.sql.Date;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/gastos")
public class GastoController {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public GastoController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // ==========================================
    // EXPENSES CRUD
    // ==========================================

    @GetMapping
    public ResponseEntity<?> getAll() {
        try {
            List<Map<String, Object>> list = jdbcTemplate.queryForList(
                "SELECT g.*, p.razon_social as proveedor_nombre, c.nombre as categoria_nombre, c.tipo as categoria_tipo, c.grupo_contable, cond.nombre as conductor_nombre, cond.vehiculo_placa " +
                "FROM gastos g " +
                "LEFT JOIN proveedores p ON g.proveedor_id = p.id " +
                "LEFT JOIN gastos_categorias c ON g.categoria_id = c.id " +
                "LEFT JOIN conductores cond ON g.vehiculo_id = cond.id " +
                "ORDER BY g.fecha_gasto DESC, g.id DESC"
            );
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al obtener gastos: " + e.getMessage()));
        }
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getSummary() {
        try {
            Map<String, Object> summary = jdbcTemplate.queryForMap(
                "SELECT " +
                "    COALESCE(SUM(CASE WHEN estado_pago != 'Anulado' THEN monto_total ELSE 0 END), 0) as total_mes, " +
                "    COALESCE(SUM(CASE WHEN estado_pago = 'Pendiente' THEN monto_total ELSE 0 END), 0) as total_pendiente " +
                "FROM gastos " +
                "WHERE EXTRACT(MONTH FROM fecha_gasto) = EXTRACT(MONTH FROM CURRENT_DATE) " +
                "AND EXTRACT(YEAR FROM fecha_gasto) = EXTRACT(YEAR FROM CURRENT_DATE)"
            );
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al obtener resumen de gastos: " + e.getMessage()));
        }
    }

    @PostMapping("/save")
    @Transactional
    public ResponseEntity<?> save(@RequestBody SaveGastoRequest req) {
        try {
            if (req.categoria_id == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "La categoría de gasto es obligatoria."));
            }
            if (req.fecha_gasto == null || req.fecha_gasto.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "La fecha del gasto es obligatoria."));
            }
            if (req.monto_total == null || req.monto_total <= 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "El monto total debe ser mayor a 0."));
            }

            Date dateGasto = Date.valueOf(req.fecha_gasto);
            boolean isEdit = req.id != null;
            Long gastoId = null;

            if (isEdit) {
                jdbcTemplate.update(
                    "UPDATE gastos SET proveedor_id = ?, categoria_id = ?, vehiculo_id = ?, fecha_gasto = ?, " +
                    "numero_comprobante = ?, tipo_comprobante = ?, descripcion = ?, cantidad = ?, costo_unitario = ?, " +
                    "monto_total = ?, estado_pago = ?, metodo_pago = ?, archivo_comprobante = ? WHERE id = ?",
                    req.proveedor_id, req.categoria_id, req.vehiculo_id, dateGasto,
                    req.numero_comprobante, req.tipo_comprobante, req.descripcion, req.cantidad, req.costo_unitario,
                    req.monto_total, req.estado_pago, req.metodo_pago, req.archivo_comprobante, req.id
                );
                // Revert cash flow linked to this gasto to re-sync
                jdbcTemplate.update("DELETE FROM caja_movimientos WHERE referencia_id = ? AND tabla_referencia = 'gastos'", req.id);
                gastoId = req.id;
            } else {
                jdbcTemplate.update(
                    "INSERT INTO gastos (proveedor_id, categoria_id, vehiculo_id, fecha_gasto, numero_comprobante, " +
                    "tipo_comprobante, descripcion, cantidad, costo_unitario, monto_total, estado_pago, metodo_pago, " +
                    "archivo_comprobante) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    req.proveedor_id, req.categoria_id, req.vehiculo_id, dateGasto,
                    req.numero_comprobante, req.tipo_comprobante, req.descripcion, req.cantidad != null ? req.cantidad : 1.0,
                    req.costo_unitario != null ? req.costo_unitario : req.monto_total, req.monto_total,
                    req.estado_pago != null ? req.estado_pago : "Pagado", req.metodo_pago, req.archivo_comprobante
                );
                gastoId = jdbcTemplate.queryForObject("SELECT lastval()", Long.class);
            }

            // If it is marked as Pagado, record cash outflow
            if ("Pagado".equalsIgnoreCase(req.estado_pago != null ? req.estado_pago : "Pagado")) {
                Integer defaultUserId = 1;
                try {
                    defaultUserId = jdbcTemplate.queryForObject("SELECT id FROM users LIMIT 1", Integer.class);
                } catch (Exception ignored) {}

                jdbcTemplate.update(
                    "INSERT INTO caja_movimientos (tipo, categoria, monto, metodo_pago, referencia_id, tabla_referencia, notas, usuario_id, fecha) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    "Egreso", "Gasto", req.monto_total, req.metodo_pago != null ? req.metodo_pago : "Transferencia",
                    gastoId, "gastos", req.descripcion != null && !req.descripcion.trim().isEmpty() ? req.descripcion : "Egreso por Gasto",
                    defaultUserId, new java.sql.Timestamp(System.currentTimeMillis())
                );
            }

            if (isEdit) {
                return ResponseEntity.ok(Map.of("message", "Gasto actualizado con éxito.", "id", req.id));
            } else {
                return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("message", "Gasto registrado con éxito.", "id", gastoId));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al guardar el gasto: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            // Revert linked cash flow entry
            jdbcTemplate.update("DELETE FROM caja_movimientos WHERE referencia_id = ? AND tabla_referencia = 'gastos'", id);
            
            int rows = jdbcTemplate.update("DELETE FROM gastos WHERE id = ?", id);
            if (rows == 0) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(Map.of("message", "Gasto eliminado con éxito."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al eliminar el gasto: " + e.getMessage()));
        }
    }

    // ==========================================
    // EXPENSE CATEGORIES CRUD
    // ==========================================

    @GetMapping("/categorias")
    public ResponseEntity<?> getCategorias() {
        try {
            List<Map<String, Object>> list = jdbcTemplate.queryForList(
                "SELECT * FROM gastos_categorias ORDER BY grupo_contable, nombre ASC"
            );
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al obtener categorías de gastos: " + e.getMessage()));
        }
    }

    @PostMapping("/categorias/save")
    @Transactional
    public ResponseEntity<?> saveCategoria(@RequestBody SaveCategoriaRequest req) {
        try {
            if (req.nombre == null || req.nombre.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "El nombre de la categoría es obligatorio."));
            }

            boolean isEdit = req.id != null;

            if (isEdit) {
                jdbcTemplate.update(
                    "UPDATE gastos_categorias SET nombre = ?, tipo = ?, grupo_contable = ?, afecta_margen_bidon = ?, afecta_cac = ?, activo = ? WHERE id = ?",
                    req.nombre, req.tipo, req.grupo_contable, req.afecta_margen_bidon, req.afecta_cac,
                    req.activo != null ? req.activo : true, req.id
                );
                return ResponseEntity.ok(Map.of("message", "Categoría de gasto actualizada con éxito.", "id", req.id));
            } else {
                jdbcTemplate.update(
                    "INSERT INTO gastos_categorias (nombre, tipo, grupo_contable, afecta_margen_bidon, afecta_cac, activo) VALUES (?, ?, ?, ?, ?, ?)",
                    req.nombre, req.tipo, req.grupo_contable, req.afecta_margen_bidon, req.afecta_cac,
                    req.activo != null ? req.activo : true
                );
                Integer newId = jdbcTemplate.queryForObject("SELECT lastval()", Integer.class);
                return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("message", "Categoría de gasto registrada con éxito.", "id", newId));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al guardar la categoría de gasto: " + e.getMessage()));
        }
    }

    @DeleteMapping("/categorias/{id}")
    @Transactional
    public ResponseEntity<?> deleteCategoria(@PathVariable Integer id) {
        try {
            // Check for associated expenses
            Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM gastos WHERE categoria_id = ?", Integer.class, id);
            if (count != null && count > 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "No se puede eliminar: Existen gastos registrados bajo esta categoría. Puede desactivarla en su lugar."));
            }

            int rows = jdbcTemplate.update("DELETE FROM gastos_categorias WHERE id = ?", id);
            if (rows == 0) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(Map.of("message", "Categoría de gasto eliminada con éxito."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al eliminar la categoría de gasto: " + e.getMessage()));
        }
    }

    public static class SaveGastoRequest {
        public Long id;
        public Long proveedor_id;
        public Integer categoria_id;
        public Integer vehiculo_id;
        public String fecha_gasto;
        public String numero_comprobante;
        public String tipo_comprobante;
        public String descripcion;
        public Double cantidad;
        public Double costo_unitario;
        public Double monto_total;
        public String estado_pago;
        public String metodo_pago;
        public String archivo_comprobante;
    }

    public static class SaveCategoriaRequest {
        public Integer id;
        public String nombre;
        public String tipo;
        public String grupo_contable;
        public Boolean afecta_margen_bidon;
        public Boolean afecta_cac;
        public Boolean activo;
    }
}
