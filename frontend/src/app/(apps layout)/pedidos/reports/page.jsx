"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Container, Form, Spinner, Button, Badge } from 'react-bootstrap';
import dynamic from 'next/dynamic';
import * as Icons from 'tabler-icons-react';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });
const getApiBase = () => {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost') return 'http://localhost:8080';
        return `http://${hostname}:8080`;
    }
    return 'http://localhost:8080';
};
const API_BASE = getApiBase();

export default function PedidosReportsPage() {
    const [pedidos, setPedidos] = useState([]);
    const [zonas, setZonas] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Filters
    const [filterDesde, setFilterDesde] = useState('');
    const [filterHasta, setFilterHasta] = useState('');
    const [filterZona, setFilterZona] = useState('all');
    const [filterChofer, setFilterChofer] = useState('all');
    const [filterPago, setFilterPago] = useState('all');

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE}/api/pedidos/logistics-data`);
                if (res.ok) {
                    const data = await res.json();
                    setPedidos(data.pedidos || []);
                    setZonas(data.zonas || []);
                    setDrivers(data.drivers || []);
                }
            } catch (err) {
                console.error("Error loading logistics data:", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
        
        const savedSidebar = localStorage.getItem('reports_sidebar_collapsed');
        if (savedSidebar === 'true') {
            setSidebarCollapsed(true);
        }
    }, []);

    // Local filtering
    const filteredPedidos = useMemo(() => {
        return pedidos.filter(p => {
            if (filterDesde && p.fecha_entrega < filterDesde) return false;
            if (filterHasta && p.fecha_entrega > filterHasta + 'T23:59:59') return false;
            if (filterZona !== 'all' && String(p.zona) !== String(filterZona)) return false;
            if (filterChofer !== 'all' && String(p.chofer_id) !== String(filterChofer)) return false;
            if (filterPago !== 'all' && p.estado_pago !== filterPago) return false;
            return true;
        });
    }, [pedidos, filterDesde, filterHasta, filterZona, filterChofer, filterPago]);

    // Metrics calculation
    const metrics = useMemo(() => {
        let totalPedidos = 0;
        let totalSoles = 0;
        let totalCobrado = 0;
        let totalPendiente = 0;
        let totalEntregados = 0;
        let totalDevueltos = 0;

        filteredPedidos.forEach(p => {
            totalPedidos++;
            const t = parseFloat(p.total) || 0;
            totalSoles += t;
            if (p.estado_pago === 'Pagado') {
                totalCobrado += t;
            } else {
                totalPendiente += t;
            }
            totalEntregados += (parseInt(p.envases_entregados) || 0);
            totalDevueltos += (parseInt(p.envases_devueltos) || 0);
        });

        return { totalPedidos, totalSoles, totalCobrado, totalPendiente, totalEntregados, totalDevueltos };
    }, [filteredPedidos]);

    // Chart: Pedidos por día
    const chartDataPorDia = useMemo(() => {
        const porDia = {};
        filteredPedidos.forEach(p => {
            const dateStr = p.fecha_entrega ? p.fecha_entrega.split('T')[0] : 'Sin fecha';
            if (!porDia[dateStr]) porDia[dateStr] = 0;
            porDia[dateStr]++;
        });
        const categories = Object.keys(porDia).sort();
        const data = categories.map(k => porDia[k]);
        
        return {
            options: {
                chart: { type: 'bar', toolbar: { show: false } },
                xaxis: { categories },
                colors: ['#3b82f6'],
                title: { text: 'Pedidos por Día', style: { fontSize: '14px', fontWeight: 'bold' } }
            },
            series: [{ name: 'Pedidos', data }]
        };
    }, [filteredPedidos]);

    // Chart: Pedidos por zona
    const chartDataPorZona = useMemo(() => {
        const porZona = {};
        filteredPedidos.forEach(p => {
            const zona = p.zona_nombre || 'Sin Zona';
            if (!porZona[zona]) porZona[zona] = 0;
            porZona[zona]++;
        });
        const labels = Object.keys(porZona);
        const series = labels.map(k => porZona[k]);

        return {
            options: {
                chart: { type: 'donut' },
                labels,
                title: { text: 'Pedidos por Zona', style: { fontSize: '14px', fontWeight: 'bold' } },
                legend: { position: 'bottom' }
            },
            series
        };
    }, [filteredPedidos]);

    // Chart: Pedidos por chofer
    const chartDataPorChofer = useMemo(() => {
        const porChofer = {};
        filteredPedidos.forEach(p => {
            const chofer = p.chofer_n ? `${p.chofer_n} ${p.chofer_a || ''}`.trim() : 'Sin Chofer';
            if (!porChofer[chofer]) porChofer[chofer] = 0;
            porChofer[chofer]++;
        });
        const categories = Object.keys(porChofer);
        const data = categories.map(k => porChofer[k]);

        return {
            options: {
                chart: { type: 'bar', toolbar: { show: false } },
                plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
                xaxis: { categories },
                colors: ['#10b981'],
                title: { text: 'Pedidos por Chofer', style: { fontSize: '14px', fontWeight: 'bold' } }
            },
            series: [{ name: 'Pedidos', data }]
        };
    }, [filteredPedidos]);

    // Chart: Estado de Pago
    const chartDataPagos = useMemo(() => {
        const pagos = { 'Pagado': 0, 'Pendiente': 0, 'Parcial': 0 };
        filteredPedidos.forEach(p => {
            if (p.estado_pago === 'Pagado') pagos['Pagado']++;
            else if (p.estado_pago === 'Parcial') pagos['Parcial']++;
            else pagos['Pendiente']++;
        });

        return {
            options: {
                chart: { type: 'pie' },
                labels: ['Pagado', 'Pendiente', 'Parcial'],
                colors: ['#10b981', '#ef4444', '#f59e0b'],
                title: { text: 'Estado de Cobro de Pedidos', style: { fontSize: '14px', fontWeight: 'bold' } },
                legend: { position: 'bottom' }
            },
            series: [pagos['Pagado'], pagos['Pendiente'], pagos['Parcial']]
        };
    }, [filteredPedidos]);

    return (
        <Container fluid className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-3">
                    {sidebarCollapsed && (
                        <Button
                            variant="light"
                            className="bg-white border rounded shadow-sm d-flex align-items-center justify-content-center p-2"
                            onClick={() => {
                                setSidebarCollapsed(false);
                                localStorage.removeItem('reports_sidebar_collapsed');
                            }}
                            title="Mostrar filtros"
                        >
                            <Icons.Menu2 size={18} />
                        </Button>
                    )}
                    <div>
                        <h2 className="mb-0 fw-bold text-dark">Reportes de Pedidos</h2>
                        <p className="text-muted mb-0">Analiza el rendimiento y estado de los pedidos logísticos</p>
                    </div>
                </div>
            </div>

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
                                            localStorage.setItem('reports_sidebar_collapsed', 'true');
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
                                        setFilterZona('all');
                                        setFilterChofer('all');
                                        setFilterPago('all');
                                    }}
                                >
                                    Limpiar
                                </Button>
                            </div>

                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">Desde</Form.Label>
                                <Form.Control 
                                    type="date" 
                                    size="sm"
                                    value={filterDesde}
                                    onChange={(e) => setFilterDesde(e.target.value)}
                                    className="border-light-subtle shadow-none"
                                />
                            </Form.Group>
                            
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">Hasta</Form.Label>
                                <Form.Control 
                                    type="date" 
                                    size="sm"
                                    value={filterHasta}
                                    onChange={(e) => setFilterHasta(e.target.value)}
                                    className="border-light-subtle shadow-none"
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">Zona</Form.Label>
                                <Form.Select size="sm" value={filterZona} onChange={e => setFilterZona(e.target.value)} className="border-light-subtle shadow-none">
                                    <option value="all">Todas las Zonas</option>
                                    {zonas.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">Chofer</Form.Label>
                                <Form.Select size="sm" value={filterChofer} onChange={e => setFilterChofer(e.target.value)} className="border-light-subtle shadow-none">
                                    <option value="all">Todos los Choferes</option>
                                    {drivers.map(d => <option key={d.id} value={d.id}>{d.nombre} {d.apellido}</option>)}
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">Estado de Pago</Form.Label>
                                <Form.Select size="sm" value={filterPago} onChange={e => setFilterPago(e.target.value)} className="border-light-subtle shadow-none">
                                    <option value="all">Todos los Estados</option>
                                    <option value="Pagado">Pagado</option>
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="Parcial">Parcial</option>
                                </Form.Select>
                            </Form.Group>
                        </div>
                    </Col>
                )}

                <Col lg={sidebarCollapsed ? 12 : 9}>
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <div className="mt-2 text-muted">Cargando datos...</div>
                        </div>
                    ) : (
                        <>
                            <Row className="g-4 mb-4">
                                <Col lg={3} sm={6}>
                                    <Card className="border-0 shadow-sm h-100">
                                        <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center">
                                            <div className="p-3 bg-primary bg-opacity-10 rounded-circle mb-3">
                                                <Icons.Truck size={32} className="text-primary" />
                                            </div>
                                            <h3 className="fw-bolder mb-1">{metrics.totalPedidos}</h3>
                                            <span className="text-muted small fw-semibold text-uppercase">Total Pedidos</span>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col lg={3} sm={6}>
                                    <Card className="border-0 shadow-sm h-100">
                                        <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center">
                                            <div className="p-3 bg-success bg-opacity-10 rounded-circle mb-3">
                                                <Icons.Cash size={32} className="text-success" />
                                            </div>
                                            <h3 className="fw-bolder mb-1 text-success">S/ {metrics.totalCobrado.toFixed(2)}</h3>
                                            <span className="text-muted small fw-semibold text-uppercase">Cobrado</span>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col lg={3} sm={6}>
                                    <Card className="border-0 shadow-sm h-100">
                                        <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center">
                                            <div className="p-3 bg-danger bg-opacity-10 rounded-circle mb-3">
                                                <Icons.CashOff size={32} className="text-danger" />
                                            </div>
                                            <h3 className="fw-bolder mb-1 text-danger">S/ {metrics.totalPendiente.toFixed(2)}</h3>
                                            <span className="text-muted small fw-semibold text-uppercase">Pendiente</span>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col lg={3} sm={6}>
                                    <Card className="border-0 shadow-sm h-100">
                                        <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center">
                                            <div className="p-3 bg-info bg-opacity-10 rounded-circle mb-3">
                                                <Icons.Bottle size={32} className="text-info" />
                                            </div>
                                            <h3 className="fw-bolder mb-1 text-info">{metrics.totalEntregados} / {metrics.totalDevueltos}</h3>
                                            <span className="text-muted small fw-semibold text-uppercase">Bidones (Entr/Dev)</span>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            <Row className="g-4 mb-4">
                                <Col lg={8}>
                                    <Card className="border-0 shadow-sm h-100">
                                        <Card.Body>
                                            <Chart 
                                                options={chartDataPorDia.options} 
                                                series={chartDataPorDia.series} 
                                                type="bar" 
                                                height={350} 
                                            />
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col lg={4}>
                                    <Card className="border-0 shadow-sm h-100">
                                        <Card.Body>
                                            <Chart 
                                                options={chartDataPagos.options} 
                                                series={chartDataPagos.series} 
                                                type="pie" 
                                                height={350} 
                                            />
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            <Row className="g-4">
                                <Col lg={6}>
                                    <Card className="border-0 shadow-sm h-100">
                                        <Card.Body>
                                            <Chart 
                                                options={chartDataPorZona.options} 
                                                series={chartDataPorZona.series} 
                                                type="donut" 
                                                height={350} 
                                            />
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col lg={6}>
                                    <Card className="border-0 shadow-sm h-100">
                                        <Card.Body>
                                            <Chart 
                                                options={chartDataPorChofer.options} 
                                                series={chartDataPorChofer.series} 
                                                type="bar" 
                                                height={350} 
                                            />
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </>
                    )}
                </Col>
            </Row>
        </Container>
    );
}
