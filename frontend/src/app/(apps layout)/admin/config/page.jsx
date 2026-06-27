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
    const handleProductToggle = async (index, currentVal) => {
        const updatedVal = !currentVal;
        const prod = productsConfig[index];
        const updatedProd = {
            ...prod,
            aiEnabled: updatedVal
        };

        try {
            const res = await fetch(`${API_BASE}/api/ai/products-config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productoId: updatedProd.productoId,
                    aiEnabled: updatedProd.aiEnabled,
                    searchKeywords: updatedProd.searchKeywords || '',
                    customAiDescription: updatedProd.customAiDescription || '',
                    intent: updatedProd.intent || '',
                    priority: updatedProd.priority ? parseInt(updatedProd.priority) : 100,
                    mediaIdWhatsapp: updatedProd.mediaIdWhatsapp || '',
                    imageCaption: updatedProd.imageCaption || ''
                })
            });
            if (res.ok) {
                const updated = [...productsConfig];
                updated[index].aiEnabled = updatedVal;
                setProductsConfig(updated);
                showAlert('success', `Producto ${updatedVal ? 'activado' : 'desactivado'} para la IA.`);
            }
        } catch (err) {
            console.error(err);
            showAlert('danger', 'Error al cambiar estado del producto.');
        }
    };

    const handleConfigureProduct = (prod) => {
        setEditingProduct({
            ...prod,
            priority: prod.priority || 100,
            searchKeywords: prod.searchKeywords || '',
            customAiDescription: prod.customAiDescription || '',
            intent: prod.intent || '',
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
        const data = editingCoverage || newCoverage;
        try {
            const res = await fetch(`${API_BASE}/api/ai/shipping-coverage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                const updatedRes = await fetch(`${API_BASE}/api/ai/shipping-coverage`);
                if (updatedRes.ok) setShippingCoverage(await updatedRes.json());
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

    // FAQs (Knowledge Base) Handlers
    const handleConfigureFaq = (faq) => {
        setEditingFaq({ ...faq });
        setShowFaqModal(true);
    };

    const handleSaveFaq = async (e) => {
        e.preventDefault();
        const data = editingFaq || newFaq;
        try {
            const res = await fetch(`${API_BASE}/api/ai/knowledge-base`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
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

                {/* PESTAÑA 3: COBERTURA DE ENVÍOS */}
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

                {/* PESTAÑA 4: BASE DE CONOCIMIENTO (FAQs) */}
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
                                        <Form.Text className="text-muted small">Ayuda al chatbot a identificar si este producto coincide con un intent específico.</Form.Text>
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
                                        <Form.Text className="text-muted small">Menor valor indica mayor prioridad (ej: 1 se muestra antes que 100).</Form.Text>
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
                                <Form.Text className="text-muted small">Sinónimos que el cliente podría usar para buscar este producto.</Form.Text>
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="prodCustomDesc">
                                <Form.Label className="small fw-semibold">Descripción del Producto para la IA</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={editingProduct.customAiDescription}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, customAiDescription: e.target.value })}
                                    placeholder="Escribe detalles específicos que la IA deba conocer al vender este producto (ej. PH exacto, beneficios, promociones incluidas)..."
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
                                        <Form.Text className="text-muted small">ID de la imagen subida a la API de WhatsApp para envío de alta velocidad.</Form.Text>
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
                                        <Form.Text className="text-muted small">Texto descriptivo que acompaña a la imagen enviada.</Form.Text>
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
                        
                        {/* WhatsApp Message Bubble Simulation */}
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
                    <Modal.Footer className="p-2 bg-light d-flex align-items-center gap-2 border-0">
                        <InputGroup className="rounded-pill shadow-sm overflow-hidden" style={{ flex: 1, backgroundColor: 'white' }}>
                            <Form.Control
                                type="text"
                                placeholder="Escribe un mensaje..."
                                disabled
                                className="border-0 px-3 bg-white"
                                style={{ fontSize: '0.85rem' }}
                            />
                        </InputGroup>
                        <Button variant="success" className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', backgroundColor: '#00a884', borderColor: '#00a884' }} onClick={() => setShowPreviewModal(false)}>
                            <Icons.Check size={20} className="text-white" />
                        </Button>
                    </Modal.Footer>
                </Modal>
            )
}

            {/* MODAL COBERTURA */}
            <Modal show={showCoverageModal} onHide={() => { setShowCoverageModal(false); setEditingCoverage(null); }} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold fs-5">{editingCoverage ? 'Editar Zona de Cobertura' : 'Agregar Zona de Cobertura'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSaveCoverage}>
                    <Modal.Body>
                        <Form.Group className="mb-3" controlId="covName">
                            <Form.Label className="small fw-semibold">Nombre del Distrito / Zona</Form.Label>
                            <Form.Control
                                type="text"
                                value={editingCoverage ? editingCoverage.districtName : newCoverage.districtName}
                                onChange={(e) => {
                                    if (editingCoverage) setEditingCoverage({ ...editingCoverage, districtName: e.target.value });
                                    else setNewCoverage({ ...newCoverage, districtName: e.target.value });
                                }}
                                placeholder="Ej: La Molina"
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="covFee">
                            <Form.Label className="small fw-semibold">Costo de Envío (S/)</Form.Label>
                            <Form.Control
                                type="number"
                                step="0.10"
                                value={editingCoverage ? editingCoverage.deliveryFee : newCoverage.deliveryFee}
                                onChange={(e) => {
                                    if (editingCoverage) setEditingCoverage({ ...editingCoverage, deliveryFee: parseFloat(e.target.value) || 0 });
                                    else setNewCoverage({ ...newCoverage, deliveryFee: parseFloat(e.target.value) || 0 });
                                }}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="covMin">
                            <Form.Label className="small fw-semibold">Monto Mínimo de Pedido (S/)</Form.Label>
                            <Form.Control
                                type="number"
                                step="1.00"
                                value={editingCoverage ? editingCoverage.minOrderAmount : newCoverage.minOrderAmount}
                                onChange={(e) => {
                                    if (editingCoverage) setEditingCoverage({ ...editingCoverage, minOrderAmount: parseFloat(e.target.value) || 0 });
                                    else setNewCoverage({ ...newCoverage, minOrderAmount: parseFloat(e.target.value) || 0 });
                                }}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="covAliases">
                            <Form.Label className="small fw-semibold">Alias de Distrito (Separados por coma para búsqueda IA)</Form.Label>
                            <Form.Control
                                type="text"
                                value={editingCoverage ? (editingCoverage.aliases || '') : (newCoverage.aliases || '')}
                                onChange={(e) => {
                                    if (editingCoverage) setEditingCoverage({ ...editingCoverage, aliases: e.target.value });
                                    else setNewCoverage({ ...newCoverage, aliases: e.target.value });
                                }}
                                placeholder="Ej: molina, la molina, molinero"
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => { setShowCoverageModal(false); setEditingCoverage(null); }}>Cancelar</Button>
                        <Button variant="success" type="submit">{editingCoverage ? 'Guardar Cambios' : 'Agregar Zona'}</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* MODAL FAQ */}
            <Modal show={showFaqModal} onHide={() => { setShowFaqModal(false); setEditingFaq(null); }} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold fs-5">{editingFaq ? 'Editar Pregunta Frecuente (FAQ)' : 'Agregar Pregunta Frecuente (FAQ)'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSaveFaq}>
                    <Modal.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="faqCat">
                                    <Form.Label className="small fw-semibold">Categoría</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={editingFaq ? editingFaq.category : newFaq.category}
                                        onChange={(e) => {
                                            if (editingFaq) setEditingFaq({ ...editingFaq, category: e.target.value });
                                            else setNewFaq({ ...newFaq, category: e.target.value });
                                        }}
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
                                        value={editingFaq ? editingFaq.keywords : newFaq.keywords}
                                        onChange={(e) => {
                                            if (editingFaq) setEditingFaq({ ...editingFaq, keywords: e.target.value });
                                            else setNewFaq({ ...newFaq, keywords: e.target.value });
                                        }}
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
                                value={editingFaq ? editingFaq.answer : newFaq.answer}
                                onChange={(e) => {
                                    if (editingFaq) setEditingFaq({ ...editingFaq, answer: e.target.value });
                                    else setNewFaq({ ...newFaq, answer: e.target.value });
                                }}
                                placeholder="Escribe la respuesta exacta que debe dar la IA cuando se mencionen las palabras clave..."
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
                                        <option value="PDF">Documento PDF</option>
                                        <option value="AUDIO">Mensaje de Voz (Audio)</option>
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
        </Container>
    );
}
