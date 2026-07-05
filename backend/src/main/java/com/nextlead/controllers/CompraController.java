package com.nextlead.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.sql.Date;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/compras")
public class CompraController {

    private final JdbcTemplate jdbcTemplate;
    private final SecureRandom random = new SecureRandom();

    @Autowired
    public CompraController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<?> getAll() {
        try {
            List<Map<String, Object>> list = jdbcTemplate.queryForList(
                "SELECT c.*, p.razon_social as proveedor_nombre, " +
                "       (SELECT STRING_AGG(cd.cantidad || 'x ' || prod.nombre, ', ') " +
                "        FROM compras_detalles cd " +
                "        JOIN productos prod ON cd.producto_id = prod.id " +
                "        WHERE cd.compra_id = c.id) as productos_detalle " +
                "FROM compras c " +
                "LEFT JOIN proveedores p ON c.proveedor_id = p.id " +
                "ORDER BY c.fecha_compra DESC, c.id DESC"
            );
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al obtener compras: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            List<Map<String, Object>> purchaseList = jdbcTemplate.queryForList(
                "SELECT c.*, p.razon_social as proveedor_nombre FROM compras c LEFT JOIN proveedores p ON c.proveedor_id = p.id WHERE c.id = ?", id
            );
            if (purchaseList.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            Map<String, Object> purchase = purchaseList.get(0);

            List<Map<String, Object>> details = jdbcTemplate.queryForList(
                "SELECT cd.*, p.nombre as producto_nombre, p.codigo as producto_codigo " +
                "FROM compras_detalles cd " +
                "JOIN productos p ON cd.producto_id = p.id " +
                "WHERE cd.compra_id = ? " +
                "ORDER BY cd.id ASC", id
            );

            return ResponseEntity.ok(Map.of("purchase", purchase, "details", details));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al obtener detalle de compra: " + e.getMessage()));
        }
    }

    @PostMapping("/save")
    @Transactional
    public ResponseEntity<?> save(@RequestBody SaveCompraRequest req) {
        try {
            if (req.proveedor_id == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "El proveedor es obligatorio."));
            }
            if (req.fecha_compra == null || req.fecha_compra.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "La fecha de compra es obligatoria."));
            }
            if (req.items == null || req.items.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "La compra debe tener al menos un producto."));
            }

            Date dateCompra = Date.valueOf(req.fecha_compra);
            boolean isEdit = req.id != null;
            Long compraId;

            if (isEdit) {
                // If it's edit, check if already received
                String currentState = jdbcTemplate.queryForObject("SELECT estado FROM compras WHERE id = ?", String.class, req.id);
                if ("recibida".equals(currentState)) {
                    return ResponseEntity.badRequest().body(Map.of("message", "No se puede editar una compra que ya fue recibida en almacén."));
                }

                jdbcTemplate.update(
                    "UPDATE compras SET proveedor_id = ?, fecha_compra = ?, tipo_comprobante = ?, numero_comprobante = ?, " +
                    "subtotal = ?, igv = ?, total = ?, notas = ? WHERE id = ?",
                    req.proveedor_id, dateCompra, req.tipo_comprobante, req.numero_comprobante,
                    req.subtotal, req.igv, req.total, req.notas, req.id
                );
                compraId = req.id;

                // Delete previous details and re-insert
                jdbcTemplate.update("DELETE FROM compras_detalles WHERE compra_id = ?", compraId);
            } else {
                String numeroCompra = "C-" + String.format("%05d", 1000 + random.nextInt(90000));
                // default user_id = 1 (admin)
                Integer defaultUserId = 1;
                try {
                    defaultUserId = jdbcTemplate.queryForObject("SELECT id FROM users LIMIT 1", Integer.class);
                } catch (Exception ignored) {}

                jdbcTemplate.update(
                    "INSERT INTO compras (proveedor_id, usuario_id, numero_compra, fecha_compra, tipo_comprobante, " +
                    "numero_comprobante, subtotal, igv, total, estado, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    req.proveedor_id, defaultUserId, numeroCompra, dateCompra, req.tipo_comprobante,
                    req.numero_comprobante, req.subtotal, req.igv, req.total, "pendiente", req.notas
                );
                compraId = jdbcTemplate.queryForObject("SELECT lastval()", Long.class);
            }

            // Insert details
            for (CompraDetailItem item : req.items) {
                jdbcTemplate.update(
                    "INSERT INTO compras_detalles (compra_id, producto_id, cantidad, costo_unitario, subtotal) VALUES (?, ?, ?, ?, ?)",
                    compraId, item.producto_id, item.cantidad, item.costo_unitario, item.subtotal
                );
            }

            return ResponseEntity.ok(Map.of("message", "Compra guardada como borrador con éxito.", "id", compraId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al registrar la compra: " + e.getMessage()));
        }
    }

    @PostMapping("/receive/{id}")
    @Transactional
    public ResponseEntity<?> receive(@PathVariable Long id) {
        try {
            List<Map<String, Object>> purchases = jdbcTemplate.queryForList("SELECT * FROM compras WHERE id = ?", id);
            if (purchases.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            Map<String, Object> purchase = purchases.get(0);

            if ("recibida".equals(purchase.get("estado"))) {
                return ResponseEntity.badRequest().body(Map.of("message", "Esta compra ya fue recibida en almacén."));
            }

            // 1. Get items, increase stock, build detail string
            List<Map<String, Object>> items = jdbcTemplate.queryForList(
                "SELECT cd.*, p.nombre FROM compras_detalles cd JOIN productos p ON cd.producto_id = p.id WHERE cd.compra_id = ?", id
            );
            List<String> detailedStr = new ArrayList<>();
            for (Map<String, Object> item : items) {
                Integer prodId = (Integer) item.get("producto_id");
                Number qty = (Number) item.get("cantidad");
                jdbcTemplate.update("UPDATE productos SET stock_actual = stock_actual + ? WHERE id = ?", qty.intValue(), prodId);
                detailedStr.add(qty.intValue() + "x " + item.get("nombre"));
            }
            String detailedProducts = String.join(", ", detailedStr);

            // 2. Update purchase status
            jdbcTemplate.update("UPDATE compras SET estado = 'recibida' WHERE id = ?", id);

            // 3. Register Gasto (Expense) automatically
            Integer catId = null;
            try {
                catId = jdbcTemplate.queryForObject("SELECT id FROM gastos_categorias WHERE nombre = 'Compra de Inventario' LIMIT 1", Integer.class);
            } catch (Exception ignored) {}
            if (catId == null) {
                // fallback to create it
                jdbcTemplate.update("INSERT INTO gastos_categorias (nombre, tipo, grupo_contable, afecta_margen_bidon) VALUES ('Compra de Inventario', 'Variable', 'Compras', true)");
                catId = jdbcTemplate.queryForObject("SELECT lastval()", Integer.class);
            }

            Number totalAmount = (Number) purchase.get("total");
            String docNum = (String) purchase.get("numero_comprobante");
            String compNum = (String) purchase.get("numero_compra");

            jdbcTemplate.update(
                "INSERT INTO gastos (proveedor_id, categoria_id, fecha_gasto, numero_comprobante, tipo_comprobante, " +
                "descripcion, cantidad, costo_unitario, monto_total, estado_pago, metodo_pago) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                purchase.get("proveedor_id"), catId, purchase.get("fecha_compra"), docNum, "Factura",
                "Sincronización Compra " + compNum + ": " + detailedProducts, 1.0, totalAmount.doubleValue(),
                totalAmount.doubleValue(), "Pagado", "Transferencia"
            );
            Long expenseId = jdbcTemplate.queryForObject("SELECT lastval()", Long.class);

            // Register Cash Outflow (Egreso) in caja_movimientos
            Integer defaultUserId = 1;
            try {
                defaultUserId = jdbcTemplate.queryForObject("SELECT id FROM users LIMIT 1", Integer.class);
            } catch (Exception ignored) {}

            jdbcTemplate.update(
                "INSERT INTO caja_movimientos (tipo, categoria, monto, metodo_pago, referencia_id, tabla_referencia, notas, usuario_id, fecha) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                "Egreso", "Gasto", totalAmount.doubleValue(), "Transferencia", expenseId, "gastos",
                "Compra " + compNum + " (Ingresada al Almacén)", defaultUserId, new java.sql.Timestamp(System.currentTimeMillis())
            );

            return ResponseEntity.ok(Map.of("message", "Mercadería ingresada al almacén, gasto contable y egreso de caja registrados automáticamente."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al procesar el ingreso de mercadería: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            String currentState = jdbcTemplate.queryForObject("SELECT estado FROM compras WHERE id = ?", String.class, id);
            if ("recibida".equals(currentState)) {
                return ResponseEntity.badRequest().body(Map.of("message", "No se puede eliminar una compra recibida."));
            }

            jdbcTemplate.update("DELETE FROM compras WHERE id = ?", id);
            return ResponseEntity.ok(Map.of("message", "Compra eliminada con éxito."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al eliminar la compra: " + e.getMessage()));
        }
    }

    public static class SaveCompraRequest {
        public Long id;
        public Long proveedor_id;
        public String fecha_compra;
        public String tipo_comprobante;
        public String numero_comprobante;
        public Double subtotal;
        public Double igv;
        public Double total;
        public String notas;
        public List<CompraDetailItem> items;
    }

    public static class CompraDetailItem {
        public Integer producto_id;
        public Double cantidad;
        public Double costo_unitario;
        public Double subtotal;
    }
}
