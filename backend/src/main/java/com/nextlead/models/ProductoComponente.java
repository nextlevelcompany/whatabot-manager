package com.nextlead.models;

public class ProductoComponente {
    private Long productoPadreId;
    private Long productoHijoId;
    private String nombre;
    private Double cantidad;
    private Boolean requiereRetorno;
    private Long categoriaId;

    public ProductoComponente() {}

    public Long getProductoPadreId() { return productoPadreId; }
    public void setProductoPadreId(Long productoPadreId) { this.productoPadreId = productoPadreId; }

    public Long getProductoHijoId() { return productoHijoId; }
    public void setProductoHijoId(Long productoHijoId) { this.productoHijoId = productoHijoId; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public Double getCantidad() { return cantidad; }
    public void setCantidad(Double cantidad) { this.cantidad = cantidad; }

    public Boolean getRequiereRetorno() { return requiereRetorno; }
    public void setRequiereRetorno(Boolean requiereRetorno) { this.requiereRetorno = requiereRetorno; }

    public Long getCategoriaId() { return categoriaId; }
    public void setCategoriaId(Long categoriaId) { this.categoriaId = categoriaId; }
}
