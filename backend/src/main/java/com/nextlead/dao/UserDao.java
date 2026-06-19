package com.nextlead.dao;

import com.nextlead.models.User;
import java.util.Optional;

public interface UserDao {
    void save(User user);
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    long count();
    void updateProfile(User user);
}
