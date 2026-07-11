package com.nextlead.controllers;

import com.nextlead.dao.UserDao;
import com.nextlead.models.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
public class UsersController {

    private final UserDao userDao;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UsersController(UserDao userDao, PasswordEncoder passwordEncoder) {
        this.userDao = userDao;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userDao.findAll();
        // Limpiar las contraseñas antes de enviarlas al frontend por seguridad
        for (User user : users) {
            user.setPassword(null);
        }
        return new ResponseEntity<>(users, HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody User newUser) {
        if (newUser.getUsername() == null || newUser.getUsername().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("El nombre de usuario es obligatorio");
        }
        if (newUser.getPassword() == null || newUser.getPassword().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("La contraseña es obligatoria");
        }
        if (userDao.existsByUsername(newUser.getUsername())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("El nombre de usuario ya está registrado");
        }

        // Encriptar la contraseña usando el PasswordEncoder de Spring Security
        newUser.setPassword(passwordEncoder.encode(newUser.getPassword()));
        
        // Valores por defecto para perfil si no se especifican
        if (newUser.getRole() == null || newUser.getRole().trim().isEmpty()) {
            newUser.setRole("USER");
        }
        
        // Guardar en base de datos
        userDao.save(newUser);
        
        // Ocultar la contraseña en la respuesta
        newUser.setPassword(null);
        return new ResponseEntity<>(newUser, HttpStatus.CREATED);
    }

    @PutMapping("/{username}")
    public ResponseEntity<?> updateUser(@PathVariable String username, @RequestBody User updatedUser) {
        java.util.Optional<User> existingUserOpt = userDao.findByUsername(username);
        if (existingUserOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado");
        }

        User existingUser = existingUserOpt.get();

        // Actualizar rol si se especifica
        if (updatedUser.getRole() != null && !updatedUser.getRole().trim().isEmpty()) {
            existingUser.setRole(updatedUser.getRole());
        }
        
        // Encriptar y actualizar contraseña solo si se provee una nueva
        if (updatedUser.getPassword() != null && !updatedUser.getPassword().trim().isEmpty()) {
            existingUser.setPassword(passwordEncoder.encode(updatedUser.getPassword()));
        }
        
        existingUser.setFirstName(updatedUser.getFirstName());
        existingUser.setLastName(updatedUser.getLastName());
        existingUser.setPhone(updatedUser.getPhone());
        existingUser.setLocation(updatedUser.getLocation());
        existingUser.setBio(updatedUser.getBio());
        
        if (updatedUser.getAvatar() != null) {
            existingUser.setAvatar(updatedUser.getAvatar());
        }

        userDao.update(existingUser);

        // Ocultar la contraseña en la respuesta
        existingUser.setPassword(null);
        return ResponseEntity.ok(existingUser);
    }

    @DeleteMapping("/{username}")
    public ResponseEntity<?> deleteUser(@PathVariable String username) {
        if (!userDao.existsByUsername(username)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado");
        }
        userDao.deleteByUsername(username);
        return ResponseEntity.noContent().build();
    }
}
