package com.nextlead.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.sql.Date;
import java.util.Calendar;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/deudas")
public class DeudaController {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public DeudaController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<?> getLoans() {
        try {
            List<Map<String, Object>> list = jdbcTemplate.queryForList(
                "SELECT d.*, " +
                "       (SELECT COUNT(*) FROM deudas_cuotas WHERE deuda_id = d.id AND estado = 'Pendiente') as cuotas_pendientes, " +
                "       COALESCE((SELECT SUM(monto_cuota) FROM deudas_cuotas WHERE deuda_id = d.id AND estado = 'Pendiente'), 0) as saldo_pendiente " +
                "FROM deudas_bancarias d " +
                "ORDER BY d.fecha_inicio DESC"
            );
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al obtener deudas bancarias: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getLoanDetails(@PathVariable Long id) {
        try {
            List<Map<String, Object>> loans = jdbcTemplate.queryForList("SELECT * FROM deudas_bancarias WHERE id = ?", id);
            if (loans.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            Map<String, Object> loan = loans.get(0);

            List<Map<String, Object>> installments = jdbcTemplate.queryForList(
                "SELECT * FROM deudas_cuotas WHERE deuda_id = ? ORDER BY numero_cuota ASC", id
            );

            return ResponseEntity.ok(Map.of("loan", loan, "installments", installments));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al obtener detalles del préstamo: " + e.getMessage()));
        }
    }

    @PostMapping("/save")
    @Transactional
    public ResponseEntity<?> addLoan(@RequestBody SaveLoanRequest req) {
        try {
            if (req.entidad_bancaria == null || req.entidad_bancaria.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "La entidad bancaria es obligatoria."));
            }
            if (req.monto_prestado == null || req.monto_prestado <= 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "El monto prestado debe ser mayor que 0."));
            }
            if (req.fecha_inicio == null || req.fecha_inicio.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "La fecha de desembolso es obligatoria."));
            }
            if (req.cuotas_totales == null || req.cuotas_totales <= 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "El número de cuotas debe ser mayor que 0."));
            }

            Date dateInicio = Date.valueOf(req.fecha_inicio);
            boolean isEdit = req.id != null;

            if (isEdit) {
                // If edit, only edit description/notes, bank name or loan number
                jdbcTemplate.update(
                    "UPDATE deudas_bancarias SET entidad_bancaria = ?, numero_prestamo = ?, notas = ? WHERE id = ?",
                    req.entidad_bancaria, req.numero_prestamo, req.notas, req.id
                );
                return ResponseEntity.ok(Map.of("message", "Préstamo actualizado con éxito.", "id", req.id));
            } else {
                // Register Loan
                jdbcTemplate.update(
                    "INSERT INTO deudas_bancarias (entidad_bancaria, numero_prestamo, monto_prestado, moneda, " +
                    "fecha_inicio, cuotas_totales, tcea, estado, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    req.entidad_bancaria, req.numero_prestamo, req.monto_prestado,
                    req.moneda != null ? req.moneda : "PEN", dateInicio, req.cuotas_totales,
                    req.tcea != null ? req.tcea : 0.0, "Activa", req.notes
                );

                Long loanId = jdbcTemplate.queryForObject("SELECT lastval()", Long.class);

                // Register Cash Inflow (Tesoreria)
                Integer defaultUserId = 1;
                try {
                    defaultUserId = jdbcTemplate.queryForObject("SELECT id FROM users LIMIT 1", Integer.class);
                } catch (Exception ignored) {}

                jdbcTemplate.update(
                    "INSERT INTO caja_movimientos (tipo, categoria, monto, metodo_pago, referencia_id, tabla_referencia, " +
                    "notas, usuario_id, fecha) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    "Ingreso", "Prestamo", req.monto_prestado, req.metodo_recepcion != null ? req.metodo_recepcion : "Transferencia",
                    loanId, "deudas_bancarias", "Recepción de Préstamo: " + req.entidad_bancaria + " (" + (req.numero_prestamo != null ? req.numero_prestamo : "S.N.") + ")",
                    defaultUserId, new java.sql.Timestamp(System.currentTimeMillis())
                );

                // Auto-generate installments templates (simple linear division)
                double baseQuota = req.monto_prestado / req.cuotas_totales;
                Calendar cal = Calendar.getInstance();
                cal.setTime(dateInicio);

                for (int i = 1; i <= req.cuotas_totales; i++) {
                    cal.add(Calendar.MONTH, 1);
                    Date dueDate = new Date(cal.getTimeInMillis());
                    jdbcTemplate.update(
                        "INSERT INTO deudas_cuotas (deuda_id, numero_cuota, fecha_vencimiento, monto_cuota, capital, interes, estado) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?)",
                        loanId, i, dueDate, baseQuota, baseQuota, 0.0, "Pendiente"
                    );
                }

                return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("message", "Préstamo y cronograma inicial registrados con éxito."));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al registrar préstamo: " + e.getMessage()));
        }
    }

    @PutMapping("/cuotas/update/{id}")
    @Transactional
    public ResponseEntity<?> updateInstallment(@PathVariable Long id, @RequestBody UpdateInstallmentRequest req) {
        try {
            if (req.fecha_vencimiento == null || req.fecha_vencimiento.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "La fecha de vencimiento es obligatoria."));
            }
            if (req.monto_cuota == null || req.monto_cuota <= 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "El monto de la cuota debe ser mayor que 0."));
            }

            Date dateDue = Date.valueOf(req.fecha_vencimiento);
            double capital = req.capital != null ? req.capital : req.monto_cuota;
            double interes = req.interes != null ? req.interes : 0.0;
            double seguro = req.seguro_comisiones != null ? req.seguro_comisiones : 0.0;

            int rows = jdbcTemplate.update(
                "UPDATE deudas_cuotas SET fecha_vencimiento = ?, monto_cuota = ?, capital = ?, interes = ?, seguro_comisiones = ? " +
                "WHERE id = ? AND estado = 'Pendiente'",
                dateDue, req.monto_cuota, capital, interes, seguro, id
            );

            if (rows == 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "No se pudo actualizar la cuota. Verifique que no esté ya pagada."));
            }
            return ResponseEntity.ok(Map.of("message", "Cuota de amortización actualizada con éxito."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al actualizar la cuota: " + e.getMessage()));
        }
    }

    @PostMapping("/cuotas/pagar/{id}")
    @Transactional
    public ResponseEntity<?> payInstallment(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String metodoPago = body.getOrDefault("metodo_pago", "Transferencia");

            List<Map<String, Object>> installments = jdbcTemplate.queryForList(
                "SELECT c.*, d.entidad_bancaria, d.numero_prestamo, d.proveedor_id " +
                "FROM deudas_cuotas c " +
                "JOIN deudas_bancarias d ON c.deuda_id = d.id " +
                "WHERE c.id = ?", id
            );
            if (installments.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            Map<String, Object> cuota = installments.get(0);

            if ("Pagado".equals(cuota.get("estado"))) {
                return ResponseEntity.badRequest().body(Map.of("message", "Esta cuota ya se encuentra pagada."));
            }

            // 1. Check or Create 'Carga Financiera (Bancos)' Expense Category
            Integer catId = null;
            try {
                catId = jdbcTemplate.queryForObject("SELECT id FROM gastos_categorias WHERE nombre = 'Carga Financiera (Bancos)' LIMIT 1", Integer.class);
            } catch (Exception ignored) {}
            if (catId == null) {
                jdbcTemplate.update("INSERT INTO gastos_categorias (nombre, tipo, grupo_contable) VALUES ('Carga Financiera (Bancos)', 'Fijo', 'Financiero')");
                catId = jdbcTemplate.queryForObject("SELECT lastval()", Integer.class);
            }

            // 2. Register Expense (Gasto)
            Number amt = (Number) cuota.get("monto_cuota");
            Integer numCuota = (Integer) cuota.get("numero_cuota");
            String ent = (String) cuota.get("entidad_bancaria");
            String numPrestamo = (String) cuota.get("numero_prestamo");
            Long pId = cuota.get("proveedor_id") != null ? ((Number) cuota.get("proveedor_id")).longValue() : null;

            String desc = "Pago Cuota #" + numCuota + " - Préstamo " + ent + " (" + (numPrestamo != null ? numPrestamo : "S.N.") + ")";

            jdbcTemplate.update(
                "INSERT INTO gastos (proveedor_id, categoria_id, fecha_gasto, descripcion, cantidad, costo_unitario, " +
                "monto_total, estado_pago, metodo_pago) VALUES (?, ?, CURRENT_DATE, ?, 1.0, ?, ?, 'Pagado', ?)",
                pId, catId, desc, amt.doubleValue(), amt.doubleValue(), metodoPago
            );
            Long expenseId = jdbcTemplate.queryForObject("SELECT lastval()", Long.class);

            // Also register a Cash Outflow (Egreso) in caja_movimientos to keep treasury balanced!
            Integer defaultUserId = 1;
            try {
                defaultUserId = jdbcTemplate.queryForObject("SELECT id FROM users LIMIT 1", Integer.class);
            } catch (Exception ignored) {}

            jdbcTemplate.update(
                "INSERT INTO caja_movimientos (tipo, categoria, monto, metodo_pago, referencia_id, tabla_referencia, notas, usuario_id, fecha) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
                "Egreso", "Gasto", amt.doubleValue(), metodoPago, expenseId, "gastos", desc, defaultUserId
            );

            // 3. Update Installment
            jdbcTemplate.update(
                "UPDATE deudas_cuotas SET estado = 'Pagado', gasto_id = ?, fecha_pago = CURRENT_TIMESTAMP WHERE id = ?",
                expenseId, id
            );

            // 4. Check if loan is fully paid
            Long debtId = ((Number) cuota.get("deuda_id")).longValue();
            Integer pendingCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM deudas_cuotas WHERE deuda_id = ? AND estado = 'Pendiente'", Integer.class, debtId
            );
            if (pendingCount != null && pendingCount == 0) {
                jdbcTemplate.update("UPDATE deudas_bancarias SET estado = 'Liquidada' WHERE id = ?", debtId);
            }

            return ResponseEntity.ok(Map.of("message", "Cuota pagada con éxito. Egreso contable y de tesorería registrados."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al pagar la cuota: " + e.getMessage()));
        }
    }

    @PostMapping("/cuotas/anular/{id}")
    @Transactional
    public ResponseEntity<?> annulInstallment(@PathVariable Long id) {
        try {
            List<Map<String, Object>> list = jdbcTemplate.queryForList("SELECT * FROM deudas_cuotas WHERE id = ?", id);
            if (list.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            Map<String, Object> cuota = list.get(0);

            if (!"Pagado".equals(cuota.get("estado"))) {
                return ResponseEntity.badRequest().body(Map.of("message", "Solo se pueden anular cuotas que ya están pagadas."));
            }

            Long expenseId = cuota.get("gasto_id") != null ? ((Number) cuota.get("gasto_id")).longValue() : null;

            if (expenseId != null) {
                // Delete associated cash flow entry first (which is linked to the expense)
                jdbcTemplate.update("DELETE FROM caja_movimientos WHERE referencia_id = ? AND tabla_referencia = 'gastos'", expenseId);
                // Delete associated contable expense
                jdbcTemplate.update("DELETE FROM gastos WHERE id = ?", expenseId);
            }

            // Reset installment details
            jdbcTemplate.update("UPDATE deudas_cuotas SET estado = 'Pendiente', gasto_id = NULL, fecha_pago = NULL WHERE id = ?", id);

            // Reset loan state to Active if it was liquidated
            Long debtId = ((Number) cuota.get("deuda_id")).longValue();
            jdbcTemplate.update("UPDATE deudas_bancarias SET estado = 'Activa' WHERE id = ?", debtId);

            return ResponseEntity.ok(Map.of("message", "Pago de cuota anulado con éxito. Egresos contables revertidos."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al anular la cuota: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteLoan(@PathVariable Long id) {
        try {
            // Check for paid installments
            Integer paidCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM deudas_cuotas WHERE deuda_id = ? AND estado = 'Pagado'", Integer.class, id
            );
            if (paidCount != null && paidCount > 0) {
                return ResponseEntity.badRequest().body(Map.of(
                    "message", "No se puede eliminar un préstamo que ya posee cuotas liquidadas. Por favor anule los pagos primero."
                ));
            }

            // 1. Delete details (installments)
            jdbcTemplate.update("DELETE FROM deudas_cuotas WHERE deuda_id = ?", id);

            // 2. Revert inflow movement in caja
            jdbcTemplate.update("DELETE FROM caja_movimientos WHERE referencia_id = ? AND tabla_referencia = 'deudas_bancarias'", id);

            // 3. Delete loan
            int rows = jdbcTemplate.update("DELETE FROM deudas_bancarias WHERE id = ?", id);
            if (rows == 0) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(Map.of("message", "Préstamo bancario y cronograma eliminados con éxito."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al eliminar el préstamo: " + e.getMessage()));
        }
    }

    public static class SaveLoanRequest {
        public Long id;
        public String entidad_bancaria;
        public String numero_prestamo;
        public Double monto_prestado;
        public String moneda;
        public String fecha_inicio;
        public Integer cuotas_totales;
        public Double tcea;
        public String notas;
        public String notes;
        public String metodo_recepcion;
    }

    public static class UpdateInstallmentRequest {
        public String fecha_vencimiento;
        public Double monto_cuota;
        public Double capital;
        public Double interes;
        public Double seguro_comisiones;
    }
}
