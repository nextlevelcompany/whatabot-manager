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

