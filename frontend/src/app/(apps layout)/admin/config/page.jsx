"use client"
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, InputGroup, Alert, Spinner } from 'react-bootstrap';
import * as Icons from 'tabler-icons-react';

const getApiBase = () => {
    if (typeof window !== 'undefined') {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        return `${protocol}//${hostname}:8080`;
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
};

const API_BASE = getApiBase();

export default function ConfigPage() {
    const [settings, setSettings] = useState({
        'whatsapp.api.token': '',
        'whatsapp.phone.id': '',
        'whatsapp.verify.token': '',
        'whatsapp.display.number': '',
        'gemini.api.key': '',
        'gemini.system.prompt': ''
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });
    const [showToken, setShowToken] = useState(false);
    const [showGemini, setShowGemini] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/settings`);
                if (res.ok) {
                    const data = await res.json();
                    setSettings({
                        'whatsapp.api.token': data['whatsapp.api.token'] || '',
                        'whatsapp.phone.id': data['whatsapp.phone.id'] || '',
                        'whatsapp.verify.token': data['whatsapp.verify.token'] || '',
                        'whatsapp.display.number': data['whatsapp.display.number'] || '',
                        'gemini.api.key': data['gemini.api.key'] || '',
                        'gemini.system.prompt': data['gemini.system.prompt'] || ''
                    });
                } else {
                    setAlert({ show: true, type: 'danger', message: 'No se pudieron cargar las configuraciones del servidor.' });
                }
            } catch (err) {
                console.error("Error fetching settings:", err);
                setAlert({ show: true, type: 'danger', message: 'Error de red al conectar con el servidor.' });
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setAlert({ show: false, type: 'success', message: '' });

        try {
            const res = await fetch(`${API_BASE}/api/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                setAlert({ show: true, type: 'success', message: 'Configuraciones guardadas exitosamente.' });
                setTimeout(() => {
                    setAlert(prev => ({ ...prev, show: false }));
                }, 5000);
            } else {
                setAlert({ show: true, type: 'danger', message: 'Error en el servidor al intentar guardar.' });
            }
        } catch (err) {
            console.error("Error saving settings:", err);
            setAlert({ show: true, type: 'danger', message: 'Error de conexión al guardar configuraciones.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <div className="text-center">
                    <Spinner animation="border" variant="success" className="mb-2" />
                    <p className="text-muted">Cargando credenciales...</p>
                </div>
            </Container>
        );
    }

    return (
        <Container fluid="xxl" className="pt-7">
            <Row className="mb-4">
                <Col>
                    <div className="hk-pg-header">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="pg-title font-weight-bold" style={{ letterSpacing: '-0.02em' }}>⚙️ Configuración del Sistema</h1>
                                <p className="text-muted">Administra las credenciales de conexión de Meta WhatsApp API y Google Gemini IA para automatizar la mensajería.</p>
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

            <Form onSubmit={handleSave}>
                <Row className="row-cols-1 row-cols-lg-2 g-4">
                    {/* Tarjeta de Meta WhatsApp API */}
                    <Col>
                        <Card className="shadow-sm border-0 h-100" style={{ borderRadius: '12px' }}>
                            <Card.Header className="bg-success-subtle text-success-emphasis border-0 py-3 d-flex align-items-center gap-2" style={{ borderRadius: '12px 12px 0 0' }}>
                                <Icons.BrandWhatsapp size={24} />
                                <h5 className="mb-0 fw-bold">Meta WhatsApp Cloud API</h5>
                            </Card.Header>
                            <Card.Body className="p-4">
                                <p className="text-muted mb-4" style={{ fontSize: '0.85rem' }}>
                                    Configura los parámetros de tu aplicación registrada en el portal de desarrolladores de Meta.
                                </p>

                                <Form.Group className="mb-3" controlId="wspPhoneId">
                                    <Form.Label className="fw-semibold small">Identificador del número de teléfono (Phone Number ID)</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="whatsapp.phone.id"
                                        value={settings['whatsapp.phone.id']}
                                        onChange={handleChange}
                                        placeholder="Ej. 10928374829103"
                                        className="form-control-lg"
                                        style={{ fontSize: '0.9rem' }}
                                    />
                                    <Form.Text className="text-muted small">
                                        Se encuentra en el panel de configuración de WhatsApp dentro de la Consola de Meta Developers.
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="wspDisplayNumber">
                                    <Form.Label className="fw-semibold small">Número de teléfono remitente (Display Number)</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="whatsapp.display.number"
                                        value={settings['whatsapp.display.number']}
                                        onChange={handleChange}
                                        placeholder="Ej. 51931340288"
                                        className="form-control-lg"
                                        style={{ fontSize: '0.9rem' }}
                                    />
                                    <Form.Text className="text-muted small">
                                        {"Número de WhatsApp vinculado a tu API (código de país seguido del número, sin espacios ni '+')."}
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="wspCallbackUrl">
                                    <Form.Label className="fw-semibold small">URL de retorno del Webhook (Callback URL)</Form.Label>
                                    <InputGroup>
                                        <Form.Control
                                            type="text"
                                            value={`${API_BASE}/api/whatsapp/webhook`}
                                            readOnly
                                            className="form-control-lg bg-light"
                                            style={{ fontSize: '0.9rem' }}
                                        />
                                        <Button 
                                            variant="outline-secondary"
                                            onClick={() => {
                                                navigator.clipboard.writeText(`${API_BASE}/api/whatsapp/webhook`);
                                                setAlert({ show: true, type: 'success', message: 'URL copiada al portapapeles.' });
                                                setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 2000);
                                            }}
                                            style={{ borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}
                                        >
                                            <Icons.Copy size={18} />
                                        </Button>
                                    </InputGroup>
                                    <Form.Text className="text-muted small">
                                        Esta es la URL que debes ingresar en la sección de configuración del Webhook de tu app en Meta Developers.
                                        <em> (Si estás en localhost, recuerda usar un túnel como ngrok y usar la URL HTTPS de ngrok).</em>
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="wspVerifyToken">
                                    <Form.Label className="fw-semibold small">Token de verificación del Webhook</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="whatsapp.verify.token"
                                        value={settings['whatsapp.verify.token']}
                                        onChange={handleChange}
                                        placeholder="Ej. nextlead_verify_token"
                                        className="form-control-lg"
                                        style={{ fontSize: '0.9rem' }}
                                    />
                                    <Form.Text className="text-muted small">
                                        La cadena secreta que tú defines y configuras en Meta para validar la recepción de mensajes.
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="wspToken">
                                    <Form.Label className="fw-semibold small">Token de acceso permanente (Access Token)</Form.Label>
                                    <InputGroup>
                                        <Form.Control
                                            type={showToken ? "text" : "password"}
                                            name="whatsapp.api.token"
                                            value={settings['whatsapp.api.token']}
                                            onChange={handleChange}
                                            placeholder="EAAQ6..."
                                            className="form-control-lg"
                                            style={{ fontSize: '0.9rem' }}
                                        />
                                        <Button 
                                            variant="outline-secondary" 
                                            onClick={() => setShowToken(!showToken)}
                                            style={{ borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}
                                        >
                                            {showToken ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
                                        </Button>
                                    </InputGroup>
                                    <Form.Text className="text-muted small">
                                        Token de usuario del sistema (System User Access Token) con permisos de envío de WhatsApp.
                                    </Form.Text>
                                </Form.Group>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Tarjeta de Google Gemini API */}
                    <Col>
                        <Card className="shadow-sm border-0 h-100" style={{ borderRadius: '12px' }}>
                            <Card.Header className="bg-primary-subtle text-primary-emphasis border-0 py-3 d-flex align-items-center gap-2" style={{ borderRadius: '12px 12px 0 0' }}>
                                <Icons.Cpu size={24} />
                                <h5 className="mb-0 fw-bold">Google Gemini AI</h5>
                            </Card.Header>
                            <Card.Body className="p-4 d-flex flex-column justify-content-between">
                                <div>
                                    <p className="text-muted mb-4" style={{ fontSize: '0.85rem' }}>
                                        Configura la clave API de Google Gemini para habilitar el agente inteligente de respuestas automáticas en tu CRM.
                                    </p>

                                    <Form.Group className="mb-3" controlId="geminiKey">
                                        <Form.Label className="fw-semibold small">Google Gemini API Key</Form.Label>
                                        <InputGroup>
                                            <Form.Control
                                                type={showGemini ? "text" : "password"}
                                                name="gemini.api.key"
                                                value={settings['gemini.api.key']}
                                                onChange={handleChange}
                                                placeholder="AIzaSy..."
                                                className="form-control-lg"
                                                style={{ fontSize: '0.9rem' }}
                                            />
                                            <Button 
                                                variant="outline-secondary" 
                                                onClick={() => setShowGemini(!showGemini)}
                                                style={{ borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}
                                            >
                                                {showGemini ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
                                            </Button>
                                        </InputGroup>
                                        <Form.Text className="text-muted small">
                                            Obtén tu API Key gratuita o de pago desde Google AI Studio (generativelanguage.googleapis.com).
                                        </Form.Text>
                                    </Form.Group>

                                    <Form.Group className="mb-3" controlId="geminiPrompt">
                                        <Form.Label className="fw-semibold small">Instrucciones del Agente (System Prompt)</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={6}
                                            name="gemini.system.prompt"
                                            value={settings['gemini.system.prompt']}
                                            onChange={handleChange}
                                            placeholder="Escribe las instrucciones de comportamiento de la IA..."
                                            style={{ fontSize: '0.88rem', lineHeight: '1.4', borderRadius: '8px' }}
                                        />
                                        <Form.Text className="text-muted small">
                                            Define el rol, tono y reglas que el agente de inteligencia artificial debe seguir para responder a los contactos.
                                        </Form.Text>
                                    </Form.Group>
                                </div>

                                <div className="mt-4 p-3 bg-light rounded" style={{ fontSize: '0.8rem' }}>
                                    <div className="d-flex align-items-start gap-2">
                                        <Icons.InfoCircle size={20} className="text-primary mt-0.5" />
                                        <div>
                                            <span className="fw-semibold text-dark">¿Cómo funciona la IA?</span>
                                            <p className="text-muted mb-0 mt-1">
                                                Al recibir un mensaje de texto de un cliente, si la API Key está configurada, Gemini 1.5 Flash generará una respuesta muy concisa en segundo plano y la enviará de vuelta al WhatsApp del cliente automáticamente.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Row className="mt-4 mb-5">
                    <Col className="d-flex justify-content-end gap-3">
                        <Button 
                            variant="success" 
                            type="submit" 
                            size="lg" 
                            disabled={saving}
                            className="px-5 d-flex align-items-center gap-2"
                            style={{ borderRadius: '8px', fontWeight: 'bold' }}
                        >
                            {saving ? (
                                <>
                                    <Spinner animation="border" size="sm" />
                                    <span>Guardando...</span>
                                </>
                            ) : (
                                <>
                                    <Icons.DeviceFloppy size={20} />
                                    <span>Guardar Configuración</span>
                                </>
                            )}
                        </Button>
                    </Col>
                </Row>
            </Form>
        </Container>
    );
}
