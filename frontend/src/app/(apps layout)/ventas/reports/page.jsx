"use client"
import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Card, Table, Spinner, Badge } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import { Calendar, DollarSign, PieChart, ShoppingCart, User, Percent, Activity } from 'react-feather';

const getApiBase = () => {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
        return `${window.location.protocol}//${hostname}:8081`;
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8081';
};
const API_BASE = getApiBase();

export default function SalesReportsPage() {
    const today = new Date();
    const [desde, setDesde] = useState(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]);
    const [hasta, setHasta] = useState(new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]);
    const [categoriaId, setCategoriaId] = useState('all');
    const [productoId, setProductoId] = useState('all');
    const [estadoPago, setEstadoPago] = useState('all');

    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadMetadata = async () => {
        try {
            // Load products
            const resP = await fetch(`${API_BASE}/api/productos`);
            if (resP.ok) setProducts(await resP.json());

            // Load categories from endpoint or build client-side
            const resC = await fetch(`${API_BASE}/api/productos`); // fallback/placeholder or actual categories
            setCategories([]);
        } catch (e) {
            console.error(e);
        }
    };

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const query = `desde=${desde}&hasta=${hasta}&categoria_id=${categoriaId}&producto_id=${productoId}&estado_pago=${estadoPago}`;
            const res = await fetch(`${API_BASE}/api/sales/analytics?${query}`);
            if (res.ok) {
                setAnalytics(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMetadata();
    }, []);

    useEffect(() => {
        loadAnalytics();
    }, [desde, hasta, categoriaId, productoId, estadoPago]);

    // Derived statistics
    const byProduct = analytics?.byProduct || [];
    const trend = analytics?.trend || [];
    const detailed = analytics?.detailed || [];
    const byUser = analytics?.byUser || [];
    const dailyTrend = analytics?.dailyTrend || [];

    const totalFacturado = dailyTrend.reduce((sum, d) => sum + parseFloat(d.monto_total || 0), 0.0);
    const totalTransacciones = dailyTrend.reduce((sum, d) => sum + parseInt(d.total_ventas || 0), 0);
    const ticketPromedio = totalTransacciones > 0 ? (totalFacturado / totalTransacciones) : 0.0;
    const volumenTotal = byProduct.reduce((sum, p) => sum + parseInt(p.total_cantidad || 0), 0);

    return (
        <div className="hk-pg-body">
            <div className="contact-body w-100">
                <SimpleBar className="nicescroll-bar">
                <div className="px-4 py-4">
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                        <div>
                            <h4 className="fw-extrabold text-dark mb-0">Auditoría y Reportes de Ventas</h4>
                            <p className="text-muted small mb-0 font-size-13">Analiza rentabilidad de productos, efectividad de vendedores y tendencias históricas.</p>
                        </div>
                    </div>

                    {/* Filter Card */}
                    <Card className="border-0 bg-light-soft mb-4 p-3 rounded-3">
                        <Form onSubmit={(e) => { e.preventDefault(); loadAnalytics(); }}>
                            <Row className="g-2 align-items-end">
                                <Col md={2}>
                                    <Form.Group>
                                        <Form.Label className="small fw-bold text-muted mb-1">Desde</Form.Label>
                                        <Form.Control type="date" size="sm" className="bg-white border-light-soft shadow-none" value={desde} onChange={e => setDesde(e.target.value)} />
                                    </Form.Group>
                                </Col>
                                <Col md={2}>
                                    <Form.Group>
                                        <Form.Label className="small fw-bold text-muted mb-1">Hasta</Form.Label>
                                        <Form.Control type="date" size="sm" className="bg-white border-light-soft shadow-none" value={hasta} onChange={e => setHasta(e.target.value)} />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label className="small fw-bold text-muted mb-1">Filtro Producto</Form.Label>
                                        <Form.Select size="sm" className="bg-white border-light-soft shadow-none" value={productoId} onChange={e => setProductoId(e.target.value)}>
                                            <option value="all">Todos los productos</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>{p.nombre}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label className="small fw-bold text-muted mb-1">Filtro Estado Pago</Form.Label>
                                        <Form.Select size="sm" className="bg-white border-light-soft shadow-none" value={estadoPago} onChange={e => setEstadoPago(e.target.value)}>
                                            <option value="all">Todos los pagos</option>
                                            <option value="pendiente">Pendientes</option>
                                            <option value="parcial">Parciales</option>
                                            <option value="pagado">Pagados</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={2}>
                                    <Button type="submit" variant="primary" size="sm" className="w-100 fw-bold py-2" onClick={loadAnalytics}>
                                        Aplicar Filtros
                                    </Button>
                                </Col>
                            </Row>
                        </Form>
                    </Card>

                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" />
                            <p className="mt-2 text-muted">Procesando analíticas de facturación...</p>
                        </div>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <Row className="g-3 mb-4">
                                <Col md={3}>
                                    <Card className="border-0 shadow-sm rounded-3 bg-white">
                                        <Card.Body className="p-3 d-flex align-items-center gap-3">
                                            <div className="avatar bg-primary-soft text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                                                <DollarSign size={22} />
                                            </div>
                                            <div>
                                                <span className="text-muted small d-block">Monto Facturado</span>
                                                <span className="fw-extrabold text-dark font-size-18">S/ {totalFacturado.toFixed(2)}</span>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3}>
                                    <Card className="border-0 shadow-sm rounded-3 bg-white">
                                        <Card.Body className="p-3 d-flex align-items-center gap-3">
                                            <div className="avatar bg-success-soft text-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                                                <ShoppingCart size={22} />
                                            </div>
                                            <div>
                                                <span className="text-muted small d-block">Volumen Vendido</span>
                                                <span className="fw-extrabold text-dark font-size-18">{volumenTotal} unidades</span>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3}>
                                    <Card className="border-0 shadow-sm rounded-3 bg-white">
                                        <Card.Body className="p-3 d-flex align-items-center gap-3">
                                            <div className="avatar bg-warning-soft text-warning-dark rounded-circle d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                                                <Activity size={22} />
                                            </div>
                                            <div>
                                                <span className="text-muted small d-block">Transacciones</span>
                                                <span className="fw-extrabold text-dark font-size-18">{totalTransacciones} Ventas</span>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3}>
                                    <Card className="border-0 shadow-sm rounded-3 bg-white">
                                        <Card.Body className="p-3 d-flex align-items-center gap-3">
                                            <div className="avatar bg-info-soft text-info rounded-circle d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                                                <Percent size={22} />
                                            </div>
                                            <div>
                                                <span className="text-muted small d-block">Ticket Promedio</span>
                                                <span className="fw-extrabold text-dark font-size-18">S/ {ticketPromedio.toFixed(2)}</span>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            {/* Tables & Analytics Breakdown */}
                            <Row className="g-4">
                                {/* Product Performance */}
                                <Col md={7}>
                                    <Card className="border-0 shadow-sm rounded-3">
                                        <Card.Header className="bg-transparent border-bottom py-3">
                                            <h6 className="fw-bold text-dark mb-0">🏆 Desempeño por Producto</h6>
                                        </Card.Header>
                                        <Card.Body className="p-0">
                                            <Table hover responsive className="align-middle mb-0 bg-white">
                                                <thead className="table-light font-size-12">
                                                    <tr>
                                                        <th className="ps-3">Nombre Producto</th>
                                                        <th>Cantidad Vendida</th>
                                                        <th className="text-end pe-3">Total Recaudado</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="font-size-13">
                                                    {byProduct.map((p, idx) => (
                                                        <tr key={idx}>
                                                            <td className="ps-3 fw-bold text-dark">{p.nombre}</td>
                                                            <td>{p.total_cantidad} uds.</td>
                                                            <td className="text-end pe-3 fw-bold text-primary">S/ {parseFloat(p.total_monto).toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                    {byProduct.length === 0 && (
                                                        <tr>
                                                            <td colSpan={3} className="text-center py-4 text-muted">Sin datos.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                        </Card.Body>
                                    </Card>
                                </Col>

                                {/* Sales by Seller (Vendedor) */}
                                <Col md={5}>
                                    <Card className="border-0 shadow-sm rounded-3">
                                        <Card.Header className="bg-transparent border-bottom py-3">
                                            <h6 className="fw-bold text-dark mb-0">👤 Ventas por Vendedor / Chofer</h6>
                                        </Card.Header>
                                        <Card.Body className="p-0">
                                            <Table hover responsive className="align-middle mb-0 bg-white">
                                                <thead className="table-light font-size-12">
                                                    <tr>
                                                        <th className="ps-3">Vendedor</th>
                                                        <th>Transacciones</th>
                                                        <th className="text-end pe-3">Monto</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="font-size-13">
                                                    {byUser.map((u, idx) => (
                                                        <tr key={idx}>
                                                            <td className="ps-3 fw-bold text-dark">{u.nombre || 'Administrador'}</td>
                                                            <td>{u.total_ventas} trans.</td>
                                                            <td className="text-end pe-3 fw-bold text-success">S/ {parseFloat(u.monto_total).toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                    {byUser.length === 0 && (
                                                        <tr>
                                                            <td colSpan={3} className="text-center py-4 text-muted">Sin datos.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                        </Card.Body>
                                    </Card>
                                </Col>

                                {/* Daily Trend */}
                                <Col md={12}>
                                    <Card className="border-0 shadow-sm rounded-3">
                                        <Card.Header className="bg-transparent border-bottom py-3">
                                            <h6 className="fw-bold text-dark mb-0">📅 Evolución Diaria de Ventas</h6>
                                        </Card.Header>
                                        <Card.Body className="p-0">
                                            <Table hover responsive className="align-middle mb-0 bg-white">
                                                <thead className="table-light font-size-12">
                                                    <tr>
                                                        <th className="ps-3">Fecha</th>
                                                        <th>Cantidad Transacciones</th>
                                                        <th className="text-end pe-3">Facturado del Día</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="font-size-13">
                                                    {dailyTrend.map((d, idx) => (
                                                        <tr key={idx}>
                                                            <td className="ps-3 text-muted">{d.fecha}</td>
                                                            <td>{d.total_ventas} trans.</td>
                                                            <td className="text-end pe-3 fw-bold text-primary">S/ {parseFloat(d.monto_total).toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                    {dailyTrend.length === 0 && (
                                                        <tr>
                                                            <td colSpan={3} className="text-center py-4 text-muted">Sin datos.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </>
                    )}
                </div>
            </SimpleBar>
            </div>
        </div>
    );
}
