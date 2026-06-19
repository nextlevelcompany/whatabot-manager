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
    role VARCHAR(20) NOT NULL
);

-- Insertar usuario admin por defecto (username: admin, password: admin123)
-- El hash corresponde a 'admin123' usando BCrypt
INSERT INTO users (username, password, role)
VALUES ('admin', '$2a$10$3qmN3JiCajG5W2xrAMX1fexcOk59QXICEQd3Drjd.4u1PmUs1pD.6', 'ADMIN')
ON CONFLICT (username) DO NOTHING;
