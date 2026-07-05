package com.nextlead.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.sql.Timestamp;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/finanzas")
public class FinanceController {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public FinanceController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/movimientos")
    public ResponseEntity<?> getMovements(
            @RequestParam(required = false) String desde,
            @RequestParam(required = false) String hasta,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) String metodo) {
        try {
            StringBuilder query = new StringBuilder(
                "SELECT m.*, u.username as usuario_nombre, " +
                "       CASE " +
                "         WHEN m.tabla_referencia = 'gastos' THEN (SELECT descripcion FROM gastos WHERE id = m.referencia_id) " +
                "         WHEN m.tabla_referencia = 'compras' THEN (SELECT 'Compra Nro: ' || numero_compra FROM compras WHERE id = m.referencia_id) " +
                "         WHEN m.tabla_referencia = 'deudas_bancarias' THEN (SELECT 'Préstamo: ' || entidad_bancaria FROM deudas_bancarias WHERE id = m.referencia_id) " +
                "         ELSE NULL " +
                "       END as doc_referencia " +
                "FROM caja_movimientos m " +
                "LEFT JOIN users u ON m.usuario_id = u.id " +
                "WHERE 1=1 "
            );

            List<Object> params = new java.util.ArrayList<>();

            if (desde != null && !desde.trim().isEmpty()) {
                query.append("AND DATE(m.fecha) >= CAST(? AS DATE) ");
                params.add(desde);
            }
            if (hasta != null && !hasta.trim().isEmpty()) {
                query.append("AND DATE(m.fecha) <= CAST(? AS DATE) ");
                params.add(hasta);
            }
            if (tipo != null && !tipo.trim().isEmpty() && !"all".equalsIgnoreCase(tipo)) {
                query.append("AND m.tipo = ? ");
                params.add(tipo);
            }
            if (metodo != null && !metodo.trim().isEmpty() && !"all".equalsIgnoreCase(metodo)) {
                query.append("AND m.metodo_pago = ? ");
                params.add(metodo);
            }

            query.append("ORDER BY m.fecha DESC, m.id DESC");

            List<Map<String, Object>> list = jdbcTemplate.queryForList(query.toString(), params.toArray());
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al obtener movimientos de caja: " + e.getMessage()));
        }
    }

    @GetMapping("/saldos")
    public ResponseEntity<?> getBalances() {
        try {
            List<Map<String, Object>> balances = jdbcTemplate.queryForList(
                "SELECT metodo_pago, " +
                "       SUM(CASE WHEN tipo = 'Ingreso' THEN monto ELSE 0 END) as ingresos, " +
                "       SUM(CASE WHEN tipo = 'Egreso' THEN monto ELSE 0 END) as egresos, " +
                "       SUM(CASE WHEN tipo = 'Ingreso' THEN monto ELSE -monto END) as saldo " +
                "FROM caja_movimientos " +
                "GROUP BY metodo_pago"
            );
            return ResponseEntity.ok(balances);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al obtener saldos de cuentas: " + e.getMessage()));
        }
    }

    @GetMapping("/resumen")
    public ResponseEntity<?> getPeriodSummary(
            @RequestParam(required = false) String desde,
            @RequestParam(required = false) String hasta,
            @RequestParam(required = false) String metodo) {
        try {
            StringBuilder query = new StringBuilder(
                "SELECT " +
                "       COALESCE(SUM(CASE WHEN tipo = 'Ingreso' THEN monto ELSE 0 END), 0) as total_ingresos, " +
                "       COALESCE(SUM(CASE WHEN tipo = 'Egreso' THEN monto ELSE 0 END), 0) as total_egresos " +
                "FROM caja_movimientos " +
                "WHERE 1=1 "
            );
            List<Object> params = new java.util.ArrayList<>();

            if (desde != null && !desde.trim().isEmpty()) {
                query.append("AND DATE(fecha) >= CAST(? AS DATE) ");
                params.add(desde);
            }
            if (hasta != null && !hasta.trim().isEmpty()) {
                query.append("AND DATE(fecha) <= CAST(? AS DATE) ");
                params.add(hasta);
            }
            if (metodo != null && !metodo.trim().isEmpty() && !"all".equalsIgnoreCase(metodo)) {
                query.append("AND metodo_pago = ? ");
                params.add(metodo);
            }

            Map<String, Object> summary = jdbcTemplate.queryForMap(query.toString(), params.toArray());
            double totalIngresos = ((Number) summary.get("total_ingresos")).doubleValue();
            double totalEgresos = ((Number) summary.get("total_egresos")).doubleValue();
            summary.put("saldo_neto", totalIngresos - totalEgresos);

            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al obtener resumen financiero: " + e.getMessage()));
        }
    }

    @PostMapping("/movimientos/save")
    @Transactional
    public ResponseEntity<?> saveMovement(@RequestBody SaveMovementRequest req) {
        try {
            if (req.tipo == null || req.tipo.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "El tipo (Ingreso/Egreso) es obligatorio."));
            }
            if (req.categoria == null || req.categoria.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "La categoría es obligatoria."));
            }
            if (req.monto == null || req.monto <= 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "El monto debe ser mayor que 0."));
            }
            if (req.metodo_pago == null || req.metodo_pago.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "El método de pago es obligatorio."));
            }

            Timestamp fechaMov = (req.fecha != null && !req.fecha.trim().isEmpty())
                ? Timestamp.valueOf(req.fecha)
                : new Timestamp(System.currentTimeMillis());

            Integer defaultUserId = 1;
            try {
                defaultUserId = jdbcTemplate.queryForObject("SELECT id FROM users LIMIT 1", Integer.class);
            } catch (Exception ignored) {}

            boolean isEdit = req.id != null;

            if (isEdit) {
                jdbcTemplate.update(
                    "UPDATE caja_movimientos SET tipo = ?, categoria = ?, monto = ?, metodo_pago = ?, " +
                    "notas = ?, archivo_comprobante = ?, fecha = ? WHERE id = ?",
                    req.tipo, req.categoria, req.monto, req.metodo_pago, req.notas, req.archivo_comprobante,
                    fechaMov, req.id
                );
                return ResponseEntity.ok(Map.of("message", "Movimiento de caja actualizado.", "id", req.id));
            } else {
                jdbcTemplate.update(
                    "INSERT INTO caja_movimientos (tipo, categoria, monto, metodo_pago, referencia_id, tabla_referencia, " +
                    "notas, archivo_comprobante, usuario_id, fecha) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    req.tipo, req.categoria, req.monto, req.metodo_pago, req.referencia_id, req.tabla_referencia,
                    req.notas, req.archivo_comprobante, defaultUserId, fechaMov
                );
                Long newId = jdbcTemplate.queryForObject("SELECT lastval()", Long.class);
                return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("message", "Movimiento de caja registrado.", "id", newId));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al guardar el movimiento: " + e.getMessage()));
        }
    }

    @PostMapping("/movimientos/anular/{id}")
    @Transactional
    public ResponseEntity<?> voidMovement(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String observaciones = body.getOrDefault("observacion", "Anulación Manual");

            List<Map<String, Object>> list = jdbcTemplate.queryForList("SELECT * FROM caja_movimientos WHERE id = ?", id);
            if (list.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            Map<String, Object> mov = list.get(0);

            String notas = (String) mov.get("notas");
            if (notas != null && notas.contains("ANULADO")) {
                return ResponseEntity.badRequest().body(Map.of("message", "El movimiento ya se encuentra anulado."));
            }

            // Check if linked to an expense
            String refTabla = (String) mov.get("tabla_referencia");
            Long refId = (Long) mov.get("referencia_id");

            if ("gastos".equalsIgnoreCase(refTabla) && refId != null) {
                // If it is linked to a Gasto, we delete the Gasto (or soft delete)
                jdbcTemplate.update("DELETE FROM gastos WHERE id = ?", refId);
            }

            // Create reversal entry
            String originalTipo = (String) mov.get("tipo");
            String reversalTipo = "Ingreso".equalsIgnoreCase(originalTipo) ? "Egreso" : "Ingreso";
            Number monto = (Number) mov.get("monto");
            String metodoPago = (String) mov.get("metodo_pago");
            Integer userId = (Integer) mov.get("usuario_id");

            jdbcTemplate.update(
                "INSERT INTO caja_movimientos (usuario_id, tipo, categoria, monto, metodo_pago, referencia_id, tabla_referencia, notas) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                userId, reversalTipo, "Anulación", monto.doubleValue(), metodoPago, id, "caja_movimientos",
                "REVERSIÓN: " + observaciones + " | Ref Mov ID: " + id
            );

            // Update original entry notes
            String updatedNotes = (notas == null ? "" : notas) + " | ANULADO: " + observaciones;
            jdbcTemplate.update("UPDATE caja_movimientos SET notas = ? WHERE id = ?", updatedNotes, id);

            return ResponseEntity.ok(Map.of("message", "Movimiento anulado y reversado en caja con éxito."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al anular movimiento: " + e.getMessage()));
        }
    }

    public static class SaveMovementRequest {
        public Long id;
        public String tipo;
        public String categoria;
        public Double monto;
        public String metodo_pago;
        public Long referencia_id;
        public String tabla_referencia;
        public String notas;
        public String archivo_comprobante;
        public String fecha;
    }
}
