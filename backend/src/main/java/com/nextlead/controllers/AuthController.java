package com.nextlead.controllers;

import com.nextlead.dao.UserDao;
import com.nextlead.models.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserDao userDao;
    private final PasswordEncoder passwordEncoder;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpirationMs;

    @Autowired
    public AuthController(UserDao userDao, PasswordEncoder passwordEncoder) {
        this.userDao = userDao;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@RequestBody User user) {
        Map<String, String> response = new HashMap<>();

        if (userDao.existsByUsername(user.getUsername())) {
            response.put("error", "El nombre de usuario ya está registrado");
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        }

        // Cifrar contraseña usando BCrypt
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        
        if (user.getRole() == null) {
            user.setRole("USER");
        }

        userDao.save(user);

        response.put("message", "Usuario registrado exitosamente");
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody Map<String, String> loginRequest) {
        Map<String, String> response = new HashMap<>();
        String username = loginRequest.get("username");
        String password = loginRequest.get("password");

        if (username == null || password == null) {
            response.put("error", "El nombre de usuario y la contraseña son obligatorios");
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        }

        var userOpt = userDao.findByUsername(username);
        if (userOpt.isEmpty()) {
            response.put("error", "Credenciales incorrectas");
            return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
        }

        User user = userOpt.get();
        if (!passwordEncoder.matches(password, user.getPassword())) {
            response.put("error", "Credenciales incorrectas");
            return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
        }

        // Generar token JWT con firma
        String token = generateJwtToken(user.getUsername(), user.getRole());

        response.put("token", token);
        response.put("username", user.getUsername());
        response.put("role", user.getRole());

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    private String generateJwtToken(String username, String role) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .subject(username)
                .claim("role", role)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }
}
