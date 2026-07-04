"use client"
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import * as Icons from 'tabler-icons-react';
import Swal from 'sweetalert2';

const getApiBase = () => {
    if (typeof window !== 'undefined') {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
        return `${protocol}//${hostname}:8080`;
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';
};

const API_BASE = getApiBase();

export default function GeneralSettingsPage() {
    const [settings, setSettings] = useState({
        'empresa.nombre': 'NextLead CRM',
        'empresa.ruc': '20611846721',
        'empresa.telefono': '948613380',
        'timezone': 'America/Lima',
        'formato.fecha': 'd/m/Y',
        'formato.hora': '24h',
        'igv.porcentaje': '18'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/settings`);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
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
