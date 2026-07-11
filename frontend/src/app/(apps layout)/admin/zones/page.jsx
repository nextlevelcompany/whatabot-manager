"use client"
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Badge, Modal, Spinner } from 'react-bootstrap';
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

export default function ZonesPage() {
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const defaultForm = {
        id: null,
        nombre: '',
        activo: true
    };

    const [form, setForm] = useState(defaultForm);

    const loadZones = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/zonas-reparto`);
            if (res.ok) {
                const data = await res.json();
                setZones(data);
            }
        } catch (e) {
            console.error("Error loading zones", e);
            Swal.fire('Error', 'No se pudieron cargar las zonas de reparto.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadZones();
    }, []);

    const handleEdit = (zone) => {
        setForm({
            ...defaultForm,
            ...zone
        });
        setShowModal(true);
    };

    const handleNew = () => {
        setForm(defaultForm);
        setShowModal(true);
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: '¿Estás seguro?',
            text: 'Se eliminará esta zona permanentemente. Los pedidos asignados a esta zona quedarán sin zona especificada.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Eliminar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`${API_BASE}/api/zonas-reparto/${id}`, {
                        method: 'DELETE'
                    });
                    if (res.ok) {
                        Swal.fire('Eliminado', 'La zona ha sido eliminada con éxito.', 'success');
                        loadZones();
                    } else {
                        Swal.fire('Error', 'No se pudo eliminar la zona.', 'error');
                    }
                } catch (e) {
                    Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
                }
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/zonas-reparto/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(form)
            });

            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Guardado',
                    text: 'La zona de reparto se guardó con éxito.',
                    timer: 1500,
                    showConfirmButton: false
                });
                setShowModal(false);
                loadZones();
            } else {
                Swal.fire('Error', 'No se pudo guardar la zona.', 'error');
            }
        } catch (error) {
            console.error("Error saving zone", error);
            Swal.fire('Error', 'Hubo un error de conexión con el servidor.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const filteredZones = zones.filter(z => {
        return (z.nombre || '').toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <Container fluid className="px-4 py-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-extrabold text-dark mb-1">Zonas de Reparto</h2>
                    <p className="text-muted small mb-0">Configura y administra las diferentes divisiones de distribución logística y despacho.</p>
                </div>
                <Button variant="primary" className="fw-bold px-3 py-2" onClick={handleNew}>
                    <Icons.Plus size={16} className="me-2" />
                    Nueva Zona de Reparto
                </Button>
            </div>

            {/* Filter Search */}
            <Card className="shadow-sm border-0 mb-4 bg-white">
                <Card.Body className="p-3">
                    <Row className="align-items-center">
                        <Col md={6}>
                            <Form.Control
                                type="text"
                                className="shadow-none border-light-soft bg-light-soft"
                                placeholder="🔍 Buscar por nombre de zona..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Zones Table */}
            {loading ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                    <Spinner animation="border" color="primary" />
                    <span className="ms-2">Cargando zonas...</span>
                </div>
            ) : (
                <Row className="g-4">
                    <Col lg={8}>
                        <Card className="border-0 shadow-sm rounded-3 overflow-hidden bg-white">
                            <Table hover responsive className="align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{ width: '80px' }}>ID</th>
                                        <th>Nombre de Zona</th>
                                        <th>Estado</th>
                                        <th className="text-end" style={{ width: '120px' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredZones.map(z => (
                                        <tr key={z.id}>
                                            <td className="fw-bold text-secondary">#{z.id}</td>
                                            <td>
                                                <div className="fw-bold text-dark">{z.nombre}</div>
                                            </td>
                                            <td>
                                                <Badge bg={z.activo ? 'success-soft text-success' : 'danger-soft text-danger'} className="border">
                                                    {z.activo ? 'Activo' : 'Inactivo'}
                                                </Badge>
                                            </td>
                                            <td className="text-end">
                                                <Button variant="link" className="p-1 text-primary hover-bg rounded-circle" onClick={() => handleEdit(z)} title="Editar">
                                                    <Icons.Edit size={16} />
                                                </Button>
                                                <Button variant="link" className="p-1 text-danger hover-bg rounded-circle" onClick={() => handleDelete(z.id)} title="Eliminar">
                                                    <Icons.Trash size={16} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredZones.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="text-center py-4 text-muted">No se encontraron zonas de reparto registradas.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </Card>
                    </Col>

                    {/* Quick Tips */}
                    <Col lg={4}>
                        <Card className="shadow-sm border-0 bg-primary-soft rounded-3 border-primary border-top border-3">
                            <Card.Body className="p-4">
                                <h6 className="fw-bold text-primary mb-3 d-flex align-items-center">
                                    <Icons.InfoCircle className="me-2" size={18} />
                                    ¿Para qué sirven las zonas?
                                </h6>
                                <p className="small text-dark mb-3" style={{ lineHeight: '1.6', fontSize: '12.5px' }}>
                                    Las <b>Zonas de Reparto</b> facilitan la asignación de pedidos a los choferes correspondientes de cada área (Norte, Sur, Centro, Este, etc.).
                                </p>
                                <p className="small text-dark mb-0" style={{ lineHeight: '1.6', fontSize: '12.5px' }}>
                                    Al clasificar tus pedidos por zonas, podrás optimizar las rutas diarias del camión de distribución en el mapa de control logístico.
                                </p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Edit / New Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static">
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title className="fw-bold">{form.id ? 'Editar Zona de Reparto' : 'Registrar Nueva Zona'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        <Row className="g-3">
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Nombre de la Zona</Form.Label>
                                    <Form.Control
                                        type="text"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.nombre}
                                        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                        placeholder="Ej: Zona Este / La Molina"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group className="mt-3">
                                    <Form.Check
                                        type="switch"
                                        id="zone-active-switch"
                                        label="Zona Activa para Despachos"
                                        checked={form.activo}
                                        onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" onClick={() => setShowModal(false)} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button variant="primary" type="submit" disabled={saving}>
                            {saving ? (
                                <>
                                    <Spinner size="sm" className="me-2" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Icons.DeviceFloppy size={16} className="me-2" />
                                    Guardar Zona
                                </>
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
}
