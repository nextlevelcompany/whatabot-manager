package com.nextlead.dao;

import com.nextlead.models.CategoriaProducto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.util.List;
import java.util.Optional;

@Repository
public class CategoriaProductoDaoImpl implements CategoriaProductoDao {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public CategoriaProductoDaoImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<CategoriaProducto> rowMapper = (rs, rowNum) -> {
        CategoriaProducto cat = new CategoriaProducto();
        cat.setId(rs.getLong("id"));
        cat.setNombre(rs.getString("nombre"));
        cat.setDescripcion(rs.getString("descripcion"));
        cat.setActivo(rs.getBoolean("activo"));
        return cat;
    };

    @Override
    public List<CategoriaProducto> findAll() {
        String sql = "SELECT * FROM categorias_producto ORDER BY nombre ASC";
        return jdbcTemplate.query(sql, rowMapper);
    }

    @Override
    public Optional<CategoriaProducto> findById(Long id) {
        String sql = "SELECT * FROM categorias_producto WHERE id = ?";
        try {
            CategoriaProducto cat = jdbcTemplate.queryForObject(sql, rowMapper, id);
            return Optional.ofNullable(cat);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    public CategoriaProducto save(CategoriaProducto cat) {
        String sql = "INSERT INTO categorias_producto (nombre, descripcion, activo) VALUES (?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, new String[]{"id"});
            ps.setString(1, cat.getNombre());
            ps.setString(2, cat.getDescripcion());
            ps.setBoolean(3, cat.getActivo() != null ? cat.getActivo() : true);
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key != null) {
            cat.setId(key.longValue());
        }
        return cat;
    }

    @Override
    public void update(CategoriaProducto cat) {
        String sql = "UPDATE categorias_producto SET nombre = ?, descripcion = ?, activo = ? WHERE id = ?";
        jdbcTemplate.update(sql, cat.getNombre(), cat.getDescripcion(), cat.getActivo(), cat.getId());
    }

    @Override
    public void deleteById(Long id) {
        String sql = "DELETE FROM categorias_producto WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    @Override
    public boolean hasAssociatedProducts(Long id) {
        String sql = "SELECT COUNT(*) FROM productos WHERE categoria_id = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, id);
        return count != null && count > 0;
    }
}
