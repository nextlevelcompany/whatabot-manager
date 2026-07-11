"use client"
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, InputGroup, Alert, Spinner, Tabs, Tab, Table, Badge, Modal } from 'react-bootstrap';
import * as Icons from 'tabler-icons-react';

const getApiBase = () => {
    if (typeof window !== 'undefined') {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
        return `${protocol}//${hostname}:8080`;
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';
};

const API_BASE = getApiBase();

const extractScenario1Message = (text) => {
    if (!text) return "";
    const match = text.match(/(?:envia el siguiente mensaje:|Mensaje:)\s*\n*["“]([^"”]+)["”]/i) || text.match(/(📍[^]+?🏠)/i);
    if (match && match[1]) {
        return match[1].trim();
    }
    return `📍 *Juan Carlos*, tenemos registrada esta dirección de entrega:\n\n✅ *Dirección:* Av. Larco 123\n✅ *Distrito:* Miraflores\n✅ *Ubicación:* https://maps.google.com/?q=-12.122,-77.028\n\n¿Enviamos a esta *misma dirección* o prefieres indicar una *dirección diferente*? 🏠`;
};

const extractScenario2DistrictMessage = (text) => {
    if (!text) return "";
    const match = text.match(/Pregunta al cliente\s+([^.\n]+)/i);
    if (match && match[1]) {
        // Capitalize first letter
        const raw = match[1].trim();
        return raw.charAt(0).toUpperCase() + raw.slice(1) + ". 📍";
    }
    return "Por favor, indícame en qué distrito te encuentras para verificar la cobertura de entrega. 📍";
};

const extractScenario2FormMessage = (text) => {
    if (!text) return "";
    const match = text.match(/enviando exactamente este mensaje:\s*\n*["“]([^"”]+)["”]/i) || text.match(/(¡Genial![^]+?\?)/i);
    if (match && match[1]) {
        return match[1].trim();
    }
    return `¡Genial! 💧 Tenemos cobertura en Miraflores.\n\nPor favor, envíanos los siguientes datos para programar tu entrega:\n\n📝 DATOS DE ENTREGA:\n✅ Nombres y Apellidos:\n✅ Dirección completa:\n✅ Ubicación: Por favor comparte tu ubicación desde WhatsApp (botón 📎 → Ubicación)\n✅ Tipo de Comprobante: ¿Boleta simple, Boleta con DNI o Factura?`;
};

export default function ConfigPage() {
    const [activeTab, setActiveTab] = useState('ai_config');
    const [activeNode, setActiveNode] = useState('welcome');

    // Logs States & Ref
    const [logs, setLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [logLinesCount, setLogLinesCount] = useState(200);
    const [logsAutoRefresh, setLogsAutoRefresh] = useState(false);
    const [logsFilter, setLogsFilter] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const logEndRef = React.useRef(null);



    // General Settings States
    const [settings, setSettings] = useState({
        'whatsapp.api.token': '',
        'whatsapp.phone.id': '',
        'whatsapp.verify.token': '',
        'whatsapp.display.number': '',
        'gemini.api.key': '',
        'gemini.model': 'gemini-1.5-flash',
        'gemini.system.prompt': '',
        'ai.agent.name': 'Asesor Comercial',
        'ai.business.description': 'Venta de productos y servicios',
        'ai.tone': 'Amigable y cercano',
        'ai.active': 'false',
        'ai.max.quota': '30',
        'ai.business.type': 'ECOMMERCE',
        'ai.ask.container': 'true',
        'ai.ask.container.text': 'Veo que llevas una recarga de agua de 20L. 💧 ¿Cuentas con envase retornable vacío en casa para entregar al repartidor? Si no tienes, podemos cotizarte la venta de un envase nuevo.',
        'ai.collect.location': 'true',
        'ai.collect.location.text': `Cuando el cliente registrado ya tiene productos confirmados en el carrito y va a pasar a la etapa de datos de entrega, llama a "consultar_direccion_cliente".

Si devuelve dirección y ubicación guardadas:

Mensaje:
"📍 *[Nombre]*, tenemos registrada esta dirección de entrega:

✅ *Dirección:* [Dirección guardada]
✅ *Distrito:* [Distrito guardado]
✅ *Ubicación:* [URL Google Maps guardada]

¿Enviamos a esta *misma dirección* o prefieres indicar una *dirección diferente*? 🏠"

Comportamiento según respuesta:
- MISMA DIRECCIÓN → Usar los datos guardados (dirección, distrito, ubicación). Saltar VERIFICACIÓN DE COBERTURA (ya fue validada antes) y FORMULARIO DE ENTREGA (solo pedir datos faltantes como Nombres/Apellidos si no están y Tipo de Comprobante). Ir directo a VALIDACIÓN DE COMPROBANTE.
- DIRECCIÓN DIFERENTE → Ir a VERIFICACIÓN DE COBERTURA (sacar de Zonas de Envío) y FORMULARIO DE ENTREGA normal (pedir todos los datos desde cero).

Si es CLIENTE NUEVO o el CLIENTE REGISTRADO NO tiene dirección guardada:
- VERIFICACIÓN DE COBERTURA → Solicita su ubicación GPS nativa de WhatsApp. Cruza el distrito/coordenadas con la lista de "Zonas de Envío" para validar si el delivery está cubierto y calcular el costo de envío.
- FORMULARIO DE ENTREGA → Solicita todos los datos desde cero: Nombres/Apellidos, Dirección exacta, Referencia de domicilio, Distrito y Tipo de Comprobante.
- VALIDACIÓN DE COMPROBANTE → Pasa al siguiente paso.`,
        'ai.products.promotion': 'true',
        'ai.products.promotion.text': '🎁 ¡Tenemos excelentes noticias! Contamos con nuestra *Promoción Especial del Mes*: 3 Recargas de Agua Alcalina de 20L por solo *S/ 39.00* (¡ahorras S/ 15.00!). Además, te podemos brindar información de nuestros bidones nuevos de policarbonato. ¿Te gustaría llevar la promoción o prefieres ver otros productos? 💧',
        'ai.products.promotion.media.ids': '',
        'ai.products.promotion.media.type': 'NONE',
        'ai.products.promotion.post.text': '',
        'ai.products.promotion.keywords': 'promocion, especial, oferta, descuento, promo, combo, paquete, pack, promociones, ofertas, combos, paquetes, packs, precio, precios, tarifas, costo, costos, catalogos, catalogo, rebaja, rebajas, regalo, gratis, info, informacion',
        'ai.collect.document': 'true',
        'ai.collect.document.text': 'Para procesar tu pedido, ¿requieres boleta de venta o factura? 🧾 Si es boleta facilítame tu DNI (8 dígitos) o tu RUC (11 dígitos) con la razón social si es factura.',
        'ai.greeting.new': '¡Hola! 💧 Bienvenido a *Antarqui Perú*. Impulsa tu bienestar con la mejor hidratación:\n\n✅ *Agua Alcalina* (PH 8.2)\n✅ *Ionizada*\n✅ *Ozonizada*\n✅ *12 procesos de purificación*\n\n🚚 ¡*DELIVERY GRATIS* en Zonas de Cobertura! 🏠💨\n\n👉 *NUESTROS PRODUCTOS*:\n🎁 ¿Te gustaría ver también nuestra *PROMOCIÓN ESPECIAL* de 3 recargas con un precio increíble?',
        'ai.greeting.new.media.type': 'NONE',
        'ai.greeting.new.media.ids': '',
        'ai.greeting.registered': '¡Hola *[Nombre]*, bienvenido de nuevo a *Antarqui Perú*! 💧 ¿Te gustaría pedir tu recarga de siempre o prefieres conocer nuestras promociones del día?',
        'ai.greeting.registered.media.type': 'NONE',
        'ai.greeting.registered.media.ids': '',
        'ai.payment.methods': `💳 MEDIOS DE PAGO - ANTARQUI

Para tu comodidad, aceptamos las siguientes opciones:

🏦 Transferencia Bancaria (Empresa)
Razón Social: ASCENDO PERÚ E.I.R.L
RUC: 20611846721
Banco: Interbank
Cuenta Soles: 200-3005845511
CCI: 003-200-003005845511-31

📱 Billeteras Digitales (Yape/Plin)
Nombre: Anabel Laime
Número: 948 613 380

💵 Otras opciones:
Efectivo: Monto exacto contraentrega.
Tarjeta de Crédito/Débito: Aceptamos todas las tarjetas.
Pago por QR: Escanea el código que te proporcionaremos desde tu móvil.

¡Gracias por elegir Antarqui! Si tienes alguna duda, escríbenos.`,
        'ai.order.collect': 'true',
        'ai.order.collect.text': `REGLA: Cada vez que el cliente elija o pida un producto (ya sea desde el flujo inicial, la promo, upselling, o una solicitud directa), CONFIRMA lo agregado y pregunta si desea algo más.

Formato del mensaje de confirmación:

"✅ *¡Agregado!*

🛒 *[Cantidad]x [Nombre del Producto]*
💲 Precio unitario: *S/ [Precio_Unitario]*
💰 Subtotal: *S/ [Subtotal]*

[Si el carrito tiene más de 1 ítem, mostrar resumen parcial:]
📦 *Tu carrito actual:*
▫️ [Cantidad]x [Producto 1] (S/ [Precio_Unitario] c/u) — S/ [Subtotal1]
▫️ [Cantidad]x [Producto 2] (S/ [Precio_Unitario] c/u) — S/ [Subtotal2]
[...]
💰 *Subtotal parcial: S/ [suma]*

¿Deseas agregar *otro producto* o *confirmamos tu pedido*? 🤔"

Comportamiento según respuesta:
- QUIERE AGREGAR MÁS → Consulta Productos para mostrarle las opciones disponibles (los que NO tiene ya en el carrito o variantes diferentes). Cuando elija, agrega al CARRITO y vuelve a mostrar CONFIRMACIÓN DE AGREGADO.
- CONFIRMA / ESTÁ CONFORME → Continuar al siguiente paso pendiente del FLUJO DEL PEDIDO (COBERTURA, FORMULARIO, etc.).

Excepciones donde NO se pregunta "¿algo más?":
- Ninguna. SIEMPRE se confirma el agregado y se pregunta.`,
        'ai.custom.instructions': 'Ofrecer la promoción especial de 3 recargas si muestran interés en compras familiares o de consumo recurrente.',
        'ai.flow.order': 'business,welcome,registered,order,location,promotion,billing,container,payment,custom'
    });

    const [flowOrder, setFlowOrder] = useState([
        'business',
        'welcome',
        'registered',
        'order',
        'location',
        'promotion',
        'billing',
        'container',
        'payment',
        'custom'
    ]);

    // Reorder handler
    const handleMoveStep = (index, direction) => {
        const newOrder = [...flowOrder];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newOrder.length) return;

        const temp = newOrder[index];
        newOrder[index] = newOrder[targetIndex];
        newOrder[targetIndex] = temp;

        setFlowOrder(newOrder);
        setSettings(prev => ({ ...prev, 'ai.flow.order': newOrder.join(',') }));
    };

    // AI Products Config States
    const [productsConfig, setProductsConfig] = useState([]);
    const [editingProduct, setEditingProduct] = useState(null);
    const [showProductModal, setShowProductModal] = useState(false);

    // WhatsApp Preview States
    const [previewProduct, setPreviewProduct] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    
    // Shipping Coverage States
    const [shippingCoverage, setShippingCoverage] = useState([]);
    const [newCoverage, setNewCoverage] = useState({ districtName: '', deliveryFee: 0, minOrderAmount: 0, isActive: true, aliases: '' });
    const [editingCoverage, setEditingCoverage] = useState(null);
    const [showCoverageModal, setShowCoverageModal] = useState(false);

    // Knowledge Base FAQ States
    const [knowledgeBase, setKnowledgeBase] = useState([]);
    const [newFaq, setNewFaq] = useState({ category: '', keywords: '', answer: '', attachmentUrl: '', attachmentType: 'NONE', intent: '', active: true, priority: 100, mediaIdWhatsapp: '', mediaCaption: '' });
    const [editingFaq, setEditingFaq] = useState(null);
    const [showFaqModal, setShowFaqModal] = useState(false);

    // Loading & Operation States
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });
    const [showToken, setShowToken] = useState(false);
    const [showGemini, setShowGemini] = useState(false);

    useEffect(() => {
        const loadAllData = async () => {
            try {
                setLoading(true);
                // 1. Fetch settings
                const settingsRes = await fetch(`${API_BASE}/api/settings`);
                if (settingsRes.ok) {
                    const settingsData = await settingsRes.json();
                    setSettings(prev => {
                        const updated = { ...prev, ...settingsData };
                        
                        // Migración automática del texto de ubicación si tiene el valor por defecto anterior
                        if (!updated['ai.collect.location.text'] || 
                            updated['ai.collect.location.text'] === 'Por favor, compárteme tu ubicación actual por el GPS nativo de WhatsApp 📍 para coordinar tu envío gratis a domicilio.' ||
                            updated['ai.collect.location.text'].includes('Si NO devuelve dirección (cliente registrado')) {
                            updated['ai.collect.location.text'] = `Cuando el cliente registrado ya tiene productos confirmados en el carrito y va a pasar a la etapa de datos de entrega, llama a "consultar_direccion_cliente".

Si devuelve dirección y ubicación guardadas:

Mensaje:
"📍 *[Nombre]*, tenemos registrada esta dirección de entrega:

✅ *Dirección:* [Dirección guardada]
✅ *Distrito:* [Distrito guardado]
✅ *Ubicación:* [URL Google Maps guardada]

¿Enviamos a esta *misma dirección* o prefieres indicar una *dirección diferente*? 🏠"

Comportamiento según respuesta:
- MISMA DIRECCIÓN → Usar los datos guardados (dirección, distrito, ubicación). Saltar VERIFICACIÓN DE COBERTURA (ya fue validada antes) y FORMULARIO DE ENTREGA (solo pedir datos faltantes como Nombres/Apellidos si no están y Tipo de Comprobante). Ir directo a VALIDACIÓN DE COMPROBANTE.
- DIRECCIÓN DIFERENTE → Ir a VERIFICACIÓN DE COBERTURA (sacar de Zonas de Envío) y FORMULARIO DE ENTREGA normal (pedir todos los datos desde cero).

Si es CLIENTE NUEVO o el CLIENTE REGISTRADO NO tiene dirección guardada:
- VERIFICACIÓN DE COBERTURA → Solicita su ubicación GPS nativa de WhatsApp. Cruza el distrito/coordenadas con la lista de "Zonas de Envío" para validar si el delivery está cubierto y calcular el costo de envío.
- FORMULARIO DE ENTREGA → Solicita todos los datos desde cero: Nombres/Apellidos, Dirección exacta, Referencia de domicilio, Distrito y Tipo de Comprobante.
- VALIDACIÓN DE COMPROBANTE → Pasa al siguiente paso.`;
                        }

                        // Migración automática de la instrucción de pedidos
                        if (!updated['ai.order.collect.text'] || updated['ai.order.collect.text'] === 'Por favor, indícame qué productos o cuántas recargas deseas solicitar hoy de nuestro catálogo.') {
                            updated['ai.order.collect.text'] = `REGLA: Cada vez que el cliente elija o pida un producto (ya sea desde el flujo inicial, la promo, upselling, o una solicitud directa), CONFIRMA lo agregado y pregunta si desea algo más.

Formato del mensaje de confirmación:

"✅ *¡Agregado!*

🛒 *[Cantidad]x [Nombre del Producto]*
💲 Precio unitario: *S/ [Precio_Unitario]*
💰 Subtotal: *S/ [Subtotal]*

[Si el carrito tiene más de 1 ítem, mostrar resumen parcial:]
📦 *Tu carrito actual:*
▫️ [Cantidad]x [Producto 1] (S/ [Precio_Unitario] c/u) — S/ [Subtotal1]
▫️ [Cantidad]x [Producto 2] (S/ [Precio_Unitario] c/u) — S/ [Subtotal2]
[...]
💰 *Subtotal parcial: S/ [suma]*

¿Deseas agregar *otro producto* o *confirmamos tu pedido*? 🤔"

Comportamiento según respuesta:
- QUIERE AGREGAR MÁS → Consulta Productos para mostrarle las opciones disponibles (los que NO tiene ya en el carrito o variantes diferentes). Cuando elija, agrega al CARRITO y vuelve a mostrar CONFIRMACIÓN DE AGREGADO.
- CONFIRMA / ESTÁ CONFORME → Continuar al siguiente paso pendiente del FLUJO DEL PEDIDO (COBERTURA, FORMULARIO, etc.).

Excepciones donde NO se pregunta "¿algo más?":
- Ninguna. SIEMPRE se confirma el agregado y se pregunta.`;
                        }
                        // Migración de medios de pago
                        if (!updated['ai.payment.methods'] || updated['ai.payment.methods'] === 'Yape, Plin, Efectivo contra entrega, Transferencias bancarias') {
                            updated['ai.payment.methods'] = `💳 MEDIOS DE PAGO - ANTARQUI

Para tu comodidad, aceptamos las siguientes opciones:

🏦 Transferencia Bancaria (Empresa)
Razón Social: ASCENDO PERÚ E.I.R.L
RUC: 20611846721
Banco: Interbank
Cuenta Soles: 200-3005845511
CCI: 003-200-003005845511-31

📱 Billeteras Digitales (Yape/Plin)
Nombre: Anabel Laime
Número: 948 613 380

💵 Otras opciones:
Efectivo: Monto exacto contraentrega.
Tarjeta de Crédito/Débito: Aceptamos todas las tarjetas.
Pago por QR: Escanea el código que te proporcionaremos desde tu móvil.

¡Gracias por elegir Antarqui! Si tienes alguna duda, escríbenos.`;
                        }

                        if (updated['ai.flow.order']) {
                            let loadedOrder = updated['ai.flow.order'].split(',');
                            if (!loadedOrder.includes('order')) {
                                const registeredIndex = loadedOrder.indexOf('registered');
                                if (registeredIndex !== -1) {
                                    loadedOrder.splice(registeredIndex + 1, 0, 'order');
                                } else {
                                    loadedOrder.push('order');
                                }
                                updated['ai.flow.order'] = loadedOrder.join(',');
                            }
                            setFlowOrder(loadedOrder);
                        }
                        return updated;
                    });
                }

                // 2. Fetch products config
                const productsRes = await fetch(`${API_BASE}/api/ai/products-config`);
                if (productsRes.ok) {
                    const productsData = await productsRes.json();
                    setProductsConfig(productsData);
                }

                // 3. Fetch shipping coverage
                const shippingRes = await fetch(`${API_BASE}/api/ai/shipping-coverage`);
                if (shippingRes.ok) {
                    const shippingData = await shippingRes.json();
                    setShippingCoverage(shippingData);
                }

                // 4. Fetch FAQs
                const faqRes = await fetch(`${API_BASE}/api/ai/knowledge-base`);
                if (faqRes.ok) {
                    const faqData = await faqRes.json();
                    setKnowledgeBase(faqData);
                }

            } catch (err) {
                console.error("Error loading config data:", err);
                showAlert('danger', 'Error de red al conectar con el servidor.');
            } finally {
                setLoading(false);
            }
        };

        loadAllData();
    }, []);

    const fetchLogs = async () => {
        setLoadingLogs(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/logs?lines=${logLinesCount}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            } else {
                setLogs([`Error al obtener logs: Código de respuesta ${res.status}`]);
            }
        } catch (err) {
            setLogs([`Error de conexión al obtener logs: ${err.message}`]);
        } finally {
            setLoadingLogs(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'logs') {
            fetchLogs();
        }
    }, [activeTab, logLinesCount]);

    useEffect(() => {
        let intervalId;
        if (activeTab === 'logs' && logsAutoRefresh) {
            intervalId = setInterval(() => {
                fetchLogs();
            }, 3000);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [activeTab, logsAutoRefresh, logLinesCount]);

    useEffect(() => {
        if (logEndRef.current && activeTab === 'logs') {
            logEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, activeTab]);

    const filterByCategory = (line, category) => {
        if (category === 'ALL') return true;
        const lowerLine = line.toLowerCase();
        switch (category) {
            case 'ERROR':
                return line.includes(' ERROR ') || lowerLine.includes('exception') || lowerLine.includes('error:');
            case 'WARN':
                return line.includes(' WARN ');
            case 'INFO':
                return line.includes(' INFO ');
            case 'DEBUG':
                return line.includes(' DEBUG ');
            case 'DATABASE':
                return lowerLine.includes('hibernate') || lowerLine.includes('hikari') || lowerLine.includes('sql') || lowerLine.includes('postgres') || lowerLine.includes('jpa');
            case 'INTEGRATIONS':
                return lowerLine.includes('whatsapp') || lowerLine.includes('gemini') || lowerLine.includes('meta') || lowerLine.includes('wspai');
            case 'SECURITY':
                return lowerLine.includes('security') || lowerLine.includes('auth') || lowerLine.includes('jwt') || lowerLine.includes('token') || lowerLine.includes('password');
            default:
                return true;
        }
    };

    const handleCopyLogs = () => {
        const filtered = logs.filter(line => 
            line.toLowerCase().includes(logsFilter.toLowerCase()) &&
            filterByCategory(line, selectedCategory)
        );
        navigator.clipboard.writeText(filtered.join('\n'));
        showAlert('success', 'Logs copiados al portapapeles.');
    };

    const getLogLineColor = (line) => {
        if (line.includes(' ERROR ') || line.includes('Exception') || line.includes('Error:')) return '#f87171'; // Rojo
        if (line.includes(' WARN ')) return '#fbbf24'; // Amarillo
        if (line.includes(' INFO ')) return '#34d399'; // Verde
        if (line.includes(' DEBUG ')) return '#60a5fa'; // Azul
        return '#e2e8f0'; // Gris claro
    };


    const showAlert = (type, message) => {
        setAlert({ show: true, type, message });
        setTimeout(() => {
            setAlert(prev => ({ ...prev, show: false }));
        }, 5000);
    };

    // Helper to get image URL or Base64 from mediaId or URL
    const getImageUrlForMediaId = (item) => {
        if (!item) return '';
        const trimmed = item.trim();
        if (!trimmed) return '';
        
        const isUrl = trimmed.startsWith('http') || trimmed.startsWith('data:') || trimmed.startsWith('/');
        
        // Find matching product in productsConfig
        const prod = productsConfig.find(p => 
            (p.mediaIdWhatsapp && String(p.mediaIdWhatsapp).trim() === trimmed) ||
            (isUrl && p.productoId && trimmed.includes(`/api/productos/${p.productoId}/imagen`))
        );
        
        if (prod) {
            if (prod.productImage && prod.productImage.startsWith('data:')) {
                return prod.productImage;
            }
            return `${API_BASE}/api/productos/${prod.productoId}/imagen`;
        }
        
        if (isUrl) {
            return trimmed;
        }
        
        // Return dummy SVG placeholder indicating Meta Cloud WhatsApp Media ID
        return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 24 24" fill="none" stroke="%238ec5fc" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline><text x="4" y="22" fill="%23075e54" font-size="1.8" font-family="sans-serif" font-weight="bold">WhatsApp Media</text></svg>';
    };

    // Helper to render preview images list
    const renderPreviewImages = (mediaIdsString) => {
        if (!mediaIdsString) return null;
        const items = mediaIdsString.split(',');
        return (
            <div className="d-flex flex-wrap gap-2 mb-2 justify-content-start">
                {items.map((item, idx) => {
                    const src = getImageUrlForMediaId(item);
                    return (
                        <div key={idx} className="overflow-hidden rounded border text-center bg-light shadow-sm" style={{ width: '120px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img 
                                src={src} 
                                alt={`Preview ${idx}`} 
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                            />
                        </div>
                    );
                })}
            </div>
        );
    };

    // Helper to format WhatsApp text styling in preview
    const formatWhatsappText = (text) => {
        if (!text) return '';
        let formatted = text
            .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
            .replace(/_(.*?)_/g, '<em>$1</em>')
            .replace(/~(.*?)~/g, '<del>$1</del>')
            .replace(/\n/g, '<br/>');
        return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
    };

    // General Setting Handlers
    const handleSettingChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveGeneral = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (res.ok) {
                showAlert('success', 'Configuraciones guardadas exitosamente.');
            } else {
                showAlert('danger', 'Error en el servidor al intentar guardar configuraciones.');
            }
        } catch (err) {
            console.error(err);
            showAlert('danger', 'Error de red al intentar guardar.');
        } finally {
            setSaving(false);
        }
    };

    // Product Configurations Handlers
    const handleProductToggle = async (index, currentVal) => {
        const newVal = !currentVal;
        const targetProd = { ...productsConfig[index], aiEnabled: newVal };
        try {
            const res = await fetch(`${API_BASE}/api/ai/products-config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productoId: targetProd.productoId,
                    aiEnabled: targetProd.aiEnabled,
                    searchKeywords: targetProd.searchKeywords || '',
                    customAiDescription: targetProd.customAiDescription || '',
                    intent: targetProd.intent || '',
                    priority: targetProd.priority ? parseInt(targetProd.priority) : 100,
                    mediaIdWhatsapp: targetProd.mediaIdWhatsapp || '',
                    imageCaption: targetProd.imageCaption || ''
                })
            });
            if (res.ok) {
                const updatedConfig = [...productsConfig];
                updatedConfig[index].aiEnabled = newVal;
                setProductsConfig(updatedConfig);
                showAlert('success', `Producto ${newVal ? 'activado' : 'desactivado'} para la IA.`);
            }
        } catch (err) {
            console.error(err);
            showAlert('danger', 'Error al cambiar estado del producto.');
        }
    };

    const handleConfigureProduct = (prod) => {
        setEditingProduct({
            ...prod,
            intent: prod.intent || '',
            priority: prod.priority || 100,
            searchKeywords: prod.searchKeywords || '',
            customAiDescription: prod.customAiDescription || '',
            mediaIdWhatsapp: prod.mediaIdWhatsapp || '',
            imageCaption: prod.imageCaption || ''
        });
        setShowProductModal(true);
    };

    const handlePreviewProduct = (prod) => {
        setPreviewProduct(prod);
        setShowPreviewModal(true);
    };

    const handleSaveProductModal = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/ai/products-config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productoId: editingProduct.productoId,
                    aiEnabled: editingProduct.aiEnabled,
                    searchKeywords: editingProduct.searchKeywords || '',
                    customAiDescription: editingProduct.customAiDescription || '',
                    intent: editingProduct.intent || '',
                    priority: editingProduct.priority ? parseInt(editingProduct.priority) : 100,
                    mediaIdWhatsapp: editingProduct.mediaIdWhatsapp || '',
                    imageCaption: editingProduct.imageCaption || ''
                })
            });
            if (res.ok) {
                setProductsConfig(prev => prev.map(p => p.productoId === editingProduct.productoId ? { ...p, ...editingProduct } : p));
                setShowProductModal(false);
                showAlert('success', 'Configuración de IA para el producto guardada correctamente.');
            } else {
                showAlert('danger', 'Error al guardar configuración en el servidor.');
            }
        } catch (err) {
            console.error(err);
            showAlert('danger', 'Error de red al actualizar producto.');
        } finally {
            setSaving(false);
        }
    };

    // Shipping Coverage Handlers
    const handleConfigureCoverage = (cov) => {
        setEditingCoverage({ ...cov });
        setShowCoverageModal(true);
    };

    const handleSaveCoverage = async (e) => {
        e.preventDefault();
        const payload = editingCoverage || newCoverage;
        try {
            const res = await fetch(`${API_BASE}/api/ai/shipping-coverage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const refreshedRes = await fetch(`${API_BASE}/api/ai/shipping-coverage`);
                if (refreshedRes.ok) setShippingCoverage(await refreshedRes.json());
                setShowCoverageModal(false);
                setNewCoverage({ districtName: '', deliveryFee: 0, minOrderAmount: 0, isActive: true, aliases: '' });
                setEditingCoverage(null);
                showAlert('success', editingCoverage ? 'Zona de despacho actualizada correctamente.' : 'Zona de despacho agregada correctamente.');
            }
        } catch (err) {
            console.error(err);
            showAlert('danger', 'Error al guardar zona de cobertura.');
        }
    };

    const handleDeleteCoverage = async (id) => {
        if (!confirm('¿Estás seguro de eliminar esta zona de cobertura?')) return;
        try {
            const res = await fetch(`${API_BASE}/api/ai/shipping-coverage/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setShippingCoverage(prev => prev.filter(c => c.id !== id));
                showAlert('success', 'Zona de cobertura eliminada.');
            }
        } catch (err) {
            console.error(err);
            showAlert('danger', 'Error al intentar eliminar.');
        }
    };

    // FAQ Handlers
    const handleConfigureFaq = (faq) => {
        setEditingFaq({ ...faq });
        setShowFaqModal(true);
    };

    const handleSaveFaq = async (e) => {
        e.preventDefault();
        const payload = editingFaq || newFaq;
        try {
            const res = await fetch(`${API_BASE}/api/ai/knowledge-base`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const updatedRes = await fetch(`${API_BASE}/api/ai/knowledge-base`);
                if (updatedRes.ok) setKnowledgeBase(await updatedRes.json());
                setShowFaqModal(false);
                setNewFaq({ category: '', keywords: '', answer: '', attachmentUrl: '', attachmentType: 'NONE', intent: '', active: true, priority: 100, mediaIdWhatsapp: '', mediaCaption: '' });
                setEditingFaq(null);
                showAlert('success', editingFaq ? 'Pregunta frecuente actualizada correctamente.' : 'Pregunta frecuente agregada exitosamente.');
            }
        } catch (err) {
            console.error(err);
            showAlert('danger', 'Error al guardar FAQ.');
        }
    };

    const handleDeleteFaq = async (id) => {
        if (!confirm('¿Estás seguro de eliminar esta pregunta frecuente?')) return;
        try {
            const res = await fetch(`${API_BASE}/api/ai/knowledge-base/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setKnowledgeBase(prev => prev.filter(f => f.id !== id));
                showAlert('success', 'Pregunta frecuente eliminada.');
            }
        } catch (err) {
            console.error(err);
            showAlert('danger', 'Error al intentar eliminar.');
        }
    };

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <div className="text-center">
                    <Spinner animation="border" variant="success" className="mb-2" />
                    <p className="text-muted">Cargando configuraciones...</p>
                </div>
            </Container>
        );
    }

    return (
        <Container fluid className="pt-4">
            <Row className="mb-4">
                <Col>
                    <div className="hk-pg-header">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="pg-title font-weight-bold" style={{ letterSpacing: '-0.02em' }}>🤖 Configuración del Agente de IA</h1>
                                <p className="text-muted">Personaliza la identidad, el catálogo de venta, la cobertura de reparto y las respuestas frecuentes del agente de WhatsApp.</p>
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>

            {alert.show && (
                <Row className="mb-3">
                    <Col>
                        <Alert variant={alert.type} onClose={() => setAlert({ ...alert, show: false })} dismissible>
                            {alert.message}
                        </Alert>
                    </Col>
                </Row>
            )}

            <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-4 hk-tabs"
                variant="pills"
            >
                {/* PESTAÑA 1: CREDENCIALES GENERALES */}
                <Tab eventKey="general" title={<span><Icons.Settings size={18} className="me-1" /> General</span>}>
                    <Form onSubmit={handleSaveGeneral}>
                        <Row className="g-4">
                            <Col xs={12}>
                                <Card className="shadow-sm border-0" style={{ borderRadius: '12px' }}>
                                    <Card.Header className="bg-light border-0 py-3 fw-bold">⚙️ Credenciales Meta WhatsApp API</Card.Header>
                                    <Card.Body className="p-4">
                                        <Row className="row-cols-1 row-cols-md-2 g-3">
                                            <Col>
                                                <Form.Group className="mb-3" controlId="wspPhoneId">
                                                    <Form.Label className="fw-semibold small">Phone Number ID</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="whatsapp.phone.id"
                                                        value={settings['whatsapp.phone.id']}
                                                        onChange={handleSettingChange}
                                                        placeholder="Ej. 987682517769596"
                                                        style={{ fontSize: '0.9rem' }}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col>
                                                <Form.Group className="mb-3" controlId="wspDisplayNum">
                                                    <Form.Label className="fw-semibold small">Display Number</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="whatsapp.display.number"
                                                        value={settings['whatsapp.display.number']}
                                                        onChange={handleSettingChange}
                                                        placeholder="Ej. +15551935901"
                                                        style={{ fontSize: '0.9rem' }}
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Row className="row-cols-1 row-cols-md-2 g-3">
                                            <Col>
                                                <Form.Group className="mb-3" controlId="wspCallbackUrl">
                                                    <Form.Label className="fw-semibold small">URL de retorno del Webhook (Callback URL)</Form.Label>
                                                    <InputGroup>
                                                        <Form.Control
                                                            type="text"
                                                            value={`${API_BASE}/api/whatsapp/webhook`}
                                                            readOnly
                                                            className="bg-light"
                                                            style={{ fontSize: '0.85rem' }}
                                                        />
                                                        <Button variant="outline-secondary" onClick={() => {
                                                            navigator.clipboard.writeText(`${API_BASE}/api/whatsapp/webhook`);
                                                            showAlert('success', 'URL copiada al portapapeles.');
                                                        }}>
                                                            <Icons.Copy size={18} />
                                                        </Button>
                                                    </InputGroup>
                                                </Form.Group>
                                            </Col>
                                            <Col>
                                                <Form.Group className="mb-3" controlId="wspVerifyToken">
                                                    <Form.Label className="fw-semibold small">Token de verificación del Webhook</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="whatsapp.verify.token"
                                                        value={settings['whatsapp.verify.token']}
                                                        onChange={handleSettingChange}
                                                        placeholder="Ej. nextlead_verify_token"
                                                        style={{ fontSize: '0.9rem' }}
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Form.Group className="mb-3" controlId="wspApiToken">
                                            <Form.Label className="fw-semibold small">Permanent Access Token</Form.Label>
                                            <InputGroup>
                                                <Form.Control
                                                    type={showToken ? "text" : "password"}
                                                    name="whatsapp.api.token"
                                                    value={settings['whatsapp.api.token']}
                                                    onChange={handleSettingChange}
                                                    placeholder="EAAQ6..."
                                                    style={{ fontSize: '0.85rem' }}
                                                />
                                                <Button variant="outline-secondary" onClick={() => setShowToken(!showToken)}>
                                                    {showToken ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
                                                </Button>
                                            </InputGroup>
                                        </Form.Group>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        <div className="d-flex justify-content-end mt-4">
                            <Button variant="success" type="submit" size="lg" disabled={saving} style={{ borderRadius: '8px' }}>
                                {saving ? <Spinner size="sm" className="me-2" /> : <Icons.DeviceFloppy size={18} className="me-2" />}
                                Guardar Credenciales WhatsApp
                            </Button>
                        </div>
                    </Form>
                </Tab>

                {/* PESTAÑA 2: CONSTRUCTOR VISUAL DE IA (FLOW BUILDER) */}
                <Tab eventKey="ai_config" title={<span><Icons.Cpu size={18} className="me-1" /> Configuración de IA</span>}>
                    <Form onSubmit={handleSaveGeneral}>
                        <Row className="g-4">
                            {/* Ajustes de Google Gemini API */}
                            <Col xs={12}>
                                <Card className="shadow-sm border-0" style={{ borderRadius: '12px' }}>
                                    <Card.Header className="bg-success-subtle text-success-emphasis border-0 py-3 d-flex align-items-center gap-2" style={{ borderRadius: '12px 12px 0 0' }}>
                                        <Icons.Cpu size={24} />
                                        <h5 className="mb-0 fw-bold">Google Gemini AI & Reglas</h5>
                                    </Card.Header>
                                    <Card.Body className="p-4">
                                        <Row className="row-cols-1 row-cols-md-2 g-3 align-items-end">
                                            <Col>
                                                <Form.Group className="mb-3" controlId="geminiKey">
                                                    <Form.Label className="fw-semibold small">Google Gemini API Key</Form.Label>
                                                    <InputGroup>
                                                        <Form.Control
                                                            type={showGemini ? "text" : "password"}
                                                            name="gemini.api.key"
                                                            value={settings['gemini.api.key']}
                                                            onChange={handleSettingChange}
                                                            placeholder="AIzaSy..."
                                                            className="form-control-lg"
                                                            style={{ fontSize: '0.9rem' }}
                                                        />
                                                        <Button variant="outline-secondary" onClick={() => setShowGemini(!showGemini)} style={{ borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}>
                                                            {showGemini ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
                                                        </Button>
                                                    </InputGroup>
                                                </Form.Group>
                                            </Col>

                                            <Col>
                                                <Form.Group className="mb-3" controlId="geminiModel">
                                                    <Form.Label className="fw-semibold small">Modelo de Gemini</Form.Label>
                                                    <Form.Select
                                                        name="gemini.model_select"
                                                        value={['gemini-1.5-flash', 'gemini-2.5-flash', 'gemini-1.5-pro'].includes(settings['gemini.model']) ? settings['gemini.model'] : 'custom'}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (val !== 'custom') {
                                                                setSettings(prev => ({ ...prev, 'gemini.model': val }));
                                                            } else {
                                                                setSettings(prev => ({ ...prev, 'gemini.model': '' }));
                                                            }
                                                        }}
                                                        className="form-control-lg"
                                                        style={{ fontSize: '0.9rem' }}
                                                    >
                                                        <option value="gemini-1.5-flash">Gemini 1.5 Flash (Recomendado - Rápido y económico)</option>
                                                        <option value="gemini-2.5-flash">Gemini 2.5 Flash (Última generación - Balanceado)</option>
                                                        <option value="gemini-1.5-pro">Gemini 1.5 Pro (Complejo - Alta capacidad)</option>
                                                        <option value="custom">Otro modelo (Personalizado)...</option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        
                                        {(!['gemini-1.5-flash', 'gemini-2.5-flash', 'gemini-1.5-pro'].includes(settings['gemini.model'])) && (
                                            <Form.Group className="mb-3" controlId="geminiCustomModel">
                                                <Form.Label className="fw-semibold small">Nombre del Modelo Personalizado</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="gemini.model"
                                                    value={settings['gemini.model'] || ''}
                                                    onChange={handleSettingChange}
                                                    placeholder="Ingrese el nombre exacto del modelo (ej: gemini-2.5-pro)"
                                                    style={{ fontSize: '0.9rem' }}
                                                />
                                            </Form.Group>
                                        )}
                                        <Form.Text className="text-muted small d-block mb-3">
                                            Modelo activo configurado: <strong className="text-success">{settings['gemini.model'] || 'gemini-1.5-flash (por defecto)'}</strong>
                                        </Form.Text>
                                    </Card.Body>
                                </Card>
                            </Col>

                            {/* FLOW BUILDER CANVAS */}
                            <Col xs={12}>
                                <Card className="shadow-sm border-0" style={{ borderRadius: '12px' }}>
                                    <Card.Header className="bg-light border-0 py-3">
                                        <h5 className="mb-1 fw-bold text-dark d-flex align-items-center gap-2">
                                            <Icons.Settings size={22} className="text-success" />
                                            Constructor Visual de Flujo Conversacional (Flow Builder)
                                        </h5>
                                        <p className="text-muted mb-0 small">Crea la secuencia del chatbot ordenando y editando cada paso del flujo.</p>
                                    </Card.Header>
                                    <Card.Body className="p-4 bg-light-subtle">
                                        <Row className="g-4">
                                            {/* LEFT SIDE: STEPS TIMELINE ORDERING */}
                                            <Col lg={5} md={12}>
                                                <div className="d-flex flex-column gap-2 p-3 rounded border bg-light" style={{ maxHeight: '720px', overflowY: 'auto' }}>
                                                    {flowOrder.map((stepKey, idx) => {
                                                        let title = '';
                                                        let subtitle = '';
                                                        let stepIcon = null;
                                                        let activeBadge = true;

                                                        if (stepKey === 'business') {
                                                            title = 'Identidad del Bot';
                                                            subtitle = `${settings['ai.agent.name'] || 'Asesor IA'} (${settings['ai.tone']})`;
                                                            stepIcon = <Icons.User size={18} className="text-primary" />;
                                                        } else if (stepKey === 'welcome') {
                                                            title = 'Saludo Nuevo';
                                                            subtitle = settings['ai.greeting.new'] || 'Sin saludo inicial';
                                                            stepIcon = <Icons.Book size={18} className="text-success" />;
                                                        } else if (stepKey === 'registered') {
                                                            title = 'Saludo Registrado';
                                                            subtitle = settings['ai.greeting.registered'] || 'Sin saludo registrado';
                                                            stepIcon = <Icons.Book size={18} className="text-success" />;
                                                        } else if (stepKey === 'order') {
                                                            title = 'Solicitar Pedido';
                                                            subtitle = settings['ai.order.collect.text'] || 'Instrucciones para solicitar el pedido';
                                                            activeBadge = settings['ai.order.collect'] === 'true';
                                                            stepIcon = <Icons.ShoppingCart size={18} className="text-primary" />;
                                                        } else if (stepKey === 'location') {
                                                            title = 'Pedir Ubicación GPS';
                                                            subtitle = settings['ai.collect.location.text'] || 'Mensaje de solicitud';
                                                            activeBadge = settings['ai.collect.location'] === 'true';
                                                            stepIcon = <Icons.MapPin size={18} className="text-danger" />;
                                                        } else if (stepKey === 'promotion') {
                                                            title = 'Promoción Especial';
                                                            subtitle = settings['ai.products.promotion.text'] || 'Sin promoción';
                                                            activeBadge = settings['ai.products.promotion'] === 'true';
                                                            stepIcon = <Icons.Photo size={18} className="text-warning" />;
                                                        } else if (stepKey === 'billing') {
                                                            title = 'Datos Factura/Boleta';
                                                            subtitle = settings['ai.collect.document.text'] || 'Sin mensaje de comprobante';
                                                            activeBadge = settings['ai.collect.document'] === 'true';
                                                            stepIcon = <Icons.FileText size={18} className="text-info" />;
                                                        } else if (stepKey === 'container') {
                                                            title = 'Preguntar Envase';
                                                            subtitle = settings['ai.ask.container.text'] || 'Sin mensaje de envase';
                                                            activeBadge = settings['ai.ask.container'] === 'true';
                                                            stepIcon = <Icons.Archive size={18} className="text-secondary" />;
                                                        } else if (stepKey === 'payment') {
                                                            title = 'Métodos de Pago';
                                                            subtitle = settings['ai.payment.methods'] || 'Yape, Plin...';
                                                            stepIcon = <Icons.DeviceFloppy size={18} className="text-success" />;
                                                        } else if (stepKey === 'custom') {
                                                            title = 'Instrucciones Especiales';
                                                            subtitle = settings['ai.custom.instructions'] || 'Reglas adicionales';
                                                            stepIcon = <Icons.Cpu size={18} className="text-dark" />;
                                                        }

                                                        return (
                                                            <div
                                                                key={stepKey}
                                                                onClick={() => setActiveNode(stepKey)}
                                                                className={`p-3 rounded border shadow-sm cursor-pointer transition-all ${activeNode === stepKey ? 'border-success bg-success-subtle shadow' : 'bg-white'} ${!activeBadge ? 'opacity-50' : ''}`}
                                                                style={{ cursor: 'pointer', borderLeftWidth: activeNode === stepKey ? '4px' : '1px' }}
                                                            >
                                                                <div className="d-flex align-items-center justify-content-between">
                                                                    <span className="fw-semibold d-flex align-items-center gap-2 text-dark">
                                                                        {stepIcon}
                                                                        {title}
                                                                    </span>
                                                                    <div className="d-flex align-items-center gap-2">
                                                                        <Badge bg={activeBadge ? "success-subtle" : "secondary-subtle"} className={activeBadge ? "text-success" : "text-secondary"}>
                                                                            {activeBadge ? 'Activo' : 'Desactivado'}
                                                                        </Badge>
                                                                        
                                                                        <div className="d-flex align-items-center gap-1 bg-light px-1 py-0.5 rounded border">
                                                                            <Button 
                                                                                variant="link" 
                                                                                size="sm" 
                                                                                className="p-0 text-muted lh-1" 
                                                                                disabled={idx === 0}
                                                                                onClick={(e) => { e.stopPropagation(); handleMoveStep(idx, 'up'); }}
                                                                                title="Subir paso"
                                                                                style={{ textDecoration: 'none', fontSize: '0.7rem' }}
                                                                            >
                                                                                ▲
                                                                            </Button>
                                                                            <Button 
                                                                                variant="link" 
                                                                                size="sm" 
                                                                                className="p-0 text-muted lh-1" 
                                                                                disabled={idx === flowOrder.length - 1}
                                                                                onClick={(e) => { e.stopPropagation(); handleMoveStep(idx, 'down'); }}
                                                                                title="Bajar paso"
                                                                                style={{ textDecoration: 'none', fontSize: '0.7rem' }}
                                                                            >
                                                                                ▼
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <p className="text-muted small mt-2 mb-0 text-truncate">{subtitle}</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </Col>

                                            {/* RIGHT SIDE: SELECTED STEP EDITOR */}
                                            <Col lg={7} md={12}>
                                                <Card className="border shadow-sm h-100">
                                                    <Card.Header className="bg-white py-3 border-0 border-bottom d-flex justify-content-between align-items-center">
                                                        <h6 className="fw-bold mb-0 text-dark">📝 Editor de Bloque: {activeNode.toUpperCase()}</h6>
                                                        <Button 
                                                            variant="success" 
                                                            size="sm" 
                                                            disabled={saving} 
                                                            onClick={handleSaveGeneral}
                                                            style={{ borderRadius: '6px' }}
                                                        >
                                                            {saving ? <Spinner size="sm" className="me-1" /> : <Icons.DeviceFloppy size={16} className="me-1" />}
                                                            Guardar Bloque
                                                        </Button>
                                                    </Card.Header>
                                                    <Card.Body className="p-4">
                                                        {/* 1. NODE BUSINESS */}
                                                        {activeNode === 'business' && (
                                                            <div>
                                                                <Form.Group className="mb-3" controlId="aiActive">
                                                                    <Form.Label className="fw-semibold small">Agente Activo</Form.Label>
                                                                    <Form.Check
                                                                        type="switch"
                                                                        id="ai-active-switch-flow"
                                                                        checked={settings['ai.active'] === 'true'}
                                                                        onChange={(e) => setSettings(prev => ({ ...prev, 'ai.active': e.target.checked ? 'true' : 'false' }))}
                                                                        label="Permitir respuestas automáticas del bot de IA"
                                                                    />
                                                                </Form.Group>

                                                                <Form.Group className="mb-3" controlId="aiAgentName">
                                                                    <Form.Label className="fw-semibold small">Nombre del Agente</Form.Label>
                                                                    <Form.Control
                                                                        type="text"
                                                                        name="ai.agent.name"
                                                                        value={settings['ai.agent.name']}
                                                                        onChange={handleSettingChange}
                                                                        placeholder="Ej. Antarqui Bot"
                                                                    />
                                                                </Form.Group>

                                                                <Form.Group className="mb-3" controlId="aiBusinessType">
                                                                    <Form.Label className="fw-semibold small">Flujo de Negocio (Giro)</Form.Label>
                                                                    <Form.Select
                                                                        name="ai.business.type"
                                                                        value={settings['ai.business.type'] || 'ECOMMERCE'}
                                                                        onChange={handleSettingChange}
                                                                    >
                                                                        <option value="ECOMMERCE">E-commerce (Venta y entrega de productos del catálogo)</option>
                                                                        <option value="SERVICES">Servicios (Cotizaciones y reserva de citas)</option>
                                                                        <option value="RESERVATIONS">Reservaciones (Restaurantes, Hoteles y Mesas)</option>
                                                                        <option value="LEADS">Leads B2B (Fidelización y toma de datos de contacto)</option>
                                                                    </Form.Select>
                                                                </Form.Group>

                                                                <Form.Group className="mb-3" controlId="aiBusinessDesc">
                                                                    <Form.Label className="fw-semibold small">Giro / Descripción de la Empresa</Form.Label>
                                                                    <Form.Control
                                                                        as="textarea"
                                                                        rows={3}
                                                                        name="ai.business.description"
                                                                        value={settings['ai.business.description']}
                                                                        onChange={handleSettingChange}
                                                                        placeholder="Escribe a qué se dedica la empresa..."
                                                                    />
                                                                </Form.Group>

                                                                <Form.Group className="mb-3" controlId="aiTone">
                                                                    <Form.Label className="fw-semibold small">Tono de Comunicación del Bot</Form.Label>
                                                                    <Form.Select
                                                                        name="ai.tone"
                                                                        value={settings['ai.tone']}
                                                                        onChange={handleSettingChange}
                                                                    >
                                                                        <option value="Amigable y cercano">Amigable y cercano</option>
                                                                        <option value="Profesional y formal">Profesional y formal</option>
                                                                        <option value="Directo y conciso">Directo y conciso</option>
                                                                        <option value="Entusiasta y alegre">Entusiasta y alegre</option>
                                                                    </Form.Select>
                                                                </Form.Group>

                                                                <Form.Group className="mb-3" controlId="aiMaxQuota">
                                                                    <Form.Label className="fw-semibold small">Límite Diario de Mensajes por Cliente</Form.Label>
                                                                    <Form.Control
                                                                        type="number"
                                                                        name="ai.max.quota"
                                                                        value={settings['ai.max.quota'] || '30'}
                                                                        onChange={handleSettingChange}
                                                                        placeholder="Ej: 30"
                                                                    />
                                                                </Form.Group>
                                                            </div>
                                                        )}

                                                        {/* 2. NODE WELCOME GREETING */}
                                                        {activeNode === 'welcome' && (
                                                            <div>
                                                                <Form.Group className="mb-3" controlId="welcomeText">
                                                                    <Form.Label className="fw-semibold small">Mensaje de Saludo para Clientes Nuevos</Form.Label>
                                                                    <Form.Control
                                                                        as="textarea"
                                                                        rows={5}
                                                                        name="ai.greeting.new"
                                                                        value={settings['ai.greeting.new']}
                                                                        onChange={handleSettingChange}
                                                                    />
                                                                </Form.Group>

                                                                <Form.Group className="mb-3" controlId="welcomeMediaType">
                                                                    <Form.Label className="fw-semibold small">Adjunto Multimedia (Imagen)</Form.Label>
                                                                    <Form.Select
                                                                        name="ai.greeting.new.media.type"
                                                                        value={settings['ai.greeting.new.media.type'] || 'NONE'}
                                                                        onChange={handleSettingChange}
                                                                    >
                                                                        <option value="NONE">Ninguno (Sólo Texto)</option>
                                                                        <option value="IMAGE">Imagen (WhatsApp Media ID o URL)</option>
                                                                    </Form.Select>
                                                                </Form.Group>

                                                                {settings['ai.greeting.new.media.type'] === 'IMAGE' && (
                                                                    <Form.Group className="mb-3" controlId="welcomeMediaIds">
                                                                        <Form.Label className="fw-semibold small">Media IDs o URLs de Imágenes (separadas por coma)</Form.Label>
                                                                        <Form.Control
                                                                            type="text"
                                                                            name="ai.greeting.new.media.ids"
                                                                            value={settings['ai.greeting.new.media.ids'] || ''}
                                                                            onChange={handleSettingChange}
                                                                            placeholder="Ej: 128763529384, https://tu-sitio.com/banner.jpg"
                                                                        />
                                                                        
                                                                        {/* Catalog Selector Dropdown */}
                                                                        <div className="mt-3 bg-light p-2 rounded border">
                                                                            <Form.Label className="small fw-semibold d-block text-muted">⚡ Seleccionar rápido desde Catálogo de Ventas:</Form.Label>
                                                                            {productsConfig.length > 0 ? (
                                                                                <Form.Select
                                                                                    size="sm"
                                                                                    value=""
                                                                                    onChange={(e) => {
                                                                                        const val = e.target.value;
                                                                                        if (!val) return;
                                                                                        const current = settings['ai.greeting.new.media.ids'] || '';
                                                                                        if (current.includes(val)) return;
                                                                                        const updated = current.trim() === '' ? val : `${current}, ${val}`;
                                                                                        
                                                                                        const prod = productsConfig.find(p => {
                                                                                            const url = `${API_BASE}/api/productos/${p.productoId}/imagen`;
                                                                                            return p.mediaIdWhatsapp === val || url === val;
                                                                                        });
                                                                                        const detailsText = prod ? `\n\n*${prod.productName}*\n💵 *Precio:* S/ ${prod.productPrice}\n${prod.customAiDescription || ''}` : '';
                                                                                        
                                                                                        setSettings(prev => ({ 
                                                                                            ...prev, 
                                                                                            'ai.greeting.new.media.ids': updated,
                                                                                            'ai.greeting.new': (prev['ai.greeting.new'] || '') + detailsText
                                                                                        }));
                                                                                    }}
                                                                                >
                                                                                    <option value="">-- Selecciona una imagen del catálogo --</option>
                                                                                    {productsConfig.map(p => {
                                                                                        const url = `${API_BASE}/api/productos/${p.productoId}/imagen`;
                                                                                        const finalVal = p.mediaIdWhatsapp && p.mediaIdWhatsapp.trim() !== '' ? p.mediaIdWhatsapp : url;
                                                                                        return <option key={p.productoId} value={finalVal}>{p.productName} ({p.mediaIdWhatsapp ? 'ID WhatsApp' : 'URL Imagen'})</option>;
                                                                                    })}
                                                                                </Form.Select>
                                                                            ) : (
                                                                                <span className="text-muted small">Cargando catálogo...</span>
                                                                            )}
                                                                        </div>
                                                                    </Form.Group>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* 3. NODE REGISTERED GREETING */}
                                                        {activeNode === 'registered' && (
                                                            <div>
                                                                <Form.Group className="mb-3" controlId="registeredText">
                                                                    <Form.Label className="fw-semibold small">Mensaje de Saludo para Clientes Registrados</Form.Label>
                                                                    <Form.Control
                                                                        as="textarea"
                                                                        rows={5}
                                                                        name="ai.greeting.registered"
                                                                        value={settings['ai.greeting.registered']}
                                                                        onChange={handleSettingChange}
                                                                    />
                                                                </Form.Group>

                                                                <Form.Group className="mb-3" controlId="registeredMediaType">
                                                                    <Form.Label className="fw-semibold small">Adjunto Multimedia (Imagen)</Form.Label>
                                                                    <Form.Select
                                                                        name="ai.greeting.registered.media.type"
                                                                        value={settings['ai.greeting.registered.media.type'] || 'NONE'}
                                                                        onChange={handleSettingChange}
                                                                    >
                                                                        <option value="NONE">Ninguno (Sólo Texto)</option>
                                                                        <option value="IMAGE">Imagen (WhatsApp Media ID o URL)</option>
                                                                    </Form.Select>
                                                                </Form.Group>

                                                                {settings['ai.greeting.registered.media.type'] === 'IMAGE' && (
                                                                    <Form.Group className="mb-3" controlId="registeredMediaIds">
                                                                        <Form.Label className="fw-semibold small">Media IDs o URLs de Imágenes (separadas por coma)</Form.Label>
                                                                        <Form.Control
                                                                            type="text"
                                                                            name="ai.greeting.registered.media.ids"
                                                                            value={settings['ai.greeting.registered.media.ids'] || ''}
                                                                            onChange={handleSettingChange}
                                                                            placeholder="Ej: 128763529384, https://tu-sitio.com/banner.jpg"
                                                                        />

                                                                        {/* Catalog Selector Dropdown */}
                                                                        <div className="mt-3 bg-light p-2 rounded border">
                                                                            <Form.Label className="small fw-semibold d-block text-muted">⚡ Seleccionar rápido desde Catálogo de Ventas:</Form.Label>
                                                                            {productsConfig.length > 0 ? (
                                                                                <Form.Select
                                                                                    size="sm"
                                                                                    value=""
                                                                                    onChange={(e) => {
                                                                                        const val = e.target.value;
                                                                                        if (!val) return;
                                                                                        const current = settings['ai.greeting.registered.media.ids'] || '';
                                                                                        if (current.includes(val)) return;
                                                                                        const updated = current.trim() === '' ? val : `${current}, ${val}`;
                                                                                        
                                                                                        const prod = productsConfig.find(p => {
                                                                                            const url = `${API_BASE}/api/productos/${p.productoId}/imagen`;
                                                                                            return p.mediaIdWhatsapp === val || url === val;
                                                                                        });
                                                                                        const detailsText = prod ? `\n\n*${prod.productName}*\n💵 *Precio:* S/ ${prod.productPrice}\n${prod.customAiDescription || ''}` : '';
                                                                                        
                                                                                        setSettings(prev => ({ 
                                                                                            ...prev, 
                                                                                            'ai.greeting.registered.media.ids': updated,
                                                                                            'ai.greeting.registered': (prev['ai.greeting.registered'] || '') + detailsText
                                                                                        }));
                                                                                    }}
                                                                                >
                                                                                    <option value="">-- Selecciona una imagen del catálogo --</option>
                                                                                    {productsConfig.map(p => {
                                                                                        const url = `${API_BASE}/api/productos/${p.productoId}/imagen`;
                                                                                        const finalVal = p.mediaIdWhatsapp && p.mediaIdWhatsapp.trim() !== '' ? p.mediaIdWhatsapp : url;
                                                                                        return <option key={p.productoId} value={finalVal}>{p.productName} ({p.mediaIdWhatsapp ? 'ID WhatsApp' : 'URL Imagen'})</option>;
                                                                                    })}
                                                                                </Form.Select>
                                                                            ) : (
                                                                                <span className="text-muted small">Cargando catálogo...</span>
                                                                            )}
                                                                        </div>
                                                                    </Form.Group>
                                                                )}
                                                            </div>
                                                        )}

                                                         {/* 3.5. NODE ORDER COLLECT */}
                                                         {activeNode === 'order' && (
                                                             <div>
                                                                 <Form.Group className="mb-3" controlId="collectOrder">
                                                                     <Form.Check
                                                                         type="switch"
                                                                         id="collect-order-switch"
                                                                         checked={settings['ai.order.collect'] === 'true'}
                                                                         onChange={(e) => setSettings(prev => ({ ...prev, 'ai.order.collect': e.target.checked ? 'true' : 'false' }))}
                                                                         label="Solicitar Pedido de entrada automáticamente"
                                                                         className="fw-semibold text-dark"
                                                                     />
                                                                 </Form.Group>

                                                                 {settings['ai.order.collect'] === 'true' && (
                                                                     <Form.Group className="mb-3" controlId="collectOrderText">
                                                                         <Form.Label className="fw-semibold small">Instrucciones / Mensaje para solicitar el pedido</Form.Label>
                                                                         <Form.Control
                                                                             as="textarea"
                                                                             rows={4}
                                                                             name="ai.order.collect.text"
                                                                             value={settings['ai.order.collect.text'] || ''}
                                                                             onChange={handleSettingChange}
                                                                             placeholder="Ej: Por favor, indícame qué productos o cuántas recargas deseas solicitar hoy..."
                                                                         />
                                                                     </Form.Group>
                                                                 )}
                                                             </div>
                                                         )}

                                                        {/* 4. NODE LOCATION GPS */}
                                                        {activeNode === 'location' && (
                                                            <div>
                                                                <Form.Group className="mb-3" controlId="collectLoc">
                                                                    <Form.Check
                                                                        type="switch"
                                                                        id="collect-location-switch"
                                                                        checked={settings['ai.collect.location'] === 'true'}
                                                                        onChange={(e) => setSettings(prev => ({ ...prev, 'ai.collect.location': e.target.checked ? 'true' : 'false' }))}
                                                                        label="Solicitar Ubicación GPS nativa por WhatsApp"
                                                                        className="fw-bold mb-3 text-danger"
                                                                    />
                                                                </Form.Group>

                                                                {settings['ai.collect.location'] === 'true' && (
                                                                    <Form.Group className="mb-3" controlId="collectLocText">
                                                                        <Form.Label className="fw-semibold small">Instrucciones / Mensaje de solicitud</Form.Label>
                                                                        <Form.Control
                                                                            as="textarea"
                                                                            rows={4}
                                                                            name="ai.collect.location.text"
                                                                            value={settings['ai.collect.location.text']}
                                                                            onChange={handleSettingChange}
                                                                        />
                                                                    </Form.Group>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* 5. NODE PROMOTION */}
                                                        {activeNode === 'promotion' && (
                                                            <div>
                                                                <Form.Group className="mb-3" controlId="productsPromo">
                                                                    <Form.Check
                                                                        type="switch"
                                                                        id="products-promotion-switch"
                                                                        checked={settings['ai.products.promotion'] === 'true'}
                                                                        onChange={(e) => setSettings(prev => ({ ...prev, 'ai.products.promotion': e.target.checked ? 'true' : 'false' }))}
                                                                        label="Ofrecer Promoción de entrada automáticamente"
                                                                        className="fw-bold mb-3 text-warning"
                                                                    />
                                                                </Form.Group>

                                                                {settings['ai.products.promotion'] === 'true' && (
                                                                    <>
                                                                        <Form.Group className="mb-3" controlId="promoText">
                                                                            <Form.Label className="fw-semibold small">Mensaje / Contenido de la Promoción</Form.Label>
                                                                            <Form.Control
                                                                                as="textarea"
                                                                                rows={4}
                                                                                name="ai.products.promotion.text"
                                                                                value={settings['ai.products.promotion.text']}
                                                                                onChange={handleSettingChange}
                                                                            />
                                                                        </Form.Group>

                                                                        <Form.Group className="mb-3" controlId="promoKeywords">
                                                                            <Form.Label className="fw-semibold small">Palabras Clave de Activación (separadas por comas)</Form.Label>
                                                                            <Form.Control
                                                                                type="text"
                                                                                name="ai.products.promotion.keywords"
                                                                                value={settings['ai.products.promotion.keywords'] || ''}
                                                                                onChange={handleSettingChange}
                                                                                placeholder="Ej: promocion, descuento, oferta, combo, pack"
                                                                            />
                                                                            <Form.Text className="text-muted small">
                                                                                La IA ofrecerá esta promoción cuando detecte intenciones o palabras similares a las ingresadas aquí.
                                                                            </Form.Text>
                                                                        </Form.Group>

                                                                        <Form.Group className="mb-3" controlId="promoMediaType">
                                                                            <Form.Label className="fw-semibold small">Adjunto Multimedia (Imagen)</Form.Label>
                                                                            <Form.Select
                                                                                name="ai.products.promotion.media.type"
                                                                                value={settings['ai.products.promotion.media.type'] || 'NONE'}
                                                                                onChange={handleSettingChange}
                                                                            >
                                                                                <option value="NONE">Ninguno (Sólo Texto)</option>
                                                                                <option value="IMAGE">Imagen promocional (WhatsApp Media ID o URL)</option>
                                                                            </Form.Select>
                                                                        </Form.Group>

                                                                        {settings['ai.products.promotion.media.type'] === 'IMAGE' && (
                                                                            <Form.Group className="mb-3" controlId="promoMediaIds">
                                                                                <Form.Label className="fw-semibold small">Media IDs o URLs de Imágenes (separadas por coma)</Form.Label>
                                                                                <Form.Control
                                                                                    type="text"
                                                                                    name="ai.products.promotion.media.ids"
                                                                                    value={settings['ai.products.promotion.media.ids'] || ''}
                                                                                    onChange={handleSettingChange}
                                                                                    placeholder="Ej: 128763529384, https://tu-sitio.com/banner.jpg"
                                                                                />

                                                                                {/* Catalog Selector Dropdown */}
                                                                                <div className="mt-3 bg-light p-2 rounded border">
                                                                                    <Form.Label className="small fw-semibold d-block text-muted">⚡ Seleccionar rápido desde Catálogo de Ventas:</Form.Label>
                                                                                    {productsConfig.length > 0 ? (
                                                                                        <Form.Select
                                                                                            size="sm"
                                                                                            value=""
                                                                                            onChange={(e) => {
                                                                                                const val = e.target.value;
                                                                                                if (!val) return;
                                                                                                const current = settings['ai.products.promotion.media.ids'] || '';
                                                                                                if (current.includes(val)) return;
                                                                                                const updated = current.trim() === '' ? val : `${current}, ${val}`;
                                                                                                
                                                                                                const prod = productsConfig.find(p => {
                                                                                                    const url = `${API_BASE}/api/productos/${p.productoId}/imagen`;
                                                                                                    return p.mediaIdWhatsapp === val || url === val;
                                                                                                });
                                                                                                const detailsText = prod ? `\n\n*${prod.productName}*\n💵 *Precio:* S/ ${prod.productPrice}\n${prod.customAiDescription || ''}` : '';
                                                                                                
                                                                                                setSettings(prev => ({ 
                                                                                                    ...prev, 
                                                                                                    'ai.products.promotion.media.ids': updated,
                                                                                                    'ai.products.promotion.text': (prev['ai.products.promotion.text'] || '') + detailsText
                                                                                                }));
                                                                                            }}
                                                                                        >
                                                                                            <option value="">-- Selecciona una imagen del catálogo --</option>
                                                                                            {productsConfig.map(p => {
                                                                                                const url = `${API_BASE}/api/productos/${p.productoId}/imagen`;
                                                                                                const finalVal = p.mediaIdWhatsapp && p.mediaIdWhatsapp.trim() !== '' ? p.mediaIdWhatsapp : url;
                                                                                                return <option key={p.productoId} value={finalVal}>{p.productName} ({p.mediaIdWhatsapp ? 'ID WhatsApp' : 'URL Imagen'})</option>;
                                                                                            })}
                                                                                        </Form.Select>
                                                                                    ) : (
                                                                                        <span className="text-muted small">Cargando catálogo...</span>
                                                                                    )}
                                                                                </div>
                                                                            </Form.Group>
                                                                        )}

                                                                        <Form.Group className="mb-3" controlId="promoPostText">
                                                                            <Form.Label className="fw-semibold small">Mensaje Posterior (Enviar después de las imágenes)</Form.Label>
                                                                            <Form.Control
                                                                                as="textarea"
                                                                                rows={3}
                                                                                name="ai.products.promotion.post.text"
                                                                                value={settings['ai.products.promotion.post.text'] || ''}
                                                                                onChange={handleSettingChange}
                                                                                placeholder="Ej: ¿Te gustaría llevar alguna de estas promociones o prefieres ver otros productos? 💧"
                                                                            />
                                                                            <Form.Text className="text-muted small">
                                                                                Este texto opcional se enviará como un mensaje independiente justo después de enviar todas las imágenes de la promoción.
                                                                            </Form.Text>
                                                                        </Form.Group>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* 6. NODE BILLING */}
                                                        {activeNode === 'billing' && (
                                                            <div>
                                                                <Form.Group className="mb-3" controlId="collectDoc">
                                                                    <Form.Check
                                                                        type="switch"
                                                                        id="collect-document-switch"
                                                                        checked={settings['ai.collect.document'] === 'true'}
                                                                        onChange={(e) => setSettings(prev => ({ ...prev, 'ai.collect.document': e.target.checked ? 'true' : 'false' }))}
                                                                        label="Solicitar Datos de Facturación (Boleta/Factura, DNI/RUC)"
                                                                        className="fw-bold mb-3 text-info"
                                                                    />
                                                                </Form.Group>

                                                                {settings['ai.collect.document'] === 'true' && (
                                                                    <Form.Group className="mb-3" controlId="collectDocText">
                                                                        <Form.Label className="fw-semibold small">Instrucciones de captura de datos</Form.Label>
                                                                        <Form.Control
                                                                            as="textarea"
                                                                            rows={4}
                                                                            name="ai.collect.document.text"
                                                                            value={settings['ai.collect.document.text']}
                                                                            onChange={handleSettingChange}
                                                                        />
                                                                    </Form.Group>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* 7. NODE CONTAINER */}
                                                        {activeNode === 'container' && (
                                                            <div>
                                                                <Form.Group className="mb-3" controlId="askContainer">
                                                                    <Form.Check
                                                                        type="switch"
                                                                        id="ask-container-switch"
                                                                        checked={settings['ai.ask.container'] === 'true'}
                                                                        onChange={(e) => setSettings(prev => ({ ...prev, 'ai.ask.container': e.target.checked ? 'true' : 'false' }))}
                                                                        label="Preguntar si cuenta con Envase Retornable de 20L"
                                                                        className="fw-bold mb-3 text-secondary"
                                                                    />
                                                                </Form.Group>

                                                                {settings['ai.ask.container'] === 'true' && (
                                                                    <Form.Group className="mb-3" controlId="askContainerText">
                                                                        <Form.Label className="fw-semibold small">Regla e Instrucción de Envase</Form.Label>
                                                                        <Form.Control
                                                                            as="textarea"
                                                                            rows={4}
                                                                            name="ai.ask.container.text"
                                                                            value={settings['ai.ask.container.text']}
                                                                            onChange={handleSettingChange}
                                                                        />
                                                                    </Form.Group>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* 8. NODE PAYMENT */}
                                                        {activeNode === 'payment' && (
                                                            <div>
                                                                <Form.Group className="mb-3" controlId="paymentMethods">
                                                                    <Form.Label className="fw-semibold small">Métodos de Pago Autorizados</Form.Label>
                                                                    <Form.Control
                                                                        as="textarea"
                                                                        rows={8}
                                                                        name="ai.payment.methods"
                                                                        value={settings['ai.payment.methods']}
                                                                        onChange={handleSettingChange}
                                                                        placeholder="Coloca aquí los medios de pago detallados..."
                                                                    />
                                                                </Form.Group>
                                                            </div>
                                                        )}

                                                        {/* 9. NODE CUSTOM */}
                                                        {activeNode === 'custom' && (
                                                            <div>
                                                                <Form.Group className="mb-3" controlId="customInstructions">
                                                                    <Form.Label className="fw-semibold small">Instrucciones Adicionales del Sistema (Directivas)</Form.Label>
                                                                    <Form.Control
                                                                        as="textarea"
                                                                        rows={6}
                                                                        name="ai.custom.instructions"
                                                                        value={settings['ai.custom.instructions']}
                                                                        onChange={handleSettingChange}
                                                                        placeholder="Agrega reglas específicas para afinar las respuestas de la IA..."
                                                                    />
                                                                </Form.Group>
                                                            </div>
                                                        )}

                                                        {/* WHATSAPP MESSAGE SIMULATION FOR PREVIEW */}
                                                        <hr className="my-4" />
                                                        <h6 className="fw-bold small text-muted mb-2">👁️ Simulador en WhatsApp:</h6>
                                                        <div className="p-3 rounded shadow-inner" style={{ backgroundColor: '#efeae2', backgroundImage: 'radial-gradient(#dfdcd6 10%, transparent 11%)', backgroundSize: '10px 10px', border: '1px solid #cbd5e1' }}>
                                                            {/* Render welcome mock */}
                                                            {activeNode === 'welcome' && (
                                                                <div className="d-flex flex-column mb-2" style={{ maxWidth: '85%' }}>
                                                                    <div className="bg-white p-2 rounded shadow-sm small" style={{ borderRadius: '0px 10px 10px 10px' }}>
                                                                        {settings['ai.greeting.new.media.type'] === 'IMAGE' && renderPreviewImages(settings['ai.greeting.new.media.ids'])}
                                                                        <span className="fw-semibold text-success d-block mb-1" style={{ fontSize: '0.7rem' }}>🤖 Asesor IA:</span>
                                                                        <span className="text-dark" style={{ fontSize: '0.82rem', whiteSpace: 'pre-wrap' }}>
                                                                            {formatWhatsappText(settings['ai.greeting.new'])}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Render registered mock */}
                                                            {activeNode === 'registered' && (
                                                                <div className="d-flex flex-column mb-2" style={{ maxWidth: '85%' }}>
                                                                    <div className="bg-white p-2 rounded shadow-sm small" style={{ borderRadius: '0px 10px 10px 10px' }}>
                                                                        {settings['ai.greeting.registered.media.type'] === 'IMAGE' && renderPreviewImages(settings['ai.greeting.registered.media.ids'])}
                                                                        <span className="fw-semibold text-success d-block mb-1" style={{ fontSize: '0.7rem' }}>🤖 Asesor IA:</span>
                                                                        <span className="text-dark" style={{ fontSize: '0.82rem', whiteSpace: 'pre-wrap' }}>
                                                                            {formatWhatsappText(settings['ai.greeting.registered'].replace('[Nombre]', 'Juan Carlos'))}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Render GPS location mock */}
                                                            {activeNode === 'location' && (
                                                                <>
                                                                    {/* Flujo A: Cliente Registrado */}
                                                                    <div className="mb-3 border-bottom pb-2">
                                                                        <span className="badge bg-primary mb-2 small text-uppercase" style={{ fontSize: '0.62rem' }}>1. Vista Cliente Registrado</span>
                                                                        <div className="d-flex flex-column mb-2" style={{ maxWidth: '85%' }}>
                                                                            <div className="bg-white p-2 rounded shadow-sm small" style={{ borderRadius: '0px 10px 10px 10px' }}>
                                                                                <span className="fw-semibold text-success d-block mb-1" style={{ fontSize: '0.7rem' }}>🤖 Asesor IA:</span>
                                                                                <span className="text-dark" style={{ fontSize: '0.82rem', whiteSpace: 'pre-wrap' }}>
                                                                                    {formatWhatsappText(extractScenario1Message(settings['ai.collect.location.text'])
                                                                                        .replace('[Nombre]', 'Juan Carlos')
                                                                                        .replace('[Dirección guardada]', 'Av. Larco 123')
                                                                                        .replace('[Distrito guardado]', 'Miraflores')
                                                                                        .replace('[URL Google Maps guardada]', 'https://maps.google.com/?q=-12.122,-77.028')
                                                                                    )}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Flujo B: Cliente Nuevo */}
                                                                    <div>
                                                                        <span className="badge bg-success mb-2 small text-uppercase" style={{ fontSize: '0.62rem' }}>2. Vista Cliente Nuevo / Sin Dirección</span>
                                                                        
                                                                        {/* Pregunta Distrito */}
                                                                        <div className="d-flex flex-column mb-2" style={{ maxWidth: '85%' }}>
                                                                            <div className="bg-white p-2 rounded shadow-sm small" style={{ borderRadius: '0px 10px 10px 10px' }}>
                                                                                <span className="fw-semibold text-success d-block mb-1" style={{ fontSize: '0.7rem' }}>🤖 Asesor IA:</span>
                                                                                <span className="text-dark" style={{ fontSize: '0.82rem', whiteSpace: 'pre-wrap' }}>
                                                                                    {formatWhatsappText(extractScenario2DistrictMessage(settings['ai.collect.location.text']))}
                                                                                </span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Respuesta Cliente */}
                                                                        <div className="d-flex flex-column align-items-end mb-2">
                                                                            <div className="p-2 rounded text-dark position-relative shadow-sm small" style={{ maxWidth: '85%', backgroundColor: '#d9fdd3', borderRadius: '10px 0px 10px 10px' }}>
                                                                                <span className="fw-semibold text-primary d-block mb-1" style={{ fontSize: '0.7rem' }}>👤 Cliente:</span>
                                                                                <span className="text-dark" style={{ fontSize: '0.82rem' }}>Santiago de Surco</span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Envia Formulario */}
                                                                        <div className="d-flex flex-column mb-2" style={{ maxWidth: '85%' }}>
                                                                            <div className="bg-white p-2 rounded shadow-sm small" style={{ borderRadius: '0px 10px 10px 10px' }}>
                                                                                <span className="fw-semibold text-success d-block mb-1" style={{ fontSize: '0.7rem' }}>🤖 Asesor IA:</span>
                                                                                <span className="text-dark" style={{ fontSize: '0.82rem', whiteSpace: 'pre-wrap' }}>
                                                                                    {formatWhatsappText(extractScenario2FormMessage(settings['ai.collect.location.text']).replace('[Distrito indicado]', 'Santiago de Surco'))}
                                                                                </span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Cliente responde mapa */}
                                                                        <div className="d-flex flex-column align-items-end mb-1">
                                                                            <div className="p-2 rounded text-dark position-relative shadow-sm small" style={{ maxWidth: '85%', backgroundColor: '#d9fdd3', borderRadius: '10px 0px 10px 10px' }}>
                                                                                <span className="fw-semibold text-primary d-block mb-1" style={{ fontSize: '0.7rem' }}>👤 Cliente:</span>
                                                                                <div className="d-flex align-items-center gap-2 bg-light p-2 rounded border small">
                                                                                    <span style={{ fontSize: '1.2rem' }}>📍</span>
                                                                                    <div className="text-start">
                                                                                        <strong style={{ fontSize: '0.72rem' }}>Ubicación compartida</strong>
                                                                                        <br />
                                                                                        <span className="text-muted" style={{ fontSize: '0.62rem' }}>Ver mapa en WhatsApp</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}

                                                            {/* Render promotion mock */}
                                                            {activeNode === 'promotion' && (
                                                                <>
                                                                    <div className="d-flex flex-column mb-2" style={{ maxWidth: '85%' }}>
                                                                        <div className="bg-white p-2 rounded shadow-sm small" style={{ borderRadius: '0px 10px 10px 10px' }}>
                                                                            <span className="fw-semibold text-success d-block mb-1" style={{ fontSize: '0.7rem' }}>🤖 Asesor IA:</span>
                                                                            <span className="text-dark" style={{ fontSize: '0.82rem', whiteSpace: 'pre-wrap' }}>
                                                                                {formatWhatsappText(settings['ai.products.promotion.text'])}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {settings['ai.products.promotion.media.type'] === 'IMAGE' && settings['ai.products.promotion.media.ids'] && (
                                                                        settings['ai.products.promotion.media.ids'].split(',').map((item, idx) => {
                                                                            const trimmed = item.trim();
                                                                            if (!trimmed) return null;
                                                                            const src = getImageUrlForMediaId(trimmed);
                                                                            
                                                                            // Find matching product in productsConfig
                                                                            const isUrl = trimmed.startsWith('http') || trimmed.startsWith('data:') || trimmed.startsWith('/');
                                                                            const prod = productsConfig.find(p => 
                                                                                (p.mediaIdWhatsapp && String(p.mediaIdWhatsapp).trim() === trimmed) ||
                                                                                (isUrl && p.productoId && trimmed.includes(`/api/productos/${p.productoId}/imagen`))
                                                                            );

                                                                            return (
                                                                                <div key={idx} className="d-flex flex-column mb-2" style={{ maxWidth: '85%' }}>
                                                                                    <div className="bg-white p-2 rounded shadow-sm small" style={{ borderRadius: '0px 10px 10px 10px' }}>
                                                                                        <div className="overflow-hidden rounded border text-center bg-light shadow-sm mb-2" style={{ width: '100%', maxHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                                            <img 
                                                                                                src={src} 
                                                                                                alt={`Preview ${idx}`} 
                                                                                                style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                                                                                            />
                                                                                        </div>
                                                                                        {prod ? (
                                                                                            <div className="text-dark" style={{ fontSize: '0.82rem', whiteSpace: 'pre-wrap' }}>
                                                                                                {formatWhatsappText(`*${prod.productName}*\n💵 *Precio:* S/ ${prod.productPrice}\n${prod.customAiDescription || ''}`)}
                                                                                            </div>
                                                                                        ) : (
                                                                                            <span className="text-muted small">Imagen de promoción {idx}</span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })
                                                                    )}

                                                                    {settings['ai.products.promotion.post.text'] && (
                                                                        <div className="d-flex flex-column mb-2" style={{ maxWidth: '85%' }}>
                                                                            <div className="bg-white p-2 rounded shadow-sm small" style={{ borderRadius: '0px 10px 10px 10px' }}>
                                                                                <span className="fw-semibold text-success d-block mb-1" style={{ fontSize: '0.7rem' }}>🤖 Asesor IA:</span>
                                                                                <span className="text-dark" style={{ fontSize: '0.82rem', whiteSpace: 'pre-wrap' }}>
                                                                                    {formatWhatsappText(settings['ai.products.promotion.post.text'])}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}

                                                            {/* Default simple text message bubble fallback */}
                                                            {['business', 'order', 'billing', 'container', 'payment', 'custom'].includes(activeNode) && (
                                                                <div className="d-flex flex-column mb-2" style={{ maxWidth: '85%' }}>
                                                                    <div className="bg-white p-2 rounded shadow-sm small" style={{ borderRadius: '0px 10px 10px 10px' }}>
                                                                        <span className="fw-semibold text-success d-block mb-1" style={{ fontSize: '0.7rem' }}>🤖 Asesor IA:</span>
                                                                        <span className="text-dark" style={{ fontSize: '0.82rem', whiteSpace: 'pre-wrap' }}>
                                                                            {activeNode === 'business' && formatWhatsappText(`¡Hola! Mi nombre es *${settings['ai.agent.name']}*. Trabajo en *${settings['ai.business.description']}*.`)}
                                                                            {activeNode === 'order' && formatWhatsappText(settings['ai.order.collect.text'])}
                                                                            {activeNode === 'billing' && formatWhatsappText(settings['ai.collect.document.text'])}
                                                                            {activeNode === 'container' && formatWhatsappText(settings['ai.ask.container.text'])}
                                                                            {activeNode === 'payment' && formatWhatsappText(`Aceptamos los siguientes métodos de pago: *${settings['ai.payment.methods']}*.`)}
                                                                            {activeNode === 'custom' && formatWhatsappText(`*Directiva del sistema:* ${settings['ai.custom.instructions']}`)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Card.Body>
                                                    <Card.Footer className="bg-white py-3 border-0 border-top d-flex justify-content-end">
                                                        <Button 
                                                            variant="success" 
                                                            size="md" 
                                                            disabled={saving} 
                                                            onClick={handleSaveGeneral}
                                                            style={{ borderRadius: '6px' }}
                                                        >
                                                            {saving ? <Spinner size="sm" className="me-2" /> : <Icons.DeviceFloppy size={18} className="me-2" />}
                                                            Guardar este Bloque
                                                        </Button>
                                                    </Card.Footer>
                                                </Card>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        <div className="d-flex justify-content-end mt-4">
                            <Button variant="success" type="submit" size="lg" disabled={saving} style={{ borderRadius: '8px' }}>
                                {saving ? <Spinner size="sm" className="me-2" /> : <Icons.DeviceFloppy size={18} className="me-2" />}
                                Guardar Configuración de IA y Flujo
                            </Button>
                        </div>
                    </Form>
                </Tab>

                {/* PESTAÑA 3: CATÁLOGO DE PRODUCTOS IA */}
                <Tab eventKey="products" title={<span><Icons.Archive size={18} className="me-1" /> Catálogo de Venta</span>}>
                    <Card className="shadow-sm border-0" style={{ borderRadius: '12px' }}>
                        <Card.Header className="bg-light border-0 py-3 d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="mb-0 fw-bold">Productos Disponibles para el Agente</h5>
                                <p className="text-muted mb-0 small">Activa o desactiva qué productos puede vender la IA, configúralos o previsualiza cómo se enviarán en WhatsApp.</p>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-0" style={{ overflowX: 'auto' }}>
                            <Table responsive hover className="mb-0 align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{ width: '100px', textAlign: 'center' }}>Vende IA</th>
                                        <th>Código / Nombre</th>
                                        <th>Precio</th>
                                        <th>Configuración IA</th>
                                        <th style={{ width: '280px', textAlign: 'center' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productsConfig.map((prod, index) => (
                                        <tr key={prod.productoId}>
                                            <td className="text-center">
                                                <Form.Check
                                                    type="switch"
                                                    id={`prod-toggle-${prod.productoId}`}
                                                    checked={prod.aiEnabled}
                                                    onChange={() => handleProductToggle(index, prod.aiEnabled)}
                                                    style={{ fontSize: '1.2rem', cursor: 'pointer' }}
                                                />
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    {prod.productImage ? (
                                                        <img 
                                                            src={prod.productImage.startsWith('data:') ? prod.productImage : `${API_BASE}/api/productos/${prod.productoId}/imagen`} 
                                                            alt={prod.productName} 
                                                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                                                            onError={(e) => { e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>' }}
                                                        />
                                                    ) : (
                                                        <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', fontSize: '1.2rem' }}>📦</div>
                                                    )}
                                                    <div>
                                                        <span className="fw-semibold text-dark d-block">{prod.productName}</span>
                                                        <span className="text-muted small">{prod.productCode}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <Badge bg="success-subtle" className="text-success fs-7">S/ {prod.productPrice}</Badge>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-wrap gap-1 align-items-center">
                                                    {prod.intent && <Badge bg="primary-subtle" className="text-primary small">Intent: {prod.intent}</Badge>}
                                                    <Badge bg="secondary-subtle" className="text-secondary small">Prioridad: {prod.priority || 100}</Badge>
                                                    {prod.mediaIdWhatsapp ? (
                                                        <Badge bg="info-subtle" className="text-info small">Con Imagen (WhatsApp)</Badge>
                                                    ) : (
                                                        <Badge bg="light" className="text-muted small">Sólo Texto</Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <div className="d-flex justify-content-center gap-2">
                                                    <Button 
                                                        variant="outline-primary" 
                                                        size="sm" 
                                                        onClick={() => handleConfigureProduct(prod)}
                                                        className="d-inline-flex align-items-center gap-1"
                                                    >
                                                        <Icons.AdjustmentsHorizontal size={16} /> Configurar IA
                                                    </Button>
                                                    <Button 
                                                        variant="outline-success" 
                                                        size="sm" 
                                                        onClick={() => handlePreviewProduct(prod)}
                                                        className="d-inline-flex align-items-center gap-1"
                                                    >
                                                        <Icons.Eye size={16} /> Previsualizar
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>

                {/* PESTAÑA 4: COBERTURA DE ENVÍOS */}
                <Tab eventKey="shipping" title={<span><Icons.MapPin size={18} className="me-1" /> Zonas de Envío</span>}>
                    <Card className="shadow-sm border-0" style={{ borderRadius: '12px' }}>
                        <Card.Header className="bg-light border-0 py-3 d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="mb-0 fw-bold">Zonas de Cobertura de Despacho</h5>
                                <p className="text-muted mb-0 small">Controla qué distritos atiende la IA, costos de despacho y pedidos mínimos.</p>
                            </div>
                            <Button variant="primary" onClick={() => { setEditingCoverage(null); setShowCoverageModal(true); }}>
                                <Icons.Plus size={18} className="me-1" />
                                Agregar Zona
                            </Button>
                        </Card.Header>
                        <Card.Body className="p-0" style={{ overflowX: 'auto' }}>
                            <Table responsive hover className="mb-0 align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>Distrito / Zona</th>
                                        <th>Alias de Búsqueda (Separados por coma)</th>
                                        <th>Costo de Envío (Delivery)</th>
                                        <th>Compra Mínima</th>
                                        <th style={{ width: '150px', textAlign: 'center' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shippingCoverage.map((cov) => (
                                        <tr key={cov.id}>
                                            <td className="fw-semibold text-dark">{cov.districtName}</td>
                                            <td className="text-muted small">{cov.aliases || '-'}</td>
                                            <td>
                                                {parseFloat(cov.deliveryFee) === 0 ? (
                                                    <Badge bg="success-subtle" className="text-success fw-bold">GRATIS</Badge>
                                                ) : (
                                                    <span>S/ {cov.deliveryFee}</span>
                                                )}
                                            </td>
                                            <td>S/ {cov.minOrderAmount}</td>
                                            <td className="text-center">
                                                <div className="d-flex justify-content-center gap-2">
                                                    <Button 
                                                        variant="outline-primary" 
                                                        size="sm" 
                                                        onClick={() => handleConfigureCoverage(cov)}
                                                        className="btn-icon rounded-circle"
                                                    >
                                                        <Icons.Pencil size={16} />
                                                    </Button>
                                                    <Button 
                                                        variant="outline-danger" 
                                                        size="sm" 
                                                        onClick={() => handleDeleteCoverage(cov.id)}
                                                        className="btn-icon rounded-circle"
                                                    >
                                                        <Icons.Trash size={16} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {shippingCoverage.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="text-center text-muted py-4">No hay zonas de cobertura registradas. El Agente de IA asumirá que el despacho es general.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>

                {/* PESTAÑA 5: BASE DE CONOCIMIENTO (FAQs) */}
                <Tab eventKey="faq" title={<span><Icons.Book size={18} className="me-1" /> Base de Conocimiento (FAQs)</span>}>
                    <Card className="shadow-sm border-0" style={{ borderRadius: '12px' }}>
                        <Card.Header className="bg-light border-0 py-3 d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="mb-0 fw-bold">Preguntas Frecuentes y Recursos (PDF, Audios)</h5>
                                <p className="text-muted mb-0 small">Enseña al Agente IA cómo responder a dudas comunes de clientes y asócialas a recursos multimedia.</p>
                            </div>
                            <Button variant="primary" onClick={() => { setEditingFaq(null); setShowFaqModal(true); }}>
                                <Icons.Plus size={18} className="me-1" />
                                Agregar Pregunta (FAQ)
                            </Button>
                        </Card.Header>
                        <Card.Body className="p-0" style={{ overflowX: 'auto' }}>
                            <Table responsive hover className="mb-0 align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>Categoría</th>
                                        <th>Palabras Clave (Disparadores)</th>
                                        <th>Intención (Intent)</th>
                                        <th style={{ width: '90px' }}>Prioridad</th>
                                        <th>Respuesta de la IA</th>
                                        <th>Recurso / Multimedia</th>
                                        <th style={{ width: '150px', textAlign: 'center' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {knowledgeBase.map((faq) => (
                                        <tr key={faq.id}>
                                            <td>
                                                <Badge bg="primary-subtle" className="text-primary fw-semibold">{faq.category}</Badge>
                                            </td>
                                            <td style={{ maxWidth: '200px', wordBreak: 'break-all' }}>
                                                <span className="text-muted small">{faq.keywords}</span>
                                            </td>
                                            <td><Badge bg="secondary-subtle" className="text-secondary">{faq.intent || '-'}</Badge></td>
                                            <td>{faq.priority || 100}</td>
                                            <td style={{ minWidth: '250px', maxWidth: '350px' }}>
                                                <p className="mb-0 small text-dark text-truncate-2" style={{ whiteSpace: 'pre-wrap', maxHeight: '4.5em', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                                    {faq.answer}
                                                </p>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column gap-1">
                                                    {faq.attachmentType !== 'NONE' && (
                                                        <Badge bg="info-subtle" className="text-info d-inline-flex align-items-center gap-1 w-fit">
                                                            {faq.attachmentType === 'PDF' && <Icons.FileText size={12} />}
                                                            {faq.attachmentType === 'IMAGE' && <Icons.Photo size={12} />}
                                                            {faq.attachmentType === 'AUDIO' && <Icons.Volume size={12} />}
                                                            {faq.attachmentType}
                                                        </Badge>
                                                    )}
                                                    {faq.mediaIdWhatsapp ? (
                                                        <Badge bg="success-subtle" className="text-success d-inline-flex align-items-center gap-1 w-fit">
                                                            <Icons.DeviceMobile size={12} /> WhatsApp Media
                                                        </Badge>
                                                    ) : (
                                                        faq.attachmentType === 'NONE' && <span className="text-muted small">- Ninguno -</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <div className="d-flex justify-content-center gap-2">
                                                    <Button 
                                                        variant="outline-primary" 
                                                        size="sm" 
                                                        onClick={() => handleConfigureFaq(faq)}
                                                        className="btn-icon rounded-circle"
                                                    >
                                                        <Icons.Pencil size={16} />
                                                    </Button>
                                                    <Button 
                                                        variant="outline-danger" 
                                                        size="sm" 
                                                        onClick={() => handleDeleteFaq(faq.id)}
                                                        className="btn-icon rounded-circle"
                                                    >
                                                        <Icons.Trash size={16} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {knowledgeBase.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="text-center text-muted py-4">No hay FAQs configuradas. El Agente de IA usará el modelo general de respuestas.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>

                {/* PESTAÑA 6: LOGS DEL SISTEMA */}
                <Tab eventKey="logs" title={<span><Icons.FileText size={18} className="me-1" /> Logs del Sistema</span>}>
                    <Card className="shadow-sm border-0" style={{ borderRadius: '12px' }}>
                        <Card.Header className="bg-light border-0 py-3 d-flex justify-content-between align-items-center">
                            <span className="fw-bold">📋 Registros del Servidor (Logs)</span>
                            <div className="d-flex align-items-center gap-2">
                                <Form.Check 
                                    type="switch"
                                    id="auto-refresh-logs"
                                    label="Auto-refrescar (3s)"
                                    checked={logsAutoRefresh}
                                    onChange={(e) => setLogsAutoRefresh(e.target.checked)}
                                    className="me-2 small fw-semibold"
                                />
                                <Button 
                                    variant="outline-secondary" 
                                    size="sm" 
                                    onClick={handleCopyLogs}
                                    className="d-flex align-items-center gap-1"
                                >
                                    <Icons.Copy size={16} /> Copiar
                                </Button>
                                <Button 
                                    variant="success" 
                                    size="sm" 
                                    onClick={fetchLogs} 
                                    disabled={loadingLogs}
                                    className="d-flex align-items-center gap-1"
                                >
                                    {loadingLogs ? <Spinner size="sm" /> : <Icons.Refresh size={16} />} Refrescar
                                </Button>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-4">
                            <Row className="mb-3 g-2">
                                <Col md={8}>
                                    <Form.Group>
                                        <InputGroup>
                                            <InputGroup.Text className="bg-white border-end-0">
                                                <Icons.Search size={18} className="text-muted" />
                                            </InputGroup.Text>
                                            <Form.Control
                                                type="text"
                                                placeholder="Filtrar logs por texto (ej. ERROR, WhatsApp, etc.)..."
                                                value={logsFilter}
                                                onChange={(e) => setLogsFilter(e.target.value)}
                                                className="border-start-0"
                                            />
                                            {logsFilter && (
                                                <Button variant="outline-secondary" onClick={() => setLogsFilter('')}>
                                                    Limpiar
                                                </Button>
                                            )}
                                        </InputGroup>
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group className="d-flex align-items-center gap-2">
                                        <Form.Label className="mb-0 text-nowrap small fw-semibold">Líneas a mostrar:</Form.Label>
                                        <Form.Select 
                                            value={logLinesCount} 
                                            onChange={(e) => setLogLinesCount(parseInt(e.target.value))}
                                            size="sm"
                                        >
                                            <option value="50">50 líneas</option>
                                            <option value="100">100 líneas</option>
                                            <option value="200">200 líneas</option>
                                            <option value="500">500 líneas</option>
                                            <option value="1000">1000 líneas</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>

                            {/* Píldoras de Categorías */}
                            <div className="d-flex flex-wrap gap-2 mb-3">
                                <Button 
                                    variant={selectedCategory === 'ALL' ? 'primary' : 'outline-secondary'} 
                                    size="sm" 
                                    onClick={() => setSelectedCategory('ALL')}
                                    style={{ borderRadius: '20px', fontSize: '0.8rem' }}
                                >
                                    Todos ({logs.filter(line => line.toLowerCase().includes(logsFilter.toLowerCase())).length})
                                </Button>
                                <Button 
                                    variant={selectedCategory === 'ERROR' ? 'danger' : 'outline-danger'} 
                                    size="sm" 
                                    onClick={() => setSelectedCategory('ERROR')}
                                    style={{ borderRadius: '20px', fontSize: '0.8rem' }}
                                >
                                    🔴 Errores ({logs.filter(line => line.toLowerCase().includes(logsFilter.toLowerCase()) && filterByCategory(line, 'ERROR')).length})
                                </Button>
                                <Button 
                                    variant={selectedCategory === 'WARN' ? 'warning' : 'outline-warning'} 
                                    size="sm" 
                                    onClick={() => setSelectedCategory('WARN')}
                                    style={{ borderRadius: '20px', fontSize: '0.8rem' }}
                                >
                                    🟡 Advertencias ({logs.filter(line => line.toLowerCase().includes(logsFilter.toLowerCase()) && filterByCategory(line, 'WARN')).length})
                                </Button>
                                <Button 
                                    variant={selectedCategory === 'DATABASE' ? 'info' : 'outline-info'} 
                                    size="sm" 
                                    onClick={() => setSelectedCategory('DATABASE')}
                                    style={{ borderRadius: '20px', fontSize: '0.8rem' }}
                                >
                                    💾 Base de Datos ({logs.filter(line => line.toLowerCase().includes(logsFilter.toLowerCase()) && filterByCategory(line, 'DATABASE')).length})
                                </Button>
                                <Button 
                                    variant={selectedCategory === 'INTEGRATIONS' ? 'success' : 'outline-success'} 
                                    size="sm" 
                                    onClick={() => setSelectedCategory('INTEGRATIONS')}
                                    style={{ borderRadius: '20px', fontSize: '0.8rem' }}
                                >
                                    💬 WhatsApp & IA ({logs.filter(line => line.toLowerCase().includes(logsFilter.toLowerCase()) && filterByCategory(line, 'INTEGRATIONS')).length})
                                </Button>
                                <Button 
                                    variant={selectedCategory === 'SECURITY' ? 'dark' : 'outline-dark'} 
                                    size="sm" 
                                    onClick={() => setSelectedCategory('SECURITY')}
                                    style={{ borderRadius: '20px', fontSize: '0.8rem' }}
                                >
                                    🔒 Seguridad ({logs.filter(line => line.toLowerCase().includes(logsFilter.toLowerCase()) && filterByCategory(line, 'SECURITY')).length})
                                </Button>
                            </div>

                            <div 
                                style={{ 
                                    backgroundColor: '#0f172a', 
                                    borderRadius: '8px', 
                                    padding: '16px', 
                                    maxHeight: '550px', 
                                    overflowY: 'auto', 
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)'
                                }}
                            >
                                {logs.filter(line => line.toLowerCase().includes(logsFilter.toLowerCase()) && filterByCategory(line, selectedCategory)).length > 0 ? (
                                    logs.filter(line => line.toLowerCase().includes(logsFilter.toLowerCase()) && filterByCategory(line, selectedCategory)).map((line, idx) => (
                                        <div 
                                            key={idx} 
                                            style={{ 
                                                color: getLogLineColor(line), 
                                                whiteSpace: 'pre-wrap', 
                                                wordBreak: 'break-all', 
                                                fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace', 
                                                fontSize: '0.82rem', 
                                                marginBottom: '4px',
                                                borderBottom: '1px solid rgba(255,255,255,0.03)',
                                                paddingBottom: '2px'
                                            }}
                                        >
                                            {line}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-muted py-5">
                                        {logs.length === 0 ? 'Cargando logs del servidor o archivo no disponible...' : 'No hay líneas de log que coincidan con el filtro seleccionado.'}
                                    </div>
                                )}
                                <div ref={logEndRef} />
                            </div>
                            <div className="d-flex justify-content-between align-items-center mt-2">
                                <span className="small text-muted">
                                    Mostrando {logs.filter(line => line.toLowerCase().includes(logsFilter.toLowerCase()) && filterByCategory(line, selectedCategory)).length} de {logs.length} líneas de log disponibles.
                                </span>
                                <span className="small text-muted">
                                    Ubicación en contenedor: <code>/app/logs/nextlead.log</code>
                                </span>
                            </div>
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>

            {/* MODAL CONFIGURACION PRODUCTO IA */}
            {editingProduct && (
                <Modal show={showProductModal} onHide={() => setShowProductModal(false)} size="lg" centered>
                    <Modal.Header closeButton>
                        <Modal.Title className="fw-bold fs-5">🤖 Configuración de IA para: {editingProduct.productName}</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleSaveProductModal}>
                        <Modal.Body>
                            <Row className="g-3 mb-3">
                                <Col md={6}>
                                    <Form.Group controlId="prodIntent">
                                        <Form.Label className="small fw-semibold">Intención Asociada (Intent)</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editingProduct.intent}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, intent: e.target.value })}
                                            placeholder="Ej: promocion, catalogo, agua_alcalina"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group controlId="prodPriority">
                                        <Form.Label className="small fw-semibold">Prioridad de Despliegue</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={editingProduct.priority}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, priority: parseInt(e.target.value) || 100 })}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-3" controlId="prodKeywords">
                                <Form.Label className="small fw-semibold">Palabras Clave (Separadas por comas)</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={editingProduct.searchKeywords}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, searchKeywords: e.target.value })}
                                    placeholder="Ej: bidon, recarga, 20 litros, agua alcalina"
                                />
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="prodCustomDesc">
                                <Form.Label className="small fw-semibold">Descripción del Producto para la IA</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={editingProduct.customAiDescription}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, customAiDescription: e.target.value })}
                                    placeholder="Escribe detalles específicos que la IA deba conocer al vender este producto..."
                                />
                            </Form.Group>

                            <hr />
                            <h6 className="fw-bold mb-3 text-secondary">🔗 Recursos Multimedia de WhatsApp Cloud API</h6>

                            <Row className="g-3">
                                <Col md={6}>
                                    <Form.Group controlId="prodMediaId">
                                        <Form.Label className="small fw-semibold">WhatsApp Media ID (Imagen / Archivo)</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editingProduct.mediaIdWhatsapp}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, mediaIdWhatsapp: e.target.value })}
                                            placeholder="Ej: 1234567890123456"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group controlId="prodCaption">
                                        <Form.Label className="small fw-semibold">Pie de Foto (Caption)</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editingProduct.imageCaption}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, imageCaption: e.target.value })}
                                            placeholder="Ej: Bidón de 20L - S/ 15.00"
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowProductModal(false)}>Cancelar</Button>
                            <Button variant="success" type="submit" disabled={saving}>
                                {saving ? <Spinner size="sm" className="me-2" /> : <Icons.DeviceFloppy size={18} className="me-2" />}
                                Guardar Cambios
                            </Button>
                        </Modal.Footer>
                    </Form>
                </Modal>
            )}

            {/* MODAL PREVISUALIZACION WHATSAPP */}
            {previewProduct && (
                <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} centered size="md">
                    <Modal.Header closeButton className="p-3 border-0 bg-success text-white" style={{ background: '#075e54' }}>
                        <div className="d-flex align-items-center gap-2">
                            <div className="bg-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px', fontSize: '1.2rem' }}>🤖</div>
                            <div>
                                <h6 className="mb-0 text-white fw-bold">{settings['ai.agent.name'] || 'Asesor IA'}</h6>
                                <span className="text-white-50 small">en línea</span>
                            </div>
                        </div>
                    </Modal.Header>
                    <Modal.Body className="p-3" style={{ background: '#efeae2', backgroundImage: 'radial-gradient(#dfdcd6 10%, transparent 11%)', backgroundSize: '15px 15px', minHeight: '380px' }}>
                        <div className="d-flex flex-column gap-3 mb-2">
                            {previewProduct.productImage || previewProduct.mediaIdWhatsapp ? (
                                <div className="align-self-start bg-white p-1 shadow-sm rounded-3" style={{ maxWidth: '85%', minWidth: '220px', borderRadius: '7px' }}>
                                    <div className="position-relative overflow-hidden rounded-2 mb-1" style={{ maxHeight: '200px', backgroundColor: '#e9ecef', display: 'flex', justifyContent: 'center' }}>
                                        <img 
                                            src={previewProduct.productImage && (previewProduct.productImage.startsWith('data:') || previewProduct.productImage.startsWith('http')) ? previewProduct.productImage : `${API_BASE}/api/productos/${previewProduct.productoId}/imagen`} 
                                            alt={previewProduct.productName} 
                                            style={{ width: '100%', height: 'auto', objectFit: 'contain', maxHeight: '200px' }}
                                            onError={(e) => { e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>' }}
                                        />
                                        <div className="position-absolute top-0 start-0 m-2">
                                            {previewProduct.mediaIdWhatsapp ? (
                                                <Badge bg="success" className="shadow-sm">Media ID: {previewProduct.mediaIdWhatsapp}</Badge>
                                            ) : (
                                                <Badge bg="warning" className="shadow-sm text-dark">Foto del Catálogo</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="px-2 py-1 position-relative">
                                        <div className="text-dark me-5" style={{ fontSize: '0.9rem', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                                            {formatWhatsappText(previewProduct.imageCaption || `*${previewProduct.productName}*\n💵 *Precio:* S/ ${previewProduct.productPrice}\n\n${previewProduct.customAiDescription || ''}`)}
                                        </div>
                                        <div className="text-muted d-flex align-items-center justify-content-end gap-1 position-absolute bottom-0 end-0 pe-2 pb-1" style={{ fontSize: '0.7rem' }}>
                                            <span>12:00</span>
                                            <span style={{ color: '#53bdeb' }}>✔✔</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="align-self-start bg-white px-3 py-2 shadow-sm rounded-3 position-relative" style={{ maxWidth: '85%', minWidth: '180px', borderRadius: '7px' }}>
                                    <div className="text-dark mb-2 me-4" style={{ fontSize: '0.9rem', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                                        {formatWhatsappText(`*${previewProduct.productName}*\n💵 *Precio:* S/ ${previewProduct.productPrice}\n\n${previewProduct.customAiDescription || '_Sin descripción personalizada de IA._'}\n\n🚚 *Delivery:* ¡Gratis en zonas de cobertura!`)}
                                    </div>
                                    <div className="text-muted d-flex align-items-center justify-content-end gap-1 position-absolute bottom-0 end-0 pe-2 pb-1" style={{ fontSize: '0.7rem' }}>
                                        <span>12:00</span>
                                        <span style={{ color: '#53bdeb' }}>✔✔</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Modal.Body>
                </Modal>
            )}

            {/* MODAL CONFIGURACION COBERTURA */}
            {showCoverageModal && (
                <Modal show={showCoverageModal} onHide={() => { setShowCoverageModal(false); setEditingCoverage(null); }} size="md" centered>
                    <Modal.Header closeButton>
                        <Modal.Title className="fw-bold fs-5">{editingCoverage ? 'Editar Zona de Cobertura' : 'Agregar Nueva Zona'}</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleSaveCoverage}>
                        <Modal.Body>
                            <Form.Group className="mb-3" controlId="covDistrict">
                                <Form.Label className="small fw-semibold">Nombre del Distrito / Zona</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={editingCoverage ? editingCoverage.districtName : newCoverage.districtName}
                                    onChange={(e) => {
                                        if (editingCoverage) setEditingCoverage({ ...editingCoverage, districtName: e.target.value });
                                        else setNewCoverage({ ...newCoverage, districtName: e.target.value });
                                    }}
                                    placeholder="Ej. Santiago de Surco"
                                    required
                                />
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="covAliases">
                                <Form.Label className="small fw-semibold">Alias (Separados por coma)</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={editingCoverage ? (editingCoverage.aliases || '') : (newCoverage.aliases || '')}
                                    onChange={(e) => {
                                        if (editingCoverage) setEditingCoverage({ ...editingCoverage, aliases: e.target.value });
                                        else setNewCoverage({ ...newCoverage, aliases: e.target.value });
                                    }}
                                    placeholder="Ej. surco, santiago surco, monterrico"
                                />
                            </Form.Group>

                            <Row className="g-3">
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="covFee">
                                        <Form.Label className="small fw-semibold">Costo de Delivery</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={editingCoverage ? editingCoverage.deliveryFee : newCoverage.deliveryFee}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                if (editingCoverage) setEditingCoverage({ ...editingCoverage, deliveryFee: val });
                                                else setNewCoverage({ ...newCoverage, deliveryFee: val });
                                            }}
                                            min="0"
                                            step="0.1"
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="covMin">
                                        <Form.Label className="small fw-semibold">Pedido Mínimo</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={editingCoverage ? editingCoverage.minOrderAmount : newCoverage.minOrderAmount}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                if (editingCoverage) setEditingCoverage({ ...editingCoverage, minOrderAmount: val });
                                                else setNewCoverage({ ...newCoverage, minOrderAmount: val });
                                            }}
                                            min="0"
                                            step="0.1"
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => { setShowCoverageModal(false); setEditingCoverage(null); }}>Cancelar</Button>
                            <Button variant="success" type="submit">Guardar Zona</Button>
                        </Modal.Footer>
                    </Form>
                </Modal>
            )}

            {/* MODAL CONFIGURACION FAQ */}
            {showFaqModal && (
                <Modal show={showFaqModal} onHide={() => { setShowFaqModal(false); setEditingFaq(null); }} size="lg" centered>
                    <Modal.Header closeButton>
                        <Modal.Title className="fw-bold fs-5">{editingFaq ? 'Editar FAQ' : 'Agregar Nueva FAQ'}</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleSaveFaq}>
                        <Modal.Body>
                            <Row className="g-3 mb-3">
                                <Col md={6}>
                                    <Form.Group controlId="faqCategory">
                                        <Form.Label className="small fw-semibold">Categoría</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editingFaq ? editingFaq.category : newFaq.category}
                                            onChange={(e) => {
                                                if (editingFaq) setEditingFaq({ ...editingFaq, category: e.target.value });
                                                else setNewFaq({ ...newFaq, category: e.target.value });
                                            }}
                                            placeholder="Ej. Horarios, Bidones, Envases"
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group controlId="faqKeywords">
                                        <Form.Label className="small fw-semibold">Palabras Clave (Disparadores separados por coma)</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editingFaq ? editingFaq.keywords : newFaq.keywords}
                                            onChange={(e) => {
                                                if (editingFaq) setEditingFaq({ ...editingFaq, keywords: e.target.value });
                                                else setNewFaq({ ...newFaq, keywords: e.target.value });
                                            }}
                                            placeholder="Ej. horario, atienden, atencion, sabado"
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-3" controlId="faqAnswer">
                                <Form.Label className="small fw-semibold">Respuesta de la IA</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={4}
                                    value={editingFaq ? editingFaq.answer : newFaq.answer}
                                    onChange={(e) => {
                                        if (editingFaq) setEditingFaq({ ...editingFaq, answer: e.target.value });
                                        else setNewFaq({ ...newFaq, answer: e.target.value });
                                    }}
                                    placeholder="Escribe la respuesta exacta..."
                                    required
                                />
                            </Form.Group>

                            <Row className="g-3 mb-3">
                                <Col md={6}>
                                    <Form.Group controlId="faqIntent">
                                        <Form.Label className="small fw-semibold">Intención (Intent)</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editingFaq ? (editingFaq.intent || '') : (newFaq.intent || '')}
                                            onChange={(e) => {
                                                if (editingFaq) setEditingFaq({ ...editingFaq, intent: e.target.value });
                                                else setNewFaq({ ...newFaq, intent: e.target.value });
                                            }}
                                            placeholder="Ej: promocion, delivery"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group controlId="faqPriority">
                                        <Form.Label className="small fw-semibold">Prioridad</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={editingFaq ? (editingFaq.priority || 100) : (newFaq.priority || 100)}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value) || 100;
                                                if (editingFaq) setEditingFaq({ ...editingFaq, priority: val });
                                                else setNewFaq({ ...newFaq, priority: val });
                                            }}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row className="g-3 mb-3">
                                <Col md={6}>
                                    <Form.Group controlId="faqMediaId">
                                        <Form.Label className="small fw-semibold">Media ID (WhatsApp Cloud API)</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editingFaq ? (editingFaq.mediaIdWhatsapp || '') : (newFaq.mediaIdWhatsapp || '')}
                                            onChange={(e) => {
                                                if (editingFaq) setEditingFaq({ ...editingFaq, mediaIdWhatsapp: e.target.value });
                                                else setNewFaq({ ...newFaq, mediaIdWhatsapp: e.target.value });
                                            }}
                                            placeholder="ID de multimedia en Meta..."
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group controlId="faqMediaCaption">
                                        <Form.Label className="small fw-semibold">Subtítulo del Media (Caption)</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editingFaq ? (editingFaq.mediaCaption || '') : (newFaq.mediaCaption || '')}
                                            onChange={(e) => {
                                                if (editingFaq) setEditingFaq({ ...editingFaq, mediaCaption: e.target.value });
                                                else setNewFaq({ ...newFaq, mediaCaption: e.target.value });
                                            }}
                                            placeholder="Subtítulo que acompañará a la imagen..."
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row className="g-3">
                                <Col md={4}>
                                    <Form.Group className="mb-3" controlId="faqAttachType">
                                        <Form.Label className="small fw-semibold">Tipo de Recurso Adjunto (Legacy)</Form.Label>
                                        <Form.Select
                                            value={editingFaq ? editingFaq.attachmentType : newFaq.attachmentType}
                                            onChange={(e) => {
                                                if (editingFaq) setEditingFaq({ ...editingFaq, attachmentType: e.target.value });
                                                else setNewFaq({ ...newFaq, attachmentType: e.target.value });
                                            }}
                                        >
                                            <option value="NONE">Ninguno</option>
                                            <option value="IMAGE">Imagen</option>
                                            <option value="PDF">PDF</option>
                                            <option value="AUDIO">Audio</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={8}>
                                    <Form.Group className="mb-3" controlId="faqAttachUrl">
                                        <Form.Label className="small fw-semibold">URL del Archivo / Enlace de descarga (Legacy)</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editingFaq ? (editingFaq.attachmentUrl || '') : (newFaq.attachmentUrl || '')}
                                            onChange={(e) => {
                                                if (editingFaq) setEditingFaq({ ...editingFaq, attachmentUrl: e.target.value });
                                                else setNewFaq({ ...newFaq, attachmentUrl: e.target.value });
                                            }}
                                            placeholder="Ej: http://localhost:8080/uploads/catalogo.pdf"
                                            disabled={editingFaq ? editingFaq.attachmentType === 'NONE' : newFaq.attachmentType === 'NONE'}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => { setShowFaqModal(false); setEditingFaq(null); }}>Cancelar</Button>
                            <Button variant="success" type="submit">{editingFaq ? 'Guardar Cambios' : 'Agregar FAQ'}</Button>
                        </Modal.Footer>
                    </Form>
                </Modal>
            )}
        </Container>
    );
}
