CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id SERIAL PRIMARY KEY,
    sender VARCHAR(50) NOT NULL,
    receiver VARCHAR(50) NOT NULL,
    message_text TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL,
    wamid VARCHAR(100)
);

ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS wamid VARCHAR(100);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    first_name VARCHAR(50) DEFAULT 'Kate',
    last_name VARCHAR(50) DEFAULT 'Jones',
    location VARCHAR(100) DEFAULT 'Lane no 1, Newyork',
    bio TEXT DEFAULT '',
    phone VARCHAR(20) DEFAULT 'xxxxxxx987',
    website VARCHAR(100) DEFAULT 'hencework.com',
    avatar TEXT
);

-- Insertar usuario admin por defecto (username: admin, password: admin123)
-- El hash corresponde a 'admin123' usando BCrypt
INSERT INTO users (username, password, role)
VALUES ('admin', '$2a$10$3qmN3JiCajG5W2xrAMX1fexcOk59QXICEQd3Drjd.4u1PmUs1pD.6', 'ADMIN')
ON CONFLICT (username) DO NOTHING;

-- Asegurar que las columnas del perfil existan si la tabla ya había sido creada sin ellas
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(50) DEFAULT 'Kate';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(50) DEFAULT 'Jones';
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(100) DEFAULT 'Lane no 1, Newyork';
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20) DEFAULT 'xxxxxxx987';
ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR(100) DEFAULT 'hencework.com';
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;


-- ============================================================
-- MÓDULO DE CONTACTOS (Perú)
-- ============================================================

-- Tabla maestra de Ubigeo del Perú (INEI)
CREATE TABLE IF NOT EXISTS ubigeo_peru (
    codigo_ubigeo VARCHAR(6) PRIMARY KEY,
    departamento  VARCHAR(100) NOT NULL,
    provincia     VARCHAR(100) NOT NULL,
    distrito      VARCHAR(100) NOT NULL
);

-- Entidad principal de contactos (Personas Naturales y Empresas)
CREATE TABLE IF NOT EXISTS contacts (
    id                   BIGSERIAL PRIMARY KEY,
    tipo_persona         VARCHAR(20)  NOT NULL CHECK (tipo_persona IN ('NATURAL','EMPRESA')),
    tipo_documento       VARCHAR(20)  NOT NULL CHECK (tipo_documento IN ('DNI','CE','RUC')),
    numero_documento     VARCHAR(20)  NOT NULL UNIQUE,
    nombres              VARCHAR(100),
    apellidos            VARCHAR(100),
    razon_social         VARCHAR(200),
    telefono_principal   VARCHAR(20)  NOT NULL,
    telefono_secundario  VARCHAR(20),
    email                VARCHAR(100),
    empresa_id           BIGINT       REFERENCES contacts(id) ON DELETE SET NULL,
    starred              BOOLEAN      DEFAULT FALSE,
    ai_active            BOOLEAN      DEFAULT FALSE,
    date_created         TIMESTAMP    DEFAULT NOW()
);

-- Direcciones (relación 1 a Muchos con contacts)
CREATE TABLE IF NOT EXISTS direcciones (
    id_direccion       BIGSERIAL PRIMARY KEY,
    id_contacto        BIGINT       NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    nombre_ubicacion   VARCHAR(100) NOT NULL,
    codigo_ubigeo      VARCHAR(6)   REFERENCES ubigeo_peru(codigo_ubigeo) ON DELETE SET NULL,
    direccion_completa VARCHAR(250) NOT NULL,
    referencia         VARCHAR(250),
    latitud            DOUBLE PRECISION,
    longitud           DOUBLE PRECISION
);

-- Asegurar columna empresa_id si la tabla ya existía sin ella
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS empresa_id BIGINT REFERENCES contacts(id) ON DELETE SET NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS referencia VARCHAR(250);

-- Tabla para almacenar configuraciones dinámicas de la aplicación (como credenciales de Meta y Gemini)
CREATE TABLE IF NOT EXISTS system_settings (
    key_name VARCHAR(100) PRIMARY KEY,
    value_text TEXT NOT NULL
);

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS ai_active BOOLEAN DEFAULT FALSE;

-- ============================================================
-- MÓDULO DE PRODUCTOS Y CATEGORÍAS
-- ============================================================

CREATE TABLE IF NOT EXISTS categorias_producto (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    categoria_id INT REFERENCES categorias_producto(id) ON DELETE SET NULL,
    precio_venta NUMERIC(10, 2) DEFAULT 0.00,
    stock_actual INT DEFAULT 0,
    imagen TEXT,
    es_pack BOOLEAN DEFAULT FALSE,
    requiere_retorno BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS producto_composicion (
    producto_padre_id INT REFERENCES productos(id) ON DELETE CASCADE,
    producto_hijo_id INT REFERENCES productos(id) ON DELETE CASCADE,
    cantidad NUMERIC(10, 2) NOT NULL,
    PRIMARY KEY (producto_padre_id, producto_hijo_id)
);

-- Seed Categorías
INSERT INTO categorias_producto (nombre, descripcion, activo) VALUES
('Envase 20L', 'Categoría para envases vacíos de 20 litros', TRUE),
('Bidón 10L', 'Categoría para bidones de 10 litros', TRUE),
('Recargas 20L', 'Categoría para recargas de agua en bidones de 20 litros', TRUE),
('Bidón Completo (Envase + Recarga)', 'Combo inicial de envase nuevo con recarga de agua', TRUE),
('Promociones', 'Packs promocionales y ofertas especiales', TRUE)
ON CONFLICT (nombre) DO NOTHING;

-- Seed Productos
INSERT INTO productos (codigo, nombre, descripcion, categoria_id, precio_venta, stock_actual, es_pack, requiere_retorno, activo) VALUES
('E_B20LSN', 'Envase Bidón 20 L Sin Caño', 'Envase Bidón 20 L Sin Caño', (SELECT id FROM categorias_producto WHERE nombre = 'Envase 20L'), 13.00, 0, FALSE, FALSE, TRUE),
('EB_10L', 'Envase Bidón 10 L', 'Envase Bidón 10 L', (SELECT id FROM categorias_producto WHERE nombre = 'Bidón 10L'), 0.00, -149, FALSE, FALSE, TRUE),
('RB10_', 'Recarga Bidón 10L', 'Recarga Bidón 10L', (SELECT id FROM categorias_producto WHERE nombre = 'Bidón 10L'), 0.00, -272, FALSE, FALSE, TRUE),
('E_B20LCN', 'Envase Bidón 20 L Con Caño', 'Envase Bidón 20 L Con Caño', (SELECT id FROM categorias_producto WHERE nombre = 'Envase 20L'), 13.00, -6, FALSE, FALSE, TRUE),
('B20L-C-R', 'Recarga Bidón 20L con Caño', 'Recarga de bidón 20L de agua alcalina con caño', (SELECT id FROM categorias_producto WHERE nombre = 'Recargas 20L'), 16.00, -446, FALSE, FALSE, TRUE),
('B20L-SC-R', 'Recarga Bidón 20L sin Caño', 'Recarga de 20L para dispensador. Agua ozonizada sin caño', (SELECT id FROM categorias_producto WHERE nombre = 'Recargas 20L'), 16.00, -17, FALSE, FALSE, TRUE),
('B20L-C-E', 'Bidón 20L (Envase + Recarga) con Caño', '¡Bienvenido a Antarqui! ✨ Incluye Bidón de 20L con caño más recarga de agua.', (SELECT id FROM categorias_producto WHERE nombre = 'Bidón Completo (Envase + Recarga)'), 30.00, 0, FALSE, FALSE, TRUE),
('B20L-SC-E', 'Bidón 20L (Envase + Recarga) sin Caño', 'Pack de inicio: Envase Nuevo + 20L de agua ozonizada sin caño.', (SELECT id FROM categorias_producto WHERE nombre = 'Bidón Completo (Envase + Recarga)'), 30.00, 0, FALSE, FALSE, TRUE),
('B10L-I', 'Bidón 10L No Retornable', 'Bidón práctico de 10L No Retornable.', (SELECT id FROM categorias_producto WHERE nombre = 'Bidón 10L'), 7.50, -130, FALSE, FALSE, TRUE),
('P4-B10L', 'Pack 4 Bidones 10L', 'OFERTA: Lleva 4 bidones de 10L y paga solo por una fracción.', (SELECT id FROM categorias_producto WHERE nombre = 'Bidón 10L'), 24.00, 0, TRUE, FALSE, TRUE),
('P6-B10L', 'Pack 6 Bidones 10L', 'SUPER PRECIO: 6 unidades de 10L (S/ 5.50 c/u)', (SELECT id FROM categorias_producto WHERE nombre = 'Bidón 10L'), 33.00, 0, TRUE, FALSE, TRUE),
('P8-B10L', 'Pack 8 Bidones 10L', 'MAXI AHORRO: 8 bidones de 10L a precio de distribuidor.', (SELECT id FROM categorias_producto WHERE nombre = 'Bidón 10L'), 40.00, 0, TRUE, FALSE, TRUE),
('P3-B20LC-B10LG', 'Pack 3 Recargas 20L con Caño + 1 Bidon de 10 L', 'PROMO ESTRELLA: 3 Recargas de 20L + 1 Bidón de 10L gratis', (SELECT id FROM categorias_producto WHERE nombre = 'Promociones'), 48.00, 0, TRUE, FALSE, TRUE),
('P3-B20LC', 'Pack 3 Recargas Bidón 20L con Caño', 'Trío Saludable: 3 Recargas de 20L con caño', (SELECT id FROM categorias_producto WHERE nombre = 'Promociones'), 45.00, 0, TRUE, FALSE, TRUE),
('P3-B20LE-B10LG', 'Pack 3 Recargas Bidón 20L + Envase + Bidón 10L gratis', 'COMBO NUEVO CLIENTE: 3 Bidones nuevos (Lleva envase + recarga) + 1 bidón de 10L gratis', (SELECT id FROM categorias_producto WHERE nombre = 'Promociones'), 90.00, 0, TRUE, FALSE, TRUE)
ON CONFLICT (codigo) DO NOTHING;

