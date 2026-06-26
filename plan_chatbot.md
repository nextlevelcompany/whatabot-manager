# Plan de Implementación Modular del Chatbot (Java - NextLead CRM)

Este archivo sirve como checklist y guía técnica para portar de forma limpia y por fases la lógica avanzada de respuestas del bot de Wassenger a tu aplicación Spring Boot.

---

## 📌 Estado del Plan

- [x] **Fase 1: Filtro `canReply`** (Prioridad: Alta)
- [x] **Fase 2: Filtro `humanFallback`** (Prioridad: Alta)
- [x] **Fase 3: Memoria `conversationHistory`** (Prioridad: Crítica)
- [x] **Fase 4: Límites `messageQuota`** (Prioridad: Media)
- [x] **Fase 5: Entrada `audioTranscription`** (Prioridad: Media)
- [x] **Fase 6: Salida `mediaResponse`** (Prioridad: Baja)

---

## 🛠️ Detalle de Fases y Lógica de Pruebas

### 1. Fase 1: Filtro `canReply` (Evitar responder a chats atendidos)
* **Objetivo:** Impedir que el bot responda automáticamente si un agente del CRM está conversando activamente con el cliente o si el número está bloqueado/baneado.
* **Archivos a modificar:**
  * [WhatsAppWebhookController.java](file:///C:/Proyectos/CRM_WHATAPP/nextlead/backend/src/main/java/com/nextlead/controllers/WhatsAppWebhookController.java) (Lógica de filtrado en el webhook).
* **Lógica a implementar:**
  1. Validar que el mensaje no provenga de nuestro propio número comercial.
  2. Consultar si el contacto en la base de datos tiene activa la IA individualmente (`contact.getAiActive()`).
  3. Consultar en la base de datos de mensajes el último remitente. Si el último mensaje fue enviado manualmente por un usuario del CRM (agente humano), desactivar temporalmente la respuesta de la IA (canReply = false).
* **Cómo probar:**
  1. Envía un mensaje desde tu celular -> La IA debe responder.
  2. Desde la pantalla del CRM, envía un mensaje manual al cliente.
  3. Envía otro mensaje desde tu celular -> La IA **no** debe responder (el control lo tiene el humano).

---

### 2. Fase 2: Filtro `humanFallback` (Derivación por palabras clave)
* **Objetivo:** Desconectar la IA inmediatamente si el cliente usa palabras de parada de emergencia.
* **Archivos a modificar:**
  * [WhatsAppWebhookController.java](file:///C:/Proyectos/CRM_WHATAPP/nextlead/backend/src/main/java/com/nextlead/controllers/WhatsAppWebhookController.java)
  * `ContactDao.java` / `ContactDaoImpl.java` (Asegurar método de actualización de estado).
* **Lógica a implementar:**
  1. Interceptar el texto entrante.
  2. Compararlo contra una expresión regular: `^(humano|persona|ayuda|stop|asesor|agente|hablar con alguien)$`.
  3. Si hay coincidencia:
     * Cambiar el estado del contacto en la BD: `ai_active = false`.
     * Enviar mensaje de WhatsApp al cliente: *"He derivado tu caso con un asesor, en breve te atenderán."*
     * Registrar una alerta del sistema en la BD del chat para que aparezca en la UI del CRM.
* **Cómo probar:**
  1. Escribe al WhatsApp del bot: *"Quiero hablar con un agente"* o *"Ayuda por favor"*.
  2. Verifica que el bot te responda el mensaje de derivación.
  3. Escribe cualquier otra cosa -> El bot debe permanecer en silencio (IA apagada para tu número).
  4. En la base de datos, confirma que el campo `ai_active` del contacto sea `false`.

---

### 3. Fase 3: Memoria `conversationHistory` (Historial para Gemini)
* **Objetivo:** Proporcionar los últimos mensajes a Gemini para que tenga memoria contextual.
* **Archivos a modificar:**
  * [GeminiService.java](file:///C:/Proyectos/CRM_WHATAPP/nextlead/backend/src/main/java/com/nextlead/services/GeminiService.java)
  * [WhatsAppWebhookController.java](file:///C:/Proyectos/CRM_WHATAPP/nextlead/backend/src/main/java/com/nextlead/controllers/WhatsAppWebhookController.java)
  * `WhatsAppMessageDao.java` (Método para obtener los últimos `N` mensajes).
* **Lógica a implementar:**
  1. En el webhook, antes de invocar a Gemini, buscar los últimos 6 a 10 mensajes del chat usando el número del cliente.
  2. Formatear la lista en pares de turnos para la API de Gemini:
     * Si el mensaje lo envió el cliente -> Rol: `"user"`.
     * Si el mensaje lo envió el CRM -> Rol: `"model"`.
  3. Ajustar la estructura JSON de la petición HTTP a Gemini para enviar el array completo de `contents`.
* **Cómo probar:**
  1. Pregunta: *"Hola, ¿cuánto cuesta el bidón de agua alcalina?"*
  2. Respuesta esperada: *"Cuesta S/ 15."*
  3. Contrapregunta: *"¿Y me lo puedes enviar a San Isidro?"*
  4. Respuesta esperada: *"Sí, enviamos a San Isidro. El costo de delivery es S/ X..."* (Debe responder correctamente a "lo" y saber que hablas del bidón y del envío).

---

### 4. Fase 4: Límite `messageQuota` (Protección contra bucles)
* **Objetivo:** Evitar bucles infinitos de respuestas (ej. si el contestador automático del cliente entra en conflicto con tu bot).
* **Archivos a modificar:**
  * [WhatsAppWebhookController.java](file:///C:/Proyectos/CRM_WHATAPP/nextlead/backend/src/main/java/com/nextlead/controllers/WhatsAppWebhookController.java)
* **Lógica a implementar:**
  1. Usar un caché en memoria simple (ej. `ConcurrentHashMap<String, Integer>`) o persistir en BD para contar los mensajes enviados por el bot al cliente en las últimas 24 horas.
  2. Si el contador supera un límite predefinido (ej. 30 mensajes):
     * Pausar el bot para ese contacto (`ai_active = false`).
     * Enviar alerta al CRM: *"⚠️ Límite de mensajes automáticos excedido para el contacto X. Bot desactivado por seguridad."*
* **Cómo probar:**
  1. Configura un límite de prueba bajo (ej. 3 mensajes).
  2. Chatea con el bot. Al llegar al 3er mensaje, el bot debe detenerse y lanzar la alerta en el CRM.

---

### 5. Fase 5: Entrada `audioTranscription` (Transcripción de notas de voz)
* **Objetivo:** Comprender cuando los clientes envían notas de voz en lugar de texto.
* **Archivos a modificar:**
  * [WhatsAppWebhookController.java](file:///C:/Proyectos/CRM_WHATAPP/nextlead/backend/src/main/java/com/nextlead/controllers/WhatsAppWebhookController.java)
  * `WhatsAppApiService.java` (Ya tiene `downloadMedia`).
  * `WhisperService` o integrar transcripción multimodal con Gemini.
* **Lógica a implementar:**
  1. Detectar cuando entra un mensaje con `type = "audio"`.
  2. Descargar el archivo `.ogg` / `.mp3` usando `apiService.downloadMedia(...)`.
  3. Enviar el archivo a la API de Whisper (OpenAI) o codificarlo en Base64 para enviarlo a Gemini (que soporta audio nativamente en su modelo 2.5 Flash).
  4. Utilizar el texto transcrito como la consulta del cliente.
* **Cómo probar:**
  1. Envía un audio diciendo *"Hola, precio por favor"* desde tu teléfono.
  2. El system debe transcribir el audio, responder en texto con la tarifa de los productos y guardar la transcripción en la BD.

---

### 6. Fase 6: Salida `mediaResponse` (Envío automatizado de archivos y catálogo)
* **Objetivo:** Que el bot pueda enviar imágenes, PDFs de catálogos o audios automáticamente.
* **Archivos a modificar:**
  * [WhatsAppWebhookController.java](file:///C:/Proyectos/CRM_WHATAPP/nextlead/backend/src/main/java/com/nextlead/controllers/WhatsAppWebhookController.java)
* **Lógica a implementar:**
  1. Analizar la respuesta de Gemini en busca de etiquetas multimedia personalizadas: `[IMG:nombre|url]` o `[PDF:nombre|url]`.
  2. Si se detecta:
     * Descargar el archivo localmente o leerlo.
     * Subirlo a Meta usando `apiService.uploadMedia(...)` para obtener el `mediaId`.
     * Enviar el mensaje estructurado de WhatsApp usando `apiService.sendMediaMessage(...)`.
* **Cómo probar:**
  1. Pregunta al bot por catálogo o imágenes de productos.
  2. Deberías recibir un mensaje real con la imagen adjunta en WhatsApp.
