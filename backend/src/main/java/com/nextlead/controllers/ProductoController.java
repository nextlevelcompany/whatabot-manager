package com.nextlead.controllers;

import com.nextlead.dao.ProductoDao;
import com.nextlead.dao.CategoriaProductoDao;
import com.nextlead.models.Producto;
import com.nextlead.models.ProductoComponente;
import com.nextlead.models.CategoriaProducto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/productos")
public class ProductoController {

    private final ProductoDao productoDao;
    private final CategoriaProductoDao categoriaDao;

    @Autowired
    public ProductoController(ProductoDao productoDao, CategoriaProductoDao categoriaDao) {
        this.productoDao = productoDao;
        this.categoriaDao = categoriaDao;
    }

    @GetMapping
    public ResponseEntity<List<Producto>> getAll() {
        return ResponseEntity.ok(productoDao.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        Optional<Producto> opt = productoDao.findById(id);
        return opt.map(ResponseEntity::ok)
                  .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Producto prod) {
        if (prod.getNombre() == null || prod.getNombre().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El nombre es obligatorio."));
        }
        Producto saved = productoDao.save(prod);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Producto prod) {
        Optional<Producto> opt = productoDao.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (prod.getNombre() == null || prod.getNombre().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El nombre es obligatorio."));
        }
        prod.setId(id);
        productoDao.update(prod);
        return ResponseEntity.ok(prod);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        Optional<Producto> opt = productoDao.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        productoDao.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Producto eliminado con éxito."));
    }

    @PostMapping("/import")
    public ResponseEntity<?> importProducts(@RequestBody List<Map<String, Object>> productsList) {
        try {
            // Cargar categorías actuales para mapear por nombre en mayúsculas
            List<CategoriaProducto> currentCategories = categoriaDao.findAll();
            Map<String, Long> categoryMap = new HashMap<>();
            for (CategoriaProducto cat : currentCategories) {
                categoryMap.put(cat.getNombre().toUpperCase().trim(), cat.getId());
            }

            long defaultCatId = currentCategories.isEmpty() ? 1L : currentCategories.get(0).getId();

            // Cargar todos los productos para verificar SKU existente
            List<Producto> allProducts = productoDao.findAll();
            Map<String, Long> productSkuMap = new HashMap<>();
            for (Producto p : allProducts) {
                if (p.getCodigo() != null && !p.getCodigo().trim().isEmpty()) {
                    productSkuMap.put(p.getCodigo().toUpperCase().trim(), p.getId());
                }
            }

            int count = 0;
            for (Map<String, Object> row : productsList) {
                String codigo = row.containsKey("Codigo") ? String.valueOf(row.get("Codigo")).trim() : "";
                String nombre = row.containsKey("Nombre") ? String.valueOf(row.get("Nombre")).trim() : "";
                String catName = row.containsKey("Categoria") ? String.valueOf(row.get("Categoria")).trim().toUpperCase() : "";
                
                double precio = 0.0;
                if (row.containsKey("Precio")) {
                    try {
                        precio = Double.parseDouble(String.valueOf(row.get("Precio")).replaceAll("[^0-9.]", ""));
                    } catch (Exception ignored) {}
                }

                int stock = 0;
                if (row.containsKey("Stock")) {
                    try {
                        stock = Integer.parseInt(String.valueOf(row.get("Stock")).replaceAll("[^0-9-]", ""));
                    } catch (Exception ignored) {}
                }

                String desc = row.containsKey("Descripcion") ? String.valueOf(row.get("Descripcion")).trim() : "";

                if (nombre.isEmpty()) {
                    continue;
                }

                // Determinar id de categoría o crearla si no existe
                Long catId = categoryMap.get(catName);
                if (catId == null && !catName.isEmpty()) {
                    CategoriaProducto newCat = new CategoriaProducto();
                    newCat.setNombre(row.get("Categoria").toString().trim());
                    newCat.setDescripcion("Creada automáticamente durante importación");
                    newCat.setActivo(true);
                    newCat = categoriaDao.save(newCat);
                    catId = newCat.getId();
                    categoryMap.put(catName, catId);
                }
                if (catId == null) {
                    catId = defaultCatId;
                }

                // Si no existe el SKU, lo insertamos
                boolean exists = false;
                if (!codigo.isEmpty()) {
                    exists = productSkuMap.containsKey(codigo.toUpperCase().trim());
                }

                if (!exists) {
                    Producto p = new Producto();
                    p.setCodigo(codigo);
                    p.setNombre(nombre);
                    p.setDescripcion(desc);
                    p.setCategoriaId(catId);
                    p.setPrecioVenta(precio);
                    p.setStockActual(stock);
                    p.setEsPack(nombre.toUpperCase().contains("PACK") || nombre.toUpperCase().contains("PROMO") || nombre.toUpperCase().contains("COMBO"));
                    p.setRequiereRetorno(false);
                    p.setActivo(true);
                    
                    productoDao.save(p);
                    count++;
                }
            }

            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", count + " nuevos productos importados correctamente."
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", e.getMessage()));
        }
    }
}
