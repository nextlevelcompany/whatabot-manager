package com.nextlead.controllers;

import com.nextlead.dao.UserDao;
import com.nextlead.models.User;
import com.nextlead.security.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

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

    @Mock
    private JwtUtils jwtUtils;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void loginUser_WithValidCredentials_ShouldReturnOkAndToken() {
        AuthController.LoginRequest request = new AuthController.LoginRequest();
        request.setUsername("testuser");
        request.setPassword("correctpass");

        User user = new User(1L, "testuser", "hashedpass", "USER");
        when(userDao.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correctpass", "hashedpass")).thenReturn(true);
        when(jwtUtils.generateToken("testuser", "USER")).thenReturn("mocktoken");

        ResponseEntity<?> response = authController.login(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void loginUser_WithInvalidCredentials_ShouldReturnUnauthorized() {
        AuthController.LoginRequest request = new AuthController.LoginRequest();
        request.setUsername("testuser");
        request.setPassword("wrongpass");

        User user = new User(1L, "testuser", "hashedpass", "USER");
        when(userDao.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongpass", "hashedpass")).thenReturn(false);

        ResponseEntity<?> response = authController.login(request);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("Usuario o contraseña incorrectos", response.getBody());
    }

    @Test
    void getProfile_WhenUserExists_ShouldReturnProfile() {
        User user = new User();
        user.setUsername("testuser");
        user.setRole("USER");
        user.setFirstName("John");
        user.setLastName("Doe");

        when(userDao.findByUsername("testuser")).thenReturn(Optional.of(user));

        ResponseEntity<?> response = authController.getProfile("testuser");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void getProfile_WhenUserDoesNotExist_ShouldReturnNotFound() {
        when(userDao.findByUsername("unknown")).thenReturn(Optional.empty());

        ResponseEntity<?> response = authController.getProfile("unknown");

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("Usuario no encontrado", response.getBody());
    }

    @Test
    void updateProfile_WhenUserExists_ShouldReturnOk() {
        User user = new User();
        user.setUsername("testuser");

        AuthController.ProfileRequest request = new AuthController.ProfileRequest();
        request.setFirstName("Jane");
        request.setLastName("Doe");

        when(userDao.findByUsername("testuser")).thenReturn(Optional.of(user));

        ResponseEntity<?> response = authController.updateProfile("testuser", request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Perfil actualizado con éxito", response.getBody());
        verify(userDao, times(1)).updateProfile(any(User.class));
    }
}
