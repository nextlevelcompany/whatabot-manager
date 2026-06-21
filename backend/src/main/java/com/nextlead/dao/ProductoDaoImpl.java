package com.nextlead.dao;

import com.nextlead.models.Producto;
import com.nextlead.models.ProductoComponente;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.util.List;
import java.util.Optional;

@Repository
public class ProductoDaoImpl implements ProductoDao {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public ProductoDaoImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Producto> rowMapper = (rs, rowNum) -> {
        Producto p = new Producto();
        p.setId(rs.getLong("id"));
        p.setCodigo(rs.getString("codigo"));
        p.setNombre(rs.getString("nombre"));
        p.setDescripcion(rs.getString("descripcion"));
        
        long catId = rs.getLong("categoria_id");
        p.setCategoriaId(rs.wasNull() ? null : catId);
        
        try { p.setCategoriaNombre(rs.getString("categoria_nombre")); } catch (Exception ignored) {}
        
        p.setPrecioVenta(rs.getDouble("precio_venta"));
        p.setStockActual(rs.getInt("stock_actual"));
        p.setImagen(rs.getString("imagen"));
        p.setEsPack(rs.getBoolean("es_pack"));
        p.setRequiereRetorno(rs.getBoolean("requiere_retorno"));
        p.setActivo(rs.getBoolean("activo"));
        return p;
    };

    private final RowMapper<ProductoComponente> compRowMapper = (rs, rowNum) -> {
        ProductoComponente c = new ProductoComponente();
        c.setProductoPadreId(rs.getLong("producto_padre_id"));
        c.setProductoHijoId(rs.getLong("producto_hijo_id"));
        c.setNombre(rs.getString("nombre"));
        c.setCantidad(rs.getDouble("cantidad"));
        c.setRequiereRetorno(rs.getBoolean("requiere_retorno"));
        
        long catId = rs.getLong("categoria_id");
        c.setCategoriaId(rs.wasNull() ? null : catId);
        return c;
    };

    @Override
    public List<Producto> findAll() {
        String sql = """
            SELECT p.*, c.nombre AS categoria_nombre 
            FROM productos p 
            LEFT JOIN categorias_producto c ON p.categoria_id = c.id 
            ORDER BY p.created_at DESC
            """;
        List<Producto> list = jdbcTemplate.query(sql, rowMapper);
        for (Producto p : list) {
            if (Boolean.TRUE.equals(p.getEsPack())) {
                p.setComponents(findCompositionByPadreId(p.getId()));
            }
        }
        return list;
    }

    @Override
    public Optional<Producto> findById(Long id) {
        String sql = """
            SELECT p.*, c.nombre AS categoria_nombre 
            FROM productos p 
            LEFT JOIN categorias_producto c ON p.categoria_id = c.id 
            WHERE p.id = ?
            """;
        try {
            Producto p = jdbcTemplate.queryForObject(sql, rowMapper, id);
            if (p != null && Boolean.TRUE.equals(p.getEsPack())) {
                p.setComponents(findCompositionByPadreId(p.getId()));
            }
            return Optional.ofNullable(p);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    @Transactional
    public Producto save(Producto prod) {
        String sql = """
            INSERT INTO productos (codigo, nombre, descripcion, categoria_id, precio_venta, stock_actual, imagen, es_pack, requiere_retorno, activo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, new String[]{"id"});
            ps.setString(1, prod.getCodigo());
            ps.setString(2, prod.getNombre());
            ps.setString(3, prod.getDescripcion());
            if (prod.getCategoriaId() != null) {
                ps.setLong(4, prod.getCategoriaId());
            } else {
                ps.setNull(4, java.sql.Types.INTEGER);
            }
            ps.setDouble(5, prod.getPrecioVenta() != null ? prod.getPrecioVenta() : 0.0);
            ps.setInt(6, prod.getStockActual() != null ? prod.getStockActual() : 0);
            ps.setString(7, prod.getImagen());
            ps.setBoolean(8, prod.getEsPack() != null ? prod.getEsPack() : false);
            ps.setBoolean(9, prod.getRequiereRetorno() != null ? prod.getRequiereRetorno() : false);
            ps.setBoolean(10, prod.getActivo() != null ? prod.getActivo() : true);
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key != null) {
            prod.setId(key.longValue());
        }

        // Guardar composición si es pack
        if (Boolean.TRUE.equals(prod.getEsPack()) && prod.getComponents() != null) {
            saveComposition(prod.getId(), prod.getComponents());
        }

        return prod;
    }

    @Override
    @Transactional
    public void update(Producto prod) {
        String sql = """
            UPDATE productos SET codigo = ?, nombre = ?, descripcion = ?, categoria_id = ?, precio_venta = ?, 
                                 stock_actual = ?, imagen = ?, es_pack = ?, requiere_retorno = ?, activo = ?
            WHERE id = ?
            """;
        jdbcTemplate.update(sql, 
            prod.getCodigo(), 
            prod.getNombre(), 
            prod.getDescripcion(), 
            prod.getCategoriaId(), 
            prod.getPrecioVenta(), 
            prod.getStockActual(), 
            prod.getImagen(), 
            prod.getEsPack(), 
            prod.getRequiereRetorno(), 
            prod.getActivo(), 
            prod.getId()
        );

        // Guardar composición
        if (Boolean.TRUE.equals(prod.getEsPack()) && prod.getComponents() != null) {
            saveComposition(prod.getId(), prod.getComponents());
        } else {
            jdbcTemplate.update("DELETE FROM producto_composicion WHERE producto_padre_id = ?", prod.getId());
        }
    }

    @Override
    public void deleteById(Long id) {
        jdbcTemplate.update("DELETE FROM productos WHERE id = ?", id);
    }

    @Override
    public List<ProductoComponente> findCompositionByPadreId(Long padreId) {
        String sql = """
            SELECT pc.*, p.nombre, p.requiere_retorno, p.categoria_id 
            FROM producto_composicion pc 
            JOIN productos p ON pc.producto_hijo_id = p.id 
            WHERE pc.producto_padre_id = ?
            """;
        return jdbcTemplate.query(sql, compRowMapper, padreId);
    }

    @Override
    @Transactional
    public void saveComposition(Long padreId, List<ProductoComponente> components) {
        jdbcTemplate.update("DELETE FROM producto_composicion WHERE producto_padre_id = ?", padreId);
        String sql = "INSERT INTO producto_composicion (producto_padre_id, producto_hijo_id, cantidad) VALUES (?, ?, ?)";
        for (ProductoComponente comp : components) {
            if (comp.getProductoHijoId() != null && comp.getCantidad() != null && comp.getCantidad() > 0) {
                jdbcTemplate.update(sql, padreId, comp.getProductoHijoId(), comp.getCantidad());
            }
        }
    }
}
