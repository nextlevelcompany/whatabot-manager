package com.nextlead.models;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class Contact {
    private Long id;
    private String tipoPersona;      // NATURAL | EMPRESA
    private String tipoDocumento;    // DNI | CE | RUC
    private String numeroDocumento;
    // Persona Natural
    private String nombres;
    private String apellidos;
    // Empresa
    private String razonSocial;
    // Contacto
    private String telefonoPrincipal;
    private String telefonoSecundario;
    private String email;
    // Relación Persona Natural → Empresa
    private Long empresaId;
    private String empresaNombre;    // Resuelto con JOIN, no se persiste
    // Estado
    private Boolean starred;
    private Boolean aiActive = false;
    private LocalDateTime dateCreated;
    private String referencia;
    private String status = "Lead";
    // Relación 1-N con direcciones
    private List<Direccion> direcciones = new ArrayList<>();

    public Contact() {}

    // Computed helper: nombre para mostrar en la UI
    public String getNombreDisplay() {
        if ("NATURAL".equals(tipoPersona)) {
            return (nombres != null ? nombres : "") + " " + (apellidos != null ? apellidos : "");
        }
        return razonSocial != null ? razonSocial : "";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTipoPersona() { return tipoPersona; }
    public void setTipoPersona(String tipoPersona) { this.tipoPersona = tipoPersona; }

    public String getTipoDocumento() { return tipoDocumento; }
    public void setTipoDocumento(String tipoDocumento) { this.tipoDocumento = tipoDocumento; }

    public String getNumeroDocumento() { return numeroDocumento; }
    public void setNumeroDocumento(String numeroDocumento) { this.numeroDocumento = numeroDocumento; }

    public String getNombres() { return nombres; }
    public void setNombres(String nombres) { this.nombres = nombres; }

    public String getApellidos() { return apellidos; }
    public void setApellidos(String apellidos) { this.apellidos = apellidos; }

    public String getRazonSocial() { return razonSocial; }
    public void setRazonSocial(String razonSocial) { this.razonSocial = razonSocial; }

    public String getTelefonoPrincipal() { return telefonoPrincipal; }
    public void setTelefonoPrincipal(String telefonoPrincipal) { this.telefonoPrincipal = telefonoPrincipal; }

    public String getTelefonoSecundario() { return telefonoSecundario; }
    public void setTelefonoSecundario(String telefonoSecundario) { this.telefonoSecundario = telefonoSecundario; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Long getEmpresaId() { return empresaId; }
    public void setEmpresaId(Long empresaId) { this.empresaId = empresaId; }

    public String getEmpresaNombre() { return empresaNombre; }
    public void setEmpresaNombre(String empresaNombre) { this.empresaNombre = empresaNombre; }

    public Boolean getStarred() { return starred; }
    public void setStarred(Boolean starred) { this.starred = starred; }

    public LocalDateTime getDateCreated() { return dateCreated; }
    public void setDateCreated(LocalDateTime dateCreated) { this.dateCreated = dateCreated; }

    public List<Direccion> getDirecciones() { return direcciones; }
    public void setDirecciones(List<Direccion> direcciones) { this.direcciones = direcciones; }

    public String getReferencia() { return referencia; }
    public void setReferencia(String referencia) { this.referencia = referencia; }

    public Boolean getAiActive() { return aiActive != null ? aiActive : false; }
    public void setAiActive(Boolean aiActive) { this.aiActive = aiActive; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
