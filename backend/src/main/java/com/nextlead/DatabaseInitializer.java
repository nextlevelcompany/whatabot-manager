package com.nextlead;

import com.nextlead.dao.UserDao;
import com.nextlead.models.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DatabaseInitializer implements CommandLineRunner {

    private final UserDao userDao;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public DatabaseInitializer(UserDao userDao, PasswordEncoder passwordEncoder) {
        this.userDao = userDao;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // Inicializar el usuario administrador si no existe ninguno
        if (!userDao.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            // admin123
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole("ADMIN");
            userDao.save(admin);
            System.out.println(">>> Usuario administrador por defecto ('admin' con clave 'admin123') creado exitosamente.");
        }
    }
}
