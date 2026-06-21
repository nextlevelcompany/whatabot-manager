package com.nextlead.models;

import java.util.ArrayList;
import java.util.List;

public class Producto {
    private Long id;
    private String codigo;
    private String nombre;
    private String descripcion;
    private Long categoriaId;
    private String categoriaNombre;
    private Double precioVenta;
    private Integer stockActual;
    private String imagen;
    private Boolean esPack;
    private Boolean requiereRetorno;
    private Boolean activo;
    private List<ProductoComponente> components = new ArrayList<>();

    public Producto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public Long getCategoriaId() { return categoriaId; }
    public void setCategoriaId(Long categoriaId) { this.categoriaId = categoriaId; }

    public String getCategoriaNombre() { return categoriaNombre; }
    public void setCategoriaNombre(String categoriaNombre) { this.categoriaNombre = categoriaNombre; }

    public Double getPrecioVenta() { return precioVenta; }
    public void setPrecioVenta(Double precioVenta) { this.precioVenta = precioVenta; }

    public Integer getStockActual() { return stockActual; }
    public void setStockActual(Integer stockActual) { this.stockActual = stockActual; }

    public String getImagen() { return imagen; }
    public void setImagen(String imagen) { this.imagen = imagen; }

    public Boolean getEsPack() { return esPack; }
    public void setEsPack(Boolean esPack) { this.esPack = esPack; }

    public Boolean getRequiereRetorno() { return requiereRetorno; }
    public void setRequiereRetorno(Boolean requiereRetorno) { this.requiereRetorno = requiereRetorno; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }

    public List<ProductoComponente> getComponents() { return components; }
    public void setComponents(List<ProductoComponente> components) { this.components = components; }
}
