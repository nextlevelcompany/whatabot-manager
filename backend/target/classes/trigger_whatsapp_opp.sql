-- =========================================================================
-- TRIGGER POSTGRESQL PARA CREAR OPORTUNIDADES AUTOMÁTICAMENTE DESDE WHATSAPP
-- =========================================================================
-- Este script permite automatizar el embudo de ventas en el CRM.
-- Cada vez que ingresa un mensaje de WhatsApp:
-- 1. Si es un contacto nuevo: Al crearse el contacto, se genera su oportunidad.
-- 2. Si es un contacto existente sin tratos activos: Se le abre una nueva oportunidad.
--
-- Todo esto ocurre directamente en la base de datos sin modificar el código Java.
-- NOTA: Se realiza un emparejamiento usando los últimos 9 dígitos para tolerar
-- diferentes formatos de guardado y códigos de país (ej. "51931340288" vs "931340288").

-- 1. FUNCIÓN Y TRIGGER PARA CONTACTOS EXISTENTES QUE ENVIAN MENSAJE
CREATE OR REPLACE FUNCTION trg_create_opportunity_on_wsp()
RETURNS TRIGGER AS $$
DECLARE
    v_contact_id BIGINT;
    v_contact_name VARCHAR;
    v_active_opp_count INT;
    v_default_user_id INT;
    v_max_order INT;
    v_clean_sender VARCHAR;
BEGIN
    -- Solo procesar mensajes recibidos (status = RECEIVED)
    IF NEW.status = 'RECEIVED' THEN
        -- Limpiar y obtener los últimos 9 dígitos del remitente
        v_clean_sender := RIGHT(REGEXP_REPLACE(NEW.sender, '\D', '', 'g'), 9);

        -- Buscar contacto haciendo coincidir los últimos 9 dígitos del teléfono principal
        SELECT id, COALESCE(nombres, '') || ' ' || COALESCE(apellidos, '')
        INTO v_contact_id, v_contact_name
        FROM contacts
        WHERE RIGHT(REGEXP_REPLACE(telefono_principal, '\D', '', 'g'), 9) = v_clean_sender
        LIMIT 1;

        -- Si el contacto ya existe en la base de datos
        IF v_contact_id IS NOT NULL THEN
            -- Verificar si tiene oportunidades comerciales activas (no cerradas ganadas/perdidas)
            SELECT COUNT(*)
            INTO v_active_opp_count
            FROM oportunidades o
            JOIN kanban_columnas kc ON o.etapa_id = kc.id
            WHERE o.contacto_id = v_contact_id
              AND kc.es_ganada = false
              AND kc.es_perdida = false;

            -- Si no tiene oportunidades activas, creamos una
            IF v_active_opp_count = 0 THEN
                -- Obtener primer usuario administrador asignado por defecto
                SELECT id INTO v_default_user_id FROM users LIMIT 1;
                IF v_default_user_id IS NULL THEN
                    v_default_user_id := 1;
                END IF;

                -- Calcular orden en la primera etapa (Prospecto = ID 1)
                SELECT COALESCE(MAX(orden), 0)
                INTO v_max_order
                FROM oportunidades
                WHERE etapa_id = 1;

                -- Insertar la oportunidad
                INSERT INTO oportunidades (
                    titulo,
                    contacto_id,
                    etapa_id,
                    valor,
                    prioridad,
                    etiquetas,
                    usuario_id,
                    orden,
                    created_at,
                    notas
                ) VALUES (
                    'Lead WhatsApp: ' || TRIM(v_contact_name),
                    v_contact_id,
                    1, -- ID de la etapa "Prospecto"
                    0.00,
                    'Media',
                    'WSP', -- Etiqueta identificadora
                    v_default_user_id,
                    v_max_order + 1,
                    NOW(),
                    'Creado automáticamente por mensaje entrante: ' || NEW.message_text
                );
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger en la tabla whatsapp_messages
DROP TRIGGER IF EXISTS trg_whatsapp_opportunity ON whatsapp_messages;
CREATE TRIGGER trg_whatsapp_opportunity
AFTER INSERT ON whatsapp_messages
FOR EACH ROW
EXECUTE FUNCTION trg_create_opportunity_on_wsp();


-- 2. FUNCIÓN Y TRIGGER PARA NUEVOS CONTACTOS CREADOS POR EL WEBHOOK
CREATE OR REPLACE FUNCTION trg_create_opportunity_on_new_contact()
RETURNS TRIGGER AS $$
DECLARE
    v_active_opp_count INT;
    v_default_user_id INT;
    v_max_order INT;
    v_has_wsp_message BOOLEAN;
    v_clean_phone VARCHAR;
BEGIN
    -- Limpiar y obtener los últimos 9 dígitos del teléfono principal del contacto nuevo
    v_clean_phone := RIGHT(REGEXP_REPLACE(NEW.telefono_principal, '\D', '', 'g'), 9);

    -- Validar si el contacto se está registrando a raíz de un mensaje de WhatsApp
    SELECT EXISTS(
        SELECT 1 FROM whatsapp_messages 
        WHERE RIGHT(REGEXP_REPLACE(sender, '\D', '', 'g'), 9) = v_clean_phone
          AND status = 'RECEIVED'
    ) INTO v_has_wsp_message;

    IF v_has_wsp_message THEN
        -- Verificar oportunidades activas
        SELECT COUNT(*)
        INTO v_active_opp_count
        FROM oportunidades o
        JOIN kanban_columnas kc ON o.etapa_id = kc.id
        WHERE o.contacto_id = NEW.id
          AND kc.es_ganada = false
          AND kc.es_perdida = false;

        -- Si es un contacto nuevo (opp count = 0), abrimos la oportunidad
        IF v_active_opp_count = 0 THEN
            SELECT id INTO v_default_user_id FROM users LIMIT 1;
            IF v_default_user_id IS NULL THEN
                v_default_user_id := 1;
            END IF;

            SELECT COALESCE(MAX(orden), 0)
            INTO v_max_order
            FROM oportunidades
            WHERE etapa_id = 1;

            INSERT INTO oportunidades (
                titulo,
                contacto_id,
                etapa_id,
                valor,
                prioridad,
                etiquetas,
                usuario_id,
                orden,
                created_at,
                notas
            ) VALUES (
                'Lead WhatsApp: ' || TRIM(COALESCE(NEW.nombres, '') || ' ' || COALESCE(NEW.apellidos, '')),
                NEW.id,
                1, -- ID de la etapa "Prospecto"
                0.00,
                'Media',
                'WSP',
                v_default_user_id,
                v_max_order + 1,
                NOW(),
                'Oportunidad creada automáticamente al registrar nuevo contacto de WhatsApp.'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger en la tabla contacts
DROP TRIGGER IF EXISTS trg_new_contact_opportunity ON contacts;
CREATE TRIGGER trg_new_contact_opportunity
AFTER INSERT ON contacts
FOR EACH ROW
EXECUTE FUNCTION trg_create_opportunity_on_new_contact();
