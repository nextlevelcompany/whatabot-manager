"use client";
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Table, Badge, Dropdown, Spinner, InputGroup, Modal } from 'react-bootstrap';
import { Search, Map, Settings, Trash, Edit, Plus, RefreshCw, Calendar, DollarSign, List, Grid, Check, X, Eye, Save, MapPin, Package, Clock, Download } from 'react-feather';
import Swal from 'sweetalert2';
import SimpleBar from 'simplebar-react';
import Link from 'next/link';

const getApiBase = () => {
    if (typeof window !== 'undefined') {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
        return `${protocol}//${hostname}:8080`;
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';
};
const API_BASE = getApiBase();

const getLocalDateString = (d) => {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

const formatDateSafe = (isoString) => {
    if (!isoString) return '';
    try {
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return isoString.split('T')[0];
        return getLocalDateString(d);
    } catch (e) {
        return isoString.split('T')[0];
    }
};

export default function SalesViewPage() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban'
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [hoveredCardId, setHoveredCardId] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDesde, setFilterDesde] = useState('');
    const [filterHasta, setFilterHasta] = useState('');
    const [filterPago, setFilterPago] = useState('all');
    const [filterEntrega, setFilterEntrega] = useState('all');
    const [filterMetodo, setFilterMetodo] = useState('all');

    // Modals
    const [showValModal, setShowValModal] = useState(false);
    const [validating, setValidating] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);

    // Selected item for modal
    const [selectedSale, setSelectedSale] = useState(null);
    const [valForm, setValForm] = useState({
        metodo_pago: 'Efectivo',
        estado_pago: 'pagado',
        entrega_ok: true,
        monto_pagado: 0.0
    });
    const [cancelMotivo, setCancelMotivo] = useState('');

    const loadSales = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/sales`);
            if (res.ok) setSales(await res.json());
        } catch (e) {
            console.error("Error loading sales", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSales();
    }, []);

    // Filter Helper: Weekday Programming
    const filterByDay = (dateStr) => {
        setFilterDesde(filterDesde === dateStr ? '' : dateStr);
        setFilterHasta(filterHasta === dateStr ? '' : dateStr);
    };

    const getWeekDays = () => {
        const list = [];
        const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
        const now = new Date();
        now.setHours(12, 0, 0, 0); // Normalize to midday to prevent timezone/DST date shifts
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

            // Count pending vs completed for this day in sales
            const daySales = sales.filter(s => {
                const sDate = formatDateSafe(s.fecha_venta);
                return sDate === dateStr;
            });
            const pendingCount = daySales.filter(s => s.estado !== 'completada' && s.estado !== 'cancelada').length;
            const completedCount = daySales.filter(s => s.estado === 'completada').length;

            list.push({ dateStr, label, dayNum, isToday, isActive, pendingCount, completedCount });
        }
        return list;
    };

    const weekDays = getWeekDays();

    // Filter Logic
    const filteredSales = sales.filter(s => {
        const clientName = (s.cliente_nombre_completo || '').toLowerCase();
        const saleNo = (s.numero_venta || '').toLowerCase();
        const products = (s.productos_detalle || '').toLowerCase();

        const matchesSearch = !searchTerm ||
            clientName.includes(searchTerm.toLowerCase()) ||
            saleNo.includes(searchTerm.toLowerCase()) ||
            products.includes(searchTerm.toLowerCase());

        const matchesPago = filterPago === 'all' || s.estado_pago === filterPago;
        const matchesEntrega = filterEntrega === 'all' || s.estado === filterEntrega;
        const matchesMetodo = filterMetodo === 'all' || s.metodo_pago === filterMetodo;

        let matchesDate = true;
        if (filterDesde || filterHasta) {
            const saleDate = formatDateSafe(s.fecha_venta);
            if (saleDate === '') {
                matchesDate = false;
            } else {
                if (filterDesde && saleDate < filterDesde) matchesDate = false;
                if (filterHasta && saleDate > filterHasta) matchesDate = false;
            }
        }

        return matchesSearch && matchesPago && matchesEntrega && matchesMetodo && matchesDate;
    });

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterDesde, filterHasta, filterPago, filterEntrega, filterMetodo]);

    // KPI stats
    const totalFacturado = filteredSales.reduce((sum, s) => s.estado !== 'cancelada' ? sum + parseFloat(s.total || 0) : sum, 0.0);
    const totalCobrado = filteredSales.reduce((sum, s) => s.estado !== 'cancelada' ? sum + parseFloat(s.monto_pagado || 0) : sum, 0.0);
    const totalPendiente = totalFacturado - totalCobrado;
    const transaccionesCount = filteredSales.length;

    // Open/Close Actions
    const handleOpenValidate = (sale) => {
        setSelectedSale(sale);
        setValForm({
            metodo_pago: sale.metodo_pago || 'Efectivo',
            estado_pago: sale.estado_pago || 'pagado',
            entrega_ok: sale.estado === 'completada',
            monto_pagado: parseFloat(sale.monto_pagado || 0.0) || parseFloat(sale.total)
        });
        setShowValModal(true);
    };

    const handleSaveValidation = async (e) => {
        e.preventDefault();
        setValidating(true);
        try {
            const res = await fetch(`${API_BASE}/api/sales/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedSale.id,
                    ...valForm,
                    monto_pagado: parseFloat(valForm.monto_pagado)
                })
            });

            if (res.ok) {
                setShowValModal(false);
                loadSales();
                Swal.fire({ icon: 'success', title: 'Venta Validada', timer: 1200, showConfirmButton: false });
            } else {
                Swal.fire('Error', 'No se pudo guardar la validación.', 'error');
            }
        } catch (err) {
            Swal.fire('Error', 'Error de red.', 'error');
        } finally {
            setValidating(false);
        }
    };

    const handleOpenCancel = (sale) => {
        setSelectedSale(sale);
        setCancelMotivo('');
        setShowCancelModal(true);
    };

    const handleSaveCancel = async (e) => {
        e.preventDefault();
        if (!cancelMotivo.trim()) return;
        setCancelling(true);
        try {
            const res = await fetch(`${API_BASE}/api/sales/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedSale.id,
                    motivo: cancelMotivo
                })
            });

            if (res.ok) {
                setShowCancelModal(false);
                loadSales();
                Swal.fire('Anulada', 'La venta ha sido anulada.', 'success');
            } else {
                Swal.fire('Error', 'No se pudo anular la venta.', 'error');
            }
        } catch (err) {
            Swal.fire('Error', 'Error de red.', 'error');
        } finally {
            setCancelling(false);
        }
    };

    const handleOpenView = (sale) => {
        setSelectedSale(sale);
        setShowViewModal(true);
    };

    const getEstadoBadge = (est) => {
        if (est === 'completada') return <span className="badge bg-success text-white rounded-pill" style={{ fontSize: '11px', fontWeight: '600', padding: '4px 8px' }}>● Completada</span>;
        if (est === 'cancelada') return <span className="badge bg-danger text-white rounded-pill" style={{ fontSize: '11px', fontWeight: '600', padding: '4px 8px' }}>○ Anulada</span>;
        if (est === 'entregado') return <span className="badge bg-info text-white rounded-pill" style={{ fontSize: '11px', fontWeight: '600', padding: '4px 8px' }}>○ Entregado</span>;
        return <span className="badge bg-warning text-dark rounded-pill" style={{ fontSize: '11px', fontWeight: '600', padding: '4px 8px' }}>○ Pendiente</span>;
    };

    const getPagoBadge = (pago) => {
        if (pago === 'pagado') return <span className="badge bg-success text-white rounded-pill" style={{ fontSize: '11px', fontWeight: '600', padding: '4px 8px' }}>● Pagado</span>;
        if (pago === 'parcial') return <span className="badge bg-warning text-dark rounded-pill" style={{ fontSize: '11px', fontWeight: '600', padding: '4px 8px' }}>◐ Parcial</span>;
        return <span className="badge bg-danger text-white rounded-pill" style={{ fontSize: '11px', fontWeight: '600', padding: '4px 8px' }}>○ Pendiente</span>;
    };

    return (
        <div className="p-4" style={{ background: '#f8fafc', minHeight: '100vh' }}>
            {/* Header Toolbar */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 bg-white p-3 rounded shadow-sm border mb-4">
                <div className="d-flex align-items-center">
                    <Button 
                        variant={sidebarCollapsed ? "primary" : "outline-primary"} 
                        size="sm" 
                        className="me-3 d-flex align-items-center gap-1 shadow-sm" 
                        onClick={() => {
                            const newCollapsed = !sidebarCollapsed;
                            setSidebarCollapsed(newCollapsed);
                            localStorage.setItem('ventas_sidebar_collapsed', String(newCollapsed));
                        }} 
                        title={sidebarCollapsed ? "Mostrar filtros" : "Ocultar filtros"}
                    >
                        <List size={15} />
                        <span className="fw-semibold">{sidebarCollapsed ? "Mostrar Filtros" : "Ocultar Filtros"}</span>
                    </Button>
                    <h4 className="mb-0 text-primary fw-bold d-flex align-items-center">
                        <DollarSign size={24} className="me-2" />
                        Historial de Ventas
                    </h4>
                </div>
                <div style={{ maxWidth: '400px', flexGrow: 1 }} className="mx-lg-4">
                    <InputGroup>
                        <InputGroup.Text className="bg-white border-end-0">
                            <Search size={18} className="text-muted" />
                        </InputGroup.Text>
                        <Form.Control
                            className="border-start-0 shadow-none bg-white"
                            placeholder="Buscar venta, cliente, producto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>
                </div>
                <div className="d-flex gap-2 align-items-center">
                    <div className="btn-group bg-light border rounded p-1">
                        <Button
                            variant={viewMode === 'kanban' ? 'dark' : 'light'}
                            size="sm"
                            className={`fw-bold px-3 border-0 ${viewMode === 'kanban' ? 'text-white' : 'text-muted'}`}
                            onClick={() => setViewMode('kanban')}
                        >
                            <Grid size={16} />
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'dark' : 'light'}
                            size="sm"
                            className={`fw-bold px-3 border-0 ${viewMode === 'list' ? 'text-white' : 'text-muted'}`}
                            onClick={() => setViewMode('list')}
                        >
                            <List size={16} />
                        </Button>
                    </div>
                    <Button 
                        variant="success" 
                        size="sm"
                        className="fw-bold d-inline-flex align-items-center justify-content-center bg-success text-white border-0 px-3" 
                        onClick={() => {}}
                        title="Exportar a Excel"
                    >
                        <Download size={16} />
                    </Button>
                    <Button 
                        variant="light" 
                        size="sm"
                        className="fw-bold d-inline-flex align-items-center justify-content-center border me-2 px-3" 
                        onClick={() => {}}
                        title="Configurar vista"
                    >
                        <Settings size={16} />
                    </Button>
                    <Button variant="primary" size="sm" className="fw-bold px-3 d-inline-flex align-items-center justify-content-center text-white" href="/ventas/create">
                        <Plus size={16} />
                    </Button>
                </div>
            </div>

            {/* KPI Summary Row */}
            <Row className="mb-4">
                <Col md={3}>
                    <Card className="shadow-sm border-0 bg-white">
                        <Card.Body className="p-3 text-center">
                            <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '10px' }}>Facturado Acumulado</small>
                            <h4 className="mb-0 fw-bold text-primary mt-1">S/ {totalFacturado.toFixed(2)}</h4>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="shadow-sm border-0 bg-white">
                        <Card.Body className="p-3 text-center">
                            <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '10px' }}>Cobrado Total (Caja)</small>
                            <h4 className="mb-0 fw-bold text-success mt-1">S/ {totalCobrado.toFixed(2)}</h4>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="shadow-sm border-0 bg-white">
                        <Card.Body className="p-3 text-center">
                            <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '10px' }}>Cuentas por Cobrar</small>
                            <h4 className="mb-0 fw-bold text-danger mt-1">S/ {totalPendiente.toFixed(2)}</h4>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="shadow-sm border-0 bg-white">
                        <Card.Body className="p-3 text-center">
                            <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '10px' }}>Transacciones</small>
                            <h4 className="mb-0 fw-bold text-dark mt-1">{transaccionesCount} Ventas</h4>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                {/* Collapsible Sidebar */}
                {!sidebarCollapsed && (
                    <Col lg={3} className="mb-4">
                        <div className="bg-white p-4 rounded shadow-sm border" style={{ position: 'sticky', top: '20px' }}>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="mb-0 fw-bold text-dark" style={{ fontSize: '14px' }}>FILTROS</h5>
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="text-danger fw-bold text-decoration-none p-0 shadow-none border-0"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFilterDesde('');
                                        setFilterHasta('');
                                        setFilterPago('all');
                                        setFilterEntrega('all');
                                        setFilterMetodo('all');
                                    }}
                                >
                                    LIMPIAR
                                </Button>
                            </div>

                            {/* Ventas de la semana */}
                            <div className="mb-4">
                                <span className="d-block text-muted fw-bold mb-2" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Ventas de la semana</span>
                                <div className="d-flex justify-content-between gap-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                                    {weekDays.map(day => (
                                        <button
                                            key={day.dateStr}
                                            onClick={() => filterByDay(day.dateStr)}
                                            className={`btn btn-sm d-flex flex-column align-items-center justify-content-center p-1 rounded-3 ${
                                                day.isActive ? 'bg-dark text-white shadow border-dark' : (day.isToday ? 'btn-soft-primary border-primary' : 'btn-light border')
                                            }`}
                                            style={{ minHeight: '56px', width: '100%', minWidth: 0, overflow: 'hidden' }}
                                        >
                                            <span style={{ fontSize: '7.5px', fontWeight: '800' }}>{day.label}</span>
                                            <span className="fw-bold" style={{ fontSize: '11px' }}>{day.dayNum}</span>
                                            <div className="d-flex gap-1 mt-1">
                                                <span className="d-flex align-items-center justify-content-center fw-bold rounded-circle" style={{ 
                                                    width: '14px', 
                                                    height: '14px', 
                                                    fontSize: '6.5px',
                                                    backgroundColor: day.isActive ? '#ffffff' : '#0d6efd',
                                                    color: day.isActive ? '#212529' : '#ffffff'
                                                }}>
                                                    {day.pendingCount}
                                                </span>
                                                {day.completedCount > 0 && (
                                                    <span className="d-flex align-items-center justify-content-center fw-bold rounded-circle" style={{ 
                                                        width: '14px', 
                                                        height: '14px', 
                                                        fontSize: '6.5px',
                                                        backgroundColor: day.isActive ? '#ffffff' : '#198754',
                                                        color: day.isActive ? '#198754' : '#ffffff'
                                                    }}>
                                                        {day.completedCount}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Date filters */}
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

                            {/* Payment Status */}
                            <div className="mb-3">
                                <span className="d-block text-muted fw-bold mb-1" style={{ fontSize: '10px' }}>Estado de Pago</span>
                                <Form.Select size="sm" value={filterPago} onChange={(e) => setFilterPago(e.target.value)}>
                                    <option value="all">Todos</option>
                                    <option value="pendiente">Pendiente</option>
                                    <option value="parcial">Parcial</option>
                                    <option value="pagado">Pagado</option>
                                </Form.Select>
                            </div>

                            {/* Delivery Status */}
                            <div className="mb-3">
                                <span className="d-block text-muted fw-bold mb-1" style={{ fontSize: '10px' }}>Estado de Entrega</span>
                                <Form.Select size="sm" value={filterEntrega} onChange={(e) => setFilterEntrega(e.target.value)}>
                                    <option value="all">Todos</option>
                                    <option value="pendiente">Pendiente</option>
                                    <option value="completada">Completada</option>
                                    <option value="cancelada">Anulada</option>
                                </Form.Select>
                            </div>

                            {/* Payment Method */}
                            <div>
                                <span className="d-block text-muted fw-bold mb-1" style={{ fontSize: '10px' }}>Medio de Pago</span>
                                <Form.Select size="sm" value={filterMetodo} onChange={(e) => setFilterMetodo(e.target.value)}>
                                    <option value="all">Todos</option>
                                    <option value="Efectivo">Efectivo</option>
                                    <option value="Transferencia">Transferencia</option>
                                    <option value="Yape/Plin">Yape/Plin</option>
                                    <option value="Crédito">Línea de Crédito</option>
                                </Form.Select>
                            </div>
                        </div>
                    </Col>
                )}

                {/* Main Content Area */}
                <Col lg={sidebarCollapsed ? 12 : 9}>
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                        </div>
                    ) : (
                        <>
                            {/* KANBAN VIEW */}
                            {viewMode === 'kanban' && (
                                <div className="d-flex overflow-auto pb-4 gap-3 align-items-start" style={{ minHeight: 'calc(100vh - 280px)' }}>
                                    {['pendiente', 'entregado', 'completada', 'cancelada'].map(stage => {
                                        const colSales = filteredSales.filter(s => s.estado === stage);
                                        const colTotal = colSales.reduce((sum, s) => sum + parseFloat(s.total || 0), 0);
                                        const stageLabels = {
                                            pendiente: 'ENTREGA PENDIENTE',
                                            entregado: 'ENTREGADO',
                                            completada: 'COMPLETADA',
                                            cancelada: 'ANULADA / DEVUELTA'
                                        };
                                        const stageColors = {
                                            pendiente: '#f59e0b', // warning
                                            entregado: '#0ea5e9', // info
                                            completada: '#10b981', // success
                                            cancelada: '#ef4444' // danger
                                        };

                                        return (
                                            <div
                                                key={stage}
                                                className="bg-light rounded-3 border p-3 flex-shrink-0 shadow-sm"
                                                style={{ width: '300px', minHeight: '300px', borderTop: `4px solid ${stageColors[stage]}` }}
                                            >
                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                    <span className="fw-bold text-dark small text-uppercase" style={{ letterSpacing: '0.05em' }}>
                                                        {stageLabels[stage]}
                                                    </span>
                                                    <Badge bg="secondary-soft text-secondary">{colSales.length}</Badge>
                                                </div>

                                                <div className="bg-white rounded-3 border p-2 mb-3 text-muted text-center fw-bold" style={{ fontSize: '11px' }}>
                                                    S/ {colTotal.toFixed(2)}
                                                </div>

                                                <div style={{ minHeight: '150px' }}>
                                                    {colSales.map(sale => {
                                                        const isHovered = hoveredCardId === sale.id;
                                                        const isLocked = sale.estado === 'completada' || sale.estado === 'cancelada';
                                                        const priorityBorder = sale.estado_pago === 'pagado' ? '#10b981' : (sale.estado_pago === 'parcial' ? '#f59e0b' : '#ef4444');

                                                        return (
                                                            <Card
                                                                key={sale.id}
                                                                className="mb-3 border rounded-3"
                                                                style={{
                                                                    borderLeft: `4px solid ${priorityBorder}`,
                                                                    transform: isHovered ? 'translateY(-3px)' : 'none',
                                                                    boxShadow: isHovered ? '0 10px 20px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.04)' : '0 2px 4px rgba(0,0,0,0.02)',
                                                                    borderColor: isHovered ? 'rgba(0,0,0,0.12)' : '#e2e8f0',
                                                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                }}
                                                                onMouseEnter={() => setHoveredCardId(sale.id)}
                                                                onMouseLeave={() => setHoveredCardId(null)}
                                                            >
                                                                <Card.Body className="p-3">
                                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                                        <Badge bg="light" className="text-muted border fw-bold px-2 py-1 shadow-none" style={{ fontSize: '10px', borderRadius: '4px' }}>
                                                                            📄 {sale.numero_venta}
                                                                        </Badge>
                                                                        <div className="d-flex gap-1 align-items-center">
                                                                            {getEstadoBadge(sale.estado)}
                                                                        </div>
                                                                    </div>

                                                                    <div className="fw-extrabold mb-2" style={{ fontSize: '14px', letterSpacing: '-0.01em' }}>
                                                                        {sale.contacto_id ? (
                                                                            <Link 
                                                                                href={`/apps/contact/view-contact?id=${sale.contacto_id}`} 
                                                                                className="text-dark text-decoration-none transition-all"
                                                                                style={{ cursor: 'pointer' }}
                                                                                onMouseEnter={(e) => e.target.style.color = '#0d6efd'}
                                                                                onMouseLeave={(e) => e.target.style.color = '#212529'}
                                                                            >
                                                                                {sale.cliente_nombre_completo || 'Cliente General'}
                                                                            </Link>
                                                                        ) : (
                                                                            sale.cliente_nombre_completo || 'Cliente General'
                                                                        )}
                                                                    </div>

                                                                    <div className="d-flex align-items-center gap-2 text-muted mb-1" style={{ fontSize: '11.5px' }} title={sale.direccion_entrega || "Sin dirección"}>
                                                                        <MapPin size={12} className={sale.direccion_entrega && sale.direccion_entrega !== '-' && sale.direccion_entrega !== 'undefined' ? "text-success" : "text-muted"} />
                                                                        <span className="text-truncate" style={{ maxWidth: '210px' }}>{sale.direccion_entrega && sale.direccion_entrega !== '-' && sale.direccion_entrega !== 'undefined' ? sale.direccion_entrega : 'Recojo en tienda'}</span>
                                                                    </div>

                                                                    <div className="d-flex align-items-center gap-2 text-muted mb-1" style={{ fontSize: '11.5px' }}>
                                                                        <Calendar size={12} className="text-primary" />
                                                                        <span>Fecha: <strong className="text-dark">{formatDateSafe(sale.fecha_venta)}</strong></span>
                                                                    </div>
                                                                    
                                                                    <div className="d-flex align-items-center gap-2 text-muted mb-3 text-truncate" style={{ fontSize: '11.5px', maxWidth: '240px' }} title={sale.productos_detalle}>
                                                                        <Package size={12} className="text-secondary" />
                                                                        <span className="text-truncate">{sale.productos_detalle || 'Sin productos'}</span>
                                                                    </div>

                                                                    <div className="d-flex justify-content-between align-items-center mt-2 border-top pt-2">
                                                                        <div>
                                                                            <span className="d-block text-muted" style={{ fontSize: '9px' }}>TOTAL</span>
                                                                            <strong className="text-primary font-size-13">S/ {parseFloat(sale.total || 0).toFixed(2)}</strong>
                                                                        </div>
                                                                        <div>
                                                                            <span className="d-block text-muted" style={{ fontSize: '9px', textAlign: 'right' }}>COBRADO</span>
                                                                            <span className="fw-bold text-success font-size-12">S/ {parseFloat(sale.monto_pagado || 0).toFixed(2)}</span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="d-flex align-items-center justify-content-end gap-1 mt-3 pt-2 border-top">
                                                                        <Button variant="link" className="p-1 text-muted hover-bg rounded-circle" title="Detalle" onClick={() => handleOpenView(sale)}>
                                                                            <Eye size={16} />
                                                                        </Button>
                                                                        {!isLocked && (
                                                                            <>
                                                                                <Button variant="link" className="p-1 text-success hover-bg rounded-circle" title="Validar / Cobrar" onClick={() => handleOpenValidate(sale)}>
                                                                                    <Check size={16} />
                                                                                </Button>
                                                                                <Button variant="link" className="p-1 text-danger hover-bg rounded-circle" title="Anular" onClick={() => handleOpenCancel(sale)}>
                                                                                    <X size={16} />
                                                                                </Button>
                                                                            </>
                                                                        )}

                                                                    </div>
                                                                </Card.Body>
                                                            </Card>
                                                        );
                                                    })}
                                                    {colSales.length === 0 && (
                                                        <div className="text-center py-4 text-muted small border border-dashed rounded-3">
                                                            Sin transacciones
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* LIST VIEW */}
                            {viewMode === 'list' && (
                                <Card className="border-0 shadow-sm rounded-3 overflow-hidden bg-white">
                                    <Table hover responsive className="align-middle mb-0 text-nowrap bg-white">
                                        <thead className="table-light text-muted font-size-12">
                                            <tr>
                                                <th className="ps-3">Nº Venta</th>
                                                <th>Cliente</th>
                                                <th>Fecha</th>
                                                <th>Productos Vendidos</th>
                                                <th>Total Venta</th>
                                                <th>Pagado</th>
                                                <th>Entrega</th>
                                                <th>Pago</th>
                                                <th className="text-end pe-3">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="font-size-13">
                                            {filteredSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(row => {
                                                const fullName = row.cliente_nombre_completo || 'Cliente General';
                                                const initials = fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
                                                const colors = ['info', 'warning', 'success', 'danger', 'primary', 'violet'];
                                                const avtBg = colors[(row.id || 0) % colors.length];

                                                return (
                                                    <tr key={row.id}>
                                                        <td className="ps-3"><strong className="text-dark" style={{ fontSize: '13px' }}>{row.numero_venta}</strong></td>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <div className="me-2">
                                                                    <div className={`avatar avatar-xs avatar-rounded bg-soft-${avtBg} text-${avtBg} d-flex align-items-center justify-content-center fw-bold`} style={{ width: '32px', height: '32px', fontSize: '11px', borderRadius: '50%' }}>
                                                                        {initials}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div className="fw-semibold text-dark text-high-em" style={{ fontSize: '13px' }}>{fullName}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td><span className="small text-muted">{formatDateSafe(row.fecha_venta) || '—'}</span></td>
                                                        <td>
                                                            <span className="text-muted small text-wrap d-block text-truncate" style={{ fontSize: '12px', lineHeight: '1.4', maxWidth: '240px' }} title={row.productos_detalle}>
                                                                {row.productos_detalle || '—'}
                                                            </span>
                                                        </td>
                                                        <td><strong className="text-primary fw-bold" style={{ fontSize: '13px' }}>S/ {parseFloat(row.total || 0).toFixed(2)}</strong></td>
                                                        <td><span className="text-success fw-bold" style={{ fontSize: '13px' }}>S/ {parseFloat(row.monto_pagado || 0).toFixed(2)}</span></td>
                                                        <td>{getEstadoBadge(row.estado)}</td>
                                                        <td>{getPagoBadge(row.estado_pago)}</td>
                                                        <td className="text-end pe-3">
                                                            <div className="d-inline-flex gap-1">
                                                                <Button variant="link" className="p-1 text-info hover-bg rounded-circle" title="Detalle" onClick={() => handleOpenView(row)}>
                                                                    <Eye size={16} />
                                                                </Button>
                                                                {row.estado !== 'cancelada' && (
                                                                    <>
                                                                        <Button variant="link" className="p-1 text-success hover-bg rounded-circle" title="Validar / Cobrar" onClick={() => handleOpenValidate(row)}>
                                                                            <Check size={16} />
                                                                        </Button>
                                                                        <Button variant="link" className="p-1 text-danger hover-bg rounded-circle" title="Anular" onClick={() => handleOpenCancel(row)}>
                                                                            <X size={16} />
                                                                        </Button>
                                                                    </>
                                                                )}

                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {filteredSales.length === 0 && (
                                                <tr>
                                                    <td colSpan={9} className="text-center py-4 text-muted">No se encontraron ventas.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                    
                                    {/* Pagination Controls */}
                                    {filteredSales.length > 0 && (
                                        <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light-soft">
                                            <div className="text-muted small">
                                                Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredSales.length)} de {filteredSales.length} ventas
                                            </div>
                                            <div className="d-flex align-items-center gap-2">
                                                <Form.Select 
                                                    size="sm" 
                                                    className="w-auto shadow-none" 
                                                    value={itemsPerPage} 
                                                    onChange={(e) => {
                                                        setItemsPerPage(Number(e.target.value));
                                                        setCurrentPage(1);
                                                    }}
                                                >
                                                    <option value="10">10 por pág</option>
                                                    <option value="20">20 por pág</option>
                                                    <option value="50">50 por pág</option>
                                                    <option value="100">100 por pág</option>
                                                </Form.Select>
                                                
                                                <div className="btn-group shadow-sm">
                                                    <Button 
                                                        variant="white" 
                                                        size="sm" 
                                                        className="border bg-white"
                                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                        disabled={currentPage === 1}
                                                    >
                                                        Anterior
                                                    </Button>
                                                    <Button variant="light" size="sm" className="border fw-bold px-3" disabled>
                                                        {currentPage} / {Math.ceil(filteredSales.length / itemsPerPage)}
                                                    </Button>
                                                    <Button 
                                                        variant="white" 
                                                        size="sm" 
                                                        className="border bg-white"
                                                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredSales.length / itemsPerPage), p + 1))}
                                                        disabled={currentPage === Math.ceil(filteredSales.length / itemsPerPage)}
                                                    >
                                                        Siguiente
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            )}
                        </>
                    )}
                </Col>
            </Row>

            {/* Validation / Payment Confirmation Modal */}
            <Modal show={showValModal} onHide={() => setShowValModal(false)} size="md" backdrop="static">
                <Form onSubmit={handleSaveValidation}>
                    <Modal.Header closeButton>
                        <Modal.Title className="fw-bold">Validar Entrega y Cobro</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        {selectedSale && (
                            <div className="mb-3 bg-light-soft p-3 rounded border">
                                <span className="small text-muted d-block">Venta {selectedSale.numero_venta}</span>
                                <h6 className="fw-bold text-dark mb-0">{selectedSale.cliente_nombre_completo || 'Cliente General'}</h6>
                                <span className="fw-extrabold text-primary font-size-15 mt-1 d-block">Monto Total: S/ {parseFloat(selectedSale.total).toFixed(2)}</span>
                            </div>
                        )}
                        <Row className="g-3">
                            <Col md={12}>
                                <Form.Check 
                                    type="switch" 
                                    id="val-entrega-switch" 
                                    label="Confirmar entrega de bidones/mercadería" 
                                    checked={valForm.entrega_ok} 
                                    onChange={e => setValForm({ ...valForm, entrega_ok: e.target.checked })} 
                                />
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Estado del Pago</Form.Label>
                                    <Form.Select 
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={valForm.estado_pago}
                                        onChange={e => setValForm({ ...valForm, estado_pago: e.target.value })}
                                    >
                                        <option value="pendiente">Pendiente</option>
                                        <option value="parcial">Pago Parcial</option>
                                        <option value="pagado">Pagado Total</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Medio de Pago</Form.Label>
                                    <Form.Select 
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={valForm.metodo_pago}
                                        onChange={e => setValForm({ ...valForm, metodo_pago: e.target.value })}
                                    >
                                        <option value="Efectivo">Efectivo</option>
                                        <option value="Transferencia">Transferencia Bancaria</option>
                                        <option value="Yape/Plin">Yape / Plin</option>
                                        <option value="Crédito">Línea de Crédito</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            {valForm.estado_pago === 'parcial' && (
                                <Col md={12}>
                                    <Form.Group>
                                        <Form.Label className="small fw-bold text-muted mb-1">Monto Cobrado Hoy (S/)</Form.Label>
                                        <Form.Control 
                                            type="number" 
                                            step="0.01" 
                                            className="shadow-none border-light-soft bg-light-soft" 
                                            value={valForm.monto_pagado} 
                                            onChange={e => setValForm({ ...valForm, monto_pagado: e.target.value })} 
                                            required 
                                        />
                                    </Form.Group>
                                </Col>
                            )}
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" onClick={() => setShowValModal(false)} disabled={validating}>
                            Cancelar
                        </Button>
                        <Button variant="primary" type="submit" disabled={validating}>
                            {validating ? <Spinner size="sm" /> : <Save size={14} className="me-1" />}
                            Confirmar Transacción
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Cancel Modal */}
            <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} size="md" backdrop="static">
                <Form onSubmit={handleSaveCancel}>
                    <Modal.Header closeButton>
                        <Modal.Title className="fw-bold text-danger">Anular Transacción Comercial</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        <Row className="g-3">
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Motivo de Anulación</Form.Label>
                                    <Form.Control 
                                        as="textarea" 
                                        rows={3} 
                                        placeholder="Ej: Pedido reprogramado, error en comprobante o devolución de mercadería."
                                        className="shadow-none border-light-soft bg-light-soft" 
                                        value={cancelMotivo} 
                                        onChange={e => setCancelMotivo(e.target.value)} 
                                        required 
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" onClick={() => setShowCancelModal(false)} disabled={cancelling}>
                            Cancelar
                        </Button>
                        <Button variant="danger" type="submit" disabled={cancelling || !cancelMotivo.trim()}>
                            {cancelling ? <Spinner size="sm" /> : <X size={14} className="me-1" />}
                            Anular Venta
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Detailed View Modal */}
            <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="md">
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold">Detalle de Comprobante</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {selectedSale && (
                        <div className="ticket">
                            <div className="text-center border-bottom pb-3 mb-3">
                                <h5 className="fw-extrabold text-dark mb-0">NEXTLEAD S.A.C.</h5>
                                <span className="small text-muted d-block">RUC: 20601245781</span>
                                <span className="badge bg-secondary-soft text-secondary mt-2">Venta {selectedSale.numero_venta}</span>
                            </div>
                            <Row className="g-2 font-size-13 border-bottom pb-3 mb-3">
                                <Col xs={6}><strong>Cliente:</strong></Col>
                                <Col xs={6} className="text-end">{selectedSale.cliente_nombre_completo || 'Cliente General'}</Col>
                                <Col xs={6}><strong>Doc. Identidad:</strong></Col>
                                <Col xs={6} className="text-end">{selectedSale.numero_documento || '—'}</Col>
                                <Col xs={6}><strong>Fecha Venta:</strong></Col>
                                <Col xs={6} className="text-end">{formatDateSafe(selectedSale.fecha_venta) || '—'}</Col>
                                <Col xs={6}><strong>Método Pago:</strong></Col>
                                <Col xs={6} className="text-end">{selectedSale.metodo_pago || '—'}</Col>
                            </Row>
                            <h6 className="fw-bold text-dark mb-2">Resumen de Ítems</h6>
                            <div className="font-size-13 bg-light p-3 rounded mb-3 border">
                                {selectedSale.productos_detalle ? selectedSale.productos_detalle.split(',').map((p, pi) => (
                                    <div key={pi} className="d-flex justify-content-between mb-1">
                                        <span>{p.trim()}</span>
                                    </div>
                                )) : 'Sin productos'}
                            </div>
                            <Row className="g-2 font-size-14 border-top pt-3">
                                <Col xs={6} className="fw-bold">Total Facturado:</Col>
                                <Col xs={6} className="text-end fw-extrabold text-primary">S/ {parseFloat(selectedSale.total || 0).toFixed(2)}</Col>
                                <Col xs={6} className="fw-bold">Monto Amortizado:</Col>
                                <Col xs={6} className="text-end fw-bold text-success">S/ {parseFloat(selectedSale.monto_pagado || 0).toFixed(2)}</Col>
                            </Row>
                            {selectedSale.notas && (
                                <div className="mt-3 p-2 bg-warning-soft border-warning-soft text-warning-dark rounded small">
                                    <strong>Notas:</strong> {selectedSale.notas}
                                </div>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => setShowViewModal(false)}>
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
