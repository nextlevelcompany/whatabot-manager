package com.nextlead.models;

public class Direccion {
    private Long idDireccion;
    private Long idContacto;
    private String nombreUbicacion;
    private String codigoUbigeo;
    // Resueltos via JOIN con ubigeo_peru
    private String departamento;
    private String provincia;
    private String distrito;
    private String direccionCompleta;
    private String referencia;
    private Double latitud;
    private Double longitud;

    public Direccion() {}

    public Long getIdDireccion() { return idDireccion; }
    public void setIdDireccion(Long idDireccion) { this.idDireccion = idDireccion; }

    public Long getIdContacto() { return idContacto; }
    public void setIdContacto(Long idContacto) { this.idContacto = idContacto; }

    public String getNombreUbicacion() { return nombreUbicacion; }
    public void setNombreUbicacion(String nombreUbicacion) { this.nombreUbicacion = nombreUbicacion; }

    public String getCodigoUbigeo() { return codigoUbigeo; }
    public void setCodigoUbigeo(String codigoUbigeo) { this.codigoUbigeo = codigoUbigeo; }

    public String getDepartamento() { return departamento; }
    public void setDepartamento(String departamento) { this.departamento = departamento; }

    public String getProvincia() { return provincia; }
    public void setProvincia(String provincia) { this.provincia = provincia; }

    public String getDistrito() { return distrito; }
    public void setDistrito(String distrito) { this.distrito = distrito; }

    public String getDireccionCompleta() { return direccionCompleta; }
    public void setDireccionCompleta(String direccionCompleta) { this.direccionCompleta = direccionCompleta; }

    public String getReferencia() { return referencia; }
    public void setReferencia(String referencia) { this.referencia = referencia; }

    public Double getLatitud() { return latitud; }
    public void setLatitud(Double latitud) { this.latitud = latitud; }

    public Double getLongitud() { return longitud; }
    public void setLongitud(Double longitud) { this.longitud = longitud; }
}
