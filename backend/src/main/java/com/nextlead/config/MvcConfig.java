package com.nextlead.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

@Configuration
public class MvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String uploadDir = "/app/uploads/";
        
        // Creamos la carpeta local si no existe para evitar errores al servir
        File file = new File(uploadDir);
        if (!file.exists()) {
            file.mkdirs();
        }

        // Mapea la URL /uploads/** al directorio físico de la máquina/contenedor
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadDir);
    }
}
