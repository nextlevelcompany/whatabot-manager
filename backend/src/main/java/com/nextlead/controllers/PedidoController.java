package com.nextlead.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

    private final JdbcTemplate jdbcTemplate;
    private final SecureRandom random = new SecureRandom();

    @Autowired
    public PedidoController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // 1. GET /api/pedidos/logistics-data
    @GetMapping("/logistics-data")
    public ResponseEntity<?> getLogisticsData() {
        try {
            // Columns
            List<Map<String, Object>> columns = jdbcTemplate.queryForList(
                    "SELECT id, nombre, orden, es_entregado, label_ganado, es_perdido, label_perdido FROM etapas_pedido ORDER BY orden ASC"
            );

            // Zonas
            List<Map<String, Object>> zonas = jdbcTemplate.queryForList(
                    "SELECT id, nombre, activo FROM zonas WHERE activo = true ORDER BY nombre ASC"
            );

            // Drivers (filtered strictly to include only registered workers with Repartidor/driver profile)
            List<Map<String, Object>> drivers = jdbcTemplate.queryForList(
                    "SELECT c.id, c.nombre, c.apellido, c.vehiculo_placa " +
                    "FROM conductores c " +
                    "INNER JOIN trabajadores t ON c.dni = t.dni " +
                    "WHERE c.activo = true " +
                    "  AND t.rol_operativo = 'Repartidor' " +
                    "ORDER BY c.nombre ASC"
            );

            // Categories
            List<Map<String, Object>> categories = jdbcTemplate.queryForList(
                    "SELECT id, nombre FROM categorias_producto WHERE activo = true ORDER BY nombre ASC"
            );

            // Pedidos
            List<Map<String, Object>> pedidos = jdbcTemplate.queryForList(
                    "SELECT p.*, " +
                    "       c.nombres AS contacto_nombre, " +
                    "       c.apellidos AS contacto_apellido, " +
                    "       c.tipo_persona AS tipo_contacto, " +
                    "       c.telefono_principal AS telefono_movil, " +
                    "       c.telefono_secundario AS telefono_fijo, " +
                    "       c.razon_social AS empresa_nombre, " +
                    "       z.nombre AS zona_nombre, " +
                    "       cond.nombre AS chofer_n, " +
                    "       cond.apellido AS chofer_a, " +
                    "       cond.vehiculo_placa AS vehiculo_placa, " +
                    "       (SELECT COALESCE(string_agg(concat(pd.cantidad, 'x ', pr.nombre), ' + '), '') " +
                    "        FROM pedido_detalles pd " +
                    "        JOIN productos pr ON pd.producto_id = pr.id " +
                    "        WHERE pd.pedido_id = p.id) AS productos_resumen " +
                    "FROM pedidos p " +
                    "LEFT JOIN contacts c ON p.contacto_id = c.id " +
                    "LEFT JOIN zonas z ON p.zona = z.id " +
                    "LEFT JOIN conductores cond ON p.chofer_id = cond.id " +
                    "ORDER BY p.id DESC"
            );

            Map<String, Object> response = new HashMap<>();
            response.put("columns", columns);
            response.put("pedidos", pedidos);
            response.put("zonas", zonas);
            response.put("drivers", drivers);
            response.put("categories", categories);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    // 2. GET /api/pedidos/search-contacts?q=...
    @GetMapping("/search-contacts")
    public ResponseEntity<?> searchContacts(@RequestParam(value = "q", defaultValue = "") String q) {
        String query = "%" + q + "%";
        String sql = "SELECT id, nombres, apellidos, numero_documento, tipo_persona, telefono_principal " +
                     "FROM contacts " +
                     "WHERE (nombres ILIKE ? OR apellidos ILIKE ? OR numero_documento ILIKE ? OR telefono_principal ILIKE ?) " +
                     "LIMIT 25";
        List<Map<String, Object>> list = jdbcTemplate.queryForList(sql, query, query, query, query);
        List<Map<String, Object>> formatted = new ArrayList<>();
        for (Map<String, Object> row : list) {
            String name = (row.get("nombres") != null ? row.get("nombres").toString() : "") + " " +
                          (row.get("apellidos") != null ? row.get("apellidos").toString() : "");
            name = name.trim();
            String doc = row.get("numero_documento") != null ? row.get("numero_documento").toString() : "S.D.";
            String phone = row.get("telefono_principal") != null ? row.get("telefono_principal").toString() : "S.T.";
            String type = "EMPRESA".equals(row.get("tipo_persona")) ? " [EMP]" : "";

            Map<String, Object> item = new HashMap<>();
            item.put("id", row.get("id"));
            item.put("text", name + " (Doc: " + doc + " | Tel: " + phone + ")" + type);
            formatted.add(item);
        }
        return ResponseEntity.ok(formatted);
    }

    // 3. GET /api/pedidos/contact-details/{id}
    @GetMapping("/contact-details/{id}")
    public ResponseEntity<?> getContactDetails(@PathVariable Long id) {
        try {
            Map<String, Object> contact = jdbcTemplate.queryForMap(
                    "SELECT id, nombres, apellidos, numero_documento, tipo_persona, telefono_principal FROM contacts WHERE id = ?", id
            );

            List<Map<String, Object>> dbAddresses = jdbcTemplate.queryForList(
                    "SELECT d.id_direccion AS id, d.direccion_completa AS direccion, d.referencia, " +
                    "       u.departamento, u.provincia, u.distrito, d.latitud, d.longitud " +
                    "FROM direcciones d " +
                    "LEFT JOIN ubigeo_peru u ON d.codigo_ubigeo = u.codigo_ubigeo " +
                    "WHERE d.id_contacto = ?", id
            );

            List<Map<String, Object>> addresses = new ArrayList<>();
            for (Map<String, Object> addr : dbAddresses) {
                String full = addr.get("direccion").toString();
                List<String> parts = new ArrayList<>();
                if (addr.get("distrito") != null) parts.add(addr.get("distrito").toString());
                if (addr.get("provincia") != null) parts.add(addr.get("provincia").toString());
                if (addr.get("departamento") != null) parts.add(addr.get("departamento").toString());
                if (!parts.isEmpty()) {
                    full += " (" + String.join(" - ", parts) + ")";
                }

                Map<String, Object> item = new HashMap<>();
                item.put("id", addr.get("id"));
                item.put("direccion", full);
                item.put("referencia", addr.get("referencia"));
                item.put("distrito", addr.get("distrito"));
                item.put("latitud", addr.get("latitud"));
                item.put("longitud", addr.get("longitud"));
                addresses.add(item);
            }

            List<Map<String, Object>> contactsPerson = new ArrayList<>();
            if ("EMPRESA".equals(contact.get("tipo_persona"))) {
                contactsPerson = jdbcTemplate.queryForList(
                        "SELECT id, concat(nombres, ' ', COALESCE(apellidos, '')) AS nombre " +
                        "FROM contacts " +
                        "WHERE empresa_id = ? AND tipo_persona = 'NATURAL'", id
                );
            }

            Map<String, Object> response = new HashMap<>();
            response.put("contact", contact);
            response.put("addresses", addresses);
            response.put("contacts_person", contactsPerson);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    // 4. POST /api/pedidos/save
    @PostMapping("/save")
    @Transactional
    public ResponseEntity<?> saveOrder(@RequestBody SaveOrderRequest req) {
        try {
            boolean isEdit = req.pedido_id != null;
            String numeroPedido;

            if (isEdit) {
                numeroPedido = jdbcTemplate.queryForObject("SELECT numero_pedido FROM pedidos WHERE id = ?", String.class, req.pedido_id);
            } else {
                String todayStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
                int randNum = 1000 + random.nextInt(9000);
                numeroPedido = "PED-" + todayStr + "-" + randNum;
            }

            // Get initial stage if registering new
            Integer stageId = null;
            if (!isEdit) {
                stageId = jdbcTemplate.queryForObject("SELECT id FROM etapas_pedido ORDER BY orden ASC LIMIT 1", Integer.class);
            }

            if (isEdit) {
                String sql = "UPDATE pedidos SET " +
                        "contacto_id = ?, contacto_persona_nombre = ?, metodo_pago = ?, estado_pago = ?, " +
                        "subtotal = ?, igv = ?, total = ?, direccion_entrega = ?, latitud = ?, longitud = ?, " +
                        "notas = ?, fecha_entrega = ?, hora_entrega = ?, chofer_id = ?, prioridad = ?, " +
                        "zona = ?, tipo_envio = ? WHERE id = ?";

                jdbcTemplate.update(sql,
                        req.contacto_id, req.contacto_persona_nombre, req.metodoPago, req.estado_pago,
                        req.subtotal, req.igv, req.total, req.direccion_entrega, req.latitud, req.longitud,
                        req.notas, java.sql.Date.valueOf(req.fecha_entrega), req.hora_entrega,
                        req.chofer_id != null && !req.chofer_id.isEmpty() ? Integer.parseInt(req.chofer_id) : null,
                        req.prioridad,
                        req.zona != null && !req.zona.isEmpty() ? Integer.parseInt(req.zona) : null,
                        req.tipo_envio, req.pedido_id
                );

                // Clean details
                jdbcTemplate.update("DELETE FROM pedido_detalles WHERE pedido_id = ?", req.pedido_id);
            } else {
                String sql = "INSERT INTO pedidos (" +
                        "numero_pedido, contacto_id, contacto_persona_nombre, metodo_pago, estado_pago, " +
                        "subtotal, igv, total, direccion_entrega, latitud, longitud, notas, " +
                        "fecha_entrega, hora_entrega, chofer_id, prioridad, zona, tipo_envio, etapa_id" +
                        ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                jdbcTemplate.update(sql,
                        numeroPedido, req.contacto_id, req.contacto_persona_nombre, req.metodoPago, req.estado_pago,
                        req.subtotal, req.igv, req.total, req.direccion_entrega, req.latitud, req.longitud, req.notas,
                        java.sql.Date.valueOf(req.fecha_entrega), req.hora_entrega,
                        req.chofer_id != null && !req.chofer_id.isEmpty() ? Integer.parseInt(req.chofer_id) : null,
                        req.prioridad,
                        req.zona != null && !req.zona.isEmpty() ? Integer.parseInt(req.zona) : null,
                        req.tipo_envio, stageId
                );

                req.pedido_id = jdbcTemplate.queryForObject("SELECT id FROM pedidos WHERE numero_pedido = ?", Long.class, numeroPedido);
            }

            // Save details
            if (req.productos != null) {
                for (ProductDetail detail : req.productos) {
                    jdbcTemplate.update("INSERT INTO pedido_detalles (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)",
                            req.pedido_id, detail.id, detail.cantidad, detail.precio);
                }
            }

            return ResponseEntity.ok(Map.of("status", "success", "message", "Pedido guardado con éxito.", "pedido_id", req.pedido_id));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    // 5. POST /api/pedidos/move
    @PostMapping("/move")
    @Transactional
    public ResponseEntity<?> moveOrder(@RequestBody MoveOrderRequest req) {
        try {
            // Fetch target stage info
            Map<String, Object> stage = jdbcTemplate.queryForMap(
                    "SELECT nombre, es_entregado, es_perdido FROM etapas_pedido WHERE id = ?", req.etapa_id
            );
            String stageName = (String) stage.get("nombre");
            int esEntregado = ((Number) stage.get("es_entregado")).intValue();
            int esPerdido = ((Number) stage.get("es_perdido")).intValue();

            // Fetch current order to get contacto_id and other details
            Map<String, Object> currentPedido = jdbcTemplate.queryForMap(
                    "SELECT venta_id, contacto_id, total, direccion_entrega, notas, numero_pedido, metodo_pago FROM pedidos WHERE id = ?", req.pedido_id
            );
            Object contactoId = currentPedido.get("contacto_id");

            // Update contact status to the name of the new stage
            if (contactoId != null && stageName != null) {
                jdbcTemplate.update("UPDATE contacts SET status = ? WHERE id = ?", stageName, contactoId);
            }

            if (esEntregado == 1) {
                // CIERRE DE PEDIDO (ENTREGA)
                Object existingVentaId = currentPedido.get("venta_id");

                if (existingVentaId == null) {
                    int entregados = req.envases_entregados != null ? req.envases_entregados : 0;
                    int devueltos = req.envases_devueltos != null ? req.envases_devueltos : 0;

                    // Generate sale number: V- + 6 random characters
                    String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                    StringBuilder sb = new StringBuilder();
                    for (int i = 0; i < 6; i++) {
                        sb.append(chars.charAt(this.random.nextInt(chars.length())));
                    }
                    String numeroVenta = "V-" + sb.toString();

                    int defaultUserId = 1; // Default admin user ID
                    String quienRecibio = req.quien_recibio != null ? req.quien_recibio : "";
                    double total = req.monto_final != null ? req.monto_final : ((Number) currentPedido.get("total")).doubleValue();
                    String metodoPago = (req.metodo_pago_real != null && !req.metodo_pago_real.trim().isEmpty())
                            ? req.metodo_pago_real
                            : (currentPedido.get("metodo_pago") != null ? (String) currentPedido.get("metodo_pago") : "efectivo");
                    int pendientePago = req.pendiente_pago != null ? req.pendiente_pago : 0;
                    String estadoPagoFinal = (pendientePago == 1) ? "pendiente" : "pagado";
                    String notasCierre = "Recibido por: " + quienRecibio + " | Origen: Logística. " + (currentPedido.get("notas") != null ? currentPedido.get("notas") : "");

                    double stFinal = total / 1.18; // 18% IGV
                    double igvFinal = total - stFinal;
                    double montoPagadoFinal = (pendientePago == 1) ? 0.0 : total;

                    // Insert sale record with status 'entregado' instead of 'completada'!
                    // This allows validating and confirming the sale in Ventas without locking it beforehand.
                    jdbcTemplate.update(
                            "INSERT INTO ventas (contacto_id, usuario_id, numero_venta, fecha_venta, tipo_comprobante, subtotal, igv, total, monto_pagado, estado, estado_pago, metodo_pago, bidones_entregados, bidones_recogidos, notas, direccion_entrega) " +
                            "VALUES (?, ?, ?, NOW(), 'nota_venta', ?, ?, ?, ?, 'entregado', ?, ?, ?, ?, ?, ?)",
                            currentPedido.get("contacto_id"), defaultUserId, numeroVenta, stFinal, igvFinal, total, montoPagadoFinal, estadoPagoFinal, metodoPago, entregados, devueltos, notasCierre, currentPedido.get("direccion_entrega")
                    );

                    Long newVentaId = jdbcTemplate.queryForObject("SELECT lastval()", Long.class);

                    // Track bottle balances
                    int impact = entregados - devueltos;
                    Integer prevBalance = jdbcTemplate.queryForObject("SELECT COALESCE(bidones_prestados, 0) FROM contacts WHERE id = ?", Integer.class, currentPedido.get("contacto_id"));
                    if (prevBalance == null) prevBalance = 0;

                    // Sincronizar saldo de bidones del cliente
                    jdbcTemplate.update("UPDATE contacts SET bidones_prestados = COALESCE(bidones_prestados, 0) + ? WHERE id = ?", impact, currentPedido.get("contacto_id"));

                    // Log bottle movement
                    String sqlLog = "INSERT INTO movimientos_envases (contacto_id, tipo, cantidad, saldo_anterior, saldo_posterior, usuario_id, venta_id, pedido_id, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
                    if (entregados > 0) {
                        jdbcTemplate.update(sqlLog, currentPedido.get("contacto_id"), "Entrega", entregados, prevBalance, prevBalance + entregados, defaultUserId, newVentaId, req.pedido_id, "Entrega desde Logística (Venta #" + newVentaId + ")");
                        prevBalance += entregados;
                    }
                    if (devueltos > 0) {
                        jdbcTemplate.update(sqlLog, currentPedido.get("contacto_id"), "Recojo", devueltos, prevBalance, prevBalance - devueltos, defaultUserId, newVentaId, req.pedido_id, "Recojo desde Logística (Venta #" + newVentaId + ")");
                    }

                    // Log finance movement if paid
                    if ("pagado".equals(estadoPagoFinal)) {
                        jdbcTemplate.update(
                                "INSERT INTO caja_movimientos (tipo, categoria, monto, metodo_pago, referencia_id, tabla_referencia, fecha, notas, usuario_id) " +
                                "VALUES ('Ingreso', 'Venta', ?, ?, ?, 'ventas', NOW(), ?, ?)",
                                total, metodoPago, newVentaId, "Venta automática desde Pedido #" + req.pedido_id, defaultUserId
                        );
                    }

                    // Copy items to venta_detalles
                    List<Map<String, Object>> items = jdbcTemplate.queryForList("SELECT * FROM pedido_detalles WHERE pedido_id = ?", req.pedido_id);
                    for (Map<String, Object> item : items) {
                        int cantidad = ((Number) item.get("cantidad")).intValue();
                        double precioUnitario = ((Number) item.get("precio_unitario")).doubleValue();
                        double subtotal = cantidad * precioUnitario;

                        jdbcTemplate.update(
                                "INSERT INTO venta_detalles (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)",
                                newVentaId, item.get("producto_id"), cantidad, precioUnitario, subtotal
                        );
                    }

                    // Update order details to link with sale
                    String nuevoEstadoPago = (pendientePago == 1) ? "Pendiente" : "Pagado";
                    jdbcTemplate.update(
                            "UPDATE pedidos SET etapa_id = ?, venta_id = ?, estado_pago = ?, envases_entregados = ?, envases_devueltos = ?, quien_recibio = ?, monto_final = ?, metodo_pago_real = ?, venta_estado = 'entregado', fecha_entrega = CURRENT_DATE WHERE id = ?",
                            req.etapa_id, newVentaId, nuevoEstadoPago, entregados, devueltos, quienRecibio, total, metodoPago, req.pedido_id
                    );
                }
            } else if (esPerdido == 1) {
                // Cancelled
                String reason = req.cancel_reason != null && !req.cancel_reason.trim().isEmpty() ? "\nCancelado por: " + req.cancel_reason : "";
                jdbcTemplate.update(
                        "UPDATE pedidos SET " +
                        "  etapa_id = ?, " +
                        "  venta_estado = 'cancelada', " +
                        "  notas = CONCAT(COALESCE(notas, ''), ?) " +
                        "WHERE id = ?",
                        req.etapa_id,
                        reason,
                        req.pedido_id
                );
            } else {
                // Regular move or reversion from delivered
                Object ventaId = currentPedido.get("venta_id");
                if (ventaId != null) {
                    // Delete associated sale if moved back from delivered
                    jdbcTemplate.update("DELETE FROM ventas WHERE id = ?", ventaId);
                }

                if (req.chofer_id != null && req.zona != null) {
                    jdbcTemplate.update(
                            "UPDATE pedidos SET etapa_id = ?, venta_id = NULL, venta_estado = 'pendiente', envases_entregados = 0, envases_devueltos = 0, chofer_id = ?, zona = ? WHERE id = ?",
                            req.etapa_id,
                            req.chofer_id,
                            req.zona,
                            req.pedido_id
                    );
                } else if (req.chofer_id != null) {
                    jdbcTemplate.update(
                            "UPDATE pedidos SET etapa_id = ?, venta_id = NULL, venta_estado = 'pendiente', envases_entregados = 0, envases_devueltos = 0, chofer_id = ? WHERE id = ?",
                            req.etapa_id,
                            req.chofer_id,
                            req.pedido_id
                    );
                } else if (req.zona != null) {
                    jdbcTemplate.update(
                            "UPDATE pedidos SET etapa_id = ?, venta_id = NULL, venta_estado = 'pendiente', envases_entregados = 0, envases_devueltos = 0, zona = ? WHERE id = ?",
                            req.etapa_id,
                            req.zona,
                            req.pedido_id
                    );
                } else {
                    jdbcTemplate.update(
                            "UPDATE pedidos SET etapa_id = ?, venta_id = NULL, venta_estado = 'pendiente', envases_entregados = 0, envases_devueltos = 0 WHERE id = ?",
                            req.etapa_id,
                            req.pedido_id
                    );
                }
            }

            return ResponseEntity.ok(Map.of("status", "success", "message", "Pedido movido correctamente."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    // 6. POST /api/pedidos/columns
    @PostMapping("/columns")
    public ResponseEntity<?> addColumn(@RequestBody Map<String, String> body) {
        try {
            String name = body.get("name");
            if (name == null || name.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "El nombre es requerido."));
            }
            Integer maxOrden = jdbcTemplate.queryForObject("SELECT COALESCE(MAX(orden), 0) FROM etapas_pedido", Integer.class);
            jdbcTemplate.update("INSERT INTO etapas_pedido (nombre, orden) VALUES (?, ?)", name, maxOrden + 1);
            return ResponseEntity.ok(Map.of("status", "success", "message", "Etapa creada."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    // 7. PUT /api/pedidos/columns/{id}
    @PutMapping("/columns/{id}")
    public ResponseEntity<?> updateColumnConfig(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            String name = body.get("name") != null ? body.get("name").toString() : null;
            if (name == null || name.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "El nombre es requerido."));
            }
            jdbcTemplate.update("UPDATE etapas_pedido SET nombre = ? WHERE id = ?", name, id);
            return ResponseEntity.ok(Map.of("status", "success", "message", "Etapa actualizada."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    // 8. DELETE /api/pedidos/columns/{id}
    @DeleteMapping("/columns/{id}")
    public ResponseEntity<?> deleteColumn(@PathVariable Long id) {
        try {
            Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM pedidos WHERE etapa_id = ?", Integer.class, id);
            if (count != null && count > 0) {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "No se puede eliminar: hay pedidos asociados a esta etapa."));
            }
            jdbcTemplate.update("DELETE FROM etapas_pedido WHERE id = ?", id);
            return ResponseEntity.ok(Map.of("status", "success", "message", "Etapa eliminada."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    // 9. DELETE /api/pedidos/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePedido(@PathVariable Long id) {
        try {
            jdbcTemplate.update("DELETE FROM pedidos WHERE id = ?", id);
            return ResponseEntity.ok(Map.of("status", "success", "message", "Pedido eliminado."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    // 10. PUT /api/pedidos/columns/reorder
    @PutMapping("/columns/reorder")
    @Transactional
    public ResponseEntity<?> updateColumnOrder(@RequestBody Map<String, List<Integer>> body) {
        try {
            List<Integer> orderList = body.get("order");
            if (orderList != null) {
                for (int i = 0; i < orderList.size(); i++) {
                    jdbcTemplate.update("UPDATE etapas_pedido SET orden = ? WHERE id = ?", i + 1, orderList.get(i));
                }
            }
            return ResponseEntity.ok(Map.of("status", "success", "message", "Orden actualizado."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    // 11. GET /api/pedidos/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getPedidoById(@PathVariable Long id) {
        try {
            Map<String, Object> pedido = jdbcTemplate.queryForMap(
                    "SELECT p.*, c.nombres AS contacto_nombre, c.apellidos AS contacto_apellido, c.numero_documento, c.tipo_persona AS tipo_contacto " +
                    "FROM pedidos p JOIN contacts c ON p.contacto_id = c.id WHERE p.id = ?", id
            );
            List<Map<String, Object>> items = jdbcTemplate.queryForList(
                    "SELECT pd.*, pr.nombre FROM pedido_detalles pd JOIN productos pr ON pd.producto_id = pr.id WHERE pd.pedido_id = ?", id
            );
            Map<String, Object> response = new HashMap<>(pedido);
            response.put("items", items);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("status", "error", "message", "Pedido no encontrado: " + e.getMessage()));
        }
    }

    // DTO Classes for requests
    public static class SaveOrderRequest {
        public Long pedido_id;
        public Long contacto_id;
        public String contacto_persona_nombre;
        public String metodoPago;
        public String estado_pago;
        public Double subtotal;
        public Double igv;
        public Double total;
        public String direccion_entrega;
        public Double latitud;
        public Double longitud;
        public String notas;
        public String fecha_entrega;
        public String hora_entrega;
        public String chofer_id;
        public String prioridad;
        public String zona;
        public String tipo_envio;
        public List<ProductDetail> productos;
    }

    public static class ProductDetail {
        public Integer id;
        public String nombre;
        public Double precio;
        public Integer cantidad;
    }

    public static class MoveOrderRequest {
        public Long pedido_id;
        public Integer etapa_id;
        public String quien_recibio;
        public Integer envases_entregados;
        public Integer envases_devueltos;
        public Double monto_final;
        public String metodo_pago_real;
        public Integer pendiente_pago;
        public String cancel_reason;
        public Integer chofer_id;
        public Integer zona;
    }
}
