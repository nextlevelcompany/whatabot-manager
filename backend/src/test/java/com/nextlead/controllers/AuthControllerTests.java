package com.nextlead.controllers;

import com.nextlead.dao.UserDao;
import com.nextlead.models.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class AuthControllerTests {

    @InjectMocks
    private AuthController authController;

    @Mock
    private UserDao userDao;

    @Mock
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        // Configurar valores para campos inyectados con @Value manualmente en el test
        ReflectionTestUtils.setField(authController, "jwtSecret", "9a4f2c8d3e7b1a6c5e8d9c0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u");
        ReflectionTestUtils.setField(authController, "jwtExpirationMs", 86400000L);
    }

    @Test
    void registerUser_WhenUserDoesNotExist_ShouldReturnCreated() {
        User user = new User(null, "newuser", "plainpassword", "USER");
        when(userDao.existsByUsername("newuser")).thenReturn(false);
        when(passwordEncoder.encode("plainpassword")).thenReturn("hashedpassword");

        ResponseEntity<Map<String, String>> response = authController.register(user);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals("Usuario registrado exitosamente", response.getBody().get("message"));
        verify(userDao, times(1)).save(any(User.class));
    }

    @Test
    void registerUser_WhenUserExists_ShouldReturnBadRequest() {
        User user = new User(null, "existinguser", "password", "USER");
        when(userDao.existsByUsername("existinguser")).thenReturn(true);

        ResponseEntity<Map<String, String>> response = authController.register(user);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("El nombre de usuario ya está registrado", response.getBody().get("error"));
        verify(userDao, never()).save(any(User.class));
    }

    @Test
    void loginUser_WithValidCredentials_ShouldReturnOkAndToken() {
        Map<String, String> request = new HashMap<>();
        request.put("username", "testuser");
        request.put("password", "correctpass");

        User user = new User(1L, "testuser", "hashedpass", "USER");
        when(userDao.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correctpass", "hashedpass")).thenReturn(true);

        ResponseEntity<Map<String, String>> response = authController.login(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody().get("token"));
        assertEquals("testuser", response.getBody().get("username"));
    }

    @Test
    void loginUser_WithInvalidCredentials_ShouldReturnUnauthorized() {
        Map<String, String> request = new HashMap<>();
        request.put("username", "testuser");
        request.put("password", "wrongpass");

        User user = new User(1L, "testuser", "hashedpass", "USER");
        when(userDao.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongpass", "hashedpass")).thenReturn(false);

        ResponseEntity<Map<String, String>> response = authController.login(request);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("Credenciales incorrectas", response.getBody().get("error"));
    }
}
