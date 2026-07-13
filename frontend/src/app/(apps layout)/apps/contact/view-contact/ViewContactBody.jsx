'use client';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Row, Col, Card, Badge, Spinner, Alert, Button, Form, Modal, Nav, Table } from 'react-bootstrap';
import { Mail, Phone, Calendar, Hash, Edit, Check, X, Plus, Trash, Eye, Search, MapPin, Link as LinkIcon } from 'react-feather';
import Link from 'next/link';
import InteractiveMap from '../InteractiveMap';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8081';

const parseMessageMedia = (msgText, API_BASE) => {
    let images = [];
    let audios = [];
    let videos = [];
    let displayText = msgText || '';

    if (!msgText) return { images, audios, videos, displayText };

    // Formato heredado: [IMAGE]/path, [AUDIO]/path, [VIDEO]/path
    if (msgText.startsWith('[IMAGE]')) {
        const paths = msgText.substring(7).split(',');
        paths.forEach(p => {
            let clean = p.trim();
            if (clean.includes(':8080/')) clean = clean.replace(':8080/', ':8081/');
            images.push(clean.startsWith('http') ? clean : `${API_BASE}${clean}`);
        });
        return { images, audios, videos, displayText: '' };
    }
    if (msgText.startsWith('[AUDIO]')) {
        const paths = msgText.substring(7).split(',');
        paths.forEach(p => {
            let clean = p.trim();
            if (clean.includes(':8080/')) clean = clean.replace(':8080/', ':8081/');
            audios.push(clean.startsWith('http') ? clean : `${API_BASE}${clean}`);
        });
        return { images, audios, videos, displayText: '' };
    }
    if (msgText.startsWith('[VIDEO]')) {
        const paths = msgText.substring(7).split(',');
        paths.forEach(p => {
            let clean = p.trim();
            if (clean.includes(':8080/')) clean = clean.replace(':8080/', ':8081/');
            videos.push(clean.startsWith('http') ? clean : `${API_BASE}${clean}`);
        });
        return { images, audios, videos, displayText: '' };
    }

    // Formato estructurado: [MEDIA:tipo] id=... url=...
    const mediaTagRegex = /\[MEDIA:(image|audio|video)\]/i;
    const match = msgText.match(mediaTagRegex);
    if (match) {
        const type = match[1].toLowerCase();
        const tagIndex = msgText.indexOf(match[0]);
        const textBefore = msgText.substring(0, tagIndex).trim();
        const textAfter = msgText.substring(tagIndex + match[0].length).trim();

        let idsStr = '';
        let urlsStr = '';

        const idIndex = textAfter.indexOf('id=');
        const urlIndex = textAfter.indexOf('url=');

        if (idIndex !== -1 && urlIndex !== -1) {
            if (idIndex < urlIndex) {
                idsStr = textAfter.substring(idIndex + 3, urlIndex).trim();
                urlsStr = textAfter.substring(urlIndex + 4).trim();
            } else {
                urlsStr = textAfter.substring(urlIndex + 4, idIndex).trim();
                idsStr = textAfter.substring(idIndex + 3).trim();
            }
        } else if (idIndex !== -1) {
            idsStr = textAfter.substring(idIndex + 3).trim();
        } else if (urlIndex !== -1) {
            urlsStr = textAfter.substring(urlIndex + 4).trim();
        }

        // Si id empieza con http (como pasa con la promo), tratarlo como url
        if (idsStr.startsWith('http')) {
            if (!urlsStr) {
                urlsStr = idsStr;
                idsStr = '';
            }
        }

        displayText = textBefore;

        if (urlsStr) {
            const urls = urlsStr.split(',');
            urls.forEach(u => {
                let clean = u.trim();
                if (clean.includes(':8080/')) clean = clean.replace(':8080/', ':8081/');
                if (clean) {
                    const finalUrl = clean.startsWith('http') ? clean : `${API_BASE}${clean}`;
                    if (type === 'image') images.push(finalUrl);
                    else if (type === 'audio') audios.push(finalUrl);
                    else if (type === 'video') videos.push(finalUrl);
                }
            });
        }

        if (idsStr) {
            const ids = idsStr.split(',');
            ids.forEach(idVal => {
                const idClean = idVal.trim();
                if (!idClean) return;
                if (/^\d+$/.test(idClean)) {
                    const finalUrl = `${API_BASE}/api/productos/${idClean}/imagen`;
                    if (type === 'image') images.push(finalUrl);
                    else if (type === 'audio') audios.push(finalUrl);
                    else if (type === 'video') videos.push(finalUrl);
                }
            });
        }
    }
    console.log("Parsed media in ViewContactBody:", { images, audios, videos, displayText, rawText: msgText });
    return { images, audios, videos, displayText };
};

const ViewContactBody = ({ setContactName }) => {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    const [contact, setContact] = useState(null);
    const [direcciones, setDirecciones] = useState([]);
    const [linkedPersonas, setLinkedPersonas] = useState([]);
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingPersonas, setLoadingPersonas] = useState(false);
    const [loadingPedidos, setLoadingPedidos] = useState(false);
    const [selectedDir, setSelectedDir] = useState(null);
    const [error, setError] = useState(null);

    // Active Tab State
    const [activeTab, setActiveTab] = useState('Ubicaciones'); // 'Pedidos' | 'Oportunidades' | 'Envases' | 'Ubicaciones' | 'Personal'
    const [rightTab, setRightTab] = useState('WhatsApp'); // 'WhatsApp' | 'Notas'

    // Helper to clean phone numbers to digits only
    const cleanPhoneNumber = (phone) => {
        if (!phone) return '';
        return phone.replace(/\D/g, '');
    };

    // WhatsApp Chat State
    const [wspMessages, setWspMessages] = useState([]);
    const [wspInput, setWspInput] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const chatEndRef = useRef(null);

    // Auto-scroll to bottom of chat
    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [wspMessages]);

    // Load WhatsApp conversation history when contact loads
    useEffect(() => {
        if (!contact || !contact.telefonoPrincipal) return;
        const phone = cleanPhoneNumber(contact.telefonoPrincipal);
        const contactLast9 = phone.length >= 9 ? phone.substring(phone.length - 9) : phone;
        
        const fetchConversation = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/messages/conversation/${phone}`);
                if (res.ok) {
                    const data = await res.json();
                    const formatted = data.map(msg => {
                        const msgSenderLast9 = msg.sender.length >= 9 ? msg.sender.substring(msg.sender.length - 9) : msg.sender;
                        return {
                            id: msg.id,
                            wamid: msg.wamid,
                            sender: msgSenderLast9 === contactLast9 ? 'contact' : 'me',
                            text: msg.messageText,
                            time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            status: msg.status
                        };
                    });
                    setWspMessages(formatted);
                }
            } catch (err) {
                console.error("Error cargando historial de WhatsApp:", err);
            }
        };

        fetchConversation();
    }, [contact]);

    // WebSocket real-time subscription for WhatsApp messages
    useEffect(() => {
        if (!contact || !contact.telefonoPrincipal) return;
        const phone = cleanPhoneNumber(contact.telefonoPrincipal);
        const last9 = phone.length >= 9 ? phone.substring(phone.length - 9) : phone;

        // Dynamic SSR-safe require of SockJS and STOMP
        let stompClient = null;
        try {
            const SockJS = require('sockjs-client');
            const { Client } = require('@stomp/stompjs');

            stompClient = new Client({
                webSocketFactory: () => new SockJS(`${API_BASE}/ws-message`),
                debug: (str) => {
                    console.log('STOMP Debug:', str);
                },
                reconnectDelay: 5000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
            });

            stompClient.onConnect = (frame) => {
                console.log('WebSocket de WhatsApp conectado para el teléfono (últimos 9 dígitos):', last9);
                stompClient.subscribe(`/topic/chat/${last9}`, (message) => {
                    try {
                        const body = JSON.parse(message.body);
                        const timeStr = new Date(body.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        
                        setWspMessages(prev => {
                            // 1. Si el mensaje ya existe (por id o wamid), actualizamos su estado
                            const index = prev.findIndex(m => (body.id && m.id === body.id) || (body.wamid && m.wamid === body.wamid));
                            if (index !== -1) {
                                const updated = [...prev];
                                updated[index] = {
                                    ...updated[index],
                                    id: body.id,
                                    wamid: body.wamid,
                                    status: body.status
                                };
                                return updated;
                            }

                            // 2. Si no coincide por id/wamid, ver si coincide con un mensaje enviado localmente (optimista)
                            const bodySenderLast9 = body.sender.length >= 9 ? body.sender.substring(body.sender.length - 9) : body.sender;
                            const isMe = bodySenderLast9 !== last9;
                            
                            if (isMe) {
                                // Buscar el último mensaje optimista enviado por "me" que no tenga wamid ni id y coincida en texto
                                const optIndex = [...prev].reverse().findIndex(m => m.sender === 'me' && !m.wamid && !m.id && m.text === body.messageText);
                                if (optIndex !== -1) {
                                    const realIndex = prev.length - 1 - optIndex;
                                    const updated = [...prev];
                                    updated[realIndex] = {
                                        ...updated[realIndex],
                                        id: body.id,
                                        wamid: body.wamid,
                                        status: body.status
                                    };
                                    return updated;
                                }
                            }

                            // 3. De lo contrario, agregar el mensaje como nuevo
                            const newMsg = {
                                id: body.id,
                                wamid: body.wamid,
                                sender: isMe ? 'me' : 'contact',
                                text: body.messageText,
                                time: timeStr,
                                status: body.status
                            };

                            // Evitar duplicación de mensajes idénticos al final
                            if (prev.length > 0) {
                                const last = prev[prev.length - 1];
                                if (last.text === newMsg.text && last.sender === newMsg.sender && !newMsg.wamid && !newMsg.id) {
                                    return prev;
                                }
                            }
                            return [...prev, newMsg];
                        });
                    } catch (e) {
                        console.error("Error al procesar mensaje de WebSocket:", e);
                    }
                });
            };

            stompClient.onStompError = (frame) => {
                console.error('Error del broker STOMP:', frame.headers['message'], frame.body);
            };

            stompClient.activate();
        } catch (e) {
            console.error("Error configurando WebSocket client:", e);
        }

        return () => {
            if (stompClient) {
                stompClient.deactivate();
                console.log('WebSocket de WhatsApp desactivado para el teléfono (últimos 9 dígitos):', last9);
            }
        };
    }, [contact]);

    const handleToggleAI = async () => {
        if (!contact || !contact.id) return;
        try {
            const res = await fetch(`${API_BASE}/api/contacts/${contact.id}/toggle-ai`, {
                method: 'PUT'
            });
            if (res.ok) {
                const data = await res.json();
                setContact(prev => ({
                    ...prev,
                    aiActive: data.aiActive
                }));
            }
        } catch (err) {
            console.error("Error toggling AI response:", err);
        }
    };

    const sendWspMessage = async () => {
        if (!wspInput.trim() || !contact || !contact.telefonoPrincipal) return;
        
        const phone = cleanPhoneNumber(contact.telefonoPrincipal);
        const textToSend = wspInput;
        setWspInput('');

        // Agregar optimísticamente al chat local
        const newMsg = {
            sender: 'me',
            text: textToSend,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setWspMessages(prev => [...prev, newMsg]);

        try {
            const res = await fetch(`${API_BASE}/api/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sender: 'system', // Remitente por defecto
                    receiver: phone,
                    messageText: textToSend
                })
            });

            if (!res.ok) {
                console.error("Error enviando mensaje al backend");
            }
        } catch (err) {
            console.error("Error de red enviando mensaje:", err);
        }
    };

    const handleSendFile = async (e) => {
        const file = e.target.files[0];
        if (!file || !contact || !contact.telefonoPrincipal) return;

        const phone = cleanPhoneNumber(contact.telefonoPrincipal);
        
        // 1. Subir el archivo al servidor local CRM
        const formData = new FormData();
        formData.append("file", file);

        try {
            const uploadRes = await fetch(`${API_BASE}/api/messages/upload`, {
                method: "POST",
                body: formData
            });

            if (uploadRes.ok) {
                const data = await uploadRes.json();
                const localUrl = data.url; // "/uploads/filename.ext"

                // Determinar el tipo de prefijo a enviar
                let prefix = '[FILE]';
                const fileType = file.type;
                if (fileType.startsWith('image/')) {
                    prefix = '[IMAGE]';
                } else if (fileType.startsWith('audio/')) {
                    prefix = '[AUDIO]';
                } else if (fileType.startsWith('video/')) {
                    prefix = '[VIDEO]';
                } else if (fileType === 'application/pdf') {
                    prefix = '[PDF]';
                }

                // 2. Enviar el mensaje estructurado
                const textToSend = `${prefix}${localUrl}`;

                // Agregar optimísticamente al chat local
                const newMsg = {
                    sender: 'me',
                    text: textToSend,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setWspMessages(prev => [...prev, newMsg]);

                // Llamar al endpoint del backend para mandar y persistir
                const res = await fetch(`${API_BASE}/api/messages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        sender: 'system',
                        receiver: phone,
                        messageText: textToSend
                    })
                });

                if (!res.ok) {
                    console.error("Error enviando archivo al backend");
                }
            } else {
                console.error("Error al subir archivo al servidor local");
            }
        } catch (err) {
            console.error("Error de red al subir/enviar archivo:", err);
        }
    };

    // Block Edit States
    const [editingIdentidad, setEditingIdentidad] = useState(false);
    const [draftIdentidad, setDraftIdentidad] = useState({});
    const [identidadError, setIdentidadError] = useState(null);

    const [editingComunicacion, setEditingComunicacion] = useState(false);
    const [draftComunicacion, setDraftComunicacion] = useState({});
    const [comunicacionError, setComunicacionError] = useState(null);

    const [editingNotas, setEditingNotas] = useState(false);
    const [draftNotas, setDraftNotas] = useState('');
    const [notasError, setNotasError] = useState(null);

    const [editingUbicaciones, setEditingUbicaciones] = useState(false);
    const [draftDirecciones, setDraftDirecciones] = useState([]);
    const [selectedDirIndex, setSelectedDirIndex] = useState(0);
    const [ubigeos, setUbigeos] = useState([]);
    const [ubicacionesError, setUbicacionesError] = useState(null);
    const [geocodingUbicacion, setGeocodingUbicacion] = useState(false);

    const handleGeocodeUbicacion = async () => {
        if (!activeDraftDir?.direccionCompleta?.trim()) {
            alert("Por favor ingresa una dirección escrita para buscar.");
            return;
        }
        setGeocodingUbicacion(true);
        try {
            const queryParts = [activeDraftDir.direccionCompleta];
            if (activeDraftDir.distrito) queryParts.push(activeDraftDir.distrito);
            if (activeDraftDir.provincia) queryParts.push(activeDraftDir.provincia);
            if (activeDraftDir.departamento) queryParts.push(activeDraftDir.departamento);
            queryParts.push("Peru");
            
            const q = encodeURIComponent(queryParts.join(", "));
            const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, {
                headers: { 'User-Agent': 'NextLead-CRM-Peru' }
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) {
                    handleDraftDirChange({ latitud: parseFloat(data[0].lat), longitud: parseFloat(data[0].lon) });
                } else {
                    alert("No se encontraron coordenadas para la dirección especificada.");
                }
            } else {
                alert("Error al conectar con el servicio de geocodificación.");
            }
        } catch (err) {
            console.error(err);
            alert("Error al buscar la dirección.");
        } finally {
            setGeocodingUbicacion(false);
        }
    };

    const handleLocateCurrentUbicacion = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    handleDraftDirChange({ latitud: pos.coords.latitude, longitud: pos.coords.longitude });
                },
                (err) => {
                    alert("No se pudo obtener la ubicación GPS actual: " + err.message);
                }
            );
        } else {
            alert("Tu navegador no soporta geolocalización.");
        }
    };

    const handlePasteLinkUbicacion = async () => {
        const url = prompt("Pega el enlace de Google Maps:");
        if (!url) return;
        try {
            const res = await fetch(`${API_BASE}/api/contacts/resolve-maps-url?url=${encodeURIComponent(url)}`);
            if (res.ok) {
                const data = await res.json();
                handleDraftDirChange({ latitud: data.lat, longitud: data.lng });
            } else {
                const txt = await res.text();
                alert("Error: " + (txt || "No se pudo extraer coordenadas del link de Google Maps. Asegúrate de que sea un link válido."));
            }
        } catch (err) {
            console.error(err);
            alert("Error de conexión al resolver el link.");
        }
    };

    // Modal "+ Agregar Persona" States
    const [showAddPersonModal, setShowAddPersonModal] = useState(false);
    const [personModalTab, setPersonModalTab] = useState('link'); // 'link' | 'create'
    const [availablePeople, setAvailablePeople] = useState([]);
    const [selectedPersonId, setSelectedPersonId] = useState('');
    const [personModalError, setPersonModalError] = useState(null);
    const [personModalSaving, setPersonModalSaving] = useState(false);

    // New Person Form States
    const [newPersonNombres, setNewPersonNombres] = useState('');
    const [newPersonApellidos, setNewPersonApellidos] = useState('');
    const [newPersonTipoDoc, setNewPersonTipoDoc] = useState('DNI');
    const [newPersonNumDoc, setNewPersonNumDoc] = useState('');
    const [newPersonCelular, setNewPersonCelular] = useState('');
    const [newPersonEmail, setNewPersonEmail] = useState('');

    // Load data
    useEffect(() => {
        if (!id) {
            setError("No se especificó un ID de contacto.");
            setLoading(false);
            return;
        }

        const fetchContactDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                const rContact = await fetch(`${API_BASE}/api/contacts/${id}`);
                if (!rContact.ok) {
                    setError("No se pudo encontrar el contacto especificado.");
                    setLoading(false);
                    return;
                }
                const cData = await rContact.json();
                setContact(cData);

                if (setContactName) {
                    const displayName = cData.tipoPersona === 'NATURAL'
                        ? `${cData.nombres || ''} ${cData.apellidos || ''}`.trim()
                        : cData.razonSocial || '';
                    setContactName(displayName);
                }

                // Cargar direcciones
                const rAddresses = await fetch(`${API_BASE}/api/contacts/${id}/addresses`);
                if (rAddresses.ok) {
                    const aData = await rAddresses.json();
                    setDirecciones(aData);
                    if (aData.length > 0) setSelectedDir(aData[0]);
                }

                // Cargar pedidos y ventas
                setLoadingPedidos(true);
                try {
                    const rPedidos = await fetch(`${API_BASE}/api/contacts/${id}/pedidos`);
                    if (rPedidos.ok) {
                        const pData = await rPedidos.json();
                        setPedidos(Array.isArray(pData) ? pData : []);
                    }
                } catch (e) {
                    console.error("Error loading pedidos/ventas", e);
                } finally {
                    setLoadingPedidos(false);
                }

                // Cargar vinculados si es empresa
                if (cData.tipoPersona === 'EMPRESA') {
                    setLoadingPersonas(true);
                    fetch(`${API_BASE}/api/contacts/${id}/personas`)
                        .then(r => r.json())
                        .then(data => setLinkedPersonas(Array.isArray(data) ? data : []))
                        .catch(() => setLinkedPersonas([]))
                        .finally(() => setLoadingPersonas(false));
                }
            } catch (err) {
                setError("Error de conexión al cargar la información del contacto.");
            } finally {
                setLoading(false);
            }
        };

        fetchContactDetails();
    }, [id, setContactName]);

    // Load available people when modal is opened
    useEffect(() => {
        if (showAddPersonModal) {
            fetch(`${API_BASE}/api/contacts`)
                .then(res => res.json())
                .then(data => {
                    const filtered = data.filter(c => c.tipoPersona === 'NATURAL' && c.empresaId !== contact?.id);
                    setAvailablePeople(filtered);
                    if (filtered.length > 0) {
                        setSelectedPersonId(String(filtered[0].id));
                    } else {
                        setSelectedPersonId('');
                    }
                })
                .catch(err => console.error("Error al cargar personas disponibles:", err));
        }
    }, [showAddPersonModal, contact]);

    // Load ubigeos when editing locations is enabled
    useEffect(() => {
        if (editingUbicaciones && ubigeos.length === 0) {
            fetch(`${API_BASE}/api/contacts/ubigeos`)
                .then(res => res.json())
                .then(data => setUbigeos(data))
                .catch(err => console.error("Error al cargar ubigeos:", err));
        }
    }, [editingUbicaciones, ubigeos]);

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" />
                <p className="mt-2 text-muted">Cargando detalles de contacto...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-4">
                <Alert variant="danger">{error}</Alert>
                <Link href="/apps/contact/contact-list" className="btn btn-primary mt-2">
                    Volver a la lista
                </Link>
            </div>
        );
    }

    const nombreCompleto = contact.tipoPersona === 'NATURAL'
        ? `${contact.nombres || ''} ${contact.apellidos || ''}`.trim()
        : contact.razonSocial || '';

    const parsedLat = selectedDir ? parseFloat(selectedDir.latitud) : null;
    const parsedLng = selectedDir ? parseFloat(selectedDir.longitud) : null;
    const mapUrl = (selectedDir && !isNaN(parsedLat) && !isNaN(parsedLng) && parsedLat !== null && parsedLng !== null)
        ? `https://www.openstreetmap.org/export/embed.html?bbox=${parsedLng - 0.005},${parsedLat - 0.005},${parsedLng + 0.005},${parsedLat + 0.005}&layer=mapnik&marker=${parsedLat},${parsedLng}`
        : null;

    // Helper: generic PUT contact update
    const saveContactData = async (updatedFields) => {
        const body = {
            tipoPersona: contact.tipoPersona,
            tipoDocumento: contact.tipoDocumento,
            numeroDocumento: contact.numeroDocumento,
            nombres: contact.nombres,
            apellidos: contact.apellidos,
            razonSocial: contact.razonSocial,
            telefonoPrincipal: contact.telefonoPrincipal,
            telefonoSecundario: contact.telefonoSecundario,
            email: contact.email,
            empresaId: contact.empresaId,
            referencia: contact.referencia,
            direcciones: direcciones.map(d => ({
                nombreUbicacion: d.nombreUbicacion,
                codigoUbigeo: d.codigoUbigeo,
                direccionCompleta: d.direccionCompleta,
                referencia: d.referencia,
                latitud: d.latitud,
                longitud: d.longitud
            })),
            ...updatedFields
        };

        const res = await fetch(`${API_BASE}/api/contacts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(Array.isArray(errData) ? errData.join(' • ') : String(errData));
        }

        const data = await res.json();
        return data;
    };

    // Identidad Edit Handlers
    const startEditIdentidad = () => {
        setDraftIdentidad({
            nombres: contact.nombres || '',
            apellidos: contact.apellidos || '',
            razonSocial: contact.razonSocial || '',
            tipoDocumento: contact.tipoDocumento || 'DNI',
            numeroDocumento: contact.numeroDocumento || ''
        });
        setIdentidadError(null);
        setEditingIdentidad(true);
    };

    const handleSaveIdentidad = async () => {
        try {
            setIdentidadError(null);
            if (contact.tipoPersona === 'NATURAL') {
                if (!draftIdentidad.nombres?.trim()) throw new Error("Nombres es obligatorio.");
                if (!draftIdentidad.apellidos?.trim()) throw new Error("Apellidos es obligatorio.");
                if (draftIdentidad.tipoDocumento === 'DNI' && !/^[0-9]{8}$/.test(draftIdentidad.numeroDocumento)) {
                    throw new Error("El DNI debe tener exactamente 8 dígitos.");
                }
                if (draftIdentidad.tipoDocumento === 'CE' && !/^[a-zA-Z0-9]{8,12}$/.test(draftIdentidad.numeroDocumento)) {
                    throw new Error("El CE debe tener entre 8 y 12 caracteres alfanuméricos.");
                }
            } else {
                if (!draftIdentidad.razonSocial?.trim()) throw new Error("Razón Social es obligatoria.");
                if (draftIdentidad.tipoDocumento === 'RUC' && !/^(10|20)[0-9]{9}$/.test(draftIdentidad.numeroDocumento)) {
                    throw new Error("El RUC debe tener 11 dígitos y comenzar con 10 o 20.");
                }
            }

            const updated = await saveContactData({
                tipoDocumento: draftIdentidad.tipoDocumento,
                numeroDocumento: draftIdentidad.numeroDocumento.trim(),
                nombres: contact.tipoPersona === 'NATURAL' ? draftIdentidad.nombres.trim() : null,
                apellidos: contact.tipoPersona === 'NATURAL' ? draftIdentidad.apellidos.trim() : null,
                razonSocial: contact.tipoPersona === 'EMPRESA' ? draftIdentidad.razonSocial.trim() : null,
            });

            setContact(updated);
            if (setContactName) {
                const displayName = updated.tipoPersona === 'NATURAL'
                    ? `${updated.nombres || ''} ${updated.apellidos || ''}`.trim()
                    : updated.razonSocial || '';
                setContactName(displayName);
            }
            setEditingIdentidad(false);
        } catch (err) {
            setIdentidadError(err.message);
        }
    };

    // Comunicacion Edit Handlers
    const startEditComunicacion = () => {
        setDraftComunicacion({
            email: contact.email || '',
            telefonoPrincipal: contact.telefonoPrincipal || '',
            telefonoSecundario: contact.telefonoSecundario || ''
        });
        setComunicacionError(null);
        setEditingComunicacion(true);
    };

    const handleSaveComunicacion = async () => {
        try {
            setComunicacionError(null);
            if (!/^[0-9]{9}$/.test(draftComunicacion.telefonoPrincipal)) {
                throw new Error("El teléfono principal debe tener exactamente 9 dígitos.");
            }
            if (draftComunicacion.telefonoSecundario && !/^[0-9]{9}$/.test(draftComunicacion.telefonoSecundario)) {
                throw new Error("El teléfono secundario debe tener exactamente 9 dígitos.");
            }

            const updated = await saveContactData({
                email: draftComunicacion.email?.trim() || null,
                telefonoPrincipal: draftComunicacion.telefonoPrincipal.trim(),
                telefonoSecundario: draftComunicacion.telefonoSecundario?.trim() || null,
            });

            setContact(updated);
            setEditingComunicacion(false);
        } catch (err) {
            setComunicacionError(err.message);
        }
    };

    // Notas Edit Handlers
    const startEditNotas = () => {
        setDraftNotas(contact.referencia || '');
        setNotasError(null);
        setEditingNotas(true);
    };

    const handleSaveNotas = async () => {
        try {
            setNotasError(null);
            const updated = await saveContactData({
                referencia: draftNotas?.trim() || null,
            });
            setContact(updated);
            setEditingNotas(false);
        } catch (err) {
            setNotasError(err.message);
        }
    };

    // Ubicaciones Edit Handlers
    const startEditUbicaciones = () => {
        setDraftDirecciones(JSON.parse(JSON.stringify(direcciones))); // clone
        setSelectedDirIndex(0);
        setUbicacionesError(null);
        setEditingUbicaciones(true);
    };

    const handleDraftDirChange = (field, value) => {
        const arr = [...draftDirecciones];
        let updated;
        if (typeof field === 'object') {
            updated = { ...arr[selectedDirIndex], ...field };
        } else {
            updated = { ...arr[selectedDirIndex], [field]: value };
            if (field === 'departamento') { updated.provincia = ''; updated.codigoUbigeo = ''; updated.distrito = ''; }
            if (field === 'provincia') { updated.codigoUbigeo = ''; updated.distrito = ''; }
            if (field === 'distrito') {
                const ubigeo = ubigeos.find(u => u.departamento === updated.departamento && u.provincia === updated.provincia && u.distrito === value);
                updated.codigoUbigeo = ubigeo ? ubigeo.codigoUbigeo : '';
            }
        }
        arr[selectedDirIndex] = updated;
        setDraftDirecciones(arr);
    };

    const handleAddDraftDireccion = () => {
        const newDir = {
            nombreUbicacion: '', departamento: '', provincia: '', distrito: '',
            codigoUbigeo: '', direccionCompleta: '', referencia: '', latitud: null, longitud: null
        };
        const updatedList = [...draftDirecciones, newDir];
        setDraftDirecciones(updatedList);
        setSelectedDirIndex(updatedList.length - 1);
    };

    const handleRemoveDraftDireccion = () => {
        if (draftDirecciones.length === 0) return;
        const updatedList = draftDirecciones.filter((_, i) => i !== selectedDirIndex);
        setDraftDirecciones(updatedList);
        setSelectedDirIndex(Math.max(0, selectedDirIndex - 1));
    };

    const handleSaveUbicaciones = async () => {
        try {
            setUbicacionesError(null);
            for (let i = 0; i < draftDirecciones.length; i++) {
                const d = draftDirecciones[i];
                if (!d.nombreUbicacion?.trim()) throw new Error(`Dirección ${i + 1}: El nombre de ubicación es obligatorio.`);
                if (!d.direccionCompleta?.trim()) throw new Error(`Dirección ${i + 1}: La dirección completa es obligatoria.`);
            }

            const updated = await saveContactData({
                direcciones: draftDirecciones.map(d => ({
                    nombreUbicacion: d.nombreUbicacion.trim(),
                    codigoUbigeo: d.codigoUbigeo || null,
                    direccionCompleta: d.direccionCompleta.trim(),
                    referencia: d.referencia?.trim() || null,
                    latitud: d.latitud || null,
                    longitud: d.longitud || null
                }))
            });

            setContact(updated);

            // Cargar de nuevo las direcciones desde el backend para tener Ubigeo completo
            const rAddresses = await fetch(`${API_BASE}/api/contacts/${id}/addresses`);
            if (rAddresses.ok) {
                const aData = await rAddresses.json();
                setDirecciones(aData);
                if (aData.length > 0) {
                    const nextSelIndex = selectedDirIndex < aData.length ? selectedDirIndex : 0;
                    setSelectedDir(aData[nextSelIndex]);
                } else {
                    setSelectedDir(null);
                }
            }
            setEditingUbicaciones(false);
        } catch (err) {
            setUbicacionesError(err.message);
        }
    };

    // Personal Tab Handlers
    const reloadLinkedPersonas = async () => {
        setLoadingPersonas(true);
        try {
            const r = await fetch(`${API_BASE}/api/contacts/${id}/personas`);
            if (r.ok) {
                const data = await r.json();
                setLinkedPersonas(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error("Error al recargar vinculados:", e);
        } finally {
            setLoadingPersonas(false);
        }
    };

    const handleLinkExistingPerson = async () => {
        if (!selectedPersonId) return;
        setPersonModalSaving(true);
        setPersonModalError(null);
        try {
            const res = await fetch(`${API_BASE}/api/contacts/${selectedPersonId}/link-empresa?empresaId=${contact.id}`, {
                method: 'PUT'
            });
            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Error al vincular contacto.");
            }
            await reloadLinkedPersonas();
            setShowAddPersonModal(false);
        } catch (err) {
            setPersonModalError(err.message);
        } finally {
            setPersonModalSaving(false);
        }
    };

    const handleCreateAndLinkPerson = async () => {
        if (!newPersonNombres.trim()) { setPersonModalError("Nombres es obligatorio."); return; }
        if (!newPersonApellidos.trim()) { setPersonModalError("Apellidos es obligatorio."); return; }
        if (newPersonTipoDoc === 'DNI' && !/^[0-9]{8}$/.test(newPersonNumDoc)) {
            setPersonModalError("El DNI debe tener exactamente 8 dígitos."); return;
        }
        if (newPersonTipoDoc === 'CE' && !/^[a-zA-Z0-9]{8,12}$/.test(newPersonNumDoc)) {
            setPersonModalError("El CE debe tener entre 8 y 12 caracteres alfanuméricos."); return;
        }
        if (!/^[0-9]{9}$/.test(newPersonCelular)) {
            setPersonModalError("El celular principal debe tener 9 dígitos."); return;
        }

        setPersonModalSaving(true);
        setPersonModalError(null);
        try {
            const body = {
                tipoPersona: 'NATURAL',
                tipoDocumento: newPersonTipoDoc,
                numeroDocumento: newPersonNumDoc.trim(),
                nombres: newPersonNombres.trim(),
                apellidos: newPersonApellidos.trim(),
                telefonoPrincipal: newPersonCelular.trim(),
                email: newPersonEmail.trim() || null,
                empresaId: contact.id,
                direcciones: []
            };

            const res = await fetch(`${API_BASE}/api/contacts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(Array.isArray(errData) ? errData.join(' • ') : String(errData));
            }

            await reloadLinkedPersonas();
            setShowAddPersonModal(false);
        } catch (err) {
            setPersonModalError(err.message);
        } finally {
            setPersonModalSaving(false);
        }
    };

    const handleUnlinkPerson = async (personId) => {
        if (!confirm("¿Está seguro de que desea desvincular a esta persona de la empresa?")) return;
        try {
            const res = await fetch(`${API_BASE}/api/contacts/${personId}/link-empresa`, {
                method: 'PUT'
            });
            if (res.ok) {
                await reloadLinkedPersonas();
            } else {
                alert("No se pudo desvincular el contacto.");
            }
        } catch (err) {
            console.error("Error al desvincular:", err);
        }
    };

    // Cascading variables for Ubicaciones
    const activeDraftDir = draftDirecciones[selectedDirIndex] || null;
    const departamentos = [...new Set(ubigeos.map(u => u.departamento))].sort();
    const provincias = activeDraftDir?.departamento
        ? [...new Set(ubigeos.filter(u => u.departamento === activeDraftDir.departamento).map(u => u.provincia))].sort()
        : [];
    const distritos = activeDraftDir?.provincia
        ? ubigeos.filter(u => u.departamento === activeDraftDir.departamento && u.provincia === activeDraftDir.provincia).sort((a, b) => a.distrito.localeCompare(b.distrito))
        : [];

    return (
        <div className="view-contact-body-wrap" style={{ width: '100%' }}>
            {/* Barra de Sub-Cabecera (Volver + Indicadores) */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 py-2 border-bottom">
                <Link href="/apps/contact/contact-list" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
                    ← VOLVER
                </Link>
                <div className="d-flex gap-4 align-items-center">
                    <div className="text-center">
                        <div className="text-uppercase text-muted" style={{ fontSize: '0.65rem', fontWeight: 600 }}>Stock Prestado</div>
                        <div className="text-success fw-bold" style={{ fontSize: '0.95rem' }}>0 bidones</div>
                    </div>
                    <div className="text-center" style={{ borderLeft: '1px solid #dee2e6', paddingLeft: '1.5rem' }}>
                        <div className="text-uppercase text-muted" style={{ fontSize: '0.65rem', fontWeight: 600 }}>Oportunidades</div>
                        <div className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>0</div>
                    </div>
                    <div className="text-center" style={{ borderLeft: '1px solid #dee2e6', paddingLeft: '1.5rem' }}>
                        <div className="text-uppercase text-muted" style={{ fontSize: '0.65rem', fontWeight: 600 }}>Ventas</div>
                        <div className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>1</div>
                    </div>
                    <div className="text-center" style={{ borderLeft: '1px solid #dee2e6', paddingLeft: '1.5rem' }}>
                        <div className="text-uppercase text-muted" style={{ fontSize: '0.65rem', fontWeight: 600 }}>Facturado</div>
                        <div className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>S/ 64.00</div>
                    </div>
                </div>
            </div>

            <Row className="gx-4">
                {/* Columna Izquierda (70%) */}
                <Col md={8} className="mb-4">
                    
                    {/* Card de Identidad */}
                    <Card className="border rounded shadow-sm p-4 mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="fw-bold text-primary mb-0" style={{ fontSize: '0.95rem', letterSpacing: '0.05em' }}>
                                👤 IDENTIDAD
                            </h5>
                            {!editingIdentidad ? (
                                <Button variant="soft-primary" size="sm" style={{ fontSize: '0.75rem' }} onClick={startEditIdentidad}>
                                    ✏️ EDITAR
                                </Button>
                            ) : (
                                <div className="d-flex gap-2">
                                    <Button variant="success" size="sm" style={{ fontSize: '0.75rem' }} onClick={handleSaveIdentidad}>
                                        <Check size={12} className="me-1" /> Guardar
                                    </Button>
                                    <Button variant="secondary" size="sm" style={{ fontSize: '0.75rem' }} onClick={() => setEditingIdentidad(false)}>
                                        <X size={12} className="me-1" /> Cancelar
                                    </Button>
                                </div>
                            )}
                        </div>

                        {identidadError && (
                            <Alert variant="danger" className="py-2 mb-3" style={{ fontSize: '0.8rem' }}>
                                {identidadError}
                            </Alert>
                        )}

                        {!editingIdentidad ? (
                            <>
                                <Row className="gx-3">
                                    <Col sm={5} className="mb-3 mb-sm-0">
                                        <div className="text-uppercase text-muted fw-semibold mb-1" style={{ fontSize: '0.72rem' }}>
                                            {contact.tipoPersona === 'EMPRESA' ? 'Razón Social' : 'Nombres y Apellidos'}
                                        </div>
                                        <div className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>
                                            {nombreCompleto}
                                        </div>
                                    </Col>
                                    <Col sm={4} className="mb-3 mb-sm-0">
                                        <div className="text-uppercase text-muted fw-semibold mb-1" style={{ fontSize: '0.72rem' }}>
                                            {contact.tipoDocumento || 'Documento'}
                                        </div>
                                        <div className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>
                                            {contact.numeroDocumento}
                                        </div>
                                    </Col>
                                    <Col sm={3}>
                                        <div className="text-uppercase text-muted fw-semibold mb-1" style={{ fontSize: '0.72rem' }}>
                                            Estado
                                        </div>
                                        <div className="fw-bold text-primary" style={{ fontSize: '0.9rem' }}>
                                            CLIENTE
                                        </div>
                                    </Col>
                                </Row>
                                {contact.tipoPersona === 'NATURAL' && contact.empresaNombre && (
                                    <Row className="gx-3 mt-3 border-top pt-3">
                                        <Col sm={12}>
                                            <div className="text-uppercase text-muted fw-semibold mb-2" style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                                                🏢 EMPRESA VINCULADA
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>🏢</span>
                                                <Link href={`/apps/contact/view-contact?id=${contact.empresaId}`} className="fw-bold text-primary text-decoration-none" style={{ fontSize: '0.9rem' }}>
                                                    {contact.empresaNombre}
                                                </Link>
                                            </div>
                                        </Col>
                                    </Row>
                                )}
                            </>
                        ) : (
                            <Row className="gx-3">
                                {contact.tipoPersona === 'NATURAL' ? (
                                    <>
                                        <Col sm={3} className="mb-2">
                                            <Form.Label className="form-label-sm">Nombres</Form.Label>
                                            <Form.Control size="sm" type="text" value={draftIdentidad.nombres} onChange={e => setDraftIdentidad({ ...draftIdentidad, nombres: e.target.value })} />
                                        </Col>
                                        <Col sm={3} className="mb-2">
                                            <Form.Label className="form-label-sm">Apellidos</Form.Label>
                                            <Form.Control size="sm" type="text" value={draftIdentidad.apellidos} onChange={e => setDraftIdentidad({ ...draftIdentidad, apellidos: e.target.value })} />
                                        </Col>
                                        <Col sm={3} className="mb-2">
                                            <Form.Label className="form-label-sm">Tipo Doc</Form.Label>
                                            <Form.Select size="sm" value={draftIdentidad.tipoDocumento} onChange={e => setDraftIdentidad({ ...draftIdentidad, tipoDocumento: e.target.value })}>
                                                <option value="DNI">DNI</option>
                                                <option value="CE">CE</option>
                                            </Form.Select>
                                        </Col>
                                    </>
                                ) : (
                                    <>
                                        <Col sm={5} className="mb-2">
                                            <Form.Label className="form-label-sm">Razón Social</Form.Label>
                                            <Form.Control size="sm" type="text" value={draftIdentidad.razonSocial} onChange={e => setDraftIdentidad({ ...draftIdentidad, razonSocial: e.target.value })} />
                                        </Col>
                                        <Col sm={3} className="mb-2">
                                            <Form.Label className="form-label-sm">Tipo Doc</Form.Label>
                                            <Form.Select size="sm" value={draftIdentidad.tipoDocumento} disabled>
                                                <option value="RUC">RUC</option>
                                            </Form.Select>
                                        </Col>
                                    </>
                                )}
                                <Col sm={3} className="mb-2">
                                    <Form.Label className="form-label-sm">Número Doc</Form.Label>
                                    <Form.Control size="sm" type="text" value={draftIdentidad.numeroDocumento} onChange={e => setDraftIdentidad({ ...draftIdentidad, numeroDocumento: e.target.value })} />
                                </Col>
                            </Row>
                        )}
                    </Card>

                    {/* Card de Comunicación */}
                    <Card className="border rounded shadow-sm p-4 mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="fw-bold text-primary mb-0" style={{ fontSize: '0.95rem', letterSpacing: '0.05em' }}>
                                📞 COMUNICACIÓN
                            </h5>
                            {!editingComunicacion ? (
                                <Button variant="soft-primary" size="sm" style={{ fontSize: '0.75rem' }} onClick={startEditComunicacion}>
                                    ✏️ EDITAR
                                </Button>
                            ) : (
                                <div className="d-flex gap-2">
                                    <Button variant="success" size="sm" style={{ fontSize: '0.75rem' }} onClick={handleSaveComunicacion}>
                                        <Check size={12} className="me-1" /> Guardar
                                    </Button>
                                    <Button variant="secondary" size="sm" style={{ fontSize: '0.75rem' }} onClick={() => setEditingComunicacion(false)}>
                                        <X size={12} className="me-1" /> Cancelar
                                    </Button>
                                </div>
                            )}
                        </div>

                        {comunicacionError && (
                            <Alert variant="danger" className="py-2 mb-3" style={{ fontSize: '0.8rem' }}>
                                {comunicacionError}
                            </Alert>
                        )}

                        {!editingComunicacion ? (
                            <Row className="gx-3">
                                <Col sm={4} className="mb-3 mb-sm-0">
                                    <div className="text-uppercase text-muted fw-semibold mb-1" style={{ fontSize: '0.72rem' }}>
                                        Email Principal
                                    </div>
                                    <div className="text-dark" style={{ fontSize: '0.9rem' }}>
                                        {contact.email || '-'}
                                    </div>
                                </Col>
                                <Col sm={2} className="mb-3 mb-sm-0">
                                    <div className="text-uppercase text-muted fw-semibold mb-1" style={{ fontSize: '0.72rem' }}>
                                        Celular 1
                                    </div>
                                    <div className="text-dark" style={{ fontSize: '0.9rem' }}>
                                        {contact.telefonoPrincipal ? `+51 ${contact.telefonoPrincipal}` : '-'}
                                    </div>
                                </Col>
                                <Col sm={2} className="mb-3 mb-sm-0">
                                    <div className="text-uppercase text-muted fw-semibold mb-1" style={{ fontSize: '0.72rem' }}>
                                        Celular 2
                                    </div>
                                    <div className="text-dark" style={{ fontSize: '0.9rem' }}>
                                        {contact.telefonoSecundario ? `+51 ${contact.telefonoSecundario}` : '-'}
                                    </div>
                                </Col>
                                <Col sm={2} className="mb-3 mb-sm-0">
                                    <div className="text-uppercase text-muted fw-semibold mb-1" style={{ fontSize: '0.72rem' }}>
                                        Fijo
                                    </div>
                                    <div className="text-dark" style={{ fontSize: '0.9rem' }}>
                                        -
                                    </div>
                                </Col>
                                <Col sm={2}>
                                    <div className="text-uppercase text-muted fw-semibold mb-1" style={{ fontSize: '0.72rem' }}>
                                        Origen
                                    </div>
                                    <div className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>
                                        Web
                                    </div>
                                </Col>
                            </Row>
                        ) : (
                            <Row className="gx-3">
                                <Col sm={4} className="mb-2">
                                    <Form.Label className="form-label-sm">Email Principal</Form.Label>
                                    <Form.Control size="sm" type="email" value={draftComunicacion.email} onChange={e => setDraftComunicacion({ ...draftComunicacion, email: e.target.value })} />
                                </Col>
                                <Col sm={4} className="mb-2">
                                    <Form.Label className="form-label-sm">Celular 1 (Obligatorio)</Form.Label>
                                    <Form.Control size="sm" type="text" value={draftComunicacion.telefonoPrincipal} onChange={e => setDraftComunicacion({ ...draftComunicacion, telefonoPrincipal: e.target.value })} />
                                </Col>
                                <Col sm={4} className="mb-2">
                                    <Form.Label className="form-label-sm">Celular 2</Form.Label>
                                    <Form.Control size="sm" type="text" value={draftComunicacion.telefonoSecundario} onChange={e => setDraftComunicacion({ ...draftComunicacion, telefonoSecundario: e.target.value })} />
                                </Col>
                            </Row>
                        )}
                    </Card>

                    {/* Barra de Pestañas (Tabs) */}
                    <div className="border-bottom mb-3 mt-4">
                        <ul className="nav nav-tabs border-bottom-0" style={{ fontSize: '0.85rem' }}>
                            <li className="nav-item">
                                <span className={`nav-link ${activeTab === 'Pedidos' ? 'active fw-bold text-primary border-0 border-bottom border-primary' : 'text-muted'}`} style={{ cursor: 'pointer' }} onClick={() => setActiveTab('Pedidos')}>Pedidos</span>
                            </li>
                            <li className="nav-item">
                                <span className={`nav-link ${activeTab === 'Oportunidades' ? 'active fw-bold text-primary border-0 border-bottom border-primary' : 'text-muted'}`} style={{ cursor: 'pointer' }} onClick={() => setActiveTab('Oportunidades')}>Oportunidades</span>
                            </li>
                            <li className="nav-item">
                                <span className={`nav-link ${activeTab === 'Envases' ? 'active fw-bold text-primary border-0 border-bottom border-primary' : 'text-muted'}`} style={{ cursor: 'pointer' }} onClick={() => setActiveTab('Envases')}>Envases</span>
                            </li>
                            <li className="nav-item">
                                <span className={`nav-link ${activeTab === 'Ubicaciones' ? 'active fw-bold text-primary border-0 border-bottom border-primary' : 'text-muted'}`} style={{ cursor: 'pointer' }} onClick={() => setActiveTab('Ubicaciones')}>Ubicaciones</span>
                            </li>
                            {contact.tipoPersona === 'EMPRESA' && (
                                <li className="nav-item">
                                    <span className={`nav-link ${activeTab === 'Personal' ? 'active fw-bold text-primary border-0 border-bottom border-primary' : 'text-muted'}`} style={{ cursor: 'pointer' }} onClick={() => setActiveTab('Personal')}>Personal</span>
                                </li>
                            )}
                        </ul>
                    </div>

                    {/* Contenido de Pestaña: Ubicaciones */}
                    {activeTab === 'Ubicaciones' && (
                        <Card className="border rounded shadow-sm p-4 mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="fw-bold text-primary mb-0" style={{ fontSize: '0.95rem', letterSpacing: '0.05em' }}>
                                    📍 UBICACIONES
                                </h5>
                                {!editingUbicaciones ? (
                                    <Button variant="soft-primary" size="sm" style={{ fontSize: '0.75rem' }} onClick={startEditUbicaciones}>
                                        ✏️ EDITAR
                                    </Button>
                                ) : (
                                    <div className="d-flex gap-2">
                                        <Button variant="outline-primary" size="sm" style={{ fontSize: '0.75rem' }} onClick={handleAddDraftDireccion}>
                                            <Plus size={12} className="me-1" /> Añadir Dirección
                                        </Button>
                                        {draftDirecciones.length > 1 && (
                                            <Button variant="outline-danger" size="sm" style={{ fontSize: '0.75rem' }} onClick={handleRemoveDraftDireccion}>
                                                <Trash size={12} className="me-1" /> Quitar
                                            </Button>
                                        )}
                                        <Button variant="success" size="sm" style={{ fontSize: '0.75rem' }} onClick={handleSaveUbicaciones}>
                                            <Check size={12} className="me-1" /> Guardar
                                        </Button>
                                        <Button variant="secondary" size="sm" style={{ fontSize: '0.75rem' }} onClick={() => setEditingUbicaciones(false)}>
                                            <X size={12} className="me-1" /> Cancelar
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {ubicacionesError && (
                                <Alert variant="danger" className="py-2 mb-3" style={{ fontSize: '0.8rem' }}>
                                    {ubicacionesError}
                                </Alert>
                            )}
                            
                            {(!editingUbicaciones ? direcciones : draftDirecciones).length === 0 ? (
                                <Alert variant="info" className="py-2 mb-0" style={{ fontSize: '0.85rem' }}>
                                    Este contacto no tiene direcciones registradas.
                                </Alert>
                            ) : (
                                <Row className="gx-4">
                                    {/* Selectores de direcciones arriba */}
                                    {(!editingUbicaciones ? direcciones : draftDirecciones).length > 1 && (
                                        <Col sm={12} className="mb-3">
                                            <div className="d-flex gap-2 flex-wrap">
                                                {(!editingUbicaciones ? direcciones : draftDirecciones).map((dir, i) => (
                                                    <Button 
                                                        key={dir.idDireccion || i} 
                                                        variant={(!editingUbicaciones ? selectedDir?.idDireccion === dir.idDireccion : selectedDirIndex === i) ? 'primary' : 'outline-secondary'} 
                                                        size="sm"
                                                        onClick={() => !editingUbicaciones ? setSelectedDir(dir) : setSelectedDirIndex(i)}
                                                        style={{ fontSize: '0.75rem', padding: '3px 10px' }}
                                                    >
                                                        📍 {dir.nombreUbicacion || `Dirección ${i + 1}`}
                                                    </Button>
                                                ))}
                                            </div>
                                        </Col>
                                    )}
                                    
                                    {!editingUbicaciones ? (
                                        <>
                                            <Col md={5} className="mb-3 mb-md-0 d-flex flex-column justify-content-center">
                                                <div className="fw-bold text-primary mb-3" style={{ fontSize: '0.85rem' }}>
                                                    📍 UBICACIÓN SELECCIONADA
                                                </div>
                                                <div className="mb-2">
                                                    <span className="fw-bold text-dark d-block" style={{ fontSize: '0.8rem' }}>Dirección:</span>
                                                    <span className="text-muted" style={{ fontSize: '0.85rem' }}>{selectedDir?.direccionCompleta}</span>
                                                </div>
                                                <div className="mb-2">
                                                    <span className="fw-bold text-dark d-block" style={{ fontSize: '0.8rem' }}>Departamento:</span>
                                                    <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                                                        {selectedDir?.departamento} | <span className="fw-bold text-dark">Provincia:</span> {selectedDir?.provincia} | <span className="fw-bold text-dark">Distrito:</span> {selectedDir?.distrito}
                                                    </span>
                                                </div>
                                                {selectedDir?.referencia && (
                                                    <div className="mb-2">
                                                        <span className="fw-bold text-dark d-block" style={{ fontSize: '0.8rem' }}>Referencia:</span>
                                                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>{selectedDir.referencia}</span>
                                                    </div>
                                                )}
                                                {(() => {
                                                    const parsedLat = parseFloat(selectedDir?.latitud);
                                                    const parsedLng = parseFloat(selectedDir?.longitud);
                                                    return !isNaN(parsedLat) && !isNaN(parsedLng) && (
                                                        <div className="text-muted mt-2" style={{ fontSize: '0.75rem' }}>
                                                            🌐 Coordenadas: {parsedLat.toFixed(6)}, {parsedLng.toFixed(6)}
                                                        </div>
                                                    );
                                                })()}
                                            </Col>
                                            <Col md={7}>
                                                {mapUrl ? (
                                                    <div className="border rounded overflow-hidden" style={{ height: 260 }}>
                                                        <iframe
                                                            key={selectedDir?.idDireccion}
                                                            src={mapUrl}
                                                            width="100%" height="100%"
                                                            style={{ border: 'none' }}
                                                            title="Mapa de ubicación"
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="d-flex align-items-center justify-content-center border rounded bg-light text-muted" style={{ height: 260, fontSize: '0.8rem' }}>
                                                        No hay coordenadas GPS registradas.
                                                    </div>
                                                )}
                                            </Col>
                                        </>
                                    ) : (
                                        <Col sm={12}>
                                            {activeDraftDir && (
                                                <Row className="gx-2">
                                                    <Col sm={12} className="mb-2">
                                                        <Form.Label className="form-label-sm">Nombre de ubicación *</Form.Label>
                                                        <Form.Control size="sm" type="text" placeholder="Ej: Sede Principal, Oficina, Casa"
                                                            value={activeDraftDir.nombreUbicacion || ''}
                                                            onChange={e => handleDraftDirChange('nombreUbicacion', e.target.value)} />
                                                    </Col>
                                                    <Col sm={4} className="mb-2">
                                                        <Form.Label className="form-label-sm">Departamento</Form.Label>
                                                        <Form.Select size="sm" value={activeDraftDir.departamento || ''}
                                                            onChange={e => handleDraftDirChange('departamento', e.target.value)}>
                                                            <option value="">-- Seleccionar --</option>
                                                            {departamentos.map(d => <option key={d} value={d}>{d}</option>)}
                                                        </Form.Select>
                                                    </Col>
                                                    <Col sm={4} className="mb-2">
                                                        <Form.Label className="form-label-sm">Provincia</Form.Label>
                                                        <Form.Select size="sm" value={activeDraftDir.provincia || ''}
                                                            disabled={!activeDraftDir.departamento}
                                                            onChange={e => handleDraftDirChange('provincia', e.target.value)}>
                                                            <option value="">-- Seleccionar --</option>
                                                            {provincias.map(p => <option key={p} value={p}>{p}</option>)}
                                                        </Form.Select>
                                                    </Col>
                                                    <Col sm={4} className="mb-2">
                                                        <Form.Label className="form-label-sm">Distrito</Form.Label>
                                                        <Form.Select size="sm" value={activeDraftDir.distrito || ''}
                                                            disabled={!activeDraftDir.provincia}
                                                            onChange={e => handleDraftDirChange('distrito', e.target.value)}>
                                                            <option value="">-- Seleccionar --</option>
                                                            {distritos.map(d => <option key={d.codigoUbigeo} value={d.distrito}>{d.distrito}</option>)}
                                                        </Form.Select>
                                                        {activeDraftDir.codigoUbigeo && (
                                                            <small className="text-muted d-block mt-1">Ubigeo: {activeDraftDir.codigoUbigeo}</small>
                                                        )}
                                                    </Col>
                                                    <Col sm={12} className="mb-2">
                                                        <Form.Label className="form-label-sm">Dirección completa *</Form.Label>
                                                        <div className="input-group input-group-sm">
                                                            <Form.Control size="sm" type="text" placeholder="Av. Las Palmeras 123..."
                                                                value={activeDraftDir.direccionCompleta || ''}
                                                                onChange={e => handleDraftDirChange('direccionCompleta', e.target.value)} />
                                                            <Button variant="outline-secondary" title="Buscar por dirección escrita" onClick={handleGeocodeUbicacion} disabled={geocodingUbicacion}>
                                                                {geocodingUbicacion ? <Spinner size="xs" animation="border" /> : <Search size={14} />}
                                                            </Button>
                                                            <Button variant="outline-success" title="Obtener ubicación actual (GPS)" onClick={handleLocateCurrentUbicacion}>
                                                                <MapPin size={14} />
                                                            </Button>
                                                            <Button variant="outline-primary" title="Insertar link de Google Maps" onClick={handlePasteLinkUbicacion}>
                                                                <LinkIcon size={14} />
                                                            </Button>
                                                        </div>
                                                    </Col>
                                                    <Col sm={12} className="mb-2">
                                                        <Form.Label className="form-label-sm">Referencia</Form.Label>
                                                        <Form.Control size="sm" type="text" placeholder="Frente al parque..."
                                                            value={activeDraftDir.referencia || ''}
                                                            onChange={e => handleDraftDirChange('referencia', e.target.value)} />
                                                    </Col>
                                                    <Col sm={6} className="mb-2">
                                                        <Form.Label className="form-label-sm">Latitud</Form.Label>
                                                        <Form.Control size="sm" type="number" step="any" placeholder="-12.0464"
                                                            value={activeDraftDir.latitud || ''}
                                                            onChange={e => handleDraftDirChange('latitud', e.target.value ? parseFloat(e.target.value) : null)} />
                                                    </Col>
                                                    <Col sm={6} className="mb-2">
                                                        <Form.Label className="form-label-sm">Longitud</Form.Label>
                                                        <Form.Control size="sm" type="number" step="any" placeholder="-77.0428"
                                                            value={activeDraftDir.longitud || ''}
                                                            onChange={e => handleDraftDirChange('longitud', e.target.value ? parseFloat(e.target.value) : null)} />
                                                    </Col>
                                                    <Col sm={12} className="mb-2 mt-2" style={{ height: '260px' }}>
                                                        <InteractiveMap 
                                                            lat={activeDraftDir.latitud} 
                                                            lng={activeDraftDir.longitud} 
                                                            onChange={(lat, lng) => {
                                                                handleDraftDirChange({ latitud: lat, longitud: lng });
                                                            }} 
                                                        />
                                                    </Col>
                                                </Row>
                                            )}
                                        </Col>
                                    )}
                                </Row>
                            )}
                        </Card>
                    )}

                    {/* Contenido de Pestaña: Personal */}
                    {activeTab === 'Personal' && contact.tipoPersona === 'EMPRESA' && (
                        <Card className="border rounded shadow-sm p-4 mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="fw-bold text-primary mb-0" style={{ fontSize: '0.95rem', letterSpacing: '0.05em' }}>
                                    PERSONAL VINCULADO
                                </h5>
                                <Button variant="primary" size="sm" className="fw-semibold btn-sm" onClick={() => setShowAddPersonModal(true)}>
                                    + Agregar Persona
                                </Button>
                            </div>

                            {loadingPersonas ? (
                                <div className="text-center py-4">
                                    <Spinner size="sm" animation="border" />
                                    <span className="ms-2 text-muted">Cargando personal...</span>
                                </div>
                            ) : linkedPersonas.length === 0 ? (
                                <Alert variant="info" className="py-2 mb-0" style={{ fontSize: '0.85rem' }}>
                                    No hay personal vinculado a esta empresa.
                                </Alert>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                                        <thead className="table-light">
                                            <tr>
                                                <th>Nombre</th>
                                                <th>Email</th>
                                                <th>Celular</th>
                                                <th className="text-end">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {linkedPersonas.map(p => (
                                                <tr key={p.id}>
                                                    <td className="fw-bold text-dark">
                                                        {p.nombres} {p.apellidos}
                                                    </td>
                                                    <td>{p.email || '—'}</td>
                                                    <td>{p.telefonoPrincipal ? `+51 ${p.telefonoPrincipal}` : '—'}</td>
                                                    <td className="text-end">
                                                        <div className="d-inline-flex gap-2">
                                                            <Link href={`/apps/contact/view-contact?id=${p.id}`} className="btn btn-outline-secondary btn-xs p-1" title="Ver Ficha">
                                                                <Eye size={14} />
                                                            </Link>
                                                            <Button variant="outline-danger" className="btn-xs p-1" title="Desvincular" onClick={() => handleUnlinkPerson(p.id)}>
                                                                <Trash size={14} />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Pedidos and Sales Tab */}
                    {activeTab === 'Pedidos' && (
                        <Card className="border rounded shadow-sm mb-4 bg-white overflow-hidden">
                            {loadingPedidos ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="primary" />
                                </div>
                            ) : pedidos.length > 0 ? (
                                <div className="table-responsive">
                                    <Table hover className="align-middle mb-0 text-nowrap">
                                        <thead className="table-light text-muted font-size-12">
                                            <tr>
                                                <th className="ps-3">Tipo</th>
                                                <th>Nº Registro</th>
                                                <th>Fecha</th>
                                                <th>Dirección</th>
                                                <th>Total</th>
                                                <th>Estado Pago</th>
                                                <th>Estado Entrega</th>
                                            </tr>
                                        </thead>
                                        <tbody className="font-size-13">
                                            {pedidos.map((row, idx) => {
                                                const isVenta = row.tipo === 'venta';
                                                const typeBadge = isVenta 
                                                    ? <Badge bg="success-soft text-success">VENTA DIRECTA</Badge>
                                                    : <Badge bg="primary-soft text-primary">PEDIDO RUTA</Badge>;
                                                
                                                const dateStr = row.fecha ? new Date(row.fecha).toLocaleDateString('es-PE', {
                                                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                }) : '—';

                                                const estadoPagoBadge = row.estado_pago === 'pagado' || row.estado_pago === 'Pagado'
                                                    ? <Badge bg="success">Pagado</Badge>
                                                    : (row.estado_pago === 'parcial' || row.estado_pago === 'Parcial'
                                                        ? <Badge bg="warning text-dark">Parcial</Badge>
                                                        : <Badge bg="danger">Pendiente</Badge>);

                                                const getEntregaBadge = (est) => {
                                                    const raw = est || 'Pendiente';
                                                    const clean = String(est || '').toLowerCase();
                                                    if (clean === 'completada' || clean === 'entregado') return <Badge bg="success-soft text-success">Entregado</Badge>;
                                                    if (clean === 'cancelada' || clean === 'anulada') return <Badge bg="danger-soft text-danger">Anulado</Badge>;
                                                    return <Badge bg="info-soft text-info">{raw.toUpperCase()}</Badge>;
                                                };

                                                return (
                                                    <tr key={idx}>
                                                        <td className="ps-3">{typeBadge}</td>
                                                        <td>
                                                            <strong className="text-dark">{row.numero}</strong>
                                                        </td>
                                                        <td className="text-muted">{dateStr}</td>
                                                        <td className="text-truncate" style={{ maxWidth: '200px' }} title={row.direccion_entrega}>
                                                            {row.direccion_entrega || '—'}
                                                        </td>
                                                        <td>
                                                            <strong className="text-dark">S/ {parseFloat(row.total || 0).toFixed(2)}</strong>
                                                        </td>
                                                        <td>{estadoPagoBadge}</td>
                                                        <td>{getEntregaBadge(row.estado_entrega)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-5 text-muted" style={{ fontSize: '0.85rem' }}>
                                    No se registran pedidos ni ventas para este contacto.
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Oportunidades, Envases placeholder content */}
                    {(activeTab === 'Oportunidades' || activeTab === 'Envases') && (
                        <Card className="border rounded shadow-sm p-4 mb-4">
                            <div className="text-center py-4 text-muted" style={{ fontSize: '0.85rem' }}>
                                No se registran {activeTab.toLowerCase()} para este contacto.
                            </div>
                        </Card>
                    )}




                </Col>

                {/* Columna Derecha (30%) */}
                <Col md={4} className="mb-4">
                    
                    {/* Card de Notas Internas y WhatsApp */}
                    <Card className="border rounded shadow-sm mb-4" style={{ minHeight: '642px', borderRadius: '12px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
                        {/* Cabecera de pestañas */}
                        <div className="card-header bg-light p-2 border-bottom">
                            <ul className="nav nav-pills card-header-pills w-100 mx-0" style={{ fontSize: '0.78rem' }}>
                                <li className="nav-item col-6 px-1 text-center">
                                    <span 
                                        className={`nav-link py-1 d-block ${rightTab === 'WhatsApp' ? 'active bg-success text-white fw-bold' : 'text-muted'}`} 
                                        style={{ cursor: 'pointer', borderRadius: '6px' }} 
                                        onClick={() => setRightTab('WhatsApp')}
                                    >
                                        <i className="bi bi-whatsapp"></i> WhatsApp
                                    </span>
                                </li>
                                <li className="nav-item col-6 px-1 text-center">
                                    <span 
                                        className={`nav-link py-1 d-block ${rightTab === 'Notas' ? 'active bg-primary text-white fw-bold' : 'text-muted'}`} 
                                        style={{ cursor: 'pointer', borderRadius: '6px' }} 
                                        onClick={() => setRightTab('Notas')}
                                    >
                                       <i className="bi bi-journal-text"></i> Notas Internas
                                    </span>
                                </li>
                            </ul>
                        </div>

                        {/* Contenido WhatsApp */}
                        {rightTab === 'WhatsApp' && (
                            <div className="d-flex flex-column h-100 overflow-hidden" style={{ borderRadius: '0 0 12px 12px' }}>
                                <div className="p-2 border-bottom d-flex align-items-center justify-content-between bg-success-subtle text-success-emphasis" style={{ fontSize: '0.78rem' }}>
                                    <div className="d-flex align-items-center gap-2">
                                        <span>📞 +51 {contact && contact.telefonoPrincipal ? contact.telefonoPrincipal : '---'}</span>
                                        <span className="fw-bold text-success">● En Línea</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className="fw-semibold text-muted">Responder:</span>
                                        <button 
                                            onClick={handleToggleAI}
                                            className={`btn btn-xs ${contact && contact.aiActive ? 'btn-primary' : 'btn-outline-secondary'} d-flex align-items-center gap-1`}
                                            style={{ fontSize: '0.7rem', padding: '1px 8px', borderRadius: '20px' }}
                                        >
                                            {contact && contact.aiActive ? (
                                                <>
                                                    <i className="bi bi-cpu-fill"></i> IA
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-person-fill"></i> Manual
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Área de mensajes del Chat */}
                                <div className="p-3" style={{ height: '500px', overflowY: 'auto', backgroundColor: '#efeae2', backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}>
                                    <div className="d-flex flex-column gap-2">
                                        {wspMessages.map((msg, idx) => {
                                            const { images, audios, videos, displayText } = parseMessageMedia(msg.text, API_BASE);

                                            return (
                                                <div 
                                                    key={idx} 
                                                    className={`p-2 rounded shadow-sm ${msg.sender === 'me' ? 'align-self-end text-success-emphasis' : 'align-self-start'}`} 
                                                    style={{ 
                                                        maxWidth: '85%', 
                                                        fontSize: '0.82rem', 
                                                        backgroundColor: msg.sender === 'me' ? '#d9fdd3' : '#ffffff',
                                                        border: msg.sender === 'me' ? 'none' : '1px solid #cbd5e1',
                                                        wordBreak: 'break-word'
                                                    }}
                                                >
                                                    {images.length > 0 && (
                                                        <div className="d-flex flex-wrap gap-2 mb-1">
                                                            {images.map((imgUrl, i) => (
                                                                <img 
                                                                    key={i}
                                                                    src={imgUrl} 
                                                                    alt="WhatsApp Imagen" 
                                                                    className="img-fluid rounded border" 
                                                                    style={{ maxHeight: '160px', maxWidth: images.length > 1 ? '160px' : '100%', objectFit: 'contain', cursor: 'pointer', backgroundColor: '#f1f5f9' }}
                                                                    onClick={() => window.open(imgUrl, '_blank')}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                    {audios.length > 0 && (
                                                        <div className="d-flex flex-column gap-2 py-1 mb-1">
                                                            {audios.map((audUrl, i) => (
                                                                <audio 
                                                                    key={i}
                                                                    src={audUrl} 
                                                                    controls 
                                                                    className="w-100" 
                                                                    style={{ minWidth: '220px', height: '40px' }}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                    {videos.length > 0 && (
                                                        <div className="d-flex flex-column gap-2 mb-1">
                                                            {videos.map((vidUrl, i) => (
                                                                <video 
                                                                    key={i}
                                                                    src={vidUrl} 
                                                                    controls 
                                                                    className="img-fluid rounded border" 
                                                                    style={{ maxHeight: '240px', backgroundColor: '#000000' }}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                    {displayText && (
                                                        <p className="mb-1 text-dark" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{displayText}</p>
                                                    )}
                                                    <div className="d-flex align-items-center justify-content-end gap-1" style={{ marginTop: '2px' }}>
                                                        <small className="text-muted" style={{ fontSize: '0.6rem' }}>{msg.time}</small>
                                                        {msg.sender === 'me' && (
                                                            <span style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center' }}>
                                                                {msg.status === 'READ' && (
                                                                    <i className="bi bi-check2-all" style={{ color: '#53bdeb' }} title="Leído"></i>
                                                                )}
                                                                {msg.status === 'DELIVERED' && (
                                                                    <i className="bi bi-check2-all text-muted" title="Entregado"></i>
                                                                )}
                                                                {(msg.status === 'SENT' || !msg.status) && (
                                                                    <i className="bi bi-check2 text-muted" title="Enviado"></i>
                                                                )}
                                                                {msg.status === 'FAILED' && (
                                                                    <i className="bi bi-exclamation-circle text-danger" title="Error al enviar"></i>
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={chatEndRef} />
                                    </div>
                                </div>

                                {showEmojiPicker && (
                                    <div className="p-2 border-top bg-white d-flex gap-2 justify-content-center flex-wrap" style={{ fontSize: '1.2rem', borderBottom: '1px solid #cbd5e1' }}>
                                        {['😀','😂','😊','😍','😉','👍','🙏','🔥','❤️','🎉','👏','💡','🚀','👀','⚠️'].map(emoji => (
                                            <span 
                                                key={emoji} 
                                                style={{ cursor: 'pointer', userSelect: 'none' }}
                                                onClick={() => {
                                                    setWspInput(prev => prev + emoji);
                                                    setShowEmojiPicker(false);
                                                }}
                                                className="emoji-item px-1"
                                            >
                                                {emoji}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Entrada de mensaje */}
                                <div className="p-2 border-top bg-light d-flex gap-2 align-items-center">
                                    <button 
                                        type="button"
                                        className="btn btn-link p-0 border-0 text-decoration-none"
                                        style={{ fontSize: '1.3rem', cursor: 'pointer', outline: 'none' }}
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        title="Insertar emoticón"
                                    >
                                        😀
                                    </button>

                                    <Form.Control 
                                        type="text" 
                                        className="form-control-sm flex-grow-1" 
                                        placeholder="Escribe un mensaje de WhatsApp..." 
                                        style={{ borderRadius: '20px', fontSize: '0.8rem', padding: '5px 12px', borderColor: '#cbd5e1' }} 
                                        value={wspInput}
                                        onChange={e => setWspInput(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                sendWspMessage();
                                            }
                                        }}
                                    />

                                    <input 
                                         type="file" 
                                         accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain" 
                                         id="wsp-file-upload" 
                                         style={{ display: 'none' }} 
                                         onChange={handleSendFile}
                                     />
                                    <label 
                                        htmlFor="wsp-file-upload" 
                                        className="btn btn-link p-0 border-0 mb-0 d-flex align-items-center justify-content-center text-decoration-none" 
                                        style={{ fontSize: '1.3rem', cursor: 'pointer' }}
                                        title="Adjuntar archivo, imagen, audio o video"
                                    >
                                        <i className="bi bi-paperclip"></i>
                                    </label>

                                    <Button 
                                        variant="success" 
                                        size="sm" 
                                        className="btn-icon rounded-circle d-flex align-items-center justify-content-center" 
                                        style={{ width: '28px', height: '28px', padding: 0 }} 
                                        onClick={sendWspMessage}
                                        disabled={!wspInput.trim()}
                                    >
                                        <span style={{ fontSize: '0.8rem', color: 'white' }}>➡️</span>
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Contenido Notas Internas */}
                        {rightTab === 'Notas' && (
                            <div className="card-body p-3 d-flex flex-column" style={{ minHeight: '350px' }}>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <h6 className="fw-bold text-muted mb-0" style={{ fontSize: '0.8rem' }}>
                                        OBSERVACIONES
                                    </h6>
                                    {!editingNotas ? (
                                        <Button variant="soft-primary" size="sm" style={{ fontSize: '0.72rem', padding: '2px 8px' }} onClick={startEditNotas}>
                                            ✏️ EDITAR
                                        </Button>
                                    ) : (
                                        <div className="d-flex gap-2">
                                            <Button variant="success" size="sm" style={{ fontSize: '0.72rem', padding: '2px 8px' }} onClick={handleSaveNotas}>
                                                <Check size={10} className="me-1" /> Guardar
                                            </Button>
                                            <Button variant="secondary" size="sm" style={{ fontSize: '0.72rem', padding: '2px 8px' }} onClick={() => setEditingNotas(false)}>
                                                <X size={10} className="me-1" /> Cancelar
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {notasError && (
                                    <Alert variant="danger" className="py-1 mb-2" style={{ fontSize: '0.75rem' }}>
                                        {notasError}
                                    </Alert>
                                )}

                                {!editingNotas ? (
                                    <div className="p-3 border rounded bg-light flex-grow-1" style={{ fontSize: '0.82rem', color: '#6c757d', minHeight: '260px' }}>
                                        {contact && contact.referencia ? contact.referencia : "Sin observaciones adicionales."}
                                    </div>
                                ) : (
                                    <Form.Control as="textarea" rows={10} className="p-3 border rounded flex-grow-1" style={{ fontSize: '0.82rem', minHeight: '260px' }}
                                        value={draftNotas} onChange={e => setDraftNotas(e.target.value)} />
                                )}
                            </div>
                        )}
                    </Card>

                    {/* Card de Responsable */}
                    <Card className="border rounded shadow-sm p-3 mb-4">
                        <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-bold text-muted text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}>
                                Responsable Asignado
                            </span>
                            <div className="d-flex align-items-center gap-2">
                                <div style={{
                                    width: 24, height: 24, borderRadius: '50%', background: '#4f46e5',
                                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 700, fontSize: '0.7rem'
                                }}>
                                    A
                                </div>
                                <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>Admin</span>
                            </div>
                        </div>
                    </Card>

                </Col>
            </Row>

            {/* Modal: Agregar Persona Vinculada */}
            <Modal show={showAddPersonModal} onHide={() => setShowAddPersonModal(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title style={{ fontSize: '1.1rem', fontWeight: 600 }}>Agregar Personal Vinculado</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-2">
                    {personModalError && (
                        <Alert variant="danger" className="py-2 mb-3" style={{ fontSize: '0.85rem' }}>
                            {personModalError}
                        </Alert>
                    )}

                    {/* Tab Navigation inside Modal */}
                    <Nav variant="pills" className="nav-justified mb-4" activeKey={personModalTab} onSelect={k => { setPersonModalTab(k); setPersonModalError(null); }}>
                        <Nav.Item>
                            <Nav.Link eventKey="link" style={{ fontSize: '0.85rem' }}>🔗 Vincular Contacto Existente</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="create" style={{ fontSize: '0.85rem' }}>👤 Crear y Vincular Nuevo</Nav.Link>
                        </Nav.Item>
                    </Nav>

                    {personModalTab === 'link' ? (
                        <div>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Seleccionar Persona Natural *</Form.Label>
                                {availablePeople.length === 0 ? (
                                    <div className="text-muted p-2 border rounded bg-light" style={{ fontSize: '0.85rem' }}>
                                        No hay personas naturales disponibles para vincular.
                                    </div>
                                ) : (
                                    <Form.Select value={selectedPersonId} onChange={e => setSelectedPersonId(e.target.value)} style={{ fontSize: '0.85rem' }}>
                                        {availablePeople.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.nombres} {p.apellidos} ({p.tipoDocumento}: {p.numeroDocumento})
                                            </option>
                                        ))}
                                    </Form.Select>
                                )}
                            </Form.Group>

                            <div className="d-flex justify-content-end gap-2 mt-4">
                                <Button variant="secondary" size="sm" onClick={() => setShowAddPersonModal(false)} disabled={personModalSaving}>
                                    Cancelar
                                </Button>
                                <Button variant="primary" size="sm" onClick={handleLinkExistingPerson} disabled={personModalSaving || availablePeople.length === 0}>
                                    {personModalSaving ? 'Vinculando...' : 'Vincular Contacto'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <Row className="gx-3 mb-2">
                                <Col sm={6} className="mb-2">
                                    <Form.Label className="form-label-sm">Nombres *</Form.Label>
                                    <Form.Control size="sm" type="text" placeholder="Nombres" value={newPersonNombres} onChange={e => setNewPersonNombres(e.target.value)} />
                                </Col>
                                <Col sm={6} className="mb-2">
                                    <Form.Label className="form-label-sm">Apellidos *</Form.Label>
                                    <Form.Control size="sm" type="text" placeholder="Apellidos" value={newPersonApellidos} onChange={e => setNewPersonApellidos(e.target.value)} />
                                </Col>
                            </Row>
                            <Row className="gx-3 mb-2">
                                <Col sm={6} className="mb-2">
                                    <Form.Label className="form-label-sm">Tipo Documento *</Form.Label>
                                    <Form.Select size="sm" value={newPersonTipoDoc} onChange={e => setNewPersonTipoDoc(e.target.value)}>
                                        <option value="DNI">DNI</option>
                                        <option value="CE">CE</option>
                                    </Form.Select>
                                </Col>
                                <Col sm={6} className="mb-2">
                                    <Form.Label className="form-label-sm">Número Documento *</Form.Label>
                                    <Form.Control size="sm" type="text" placeholder="Número de documento" value={newPersonNumDoc} onChange={e => setNewPersonNumDoc(e.target.value)} />
                                </Col>
                            </Row>
                            <Row className="gx-3 mb-2">
                                <Col sm={6} className="mb-2">
                                    <Form.Label className="form-label-sm">Celular Principal (9 dígitos) *</Form.Label>
                                    <Form.Control size="sm" type="text" placeholder="999888777" value={newPersonCelular} onChange={e => setNewPersonCelular(e.target.value)} />
                                </Col>
                                <Col sm={6} className="mb-2">
                                    <Form.Label className="form-label-sm">Email</Form.Label>
                                    <Form.Control size="sm" type="email" placeholder="correo@ejemplo.com" value={newPersonEmail} onChange={e => setNewPersonEmail(e.target.value)} />
                                </Col>
                            </Row>

                            <div className="d-flex justify-content-end gap-2 mt-4">
                                <Button variant="secondary" size="sm" onClick={() => setShowAddPersonModal(false)} disabled={personModalSaving}>
                                    Cancelar
                                </Button>
                                <Button variant="primary" size="sm" onClick={handleCreateAndLinkPerson} disabled={personModalSaving}>
                                    {personModalSaving ? 'Guardando...' : 'Crear y Vincular'}
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default ViewContactBody;
