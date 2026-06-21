package com.nextlead.dao;

import com.nextlead.models.CategoriaProducto;
import java.util.List;
import java.util.Optional;

public interface CategoriaProductoDao {
    List<CategoriaProducto> findAll();
    Optional<CategoriaProducto> findById(Long id);
    CategoriaProducto save(CategoriaProducto cat);
    void update(CategoriaProducto cat);
    void deleteById(Long id);
    boolean hasAssociatedProducts(Long id);
}
