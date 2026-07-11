'use client';
import { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Badge, Spinner, Alert, ListGroup } from 'react-bootstrap';
import { Mail, Phone, Calendar, User, Briefcase, Hash, Globe, Star } from 'react-feather';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8081';

const Avatar = ({ contact }) => {
    if (!contact) return null;
    const initials = contact.tipoPersona === 'NATURAL'
        ? `${(contact.nombres || '?')[0]}${(contact.apellidos || '?')[0]}`
        : (contact.razonSocial || '?')[0];
    const colors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed'];
    const color = colors[(contact.id || 0) % colors.length];
    return (
        <div style={{
            width: 72, height: 72, borderRadius: '50%', background: color,
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '1.6rem', margin: '0 auto 12px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
        }}>
            {initials.toUpperCase()}
        </div>
    );
};

const ContactDetailsModal = ({ show, onHide, contact, onToggleStar }) => {
    const [direcciones, setDirecciones] = useState([]);
    const [linkedPersonas, setLinkedPersonas] = useState([]);
    const [loadingAddresses, setLoadingAddresses] = useState(false);
    const [loadingPersonas, setLoadingPersonas] = useState(false);
    const [selectedDir, setSelectedDir] = useState(null);

    useEffect(() => {
        if (!show || !contact) return;

        // Cargar direcciones del contacto
        setLoadingAddresses(true);
        fetch(`${API_BASE}/api/contacts/${contact.id}/addresses`)
            .then(r => r.json())
            .then(data => {
                setDirecciones(data);
                if (data.length > 0) {
                    setSelectedDir(data[0]);
                } else {
                    setSelectedDir(null);
                }
            })
            .catch(() => {
                setDirecciones([]);
                setSelectedDir(null);
            })
            .finally(() => setLoadingAddresses(false));

        // Si es una empresa, cargar las personas naturales asociadas a ella
        if (contact.tipoPersona === 'EMPRESA') {
            setLoadingPersonas(true);
            fetch(`${API_BASE}/api/contacts/${contact.id}/personas`)
                .then(r => r.json())
                .then(data => setLinkedPersonas(Array.isArray(data) ? data : []))
                .catch(() => setLinkedPersonas([]))
                .finally(() => setLoadingPersonas(false));
        } else {
            setLinkedPersonas([]);
        }
    }, [show, contact]);

    if (!contact) return null;

    const nombreCompleto = contact.tipoPersona === 'NATURAL'
        ? `${contact.nombres || ''} ${contact.apellidos || ''}`.trim()
        : contact.razonSocial || '';

    const fechaStr = contact.dateCreated
        ? new Date(contact.dateCreated).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '—';

    const parsedLat = selectedDir ? parseFloat(selectedDir.latitud) : null;
    const parsedLng = selectedDir ? parseFloat(selectedDir.longitud) : null;
    const mapUrl = (selectedDir && !isNaN(parsedLat) && !isNaN(parsedLng) && parsedLat !== null && parsedLng !== null)
        ? `https://www.openstreetmap.org/export/embed.html?bbox=${parsedLng - 0.005},${parsedLat - 0.005},${parsedLng + 0.005},${parsedLat + 0.005}&layer=mapnik&marker=${parsedLat},${parsedLng}`
        : null;

    return (
        <Modal show={show} onHide={onHide} centered size="xl" className="contact-detail-modal">
            <Modal.Header closeButton className="px-4 py-3">
                <Modal.Title className="d-flex align-items-center gap-2" style={{ fontSize: '1.25rem' }}>
                    <span>👁️ Detalles de Contacto</span>
                    <button className="btn btn-link p-0 ms-2" onClick={() => onToggleStar && onToggleStar(contact)}
                        style={{ fontSize: 20, lineHeight: 1, color: contact.starred ? '#f59e0b' : '#d1d5db', border: 'none', background: 'none' }}
                        title={contact.starred ? "Quitar de favoritos" : "Marcar como favorito"}>
                        ★
                    </button>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-0">
                <Row className="g-0" style={{ minHeight: 520 }}>
                    {/* Perfil del Contacto */}
                    <Col lg={4} className="border-end bg-light p-4" style={{ maxHeight: '78vh', overflowY: 'auto' }}>
                        <div className="text-center mb-4">
                            <Avatar contact={contact} />
                            <h4 className="fw-bold mb-1 text-dark" style={{ fontSize: '1.2rem', lineHeight: 1.3 }}>{nombreCompleto}</h4>
                            <Badge bg={contact.tipoPersona === 'NATURAL' ? 'info' : 'secondary'} className="px-2.5 py-1.5" style={{ fontSize: '0.75rem' }}>
                                {contact.tipoPersona === 'NATURAL' ? '👤 Persona Natural' : '🏢 Empresa'}
                            </Badge>
                        </div>

                        <div className="mb-4">
                            <div className="text-uppercase text-muted fw-bold mb-2 style-label" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>Identificación</div>
                            <div className="d-flex align-items-center mb-2">
                                <Hash className="text-secondary me-2" size={16} />
                                <span className="text-dark fw-semibold me-1" style={{ fontSize: '0.85rem' }}>{contact.tipoDocumento}:</span>
                                <span className="text-muted" style={{ fontSize: '0.85rem' }}>{contact.numeroDocumento}</span>
                            </div>
                            <div className="d-flex align-items-center mb-2">
                                <Calendar className="text-secondary me-2" size={16} />
                                <span className="text-dark fw-semibold me-1" style={{ fontSize: '0.85rem' }}>Creado:</span>
                                <span className="text-muted" style={{ fontSize: '0.85rem' }}>{fechaStr}</span>
                            </div>
                        </div>

                        <div className="mb-4">
                            <div className="text-uppercase text-muted fw-bold mb-2 style-label" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>Información de Contacto</div>
                            <div className="d-flex align-items-center mb-2">
                                <Phone className="text-secondary me-2" size={16} />
                                <span className="text-dark fw-semibold me-1" style={{ fontSize: '0.85rem' }}>Teléfono 1:</span>
                                <a href={`https://wa.me/51${contact.telefonoPrincipal}`} target="_blank" rel="noopener noreferrer" className="text-decoration-none" style={{ fontSize: '0.85rem' }}>
                                    +51 {contact.telefonoPrincipal} 🟢
                                </a>
                            </div>
                            {contact.telefonoSecundario && (
                                <div className="d-flex align-items-center mb-2">
                                    <Phone className="text-secondary me-2" size={16} />
                                    <span className="text-dark fw-semibold me-1" style={{ fontSize: '0.85rem' }}>Teléfono 2:</span>
                                    <span className="text-muted" style={{ fontSize: '0.85rem' }}>+51 {contact.telefonoSecundario}</span>
                                </div>
                            )}
                            {contact.email && (
                                <div className="d-flex align-items-center mb-2">
                                    <Mail className="text-secondary me-2" size={16} />
                                    <span className="text-dark fw-semibold me-1" style={{ fontSize: '0.85rem' }}>Email:</span>
                                    <a href={`mailto:${contact.email}`} className="text-truncate text-decoration-none" style={{ fontSize: '0.85rem', maxWidth: '80%' }}>
                                        {contact.email}
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Relación - Persona Natural Vinculada a Empresa */}
                        {contact.tipoPersona === 'NATURAL' && contact.empresaNombre && (
                            <div className="mb-4">
                                <div className="text-uppercase text-muted fw-bold mb-2 style-label" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>Empresa Vinculada</div>
                                <div className="p-2 border rounded bg-white d-flex align-items-center">
                                    <Briefcase className="text-primary me-2" size={18} />
                                    <div>
                                        <div className="fw-bold text-dark" style={{ fontSize: '0.8rem' }}>{contact.empresaNombre}</div>
                                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>Empresa asociada</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Relación - Empresa con Personas Vinculadas */}
                        {contact.tipoPersona === 'EMPRESA' && (
                            <div>
                                <div className="text-uppercase text-muted fw-bold mb-2 style-label" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>Contactos Vinculados</div>
                                {loadingPersonas && <div className="text-center py-2"><Spinner animation="border" size="sm" /></div>}
                                {!loadingPersonas && linkedPersonas.length === 0 && (
                                    <div className="text-muted" style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>Sin personas vinculadas.</div>
                                )}
                                {!loadingPersonas && linkedPersonas.length > 0 && (
                                    <ListGroup variant="flush" className="bg-white border rounded">
                                        {linkedPersonas.map(p => (
                                            <ListGroup.Item key={p.id} className="py-2 px-3 d-flex align-items-center justify-content-between" style={{ fontSize: '0.8rem' }}>
                                                <div className="d-flex align-items-center gap-2">
                                                    <span style={{ fontSize: '1rem' }}>👤</span>
                                                    <div>
                                                        <div className="fw-semibold text-dark">{p.nombres} {p.apellidos}</div>
                                                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>{p.tipoDocumento}: {p.numeroDocumento}</div>
                                                    </div>
                                                </div>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                )}
                            </div>
                        )}
                    </Col>

                    {/* Direcciones y Mapa */}
                    <Col lg={8} className="p-0 d-flex flex-column" style={{ maxHeight: '78vh' }}>
                        <div className="p-3 border-bottom bg-white d-flex justify-content-between align-items-center">
                            <span className="fw-bold text-dark">📍 Direcciones y Mapa</span>
                            <Badge bg="secondary">{direcciones.length} dirección(es)</Badge>
                        </div>

                        {loadingAddresses && (
                            <div className="d-flex align-items-center justify-content-center flex-grow-1 py-5">
                                <Spinner animation="border" />
                            </div>
                        )}

                        {!loadingAddresses && direcciones.length === 0 && (
                            <div className="d-flex align-items-center justify-content-center flex-grow-1 p-4 text-muted">
                                <Alert variant="info" className="mb-0">Este contacto no tiene direcciones registradas.</Alert>
                            </div>
                        )}

                        {!loadingAddresses && direcciones.length > 0 && (
                            <Row className="g-0 flex-grow-1">
                                {/* Lista de Direcciones */}
                                <Col md={5} className="border-end" style={{ overflowY: 'auto', maxHeight: '68vh', padding: '16px' }}>
                                    {direcciones.map((dir, i) => (
                                        <div key={dir.idDireccion}
                                            onClick={() => setSelectedDir(dir)}
                                            style={{
                                                cursor: 'pointer', padding: '12px', borderRadius: 8, marginBottom: 8,
                                                background: selectedDir?.idDireccion === dir.idDireccion ? '#f0f4ff' : '#ffffff',
                                                border: selectedDir?.idDireccion === dir.idDireccion ? '1.5px solid #4f46e5' : '1px solid #e5e7eb',
                                                transition: 'all 0.15s',
                                                boxShadow: selectedDir?.idDireccion === dir.idDireccion ? '0 2px 4px rgba(79, 70, 229, 0.1)' : 'none'
                                            }}>
                                            <div className="fw-semibold text-primary" style={{ fontSize: '0.85rem' }}>
                                                📍 {dir.nombreUbicacion}
                                            </div>
                                            {dir.departamento && (
                                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>
                                                    {dir.departamento} › {dir.provincia} › {dir.distrito}
                                                    {dir.codigoUbigeo && <span className="ms-1 text-muted">[{dir.codigoUbigeo}]</span>}
                                                </div>
                                            )}
                                            <div style={{ fontSize: '0.8rem', marginTop: 4, color: '#374151' }}>{dir.direccionCompleta}</div>
                                            {dir.referencia && (
                                                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>Ref: {dir.referencia}</div>
                                            )}
                                            {(() => {
                                                const parsedLat = parseFloat(dir?.latitud);
                                                const parsedLng = parseFloat(dir?.longitud);
                                                return !isNaN(parsedLat) && !isNaN(parsedLng) && (
                                                    <div className="d-flex align-items-center mt-2" style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                                                        <Globe size={12} className="me-1" /> {parsedLat.toFixed(5)}, {parsedLng.toFixed(5)}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    ))}
                                </Col>

                                {/* Mapa */}
                                <Col md={7} className="bg-light position-relative" style={{ minHeight: 380 }}>
                                    {mapUrl ? (
                                        <iframe
                                            key={selectedDir?.idDireccion}
                                            src={mapUrl}
                                            width="100%" height="100%"
                                            style={{ border: 'none', minHeight: 380, height: '100%' }}
                                            title="Mapa de ubicación"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="d-flex align-items-center justify-content-center h-100 text-muted" style={{ minHeight: 350 }}>
                                            <div className="text-center p-4">
                                                <div style={{ fontSize: 48 }}>🗺️</div>
                                                <p className="mt-2 mb-0">Esta dirección no cuenta con coordenadas GPS registradas.</p>
                                            </div>
                                        </div>
                                    )}
                                </Col>
                            </Row>
                        )}
                    </Col>
                </Row>
            </Modal.Body>
            <Modal.Footer className="px-4 py-3 bg-white">
                <Button variant="secondary" onClick={onHide}>Cerrar</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ContactDetailsModal;
