'use client'

import React from 'react';
import { Card, Button, Row, Col, ListGroup } from 'react-bootstrap';
import { AlertCircle, Chrome, ExternalLink, HelpCircle, CheckCircle, MessageSquare } from 'react-feather';

const Chats = () => {
    const handleOpenWhatsApp = () => {
        window.open('https://web.whatsapp.com', '_blank');
    };

    return (
        <div className="d-flex flex-column h-100 w-100 p-4" style={{ background: '#f3f4f6', minHeight: 'calc(100vh - 80px)' }}>
            
            {/* Header Title */}
            <div className="mb-4">
                <h3 className="fw-bold text-dark mb-1">Centro de Integración de WhatsApp</h3>
                <p className="text-secondary">Sincroniza tus contactos de WhatsApp con el CRM y chatea utilizando tus respuestas rápidas sin salir de la plataforma oficial.</p>
            </div>

            <Row className="g-4">
                {/* Left Panel: Installation Instructions */}
                <Col lg={7}>
                    <Card className="shadow-sm border-0 h-100" style={{ borderRadius: '16px' }}>
                        <Card.Body className="p-4">
                            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                                <Chrome size={22} className="text-primary" />
                                Guía de Configuración de la Extensión (Solo 1 vez)
                            </h5>

                            <div className="d-flex flex-column gap-4">
                                <div className="d-flex gap-3">
                                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '28px', height: '28px', fontSize: '14px', fontWeight: 'bold' }}>1</div>
                                    <div>
                                        <h6 className="fw-semibold mb-1 text-dark">Activa el Modo de Desarrollador</h6>
                                        <p className="text-secondary mb-0" style={{ fontSize: '13px' }}>
                                            Abre una nueva pestaña en tu navegador Google Chrome y escribe la dirección: 
                                            <code className="bg-light px-2 py-1 rounded ms-1 text-danger fw-semibold" style={{ fontSize: '12px' }}>chrome://extensions</code>. 
                                            Una vez allí, activa el interruptor de <strong>"Modo de desarrollador"</strong> en la esquina superior derecha.
                                        </p>
                                    </div>
                                </div>

                                <div className="d-flex gap-3">
                                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '28px', height: '28px', fontSize: '14px', fontWeight: 'bold' }}>2</div>
                                    <div>
                                        <h6 className="fw-semibold mb-1 text-dark">Carga la Extensión en el Navegador</h6>
                                        <p className="text-secondary mb-0" style={{ fontSize: '13px' }}>
                                            Haz clic en el botón <strong>"Cargar descomprimida"</strong> (esquina superior izquierda) y selecciona la carpeta del proyecto ubicada en tu PC: 
                                            <br />
                                            <code className="bg-light d-inline-block px-2 py-1 rounded mt-1 text-dark text-break" style={{ fontSize: '11px' }}>C:\Proyectos\CRM_WHATAPP\nextlead\chrome-extension</code>
                                        </p>
                                    </div>
                                </div>

                                <div className="d-flex gap-3">
                                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '28px', height: '28px', fontSize: '14px', fontWeight: 'bold' }}>3</div>
                                    <div>
                                        <h6 className="fw-semibold mb-1 text-dark">¡Listo para Operar!</h6>
                                        <p className="text-secondary mb-0" style={{ fontSize: '13px' }}>
                                            Una vez cargada, verás la extensión <strong>NextLead CRM - WhatsApp Extension</strong> activa. Ahora abre tu chat de WhatsApp Web oficial haciendo clic en el botón verde de abajo y verás tu barra lateral del CRM acoplada en pantalla.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <hr className="my-4 text-muted opacity-25" />

                            <div className="text-center py-2">
                                <Button 
                                    onClick={handleOpenWhatsApp} 
                                    className="btn-success border-0 px-4 py-3 fw-bold shadow-sm d-inline-flex align-items-center gap-2" 
                                    style={{ borderRadius: '12px', background: '#25D366', fontSize: '15px' }}
                                >
                                    Conectar e Ir a WhatsApp Web Oficial
                                    <ExternalLink size={18} />
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Right Panel: CRM Connection Info & Features Preview */}
                <Col lg={5}>
                    <div className="d-flex flex-column gap-4 h-100">
                        {/* Status Card */}
                        <Card className="shadow-sm border-0" style={{ borderRadius: '16px' }}>
                            <Card.Body className="p-4">
                                <h5 className="fw-bold mb-3 text-dark">Estado del Servidor API</h5>
                                <div className="d-flex align-items-center gap-2 py-2 px-3 bg-light rounded-3 text-dark" style={{ fontSize: '13px' }}>
                                    <CheckCircle size={16} className="text-success" />
                                    <span>Servidor API del CRM escuchando en el puerto <strong>8081</strong></span>
                                </div>
                            </Card.Body>
                        </Card>

                        {/* What you can do Card */}
                        <Card className="shadow-sm border-0 flex-grow-1" style={{ borderRadius: '16px' }}>
                            <Card.Body className="p-4 d-flex flex-column justify-content-between">
                                <div>
                                    <h5 className="fw-bold mb-3 text-dark">Funcionalidades de la Extensión</h5>
                                    <ListGroup variant="flush">
                                        <ListGroup.Item className="px-0 bg-transparent py-2.5 border-0 d-flex gap-2.5 align-items-start" style={{ fontSize: '13px' }}>
                                            <CheckCircle size={15} className="text-primary mt-0.5 flex-shrink-0" />
                                            <span><strong>Sincronización Inteligente:</strong> Al hacer clic en un chat, el CRM detecta el contacto y te muestra sus datos automáticamente.</span>
                                        </ListGroup.Item>
                                        <ListGroup.Item className="px-0 bg-transparent py-2.5 border-0 d-flex gap-2.5 align-items-start" style={{ fontSize: '13px' }}>
                                            <CheckCircle size={15} className="text-primary mt-0.5 flex-shrink-0" />
                                            <span><strong>Respuestas Rápidas Directas:</strong> Inserta plantillas predefinidas en el cuadro de mensaje oficial con un solo clic.</span>
                                        </ListGroup.Item>
                                        <ListGroup.Item className="px-0 bg-transparent py-2.5 border-0 d-flex gap-2.5 align-items-start" style={{ fontSize: '13px' }}>
                                            <CheckCircle size={15} className="text-primary mt-0.5 flex-shrink-0" />
                                            <span><strong>Notas en Tiempo Real:</strong> Guarda notas del cliente en tu CRM de forma directa sin salir del chat.</span>
                                        </ListGroup.Item>
                                    </ListGroup>
                                </div>

                                <Card className="bg-soft-primary border-0 mt-4" style={{ borderRadius: '12px' }}>
                                    <Card.Body className="p-3 d-flex align-items-start gap-2.5 text-primary">
                                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                                        <span style={{ fontSize: '12px', lineHeight: '1.4' }}>
                                            <strong>¿Por qué este método?</strong> Es el método más seguro contra baneos, ya que la comunicación se realiza a través de tu propia sesión oficial autorizada por ti en Chrome.
                                        </span>
                                    </Card.Body>
                                </Card>
                            </Card.Body>
                        </Card>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default Chats;
