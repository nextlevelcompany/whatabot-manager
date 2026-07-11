"use client"
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Badge, Modal, Spinner, Tabs, Tab } from 'react-bootstrap';
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

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({ total_mes: 0, total_pendiente: 0 });
    const [activeKey, setActiveKey] = useState('expenses');

    // Filters
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [filterDesde, setFilterDesde] = useState('');
    const [filterHasta, setFilterHasta] = useState('');
    const [filterMetodo, setFilterMetodo] = useState('all');
    const [filterEstado, setFilterEstado] = useState('all');

    useEffect(() => {
        const saved = localStorage.getItem('expenses_sidebar_collapsed');
        if (saved) setSidebarCollapsed(saved === 'true');
    }, []);

    const getLocalDateString = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const filterByDay = (dateStr) => {
        setFilterDesde(filterDesde === dateStr ? '' : dateStr);
        setFilterHasta(filterHasta === dateStr ? '' : dateStr);
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
            const isActive = filterDesde === dateStr && filterHasta === dateStr;

            list.push({ dateStr, label, dayNum, isToday, isActive });
        }
        return list;
    };

    const weekDays = getWeekDays();

    // Local Filtering for Expenses
    const filteredExpenses = expenses.filter(e => {
        if (filterDesde && e.fecha_gasto < filterDesde) return false;
        if (filterHasta && e.fecha_gasto > filterHasta + 'T23:59:59') return false;
        if (filterEstado !== 'all' && e.estado_pago !== filterEstado) return false;
        if (filterMetodo !== 'all' && e.metodo_pago !== filterMetodo) return false;
        return true;
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    // Expense Form Modal
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const defaultForm = {
        id: null,
        proveedor_id: '',
        categoria_id: '',
        vehiculo_id: '',
        fecha_gasto: new Date().toISOString().split('T')[0],
        numero_comprobante: '',
        tipo_comprobante: 'Ninguno',
        descripcion: '',
        cantidad: 1,
        costo_unitario: 0,
        monto_total: 0,
        estado_pago: 'Pagado',
        metodo_pago: 'Transferencia',
        archivo_comprobante: ''
    };

    const [form, setForm] = useState(defaultForm);

    // Category Modal
    const [showCatModal, setShowCatModal] = useState(false);
    const defaultCatForm = {
        id: null,
        nombre: '',
        tipo: 'Operativo',
        grupo_contable: 'Otros Gastos',
        afecta_margen_bidon: false,
        afecta_cac: false,
        activo: true
    };
    const [catForm, setCatForm] = useState(defaultCatForm);

    const loadData = async () => {
        setLoading(true);
        try {
            const expRes = await fetch(`${API_BASE}/api/gastos`);
            const catRes = await fetch(`${API_BASE}/api/gastos/categorias`);
            const provRes = await fetch(`${API_BASE}/api/proveedores`);
            const fleetRes = await fetch(`${API_BASE}/api/conductores`);
            const sumRes = await fetch(`${API_BASE}/api/gastos/summary`);

            if (expRes.ok) setExpenses(await expRes.json());
            if (catRes.ok) setCategories(await catRes.json());
            if (provRes.ok) setSuppliers(await provRes.json());
            if (fleetRes.ok) setDrivers(await fleetRes.json());
            if (sumRes.ok) setSummary(await sumRes.json());
        } catch (e) {
            console.error("Error loading expenses data", e);
            Swal.fire('Error', 'No se pudieron cargar los datos de egresos.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Expense CRUD handlers
    const handleNewExpense = () => {
        setForm(defaultForm);
        setShowModal(true);
    };

    const handleEditExpense = (exp) => {
        setForm({
            ...defaultForm,
            ...exp,
            proveedor_id: exp.proveedor_id || '',
            categoria_id: exp.categoria_id || '',
            vehiculo_id: exp.vehiculo_id || '',
            fecha_gasto: exp.fecha_gasto ? exp.fecha_gasto.split('T')[0] : ''
        });
        setShowModal(true);
    };

    const handleDeleteExpense = (id) => {
        Swal.fire({
            title: '¿Deseas eliminar este egreso?',
            text: 'Se eliminará permanentemente de la contabilidad de egresos.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Eliminar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`${API_BASE}/api/gastos/${id}`, {
                        method: 'DELETE'
                    });
                    if (res.ok) {
                        Swal.fire('Eliminado', 'El egreso ha sido eliminado.', 'success');
                        loadData();
                    } else {
                        Swal.fire('Error', 'No se pudo eliminar el egreso.', 'error');
                    }
                } catch (e) {
                    Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
                }
            }
        });
    };

    const handleExpenseSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = {
                ...form,
                proveedor_id: form.proveedor_id !== '' ? parseInt(form.proveedor_id) : null,
                categoria_id: form.categoria_id !== '' ? parseInt(form.categoria_id) : null,
                vehiculo_id: form.vehiculo_id !== '' ? parseInt(form.vehiculo_id) : null,
                monto_total: parseFloat(form.monto_total)
            };

            const res = await fetch(`${API_BASE}/api/gastos/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Guardado',
                    text: 'El egreso ha sido registrado con éxito.',
                    timer: 1500,
                    showConfirmButton: false
                });
                setShowModal(false);
                loadData();
            } else {
                Swal.fire('Error', 'No se pudo registrar el egreso.', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Category CRUD handlers
    const handleNewCategory = () => {
        setCatForm(defaultCatForm);
        setShowCatModal(true);
    };

    const handleEditCategory = (cat) => {
        setCatForm({
            ...defaultCatForm,
            ...cat
        });
        setShowCatModal(true);
    };

    const handleDeleteCategory = (id) => {
        Swal.fire({
            title: '¿Deseas eliminar esta categoría?',
            text: 'Se eliminará la categoría si no tiene ningún gasto contable asociado.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Eliminar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`${API_BASE}/api/gastos/categorias/${id}`, {
                        method: 'DELETE'
                    });
                    const data = await res.json();
                    if (res.ok) {
                        Swal.fire('Eliminado', 'La categoría de gastos fue eliminada.', 'success');
                        loadData();
                    } else {
                        Swal.fire('Error', data.message || 'No se pudo eliminar la categoría.', 'error');
                    }
                } catch (e) {
                    Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
                }
            }
        });
    };

    const handleCatSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/gastos/categorias/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(catForm)
            });

            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Guardado',
                    text: 'La categoría de gasto fue guardada.',
                    timer: 1500,
                    showConfirmButton: false
                });
                setShowCatModal(false);
                loadData();
            } else {
                Swal.fire('Error', 'No se pudo guardar la categoría.', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Container fluid className="px-4 py-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-extrabold text-dark mb-1">Registro de Egresos</h2>
                    <p className="text-muted small mb-0">Monitorea y registra los egresos contables, compras generales y administra tus categorías de gastos.</p>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="outline-primary" className="fw-bold" onClick={handleNewCategory}>
                        <Icons.Plus size={16} className="me-2" />
                        Nueva Categoría
                    </Button>
                    <Button variant="primary" className="fw-bold" onClick={handleNewExpense}>
                        <Icons.Plus size={16} className="me-2" />
                        Registrar Egreso
                    </Button>
                </div>
            </div>

            {/* Financial Summary Cards */}
            <Row className="mb-4 g-3">
                <Col md={6}>
                    <Card className="shadow-sm border-0 bg-primary-soft border-primary border-start border-4 rounded-3">
                        <Card.Body className="p-4 d-flex justify-content-between align-items-center">
                            <div>
                                <span className="text-muted fw-semibold small text-uppercase d-block mb-1">Egresos Totales del Mes</span>
                                <h3 className="fw-extrabold text-primary mb-0">S/ {parseFloat(summary.total_mes || 0).toFixed(2)}</h3>
                            </div>
                            <div className="p-3 bg-white rounded-circle shadow-sm text-primary">
                                <Icons.ReceiptTax size={26} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="shadow-sm border-0 bg-warning-soft border-warning border-start border-4 rounded-3">
                        <Card.Body className="p-4 d-flex justify-content-between align-items-center">
                            <div>
                                <span className="text-muted fw-semibold small text-uppercase d-block mb-1">Egresos Pendientes de Pago</span>
                                <h3 className="fw-extrabold text-warning mb-0">S/ {parseFloat(summary.total_pendiente || 0).toFixed(2)}</h3>
                            </div>
                            <div className="p-3 bg-white rounded-circle shadow-sm text-warning">
                                <Icons.Clock size={26} />
                            </div>
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
                                            localStorage.setItem('expenses_sidebar_collapsed', 'true');
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
                                        setFilterDesde('');
                                        setFilterHasta('');
                                        setFilterEstado('all');
                                        setFilterMetodo('all');
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
                                            value={filterDesde}
                                            onChange={(e) => setFilterDesde(e.target.value)}
                                        />
                                    </Col>
                                    <Col xs={6}>
                                        <Form.Control
                                            type="date"
                                            size="sm"
                                            value={filterHasta}
                                            onChange={(e) => setFilterHasta(e.target.value)}
                                        />
                                    </Col>
                                </Row>
                            </div>

                            <div className="mb-4">
                                <span className="d-block text-muted fw-bold mb-2" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Estado de Pago</span>
                                <Form.Select size="sm" value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
                                    <option value="all">Todos los estados</option>
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="Pagado">Pagado</option>
                                    <option value="Anulado">Anulado</option>
                                </Form.Select>
                            </div>

                            <div className="mb-4">
                                <span className="d-block text-muted fw-bold mb-2" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Método de Pago</span>
                                <Form.Select size="sm" value={filterMetodo} onChange={(e) => setFilterMetodo(e.target.value)}>
                                    <option value="all">Todos los métodos</option>
                                    <option value="Transferencia">Transferencia Bancaria</option>
                                    <option value="Efectivo">Efectivo</option>
                                    <option value="Yape/Plin">Yape / Plin</option>
                                    <option value="Tarjeta">Tarjeta</option>
                                </Form.Select>
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
                                    variant="primary" 
                                    size="sm" 
                                    className="d-flex align-items-center gap-1 shadow-sm px-3" 
                                    onClick={() => {
                                        setSidebarCollapsed(false);
                                        localStorage.setItem('expenses_sidebar_collapsed', 'false');
                                    }}
                                >
                                    <Icons.Filter size={16} />
                                    Mostrar filtros
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Navigation Tabs */}
            <Card className="border-0 shadow-sm rounded-3 overflow-hidden bg-white mb-4">
                <Card.Body className="p-0">
                    <Tabs
                        activeKey={activeKey}
                        onSelect={(k) => setActiveKey(k)}
                        className="custom-tabs border-bottom px-3 pt-2"
                        variant="tabs"
                    >
                        <Tab eventKey="expenses" title="Egresos y Gastos">
                            {loading ? (
                                <div className="d-flex justify-content-center align-items-center py-5">
                                    <Spinner animation="border" color="primary" />
                                    <span className="ms-2">Cargando egresos...</span>
                                </div>
                            ) : (
                                <Table hover responsive className="align-middle mb-0 text-nowrap">
                                    <thead className="table-light text-muted font-size-12">
                                        <tr>
                                            <th className="ps-3">Fecha</th>
                                            <th>Categoría</th>
                                            <th>Proveedor</th>
                                            <th>Vehículo / Chofer</th>
                                            <th>Descripción</th>
                                            <th>Total</th>
                                            <th>Estado / Pago</th>
                                            <th className="text-end pe-3">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-size-13">
                                        {filteredExpenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(e => {
                                            const provName = e.proveedor_nombre || 'Sin Proveedor';
                                            const initials = provName !== 'Sin Proveedor' ? provName.substring(0, 2).toUpperCase() : '?';
                                            const colors = ['primary', 'info', 'success', 'warning', 'danger', 'violet'];
                                            const avtBg = colors[(e.proveedor_id || e.id || 0) % colors.length];

                                            return (
                                            <tr key={e.id}>
                                                <td className="ps-3">
                                                    <span className="small text-muted">{e.fecha_gasto ? e.fecha_gasto.split('T')[0].split('-').reverse().join('/') : ''}</span>
                                                </td>
                                                <td>
                                                    <div className="fw-bold text-dark">{e.categoria_nombre}</div>
                                                    <small className="text-muted">{e.grupo_contable} ({e.categoria_tipo})</small>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="me-2">
                                                            <div className={`avatar avatar-xs avatar-rounded bg-soft-${avtBg} text-${avtBg} d-flex align-items-center justify-content-center fw-bold`} style={{ width: '32px', height: '32px', fontSize: '11px', borderRadius: '50%' }}>
                                                                {initials}
                                                            </div>
                                                        </div>
                                                        <div className="fw-semibold text-dark text-high-em" style={{ fontSize: '13px' }}>{provName}</div>
                                                    </div>
                                                </td>
                                                <td>
                                                    {e.conductor_nombre ? (
                                                        <>
                                                            <div className="small fw-semibold text-dark">{e.conductor_nombre}</div>
                                                            <small className="text-muted">🚚 Placa: {e.vehiculo_placa}</small>
                                                        </>
                                                    ) : '—'}
                                                </td>
                                                <td style={{ maxWidth: '250px' }}>
                                                    <span className="text-muted small text-wrap d-block text-truncate" style={{ fontSize: '12px', lineHeight: '1.4' }} title={e.descripcion}>
                                                        {e.descripcion || 'Sin descripción'}
                                                    </span>
                                                    {e.numero_comprobante && <small className="text-muted d-block mt-1">Doc: {e.tipo_comprobante} - {e.numero_comprobante}</small>}
                                                </td>
                                                <td>
                                                    <span className="fw-extrabold text-primary">S/ {parseFloat(e.monto_total || 0).toFixed(2)}</span>
                                                </td>
                                                <td>
                                                    <div className="d-flex flex-column gap-1 align-items-start">
                                                        <Badge bg={e.estado_pago === 'Pagado' ? 'success text-white' : 'danger text-white'} className="border-0 rounded-pill px-2 py-1">
                                                            {e.estado_pago === 'Pagado' ? '● Pagado' : '○ Pendiente'}
                                                        </Badge>
                                                        {e.metodo_pago && <span className="text-muted text-center fw-bold mt-1" style={{ fontSize: '10px' }}>{e.metodo_pago}</span>}
                                                    </div>
                                                </td>
                                                <td className="text-end pe-3">
                                                    <Button variant="link" className="p-1 text-primary hover-bg rounded-circle" onClick={() => handleEditExpense(e)} title="Editar">
                                                        <Icons.Edit size={16} />
                                                    </Button>
                                                    <Button variant="link" className="p-1 text-danger hover-bg rounded-circle" onClick={() => handleDeleteExpense(e.id)} title="Eliminar">
                                                        <Icons.Trash size={16} />
                                                    </Button>
                                                </td>
                                            </tr>
                                            );
                                        })}
                                        {filteredExpenses.length === 0 && (
                                            <tr>
                                                <td colSpan={8} className="text-center py-4 text-muted">No se encontraron egresos contables registrados.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            )}
                            {!loading && filteredExpenses.length > 0 && (
                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-3 border-top bg-light-soft">
                                    <div className="text-muted small mb-2 mb-md-0 fw-semibold">
                                        Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredExpenses.length)} de {filteredExpenses.length} egresos
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
                                                {currentPage} / {Math.ceil(filteredExpenses.length / itemsPerPage)}
                                            </Button>
                                            <Button 
                                                variant="outline-secondary" 
                                                size="sm" 
                                                className="fw-bold"
                                                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredExpenses.length / itemsPerPage), p + 1))}
                                                disabled={currentPage === Math.ceil(filteredExpenses.length / itemsPerPage)}
                                            >
                                                Siguiente
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Tab>

                        <Tab eventKey="categories" title="Categorías de Gastos">
                            <Table hover responsive className="align-middle mb-0 text-nowrap">
                                <thead className="table-light text-muted font-size-12">
                                    <tr>
                                        <th className="ps-3" style={{ width: '80px' }}>ID</th>
                                        <th>Categoría</th>
                                        <th>Tipo</th>
                                        <th>Grupo Contable</th>
                                        <th>Margen Bidón</th>
                                        <th>Margen CAC</th>
                                        <th>Estado</th>
                                        <th className="text-end pe-3" style={{ width: '120px' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="font-size-13">
                                    {categories.map(c => (
                                        <tr key={c.id}>
                                            <td className="ps-3 fw-bold text-secondary">#{c.id}</td>
                                            <td>
                                                <div className="fw-bold text-dark">{c.nombre}</div>
                                            </td>
                                            <td>{c.tipo}</td>
                                            <td>{c.grupo_contable}</td>
                                            <td>
                                                <Badge bg={c.afecta_margen_bidon ? 'info text-white' : 'secondary text-white'} className="border-0 rounded-pill px-2 py-1">
                                                    {c.afecta_margen_bidon ? 'Afecta' : 'No afecta'}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Badge bg={c.afecta_cac ? 'info text-white' : 'secondary text-white'} className="border-0 rounded-pill px-2 py-1">
                                                    {c.afecta_cac ? 'Afecta' : 'No afecta'}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Badge bg={c.activo ? 'success text-white' : 'danger text-white'} className="border-0 rounded-pill px-2 py-1">
                                                    {c.activo ? '● Activo' : '○ Inactivo'}
                                                </Badge>
                                            </td>
                                            <td className="text-end pe-3">
                                                <Button variant="link" className="p-1 text-primary hover-bg rounded-circle" onClick={() => handleEditCategory(c)} title="Editar">
                                                    <Icons.Edit size={16} />
                                                </Button>
                                                <Button variant="link" className="p-1 text-danger hover-bg rounded-circle" onClick={() => handleDeleteCategory(c.id)} title="Eliminar">
                                                    <Icons.Trash size={16} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {categories.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="text-center py-4 text-muted">No se encontraron categorías registradas.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </Tab>
                    </Tabs>
                </Card.Body>
            </Card>
                </Col>
            </Row>

            {/* Expense Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" backdrop="static">
                <Form onSubmit={handleExpenseSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title className="fw-bold">{form.id ? 'Editar Gasto' : 'Registrar Nuevo Gasto / Egreso'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Categoría de Gasto</Form.Label>
                                    <Form.Select
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.categoria_id}
                                        onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Selecciona Categoría...</option>
                                        {categories.filter(c => c.activo).map(c => (
                                            <option key={c.id} value={c.id}>{c.nombre} ({c.grupo_contable})</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Proveedor (Opcional)</Form.Label>
                                    <Form.Select
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.proveedor_id}
                                        onChange={(e) => setForm({ ...form, proveedor_id: e.target.value })}
                                    >
                                        <option value="">Ninguno / Pago Varios...</option>
                                        {suppliers.filter(s => s.activo).map(s => (
                                            <option key={s.id} value={s.id}>{s.razon_social} (RUC: {s.ruc})</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Vehículo de Reparto (Opcional)</Form.Label>
                                    <Form.Select
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.vehiculo_id}
                                        onChange={(e) => setForm({ ...form, vehiculo_id: e.target.value })}
                                    >
                                        <option value="">Ninguno...</option>
                                        {drivers.filter(d => d.activo).map(d => (
                                            <option key={d.id} value={d.id}>[{d.vehiculo_placa}] {d.nombre} {d.apellido}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Fecha del Gasto</Form.Label>
                                    <Form.Control
                                        type="date"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.fecha_gasto}
                                        onChange={(e) => setForm({ ...form, fecha_gasto: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Tipo de Comprobante</Form.Label>
                                    <Form.Select
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.tipo_comprobante}
                                        onChange={(e) => setForm({ ...form, tipo_comprobante: e.target.value })}
                                    >
                                        <option value="Ninguno">Ninguno (Recibo/Vale)</option>
                                        <option value="Boleta">Boleta de Venta</option>
                                        <option value="Factura">Factura</option>
                                        <option value="Nota de Venta">Nota de Venta</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Nro de Comprobante / Recibo</Form.Label>
                                    <Form.Control
                                        type="text"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.numero_comprobante}
                                        onChange={(e) => setForm({ ...form, numero_comprobante: e.target.value })}
                                        placeholder="Ej: F001-0004523"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Importe Total (S/)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.monto_total || ''}
                                        onChange={(e) => setForm({ ...form, monto_total: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Descripción / Concepto del Gasto</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.descripcion}
                                        onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                                        placeholder="Detalles sobre lo adquirido o pagado..."
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Método de Pago</Form.Label>
                                    <Form.Select
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.metodo_pago}
                                        onChange={(e) => setForm({ ...form, metodo_pago: e.target.value })}
                                    >
                                        <option value="Transferencia">Transferencia Bancaria</option>
                                        <option value="Yape/Plin">Billetera Digital (Yape/Plin)</option>
                                        <option value="Efectivo">Efectivo</option>
                                        <option value="Tarjeta">Tarjeta Crédito / Débito</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Estado de Pago</Form.Label>
                                    <Form.Select
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.estado_pago}
                                        onChange={(e) => setForm({ ...form, estado_pago: e.target.value })}
                                    >
                                        <option value="Pagado">Pagado / Liquidado</option>
                                        <option value="Pendiente">Pendiente por Pagar</option>
                                        <option value="Anulado">Anulado</option>
                                    </Form.Select>
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
                                    Registrar Egreso
                                </>
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Category Modal */}
            <Modal show={showCatModal} onHide={() => setShowCatModal(false)} backdrop="static">
                <Form onSubmit={handleCatSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title className="fw-bold">{catForm.id ? 'Editar Categoría de Gasto' : 'Registrar Nueva Categoría'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        <Row className="g-3">
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Nombre de la Categoría</Form.Label>
                                    <Form.Control
                                        type="text"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        placeholder="Ej: Combustible de Reparto"
                                        value={catForm.nombre}
                                        onChange={(e) => setCatForm({ ...catForm, nombre: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Tipo de Gasto</Form.Label>
                                    <Form.Select
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={catForm.tipo}
                                        onChange={(e) => setCatForm({ ...catForm, tipo: e.target.value })}
                                    >
                                        <option value="Operativo">Operativo (Variable)</option>
                                        <option value="Administrativo">Administrativo (Fijo)</option>
                                        <option value="Ventas">Gasto de Ventas</option>
                                        <option value="Financiero">Gasto Financiero</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Grupo Contable</Form.Label>
                                    <Form.Select
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={catForm.grupo_contable}
                                        onChange={(e) => setCatForm({ ...catForm, grupo_contable: e.target.value })}
                                    >
                                        <option value="Logística">Logística / Flota</option>
                                        <option value="Compras">Compras / Insumos</option>
                                        <option value="Comercial">Marketing / Ventas</option>
                                        <option value="Servicios">Servicios Básicos</option>
                                        <option value="RRHH">Nómina / RRHH</option>
                                        <option value="Financiero">Bancos / Intereses</option>
                                        <option value="Otros Gastos">Otros Gastos</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Check
                                    type="checkbox"
                                    id="afecta-margen-checkbox"
                                    label="Afecta Margen por Bidón (Costo logístico/producción)"
                                    checked={catForm.afecta_margen_bidon}
                                    onChange={(e) => setCatForm({ ...catForm, afecta_margen_bidon: e.target.checked })}
                                />
                                <Form.Check
                                    type="checkbox"
                                    id="afecta-cac-checkbox"
                                    label="Afecta Costo de Adquisición de Cliente (CAC)"
                                    checked={catForm.afecta_cac}
                                    onChange={(e) => setCatForm({ ...catForm, afecta_cac: e.target.checked })}
                                    className="mt-2"
                                />
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" onClick={() => setShowCatModal(false)} disabled={saving}>
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
                                    Guardar Categoría
                                </>
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
}
