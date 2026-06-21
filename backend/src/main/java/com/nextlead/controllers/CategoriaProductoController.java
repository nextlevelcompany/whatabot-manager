package com.nextlead.controllers;

import com.nextlead.dao.CategoriaProductoDao;
import com.nextlead.models.CategoriaProducto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/categorias-producto")
public class CategoriaProductoController {

    private final CategoriaProductoDao categoriaDao;

    @Autowired
    public CategoriaProductoController(CategoriaProductoDao categoriaDao) {
        this.categoriaDao = categoriaDao;
    }

    @GetMapping
    public ResponseEntity<List<CategoriaProducto>> getAll() {
        return ResponseEntity.ok(categoriaDao.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        Optional<CategoriaProducto> opt = categoriaDao.findById(id);
        return opt.map(ResponseEntity::ok)
                  .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CategoriaProducto cat) {
        if (cat.getNombre() == null || cat.getNombre().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El nombre es obligatorio."));
        }
        CategoriaProducto saved = categoriaDao.save(cat);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody CategoriaProducto cat) {
        Optional<CategoriaProducto> opt = categoriaDao.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (cat.getNombre() == null || cat.getNombre().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El nombre es obligatorio."));
        }
        cat.setId(id);
        categoriaDao.update(cat);
        return ResponseEntity.ok(cat);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        Optional<CategoriaProducto> opt = categoriaDao.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (categoriaDao.hasAssociatedProducts(id)) {
            return ResponseEntity.badRequest().body(Map.of("message", "No se puede eliminar: Hay productos asociados a esta categoría."));
        }
        categoriaDao.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Categoría eliminada con éxito."));
    }
}
