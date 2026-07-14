/* NextLead CRM - Chrome Extension Content Script */

const API_BASE = 'http://localhost:8081'; // Java backend base URL
let activePhone = null;
let activeContactName = '';
let crmContact = null;

// Default canned responses in case the backend FAQ/Knowledge-base is empty
const DEFAULT_RESPONSES = [
  { id: 1, question: "Saludo Inicial", answer: "¡Hola! Gracias por comunicarte con NextLead CRM. ¿En qué podemos ayudarte el día de hoy?" },
  { id: 2, question: "Información de Precios", answer: "Nuestros planes de NextLead CRM son:\n- Plan Básico: $29/mes (hasta 3 agentes)\n- Plan Pro: $59/mes (agentes ilimitados, embudo y reportes)\n¿Te gustaría programar una demo?" },
  { id: 3, question: "Medios de Pago", answer: "Aceptamos pagos con tarjeta de crédito/débito (Visa, Mastercard), transferencias bancarias y Yape/Plin. El cobro es mensual." },
  { id: 4, question: "Despedida", answer: "Quedamos atentos a cualquier otra duda. ¡Que tengas un excelente día!" }
];

// Helper to perform API calls through background service worker to avoid CORS and Mixed Content blocks
function apiCall(url, options = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      type: 'API_CALL',
      url: url,
      options: options
    }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      
      if (!response) {
        reject(new Error("No response received from background script"));
        return;
      }

      // Recreate a pseudo-fetch response object
      resolve({
        status: response.status,
        json: async () => response.data,
        text: async () => typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
        statusText: response.error || ''
      });
    });
  });
}

// Initialize Extension DOM Elements
function initExtension() {
  if (document.getElementById('nextlead-sidebar')) return;

  // 1. Create Floating Toggle Button
  const toggleBtn = document.createElement('div');
  toggleBtn.id = 'nextlead-toggle-btn';
  toggleBtn.title = 'Abrir NextLead CRM';
  toggleBtn.innerHTML = `
    <svg viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  `;
  document.body.appendChild(toggleBtn);

  // 2. Create Sidebar Container
  const sidebar = document.createElement('div');
  sidebar.id = 'nextlead-sidebar';
  sidebar.innerHTML = `
    <!-- Header -->
    <div class="nl-header">
      <div class="nl-brand">
        <div class="nl-brand-logo">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </svg>
        </div>
        <div class="nl-brand-name">NextLead CRM</div>
      </div>
      <button class="nl-close-btn" id="nl-close-sidebar" title="Cerrar Panel">
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <!-- Tabs Nav -->
    <div class="nl-tabs">
      <div class="nl-tab active" data-target="nl-pane-lead">Ficha de Lead</div>
      <div class="nl-tab" data-target="nl-pane-replies">Respuestas</div>
    </div>

    <!-- Content -->
    <div class="nl-content">
      <!-- PANE 1: Lead Info -->
      <div class="nl-pane active" id="nl-pane-lead">
        <!-- Status Sync -->
        <div id="nl-sync-status" class="nl-sync-badge not-synced">
          <span>❌ Sin sincronizar con CRM</span>
        </div>

        <!-- Botón para forzar la lectura manual -->
        <button id="nl-pull-data-btn" class="nl-btn nl-btn-secondary" style="margin-bottom: 5px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 13px; font-weight: 500;">
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="nl-refresh-icon"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
          Jalar Datos del Chat
        </button>

        <!-- Form fields -->
        <div class="nl-form-group">
          <label class="nl-label">Nombre del Cliente</label>
          <input type="text" id="nl-lead-name" class="nl-input" placeholder="Nombre completo">
        </div>

        <div class="nl-form-group">
          <label class="nl-label">Número de Teléfono</label>
          <input type="text" id="nl-lead-phone" class="nl-input" readonly placeholder="Auto-detectando...">
        </div>

        <div class="nl-form-group">
          <label class="nl-label">Estado del Embudo</label>
          <select id="nl-lead-stage" class="nl-select">
            <option value="Nuevo">Nuevo Lead</option>
            <option value="Contactado">Contactado</option>
            <option value="Propuesta">Propuesta Enviada</option>
            <option value="Negociacion">En Negociación</option>
            <option value="Ganado">Cliente Ganado</option>
            <option value="Perdido">Lead Perdido</option>
          </select>
        </div>

        <div class="nl-form-group">
          <label class="nl-label">Distrito / Ubicación</label>
          <input type="text" id="nl-lead-location" class="nl-input" placeholder="Ej: Miraflores, Lima">
        </div>

        <div class="nl-form-group">
          <label class="nl-label">Notas Adicionales</label>
          <textarea id="nl-lead-notes" class="nl-textarea" placeholder="Escribe notas de seguimiento aquí..."></textarea>
        </div>

        <button id="nl-save-lead-btn" class="nl-btn">
          <span>Guardar en CRM</span>
        </button>
      </div>

      <!-- PANE 2: Canned Replies -->
      <div class="nl-pane" id="nl-pane-replies">
        <div class="nl-search-wrapper">
          <input type="text" id="nl-search-replies" class="nl-input nl-search-input" placeholder="Buscar respuesta rápida...">
        </div>

        <div class="nl-response-list" id="nl-replies-container">
          <!-- Populated dynamically -->
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(sidebar);

  // 3. Create Notification Toast element
  const toast = document.createElement('div');
  toast.id = 'nextlead-toast';
  toast.className = 'nl-toast';
  document.body.appendChild(toast);

  // 4. Attach Event Listeners
  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    if (sidebar.classList.contains('open')) {
      checkActiveChat();
    }
  });

  document.getElementById('nl-close-sidebar').addEventListener('click', () => {
    sidebar.classList.remove('open');
  });

  // Tab switching
  const tabs = sidebar.querySelectorAll('.nl-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      sidebar.querySelectorAll('.nl-pane').forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const paneId = tab.getAttribute('data-target');
      document.getElementById(paneId).classList.add('active');
    });
  });

  // Save/Sync Lead Button Click
  document.getElementById('nl-save-lead-btn').addEventListener('click', saveLeadToCRM);

  // Manual Pull Data Button Click
  document.getElementById('nl-pull-data-btn').addEventListener('click', () => {
    checkActiveChat(true);
    showToast('Datos leídos del chat actual.');
  });

  // Search Canned Replies input filter
  document.getElementById('nl-search-replies').addEventListener('input', (e) => {
    filterCannedResponses(e.target.value);
  });

  // Start polling or observing chat changes
  startChatObserver();
}

// Show notification toast helper
function showToast(message) {
  const toast = document.getElementById('nextlead-toast');
  toast.innerText = message;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

// Observe changes to the WhatsApp Web active chat pane (#main)
function startChatObserver() {
  let lastMainFound = false;

  setInterval(() => {
    const mainPane = document.getElementById('main');
    const isMainVisible = !!mainPane;

    if (isMainVisible && !lastMainFound) {
      // Chat pane just loaded/changed
      checkActiveChat();
    }
    lastMainFound = isMainVisible;
  }, 1000);

  // Also listen for clicks on chat list
  document.addEventListener('click', (e) => {
    // If click is inside a chat list item container
    if (e.target.closest('[role="listitem"]') || e.target.closest('._199zF') || e.target.closest('.lhggfd7q')) {
      setTimeout(checkActiveChat, 500);
    }
  });
}

// Scrape active phone number and contact name from WhatsApp Web DOM
function checkActiveChat(force = false) {
  console.log('[NextLead] Ejecutando checkActiveChat...');
  const sidebar = document.getElementById('nextlead-sidebar');
  if (!sidebar || !sidebar.classList.contains('open')) {
    console.log('[NextLead] La barra lateral está cerrada. Ignorando.');
    return;
  }

  // Buscar el panel de chat activo con múltiples selectores posibles
  const mainPane = document.getElementById('main') || 
                   document.querySelector('div[data-testid="conversation-panel"]') ||
                   document.querySelector('main') ||
                   document.querySelector('[role="main"]');
                   
  console.log('[NextLead] Panel de conversación principal encontrado:', !!mainPane);

  // Buscar el encabezado del chat activo
  let mainHeader = null;
  if (mainPane) {
    mainHeader = mainPane.querySelector('header');
  } else {
    // Fallback: Si no se encuentra el panel, tomamos el segundo header de la página (el del chat)
    const headers = document.querySelectorAll('header');
    if (headers.length > 1) {
      mainHeader = headers[1];
    } else if (headers.length === 1) {
      mainHeader = headers[0];
    }
  }
  
  console.log('[NextLead] Encabezado del chat encontrado:', !!mainHeader);

  if (!mainHeader) {
    resetLeadForm('Abre una conversación en WhatsApp');
    return;
  }

  let foundPhone = null;
  let contactName = '';

  // Método 1: Leer el JID/Teléfono desde los data-id de las burbujas de mensaje (Global, libre de #main)
  const messageEls = document.querySelectorAll('div[data-id]');
  console.log('[NextLead] Burbujas de mensaje con data-id encontradas:', messageEls.length);
  for (const el of messageEls) {
    const dataId = el.getAttribute('data-id') || '';
    const match = dataId.match(/^(?:true|false)_(\d{9,15})@c\.us_/);
    if (match && match[1]) {
      foundPhone = match[1];
      console.log('[NextLead] Teléfono extraído de data-id de mensaje:', foundPhone);
      break;
    }
  }

  // Método 2: Leer de la URL de la imagen del avatar del header
  if (!foundPhone) {
    const avatarImg = mainHeader.querySelector('img');
    if (avatarImg && avatarImg.src) {
      console.log('[NextLead] URL del avatar del header:', avatarImg.src);
      try {
        const srcUrl = new URL(avatarImg.src);
        const uParam = srcUrl.searchParams.get('u');
        if (uParam) {
          foundPhone = uParam.split('@')[0].replace(/\D/g, '');
          console.log('[NextLead] Teléfono extraído de parámetro u del avatar:', foundPhone);
        }
      } catch (e) {
        console.log('[NextLead] Error al parsear URL de avatar:', e);
      }
    }
  }

  // Extraer el nombre del contacto de forma precisa, evitando los botones de acción del menú (Buscar, Menú, etc.)
  const clickableHeader = mainHeader.querySelector('div[role="button"]');
  if (clickableHeader) {
    const span = clickableHeader.querySelector('span[title]') || 
                 clickableHeader.querySelector('span[dir="auto"]') || 
                 clickableHeader.querySelector('span');
    if (span) {
      contactName = (span.getAttribute('title') || span.innerText || '').trim();
    }
  }

  // Fallback si no se encontró por el contenedor clickable
  if (!contactName) {
    const spansWithTitle = mainHeader.querySelectorAll('span[title]');
    for (const span of spansWithTitle) {
      const title = (span.getAttribute('title') || '').trim();
      // Ignorar títulos comunes de botones de acción
      if (title && title !== 'Buscar...' && title !== 'Menú' && title !== 'Llamada de voz' && title !== 'Videollamada') {
        contactName = title;
        break;
      }
    }
  }

  // Fallback final: texto de primer span razonable
  if (!contactName) {
    const firstSpan = mainHeader.querySelector('span');
    if (firstSpan) {
      contactName = firstSpan.innerText.trim();
    }
  }

  console.log('[NextLead] Nombre del contacto extraído:', contactName);

  // Método 3: Si el nombre de perfil es directamente el número de teléfono
  if (!foundPhone && contactName) {
    const cleanTitle = contactName.replace(/\D/g, '');
    if (cleanTitle.length >= 9 && (cleanTitle.startsWith('51') || cleanTitle.length === 9)) {
      foundPhone = cleanTitle;
      console.log('[NextLead] Teléfono extraído por coincidencia numérica del nombre:', foundPhone);
    }
  }

  // Normalizar el teléfono al formato del CRM (código de país 51 por defecto para Perú)
  if (foundPhone) {
    foundPhone = foundPhone.replace(/\D/g, '');
    if (foundPhone.length === 9) {
      foundPhone = '51' + foundPhone;
    }
    console.log('[NextLead] Teléfono normalizado para CRM:', foundPhone);
  }

  if (foundPhone) {
    if (foundPhone !== activePhone || force) {
      activePhone = foundPhone;
      activeContactName = contactName;
      document.getElementById('nl-lead-phone').value = '+' + activePhone;
      document.getElementById('nl-lead-name').value = activeContactName;
      document.getElementById('nl-lead-phone').setAttribute('readonly', 'true');
      
      // Load current contact info from CRM database
      loadContactFromCRM(activePhone);
    }
  } else {
    console.log('[NextLead] No se pudo auto-detectar el teléfono de WhatsApp Web.');
    // Fallback amigable: Rellenamos el nombre si existe y permitimos ingresar el teléfono manualmente
    if (contactName) {
      document.getElementById('nl-lead-name').value = contactName;
      document.getElementById('nl-lead-phone').removeAttribute('readonly');
      document.getElementById('nl-lead-phone').value = '';
      document.getElementById('nl-lead-phone').placeholder = 'Ingresa número de 9 dígitos';
      showToast('Nombre capturado. Por favor ingresa el número telefónico manualmente.');
    }
  }
}

// Reset Form State when no active chat
function resetLeadForm(message) {
  activePhone = null;
  activeContactName = '';
  crmContact = null;
  
  document.getElementById('nl-lead-phone').value = '';
  document.getElementById('nl-lead-phone').setAttribute('readonly', 'true');
  document.getElementById('nl-lead-name').value = '';
  document.getElementById('nl-lead-location').value = '';
  document.getElementById('nl-lead-notes').value = '';
  document.getElementById('nl-lead-stage').value = 'Nuevo';

  const statusBadge = document.getElementById('nl-sync-status');
  statusBadge.className = 'nl-sync-badge not-synced';
  statusBadge.innerHTML = `<span>⚠️ ${message}</span>`;
}

// Fetch Contact details from Java CRM API
async function loadContactFromCRM(phone) {
  const statusBadge = document.getElementById('nl-sync-status');
  statusBadge.className = 'nl-sync-badge not-synced';
  statusBadge.innerHTML = '<span>⏳ Consultando CRM...</span>';

  try {
    const res = await apiCall(`${API_BASE}/api/contacts/search?phone=${phone}`);
    if (res.status === 200) {
      crmContact = await res.json();
      
      // Populate fields from Java models (nombreDisplay/nombres/apellidos, direcciones, referencia, status)
      const displayName = crmContact.nombreDisplay || (crmContact.nombres ? (crmContact.nombres + (crmContact.apellidos && crmContact.apellidos !== '.' ? ' ' + crmContact.apellidos : '')) : activeContactName);
      document.getElementById('nl-lead-name').value = displayName;
      document.getElementById('nl-lead-location').value = crmContact.direcciones && crmContact.direcciones.length > 0 ? (crmContact.direcciones[0].distrito || '') : '';
      document.getElementById('nl-lead-notes').value = crmContact.referencia || '';
      document.getElementById('nl-lead-stage').value = crmContact.status || 'Nuevo';

      statusBadge.className = 'nl-sync-badge synced';
      statusBadge.innerHTML = '<span>🟢 Sincronizado con CRM</span>';
    } else {
      crmContact = null;
      statusBadge.className = 'nl-sync-badge not-synced';
      statusBadge.innerHTML = '<span>❌ Sin registrar en CRM</span>';
    }
  } catch (err) {
    console.error('Error fetching CRM data:', err);
    statusBadge.className = 'nl-sync-badge not-synced';
    statusBadge.innerHTML = '<span>⚠️ CRM fuera de línea (Port 8081)</span>';
  }
}

// Save/Sync Lead info to Java CRM database
async function saveLeadToCRM() {
  if (!activePhone) {
    showToast('Abre un chat para guardar el lead.');
    return;
  }

  const nombre = document.getElementById('nl-lead-name').value.trim();
  const distrito = document.getElementById('nl-lead-location').value.trim();
  const notas = document.getElementById('nl-lead-notes').value.trim();
  const estadoLead = document.getElementById('nl-lead-stage').value;

  if (!nombre) {
    showToast('El nombre del contacto es obligatorio.');
    return;
  }

  // Separar nombres y apellidos para cumplir con la validación de Java
  const nameParts = nombre.trim().split(/\s+/);
  const nombres = nameParts[0];
  const apellidos = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '.';

  // Extraer exactamente los últimos 9 dígitos del teléfono para la validación de Java
  const cleanPhone = activePhone.replace(/\D/g, '');
  const telefonoPrincipal = cleanPhone.length >= 9 ? cleanPhone.substring(cleanPhone.length - 9) : cleanPhone;

  const payload = {
    tipoPersona: 'NATURAL',
    tipoDocumento: 'DNI',
    numeroDocumento: crmContact && crmContact.numeroDocumento ? crmContact.numeroDocumento : '00000000',
    nombres: nombres,
    apellidos: apellidos,
    telefonoPrincipal: telefonoPrincipal,
    referencia: notas, // Guardamos las notas en el campo de referencia del contacto
    email: '',
    direcciones: []
  };

  // If contact already exists, perform update (PUT), else create (POST)
  const method = crmContact ? 'PUT' : 'POST';
  const url = crmContact ? `${API_BASE}/api/contacts/${crmContact.id}` : `${API_BASE}/api/contacts`;

  try {
    const res = await apiCall(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (res.status === 200 || res.status === 201) {
      showToast('¡Lead guardado en el CRM con éxito!');
      loadContactFromCRM(activePhone);
    } else {
      const errText = await res.text();
      showToast(`Error al guardar: ${errText || res.statusText}`);
    }
  } catch (err) {
    showToast('Error de red al conectar con el CRM API (8081).');
  }
}

// Fetch Canned Responses from CRM backend
let cannedResponsesList = [];
async function loadCannedResponses() {
  try {
    const res = await apiCall(`${API_BASE}/api/ai/knowledge-base`);
    if (res.status === 200) {
      const data = await res.json();
      cannedResponsesList = data.map(item => ({
        id: item.id,
        question: item.titulo || item.question || 'Respuesta rápida',
        answer: item.respuesta || item.answer || ''
      }));
    }
  } catch (err) {
    console.warn('Could not load responses from API, using default presets:', err);
  }

  if (cannedResponsesList.length === 0) {
    cannedResponsesList = DEFAULT_RESPONSES;
  }

  renderCannedResponses(cannedResponsesList);
}

// Render Canned Responses into list UI
function renderCannedResponses(responses) {
  const container = document.getElementById('nl-replies-container');
  if (!container) return;

  container.innerHTML = '';

  if (responses.length === 0) {
    container.innerHTML = '<div style="text-align:center; color:var(--nl-text-sub); font-size:13px; padding:20px;">No se encontraron respuestas.</div>';
    return;
  }

  responses.forEach(item => {
    const card = document.createElement('div');
    card.className = 'nl-response-card';
    card.innerHTML = `
      <div class="nl-response-title">${item.question}</div>
      <div class="nl-response-content">${item.answer}</div>
      <div class="nl-card-actions">
        <button class="nl-action-btn nl-btn-copy" data-id="${item.id}">
          <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          Copiar
        </button>
        <button class="nl-action-btn nl-btn-insert" data-id="${item.id}" style="background-color: var(--nl-primary); color: #ffffff;">
          <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          Insertar
        </button>
      </div>
    `;

    // Attach click listeners to cards action buttons
    card.querySelector('.nl-btn-copy').addEventListener('click', () => {
      navigator.clipboard.writeText(item.answer);
      showToast('¡Texto copiado al portapapeles!');
    });

    card.querySelector('.nl-btn-insert').addEventListener('click', () => {
      insertTextIntoWhatsAppInput(item.answer);
    });

    container.appendChild(card);
  });
}

// Filter Canned Responses by search query
function filterCannedResponses(query) {
  const cleanQuery = query.toLowerCase().trim();
  if (!cleanQuery) {
    renderCannedResponses(cannedResponsesList);
    return;
  }

  const filtered = cannedResponsesList.filter(item => 
    item.question.toLowerCase().includes(cleanQuery) || 
    item.answer.toLowerCase().includes(cleanQuery)
  );
  renderCannedResponses(filtered);
}

// Insert response text directly into WhatsApp input text box DOM
function insertTextIntoWhatsAppInput(text) {
  const inputBox = document.querySelector('#main footer div[contenteditable="true"]') || document.querySelector('#main div[data-tab="10"]');
  if (!inputBox) {
    showToast('Abre un chat de conversación para poder insertar.');
    return;
  }

  inputBox.focus();
  
  // Inject text natively into contenteditable div, retaining browser undo/redo history
  document.execCommand('insertText', false, text);
  
  // Dispatch an input event to notify React of changes
  const inputEvent = new Event('input', { bubbles: true });
  inputBox.dispatchEvent(inputEvent);
}

// Start Extension Injection
setTimeout(() => {
  initExtension();
  loadCannedResponses();
}, 2000);
