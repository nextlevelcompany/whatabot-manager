package com.nextlead.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.sql.Date;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api/payroll")
public class PayrollController {

    private final JdbcTemplate jdbcTemplate;

    // Standard Peruvian Payroll Constants
    private static final double RMV = 1025.0; // Remuneración Mínima Vital
    private static final double UIT = 5150.0; // Unidad Impositiva Tributaria (2024 reference)
    private static final double TASA_ESSALUD = 0.09;

    @Autowired
    public PayrollController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // ==========================================
    // 1. AFP LIST
    // ==========================================
    @GetMapping("/afps")
    public ResponseEntity<?> getAfps() {
        try {
            List<Map<String, Object>> list = jdbcTemplate.queryForList(
                "SELECT * FROM afp_maestra WHERE activo = true ORDER BY nombre ASC"
            );
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al obtener AFPs: " + e.getMessage()));
        }
    }

    // ==========================================
    // 2. STAFF (TRABAJADORES) CRUD
    // ==========================================
    @GetMapping("/staff")
    public ResponseEntity<?> getStaff(@RequestParam(value = "estado", required = false) String estado) {
        try {
            String sql = "SELECT t.*, a.nombre as afp_nombre FROM trabajadores t LEFT JOIN afp_maestra a ON t.afp_id = a.id";
            List<Map<String, Object>> list;
            if (estado != null && !estado.trim().isEmpty() && !"all".equalsIgnoreCase(estado)) {
                sql += " WHERE t.estado = ? ORDER BY t.nombre ASC";
                list = jdbcTemplate.queryForList(sql, estado);
            } else {
                sql += " ORDER BY t.nombre ASC";
                list = jdbcTemplate.queryForList(sql);
            }
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al obtener colaboradores: " + e.getMessage()));
        }
    }

    @PostMapping("/staff/save")
    @Transactional
    public ResponseEntity<?> saveStaff(@RequestBody SaveWorkerRequest req) {
        try {
            if (req.nombre == null || req.nombre.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "El nombre es obligatorio."));
            }
            if (req.apellido == null || req.apellido.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "El apellido es obligatorio."));
            }
            if (req.dni == null || req.dni.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "El DNI es obligatorio."));
            }

            // DNI duplicate validation
            String checkSql = req.id != null ? 
                "SELECT COUNT(*) FROM trabajadores WHERE dni = ? AND id != ?" : 
                "SELECT COUNT(*) FROM trabajadores WHERE dni = ?";
            Integer count = req.id != null ? 
                jdbcTemplate.queryForObject(checkSql, Integer.class, req.dni, req.id) : 
                jdbcTemplate.queryForObject(checkSql, Integer.class, req.dni);

            if (count != null && count > 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "El DNI " + req.dni + " ya está registrado."));
            }

            Date dateIngreso = req.fecha_ingreso != null ? Date.valueOf(req.fecha_ingreso) : null;
            boolean isEdit = req.id != null;
            Long workerId;

            if (isEdit) {
                jdbcTemplate.update(
                    "UPDATE trabajadores SET usuario_id = ?, nombre = ?, apellido = ?, dni = ?, telefono = ?, " +
                    "rol_operativo = ?, sueldo_base = ?, frecuencia_pago = ?, monto_tardanza = ?, tiene_hijos = ?, " +
                    "paga_ley = ?, regimen_pension = ?, afp_id = ?, tipo_comision_afp = ?, paga_comision = ?, " +
                    "monto_comision_bidon = ?, vehiculo_placa = ?, vehiculo_marca = ?, vehiculo_modelo = ?, " +
                    "vehiculo_capacidad = ?, linea_movil = ?, cuenta_bancaria = ?, banco_nombre = ?, estado = ?, " +
                    "fecha_ingreso = ? WHERE id = ?",
                    req.usuario_id, req.nombre, req.apellido, req.dni, req.telefono, req.rol_operativo, req.sueldo_base,
                    req.frecuencia_pago, req.monto_tardanza, req.tiene_hijos, req.paga_ley, req.regimen_pension,
                    req.afp_id, req.tipo_comision_afp, req.paga_comision, req.monto_comision_bidon, req.vehiculo_placa,
                    req.vehiculo_marca, req.vehiculo_modelo, req.vehiculo_capacidad, req.linea_movil, req.cuenta_bancaria,
                    req.banco_nombre, req.estado, dateIngreso, req.id
                );
                workerId = req.id;
            } else {
                jdbcTemplate.update(
                    "INSERT INTO trabajadores (usuario_id, nombre, apellido, dni, telefono, rol_operativo, sueldo_base, " +
                    "frecuencia_pago, monto_tardanza, tiene_hijos, paga_ley, regimen_pension, afp_id, tipo_comision_afp, " +
                    "paga_comision, monto_comision_bidon, vehiculo_placa, vehiculo_marca, vehiculo_modelo, " +
                    "vehiculo_capacidad, linea_movil, cuenta_bancaria, banco_nombre, estado, fecha_ingreso) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    req.usuario_id, req.nombre, req.apellido, req.dni, req.telefono, req.rol_operativo, req.sueldo_base,
                    req.frecuencia_pago, req.monto_tardanza, req.tiene_hijos, req.paga_ley, req.regimen_pension,
                    req.afp_id, req.tipo_comision_afp, req.paga_comision, req.monto_comision_bidon, req.vehiculo_placa,
                    req.vehiculo_marca, req.vehiculo_modelo, req.vehiculo_capacidad, req.linea_movil, req.cuenta_bancaria,
                    req.banco_nombre, req.estado, dateIngreso
                );
                workerId = jdbcTemplate.queryForObject("SELECT lastval()", Long.class);
            }

            // Sync with conductores table if they are a Repartidor
            if ("Repartidor".equalsIgnoreCase(req.rol_operativo)) {
                boolean active = "Activo".equalsIgnoreCase(req.estado);
                Integer exists = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM conductores WHERE dni = ?", Integer.class, req.dni);
                if (exists != null && exists > 0) {
                    jdbcTemplate.update(
                        "UPDATE conductores SET nombre = ?, telefono = ?, vehiculo_placa = ?, activo = ? WHERE dni = ?",
                        req.nombre + " " + req.apellido, req.telefono, req.vehiculo_placa, active, req.dni
                    );
                } else {
                    jdbcTemplate.update(
                        "INSERT INTO conductores (nombre, telefono, dni, vehiculo_placa, activo) VALUES (?, ?, ?, ?, ?)",
                        req.nombre + " " + req.apellido, req.telefono, req.dni, req.vehiculo_placa, active
                    );
                }
            }

            return ResponseEntity.ok(Map.of("message", "Colaborador guardado con éxito.", "id", workerId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al guardar colaborador: " + e.getMessage()));
        }
    }

    @DeleteMapping("/staff/{id}")
    @Transactional
    public ResponseEntity<?> deleteStaff(@PathVariable Long id) {
        try {
            int rows = jdbcTemplate.update("DELETE FROM trabajadores WHERE id = ?", id);
            if (rows == 0) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(Map.of("message", "Colaborador eliminado con éxito."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al eliminar colaborador: " + e.getMessage()));
        }
    }

    // ==========================================
    // 3. ATTENDANCE (ASISTENCIA) ENDPOINTS
    // ==========================================
    @GetMapping("/attendance")
    public ResponseEntity<?> getAttendanceDay(@RequestParam("fecha") String fechaStr) {
        try {
            Date dateVal = Date.valueOf(fechaStr);
            List<Map<String, Object>> list = jdbcTemplate.queryForList(
                "SELECT t.id as trabajador_id, t.nombre, t.apellido, t.rol_operativo, " +
                "a.id as asistencia_id, a.hora_entrada, a.hora_salida, a.estado, a.notas, a.pago_id " +
                "FROM trabajadores t " +
                "LEFT JOIN asistencia a ON t.id = a.trabajador_id AND a.fecha = ? " +
                "WHERE t.estado = 'Activo' " +
                "ORDER BY t.nombre ASC",
                dateVal
            );
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al consultar asistencia: " + e.getMessage()));
        }
    }

    @PostMapping("/attendance/save")
    @Transactional
    public ResponseEntity<?> saveAttendance(@RequestBody SaveAttendanceListRequest req) {
        try {
            if (req.fecha == null || req.fecha.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "La fecha es obligatoria."));
            }
            Date dateVal = Date.valueOf(req.fecha);

            for (SaveAttendanceRecord item : req.records) {
                // Check overlap with processed payment to avoid override
                Integer isPaid = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM asistencia WHERE trabajador_id = ? AND fecha = ? AND pago_id IS NOT NULL",
                    Integer.class, item.trabajador_id, dateVal
                );
                if (isPaid != null && isPaid > 0) {
                    continue; // Skip paid attendance records
                }

                jdbcTemplate.update(
                    "INSERT INTO asistencia (trabajador_id, fecha, hora_entrada, hora_salida, estado, notas) " +
                    "VALUES (?, ?, ?, ?, ?, ?) " +
                    "ON CONFLICT (trabajador_id, fecha) DO UPDATE SET " +
                    "hora_entrada = EXCLUDED.hora_entrada, " +
                    "hora_salida = EXCLUDED.hora_salida, " +
                    "estado = EXCLUDED.estado, " +
                    "notas = EXCLUDED.notas",
                    item.trabajador_id, dateVal, item.hora_entrada, item.hora_salida, item.estado, item.notas
                );
            }
            return ResponseEntity.ok(Map.of("message", "Asistencia guardada correctamente."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al registrar asistencia: " + e.getMessage()));
        }
    }

    @GetMapping("/attendance/monthly")
    public ResponseEntity<?> getAttendanceMonthly(@RequestParam("mes") int mes, @RequestParam("anio") int anio) {
        try {
            // Returns list of workers and their attendance records for the target month
            List<Map<String, Object>> staff = jdbcTemplate.queryForList(
                "SELECT id, nombre, apellido, rol_operativo FROM trabajadores WHERE estado = 'Activo' ORDER BY nombre ASC"
            );
            List<Map<String, Object>> records = jdbcTemplate.queryForList(
                "SELECT trabajador_id, fecha, estado, hora_entrada, hora_salida, notas " +
                "FROM asistencia " +
                "WHERE EXTRACT(MONTH FROM fecha) = ? AND EXTRACT(YEAR FROM fecha) = ?",
                mes, anio
            );
            return ResponseEntity.ok(Map.of("staff", staff, "records", records));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al obtener asistencia mensual: " + e.getMessage()));
        }
    }

    // ==========================================
    // 4. PAYROLL ENGINE & CALCULATIONS
    // ==========================================
    @GetMapping("/calculate")
    public ResponseEntity<?> calculatePayroll(
            @RequestParam("desde") String desdeStr,
            @RequestParam("hasta") String hastaStr,
            @RequestParam("frecuencia") String frecuencia) {
        try {
            LocalDate start = LocalDate.parse(desdeStr);
            LocalDate end = LocalDate.parse(hastaStr);
            long daysCount = ChronoUnit.DAYS.between(start, end) + 1;

            String sql = "SELECT * FROM trabajadores WHERE estado = 'Activo'";
            List<Map<String, Object>> staff;
            if (frecuencia != null && !"all".equalsIgnoreCase(frecuencia)) {
                sql += " AND frecuencia_pago = ?";
                staff = jdbcTemplate.queryForList(sql, frecuencia);
            } else {
                staff = jdbcTemplate.queryForList(sql);
            }

            List<Map<String, Object>> results = new ArrayList<>();

            for (Map<String, Object> s : staff) {
                Long workerId = ((Number) s.get("id")).longValue();
                String freq = (String) s.get("frecuencia_pago");
                double sueldoBase = ((Number) s.get("sueldo_base")).doubleValue();
                double valorDia = sueldoBase / 30.0; // Peru standard divisor

                long calcDays = daysCount;
                int startDay = start.getDayOfMonth();
                int endDay = end.getDayOfMonth();
                boolean isLastDayOfMonth = end.getDayOfMonth() == end.lengthOfMonth();

                if ("Mensual".equalsIgnoreCase(freq) || "Quincenal".equalsIgnoreCase(freq)) {
                    if (startDay == 1 && isLastDayOfMonth) calcDays = 30;
                    else if (startDay == 1 && endDay == 15) calcDays = 15;
                    else if (startDay == 16 && isLastDayOfMonth) calcDays = 15;
                }

                // 1. Attendance aggregation
                Map<String, Object> att = getWorkerAttendanceSummary(workerId, start, end);
                int presentDays = ((Number) att.get("dias_presente")).intValue();
                int absentDays = ((Number) att.get("dias_falta")).intValue();
                int lateDays = ((Number) att.get("dias_tardanza")).intValue();
                int totalRegistered = ((Number) att.get("total_registrados")).intValue();

                // 2. Base Wage Calculation
                double familiarAllowance = s.get("tiene_hijos") != null && (boolean) s.get("tiene_hijos") ? (RMV * 0.10) : 0.0;
                double sueldoMonto = 0.0;
                double allowanceProp = 0.0;

                if ("Mensual".equalsIgnoreCase(freq)) {
                    sueldoMonto = valorDia * calcDays;
                    allowanceProp = (familiarAllowance / 30.0) * calcDays;
                } else if ("Quincenal".equalsIgnoreCase(freq)) {
                    if (startDay == 1 && endDay == 15) {
                        sueldoMonto = sueldoBase * 0.50; // Flat advance 50%
                        allowanceProp = 0.0;
                    } else if (startDay >= 16 && isLastDayOfMonth) {
                        sueldoMonto = sueldoBase;
                        allowanceProp = familiarAllowance;
                    } else {
                        sueldoMonto = valorDia * calcDays;
                        allowanceProp = (familiarAllowance / 30.0) * calcDays;
                    }
                } else if ("Semanal".equalsIgnoreCase(freq)) {
                    // Lógica Dominical: 6 days worked + 1 proportional dominical day
                    int payableDays = Math.max(0, 6 - absentDays);
                    double dominicalRatio = payableDays / 6.0;
                    sueldoMonto = (valorDia * payableDays) + (valorDia * dominicalRatio);
                    allowanceProp = (familiarAllowance / 30.0) * 7.0;
                    absentDays = 0; // Handled under Dominical logic
                }

                double grossEarnings = sueldoMonto + allowanceProp;
                double absentDeduction = (!"Semanal".equalsIgnoreCase(freq)) ? (valorDia * absentDays) : 0.0;
                double taxableIncome = grossEarnings - absentDeduction;

                // 3. Tax / Retenciones (Pension & Quinta)
                double pensionDeduction = 0.0;
                double quintaDeduction = 0.0;
                String pensionDetail = "ONP (13%)";

                if (s.get("paga_ley") != null && (boolean) s.get("paga_ley")) {
                    String pensionRegime = (String) s.get("regimen_pension");
                    if ("ONP".equalsIgnoreCase(pensionRegime)) {
                        pensionDeduction = taxableIncome * 0.13;
                    } else if ("AFP".equalsIgnoreCase(pensionRegime) && s.get("afp_id") != null) {
                        Integer afpId = (Integer) s.get("afp_id");
                        Map<String, Object> afp = getAfpData(afpId);
                        if (afp != null) {
                            String afpName = (String) afp.get("nombre");
                            double comision = "Flujo".equalsIgnoreCase((String) s.get("tipo_comision_afp")) ? 
                                ((Number) afp.get("comision_flujo")).doubleValue() : 
                                ((Number) afp.get("comision_mixta")).doubleValue();
                            double seguro = ((Number) afp.get("prima_seguro")).doubleValue();
                            double obligatorio = ((Number) afp.get("aporte_obligatorio")).doubleValue();
                            double totalRate = obligatorio + seguro + comision;
                            
                            pensionDeduction = taxableIncome * totalRate;
                            pensionDetail = "AFP " + afpName + " (" + String.format("%.2f", totalRate * 100) + "%)";
                        }
                    }

                    // Fifth category (Quinta) calculation (Simplified)
                    double annualProjection = taxableIncome * 14.0;
                    double taxableAnnualBase = annualProjection - (7.0 * UIT);
                    if (taxableAnnualBase > 0) {
                        double annualTax = 0.0;
                        double bracket1Max = 5.0 * UIT;
                        if (taxableAnnualBase <= bracket1Max) {
                            annualTax = taxableAnnualBase * 0.08;
                        } else {
                            annualTax = bracket1Max * 0.08;
                            taxableAnnualBase -= bracket1Max;
                            annualTax += taxableAnnualBase * 0.14;
                        }
                        quintaDeduction = annualTax / 12.0;
                    }

                    // First fortnight has no retenciones under standard quincenal
                    if ("Quincenal".equalsIgnoreCase(freq) && startDay == 1 && endDay == 15) {
                        pensionDeduction = 0.0;
                        quintaDeduction = 0.0;
                    }
                }

                // 4. Other deductions (Lateness and Advances)
                double latenessRate = s.get("monto_tardanza") != null ? ((Number) s.get("monto_tardanza")).doubleValue() : 0.0;
                double lateDeduction = lateDays * latenessRate;

                // Overlap payment check
                Long overlapPaymentId = getOverlapPaymentId(workerId, start, end);
                double advancesDeduction = 0.0;

                if (overlapPaymentId != null) {
                    advancesDeduction = jdbcTemplate.queryForObject(
                        "SELECT COALESCE(SUM(monto_adelantos), 0) FROM pagos_nominas WHERE id = ?",
                        Double.class, overlapPaymentId
                    );
                } else {
                    advancesDeduction = jdbcTemplate.queryForObject(
                        "SELECT COALESCE(SUM(monto), 0) FROM adelantos WHERE trabajador_id = ? AND estado = 'Pendiente' AND fecha <= ?",
                        Double.class, workerId, Date.valueOf(end)
                    );
                }

                // 5. Total consolidation
                double netWage = grossEarnings - (absentDeduction + pensionDeduction + quintaDeduction + lateDeduction + advancesDeduction);

                // Quincena 2 Consolidation adjustment: deduct Quincena 1 net wage
                if ("Quincenal".equalsIgnoreCase(freq) && startDay >= 16) {
                    double quincena1Paid = getPayrollPaidAmount(workerId, start.withDayOfMonth(1), start.withDayOfMonth(15));
                    netWage -= quincena1Paid;
                }

                // Employer base / Essalud
                double essaludBase = Math.max(taxableIncome, RMV);
                double essaludAporte = s.get("paga_ley") != null && (boolean) s.get("paga_ley") ? (essaludBase * TASA_ESSALUD) : 0.0;

                Map<String, Object> payrollEntry = new HashMap<>();
                payrollEntry.put("trabajador_id", workerId);
                payrollEntry.put("nombre_completo", s.get("nombre") + " " + s.get("apellido"));
                payrollEntry.put("rol", s.get("rol_operativo"));
                payrollEntry.put("frecuencia", freq);
                payrollEntry.put("dias_registrados", totalRegistered);
                payrollEntry.put("dias_pago", calcDays);
                payrollEntry.put("monto_base", sueldoMonto);
                payrollEntry.put("asig_familiar", allowanceProp);
                payrollEntry.put("descuento_faltas", absentDeduction);
                payrollEntry.put("descuento_tardanza", lateDeduction);
                payrollEntry.put("adelantos", advancesDeduction);
                payrollEntry.put("retencion_pension", pensionDeduction);
                payrollEntry.put("retencion_quinta", quintaDeduction);
                payrollEntry.put("total_pagar", Math.max(0.0, netWage));
                payrollEntry.put("pago_id", overlapPaymentId);
                
                Map<String, Object> meta = new HashMap<>();
                meta.put("ingreso_bruto", grossEarnings);
                meta.put("asig_familiar", allowanceProp);
                meta.put("retencion_pension", pensionDeduction);
                meta.put("retencion_quinta", quintaDeduction);
                meta.put("aporte_essalud", essaludAporte);
                meta.put("regimen", s.get("regimen_pension"));
                meta.put("detalles_pension", pensionDetail);
                payrollEntry.put("metadata", meta);

                results.add(payrollEntry);
            }

            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al procesar cálculo de planillas: " + e.getMessage()));
        }
    }

    private Map<String, Object> getWorkerAttendanceSummary(Long workerId, LocalDate start, LocalDate end) {
        String sql = "SELECT " +
                     "    COALESCE(SUM(CASE WHEN estado = 'Presente' THEN 1 ELSE 0 END), 0) as dias_presente, " +
                     "    COALESCE(SUM(CASE WHEN estado = 'Falta' THEN 1 ELSE 0 END), 0) as dias_falta, " +
                     "    COALESCE(SUM(CASE WHEN estado = 'Tardanza' THEN 1 ELSE 0 END), 0) as dias_tardanza, " +
                     "    COALESCE(SUM(CASE WHEN estado = 'Permiso' THEN 1 ELSE 0 END), 0) as dias_permiso, " +
                     "    COALESCE(SUM(CASE WHEN estado = 'Vacaciones' THEN 1 ELSE 0 END), 0) as dias_vacaciones " +
                     "FROM asistencia " +
                     "WHERE trabajador_id = ? AND fecha BETWEEN ? AND ?";
        
        Map<String, Object> summary = jdbcTemplate.queryForMap(sql, workerId, Date.valueOf(start), Date.valueOf(end));
        int present = ((Number) summary.get("dias_presente")).intValue();
        int absent = ((Number) summary.get("dias_falta")).intValue();
        int late = ((Number) summary.get("dias_tardanza")).intValue();
        int permit = ((Number) summary.get("dias_permiso")).intValue();
        int vacs = ((Number) summary.get("dias_vacaciones")).intValue();

        Map<String, Object> res = new HashMap<>(summary);
        res.put("total_registrados", present + absent + late + permit + vacs);
        return res;
    }

    private Map<String, Object> getAfpData(Integer afpId) {
        try {
            return jdbcTemplate.queryForMap("SELECT * FROM afp_maestra WHERE id = ?", afpId);
        } catch (Exception e) {
            return null;
        }
    }

    private Long getOverlapPaymentId(Long workerId, LocalDate start, LocalDate end) {
        try {
            return jdbcTemplate.queryForObject(
                "SELECT id FROM pagos_nominas WHERE trabajador_id = ? AND estado != 'Anulado' AND periodo_inicio <= ? AND periodo_fin >= ?",
                Long.class, workerId, Date.valueOf(end), Date.valueOf(start)
            );
        } catch (Exception e) {
            return null;
        }
    }

    private double getPayrollPaidAmount(Long workerId, LocalDate start, LocalDate end) {
        try {
            Double val = jdbcTemplate.queryForObject(
                "SELECT SUM(monto_total) FROM pagos_nominas WHERE trabajador_id = ? AND estado != 'Anulado' AND periodo_inicio >= ? AND periodo_fin <= ?",
                Double.class, workerId, Date.valueOf(start), Date.valueOf(end)
            );
            return val != null ? val : 0.0;
        } catch (Exception e) {
            return 0.0;
        }
    }

    // ==========================================
    // 5. PROCESS PAYROLL PAYMENT
    // ==========================================
    @PostMapping("/process")
    @Transactional
    public ResponseEntity<?> processPayment(@RequestBody ProcessPaymentRequest req) {
        try {
            // Check double payment / overlap protection
            LocalDate start = LocalDate.parse(req.periodo_inicio);
            LocalDate end = LocalDate.parse(req.periodo_fin);
            Long overlapId = getOverlapPaymentId(req.trabajador_id, start, end);
            if (overlapId != null) {
                return ResponseEntity.badRequest().body(Map.of("message", "No se puede pagar doble. Se detectó una planilla previa (ID: " + overlapId + ")."));
            }

            // 1. Get workers info
            Map<String, Object> worker = jdbcTemplate.queryForMap("SELECT * FROM trabajadores WHERE id = ?", req.trabajador_id);
            String colabName = worker.get("nombre") + " " + worker.get("apellido");

            // 2. Fetch category for "Planilla de Personal"
            Integer catId = null;
            try {
                catId = jdbcTemplate.queryForObject("SELECT id FROM gastos_categorias WHERE nombre = 'Planilla de Personal' LIMIT 1", Integer.class);
            } catch (Exception ignored) {}
            if (catId == null) {
                jdbcTemplate.update("INSERT INTO gastos_categorias (nombre, tipo, grupo_contable, afecta_margen_bidon) VALUES ('Planilla de Personal', 'Fijo', 'RRHH', false)");
                catId = jdbcTemplate.queryForObject("SELECT lastval()", Integer.class);
            }

            // 3. Register Gasto (Expense) as Pendiente
            double totalDeductions = req.retencion_pension + req.retencion_quinta + req.descuento_tardanza + req.descuento_faltas + req.adelantos;
            StringBuilder details = new StringBuilder();
            if (req.retencion_pension > 0) details.append(" Pension: ").append(String.format("%.2f", req.retencion_pension));
            if (req.retencion_quinta > 0) details.append(" 5ta: ").append(String.format("%.2f", req.retencion_quinta));
            if (req.descuento_tardanza > 0) details.append(" Tard: ").append(String.format("%.2f", req.descuento_tardanza));
            if (req.adelantos > 0) details.append(" Adel: ").append(String.format("%.2f", req.adelantos));

            String strDeductions = details.length() > 0 ? " | Dsctos: S/ " + String.format("%.2f", totalDeductions) + " (" + details.toString().trim() + ")" : " | Sin descuentos";
            String descGasto = "Pago Planilla | Colab: " + colabName + " | Periodo: " + req.periodo_inicio + " al " + req.periodo_fin + strDeductions;

            jdbcTemplate.update(
                "INSERT INTO gastos (categoria_id, fecha_gasto, numero_comprobante, tipo_comprobante, descripcion, cantidad, costo_unitario, monto_total, estado_pago, metodo_pago) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente', 'Transferencia')",
                catId, Date.valueOf(LocalDate.now()), "PLAN-" + req.trabajador_id + "-" + System.currentTimeMillis() % 100000, "Ninguno",
                descGasto, 1.0, req.total_pagar, req.total_pagar
            );
            Long gastoId = jdbcTemplate.queryForObject("SELECT lastval()", Long.class);

            // 4. Insert pagos_nominas
            double sumDeductionsNoAdelantos = req.retencion_pension + req.retencion_quinta + req.descuento_tardanza + req.descuento_faltas;
            jdbcTemplate.update(
                "INSERT INTO pagos_nominas (trabajador_id, gasto_id, periodo_inicio, periodo_fin, frecuencia, monto_base, monto_comisiones, monto_descuentos, monto_adelantos, monto_total, estado, metadata) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente', ?)",
                req.trabajador_id, gastoId, Date.valueOf(start), Date.valueOf(end), req.frecuencia,
                req.monto_base, 0.0, sumDeductionsNoAdelantos, req.adelantos, req.total_pagar, "{}"
            );
            Long pagoId = jdbcTemplate.queryForObject("SELECT lastval()", Long.class);

            // 5. Link attendance records to this payment
            jdbcTemplate.update(
                "UPDATE asistencia SET pago_id = ? WHERE trabajador_id = ? AND fecha BETWEEN ? AND ?",
                pagoId, req.trabajador_id, Date.valueOf(start), Date.valueOf(end)
            );

            // 6. Consume/discount salary advances
            if (req.adelantos > 0) {
                List<Map<String, Object>> advances = jdbcTemplate.queryForList(
                    "SELECT * FROM adelantos WHERE trabajador_id = ? AND estado = 'Pendiente' AND fecha <= ? ORDER BY fecha ASC, id ASC",
                    req.trabajador_id, Date.valueOf(end)
                );
                double applied = 0.0;
                for (Map<String, Object> adv : advances) {
                    double remaining = req.adelantos - applied;
                    if (remaining <= 0) break;

                    Long advId = ((Number) adv.get("id")).longValue();
                    double advAmount = ((Number) adv.get("monto")).doubleValue();

                    if (advAmount <= remaining) {
                        jdbcTemplate.update("UPDATE adelantos SET estado = 'Descontado' WHERE id = ?", advId);
                        applied += advAmount;
                    } else {
                        // Partial discount
                        jdbcTemplate.update(
                            "UPDATE adelantos SET monto = ?, estado = 'Descontado', notas = CONCAT(COALESCE(notas,''), ' | Descuento Parcial') WHERE id = ?",
                            remaining, advId
                        );
                        double remainder = advAmount - remaining;
                        jdbcTemplate.update(
                            "INSERT INTO adelantos (trabajador_id, gasto_id, fecha, monto, notas, estado) VALUES (?, ?, ?, ?, ?, 'Pendiente')",
                            adv.get("trabajador_id"), adv.get("gasto_id"), adv.get("fecha"), remainder, "Saldo de adelanto previo"
                        );
                        applied += remaining;
                    }
                }
            }

            return ResponseEntity.ok(Map.of("message", "Nómina procesada con éxito en estado Pendiente. Se generó el gasto asociado."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al procesar pago de planilla: " + e.getMessage()));
        }
    }

    @PostMapping("/cancel-payment")
    @Transactional
    public ResponseEntity<?> cancelPayment(@RequestBody Map<String, Long> payload) {
        try {
            Long pagoId = payload.get("pago_id");
            if (pagoId == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "El id del pago es obligatorio."));
            }

            Map<String, Object> pago = jdbcTemplate.queryForMap("SELECT * FROM pagos_nominas WHERE id = ?", pagoId);
            if ("Anulado".equalsIgnoreCase((String) pago.get("estado"))) {
                return ResponseEntity.badRequest().body(Map.of("message", "Esta planilla ya se encuentra anulada."));
            }

            // 1. Anull expense
            Long gastoId = pago.get("gasto_id") != null ? ((Number) pago.get("gasto_id")).longValue() : null;
            if (gastoId != null) {
                jdbcTemplate.update("UPDATE gastos SET estado_pago = 'Anulado', descripcion = CONCAT(descripcion, ' | Pago Planilla Anulado') WHERE id = ?", gastoId);
            }

            // 2. Free attendance records
            jdbcTemplate.update("UPDATE asistencia SET pago_id = NULL WHERE pago_id = ?", pagoId);

            // 3. Restore advances
            double advancesDeducted = ((Number) pago.get("monto_adelantos")).doubleValue();
            if (advancesDeducted > 0) {
                jdbcTemplate.update(
                    "UPDATE adelantos SET estado = 'Pendiente' WHERE trabajador_id = ? AND estado = 'Descontado' AND fecha <= ?",
                    pago.get("trabajador_id"), pago.get("periodo_fin")
                );
            }

            // 4. Update status
            jdbcTemplate.update("UPDATE pagos_nominas SET estado = 'Anulado' WHERE id = ?", pagoId);

            return ResponseEntity.ok(Map.of("message", "Pago de planilla anulado y asistencias liberadas con éxito."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al anular pago de planilla: " + e.getMessage()));
        }
    }

    // ==========================================
    // 6. SALARY ADVANCES (ADELANTOS) CRUD
    // ==========================================
    @GetMapping("/advances")
    public ResponseEntity<?> getAdvances() {
        try {
            List<Map<String, Object>> list = jdbcTemplate.queryForList(
                "SELECT a.*, CONCAT(t.nombre, ' ', t.apellido) as colab_name " +
                "FROM adelantos a " +
                "JOIN trabajadores t ON a.trabajador_id = t.id " +
                "WHERE a.estado = 'Pendiente' " +
                "ORDER BY a.fecha DESC"
            );
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al obtener adelantos: " + e.getMessage()));
        }
    }

    @PostMapping("/advances/save")
    @Transactional
    public ResponseEntity<?> saveAdvance(@RequestBody SaveAdvanceRequest req) {
        try {
            if (req.trabajador_id == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "El colaborador es obligatorio."));
            }
            if (req.monto == null || req.monto <= 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "El monto del adelanto debe ser mayor a 0."));
            }
            if (req.fecha == null || req.fecha.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "La fecha es obligatoria."));
            }

            // Fetch default category for salary advances
            Integer catId = null;
            try {
                catId = jdbcTemplate.queryForObject("SELECT id FROM gastos_categorias WHERE nombre = 'Adelanto de Sueldo' LIMIT 1", Integer.class);
            } catch (Exception ignored) {}
            if (catId == null) {
                jdbcTemplate.update("INSERT INTO gastos_categorias (nombre, tipo, grupo_contable, afecta_margen_bidon) VALUES ('Adelanto de Sueldo', 'Fijo', 'RRHH', false)");
                catId = jdbcTemplate.queryForObject("SELECT lastval()", Integer.class);
            }

            String colabName = jdbcTemplate.queryForObject(
                "SELECT CONCAT(nombre, ' ', apellido) FROM trabajadores WHERE id = ?",
                String.class, req.trabajador_id
            );
            String descGasto = "Adelanto de Sueldo | Colab: " + colabName + " | Notas: " + (req.notas != null ? req.notesOrNotas() : "");

            boolean isEdit = req.id != null;
            if (isEdit) {
                Map<String, Object> adv = jdbcTemplate.queryForMap("SELECT * FROM adelantos WHERE id = ?", req.id);
                Long expId = adv.get("gasto_id") != null ? ((Number) adv.get("gasto_id")).longValue() : null;
                if (expId != null) {
                    jdbcTemplate.update(
                        "UPDATE gastos SET monto_total = ?, costo_unitario = ?, fecha_gasto = ?, descripcion = ? WHERE id = ?",
                        req.monto, req.monto, Date.valueOf(req.fecha), descGasto, expId
                    );
                }
                jdbcTemplate.update(
                    "UPDATE adelantos SET trabajador_id = ?, fecha = ?, monto = ?, notas = ? WHERE id = ?",
                    req.trabajador_id, Date.valueOf(req.fecha), req.monto, req.notesOrNotas(), req.id
                );
                return ResponseEntity.ok(Map.of("message", "Adelanto de sueldo actualizado correctamente."));
            } else {
                // Register Gasto associated to the advance payout (marked as Pagado)
                jdbcTemplate.update(
                    "INSERT INTO gastos (categoria_id, fecha_gasto, numero_comprobante, tipo_comprobante, descripcion, cantidad, costo_unitario, monto_total, estado_pago, metodo_pago) " +
                    "VALUES (?, ?, ?, ?, ?, 1.0, ?, ?, 'Pagado', 'Efectivo')",
                    catId, Date.valueOf(req.fecha), "ADE-" + req.trabajador_id + "-" + System.currentTimeMillis() % 100000, "Ninguno",
                    descGasto, req.monto, req.monto
                );
                Long newGastoId = jdbcTemplate.queryForObject("SELECT lastval()", Long.class);

                // Add Cash Outflow (Egreso) in caja_movimientos
                Integer defaultUserId = 1;
                try {
                    defaultUserId = jdbcTemplate.queryForObject("SELECT id FROM users LIMIT 1", Integer.class);
                } catch (Exception ignored) {}

                jdbcTemplate.update(
                    "INSERT INTO caja_movimientos (tipo, categoria, monto, metodo_pago, referencia_id, tabla_referencia, notas, usuario_id, fecha) " +
                    "VALUES ('Egreso', 'Gasto', ?, 'Efectivo', ?, 'gastos', ?, ?, ?)",
                    req.monto, newGastoId, descGasto, defaultUserId, new java.sql.Timestamp(System.currentTimeMillis())
                );

                jdbcTemplate.update(
                    "INSERT INTO adelantos (trabajador_id, gasto_id, fecha, monto, notas, estado) VALUES (?, ?, ?, ?, ?, 'Pendiente')",
                    req.trabajador_id, newGastoId, Date.valueOf(req.fecha), req.monto, req.notesOrNotas()
                );
                return ResponseEntity.ok(Map.of("message", "Adelanto registrado correctamente y egreso de caja generado."));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al guardar adelanto de sueldo: " + e.getMessage()));
        }
    }

    @DeleteMapping("/advances/{id}")
    @Transactional
    public ResponseEntity<?> deleteAdvance(@PathVariable Long id) {
        try {
            Map<String, Object> adv = jdbcTemplate.queryForMap("SELECT * FROM adelantos WHERE id = ?", id);
            Long expId = adv.get("gasto_id") != null ? ((Number) adv.get("gasto_id")).longValue() : null;

            if (expId != null) {
                // Delete associated cash flow
                jdbcTemplate.update("DELETE FROM caja_movimientos WHERE referencia_id = ? AND tabla_referencia = 'gastos'", expId);
                // Anull or delete expense
                jdbcTemplate.update("DELETE FROM gastos WHERE id = ?", expId);
            }
            jdbcTemplate.update("DELETE FROM adelantos WHERE id = ?", id);
            return ResponseEntity.ok(Map.of("message", "Adelanto de sueldo eliminado correctamente."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al eliminar adelanto: " + e.getMessage()));
        }
    }


    // ==========================================
    // DTO REQUESTS CLASSES
    // ==========================================
    public static class SaveWorkerRequest {
        public Long id;
        public Integer usuario_id;
        public String nombre;
        public String apellido;
        public String dni;
        public String telefono;
        public String rol_operativo;
        public Double sueldo_base;
        public String frecuencia_pago;
        public Double monto_tardanza;
        public Boolean tiene_hijos = false;
        public Boolean paga_ley = true;
        public String regimen_pension = "ONP";
        public Integer afp_id;
        public String tipo_comision_afp = "Flujo";
        public Boolean paga_comision = false;
        public Double monto_comision_bidon = 0.0;
        public String vehiculo_placa;
        public String vehiculo_marca;
        public String vehiculo_modelo;
        public Double vehiculo_capacidad = 0.0;
        public String linea_movil;
        public String cuenta_bancaria;
        public String banco_nombre;
        public String estado = "Activo";
        public String fecha_ingreso;
    }

    public static class SaveAttendanceListRequest {
        public String fecha;
        public List<SaveAttendanceRecord> records;
    }

    public static class SaveAttendanceRecord {
        public Long trabajador_id;
        public String hora_entrada;
        public String hora_salida;
        public String estado;
        public String notas;
    }

    public static class ProcessPaymentRequest {
        public Long trabajador_id;
        public String periodo_inicio;
        public String periodo_fin;
        public String frecuencia;
        public Double monto_base;
        public Double retencion_pension;
        public Double retencion_quinta;
        public Double descuento_tardanza;
        public Double descuento_faltas;
        public Double adelantos;
        public Double total_pagar;
    }

    public static class SaveAdvanceRequest {
        public Long id;
        public Long trabajador_id;
        public Double monto;
        public String fecha;
        public String notas;
        public String notes; // alias fallback

        public String notesOrNotas() {
            if (notas != null && !notas.trim().isEmpty()) return notas;
            if (notes != null && !notes.trim().isEmpty()) return notes;
            return "";
        }
    }
}
