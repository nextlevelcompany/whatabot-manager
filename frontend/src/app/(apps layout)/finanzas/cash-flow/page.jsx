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

export default function CashFlowPage() {
    const [movements, setMovements] = useState([]);
    const [balances, setBalances] = useState([]);
    const [summary, setSummary] = useState({ total_ingresos: 0, total_egresos: 0, saldo_neto: 0 });
    const [loading, setLoading] = useState(true);

    // Filters
    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');
    const [tipo, setTipo] = useState('all');
    const [metodo, setMetodo] = useState('all');

    // Register Modal
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const defaultForm = {
        id: null,
        tipo: 'Ingreso',
        categoria: 'Ajuste',
        monto: '',
        metodo_pago: 'Transferencia',
        notas: '',
        fecha: new Date().toISOString().split('T')[0] + ' 12:00:00'
    };
    const [form, setForm] = useState(defaultForm);

    const loadData = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({ desde, hasta, tipo, metodo }).toString();
            const movRes = await fetch(`${API_BASE}/api/finanzas/movimientos?${queryParams}`);
            const salRes = await fetch(`${API_BASE}/api/finanzas/saldos`);
            const sumRes = await fetch(`${API_BASE}/api/finanzas/resumen?${queryParams}`);

            if (movRes.ok) setMovements(await movRes.json());
            if (salRes.ok) setBalances(await salRes.json());
            if (sumRes.ok) setSummary(await sumRes.json());
        } catch (e) {
            console.error("Error loading cash flow data", e);
            Swal.fire('Error', 'No se pudieron cargar los movimientos de caja.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [desde, hasta, tipo, metodo]);

    const handleNew = () => {
        setForm(defaultForm);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/finanzas/movimientos/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...form,
                    monto: parseFloat(form.monto)
                })
            });

            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Registrado',
                    text: 'Movimiento de caja registrado con éxito.',
                    timer: 1500,
                    showConfirmButton: false
                });
                setShowModal(false);
                loadData();
            } else {
                Swal.fire('Error', 'No se pudo guardar el movimiento.', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleVoid = (id) => {
        Swal.fire({
            title: '¿Deseas anular este movimiento?',
            text: 'Se generará una transacción de contrarregistro en caja para revertir el saldo.',
            input: 'text',
            inputPlaceholder: 'Motivo de la anulación...',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Anular Movimiento',
            preConfirm: (val) => {
                if (!val) {
                    Swal.showValidationMessage('Debes ingresar una explicación o motivo.');
                }
                return val;
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`${API_BASE}/api/finanzas/movimientos/anular/${id}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ observacion: result.value })
                    });
                    const data = await res.json();
                    if (res.ok) {
                        Swal.fire('Anulado', 'El movimiento ha sido anulado.', 'success');
                        loadData();
                    } else {
                        Swal.fire('Error', data.message || 'No se pudo anular el movimiento.', 'error');
                    }
                } catch (e) {
                    Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
                }
            }
        });
    };

    const getBadgeForMethod = (method) => {
        switch (method?.toLowerCase()) {
            case 'yape/plin': return 'info-soft text-info';
            case 'transferencia': return 'primary-soft text-primary';
            case 'efectivo': return 'success-soft text-success';
            default: return 'light text-dark';
        }
    };

    return (
        <Container fluid className="px-4 py-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-extrabold text-dark mb-1">Movimientos de Caja</h2>
                    <p className="text-muted small mb-0">Controla el flujo de caja, arqueo de cuentas y balances por método de pago de forma consolidada.</p>
                </div>
                <Button variant="primary" className="fw-bold px-3 py-2" onClick={handleNew}>
                    <Icons.Plus size={16} className="me-2" />
                    Registrar Ajuste / Movimiento Manual
                </Button>
            </div>

            {/* Account Balances Grid */}
            <h6 className="fw-bold text-dark mb-3">Saldos por Cuenta / Método de Pago</h6>
            <Row className="g-3 mb-4">
                {balances.map((b, i) => (
                    <Col md={4} key={i}>
                        <Card className="shadow-sm border-0 bg-white rounded-3">
                            <Card.Body className="p-3 d-flex align-items-center">
                                <div className={`p-2 rounded-circle me-3 bg-light`}>
                                    {b.metodo_pago?.toLowerCase() === 'efectivo' ? <Icons.Cash size={22} className="text-success" /> :
                                     b.metodo_pago?.toLowerCase() === 'transferencia' ? <Icons.BuildingBank size={22} className="text-primary" /> :
                                     <Icons.DeviceMobile size={22} className="text-info" />}
                                </div>
                                <div className="w-100">
                                    <div className="small text-muted fw-semibold">{b.metodo_pago}</div>
                                    <h4 className="fw-extrabold mb-0 d-flex justify-content-between">
                                        S/ {parseFloat(b.saldo || 0).toFixed(2)}
                                        <small className="text-muted fw-normal" style={{ fontSize: '11px', alignSelf: 'center' }}>
                                            (+{parseFloat(b.ingresos || 0).toFixed(0)} / -{parseFloat(b.egresos || 0).toFixed(0)})
                                        </small>
                                    </h4>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
                {balances.length === 0 && (
                    <Col md={12} className="text-center py-2 text-muted small">No hay saldos registrados aún.</Col>
                )}
            </Row>

            {/* Period Summary & Filters */}
            <Row className="g-4 mb-4">
                <Col lg={4}>
                    <Card className="shadow-sm border-0 bg-primary-soft border-primary border-top border-3 rounded-3 h-100">
                        <Card.Body className="p-4 d-flex flex-column justify-content-between">
                            <div>
                                <h6 className="fw-bold text-primary mb-3">Balance del Periodo Seleccionado</h6>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="small text-muted">Ingresos Totales:</span>
                                    <strong className="text-success">S/ {parseFloat(summary.total_ingresos || 0).toFixed(2)}</strong>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="small text-muted">Egresos Totales:</span>
                                    <strong className="text-danger">S/ {parseFloat(summary.total_egresos || 0).toFixed(2)}</strong>
                                </div>
                            </div>
                            <div className="border-top pt-3 mt-3">
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="fw-bold text-dark fs-6">Saldo Neto:</span>
                                    <h4 className={`fw-extrabold mb-0 ${summary.saldo_neto >= 0 ? 'text-success' : 'text-danger'}`}>
                                        S/ {parseFloat(summary.saldo_neto || 0).toFixed(2)}
                                    </h4>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={8}>
                    <Card className="shadow-sm border-0 bg-white rounded-3 h-100">
                        <Card.Body className="p-4">
                            <h6 className="fw-bold text-dark mb-3">Filtros de Búsqueda</h6>
                            <Row className="g-3">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="small fw-semibold text-muted mb-1">Desde</Form.Label>
                                        <Form.Control
                                            type="date"
                                            className="shadow-none border-light-soft bg-light-soft"
                                            value={desde}
                                            onChange={(e) => setDesde(e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="small fw-semibold text-muted mb-1">Hasta</Form.Label>
                                        <Form.Control
                                            type="date"
                                            className="shadow-none border-light-soft bg-light-soft"
                                            value={hasta}
                                            onChange={(e) => setHasta(e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="small fw-semibold text-muted mb-1">Tipo de Flujo</Form.Label>
                                        <Form.Select
                                            className="shadow-none border-light-soft bg-light-soft"
                                            value={tipo}
                                            onChange={(e) => setTipo(e.target.value)}
                                        >
                                            <option value="all">Todos los flujos</option>
                                            <option value="Ingreso">Ingresos (+)</option>
                                            <option value="Egreso">Egresos (-)</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="small fw-semibold text-muted mb-1">Cuenta / Método</Form.Label>
                                        <Form.Select
                                            className="shadow-none border-light-soft bg-light-soft"
                                            value={metodo}
                                            onChange={(e) => setMetodo(e.target.value)}
                                        >
                                            <option value="all">Todos los métodos</option>
                                            <option value="Transferencia">Transferencia Bancaria</option>
                                            <option value="Efectivo">Efectivo</option>
                                            <option value="Yape/Plin">Yape / Plin</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Movements List */}
            {loading ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                    <Spinner animation="border" color="primary" />
                    <span className="ms-2">Filtrando flujo de caja...</span>
                </div>
            ) : (
                <Card className="border-0 shadow-sm rounded-3 overflow-hidden bg-white">
                    <Table hover responsive className="align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Fecha / Hora</th>
                                <th>Tipo</th>
                                <th>Categoría</th>
                                <th>Método / Cuenta</th>
                                <th>Referencia / Detalle</th>
                                <th>Monto</th>
                                <th>Responsable</th>
                                <th className="text-end" style={{ width: '80px' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {movements.map(m => (
                                <tr key={m.id} className={m.notas?.includes('ANULADO') ? 'opacity-50 text-decoration-line-through' : ''}>
                                    <td className="small">
                                        {m.fecha ? new Date(m.fecha).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                                    </td>
                                    <td>
                                        <Badge bg={m.tipo === 'Ingreso' ? 'success-soft text-success' : 'danger-soft text-danger'} className="border">
                                            {m.tipo}
                                        </Badge>
                                    </td>
                                    <td>
                                        <div className="fw-bold">{m.categoria}</div>
                                    </td>
                                    <td>
                                        <Badge bg={getBadgeForMethod(m.metodo_pago)} className="border">
                                            {m.metodo_pago}
                                        </Badge>
                                    </td>
                                    <td style={{ maxWidth: '250px' }} className="text-truncate" title={m.notas}>
                                        <div className="small fw-semibold">{m.doc_referencia || 'Registro Manual'}</div>
                                        <small className="text-muted">{m.notas || 'Sin notas'}</small>
                                    </td>
                                    <td>
                                        <span className={`fw-extrabold ${m.tipo === 'Ingreso' ? 'text-success' : 'text-danger'}`}>
                                            {m.tipo === 'Ingreso' ? '+' : '-'} S/ {parseFloat(m.monto || 0).toFixed(2)}
                                        </span>
                                    </td>
                                    <td>
                                        <small className="text-muted">🧑‍💼 {m.usuario_nombre || 'Sistema'}</small>
                                    </td>
                                    <td className="text-end">
                                        {!m.notas?.includes('ANULADO') && m.categoria !== 'Anulación' && (
                                            <Button variant="link" className="p-1 text-danger hover-bg rounded-circle" onClick={() => handleVoid(m.id)} title="Anular Movimiento">
                                                <Icons.CircleX size={16} />
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {movements.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center py-4 text-muted">No se encontraron movimientos para el filtro seleccionado.</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card>
            )}

            {/* Manual Movement Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static">
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title className="fw-bold">Ajuste / Registro Manual de Caja</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Tipo de Movimiento</Form.Label>
                                    <Form.Select
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.tipo}
                                        onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                                    >
                                        <option value="Ingreso">Ingreso (+)</option>
                                        <option value="Egreso">Egreso (-)</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Categoría</Form.Label>
                                    <Form.Select
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.categoria}
                                        onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                                    >
                                        <option value="Ajuste">Ajuste de Saldo</option>
                                        <option value="Aporte">Aporte Capital Socios</option>
                                        <option value="Retiro">Retiro de Caja / Dueños</option>
                                        <option value="Transferencia Cuenta">Traspaso Entre Cuentas</option>
                                        <option value="Préstamo Socio">Préstamo de Socio</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Cuenta / Método</Form.Label>
                                    <Form.Select
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.metodo_pago}
                                        onChange={(e) => setForm({ ...form, metodo_pago: e.target.value })}
                                    >
                                        <option value="Transferencia">Transferencia Bancaria</option>
                                        <option value="Efectivo">Efectivo</option>
                                        <option value="Yape/Plin">Yape / Plin</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Monto (S/)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.monto}
                                        onChange={(e) => setForm({ ...form, monto: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Notas / Observaciones</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.notas}
                                        onChange={(e) => setForm({ ...form, notas: e.target.value })}
                                        placeholder="Indica el motivo del ajuste o transferencia..."
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
                                    Registrar Movimiento
                                </>
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
}
