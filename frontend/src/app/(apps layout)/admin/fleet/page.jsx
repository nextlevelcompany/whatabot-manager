"use client"
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Badge, Modal, Spinner } from 'react-bootstrap';
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

export default function FleetPage() {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const defaultForm = {
        id: null,
        nombre: '',
        apellido: '',
        foto: '',
        dni: '',
        telefono: '',
        licencia: '',
        vehiculo_placa: '',
        vehiculo_marca: '',
        vehiculo_modelo: '',
        vehiculo_anho: '',
        tipo_combustible: 'Gasolina',
        vehiculo_tipo: 'Furgón',
        capacidad_toneladas: 1.5,
        fecha_mantenimiento_motor: '',
        fecha_mantenimiento_gas: '',
        departamento: 'Lima',
        provincia: 'Lima',
        distrito: '',
        direccion: '',
        latitud: null,
        longitud: null,
        notas: '',
        activo: true
    };

    const [form, setForm] = useState(defaultForm);

    const loadDrivers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/conductores`);
            if (res.ok) {
                const data = await res.json();
                setDrivers(data);
            }
        } catch (e) {
            console.error("Error loading drivers", e);
            Swal.fire('Error', 'No se pudieron cargar los datos de la flota.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDrivers();
    }, []);

    const handleEdit = (driver) => {
        setForm({
            ...defaultForm,
            ...driver,
            // Ensure dates are parsed to yyyy-MM-dd for HTML5 input
            fecha_mantenimiento_motor: driver.fecha_mantenimiento_motor ? driver.fecha_mantenimiento_motor.split('T')[0] : '',
            fecha_mantenimiento_gas: driver.fecha_mantenimiento_gas ? driver.fecha_mantenimiento_gas.split('T')[0] : ''
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
            text: 'Se eliminará el registro de este conductor de la flota permanentemente.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Eliminar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`${API_BASE}/api/conductores/${id}`, {
                        method: 'DELETE'
                    });
                    if (res.ok) {
                        Swal.fire('Eliminado', 'El conductor ha sido eliminado.', 'success');
                        loadDrivers();
                    } else {
                        Swal.fire('Error', 'No se pudo eliminar el conductor.', 'error');
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
            const res = await fetch(`${API_BASE}/api/conductores/save`, {
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
                    text: 'Los datos de la flota se guardaron con éxito.',
                    timer: 1500,
                    showConfirmButton: false
                });
                setShowModal(false);
                loadDrivers();
            } else {
                Swal.fire('Error', 'No se pudieron guardar los cambios.', 'error');
            }
        } catch (error) {
            console.error("Error saving driver", error);
            Swal.fire('Error', 'Hubo un error de conexión con el servidor.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const filteredDrivers = drivers.filter(d => {
        const fullSearch = `${d.nombre || ''} ${d.apellido || ''} ${d.vehiculo_placa || ''} ${d.dni || ''} ${d.telefono || ''}`.toLowerCase();
        return fullSearch.includes(searchTerm.toLowerCase());
    });

    return (
        <Container fluid className="px-4 py-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-extrabold text-dark mb-1">Gestión de Flota</h2>
                    <p className="text-muted small mb-0">Administra los conductores, vehículos de reparto, capacidades y fechas de mantenimiento.</p>
                </div>
                <Button variant="primary" className="fw-bold px-3 py-2" onClick={handleNew}>
                    <Icons.Plus size={16} className="me-2" />
                    Nuevo Vehículo / Chofer
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
                                placeholder="🔍 Buscar por chofer, placa, DNI o teléfono..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Drivers Table */}
            {loading ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                    <Spinner animation="border" color="primary" />
                    <span className="ms-2">Cargando flota...</span>
                </div>
            ) : (
                <Card className="border-0 shadow-sm rounded-3 overflow-hidden bg-white">
                    <Table hover responsive className="align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Chofer</th>
                                <th>Identificación</th>
                                <th>Placa</th>
                                <th>Vehículo</th>
                                <th>Combustible / Capacidad</th>
                                <th>Próximo Mantenimiento</th>
                                <th>Estado</th>
                                <th className="text-end">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDrivers.map(d => (
                                <tr key={d.id}>
                                    <td>
                                        <div className="fw-bold text-dark">{d.nombre} {d.apellido}</div>
                                        <small className="text-muted">{d.telefono || 'Sin teléfono'}</small>
                                    </td>
                                    <td>
                                        <div>DNI: {d.dni || '—'}</div>
                                        <small className="text-muted">Lic: {d.licencia || '—'}</small>
                                    </td>
                                    <td>
                                        <Badge bg="light" className="text-primary border border-light fw-bold px-2 py-1" style={{ fontSize: '11px' }}>
                                            🚚 {d.vehiculo_placa || 'SIN PLACA'}
                                        </Badge>
                                    </td>
                                    <td>
                                        <div>{d.vehiculo_marca} {d.vehiculo_modelo}</div>
                                        <small className="text-muted">{d.vehiculo_tipo} ({d.vehiculo_anho || '—'})</small>
                                    </td>
                                    <td>
                                        <div>{d.tipo_combustible}</div>
                                        <small className="text-muted">{d.capacidad_toneladas ? `${d.capacidad_toneladas} Tn` : '—'}</small>
                                    </td>
                                    <td>
                                        <div className="small text-dark">
                                            ⚙️ Motor: {d.fecha_mantenimiento_motor ? d.fecha_mantenimiento_motor.split('T')[0].split('-').reverse().join('/') : '—'}
                                        </div>
                                        <div className="small text-muted">
                                            🔥 Gas: {d.fecha_mantenimiento_gas ? d.fecha_mantenimiento_gas.split('T')[0].split('-').reverse().join('/') : '—'}
                                        </div>
                                    </td>
                                    <td>
                                        <Badge bg={d.activo ? 'success-soft text-success' : 'danger-soft text-danger'} className="border">
                                            {d.activo ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </td>
                                    <td className="text-end">
                                        <Button variant="link" className="p-1 text-primary hover-bg rounded-circle" onClick={() => handleEdit(d)} title="Editar">
                                            <Icons.Edit size={16} />
                                        </Button>
                                        <Button variant="link" className="p-1 text-danger hover-bg rounded-circle" onClick={() => handleDelete(d.id)} title="Eliminar">
                                            <Icons.Trash size={16} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {filteredDrivers.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center py-4 text-muted">No se encontraron choferes o vehículos.</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card>
            )}

            {/* Edit / New Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" backdrop="static">
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title className="fw-bold">{form.id ? 'Editar Vehículo / Chofer' : 'Registrar Nuevo Vehículo / Chofer'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        {/* Section 1: Personal Info */}
                        <h6 className="fw-bold text-primary mb-3 pb-2 border-bottom">1. Datos del Conductor</h6>
                        <Row className="g-3 mb-4">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Nombre</Form.Label>
                                    <Form.Control
                                        type="text"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.nombre}
                                        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Apellido</Form.Label>
                                    <Form.Control
                                        type="text"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.apellido}
                                        onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">DNI / Documento</Form.Label>
                                    <Form.Control
                                        type="text"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.dni}
                                        onChange={(e) => setForm({ ...form, dni: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Teléfono</Form.Label>
                                    <Form.Control
                                        type="text"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.telefono}
                                        onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Licencia de Conducir</Form.Label>
                                    <Form.Control
                                        type="text"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.licencia}
                                        onChange={(e) => setForm({ ...form, licencia: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* Section 2: Vehicle Info */}
                        <h6 className="fw-bold text-primary mb-3 pb-2 border-bottom">2. Datos del Vehículo</h6>
                        <Row className="g-3 mb-4">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Placa de Vehículo</Form.Label>
                                    <Form.Control
                                        type="text"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.vehiculo_placa}
                                        onChange={(e) => setForm({ ...form, vehiculo_placa: e.target.value })}
                                        placeholder="Ej: F4D-882"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Marca</Form.Label>
                                    <Form.Control
                                        type="text"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.vehiculo_marca}
                                        onChange={(e) => setForm({ ...form, vehiculo_marca: e.target.value })}
                                        placeholder="Ej: Hyundai"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Modelo</Form.Label>
                                    <Form.Control
                                        type="text"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.vehiculo_modelo}
                                        onChange={(e) => setForm({ ...form, vehiculo_modelo: e.target.value })}
                                        placeholder="Ej: H100"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Año de Fabricación</Form.Label>
                                    <Form.Control
                                        type="text"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.vehiculo_anho}
                                        onChange={(e) => setForm({ ...form, vehiculo_anho: e.target.value })}
                                        placeholder="Ej: 2018"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Tipo de Vehículo</Form.Label>
                                    <Form.Select
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.vehiculo_tipo}
                                        onChange={(e) => setForm({ ...form, vehiculo_tipo: e.target.value })}
                                    >
                                        <option value="Furgón">Furgón</option>
                                        <option value="Camioneta">Camioneta</option>
                                        <option value="Moto">Moto / Trimoto</option>
                                        <option value="Camión">Camión</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Combustible</Form.Label>
                                    <Form.Select
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.tipo_combustible}
                                        onChange={(e) => setForm({ ...form, tipo_combustible: e.target.value })}
                                    >
                                        <option value="Gasolina">Gasolina</option>
                                        <option value="Diésel">Diésel</option>
                                        <option value="GLP">GLP</option>
                                        <option value="GNV">GNV</option>
                                        <option value="Eléctrico">Eléctrico</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Capacidad (Tn)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.1"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.capacidad_toneladas || ''}
                                        onChange={(e) => setForm({ ...form, capacidad_toneladas: parseFloat(e.target.value) })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* Section 3: Maintenance Dates */}
                        <h6 className="fw-bold text-primary mb-3 pb-2 border-bottom">3. Mantenimientos y Calendario</h6>
                        <Row className="g-3 mb-4">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Mantenimiento de Motor (Próximo)</Form.Label>
                                    <Form.Control
                                        type="date"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.fecha_mantenimiento_motor}
                                        onChange={(e) => setForm({ ...form, fecha_mantenimiento_motor: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Mantenimiento Sistema de Gas (Próximo)</Form.Label>
                                    <Form.Control
                                        type="date"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.fecha_mantenimiento_gas}
                                        onChange={(e) => setForm({ ...form, fecha_mantenimiento_gas: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* Section 4: Extra Details */}
                        <h6 className="fw-bold text-primary mb-3 pb-2 border-bottom">4. Datos Adicionales y Estado</h6>
                        <Row className="g-3">
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Observaciones / Notas</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.notas}
                                        onChange={(e) => setForm({ ...form, notas: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mt-2">
                                    <Form.Check
                                        type="switch"
                                        id="driver-active-switch"
                                        label="Vehículo/Chofer Activo para Despacho"
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
                                    Guardar Registro
                                </>
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
}
