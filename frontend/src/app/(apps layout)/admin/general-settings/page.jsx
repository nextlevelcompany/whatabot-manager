"use client"
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import * as Icons from 'tabler-icons-react';
import Swal from 'sweetalert2';

const getApiBase = () => {
    if (typeof window !== 'undefined') {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
        return `${protocol}//${hostname}:8081`;
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8081';
};

const API_BASE = getApiBase();

export default function GeneralSettingsPage() {
    const [settings, setSettings] = useState({
        'empresa.nombre': 'NextLead CRM',
        'empresa.ruc': '20611846721',
        'empresa.telefono': '948613380',
        'empresa.logo': '',
        'empresa.logo.height': '48',
        'empresa.favicon': '',
        'empresa.favicon.height': '32',
        'timezone': 'America/Lima',
        'formato.fecha': 'd/m/Y',
        'formato.hora': '24h',
        'igv.porcentaje': '18'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadingFavicon, setUploadingFavicon] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE}/api/settings`, {
                    headers: {
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    // Merge loaded values with defaults to ensure all keys exist
                    setSettings(prev => ({
                        ...prev,
                        ...data
                    }));
                }
            } catch (e) {
                console.error("Error loading settings", e);
                Swal.fire('Error', 'No se pudieron cargar los ajustes del sistema.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            Swal.fire('Error', 'El archivo es demasiado grande. El límite es de 2MB.', 'error');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/messages/upload`, {
                method: 'POST',
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                handleChange('empresa.logo', data.url);
                Swal.fire({
                    icon: 'success',
                    title: 'Logo cargado',
                    text: 'El logotipo se ha subido correctamente al borrador. Guarda los ajustes para guardar los cambios.',
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                Swal.fire('Error', 'No se pudo subir la imagen del logo.', 'error');
            }
        } catch (err) {
            console.error("Error uploading logo", err);
            Swal.fire('Error', 'Error de conexión al subir el logo.', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleFaviconUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 1 * 1024 * 1024) {
            Swal.fire('Error', 'El archivo de favicon es demasiado grande. El límite es de 1MB.', 'error');
            return;
        }

        setUploadingFavicon(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/messages/upload`, {
                method: 'POST',
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                handleChange('empresa.favicon', data.url);
                Swal.fire({
                    icon: 'success',
                    title: 'Favicon cargado',
                    text: 'El favicon se ha subido correctamente al borrador. Guarda los ajustes para guardar los cambios.',
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                Swal.fire('Error', 'No se pudo subir la imagen del favicon.', 'error');
            }
        } catch (err) {
            console.error("Error uploading favicon", err);
            Swal.fire('Error', 'Error de conexión al subir el favicon.', 'error');
        } finally {
            setUploadingFavicon(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Ajustes guardados',
                    text: 'Los ajustes generales se actualizaron con éxito.',
                    timer: 1500,
                    showConfirmButton: false
                });
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('logo-updated'));
                }
            } else {
                Swal.fire('Error', 'No se pudieron guardar los ajustes.', 'error');
            }
        } catch (error) {
            console.error("Error saving settings", error);
            Swal.fire('Error', 'Hubo un error de conexión con el servidor.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <Spinner animation="border" color="primary" />
                <span className="ms-2">Cargando Ajustes...</span>
            </Container>
        );
    }

    return (
        <Container fluid className="px-4 py-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-extrabold text-dark mb-1">Ajustes Generales</h2>
                    <p className="text-muted small mb-0">Administra los datos de facturación, la zona horaria regional y la información comercial.</p>
                </div>
            </div>

            <Form onSubmit={handleSubmit}>
                <Row className="g-4">
                    {/* Left Column: Form Cards */}
                    <Col lg={8}>
                        {/* Company Info Card */}
                        <Card className="shadow-sm border-0 mb-4 rounded-3 bg-white">
                            <Card.Body className="p-4">
                                <h5 className="fw-bold mb-4 d-flex align-items-center text-dark">
                                    <Icons.BuildingStore className="me-2 text-primary" size={22} />
                                    Información de la Empresa
                                </h5>
                                <Row className="g-3">
                                    {/* Logo y Favicon de la empresa */}
                                    <Col md={6} className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom border-light">
                                        <div className="position-relative border rounded p-2 bg-light d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px', overflow: 'hidden' }}>
                                            {settings['empresa.logo'] ? (
                                                <img 
                                                    src={`${API_BASE}${settings['empresa.logo']}`} 
                                                    alt="logo" 
                                                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                                                />
                                            ) : (
                                                <span className="text-muted small">Sin Logo</span>
                                            )}
                                        </div>
                                        <div>
                                            <Form.Label className="fw-bold small text-muted text-uppercase mb-1 d-block">Logotipo Comercial</Form.Label>
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                className="form-control form-control-sm mb-1" 
                                                style={{ maxWidth: '280px' }} 
                                                onChange={handleLogoUpload}
                                                disabled={uploading}
                                            />
                                            <div className="d-flex align-items-center justify-content-between mb-1">
                                                <span className="text-muted" style={{ fontSize: '11px' }}>Formatos PNG, JPG, SVG. Máx 2MB.</span>
                                                {uploading && <span className="spinner-border spinner-border-sm text-primary ms-2" role="status"></span>}
                                            </div>
                                            <Form.Label className="fw-bold small text-muted text-uppercase mb-0 mt-1 d-block" style={{ fontSize: '11px' }}>Altura del Logo: <span className="text-primary">{settings['empresa.logo.height'] || '48'}px</span></Form.Label>
                                            <input 
                                                type="range" 
                                                min="20" 
                                                max="100" 
                                                value={settings['empresa.logo.height'] || '48'} 
                                                onChange={(e) => handleChange('empresa.logo.height', e.target.value)}
                                                className="form-range py-1" 
                                                style={{ maxWidth: '240px' }} 
                                            />
                                        </div>
                                    </Col>
                                    <Col md={6} className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom border-light">
                                        <div className="position-relative border rounded p-2 bg-light d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px', overflow: 'hidden' }}>
                                            {settings['empresa.favicon'] ? (
                                                <img 
                                                    src={`${API_BASE}${settings['empresa.favicon']}`} 
                                                    alt="favicon" 
                                                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                                                />
                                            ) : (
                                                <span className="text-muted small">Sin Favicon</span>
                                            )}
                                        </div>
                                        <div>
                                            <Form.Label className="fw-bold small text-muted text-uppercase mb-1 d-block">Favicon / Icono Contraído</Form.Label>
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                className="form-control form-control-sm mb-1" 
                                                style={{ maxWidth: '280px' }} 
                                                onChange={handleFaviconUpload}
                                                disabled={uploadingFavicon}
                                            />
                                            <div className="d-flex align-items-center justify-content-between mb-1">
                                                <span className="text-muted" style={{ fontSize: '11px' }}>Soporta ICO, PNG, SVG. Máx 1MB.</span>
                                                {uploadingFavicon && <span className="spinner-border spinner-border-sm text-primary ms-2" role="status"></span>}
                                            </div>
                                            <Form.Label className="fw-bold small text-muted text-uppercase mb-0 mt-1 d-block" style={{ fontSize: '11px' }}>Altura del Icono: <span className="text-primary">{settings['empresa.favicon.height'] || '32'}px</span></Form.Label>
                                            <input 
                                                type="range" 
                                                min="16" 
                                                max="60" 
                                                value={settings['empresa.favicon.height'] || '32'} 
                                                onChange={(e) => handleChange('empresa.favicon.height', e.target.value)}
                                                className="form-range py-1" 
                                                style={{ maxWidth: '240px' }} 
                                            />
                                        </div>
                                    </Col>
                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label className="fw-bold small text-muted text-uppercase mb-2">Nombre Comercial</Form.Label>
                                            <Form.Control
                                                type="text"
                                                className="shadow-none border-light-soft bg-light-soft"
                                                value={settings['empresa.nombre'] || ''}
                                                onChange={(e) => handleChange('empresa.nombre', e.target.value)}
                                                placeholder="Ej: NextLead CRM"
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="fw-bold small text-muted text-uppercase mb-2">RUC / ID Fiscal</Form.Label>
                                            <Form.Control
                                                type="text"
                                                className="shadow-none border-light-soft bg-light-soft"
                                                value={settings['empresa.ruc'] || ''}
                                                onChange={(e) => handleChange('empresa.ruc', e.target.value)}
                                                placeholder="Ej: 20611846721"
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="fw-bold small text-muted text-uppercase mb-2">Teléfono de Contacto</Form.Label>
                                            <Form.Control
                                                type="text"
                                                className="shadow-none border-light-soft bg-light-soft"
                                                value={settings['empresa.telefono'] || ''}
                                                onChange={(e) => handleChange('empresa.telefono', e.target.value)}
                                                placeholder="Ej: 948613380"
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Regional Config Card */}
                        <Card className="shadow-sm border-0 rounded-3 bg-white mb-4">
                            <Card.Body className="p-4">
                                <h5 className="fw-bold mb-4 d-flex align-items-center text-dark">
                                    <Icons.Clock className="me-2 text-primary" size={22} />
                                    Configuración Regional
                                </h5>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="fw-bold small text-muted text-uppercase mb-2">Zona Horaria (Timezone)</Form.Label>
                                            <Form.Select
                                                className="shadow-none border-light-soft bg-light-soft"
                                                value={settings['timezone'] || 'America/Lima'}
                                                onChange={(e) => handleChange('timezone', e.target.value)}
                                            >
                                                <option value="America/Lima">Lima (GMT-5)</option>
                                                <option value="America/Santiago">Santiago (GMT-4)</option>
                                                <option value="America/Bogota">Bogotá (GMT-5)</option>
                                                <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                                                <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
                                                <option value="UTC">UTC (Tiempo Universal)</option>
                                            </Form.Select>
                                            <Form.Text className="text-muted mt-1 d-block small">Afecta a todas las fechas de creación y reportes logísticos.</Form.Text>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="fw-bold small text-muted text-uppercase mb-2">Formato de Fecha</Form.Label>
                                            <Form.Select
                                                className="shadow-none border-light-soft bg-light-soft"
                                                value={settings['formato.fecha'] || 'd/m/Y'}
                                                onChange={(e) => handleChange('formato.fecha', e.target.value)}
                                            >
                                                <option value="d/m/Y">DD/MM/YYYY (25/12/2026)</option>
                                                <option value="m/d/Y">MM/DD/YYYY (12/25/2026)</option>
                                                <option value="Y-m-d">YYYY-MM-DD (2026-12-25)</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="fw-bold small text-muted text-uppercase mb-2">Formato de Hora</Form.Label>
                                            <Form.Select
                                                className="shadow-none border-light-soft bg-light-soft"
                                                value={settings['formato.hora'] || '24h'}
                                                onChange={(e) => handleChange('formato.hora', e.target.value)}
                                            >
                                                <option value="24h">24 Horas (Ej: 15:30)</option>
                                                <option value="12h">12 Horas (Ej: 03:30 PM)</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="fw-bold small text-muted text-uppercase mb-2">Porcentaje de IGV (%)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                className="shadow-none border-light-soft bg-light-soft"
                                                value={settings['igv.porcentaje'] || '18'}
                                                onChange={(e) => handleChange('igv.porcentaje', e.target.value)}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Submit Row */}
                        <div className="d-flex justify-content-end gap-2">
                            <Button 
                                type="submit" 
                                variant="primary" 
                                className="fw-bold px-4 py-2" 
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <Spinner size="sm" className="me-2" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Icons.DeviceFloppy size={16} className="me-2" />
                                        Guardar Ajustes
                                    </>
                                )}
                            </Button>
                        </div>
                    </Col>

                    {/* Right Column: Tips Card */}
                    <Col lg={4}>
                        <Card className="shadow-sm border-0 bg-primary-soft rounded-3 mb-4 border-primary border-top border-3">
                            <Card.Body className="p-4">
                                <h6 className="fw-bold text-primary mb-3 d-flex align-items-center">
                                    <Icons.InfoCircle className="me-2" size={18} />
                                    Sugerencia Crítica
                                </h6>
                                <p className="small text-dark mb-0" style={{ lineHeight: '1.6', fontSize: '12.5px' }}>
                                    La configuración de la <b>Zona Horaria</b> es un factor crítico para la precisión de tus reportes logísticos diarios. Asegúrate de que coincida con la hora local de tus conductores para evitar discrepancias en los registros de entrega.
                                </p>
                            </Card.Body>
                        </Card>

                        <Card className="shadow-sm border-0 bg-light-soft rounded-3">
                            <Card.Body className="p-4">
                                <h6 className="fw-bold text-muted mb-3 d-flex align-items-center">
                                    <Icons.ReceiptTax className="me-2" size={18} />
                                    Impuestos e IGV
                                </h6>
                                <p className="small text-muted mb-0" style={{ lineHeight: '1.6', fontSize: '12.5px' }}>
                                    El porcentaje de IGV configurado se aplicará de forma automática en la creación de todas las facturas y pedidos del CRM. La tasa por defecto en el Perú es del <b>18%</b>.
                                </p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Form>
        </Container>
    );
}
