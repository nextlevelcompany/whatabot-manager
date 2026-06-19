CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id SERIAL PRIMARY KEY,
    sender VARCHAR(50) NOT NULL,
    receiver VARCHAR(50) NOT NULL,
    message_text TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL
);

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


