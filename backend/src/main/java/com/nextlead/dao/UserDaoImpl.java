package com.nextlead.dao;

import com.nextlead.models.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;

@Repository
public class UserDaoImpl implements UserDao {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public UserDaoImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<User> rowMapper = new RowMapper<User>() {
        @Override
        public User mapRow(ResultSet rs, int rowNum) throws SQLException {
            User user = new User();
            user.setId(rs.getLong("id"));
            user.setUsername(rs.getString("username"));
            user.setPassword(rs.getString("password"));
            user.setRole(rs.getString("role"));
            user.setFirstName(rs.getString("first_name"));
            user.setLastName(rs.getString("last_name"));
            user.setLocation(rs.getString("location"));
            user.setBio(rs.getString("bio"));
            user.setPhone(rs.getString("phone"));
            user.setWebsite(rs.getString("website"));
            user.setAvatar(rs.getString("avatar"));
            return user;
        }
    };

    @Override
    public void save(User user) {
        String sql = "INSERT INTO users (username, password, role, first_name, last_name, location, bio, phone, website, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        jdbcTemplate.update(sql, 
            user.getUsername(), 
            user.getPassword(), 
            user.getRole(),
            user.getFirstName() != null ? user.getFirstName() : "Kate",
            user.getLastName() != null ? user.getLastName() : "Jones",
            user.getLocation() != null ? user.getLocation() : "Lane no 1, Newyork",
            user.getBio() != null ? user.getBio() : "",
            user.getPhone() != null ? user.getPhone() : "xxxxxxx987",
            user.getWebsite() != null ? user.getWebsite() : "hencework.com",
            user.getAvatar()
        );
    }

    @Override
    public Optional<User> findByUsername(String username) {
        String sql = "SELECT id, username, password, role, first_name, last_name, location, bio, phone, website, avatar FROM users WHERE username = ?";
        try {
            User user = jdbcTemplate.queryForObject(sql, rowMapper, username);
            return Optional.ofNullable(user);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    public boolean existsByUsername(String username) {
        String sql = "SELECT COUNT(*) FROM users WHERE username = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, username);
        return count != null && count > 0;
    }

    @Override
    public long count() {
        String sql = "SELECT COUNT(*) FROM users";
        Long count = jdbcTemplate.queryForObject(sql, Long.class);
        return count != null ? count : 0;
    }

    @Override
    public void updateProfile(User user) {
        String sql = "UPDATE users SET first_name = ?, last_name = ?, location = ?, bio = ?, phone = ?, website = ?, avatar = ? WHERE username = ?";
        jdbcTemplate.update(sql, 
            user.getFirstName(), 
            user.getLastName(), 
            user.getLocation(), 
            user.getBio(), 
            user.getPhone(), 
            user.getWebsite(),
            user.getAvatar(),
            user.getUsername()
        );
    }
}
