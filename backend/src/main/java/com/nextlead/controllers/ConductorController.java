package com.nextlead.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.sql.Date;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/conductores")
public class ConductorController {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public ConductorController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<?> getAll() {
        try {
            List<Map<String, Object>> list = jdbcTemplate.queryForList(
                "SELECT * FROM conductores ORDER BY id DESC"
            );
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al obtener conductores: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            List<Map<String, Object>> list = jdbcTemplate.queryForList(
                "SELECT * FROM conductores WHERE id = ?", id
            );
            if (list.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(list.get(0));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al obtener conductor: " + e.getMessage()));
        }
    }

    @PostMapping("/save")
    @Transactional
    public ResponseEntity<?> save(@RequestBody SaveConductorRequest req) {
        try {
            if (req.nombre == null || req.nombre.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "El nombre es obligatorio."));
            }

            Date dateMotor = (req.fecha_mantenimiento_motor != null && !req.fecha_mantenimiento_motor.trim().isEmpty())
                ? Date.valueOf(req.fecha_mantenimiento_motor) : null;
            Date dateGas = (req.fecha_mantenimiento_gas != null && !req.fecha_mantenimiento_gas.trim().isEmpty())
                ? Date.valueOf(req.fecha_mantenimiento_gas) : null;

            boolean isEdit = req.id != null;

            if (isEdit) {
                jdbcTemplate.update(
                    "UPDATE conductores SET nombre = ?, apellido = ?, foto = ?, dni = ?, telefono = ?, licencia = ?, " +
                    "vehiculo_placa = ?, vehiculo_marca = ?, vehiculo_modelo = ?, vehiculo_anho = ?, tipo_combustible = ?, " +
                    "vehiculo_tipo = ?, capacidad_toneladas = ?, fecha_mantenimiento_motor = ?, fecha_mantenimiento_gas = ?, " +
                    "departamento = ?, provincia = ?, distrito = ?, direccion = ?, latitud = ?, longitud = ?, notas = ?, activo = ? " +
                    "WHERE id = ?",
                    req.nombre, req.apellido, req.foto, req.dni, req.telefono, req.licencia,
                    req.vehiculo_placa, req.vehiculo_marca, req.vehiculo_modelo, req.vehiculo_anho, req.tipo_combustible,
                    req.vehiculo_tipo, req.capacidad_toneladas, dateMotor, dateGas,
                    req.departamento, req.provincia, req.distrito, req.direccion, req.latitud, req.longitud, req.notas,
                    req.activo != null ? req.activo : true, req.id
                );
                return ResponseEntity.ok(Map.of("message", "Conductor actualizado con éxito.", "id", req.id));
            } else {
                jdbcTemplate.update(
                    "INSERT INTO conductores (nombre, apellido, foto, dni, telefono, licencia, vehiculo_placa, " +
                    "vehiculo_marca, vehiculo_modelo, vehiculo_anho, tipo_combustible, vehiculo_tipo, capacidad_toneladas, " +
                    "fecha_mantenimiento_motor, fecha_mantenimiento_gas, departamento, provincia, distrito, direccion, " +
                    "latitud, longitud, notas, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    req.nombre, req.apellido, req.foto, req.dni, req.telefono, req.licencia, req.vehiculo_placa,
                    req.vehiculo_marca, req.vehiculo_modelo, req.vehiculo_anho, req.tipo_combustible, req.vehiculo_tipo,
                    req.capacidad_toneladas, dateMotor, dateGas,
                    req.departamento, req.provincia, req.distrito, req.direccion, req.latitud, req.longitud, req.notas,
                    req.activo != null ? req.activo : true
                );
                Long newId = jdbcTemplate.queryForObject("SELECT lastval()", Long.class);
                return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("message", "Conductor registrado con éxito.", "id", newId));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al guardar conductor: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            int rows = jdbcTemplate.update("DELETE FROM conductores WHERE id = ?", id);
            if (rows == 0) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(Map.of("message", "Conductor eliminado con éxito."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al eliminar conductor: " + e.getMessage()));
        }
    }

    public static class SaveConductorRequest {
        public Long id;
        public String nombre;
        public String apellido;
        public String foto;
        public String dni;
        public String telefono;
        public String licencia;
        public String vehiculo_placa;
        public String vehiculo_marca;
        public String vehiculo_modelo;
        public String vehiculo_anho;
        public String tipo_combustible;
        public String vehiculo_tipo;
        public Double capacidad_toneladas;
        public String fecha_mantenimiento_motor;
        public String fecha_mantenimiento_gas;
        public String departamento;
        public String provincia;
        public String distrito;
        public String direccion;
        public Double latitud;
        public Double longitud;
        public String notas;
        public Boolean activo;
    }
}
