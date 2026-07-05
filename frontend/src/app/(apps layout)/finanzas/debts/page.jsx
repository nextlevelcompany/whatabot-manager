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

export default function DebtsPage() {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [showModal, setShowModal] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [showEditInstallment, setShowEditInstallment] = useState(false);
    const [saving, setSaving] = useState(false);

    // Loan Form state
    const defaultForm = {
        id: null,
        entidad_bancaria: '',
        numero_prestamo: '',
        monto_prestado: '',
        moneda: 'PEN',
        fecha_inicio: new Date().toISOString().split('T')[0],
        cuotas_totales: 12,
        tcea: 15.5,
        notes: '',
        metodo_recepcion: 'Transferencia'
    };
    const [form, setForm] = useState(defaultForm);

    // Loan Details state
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [installments, setInstallments] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Installment Edit state
    const [editingInstallment, setEditingInstallment] = useState({
        id: null,
        fecha_vencimiento: '',
        monto_cuota: '',
        capital: '',
        interes: '',
        seguro_comisiones: ''
    });

    const loadLoans = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/deudas`);
            if (res.ok) {
                setLoans(await res.json());
            }
        } catch (e) {
            console.error("Error loading loans", e);
            Swal.fire('Error', 'No se pudieron cargar los préstamos bancarios.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLoans();
    }, []);

    const handleNewLoan = () => {
        setForm(defaultForm);
        setShowModal(true);
    };

    const handleLoanSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/deudas/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...form,
                    monto_prestado: parseFloat(form.monto_prestado),
                    cuotas_totales: parseInt(form.cuotas_totales),
                    tcea: parseFloat(form.tcea)
                })
            });

            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Préstamo Registrado',
                    text: 'Préstamo y cronograma inicial autogenerados.',
                    timer: 1500,
                    showConfirmButton: false
                });
                setShowModal(false);
                loadLoans();
            } else {
                Swal.fire('Error', 'No se pudo guardar el préstamo.', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleViewDetails = async (id) => {
        setLoadingDetails(true);
        setShowDetails(true);
        try {
            const res = await fetch(`${API_BASE}/api/deudas/${id}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedLoan(data.loan);
                setInstallments(data.installments);
            }
        } catch (e) {
            Swal.fire('Error', 'Error al cargar el cronograma.', 'error');
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleDeleteLoan = (id) => {
        Swal.fire({
            title: '¿Deseas eliminar este préstamo?',
            text: 'Se eliminará el préstamo, su cronograma y el registro de ingreso a caja si no tiene cuotas pagadas.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Eliminar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`${API_BASE}/api/deudas/${id}`, {
                        method: 'DELETE'
                    });
                    const data = await res.json();
                    if (res.ok) {
                        Swal.fire('Eliminado', 'Préstamo bancario eliminado.', 'success');
                        loadLoans();
                    } else {
                        Swal.fire('Error', data.message || 'No se pudo eliminar el préstamo.', 'error');
                    }
                } catch (e) {
                    Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
                }
            }
        });
    };

    // Pay installment
    const handlePayInstallment = (inst) => {
        Swal.fire({
            title: `Pagar Cuota #${inst.numero_cuota}`,
            text: `Importe a pagar: S/ ${parseFloat(inst.monto_cuota).toFixed(2)}`,
            icon: 'question',
            input: 'select',
            inputOptions: {
                'Transferencia': 'Transferencia Bancaria',
                'Efectivo': 'Efectivo',
                'Yape/Plin': 'Yape / Plin'
            },
            inputPlaceholder: 'Selecciona Método de Pago',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            confirmButtonText: 'Confirmar Pago',
            preConfirm: (value) => {
                if (!value) {
                    Swal.showValidationMessage('Debes elegir un método de pago.');
                }
                return value;
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`${API_BASE}/api/deudas/cuotas/pagar/${inst.id}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ metodo_pago: result.value })
                    });
                    if (res.ok) {
                        Swal.fire('Pago exitoso', 'La cuota ha sido pagada y se generó el egreso contable.', 'success');
                        handleViewDetails(inst.deuda_id);
                        loadLoans();
                    } else {
                        Swal.fire('Error', 'No se pudo procesar el pago.', 'error');
                    }
                } catch (e) {
                    Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
                }
            }
        });
    };

    // Annul installment payment
    const handleAnnulInstallment = (inst) => {
        Swal.fire({
            title: `¿Anular Pago de Cuota #${inst.numero_cuota}?`,
            text: 'Esto revertirá la cuota a Pendiente y eliminará el egreso contable y el egreso de caja generado.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, Anular'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`${API_BASE}/api/deudas/cuotas/anular/${inst.id}`, {
                        method: 'POST'
                    });
                    if (res.ok) {
                        Swal.fire('Anulado', 'El pago fue revertido con éxito.', 'success');
                        handleViewDetails(inst.deuda_id);
                        loadLoans();
                    } else {
                        Swal.fire('Error', 'No se pudo anular el pago.', 'error');
                    }
                } catch (e) {
                    Swal.fire('Error', 'Error de conexión.', 'error');
                }
            }
        });
    };

    // Edit installment values
    const handleEditInstallmentClick = (inst) => {
        setEditingInstallment({
            id: inst.id,
            deuda_id: inst.deuda_id,
            fecha_vencimiento: inst.fecha_vencimiento ? inst.fecha_vencimiento.split('T')[0] : '',
            monto_cuota: inst.monto_cuota,
            capital: inst.capital,
            interes: inst.interes,
            seguro_comisiones: inst.seguro_comisiones
        });
        setShowEditInstallment(true);
    };

    const handleInstallmentUpdateSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/api/deudas/cuotas/update/${editingInstallment.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fecha_vencimiento: editingInstallment.fecha_vencimiento,
                    monto_cuota: parseFloat(editingInstallment.monto_cuota),
                    capital: parseFloat(editingInstallment.capital),
                    interes: parseFloat(editingInstallment.interes),
                    seguro_comisiones: parseFloat(editingInstallment.seguro_comisiones)
                })
            });

            if (res.ok) {
                Swal.fire('Actualizado', 'La cuota de amortización fue actualizada.', 'success');
                setShowEditInstallment(false);
                handleViewDetails(editingInstallment.deuda_id);
            } else {
                Swal.fire('Error', 'No se pudo actualizar la cuota.', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
        }
    };

    return (
        <Container fluid className="px-4 py-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-extrabold text-dark mb-1">Deudas y Financiamientos</h2>
                    <p className="text-muted small mb-0">Registra préstamos bancarios, cronogramas de amortización de cuotas e integra los pagos con tus egresos de caja.</p>
                </div>
                <Button variant="primary" className="fw-bold px-3 py-2" onClick={handleNewLoan}>
                    <Icons.Plus size={16} className="me-2" />
                    Registrar Préstamo Bancario
                </Button>
            </div>

            {/* Loans Table */}
            {loading ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                    <Spinner animation="border" color="primary" />
                    <span className="ms-2">Cargando financiamientos...</span>
                </div>
            ) : (
                <Card className="border-0 shadow-sm rounded-3 overflow-hidden bg-white">
                    <Table hover responsive className="align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Entidad Bancaria</th>
                                <th>Nro Préstamo</th>
                                <th>Monto Otorgado</th>
                                <th>Fecha Desembolso</th>
                                <th>Tasa (TCEA)</th>
                                <th>Cuotas Pendientes</th>
                                <th>Saldo Pendiente</th>
                                <th>Estado</th>
                                <th className="text-end">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loans.map(l => (
                                <tr key={l.id}>
                                    <td>
                                        <div className="fw-bold text-dark">{l.entidad_bancaria}</div>
                                    </td>
                                    <td>
                                        <Badge bg="light" className="text-muted border border-light fw-bold px-2 py-1" style={{ fontSize: '11px' }}>
                                            🏦 {l.numero_prestamo || 'S.N.'}
                                        </Badge>
                                    </td>
                                    <td>
                                        <div className="fw-bold text-primary">{l.moneda} {parseFloat(l.monto_prestado || 0).toFixed(2)}</div>
                                    </td>
                                    <td>{l.fecha_inicio ? l.fecha_inicio.split('T')[0].split('-').reverse().join('/') : ''}</td>
                                    <td>{l.tcea}%</td>
                                    <td>
                                        <Badge bg="warning-soft" className="text-warning font-size-12">
                                            {l.cuotas_pendientes} / {l.cuotas_totales}
                                        </Badge>
                                    </td>
                                    <td>
                                        <span className="fw-bold">S/ {parseFloat(l.saldo_pendiente || 0).toFixed(2)}</span>
                                    </td>
                                    <td>
                                        <Badge bg={l.estado === 'Liquidada' ? 'success-soft text-success' : 'primary-soft text-primary'} className="border">
                                            {l.estado}
                                        </Badge>
                                    </td>
                                    <td className="text-end">
                                        <Button variant="link" className="p-1 text-primary hover-bg rounded-circle" onClick={() => handleViewDetails(l.id)} title="Ver Cronograma">
                                            <Icons.Calendar size={16} />
                                        </Button>
                                        <Button variant="link" className="p-1 text-danger hover-bg rounded-circle" onClick={() => handleDeleteLoan(l.id)} title="Eliminar">
                                            <Icons.Trash size={16} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {loans.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="text-center py-4 text-muted">No se encontraron deudas o préstamos registrados.</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card>
            )}

            {/* Create Loan Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" backdrop="static">
                <Form onSubmit={handleLoanSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title className="fw-bold">Registrar Préstamo Bancario</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Entidad Bancaria</Form.Label>
                                    <Form.Control
                                        type="text"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.entidad_bancaria}
                                        onChange={(e) => setForm({ ...form, entidad_bancaria: e.target.value })}
                                        placeholder="Ej: Banco de Crédito BCP"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Nro de Préstamo / Cuenta</Form.Label>
                                    <Form.Control
                                        type="text"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.numero_prestamo}
                                        onChange={(e) => setForm({ ...form, numero_prestamo: e.target.value })}
                                        placeholder="Ej: 193-45234523-0-03"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Monto Otorgado</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.monto_prestado}
                                        onChange={(e) => setForm({ ...form, monto_prestado: e.target.value })}
                                        placeholder="0.00"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Moneda</Form.Label>
                                    <Form.Select
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.moneda}
                                        onChange={(e) => setForm({ ...form, moneda: e.target.value })}
                                    >
                                        <option value="PEN">Soles (PEN)</option>
                                        <option value="USD">Dólares (USD)</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Tasa Anual (TCEA %)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.tcea}
                                        onChange={(e) => setForm({ ...form, tcea: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Fecha Desembolso</Form.Label>
                                    <Form.Control
                                        type="date"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.fecha_inicio}
                                        onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Nro de Cuotas Totales</Form.Label>
                                    <Form.Control
                                        type="number"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.cuotas_totales}
                                        onChange={(e) => setForm({ ...form, cuotas_totales: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Ingreso a Caja Vía</Form.Label>
                                    <Form.Select
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.metodo_recepcion}
                                        onChange={(e) => setForm({ ...form, metodo_recepcion: e.target.value })}
                                    >
                                        <option value="Transferencia">Transferencia Bancaria</option>
                                        <option value="Efectivo">Efectivo</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Notas / Observaciones</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.notes}
                                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                        placeholder="Destino del dinero, condiciones o periodo de gracia..."
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
                                    Generando Cronograma...
                                </>
                            ) : (
                                <>
                                    <Icons.DeviceFloppy size={16} className="me-2" />
                                    Registrar Préstamo
                                </>
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Details Modal */}
            <Modal show={showDetails} onHide={() => setShowDetails(false)} size="lg" backdrop="static">
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold">
                        Cronograma de Pagos: {selectedLoan?.entidad_bancaria} {selectedLoan?.numero_prestamo ? `(${selectedLoan.numero_prestamo})` : ''}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {loadingDetails ? (
                        <div className="d-flex justify-content-center align-items-center py-5">
                            <Spinner animation="border" color="primary" />
                        </div>
                    ) : (
                        <>
                            <Row className="mb-4 bg-light-soft p-3 rounded-3 g-3">
                                <Col md={4}>
                                    <div className="small text-muted fw-bold">Monto Otorgado:</div>
                                    <div className="fw-extrabold text-primary fs-5">{selectedLoan?.moneda} {parseFloat(selectedLoan?.monto_prestado || 0).toFixed(2)}</div>
                                </Col>
                                <Col md={4}>
                                    <div className="small text-muted fw-bold">Fecha Desembolso:</div>
                                    <div className="fw-bold text-dark">{selectedLoan?.fecha_inicio ? selectedLoan.fecha_inicio.split('T')[0].split('-').reverse().join('/') : ''}</div>
                                </Col>
                                <Col md={4}>
                                    <div className="small text-muted fw-bold">Tasa (TCEA):</div>
                                    <div className="fw-bold text-dark">{selectedLoan?.tcea}%</div>
                                </Col>
                            </Row>

                            <Table responsive hover className="align-middle mb-0 border rounded-3 bg-white">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{ width: '60px' }}>Cuota</th>
                                        <th>Vencimiento</th>
                                        <th>Monto Cuota</th>
                                        <th>Amort. Capital</th>
                                        <th>Intereses</th>
                                        <th>Seguro / Com.</th>
                                        <th>Estado</th>
                                        <th className="text-end" style={{ width: '150px' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {installments.map(inst => (
                                        <tr key={inst.id}>
                                            <td className="fw-bold text-secondary">#{inst.numero_cuota}</td>
                                            <td>{inst.fecha_vencimiento ? inst.fecha_vencimiento.split('T')[0].split('-').reverse().join('/') : ''}</td>
                                            <td>
                                                <span className="fw-bold text-dark">S/ {parseFloat(inst.monto_cuota || 0).toFixed(2)}</span>
                                            </td>
                                            <td>S/ {parseFloat(inst.capital || 0).toFixed(2)}</td>
                                            <td>S/ {parseFloat(inst.interes || 0).toFixed(2)}</td>
                                            <td>S/ {parseFloat(inst.seguro_comisiones || 0).toFixed(2)}</td>
                                            <td>
                                                <Badge bg={inst.estado === 'Pagado' ? 'success-soft text-success' : 'danger-soft text-danger'} className="border">
                                                    {inst.estado}
                                                </Badge>
                                            </td>
                                            <td className="text-end">
                                                {inst.estado === 'Pendiente' ? (
                                                    <>
                                                        <Button variant="link" className="p-1 text-primary hover-bg rounded-circle" onClick={() => handleEditInstallmentClick(inst)} title="Ajustar Cuota">
                                                            <Icons.Edit size={16} />
                                                        </Button>
                                                        <Button variant="link" className="p-1 text-success hover-bg rounded-circle" onClick={() => handlePayInstallment(inst)} title="Registrar Pago">
                                                            <Icons.Check size={16} />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Button variant="link" className="p-1 text-danger hover-bg rounded-circle" onClick={() => handleAnnulInstallment(inst)} title="Anular Pago">
                                                        <Icons.CircleX size={16} />
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => setShowDetails(false)}>
                        Cerrar Cronograma
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Edit Installment Modal */}
            <Modal show={showEditInstallment} onHide={() => setShowEditInstallment(false)} backdrop="static">
                <Form onSubmit={handleInstallmentUpdateSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title className="fw-bold">Ajustar Cuota Amortización</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Fecha Vencimiento</Form.Label>
                                    <Form.Control
                                        type="date"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={editingInstallment.fecha_vencimiento}
                                        onChange={(e) => setEditingInstallment({ ...editingInstallment, fecha_vencimiento: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Monto de la Cuota</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={editingInstallment.monto_cuota}
                                        onChange={(e) => setEditingInstallment({ ...editingInstallment, monto_cuota: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Capital</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={editingInstallment.capital}
                                        onChange={(e) => setEditingInstallment({ ...editingInstallment, capital: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Interés</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={editingInstallment.interes}
                                        onChange={(e) => setEditingInstallment({ ...editingInstallment, interes: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Seguro / Com.</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={editingInstallment.seguro_comisiones}
                                        onChange={(e) => setEditingInstallment({ ...editingInstallment, seguro_comisiones: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" onClick={() => setShowEditInstallment(false)}>
                            Cancelar
                        </Button>
                        <Button variant="primary" type="submit">
                            Actualizar Cuota
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
}
