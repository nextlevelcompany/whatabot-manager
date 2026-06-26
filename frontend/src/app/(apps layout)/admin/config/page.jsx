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

export default function ConfigPage() {
    const [activeTab, setActiveTab] = useState('general');

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
        'ai.max.quota': '30'
    });

    // AI Products Config States
    const [productsConfig, setProductsConfig] = useState([]);
    
    // Shipping Coverage States
    const [shippingCoverage, setShippingCoverage] = useState([]);
    const [newCoverage, setNewCoverage] = useState({ districtName: '', deliveryFee: 0, minOrderAmount: 0, isActive: true });
    const [showCoverageModal, setShowCoverageModal] = useState(false);

    // Knowledge Base FAQ States
    const [knowledgeBase, setKnowledgeBase] = useState([]);
    const [newFaq, setNewFaq] = useState({ category: '', keywords: '', answer: '', attachmentUrl: '', attachmentType: 'NONE' });
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
                    setSettings(prev => ({
                        ...prev,
                        ...settingsData
                    }));
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

    const showAlert = (type, message) => {
        setAlert({ show: true, type, message });
        setTimeout(() => {
            setAlert(prev => ({ ...prev, show: false }));
        }, 5000);
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
                showAlert('success', 'Configuraciones generales guardadas exitosamente.');
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

    // Products Config Handlers
    const handleProductToggle = (index) => {
        const updated = [...productsConfig];
        updated[index].aiEnabled = !updated[index].aiEnabled;
        setProductsConfig(updated);
    };

    const handleProductTextChange = (index, field, value) => {
        const updated = [...productsConfig];
        updated[index][field] = value;
        setProductsConfig(updated);
    };

    const handleSaveProducts = async () => {
        setSaving(true);
        try {
            // Guardamos cada uno de los productos que tienen cambios en el listado
            for (let prod of productsConfig) {
                await fetch(`${API_BASE}/api/ai/products-config`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        productoId: prod.productoId,
                        aiEnabled: prod.aiEnabled,
                        searchKeywords: prod.searchKeywords || '',
                        customAiDescription: prod.customAiDescription || ''
                    })
                });
            }
            showAlert('success', 'Catálogo de IA actualizado correctamente.');
        } catch (err) {
            console.error(err);
            showAlert('danger', 'Error de conexión al actualizar catálogo.');
        } finally {
            setSaving(false);
        }
    };

    // Shipping Coverage Handlers
    const handleAddCoverage = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/api/ai/shipping-coverage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCoverage)
            });
            if (res.ok) {
                const updatedRes = await fetch(`${API_BASE}/api/ai/shipping-coverage`);
                if (updatedRes.ok) setShippingCoverage(await updatedRes.json());
                setShowCoverageModal(false);
                setNewCoverage({ districtName: '', deliveryFee: 0, minOrderAmount: 0, isActive: true });
                showAlert('success', 'Zona de despacho agregada correctamente.');
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

    // FAQs (Knowledge Base) Handlers
    const handleAddFaq = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/api/ai/knowledge-base`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newFaq)
            });
            if (res.ok) {
                const updatedRes = await fetch(`${API_BASE}/api/ai/knowledge-base`);
                if (updatedRes.ok) setKnowledgeBase(await updatedRes.json());
                setShowFaqModal(false);
                setNewFaq({ category: '', keywords: '', answer: '', attachmentUrl: '', attachmentType: 'NONE' });
                showAlert('success', 'Pregunta frecuente agregada exitosamente.');
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
        <Container fluid="xxl" className="pt-7">
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
                {/* PESTAÑA 1: CONFIGURACIÓN GENERAL */}
                <Tab eventKey="general" title={<span><Icons.Settings size={18} className="me-1" /> General</span>}>
                    <Form onSubmit={handleSaveGeneral}>
                        <Row className="row-cols-1 row-cols-lg-2 g-4">
                            {/* Ajustes de Identidad IA */}
                            <Col>
                                <Card className="shadow-sm border-0 h-100" style={{ borderRadius: '12px' }}>
                                    <Card.Header className="bg-primary-subtle text-primary-emphasis border-0 py-3 d-flex align-items-center gap-2" style={{ borderRadius: '12px 12px 0 0' }}>
                                        <Icons.User size={24} />
                                        <h5 className="mb-0 fw-bold">Identidad del Agente de IA</h5>
                                    </Card.Header>
                                    <Card.Body className="p-4">
                                        <Form.Group className="mb-4 d-flex align-items-center justify-content-between p-3 bg-light rounded" controlId="aiActive">
                                            <div>
                                                <Form.Label className="fw-bold mb-0 d-block">🟢 Agente de IA Activo</Form.Label>
                                                <Form.Text className="text-muted small">Enciende o apaga las respuestas automáticas globales por WhatsApp.</Form.Text>
                                            </div>
                                            <Form.Check
                                                type="switch"
                                                id="ai-active-switch"
                                                checked={settings['ai.active'] === 'true'}
                                                onChange={(e) => setSettings(prev => ({ ...prev, 'ai.active': e.target.checked ? 'true' : 'false' }))}
                                                style={{ fontSize: '1.5rem', cursor: 'pointer' }}
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
                                                className="form-control-lg"
                                                style={{ fontSize: '0.9rem' }}
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3" controlId="aiBusinessDesc">
                                            <Form.Label className="fw-semibold small">Giro / Descripción del Negocio</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                name="ai.business.description"
                                                value={settings['ai.business.description']}
                                                onChange={handleSettingChange}
                                                placeholder="Ej. Empresa peruana distribuidora de agua alcalina ionizada pH 8.2 con delivery gratis..."
                                                style={{ fontSize: '0.9rem' }}
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3" controlId="aiTone">
                                            <Form.Label className="fw-semibold small">Tono de Comunicación</Form.Label>
                                            <Form.Select
                                                name="ai.tone"
                                                value={settings['ai.tone']}
                                                onChange={handleSettingChange}
                                                className="form-control-lg"
                                                style={{ fontSize: '0.9rem' }}
                                            >
                                                <option value="Amigable y cercano">Amigable y cercano</option>
                                                <option value="Profesional y formal">Profesional y formal</option>
                                                <option value="Directo y conciso">Directo y conciso</option>
                                                <option value="Entusiasta y alegre">Entusiasta y alegre</option>
                                            </Form.Select>
                                        </Form.Group>

                                        <Form.Group className="mb-3" controlId="aiMaxQuota">
                                            <Form.Label className="fw-semibold small">Límite diario de respuestas automáticas (por cliente)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                name="ai.max.quota"
                                                value={settings['ai.max.quota'] || '30'}
                                                onChange={handleSettingChange}
                                                placeholder="Ej. 30"
                                                min="1"
                                                max="500"
                                                className="form-control-lg"
                                                style={{ fontSize: '0.9rem' }}
                                            />
                                            <Form.Text className="text-muted small">
                                                Desactiva el chatbot para un contacto si supera esta cantidad de respuestas del bot en 24h para evitar bucles de spam.
                                            </Form.Text>
                                        </Form.Group>
                                    </Card.Body>
                                </Card>
                            </Col>

                            {/* Ajustes de Google Gemini API */}
                            <Col>
                                <Card className="shadow-sm border-0 h-100" style={{ borderRadius: '12px' }}>
                                    <Card.Header className="bg-success-subtle text-success-emphasis border-0 py-3 d-flex align-items-center gap-2" style={{ borderRadius: '12px 12px 0 0' }}>
                                        <Icons.Cpu size={24} />
                                        <h5 className="mb-0 fw-bold">Google Gemini AI & Reglas</h5>
                                    </Card.Header>
                                    <Card.Body className="p-4">
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
                                                className="form-control-lg mb-2"
                                                style={{ fontSize: '0.9rem' }}
                                            >
                                                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Recomendado - Rápido y económico)</option>
                                                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Última generación - Balanceado)</option>
                                                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Complejo - Alta capacidad)</option>
                                                <option value="custom">Otro modelo (Personalizado)...</option>
                                            </Form.Select>
                                            
                                            {(!['gemini-1.5-flash', 'gemini-2.5-flash', 'gemini-1.5-pro'].includes(settings['gemini.model'])) && (
                                                <Form.Control
                                                    type="text"
                                                    name="gemini.model"
                                                    value={settings['gemini.model'] || ''}
                                                    onChange={handleSettingChange}
                                                    placeholder="Ingrese el nombre exacto del modelo (ej: gemini-2.5-pro)"
                                                    style={{ fontSize: '0.9rem' }}
                                                    className="mb-1"
                                                />
                                            )}
                                            <Form.Text className="text-muted small">
                                                Modelo activo configurado: <strong className="text-success">{settings['gemini.model'] || 'gemini-1.5-flash (por defecto)'}</strong>
                                            </Form.Text>
                                        </Form.Group>

                                        <Form.Group className="mb-3" controlId="geminiPrompt">
                                            <Form.Label className="fw-semibold small">Reglas adicionales del Prompt (Instrucciones personalizadas)</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={5}
                                                name="gemini.system.prompt"
                                                value={settings['gemini.system.prompt']}
                                                onChange={handleSettingChange}
                                                placeholder="Ej. Ofrecer la promoción especial del pack de 3 recargas sólo si muestran interés en compras familiares..."
                                                style={{ fontSize: '0.88rem', lineHeight: '1.4' }}
                                            />
                                        </Form.Group>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        {/* Credenciales Meta API */}
                        <Row className="mt-4 g-4">
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
                                Guardar Configuración General
                            </Button>
                        </div>
                    </Form>
                </Tab>

                {/* PESTAÑA 2: CATÁLOGO DE PRODUCTOS IA */}
                <Tab eventKey="products" title={<span><Icons.Archive size={18} className="me-1" /> Catálogo de Venta</span>}>
                    <Card className="shadow-sm border-0" style={{ borderRadius: '12px' }}>
                        <Card.Header className="bg-light border-0 py-3 d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="mb-0 fw-bold">Productos Disponibles para el Agente</h5>
                                <p className="text-muted mb-0 small">Activa o desactiva qué productos del inventario general puede vender la IA, y dale palabras clave de búsqueda.</p>
                            </div>
                            <Button variant="success" onClick={handleSaveProducts} disabled={saving}>
                                {saving ? <Spinner size="sm" className="me-2" /> : <Icons.DeviceFloppy size={18} className="me-2" />}
                                Guardar Catálogo IA
                            </Button>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table responsive hover className="mb-0 align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{ width: '80px', textAlign: 'center' }}>Vende IA</th>
                                        <th>Código / Nombre</th>
                                        <th>Precio</th>
                                        <th>Palabras Clave (Búsqueda IA)</th>
                                        <th>Descripción de Venta Personalizada</th>
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
                                                    onChange={() => handleProductToggle(index)}
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
                                                <Form.Control
                                                    type="text"
                                                    value={prod.searchKeywords || ''}
                                                    onChange={(e) => handleProductTextChange(index, 'searchKeywords', e.target.value)}
                                                    placeholder="Ej: bidon, recarga con caño, agua de caño"
                                                    size="sm"
                                                    disabled={!prod.aiEnabled}
                                                />
                                            </td>
                                            <td>
                                                <Form.Control
                                                    type="text"
                                                    value={prod.customAiDescription || ''}
                                                    onChange={(e) => handleProductTextChange(index, 'customAiDescription', e.target.value)}
                                                    placeholder="Detalles de venta para la IA..."
                                                    size="sm"
                                                    disabled={!prod.aiEnabled}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>

                {/* PESTAÑA 3: COBERTURA DE ENVÍOS */}
                <Tab eventKey="shipping" title={<span><Icons.MapPin size={18} className="me-1" /> Zonas de Envío</span>}>
                    <Card className="shadow-sm border-0" style={{ borderRadius: '12px' }}>
                        <Card.Header className="bg-light border-0 py-3 d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="mb-0 fw-bold">Zonas de Cobertura de Despacho</h5>
                                <p className="text-muted mb-0 small">Controla qué distritos atiende la IA, costos de despacho y pedidos mínimos.</p>
                            </div>
                            <Button variant="primary" onClick={() => setShowCoverageModal(true)}>
                                <Icons.Plus size={18} className="me-1" />
                                Agregar Zona
                            </Button>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table responsive hover className="mb-0 align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>Distrito / Zona</th>
                                        <th>Costo de Envío (Delivery)</th>
                                        <th>Compra Mínima</th>
                                        <th style={{ width: '120px', textAlign: 'center' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shippingCoverage.map((cov) => (
                                        <tr key={cov.id}>
                                            <td className="fw-semibold text-dark">{cov.districtName}</td>
                                            <td>
                                                {parseFloat(cov.deliveryFee) === 0 ? (
                                                    <Badge bg="success-subtle" className="text-success fw-bold">GRATIS</Badge>
                                                ) : (
                                                    <span>S/ {cov.deliveryFee}</span>
                                                )}
                                            </td>
                                            <td>S/ {cov.minOrderAmount}</td>
                                            <td className="text-center">
                                                <Button 
                                                    variant="outline-danger" 
                                                    size="sm" 
                                                    onClick={() => handleDeleteCoverage(cov.id)}
                                                    className="btn-icon rounded-circle"
                                                >
                                                    <Icons.Trash size={16} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {shippingCoverage.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="text-center text-muted py-4">No hay zonas de cobertura registradas. El Agente de IA asumirá que el despacho es general.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>

                {/* PESTAÑA 4: BASE DE CONOCIMIENTO (FAQs) */}
                <Tab eventKey="faq" title={<span><Icons.Book size={18} className="me-1" /> Base de Conocimiento (FAQs)</span>}>
                    <Card className="shadow-sm border-0" style={{ borderRadius: '12px' }}>
                        <Card.Header className="bg-light border-0 py-3 d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="mb-0 fw-bold">Preguntas Frecuentes y Recursos (PDF, Audios)</h5>
                                <p className="text-muted mb-0 small">Enseña al Agente IA cómo responder a dudas comunes de clientes y asócialas a recursos multimedia.</p>
                            </div>
                            <Button variant="primary" onClick={() => setShowFaqModal(true)}>
                                <Icons.Plus size={18} className="me-1" />
                                Agregar Pregunta (FAQ)
                            </Button>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table responsive hover className="mb-0 align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>Categoría</th>
                                        <th>Palabras Clave (Disparadores)</th>
                                        <th>Respuesta de la IA</th>
                                        <th>Recurso Adjunto</th>
                                        <th style={{ width: '120px', textAlign: 'center' }}>Acciones</th>
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
                                            <td style={{ minWidth: '300px' }}>
                                                <p className="mb-0 small text-dark" style={{ whiteSpace: 'pre-wrap' }}>{faq.answer}</p>
                                            </td>
                                            <td>
                                                {faq.attachmentType !== 'NONE' ? (
                                                    <div>
                                                        <Badge bg="info-subtle" className="text-info d-inline-flex align-items-center gap-1">
                                                            {faq.attachmentType === 'PDF' && <Icons.FileText size={12} />}
                                                            {faq.attachmentType === 'IMAGE' && <Icons.Photo size={12} />}
                                                            {faq.attachmentType === 'AUDIO' && <Icons.Volume size={12} />}
                                                            {faq.attachmentType}
                                                        </Badge>
                                                        <span className="text-muted small d-block" style={{ fontSize: '0.75rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {faq.attachmentUrl}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted small">- Ninguno -</span>
                                                )}
                                            </td>
                                            <td className="text-center">
                                                <Button 
                                                    variant="outline-danger" 
                                                    size="sm" 
                                                    onClick={() => handleDeleteFaq(faq.id)}
                                                    className="btn-icon rounded-circle"
                                                >
                                                    <Icons.Trash size={16} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {knowledgeBase.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="text-center text-muted py-4">No hay FAQs configuradas. El Agente de IA usará el modelo general de respuestas.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>

            {/* MODAL COBERTURA */}
            <Modal show={showCoverageModal} onHide={() => setShowCoverageModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold fs-5">Agregar Zona de Cobertura</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleAddCoverage}>
                    <Modal.Body>
                        <Form.Group className="mb-3" controlId="covName">
                            <Form.Label className="small fw-semibold">Nombre del Distrito / Zona</Form.Label>
                            <Form.Control
                                type="text"
                                value={newCoverage.districtName}
                                onChange={(e) => setNewCoverage({...newCoverage, districtName: e.target.value})}
                                placeholder="Ej: La Molina"
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="covFee">
                            <Form.Label className="small fw-semibold">Costo de Envío (S/)</Form.Label>
                            <Form.Control
                                type="number"
                                step="0.10"
                                value={newCoverage.deliveryFee}
                                onChange={(e) => setNewCoverage({...newCoverage, deliveryFee: parseFloat(e.target.value)})}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="covMin">
                            <Form.Label className="small fw-semibold">Monto Mínimo de Pedido (S/)</Form.Label>
                            <Form.Control
                                type="number"
                                step="1.00"
                                value={newCoverage.minOrderAmount}
                                onChange={(e) => setNewCoverage({...newCoverage, minOrderAmount: parseFloat(e.target.value)})}
                                required
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowCoverageModal(false)}>Cancelar</Button>
                        <Button variant="success" type="submit">Agregar Zona</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* MODAL FAQ */}
            <Modal show={showFaqModal} onHide={() => setShowFaqModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold fs-5">Agregar Pregunta Frecuente (FAQ)</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleAddFaq}>
                    <Modal.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="faqCat">
                                    <Form.Label className="small fw-semibold">Categoría</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newFaq.category}
                                        onChange={(e) => setNewFaq({...newFaq, category: e.target.value})}
                                        placeholder="Ej: Métodos de Pago"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="faqKws">
                                    <Form.Label className="small fw-semibold">Palabras Clave (Separadas por comas)</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newFaq.keywords}
                                        onChange={(e) => setNewFaq({...newFaq, keywords: e.target.value})}
                                        placeholder="Ej: yape, plin, transferencia, pagar, efectivo"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3" controlId="faqAns">
                            <Form.Label className="small fw-semibold">Respuesta de la IA</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={newFaq.answer}
                                onChange={(e) => setNewFaq({...newFaq, answer: e.target.value})}
                                placeholder="Escribe la respuesta exacta que debe dar la IA cuando se mencionen las palabras clave..."
                                required
                            />
                        </Form.Group>

                        <Row className="g-3">
                            <Col md={4}>
                                <Form.Group className="mb-3" controlId="faqAttachType">
                                    <Form.Label className="small fw-semibold">Tipo de Recurso Adjunto</Form.Label>
                                    <Form.Select
                                        value={newFaq.attachmentType}
                                        onChange={(e) => setNewFaq({...newFaq, attachmentType: e.target.value})}
                                    >
                                        <option value="NONE">Ninguno</option>
                                        <option value="IMAGE">Imagen</option>
                                        <option value="PDF">Documento PDF</option>
                                        <option value="AUDIO">Mensaje de Voz (Audio)</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={8}>
                                <Form.Group className="mb-3" controlId="faqAttachUrl">
                                    <Form.Label className="small fw-semibold">URL del Archivo / Enlace de descarga</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newFaq.attachmentUrl}
                                        onChange={(e) => setNewFaq({...newFaq, attachmentUrl: e.target.value})}
                                        placeholder="Ej: http://localhost:8080/uploads/catalogo.pdf"
                                        disabled={newFaq.attachmentType === 'NONE'}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowFaqModal(false)}>Cancelar</Button>
                        <Button variant="success" type="submit">Agregar FAQ</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
}
