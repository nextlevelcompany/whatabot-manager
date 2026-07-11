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

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    // Filters
    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');
    const [tipo, setTipo] = useState('all');
    const [metodo, setMetodo] = useState('all');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('cashflow_sidebar_collapsed') === 'true';
        }
        return false;
    });

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

    const getLocalDateString = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const filterByDay = (dateStr) => {
        setDesde(desde === dateStr ? '' : dateStr);
        setHasta(hasta === dateStr ? '' : dateStr);
        setCurrentPage(1);
    };

    const getWeekDays = () => {
        const list = [];
        const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
        const now = new Date();
        now.setHours(12, 0, 0, 0); 
        const start = new Date(now);
        start.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));

        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const dateStr = getLocalDateString(d);
            const label = days[d.getDay()];
            const dayNum = d.getDate();
            const isToday = dateStr === getLocalDateString(now);
            const isActive = desde === dateStr && hasta === dateStr;

            list.push({ dateStr, label, dayNum, isToday, isActive });
        }
        return list;
    };

    const weekDays = getWeekDays();

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
            case 'yape/plin': return 'info text-white';
            case 'transferencia': return 'primary text-white';
            case 'efectivo': return 'success text-white';
            default: return 'secondary text-white';
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



            {/* Period Summary KPI */}
            <h6 className="fw-bold text-dark mb-3">Balance del Periodo Seleccionado</h6>
            <Row className="mb-4">
                <Col md={4}>
                    <Card className="shadow-sm border-0 bg-white">
                        <Card.Body className="p-3 text-center">
                            <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '10px' }}>Ingresos Totales</small>
                            <h4 className="mb-0 fw-bold text-success mt-1">S/ {parseFloat(summary.total_ingresos || 0).toFixed(2)}</h4>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="shadow-sm border-0 bg-white">
                        <Card.Body className="p-3 text-center">
                            <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '10px' }}>Egresos Totales</small>
                            <h4 className="mb-0 fw-bold text-danger mt-1">S/ {parseFloat(summary.total_egresos || 0).toFixed(2)}</h4>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="shadow-sm border-0 bg-white">
                        <Card.Body className="p-3 text-center">
                            <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '10px' }}>Saldo Neto</small>
                            <h4 className={`mb-0 fw-bold mt-1 ${summary.saldo_neto >= 0 ? 'text-primary' : 'text-danger'}`}>
                                S/ {parseFloat(summary.saldo_neto || 0).toFixed(2)}
                            </h4>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                {/* Filters Sidebar */}
                {!sidebarCollapsed && (
                    <Col lg={3} className="mb-4">
                        <div className="bg-white p-4 rounded shadow-sm border" style={{ position: 'sticky', top: '20px' }}>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div className="d-flex align-items-center gap-2">
                                    <h5 className="mb-0 fw-bold text-dark" style={{ fontSize: '14px' }}>FILTROS</h5>
                                    <Button
                                        variant="light"
                                        size="sm"
                                        className="p-1 border d-flex align-items-center justify-content-center rounded-circle"
                                        onClick={() => {
                                            setSidebarCollapsed(true);
                                            localStorage.setItem('cashflow_sidebar_collapsed', 'true');
                                        }}
                                        title="Ocultar filtros"
                                    >
                                        <Icons.ChevronLeft size={14} className="text-muted" />
                                    </Button>
                                </div>
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="text-danger fw-bold text-decoration-none p-0"
                                    onClick={() => {
                                        setDesde('');
                                        setHasta('');
                                        setTipo('all');
                                        setMetodo('all');
                                    }}
                                >
                                    LIMPIAR
                                </Button>
                            </div>

                            <div className="mb-4">
                                <span className="d-block text-muted fw-bold mb-2" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Movimientos diarios</span>
                                <div className="d-flex justify-content-between gap-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                                    {weekDays.map(day => (
                                        <button
                                            key={day.dateStr}
                                            onClick={() => filterByDay(day.dateStr)}
                                            className={`btn btn-sm d-flex flex-column align-items-center justify-content-center p-1 rounded-3 ${
                                                day.isActive ? 'bg-dark text-white shadow border-dark' : (day.isToday ? 'btn-soft-primary border-primary' : 'btn-light border')
                                            }`}
                                            style={{ minHeight: '45px', width: '100%', minWidth: 0, overflow: 'hidden' }}
                                        >
                                            <span style={{ fontSize: '7.5px', fontWeight: '800' }}>{day.label}</span>
                                            <span className="fw-bold" style={{ fontSize: '11px' }}>{day.dayNum}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-4">
                                <span className="d-block text-muted fw-bold mb-2" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Rango de Fechas</span>
                                <Row className="g-2">
                                    <Col xs={6}>
                                        <Form.Control
                                            type="date"
                                            size="sm"
                                            value={desde}
                                            onChange={(e) => setDesde(e.target.value)}
                                        />
                                    </Col>
                                    <Col xs={6}>
                                        <Form.Control
                                            type="date"
                                            size="sm"
                                            value={hasta}
                                            onChange={(e) => setHasta(e.target.value)}
                                        />
                                    </Col>
                                </Row>
                            </div>

                            <div className="mb-4">
                                <span className="d-block text-muted fw-bold mb-2" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Tipo de Flujo</span>
                                <Form.Select size="sm" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                                    <option value="all">Todos los flujos</option>
                                    <option value="Ingreso">Ingresos (+)</option>
                                    <option value="Egreso">Egresos (-)</option>
                                </Form.Select>
                            </div>

                            <div className="mb-4">
                                <span className="d-block text-muted fw-bold mb-2" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Cuenta / Método</span>
                                <Form.Select size="sm" value={metodo} onChange={(e) => setMetodo(e.target.value)}>
                                    <option value="all">Todos los métodos</option>
                                    <option value="Transferencia">Transferencia Bancaria</option>
                                    <option value="Efectivo">Efectivo</option>
                                    <option value="Yape/Plin">Yape / Plin</option>
                                </Form.Select>
                            </div>

                            {/* Account Balances in Sidebar */}
                            <div className="mt-4 pt-4 border-top">
                                <span className="d-block text-muted fw-bold mb-3" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>SALDOS POR CUENTA / MÉTODO</span>
                                <div className="d-flex flex-column gap-2">
                                    {balances.map((b, i) => (
                                        <div key={i} className="p-2 border rounded-3 bg-light-soft d-flex align-items-center">
                                            <div className="p-2 rounded-circle me-2 bg-white shadow-sm border">
                                                {b.metodo_pago?.toLowerCase() === 'efectivo' ? <Icons.Cash size={16} className="text-success" /> :
                                                 b.metodo_pago?.toLowerCase() === 'transferencia' ? <Icons.BuildingBank size={16} className="text-primary" /> :
                                                 <Icons.DeviceMobile size={16} className="text-info" />}
                                            </div>
                                            <div className="w-100">
                                                <div className="small text-muted fw-semibold" style={{ fontSize: '10px' }}>{b.metodo_pago}</div>
                                                <div className="d-flex justify-content-between align-items-end mt-1">
                                                    <span className="fw-extrabold text-dark" style={{ fontSize: '13px' }}>S/ {parseFloat(b.saldo || 0).toFixed(2)}</span>
                                                    <small className="text-muted" style={{ fontSize: '9px' }}>
                                                        (+{parseFloat(b.ingresos || 0).toFixed(0)} / -{parseFloat(b.egresos || 0).toFixed(0)})
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {balances.length === 0 && (
                                        <div className="text-center py-2 text-muted small">No hay saldos registrados aún.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Col>
                )}

                {/* Main Content */}
                <Col lg={sidebarCollapsed ? 12 : 9}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center gap-2">
                            {sidebarCollapsed && (
                                <Button
                                    variant="light"
                                    size="sm"
                                    className="d-flex align-items-center justify-content-center p-2 border rounded-circle shadow-sm"
                                    onClick={() => {
                                        setSidebarCollapsed(false);
                                        localStorage.setItem('cashflow_sidebar_collapsed', 'false');
                                    }}
                                    title="Mostrar filtros"
                                >
                                    <Icons.Filter size={16} className="text-primary" />
                                </Button>
                            )}
                            <h6 className="fw-bold text-dark mb-0">Listado de Movimientos</h6>
                        </div>
                    </div>

                    {/* Movements List */}
                    {loading ? (
                        <div className="d-flex justify-content-center align-items-center py-5">
                            <Spinner animation="border" color="primary" />
                            <span className="ms-2">Filtrando flujo de caja...</span>
                        </div>
                    ) : (
                        <Card className="border-0 shadow-sm rounded-3 overflow-hidden bg-white">
                            <Table hover responsive className="align-middle mb-0 text-nowrap">
                                <thead className="table-light text-muted font-size-12">
                                    <tr>
                                        <th className="ps-3">Fecha / Hora</th>
                                        <th>Tipo</th>
                                        <th>Categoría</th>
                                        <th>Método / Cuenta</th>
                                        <th>Referencia / Detalle</th>
                                        <th>Monto</th>
                                        <th>Responsable</th>
                                        <th className="text-end pe-3" style={{ width: '80px' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                            {movements.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(m => (
                                <tr key={m.id} className={m.notas?.includes('ANULADO') ? 'opacity-50 text-decoration-line-through' : ''}>
                                    <td className="small">
                                        {m.fecha ? new Date(m.fecha).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                                    </td>
                                    <td>
                                        <Badge bg={m.tipo === 'Ingreso' ? 'success text-white' : 'danger text-white'} className="border-0 rounded-pill px-2 py-1">
                                            {m.tipo === 'Ingreso' ? '● Ingreso' : '○ Egreso'}
                                        </Badge>
                                    </td>
                                    <td>
                                        <div className="fw-bold">{m.categoria}</div>
                                    </td>
                                    <td>
                                        <Badge bg={getBadgeForMethod(m.metodo_pago)} className="border-0 rounded-pill px-2 py-1">
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
                    {movements.length > 0 && (
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-3 border-top bg-light-soft">
                            <div className="text-muted small mb-2 mb-md-0 fw-semibold">
                                Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, movements.length)} de {movements.length} movimientos
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <Form.Select size="sm" style={{ width: '80px' }} value={itemsPerPage} onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}>
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </Form.Select>
                                <div className="btn-group">
                                    <Button 
                                        variant="outline-secondary" 
                                        size="sm" 
                                        className="fw-bold"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Anterior
                                    </Button>
                                    <Button variant="outline-secondary" size="sm" disabled className="fw-bold text-dark">
                                        {currentPage} / {Math.ceil(movements.length / itemsPerPage)}
                                    </Button>
                                    <Button 
                                        variant="outline-secondary" 
                                        size="sm" 
                                        className="fw-bold"
                                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(movements.length / itemsPerPage), p + 1))}
                                        disabled={currentPage === Math.ceil(movements.length / itemsPerPage)}
                                    >
                                        Siguiente
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </Card>
            )}
                </Col>
            </Row>

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
