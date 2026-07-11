'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Row, Col, Form, Button, Spinner, InputGroup, Card, Badge } from 'react-bootstrap';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { Send, Search, User, AlertCircle, RefreshCw, MessageSquare } from 'react-feather';
import SimpleBar from 'simplebar-react';

const getApiBase = () => {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
        return `${window.location.protocol}//${hostname}:8081`;
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8081';
};
const API_BASE = getApiBase();

const ContactLiveChats = ({ contacts = [] }) => {
    // State management
    const [chatsList, setChatsList] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [wspMessages, setWspMessages] = useState([]);
    const [wspInput, setWspInput] = useState('');
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingConversation, setLoadingConversation] = useState(false);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    const messagesEndRef = useRef(null);

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
    const initializeChatsList = useCallback(async () => {
        setLoadingChats(true);
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

                const displayName = contact.tipoPersona === 'NATURAL'
                    ? `${contact.nombres || ''} ${contact.apellidos || ''}`.trim()
                    : (contact.razonSocial || '');

                const initials = contact.tipoPersona === 'NATURAL'
                    ? `${(contact.nombres || '?')[0]}${(contact.apellidos || '?')[0]}`
                    : (contact.razonSocial || '?')[0];

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
            setLoadingChats(false);
        }
    }, [contacts]);

    // Initialize list when component mounts or contacts change
    useEffect(() => {
        if (contacts.length > 0) {
            initializeChatsList();
        }
    }, [contacts, initializeChatsList]);

    // Load active conversation details
    const selectChat = async (contact) => {
        setSelectedContact(contact);
        setLoadingConversation(true);
        setWspMessages([]);
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

    // Toggle AI for selected contact
    const handleToggleAI = async () => {
        if (!selectedContact || !selectedContact.id) return;
        try {
            const res = await fetch(`${API_BASE}/api/contacts/${selectedContact.id}/toggle-ai`, {
                method: 'PUT'
            });
            if (res.ok) {
                const data = await res.json();
                // Update selected contact
                setSelectedContact(prev => ({ ...prev, aiActive: data.aiActive }));
                // Update list
                setChatsList(prev => prev.map(c => c.id === selectedContact.id ? { ...c, aiActive: data.aiActive } : c));
            }
        } catch (err) {
            console.error("Error alternando la IA:", err);
        }
    };

    // Send manual message
    const sendWspMessage = async () => {
        if (!wspInput.trim() || !selectedContact || !selectedContact.telefonoPrincipal) return;
        
        const phone = cleanPhoneNumber(selectedContact.telefonoPrincipal);
        const textToSend = wspInput;
        setWspInput('');
        setSending(true);

        // Optimistic update of local conversation
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
                    sender: 'system',
                    receiver: phone,
                    messageText: textToSend
                })
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

    // Filter chat list by search term
    const filteredChats = chatsList.filter(chat => {
        return chat.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
               (chat.telefonoPrincipal && chat.telefonoPrincipal.includes(searchQuery));
    });

    return (
        <Card className="shadow-sm border-0 rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 210px)', minHeight: '500px' }}>
            <Row className="g-0 h-100">
                {/* Panel Izquierdo: Lista de Chats */}
                <Col md={4} className="border-end d-flex flex-column h-100 bg-light">
                    <div className="p-3 border-bottom bg-white">
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
                    </div>

                    <SimpleBar style={{ flex: 1 }} className="px-1 py-2">
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
                            filteredChats.map((chat) => {
                                const isSelected = selectedContact && selectedContact.id === chat.id;
                                const isAiActive = chat.aiActive;
                                return (
                                    <div
                                        key={chat.id}
                                        onClick={() => selectChat(chat)}
                                        className={`d-flex align-items-center p-3 mb-1 mx-2 rounded-lg cursor-pointer transition-all ${
                                            isSelected ? 'bg-primary text-white shadow-sm' : 'bg-white hover-soft-bg border-bottom'
                                        }`}
                                        style={{ 
                                            cursor: 'pointer',
                                            borderRadius: '8px',
                                            transition: 'all 0.15s ease-in-out'
                                        }}
                                    >
                                        {/* Avatar */}
                                        <div 
                                            className={`avatar avatar-sm rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0 bg-soft-${chat.avtBg} text-${chat.avtBg}`}
                                            style={{ 
                                                width: '40px', 
                                                height: '40px', 
                                                fontWeight: 'bold', 
                                                fontSize: '0.9rem',
                                                backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : undefined,
                                                color: isSelected ? '#ffffff' : undefined
                                            }}
                                        >
                                            {chat.initials}
                                        </div>

                                        {/* Chat Info */}
                                        <div className="flex-grow-1 overflow-hidden" style={{ minWidth: 0 }}>
                                            <div className="d-flex align-items-center justify-content-between mb-1">
                                                <h6 className={`mb-0 text-truncate font-weight-bold ${isSelected ? 'text-white' : 'text-dark'}`} style={{ fontSize: '0.9rem' }}>
                                                    {chat.displayName}
                                                </h6>
                                                {chat.lastMessage && (
                                                    <span className={`small flex-shrink-0 ms-2 ${isSelected ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: '0.72rem' }}>
                                                        {new Date(chat.lastMessage.timestamp).toLocaleDateString([], { hour: '2-digit', minute: '2-digit' }) === new Date().toLocaleDateString([], { hour: '2-digit', minute: '2-digit' }) 
                                                            ? chat.lastMessage.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                            : chat.lastMessage.timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' })
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                            <div className="d-flex align-items-center justify-content-between">
                                                <p className={`mb-0 text-truncate ${isSelected ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: '0.8rem' }}>
                                                    {chat.lastMessage ? chat.lastMessage.text : 'Sin mensajes'}
                                                </p>
                                                <div className="d-flex align-items-center ms-2 flex-shrink-0">
                                                    {isAiActive && (
                                                        <Badge bg={isSelected ? 'light' : 'success'} text={isSelected ? 'primary' : 'light'} className="d-flex align-items-center py-1 px-2" style={{ fontSize: '0.65rem' }}>
                                                            <i className="bi bi-cpu-fill me-1" style={{ fontSize: '0.7rem' }}></i> IA
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </SimpleBar>
                    
                    <div className="p-2 border-top bg-white d-flex justify-content-between align-items-center">
                        <span className="text-muted small ps-2" style={{ fontSize: '0.75rem' }}>
                            {filteredChats.length} clientes
                        </span>
                        <Button variant="outline-secondary" size="xs" onClick={initializeChatsList} title="Recargar lista" className="border-0 py-1">
                            <RefreshCw size={12} className="me-1" /> Actualizar
                        </Button>
                    </div>
                </Col>

                {/* Panel Derecho: Chat Activo */}
                <Col md={8} className="d-flex flex-column h-100 bg-white">
                    {selectedContact ? (
                        <>
                            {/* Cabecera del Chat */}
                            <div className="p-3 border-bottom d-flex align-items-center justify-content-between bg-white shadow-sm z-index-1">
                                <div className="d-flex align-items-center">
                                    <div 
                                        className={`avatar avatar-sm rounded-circle d-flex align-items-center justify-content-center me-3 bg-soft-${selectedContact.avtBg} text-${selectedContact.avtBg}`}
                                        style={{ width: '40px', height: '40px', fontWeight: 'bold' }}
                                    >
                                        {selectedContact.initials}
                                    </div>
                                    <div>
                                        <h6 className="mb-0 text-dark font-weight-bold" style={{ fontSize: '0.95rem' }}>{selectedContact.displayName}</h6>
                                        <span className="text-muted small" style={{ fontSize: '0.78rem' }}>
                                            🟢 Teléfono: {selectedContact.telefonoPrincipal}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* IA Toggle Button */}
                                <div className="d-flex align-items-center">
                                    <div className="d-flex align-items-center me-3 border rounded-pill py-1 px-3 bg-light">
                                        <i className={`bi bi-cpu-fill me-2 ${selectedContact.aiActive ? 'text-success' : 'text-muted'}`} style={{ fontSize: '1.05rem' }}></i>
                                        <span className="small text-muted me-2" style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                                            Responder con IA (Gemini)
                                        </span>
                                        <Form.Check 
                                            type="switch"
                                            id="ai-toggle-chats"
                                            checked={selectedContact.aiActive || false}
                                            onChange={handleToggleAI}
                                            className="m-0 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Mensajes del Chat */}
                            <div className="flex-grow-1 p-3 bg-light overflow-auto" style={{ overflowY: 'scroll', maxHeight: 'calc(100% - 130px)' }}>
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
                                    <div className="d-flex flex-column gap-2">
                                        {wspMessages.map((msg, idx) => {
                                            const isMe = msg.sender === 'me';
                                            const isSystem = msg.sender === 'SYSTEM';

                                            if (isSystem) {
                                                return (
                                                    <div key={msg.id || idx} className="d-flex justify-content-center my-2">
                                                        <span className="badge bg-soft-warning text-warning border border-warning-20 px-3 py-1 rounded-pill small" style={{ fontSize: '0.75rem', maxWidth: '85%' }}>
                                                            {msg.text}
                                                        </span>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div 
                                                    key={msg.id || idx} 
                                                    className={`d-flex ${isMe ? 'justify-content-end' : 'justify-content-start'}`}
                                                >
                                                    <div 
                                                        className={`p-2 rounded-lg position-relative ${
                                                            isMe 
                                                                ? 'bg-primary text-white' 
                                                                : 'bg-white text-dark shadow-sm border'
                                                        }`}
                                                        style={{ 
                                                            maxWidth: '75%', 
                                                            borderRadius: isMe ? '12px 12px 0 12px' : '12px 12px 12px 0',
                                                            padding: '8px 12px'
                                                        }}
                                                    >
                                                        <p className="mb-1 style-message-text" style={{ fontSize: '0.85rem', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                                                            {msg.text}
                                                        </p>
                                                        <div className="d-flex justify-content-end align-items-center gap-1">
                                                            <span className="small text-white-50" style={{ fontSize: '0.65rem', color: isMe ? 'rgba(255,255,255,0.7)' : '#9e9e9e' }}>
                                                                {msg.time}
                                                            </span>
                                                            {isMe && (
                                                                <span className="ms-1 d-inline-flex">
                                                                    {msg.status === 'READ' ? (
                                                                        <span className="text-info d-flex" style={{ fontSize: '0.65rem' }}>✓✓</span>
                                                                    ) : msg.status === 'DELIVERED' ? (
                                                                        <span className="text-white-50 d-flex" style={{ fontSize: '0.65rem' }}>✓✓</span>
                                                                    ) : msg.status === 'SENT' ? (
                                                                        <span className="text-white-50 d-flex" style={{ fontSize: '0.65rem' }}>✓</span>
                                                                    ) : msg.status === 'FAILED' ? (
                                                                        <AlertCircle size={10} className="text-danger" />
                                                                    ) : (
                                                                        <span className="text-white-50 d-flex" style={{ fontSize: '0.65rem' }}>✓</span>
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </div>

                            {/* Caja de Texto del Chat */}
                            <div className="p-3 border-top bg-white">
                                <InputGroup>
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
                                        className="rounded-circle ms-2 p-2 d-flex align-items-center justify-content-center"
                                        style={{ width: '40px', height: '40px' }}
                                    >
                                        <Send size={16} />
                                    </Button>
                                </InputGroup>
                            </div>
                        </>
                    ) : (
                        <div className="d-flex justify-content-center align-items-center h-100 flex-column text-muted py-5 bg-light">
                            <div className="bg-white p-4 rounded-circle shadow-sm mb-3">
                                <MessageSquare size={48} className="text-primary" />
                            </div>
                            <h5 className="text-dark font-weight-bold">Chats en Vivo de WhatsApp</h5>
                            <p className="small text-muted px-4 text-center" style={{ maxWidth: '350px' }}>
                                Selecciona un cliente de la lista de la izquierda para ver su conversación, responderle en tiempo real y gestionar la IA.
                            </p>
                        </div>
                    )}
                </Col>
            </Row>
        </Card>
    );
};

export default ContactLiveChats;
