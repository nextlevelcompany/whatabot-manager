package com.nextlead.dao;

import com.nextlead.models.Producto;
import com.nextlead.models.ProductoComponente;
import java.util.List;
import java.util.Optional;

public interface ProductoDao {
    List<Producto> findAll();
    Optional<Producto> findById(Long id);
    Producto save(Producto prod);
    void update(Producto prod);
    void deleteById(Long id);
    List<ProductoComponente> findCompositionByPadreId(Long padreId);
    void saveComposition(Long padreId, List<ProductoComponente> components);
}
