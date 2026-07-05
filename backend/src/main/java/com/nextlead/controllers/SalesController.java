package com.nextlead.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/sales")
public class SalesController {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public SalesController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // ==========================================
    // 1. GET SALES LIST
    // ==========================================
    @GetMapping
    public ResponseEntity<?> getSalesList() {
        try {
            String sql = 
                "SELECT v.*, " +
                "       COALESCE(c.razon_social, CONCAT(c.nombres, ' ', c.apellidos)) as cliente_nombre_completo, " +
                "       c.numero_documento, " +
                "       (SELECT string_agg(CONCAT(vd.cantidad, 'x ', p.nombre), ', ') " +
                "        FROM venta_detalles vd " +
                "        JOIN productos p ON vd.producto_id = p.id " +
                "        WHERE vd.venta_id = v.id) as productos_detalle " +
                "FROM ventas v " +
                "LEFT JOIN contacts c ON v.contacto_id = c.id " +
                "ORDER BY v.fecha_venta DESC, v.id DESC";
            
            List<Map<String, Object>> sales = jdbcTemplate.queryForList(sql);
            return ResponseEntity.ok(sales);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al obtener lista de ventas: " + e.getMessage()));
        }
    }

    // ==========================================
    // 2. GET SALES DETAILED ITEMS REPORT
    // ==========================================
    @GetMapping("/report/detailed")
    public ResponseEntity<?> getDetailedItemsReport() {
        try {
            String sql = 
                "SELECT v.numero_venta, v.fecha_venta, v.estado, v.metodo_pago, v.estado_pago, " +
                "       COALESCE(c.razon_social, CONCAT(c.nombres, ' ', c.apellidos)) as cliente_nombre_completo, " +
                "       p.nombre as producto_nombre, p.es_pack, cat.nombre as categoria_nombre, " +
                "       vd.cantidad, vd.precio_unitario, vd.subtotal, " +
                "       CONCAT(d.nombre, ' ', d.apellido) as chofer_nombre, " +
                "       ped.numero_pedido, ped.fecha_entrega as pedido_fecha_entrega, " +
                "       ped.direccion_entrega, z.nombre as zona_nombre, " +
                "       ped.prioridad, ped.tipo_envio, ped.notas as pedido_notas " +
                "FROM venta_detalles vd " +
                "JOIN ventas v ON vd.venta_id = v.id " +
                "JOIN productos p ON vd.producto_id = p.id " +
                "LEFT JOIN categorias_producto cat ON p.categoria_id = cat.id " +
                "LEFT JOIN contacts c ON v.contacto_id = c.id " +
                "LEFT JOIN pedidos ped ON v.id = ped.venta_id " +
                "LEFT JOIN conductores d ON ped.chofer_id = d.id " +
                "LEFT JOIN zonas z ON ped.zona = z.id " +
                "ORDER BY v.fecha_venta DESC, v.id DESC";
            
            return ResponseEntity.ok(jdbcTemplate.queryForList(sql));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al obtener reporte detallado: " + e.getMessage()));
        }
    }

    // ==========================================
    // 3. GET COMPOSITIONS & METADATA FOR BOTTLES
    // ==========================================
    @GetMapping("/compositions")
    public ResponseEntity<?> getCompositions() {
        try {
            String sql = 
                "SELECT pc.producto_padre_id, pc.producto_hijo_id, pc.cantidad, " +
                "       ph.requiere_retorno, ph.categoria_id " +
                "FROM producto_composicion pc " +
                "JOIN productos ph ON pc.producto_hijo_id = ph.id";
            List<Map<String, Object>> compositions = jdbcTemplate.queryForList(sql);
            return ResponseEntity.ok(Map.of("compositions", compositions));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al obtener composiciones: " + e.getMessage()));
        }
    }

    // ==========================================
    // 4. GET SALES ANALYTICS & DASHBOARD DATA
    // ==========================================
    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics(
            @RequestParam(required = false) String desde,
            @RequestParam(required = false) String hasta,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String categoria_id,
            @RequestParam(required = false) String producto_id,
            @RequestParam(required = false) String estado_pago) {
        
        try {
            List<String> whereClauses = new ArrayList<>();
            List<Object> params = new ArrayList<>();

            whereClauses.add("v.estado NOT IN ('cancelada', 'anulada')");

            if (desde != null && !desde.isEmpty()) {
                whereClauses.add("DATE(v.fecha_venta) >= ?");
                params.add(java.sql.Date.valueOf(desde));
            }
            if (hasta != null && !hasta.isEmpty()) {
                whereClauses.add("DATE(v.fecha_venta) <= ?");
                params.add(java.sql.Date.valueOf(hasta));
            }
            if (search != null && !search.isEmpty()) {
                String likeTerm = "%" + search + "%";
                whereClauses.add("(v.numero_venta LIKE ? OR c.razon_social LIKE ? OR c.nombres LIKE ? OR p.nombre LIKE ?)");
                params.add(likeTerm);
                params.add(likeTerm);
                params.add(likeTerm);
                params.add(likeTerm);
            }
            if (categoria_id != null && !categoria_id.isEmpty() && !categoria_id.equals("all")) {
                whereClauses.add("p.categoria_id = ?");
                params.add(Integer.parseInt(categoria_id));
            }
            if (producto_id != null && !producto_id.isEmpty() && !producto_id.equals("all")) {
                whereClauses.add("p.id = ?");
                params.add(Integer.parseInt(producto_id));
            }
            if (estado_pago != null && !estado_pago.isEmpty() && !estado_pago.equals("all")) {
                whereClauses.add("v.estado_pago = ?");
                params.add(estado_pago);
            }

            String where = String.join(" AND ", whereClauses);

            // DATA 1: Distribution by Product
            String sqlProducts = 
                "SELECT p.nombre, SUM(vd.cantidad) as total_cantidad, SUM(vd.subtotal) as total_monto " +
                "FROM venta_detalles vd " +
                "JOIN ventas v ON vd.venta_id = v.id " +
                "JOIN productos p ON vd.producto_id = p.id " +
                "LEFT JOIN contacts c ON v.contacto_id = c.id " +
                "WHERE " + where + " " +
                "GROUP BY p.id, p.nombre " +
                "ORDER BY total_monto DESC";
            List<Map<String, Object>> byProduct = jdbcTemplate.queryForList(sqlProducts, params.toArray());

            // DATA 2: Trend Monthly
            String sqlTrend = 
                "SELECT EXTRACT(MONTH FROM v.fecha_venta) as mes, COUNT(DISTINCT v.id) as total_ventas, SUM(v.total) as monto_total " +
                "FROM ventas v " +
                "JOIN venta_detalles vd ON vd.venta_id = v.id " +
                "JOIN productos p ON vd.producto_id = p.id " +
                "LEFT JOIN contacts c ON v.contacto_id = c.id " +
                "WHERE " + where + " " +
                "GROUP BY EXTRACT(MONTH FROM v.fecha_venta) " +
                "ORDER BY mes ASC";
            List<Map<String, Object>> trend = jdbcTemplate.queryForList(sqlTrend, params.toArray());

            // DATA 3: Hierarchical Summary (Category -> Product)
            String sqlDetailed = 
                "SELECT cat.nombre as categoria_nombre, p.nombre as producto_nombre, " +
                "       SUM(vd.cantidad) as cantidad_vendida, SUM(vd.subtotal) as total_monto " +
                "FROM venta_detalles vd " +
                "JOIN ventas v ON vd.venta_id = v.id " +
                "JOIN productos p ON vd.producto_id = p.id " +
                "LEFT JOIN categorias_producto cat ON p.categoria_id = cat.id " +
                "LEFT JOIN contacts c ON v.contacto_id = c.id " +
                "WHERE " + where + " " +
                "GROUP BY cat.id, cat.nombre, p.id, p.nombre " +
                "ORDER BY categoria_nombre ASC, total_monto DESC";
            List<Map<String, Object>> detailed = jdbcTemplate.queryForList(sqlDetailed, params.toArray());

            // DATA 4: Distribution by Seller (User)
            String sqlUsers = 
                "SELECT CONCAT(u.first_name, ' ', u.last_name) as nombre, COUNT(DISTINCT v.id) as total_ventas, SUM(v.total) as monto_total " +
                "FROM ventas v " +
                "JOIN users u ON v.usuario_id = u.id " +
                "JOIN venta_detalles vd ON vd.venta_id = v.id " +
                "JOIN productos p ON vd.producto_id = p.id " +
                "LEFT JOIN contacts c ON v.contacto_id = c.id " +
                "WHERE " + where + " " +
                "GROUP BY u.id, u.first_name, u.last_name " +
                "ORDER BY monto_total DESC";
            List<Map<String, Object>> byUser = jdbcTemplate.queryForList(sqlUsers, params.toArray());

            // DATA 5: Daily Trend
            String sqlDaily = 
                "SELECT DATE(v.fecha_venta) as fecha, COUNT(DISTINCT v.id) as total_ventas, SUM(v.total) as monto_total " +
                "FROM ventas v " +
                "JOIN venta_detalles vd ON vd.venta_id = v.id " +
                "JOIN productos p ON vd.producto_id = p.id " +
                "LEFT JOIN contacts c ON v.contacto_id = c.id " +
                "WHERE " + where + " " +
                "GROUP BY DATE(v.fecha_venta) " +
                "ORDER BY fecha ASC";
            List<Map<String, Object>> dailyTrend = jdbcTemplate.queryForList(sqlDaily, params.toArray());

            return ResponseEntity.ok(Map.of(
                "byProduct", byProduct,
                "trend", trend,
                "detailed", detailed,
                "byUser", byUser,
                "dailyTrend", dailyTrend
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al procesar analíticas de ventas: " + e.getMessage()));
        }
    }

    // ==========================================
    // 5. CREATE / SAVE SALES DRAFT OR DIRECT SALE (ALIGNED WITH PHP LOGIC)
    // ==========================================
    @PostMapping("/save")
    @Transactional
    public ResponseEntity<?> saveSale(@RequestBody SaveSaleRequest req) {
        try {
            if (req.contacto_id == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "El cliente/contacto es obligatorio."));
            }
            if (req.items == null || req.items.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "La venta debe contener al menos un producto."));
            }

            boolean isEdit = req.id != null;
            Long ventaId;
            String numeroVenta;

            Integer defaultUserId = 1;
            try {
                defaultUserId = jdbcTemplate.queryForObject("SELECT id FROM users LIMIT 1", Integer.class);
            } catch (Exception ignored) {}

            if (isEdit) {
                ventaId = req.id;
                // Fetch old sale to restore old stock & bottle balance
                Map<String, Object> oldSale = jdbcTemplate.queryForMap("SELECT * FROM ventas WHERE id = ?", req.id);
                numeroVenta = (String) oldSale.get("numero_venta");

                int oldImpact = ((Number) oldSale.get("bidones_entregados")).intValue() - ((Number) oldSale.get("bidones_recogidos")).intValue();
                if (oldImpact != 0) {
                    jdbcTemplate.update(
                        "UPDATE contacts SET bidones_prestados = COALESCE(bidones_prestados, 0) - ? WHERE id = ?",
                        oldImpact, oldSale.get("contacto_id")
                    );
                }

                // Restore old stock
                List<Map<String, Object>> oldItems = jdbcTemplate.queryForList("SELECT producto_id, cantidad FROM venta_detalles WHERE venta_id = ?", req.id);
                for (Map<String, Object> item : oldItems) {
                    int prodId = ((Number) item.get("producto_id")).intValue();
                    int cant = ((Number) item.get("cantidad")).intValue();
                    restoreProductStock(prodId, cant);
                }

                // Update sale details
                jdbcTemplate.update("DELETE FROM venta_detalles WHERE venta_id = ?", req.id);
                jdbcTemplate.update(
                    "UPDATE ventas SET contacto_id=?, fecha_venta=NOW(), subtotal=?, igv=?, total=?, estado=?, metodo_pago=?, estado_pago=?, monto_pagado=?, bidones_entregados=?, bidones_recogidos=?, notas=CONCAT(?, ' | ', COALESCE(notas,'')), direccion_entrega=? WHERE id=?",
                    req.contacto_id, req.subtotal, req.igv, req.total, req.estado, req.metodo_pago, req.estado_pago, req.monto_pagado, req.bidones_entregados, req.bidones_recogidos, req.notas, req.direccion_entrega, req.id
                );
            } else {
                // Generate sale number: V- + 6 characters
                String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                StringBuilder sb = new StringBuilder();
                Random rng = new Random();
                for (int i = 0; i < 6; i++) {
                    sb.append(chars.charAt(rng.nextInt(chars.length())));
                }
                numeroVenta = "V-" + sb.toString();

                String initialPaymentState = "completada".equalsIgnoreCase(req.estado) ? "pagado" : "pendiente";
                double finalPaidAmount = "completada".equalsIgnoreCase(req.estado) ? req.total : 0.0;

                jdbcTemplate.update(
                    "INSERT INTO ventas (contacto_id, usuario_id, numero_venta, fecha_venta, tipo_comprobante, subtotal, igv, total, monto_pagado, estado, estado_pago, metodo_pago, bidones_entregados, bidones_recogidos, notas, direccion_entrega) " +
                    "VALUES (?, ?, ?, NOW(), 'nota_venta', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    req.contacto_id, defaultUserId, numeroVenta, req.subtotal, req.igv, req.total, finalPaidAmount, req.estado, initialPaymentState, req.metodo_pago, req.bidones_entregados, req.bidones_recogidos, req.notas, req.direccion_entrega
                );
                ventaId = jdbcTemplate.queryForObject("SELECT lastval()", Long.class);
            }

            // Update Contact Status to 'Cliente'
            jdbcTemplate.update("UPDATE contacts SET status = 'Cliente' WHERE id = ?", req.contacto_id);

            // Apply new bottle balance impact
            int newImpact = req.bidones_entregados - req.bidones_recogidos;
            if (newImpact != 0) {
                jdbcTemplate.update(
                    "UPDATE contacts SET bidones_prestados = COALESCE(bidones_prestados, 0) + ? WHERE id = ?",
                    newImpact, req.contacto_id
                );

                // Audit logging to movimientos_envases
                Integer prevBalance = jdbcTemplate.queryForObject("SELECT COALESCE(bidones_prestados, 0) - ? FROM contacts WHERE id = ?", Integer.class, newImpact, req.contacto_id);
                if (prevBalance == null) prevBalance = 0;
                jdbcTemplate.update(
                    "INSERT INTO movimientos_envases (contacto_id, tipo, cantidad, saldo_anterior, saldo_posterior, usuario_id, venta_id, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    req.contacto_id, newImpact > 0 ? "Entrega" : "Recojo", Math.abs(newImpact), prevBalance, prevBalance + newImpact, defaultUserId, ventaId, "Venta Directa #" + numeroVenta
                );
            }

            // Insert details and deduct stock
            for (SaleDetailRequest item : req.items) {
                double sub = item.cantidad * item.precio_unitario;
                jdbcTemplate.update(
                    "INSERT INTO venta_detalles (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)",
                    ventaId, item.producto_id, item.cantidad, item.precio_unitario, sub
                );
                deductProductStock(item.producto_id, item.cantidad);
            }

            // LOGISTICS AUTOMATION: Create a linked Pedido in "Entregado" stage if registering a new sale
            if (!isEdit) {
                Integer entregadoStageId = null;
                try {
                    entregadoStageId = jdbcTemplate.queryForObject("SELECT id FROM etapas_pedido WHERE es_entregado = 1 ORDER BY orden ASC LIMIT 1", Integer.class);
                } catch (Exception ignored) {}

                if (entregadoStageId != null) {
                    // Generate order number: P- + 6 characters
                    String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                    StringBuilder sbOrder = new StringBuilder();
                    Random rng = new Random();
                    for (int i = 0; i < 6; i++) {
                        sbOrder.append(chars.charAt(rng.nextInt(chars.length())));
                    }
                    String numeroPedido = "P-" + sbOrder.toString();
                    String orderPaymentStatus = "completada".equalsIgnoreCase(req.estado) ? "Pagado" : "Pendiente";

                    jdbcTemplate.update(
                        "INSERT INTO pedidos (numero_pedido, contacto_id, venta_id, fecha_entrega, total, estado_pago, metodo_pago, envases_entregados, envases_devueltos, direccion_entrega, notas, etapa_id) " +
                        "VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, 'Venta Directa', ?)",
                        numeroPedido, req.contacto_id, ventaId, req.total, orderPaymentStatus, req.metodo_pago, req.bidones_entregados, req.bidones_recogidos, req.direccion_entrega, entregadoStageId
                    );
                    Long pedidoId = jdbcTemplate.queryForObject("SELECT lastval()", Long.class);

                    // Insert order details
                    for (SaleDetailRequest item : req.items) {
                        double sub = item.cantidad * item.precio_unitario;
                        jdbcTemplate.update(
                            "INSERT INTO pedido_detalles (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)",
                            pedidoId, item.producto_id, item.cantidad, item.precio_unitario
                        );
                    }
                }
            }

            // --- INTEGRATION WITH CASH FLOW (FINANCE) ---
            if ("completada".equalsIgnoreCase(req.estado)) {
                // Delete previous cash logs for this sale to avoid duplicates
                jdbcTemplate.update("DELETE FROM caja_movimientos WHERE referencia_id = ? AND tabla_referencia = 'ventas'", ventaId);

                jdbcTemplate.update(
                    "INSERT INTO caja_movimientos (tipo, categoria, monto, metodo_pago, referencia_id, tabla_referencia, fecha, notas, usuario_id) " +
                    "VALUES ('Ingreso', 'Venta', ?, ?, ?, 'ventas', NOW(), ?, ?)",
                    req.total, req.metodo_pago, ventaId, (isEdit ? "Actualización de Venta Directa #" : "Venta Directa #") + numeroVenta, defaultUserId
                );
            } else {
                jdbcTemplate.update("DELETE FROM caja_movimientos WHERE referencia_id = ? AND tabla_referencia = 'ventas'", ventaId);
            }

            return ResponseEntity.ok(Map.of("status", "success", "id", ventaId, "numero", numeroVenta));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("status", "error", "message", "Error al guardar venta: " + e.getMessage()));
        }
    }

    // ==========================================
    // 6. VALIDATE / CONFIRM DELIVERY AND PAYMENT
    // ==========================================
    @PostMapping("/validate")
    @Transactional
    public ResponseEntity<?> validateSale(@RequestBody ValidateSaleRequest req) {
        try {
            Map<String, Object> sale = jdbcTemplate.queryForMap(
                "SELECT estado, total, estado_pago, contacto_id, usuario_id FROM ventas WHERE id = ?",
                req.id
            );

            boolean alreadyDelivered = "completada".equalsIgnoreCase((String) sale.get("estado"));
            boolean wasAlreadyPaid = "pagado".equalsIgnoreCase((String) sale.get("estado_pago"));
            String nuevoEstado = (req.entrega_ok != null && req.entrega_ok) ? "completada" : "pendiente";

            double finalPaid = req.monto_pagado;
            if ("pagado".equalsIgnoreCase(req.estado_pago)) {
                finalPaid = ((Number) sale.get("total")).doubleValue();
            }

            jdbcTemplate.update(
                "UPDATE ventas SET estado = ?, metodo_pago = ?, estado_pago = ?, monto_pagado = ? WHERE id = ?",
                nuevoEstado, req.metodo_pago, req.estado_pago, finalPaid, req.id
            );

            // Contact updates status to 'Cliente'
            jdbcTemplate.update("UPDATE contacts SET status = 'Cliente' WHERE id = ?", sale.get("contacto_id"));

            // Sync to Orders table if linked
            String orderPayment = "pagado".equalsIgnoreCase(req.estado_pago) ? "Pagado" : ("parcial".equalsIgnoreCase(req.estado_pago) ? "Parcial" : "Pendiente");
            jdbcTemplate.update("UPDATE pedidos SET estado_pago = ? WHERE venta_id = ?", orderPayment, req.id);

            // Stock Management
            if (req.entrega_ok != null && req.entrega_ok && !alreadyDelivered) {
                // Deduct stock
                List<Map<String, Object>> details = jdbcTemplate.queryForList("SELECT producto_id, cantidad FROM venta_detalles WHERE venta_id = ?", req.id);
                for (Map<String, Object> det : details) {
                    deductProductStock((Integer) det.get("producto_id"), (Integer) det.get("cantidad"));
                }
            }

            // Sync bottle balance & finance cash
            Integer userId = (Integer) sale.get("usuario_id");
            syncValidationLogic(req.id, req.metodo_pago, req.estado_pago, wasAlreadyPaid, finalPaid, userId != null ? userId : 1);

            return ResponseEntity.ok(Map.of("message", "Venta validada y confirmada con éxito."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al validar la venta: " + e.getMessage()));
        }
    }

    // ==========================================
    // 7. CANCEL / VOID A SALE
    // ==========================================
    @PostMapping("/cancel")
    @Transactional
    public ResponseEntity<?> cancelSale(@RequestBody CancelSaleRequest req) {
        try {
            Map<String, Object> sale = jdbcTemplate.queryForMap(
                "SELECT estado, estado_pago, contacto_id, bidones_entregados, bidones_recogidos, notas, usuario_id FROM ventas WHERE id = ?",
                req.id
            );

            // Restore Stock
            if ("completada".equalsIgnoreCase((String) sale.get("estado"))) {
                List<Map<String, Object>> items = jdbcTemplate.queryForList("SELECT producto_id, cantidad FROM venta_detalles WHERE venta_id = ?", req.id);
                for (Map<String, Object> item : items) {
                    restoreProductStock((Integer) item.get("producto_id"), (Integer) item.get("cantidad"));
                }
            }

            // Revert bottle balance
            if ("pagado".equalsIgnoreCase((String) sale.get("estado_pago"))) {
                updateCustomerBottleBalance(req.id, true);
            }

            String timestamp = new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm").format(new Date());
            String updatedNotes = "⚠️ ANULADA (" + timestamp + "): " + req.motivo + " | " + (sale.get("notes") != null ? sale.get("notes") : (sale.get("notas") != null ? sale.get("notas") : ""));

            jdbcTemplate.update(
                "UPDATE ventas SET estado = 'cancelada', estado_pago = 'pendiente', bidones_entregados = 0, bidones_recogidos = 0, notas = ? WHERE id = ?",
                updatedNotes, req.id
            );

            // Delete financial logs
            jdbcTemplate.update(
                "DELETE FROM caja_movimientos WHERE referencia_id = ? AND tabla_referencia = 'ventas'",
                req.id
            );

            // Cancel linked order if exists
            Integer lostStageId = 10;
            try {
                lostStageId = jdbcTemplate.queryForObject("SELECT id FROM etapas_pedido WHERE es_perdido = 1 ORDER BY orden DESC LIMIT 1", Integer.class);
            } catch (Exception ignored) {}

            jdbcTemplate.update(
                "UPDATE pedidos SET etapa_id = ?, estado_pago = 'Pendiente', envases_entregados = 0, envases_devueltos = 0, notas = CONCAT('⚠️ VENTA ANULADA: ', ?, '\\n', COALESCE(notas,'')) WHERE venta_id = ?",
                lostStageId, req.motivo, req.id
            );

            return ResponseEntity.ok(Map.of("message", "Venta anulada correctamente."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al anular la venta: " + e.getMessage()));
        }
    }

    // ==========================================
    // 8. HARD DELETE A SALE
    // ==========================================
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteSale(@PathVariable Long id) {
        try {
            Map<String, Object> sale = jdbcTemplate.queryForMap(
                "SELECT estado, estado_pago, contacto_id FROM ventas WHERE id = ?",
                id
            );

            if ("completada".equalsIgnoreCase((String) sale.get("estado"))) {
                List<Map<String, Object>> items = jdbcTemplate.queryForList("SELECT producto_id, cantidad FROM venta_detalles WHERE venta_id = ?", id);
                for (Map<String, Object> item : items) {
                    restoreProductStock((Integer) item.get("producto_id"), (Integer) item.get("cantidad"));
                }
            }

            if ("pagado".equalsIgnoreCase((String) sale.get("estado_pago"))) {
                updateCustomerBottleBalance(id, true);
            }

            jdbcTemplate.update("UPDATE pedidos SET venta_id = NULL WHERE venta_id = ?", id);
            jdbcTemplate.update("DELETE FROM venta_detalles WHERE venta_id = ?", id);
            jdbcTemplate.update("DELETE FROM ventas WHERE id = ?", id);
            jdbcTemplate.update("DELETE FROM caja_movimientos WHERE referencia_id = ? AND tabla_referencia = 'ventas'", id);

            return ResponseEntity.ok(Map.of("message", "Venta eliminada permanentemente."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al eliminar la venta: " + e.getMessage()));
        }
    }

    // ==========================================
    // PRIVATE INTERNAL REUSABLE LOGIC
    // ==========================================
    private void syncValidationLogic(Long id, String metodo, String estadoPago, boolean wasAlreadyPaid, double finalPaid, Integer userId) {
        // 1. Bottle Balance Sync
        if ("pagado".equalsIgnoreCase(estadoPago) && !wasAlreadyPaid) {
            updateCustomerBottleBalance(id, false);
        }

        // 2. Finance Cash Flow Sync
        Double yaRegistrado = jdbcTemplate.queryForObject(
            "SELECT COALESCE(SUM(CASE WHEN tipo = 'Ingreso' THEN monto ELSE -monto END), 0.0) " +
            "FROM caja_movimientos WHERE referencia_id = ? AND tabla_referencia = 'ventas'",
            Double.class, id
        );

        double diff = finalPaid - (yaRegistrado != null ? yaRegistrado : 0.0);
        if (Math.abs(diff) > 0.01) {
            if (diff > 0) {
                jdbcTemplate.update(
                    "INSERT INTO caja_movimientos (tipo, categoria, monto, metodo_pago, referencia_id, tabla_referencia, notas, usuario_id) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    "Ingreso", "Venta", diff, metodo != null ? metodo : "Efectivo", id, "ventas",
                    "Abono a Venta #" + id + ("parcial".equalsIgnoreCase(estadoPago) ? " (Pago Parcial)" : " (Pago Completo)"), userId
                );
            } else {
                jdbcTemplate.update(
                    "INSERT INTO caja_movimientos (tipo, categoria, monto, metodo_pago, referencia_id, tabla_referencia, notas, usuario_id) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    "Egreso", "Anulación/Corrección", Math.abs(diff), metodo != null ? metodo : "Efectivo", id, "ventas",
                    "Corrección de monto en Venta #" + id, userId
                );
            }
        }
    }

    private void updateCustomerBottleBalance(Long ventaId, boolean isReversal) {
        try {
            Map<String, Object> sale = jdbcTemplate.queryForMap(
                "SELECT id, contacto_id, bidones_entregados, bidones_recogidos, usuario_id FROM ventas WHERE id = ?",
                ventaId
            );

            int entregados = (Integer) sale.get("bidones_entregados");
            int recogidos = (Integer) sale.get("bidones_recogidos");
            int impact = entregados - recogidos;

            if (impact != 0) {
                String operator = isReversal ? "-" : "+";
                Long contactoId = ((Number) sale.get("contacto_id")).longValue();

                Integer prevBalance = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(bidones_prestados, 0) FROM contacts WHERE id = ?",
                    Integer.class, contactoId
                );

                if (prevBalance == null) prevBalance = 0;

                jdbcTemplate.update(
                    "UPDATE contacts SET bidones_prestados = COALESCE(bidones_prestados, 0) " + operator + " ? WHERE id = ?",
                    Math.abs(impact), contactoId
                );

                int newBalance = isReversal ? (prevBalance - impact) : (prevBalance + impact);

                // Log movement
                jdbcTemplate.update(
                    "INSERT INTO movimientos_envases (contacto_id, tipo, cantidad, saldo_anterior, saldo_posterior, usuario_id, venta_id, notas) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    contactoId, isReversal ? "Ajuste" : (impact > 0 ? "Entrega" : "Recojo"), Math.abs(impact), prevBalance, newBalance,
                    sale.get("usuario_id"), ventaId, isReversal ? "REVERSIÓN de Venta #" + ventaId : "Transacción en Venta #" + ventaId
                );
            }
        } catch (Exception e) {
            System.err.println("Error syncing bottle balance: " + e.getMessage());
        }
    }

    private void restoreProductStock(int product_id, int quantity) {
        List<Map<String, Object>> components = jdbcTemplate.queryForList(
            "SELECT producto_hijo_id, cantidad FROM producto_composicion WHERE producto_padre_id = ?",
            product_id
        );
        if (!components.isEmpty()) {
            for (Map<String, Object> comp : components) {
                int totalRest = quantity * ((Number) comp.get("cantidad")).intValue();
                jdbcTemplate.update(
                    "UPDATE productos SET stock_actual = stock_actual + ? WHERE id = ?",
                    totalRest, comp.get("producto_hijo_id")
                );
            }
        } else {
            jdbcTemplate.update(
                "UPDATE productos SET stock_actual = stock_actual + ? WHERE id = ?",
                quantity, product_id
            );
        }
    }

    private void deductProductStock(int product_id, int quantity) {
        List<Map<String, Object>> components = jdbcTemplate.queryForList(
            "SELECT producto_hijo_id, cantidad FROM producto_composicion WHERE producto_padre_id = ?",
            product_id
        );
        if (!components.isEmpty()) {
            for (Map<String, Object> comp : components) {
                int totalDesc = quantity * ((Number) comp.get("cantidad")).intValue();
                jdbcTemplate.update(
                    "UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?",
                    totalDesc, comp.get("producto_hijo_id")
                );
            }
        } else {
            jdbcTemplate.update(
                "UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?",
                quantity, product_id
            );
        }
    }

    // ==========================================
    // REQUEST DTO CLASSES
    // ==========================================
    public static class SaveSaleRequest {
        public Long id;
        public String numero_venta;
        public Long contacto_id;
        public String estado = "pendiente";
        public String metodo_pago = "Efectivo";
        public String estado_pago = "pendiente";
        public Double subtotal = 0.0;
        public Double igv = 0.0;
        public Double total = 0.0;
        public Double monto_pagado = 0.0;
        public Integer bidones_entregados = 0;
        public Integer bidones_recogidos = 0;
        public String notas;
        public String direccion_entrega;
        public List<SaleDetailRequest> items;
    }

    public static class SaleDetailRequest {
        public Integer producto_id;
        public Integer cantidad;
        public Double precio_unitario;
    }

    public static class ValidateSaleRequest {
        public Long id;
        public String metodo_pago;
        public String estado_pago;
        public Boolean entrega_ok = true;
        public Double monto_pagado = 0.0;
    }

    public static class CancelSaleRequest {
        public Long id;
        public String motivo;
    }
}
