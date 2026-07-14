'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Row, Col, Form, Button, Spinner, InputGroup, Card, Badge, ListGroup } from 'react-bootstrap';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { Send, Search, User, AlertCircle, RefreshCw, MessageSquare } from 'react-feather';
import SimpleBar from 'simplebar-react';
import classNames from 'classnames';

const getApiBase = () => {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
        return `${window.location.protocol}//${hostname}:8081`;
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8081';
};
const API_BASE = getApiBase();

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
    console.log("Parsed media in ContactLiveChats:", { images, audios, videos, displayText, rawText: msgText });
    return { images, audios, videos, displayText };
};

const ContactLiveChats = ({ contacts = [], isQrLine = false }) => {
    // State management
    const [chatsList, setChatsList] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [wspMessages, setWspMessages] = useState([]);
    const [wspInput, setWspInput] = useState('');
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingConversation, setLoadingConversation] = useState(false);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [chatFilter, setChatFilter] = useState('all'); // 'all' | 'unread' | 'unanswered'
    
    const [cannedSearch, setCannedSearch] = useState('');
    const [customResponses, setCustomResponses] = useState([]);
    const [newTitle, setNewTitle] = useState('');
    const [newText, setNewText] = useState('');
    const [isAddingCanned, setIsAddingCanned] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('nextlead_canned_responses');
            if (saved) {
                try {
                    setCustomResponses(JSON.parse(saved));
                } catch (e) {
                    console.error("Error parsing custom responses:", e);
                }
            }
        }
    }, []);

    const saveCustomResponse = (title, text) => {
        if (!title.trim() || !text.trim()) return;
        const newResponse = {
            id: 'c_' + Date.now(),
            title: title.trim(),
            text: text.trim()
        };
        const updated = [...customResponses, newResponse];
        setCustomResponses(updated);
        localStorage.setItem('nextlead_canned_responses', JSON.stringify(updated));
        setNewTitle('');
        setNewText('');
        setIsAddingCanned(false);
    };

    const deleteCustomResponse = (id) => {
        const updated = customResponses.filter(r => r.id !== id);
        setCustomResponses(updated);
        localStorage.setItem('nextlead_canned_responses', JSON.stringify(updated));
    };

    const defaultCanned = [
        { id: 'd1', title: '👋 Saludo Inicial', text: '¡Hola! Qué gusto saludarte. ¿En qué te puedo ayudar hoy?' },
        { id: 'd2', title: '💳 Datos de Pago', text: 'Nuestros métodos de pago son:\n- Yape/Plin: 999 999 999 (NextLead CRM)\n- Banco BCP Ahorros: 191-XXXXXXXX-X-XX\nFavor de enviar el comprobante de pago una vez realizado.' },
        { id: 'd3', title: '🕒 Horario de Atención', text: 'Nuestro horario de atención es de Lunes a Viernes de 9:00 AM a 6:00 PM y Sábados de 9:00 AM a 1:00 PM.' },
        { id: 'd4', title: '📍 Dirección Principal', text: 'Nuestra oficina principal está ubicada en Av. Javier Prado Este 1234, San Isidro, Lima.' },
        { id: 'd5', title: '🙏 Despedida', text: '¡Muchas gracias por contactarnos! Que tengas un excelente día. Quedamos a tu servicio.' }
    ];

    const allCanned = [...defaultCanned, ...customResponses];
    
    const filteredCanned = allCanned.filter(r => 
        r.title.toLowerCase().includes(cannedSearch.toLowerCase()) || 
        r.text.toLowerCase().includes(cannedSearch.toLowerCase())
    );
    
    const messagesEndRef = useRef(null);
    const hasInitializedRef = useRef(false);

    // Helper to clean phone numbers to digits only
    const cleanPhoneNumber = (phone) => {
        if (!phone) return '';
        return phone.replace(/\D/g, '');
    };

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [wspMessages]);

    // Build the conversations list with their last messages
    const initializeChatsList = useCallback(async (isInitial = false) => {
        if (isInitial) {
            setLoadingChats(true);
        }
        try {
            // 1. Fetch all messages in DB
            const res = await fetch(`${API_BASE}/api/messages`);
            if (!res.ok) throw new Error("No se pudieron cargar los mensajes");
            const allMessages = await res.json();

            // 2. Map contacts and find their last message
            const mappedChats = contacts.map(contact => {
                if (!contact.telefonoPrincipal) return null;
                const phone = cleanPhoneNumber(contact.telefonoPrincipal);
                const last9 = phone.length >= 9 ? phone.substring(phone.length - 9) : phone;

                // Filter messages belonging to this contact
                const contactMessages = allMessages.filter(msg => {
                    const senderLast9 = msg.sender.length >= 9 ? msg.sender.substring(msg.sender.length - 9) : msg.sender;
                    const receiverLast9 = msg.receiver.length >= 9 ? msg.receiver.substring(msg.receiver.length - 9) : msg.receiver;
                    return senderLast9 === last9 || receiverLast9 === last9;
                });

                // Get the most recent message
                let lastMessage = null;
                if (contactMessages.length > 0) {
                    // Sort descending
                    contactMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                    lastMessage = contactMessages[0];
                }

                let displayName = contact.tipoPersona === 'NATURAL'
                    ? `${contact.nombres || ''} ${contact.apellidos || ''}`.trim()
                    : (contact.razonSocial || '');

                if (displayName === 'Cliente WhatsApp' || displayName === 'Cliente' || !displayName) {
                    displayName = contact.telefonoPrincipal || 'WhatsApp';
                }

                let initials = '';
                if (displayName === contact.telefonoPrincipal) {
                    initials = '#';
                } else {
                    initials = contact.tipoPersona === 'NATURAL'
                        ? `${(contact.nombres || '?')[0]}${(contact.apellidos || '?')[0]}`
                        : (contact.razonSocial || '?')[0];
                }

                const colors = ['info', 'warning', 'success', 'danger', 'primary', 'violet'];
                const avtBg = colors[(contact.id || 0) % colors.length];

                return {
                    ...contact,
                    displayName,
                    initials: initials.toUpperCase(),
                    avtBg,
                    lastMessage: lastMessage ? {
                        text: lastMessage.messageText,
                        timestamp: new Date(lastMessage.timestamp),
                        status: lastMessage.status,
                        sender: lastMessage.sender
                    } : null
                };
            }).filter(Boolean);

            // Fallback: si no hay contactos cargados todavía, construir la lista desde los mensajes
            // guardados para que el chat siga siendo navegable mientras el sync termina de crear contactos.
            if (mappedChats.length === 0 && allMessages.length > 0) {
                const groupedByPhone = new Map();

                allMessages.forEach((msg) => {
                    const sender = cleanPhoneNumber(msg.sender || '');
                    const receiver = cleanPhoneNumber(msg.receiver || '');
                    const keyPhone = sender && sender !== 'SYSTEM' ? sender : receiver;
                    if (!keyPhone) return;

                    const groupKey = keyPhone.length >= 9 ? keyPhone.substring(keyPhone.length - 9) : keyPhone;
                    const existing = groupedByPhone.get(groupKey) || [];
                    existing.push(msg);
                    groupedByPhone.set(groupKey, existing);
                });

                const fallbackChats = Array.from(groupedByPhone.entries()).map(([last9, messages]) => {
                    messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                    const lastMessage = messages[0];
                    const fallbackName = last9 || 'WhatsApp';
                    const initials = fallbackName.slice(-2).toUpperCase();

                    return {
                        id: last9,
                        telefonoPrincipal: last9,
                        tipoPersona: 'NATURAL',
                        nombres: 'Chat',
                        apellidos: fallbackName,
                        razonSocial: '',
                        displayName: fallbackName,
                        initials,
                        avtBg: 'primary',
                        aiActive: false,
                        lastMessage: {
                            text: lastMessage.messageText,
                            timestamp: new Date(lastMessage.timestamp),
                            status: lastMessage.status,
                            sender: lastMessage.sender
                        }
                    };
                });

                fallbackChats.sort((a, b) => {
                    if (a.lastMessage && b.lastMessage) {
                        return b.lastMessage.timestamp - a.lastMessage.timestamp;
                    }
                    if (a.lastMessage) return -1;
                    if (b.lastMessage) return 1;
                    return 0;
                });

                setChatsList(fallbackChats);
                return;
            }

            // 3. Sort by last message date desc (contacts without messages go to the bottom)
            mappedChats.sort((a, b) => {
                if (a.lastMessage && b.lastMessage) {
                    return b.lastMessage.timestamp - a.lastMessage.timestamp;
                }
                if (a.lastMessage) return -1;
                if (b.lastMessage) return 1;
                return 0;
            });

            setChatsList(mappedChats);
        } catch (err) {
            console.error("Error inicializando lista de chats:", err);
        } finally {
            if (isInitial) {
                setLoadingChats(false);
            }
        }
    }, [contacts]);

    // Initialize list when component mounts or contacts change
    useEffect(() => {
        if (!hasInitializedRef.current) {
            initializeChatsList(true);
            hasInitializedRef.current = true;
        } else {
            initializeChatsList(false);
        }
    }, [contacts, initializeChatsList]);

    // Load active conversation details
    const selectChat = async (contact) => {
        setSelectedContact(contact);
        setLoadingConversation(true);
        setWspMessages([]);
        
        // Mark as read locally in the chatsList
        setChatsList(prev => prev.map(c => {
            if (c.id === contact.id && c.lastMessage && c.lastMessage.sender !== 'me') {
                return {
                    ...c,
                    lastMessage: {
                        ...c.lastMessage,
                        status: 'READ'
                    }
                };
            }
            return c;
        }));
        const phone = cleanPhoneNumber(contact.telefonoPrincipal);
        const contactLast9 = phone.length >= 9 ? phone.substring(phone.length - 9) : phone;

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
            console.error("Error al cargar conversación:", err);
        } finally {
            setLoadingConversation(false);
        }
    };



    // Send manual message
    const sendWspMessage = async () => {
        if (!wspInput.trim() || !selectedContact || !selectedContact.telefonoPrincipal) return;
        
        const phone = cleanPhoneNumber(selectedContact.telefonoPrincipal);
        const textToSend = wspInput;
        setWspInput('');
        setSending(true);

        if (!isQrLine) {
            // Optimistic update of local conversation
            const newMsg = {
                sender: 'me',
                text: textToSend,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setWspMessages(prev => [...prev, newMsg]);
        }

        try {
            const sendUrl = isQrLine ? `http://localhost:8082/api/send` : `${API_BASE}/api/messages`;
            const sendBody = isQrLine 
                ? { phone: phone, text: textToSend }
                : { sender: 'system', receiver: phone, messageText: textToSend };

            const res = await fetch(sendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sendBody)
            });

            if (!res.ok) {
                console.error("Error al enviar mensaje");
            }
        } catch (err) {
            console.error("Error de red al enviar mensaje:", err);
        } finally {
            setSending(false);
        }
    };

    // Handle WebSocket for live updates
    useEffect(() => {
        let stompClient = null;
        try {
            stompClient = new Client({
                webSocketFactory: () => new SockJS(`${API_BASE}/ws-message`),
                debug: (str) => {
                    // console.log('STOMP Global Debug:', str);
                },
                reconnectDelay: 5000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
            });

            stompClient.onConnect = () => {
                console.log('WebSocket Global de WhatsApp conectado en /topic/chat/global-updates');
                
                // Subscribe to global updates
                stompClient.subscribe('/topic/chat/global-updates', (message) => {
                    try {
                        const body = JSON.parse(message.body);
                        
                        // Parse sender and clean phone numbers
                        const bodySender = body.sender;
                        const bodyReceiver = body.receiver;
                        
                        const senderClean = cleanPhoneNumber(bodySender);
                        const receiverClean = cleanPhoneNumber(bodyReceiver);
                        
                        const senderLast9 = senderClean.length >= 9 ? senderClean.substring(senderClean.length - 9) : senderClean;
                        const receiverLast9 = receiverClean.length >= 9 ? receiverClean.substring(receiverClean.length - 9) : receiverClean;

                        // Find which contact this message belongs to
                        // It could match the sender (incoming message) or receiver (outgoing message)
                        setChatsList(prevList => {
                            let matchContactIndex = -1;
                            const newList = prevList.map((contact, idx) => {
                                const contactPhone = cleanPhoneNumber(contact.telefonoPrincipal);
                                const contactLast9 = contactPhone.length >= 9 ? contactPhone.substring(contactPhone.length - 9) : contactPhone;
                                
                                if (senderLast9 === contactLast9 || receiverLast9 === contactLast9) {
                                    matchContactIndex = idx;
                                    // Update last message data
                                    return {
                                        ...contact,
                                        lastMessage: {
                                            text: body.messageText,
                                            timestamp: new Date(body.timestamp),
                                            status: body.status,
                                            sender: body.sender
                                        }
                                    };
                                }
                                return contact;
                            });

                            // Reorder list if we found a match: put matched contact at the top
                            if (matchContactIndex !== -1) {
                                const matched = newList[matchContactIndex];
                                const remaining = newList.filter((_, idx) => idx !== matchContactIndex);
                                return [matched, ...remaining];
                            }
                            return prevList;
                        });

                        // If the message belongs to the currently active selected contact, append it to the chat box
                        if (selectedContact) {
                            const activePhone = cleanPhoneNumber(selectedContact.telefonoPrincipal);
                            const activeLast9 = activePhone.length >= 9 ? activePhone.substring(activePhone.length - 9) : activePhone;
                            
                            // Does this message correspond to our active conversation?
                            if (senderLast9 === activeLast9 || receiverLast9 === activeLast9) {
                                const isMe = senderLast9 !== activeLast9; // If sender is not the contact, it must be me
                                
                                setWspMessages(prev => {
                                    // Avoid duplicating optimistic messages or status updates
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

                                    // If not found, look for optimistic match for my messages
                                    if (isMe) {
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

                                    return [...prev, {
                                        id: body.id,
                                        wamid: body.wamid,
                                        sender: isMe ? 'me' : 'contact',
                                        text: body.messageText,
                                        time: new Date(body.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                        status: body.status
                                    }];
                                });
                            }
                        }
                    } catch (e) {
                        console.error("Error parsing STOMP global update:", e);
                    }
                });
            };

            stompClient.onStompError = (frame) => {
                console.error('STOMP Global Error:', frame.headers['message'], frame.body);
            };

            stompClient.activate();
        } catch (e) {
            console.error("Error starting WebSocket:", e);
        }

        return () => {
            if (stompClient) {
                stompClient.deactivate();
                console.log('WebSocket Global de WhatsApp desactivado.');
            }
        };
    }, [selectedContact]);

    // Handle pressing Enter to send message
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendWspMessage();
        }
    };

    // Filter chat list by search term and filter category
    const filteredChats = chatsList.filter(chat => {
        const matchesSearch = chat.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
               (chat.telefonoPrincipal && chat.telefonoPrincipal.includes(searchQuery));
               
        if (!matchesSearch) return false;

        if (chatFilter === 'unread') {
            // Unread: Last message exists, is from the contact, and status is not READ
            return chat.lastMessage && chat.lastMessage.sender !== 'me' && chat.lastMessage.status !== 'READ';
        }
        
        if (chatFilter === 'unanswered') {
            // Unanswered: Last message exists and is from the contact (not replied yet)
            return chat.lastMessage && chat.lastMessage.sender !== 'me';
        }

        return true;
    });

    return (
        <div className="chatapp-wrap chatapp-info-active" style={{ height: 'calc(100vh - 210px)', minHeight: '550px' }}>
            <div className="chatapp-content">
                {/* Panel Izquierdo: Lista de Chats */}
                <div className="chatapp-aside">
                    <header className="aside-header">
                        <div className="d-flex align-items-center justify-content-between w-100">
                            <h1 className="h4 mb-0 fw-bold">Chats</h1>
                            <Button variant="flush-dark" size="xs" onClick={() => initializeChatsList(true)} title="Actualizar lista" className="btn-icon btn-rounded flush-soft-hover">
                                <RefreshCw size={14} />
                            </Button>
                        </div>
                    </header>
                    
                    <div className="p-3 border-bottom bg-white d-flex flex-column gap-2">
                        <InputGroup size="sm">
                            <InputGroup.Text className="bg-light border-0">
                                <Search size={14} className="text-muted" />
                            </InputGroup.Text>
                            <Form.Control
                                type="text"
                                placeholder="Buscar chat por nombre o tel..."
                                className="bg-light border-0 ps-0"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <Button variant="light" size="sm" onClick={() => setSearchQuery('')} className="border-0">
                                    ×
                                </Button>
                            )}
                        </InputGroup>
                        
                        {/* Filtros de mensajes */}
                        <div className="d-flex gap-1">
                            <Button 
                                variant={chatFilter === 'all' ? 'primary' : 'light'} 
                                size="xs" 
                                onClick={() => setChatFilter('all')}
                                className="rounded-pill px-3 py-1 fw-500"
                                style={{ fontSize: '0.7rem' }}
                            >
                                Todos
                            </Button>
                            <Button 
                                variant={chatFilter === 'unread' ? 'primary' : 'light'} 
                                size="xs" 
                                onClick={() => setChatFilter('unread')}
                                className="rounded-pill px-3 py-1 fw-500"
                                style={{ fontSize: '0.7rem' }}
                            >
                                No leídos
                            </Button>
                            <Button 
                                variant={chatFilter === 'unanswered' ? 'primary' : 'light'} 
                                size="xs" 
                                onClick={() => setChatFilter('unanswered')}
                                className="rounded-pill px-3 py-1 fw-500"
                                style={{ fontSize: '0.7rem' }}
                            >
                                No respondidos
                            </Button>
                        </div>
                    </div>

                    <div className="aside-body">
                        <SimpleBar style={{ height: "100%" }} className="nicescroll-bar">
                            {loadingChats ? (
                                <div className="text-center py-5">
                                    <Spinner size="sm" animation="border" className="text-primary me-2" />
                                    <span className="text-muted" style={{ fontSize: '0.85rem' }}>Cargando chats...</span>
                                </div>
                            ) : filteredChats.length === 0 ? (
                                <div className="text-center py-5 px-3">
                                    <AlertCircle size={28} className="text-muted mb-2" />
                                    <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                                        {searchQuery ? 'No se encontraron resultados' : 'No hay conversaciones registradas'}
                                    </p>
                                </div>
                            ) : (
                                <ListGroup variant="flush" className="chat-contacts-list">
                                    {filteredChats.map((chat) => {
                                        const isSelected = selectedContact && selectedContact.id === chat.id;
                                        const isAiActive = chat.aiActive;
                                        return (
                                            <ListGroup.Item 
                                                key={chat.id} 
                                                onClick={() => selectChat(chat)}
                                                className="border-0 p-0"
                                            >
                                                <div className={classNames("media", { "active-user": isSelected }, { "read-chat": true })}>
                                                    <div className="media-head">
                                                        <div className={`avatar avatar-sm avatar-${chat.avtBg} avatar-rounded`}>
                                                            <span className="initial-wrap">{chat.initials}</span>
                                                        </div>
                                                    </div>

                                                    <div className="media-body">
                                                        <div>
                                                            <div className="user-name text-truncate">
                                                                {chat.displayName}
                                                            </div>
                                                            <div className="user-last-chat text-truncate text-muted">
                                                                {chat.lastMessage ? chat.lastMessage.text : 'Sin mensajes'}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="last-chat-time">
                                                                {chat.lastMessage && (
                                                                    <>
                                                                        {new Date(chat.lastMessage.timestamp).toLocaleDateString([], { hour: '2-digit', minute: '2-digit' }) === new Date().toLocaleDateString([], { hour: '2-digit', minute: '2-digit' }) 
                                                                            ? chat.lastMessage.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                                            : chat.lastMessage.timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' })
                                                                        }
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </ListGroup.Item>
                                        );
                                    })}
                                </ListGroup>
                            )}
                        </SimpleBar>
                    </div>
                </div>

                {/* Panel Derecho: Chat Activo */}
                <div className="chatapp-single-chat">
                    {selectedContact ? (
                        <>
                            {/* Cabecera del Chat */}
                            <header className="chat-header">
                                <div className="d-flex align-items-center justify-content-between w-100">
                                    <div className="media d-flex align-items-center">
                                        <div 
                                            className={`avatar avatar-sm rounded-circle d-flex align-items-center justify-content-center me-3 bg-soft-${selectedContact.avtBg} text-${selectedContact.avtBg}`}
                                            style={{ width: '40px', height: '40px', fontWeight: 'bold' }}
                                        >
                                            {selectedContact.initials}
                                        </div>
                                        <div className="media-body">
                                            <h6 className="user-name mb-0 fw-bold">{selectedContact.displayName}</h6>
                                            <span className="user-status text-muted small" style={{ fontSize: '0.78rem' }}>
                                                🟢 Teléfono: {selectedContact.telefonoPrincipal}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Status Badge */}
                                    <div className="d-flex align-items-center me-2">
                                        <span className="badge bg-soft-success text-success border border-success-20 px-3 py-1.5 rounded-pill small d-flex align-items-center gap-1.5" style={{ fontSize: '0.78rem', fontWeight: '500' }}>
                                            <span className="d-inline-block rounded-circle bg-success" style={{ width: '6px', height: '6px' }}></span>
                                            Sincronizado
                                        </span>
                                    </div>
                                </div>
                            </header>

                            {/* Mensajes del Chat */}
                            <SimpleBar style={{ height: "calc(100% - 130px)" }} id="chat_body" className="chat-body">
                                {loadingConversation ? (
                                    <div className="d-flex justify-content-center align-items-center h-100 flex-column">
                                        <Spinner animation="border" className="text-primary mb-2" />
                                        <span className="text-muted small">Cargando conversación...</span>
                                    </div>
                                ) : wspMessages.length === 0 ? (
                                    <div className="d-flex justify-content-center align-items-center h-100 flex-column text-muted py-5">
                                        <MessageSquare size={32} className="mb-2 text-muted-50" />
                                        <p className="small mb-0">No hay mensajes previos en esta conversación</p>
                                        <p className="small text-muted-50">¡Envía un mensaje para comenzar la conversación!</p>
                                    </div>
                                ) : (
                                    <ul className="list-unstyled chat-single-list">
                                        {wspMessages.map((msg, idx) => {
                                            const isMe = msg.sender === 'me';
                                            const isSystem = msg.sender === 'SYSTEM';

                                            if (isSystem) {
                                                return (
                                                    <li key={msg.id || idx} className="d-flex justify-content-center my-2 list-unstyled">
                                                        <span className="badge bg-soft-warning text-warning border border-warning-20 px-3 py-1 rounded-pill small" style={{ fontSize: '0.75rem', maxWidth: '85%' }}>
                                                            {msg.text}
                                                        </span>
                                                    </li>
                                                );
                                            }

                                            // Parsear contenido multimedia
                                            const { images, audios, videos, displayText } = parseMessageMedia(msg.text, API_BASE);

                                            return (
                                                <li 
                                                    key={msg.id || idx} 
                                                    className={`media ${isMe ? 'sent' : 'received'}`}
                                                >
                                                    {!isMe && (
                                                        <div className={`avatar avatar-xs avatar-${selectedContact.avtBg} avatar-rounded`}>
                                                            <span className="initial-wrap">{selectedContact.initials}</span>
                                                        </div>
                                                    )}
                                                    <div className="media-body">
                                                        <div className="msg-box">
                                                            <div>
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
                                                                    <div className="d-flex flex-column gap-2 mb-1 py-1">
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
                                                                    <p className="style-message-text mb-1" style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                                                                        {displayText}
                                                                    </p>
                                                                )}
                                                                <span className="chat-time d-flex align-items-center justify-content-end gap-1">
                                                                    {msg.time}
                                                                    {isMe && (
                                                                        <span className="d-inline-flex">
                                                                            {msg.status === 'READ' ? (
                                                                                <span className="text-info" style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>✓✓</span>
                                                                            ) : msg.status === 'DELIVERED' ? (
                                                                                <span className="text-muted" style={{ fontSize: '0.7rem' }}>✓✓</span>
                                                                            ) : (
                                                                                <span className="text-muted" style={{ fontSize: '0.7rem' }}>✓</span>
                                                                            )}
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </ul>
                                )}
                            </SimpleBar>

                            {/* Caja de Texto del Chat */}
                            <footer className="chat-footer">
                                <InputGroup className="w-100 align-items-center">
                                    <Form.Control
                                        type="text"
                                        placeholder="Escribe tu mensaje de WhatsApp..."
                                        value={wspInput}
                                        onChange={(e) => setWspInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        disabled={sending}
                                        className="border-0 bg-light rounded-pill ps-4 py-2"
                                        style={{ fontSize: '0.88rem' }}
                                    />

                                    <Button 
                                        variant="primary" 
                                        onClick={sendWspMessage} 
                                        disabled={!wspInput.trim() || sending}
                                        className="rounded-circle ms-2 p-0 d-flex align-items-center justify-content-center"
                                        style={{ width: '40px', height: '40px' }}
                                    >
                                        <Send size={16} />
                                    </Button>
                                </InputGroup>
                            </footer>

                            {/* Panel Derecho: Respuestas Rápidas */}
                            <div className="chat-info" style={{ display: 'block', borderLeft: '1px solid #eaeaea', width: '320px', backgroundColor: '#fcfcfc' }}>
                                <SimpleBar style={{ height: "100%" }} className="nicescroll-bar">
                                    <div className="p-3">
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <h6 className="fw-bold mb-0 text-dark d-flex align-items-center" style={{ fontSize: '0.9rem' }}>
                                                <i className="bi bi-chat-left-text-fill text-primary me-2"></i>
                                                Respuestas Rápidas
                                            </h6>
                                            <Button 
                                                variant="outline-primary" 
                                                size="sm" 
                                                onClick={() => setIsAddingCanned(!isAddingCanned)}
                                                className="rounded-pill px-2 py-0.5"
                                                style={{ fontSize: '0.72rem', fontWeight: '600' }}
                                            >
                                                {isAddingCanned ? 'Cancelar' : '+ Nueva'}
                                            </Button>
                                        </div>

                                        {isAddingCanned && (
                                            <Card className="border border-primary-30 shadow-none bg-light-soft mb-3">
                                                <Card.Body className="p-3">
                                                    <span className="fw-bold text-dark d-block mb-2" style={{ fontSize: '0.78rem' }}>
                                                        Crear Respuesta Rápida
                                                    </span>
                                                    <div className="d-flex flex-column gap-2" style={{ fontSize: '0.8rem' }}>
                                                        <div>
                                                            <Form.Label className="text-muted small mb-1">Título / Atajo:</Form.Label>
                                                            <Form.Control 
                                                                type="text" 
                                                                size="sm" 
                                                                placeholder="Ej. Cuenta BCP"
                                                                value={newTitle} 
                                                                onChange={(e) => setNewTitle(e.target.value)} 
                                                            />
                                                        </div>
                                                        <div>
                                                            <Form.Label className="text-muted small mb-1">Mensaje de Respuesta:</Form.Label>
                                                            <Form.Control 
                                                                as="textarea" 
                                                                rows={3}
                                                                size="sm" 
                                                                placeholder="Escribe el mensaje aquí..."
                                                                value={newText} 
                                                                onChange={(e) => setNewText(e.target.value)} 
                                                            />
                                                        </div>
                                                        <Button 
                                                            variant="primary" 
                                                            size="sm" 
                                                            className="mt-1 w-100 py-1"
                                                            style={{ fontSize: '0.75rem', fontWeight: '600' }}
                                                            onClick={() => saveCustomResponse(newTitle, newText)}
                                                            disabled={!newTitle.trim() || !newText.trim()}
                                                        >
                                                            Guardar Respuesta
                                                        </Button>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        )}

                                        <div className="mb-3">
                                            <InputGroup size="sm">
                                                <InputGroup.Text className="bg-white border-end-0">
                                                    <Search size={12} className="text-muted" />
                                                </InputGroup.Text>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Buscar respuesta..."
                                                    className="border-start-0 bg-white ps-0"
                                                    value={cannedSearch}
                                                    onChange={(e) => setCannedSearch(e.target.value)}
                                                />
                                                {cannedSearch && (
                                                    <Button variant="outline-light" size="sm" onClick={() => setCannedSearch('')} className="border-start-0 border-light text-muted">
                                                        ×
                                                    </Button>
                                                )}
                                            </InputGroup>
                                        </div>

                                        <div className="d-flex flex-column gap-2">
                                            {filteredCanned.length === 0 ? (
                                                <div className="text-center py-4 text-muted" style={{ fontSize: '0.8rem' }}>
                                                    No se encontraron respuestas.
                                                </div>
                                            ) : (
                                                filteredCanned.map((canned) => (
                                                    <Card key={canned.id} className="border-light shadow-none bg-white mb-0 hover-shadow-sm transition-all" style={{ border: '1px solid #eee' }}>
                                                        <Card.Body className="p-2.5">
                                                            <div className="d-flex justify-content-between align-items-start mb-1">
                                                                <span className="fw-bold text-dark" style={{ fontSize: '0.8rem' }}>{canned.title}</span>
                                                                {canned.id.toString().startsWith('c_') && (
                                                                    <Button 
                                                                        variant="flush-dark" 
                                                                        size="xs" 
                                                                        className="p-0 border-0 text-muted hover-danger bg-transparent"
                                                                        onClick={() => deleteCustomResponse(canned.id)}
                                                                        title="Eliminar"
                                                                    >
                                                                        <i className="bi bi-trash-fill" style={{ fontSize: '0.72rem' }}></i>
                                                                    </Button>
                                                                )}
                                                            </div>
                                                            <p className="text-muted mb-2 text-wrap-pre" style={{ fontSize: '0.75rem', lineHeight: '1.4', whiteSpace: 'pre-wrap', maxHeight: '100px', overflowY: 'auto' }}>
                                                                {canned.text}
                                                            </p>
                                                            <Button 
                                                                variant="outline-primary" 
                                                                size="sm" 
                                                                className="w-100 py-1" 
                                                                style={{ fontSize: '0.72rem', fontWeight: '500' }}
                                                                onClick={() => setWspInput(canned.text)}
                                                            >
                                                                Usar en chat
                                                            </Button>
                                                        </Card.Body>
                                                    </Card>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </SimpleBar>
                            </div>
                        </>
                    ) : (
                        <div className="d-flex justify-content-center align-items-center h-100 flex-column text-muted py-5 bg-light-soft">
                            <div className="bg-white p-4 rounded-circle shadow-sm mb-3">
                                <MessageSquare size={48} className="text-primary" />
                            </div>
                            <h5 className="text-dark font-weight-bold">Chats en Vivo de WhatsApp</h5>
                            <p className="small text-muted px-4 text-center" style={{ maxWidth: '350px' }}>
                                Selecciona un cliente de la lista de la izquierda para ver su conversación, responderle en tiempo real y gestionar la IA.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContactLiveChats;
