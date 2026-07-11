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

export default function PurchasesPage() {
    const [purchases, setPurchases] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [igvPercentage, setIgvPercentage] = useState(18);
    const [loading, setLoading] = useState(true);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    // Purchase Modals
    const [showModal, setShowModal] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState(null);

    // Form states
    const [providerId, setProviderId] = useState('');
    const [fechaCompra, setFechaCompra] = useState(new Date().toISOString().split('T')[0]);
    const [tipoComprobante, setTipoComprobante] = useState('Factura');
    const [numeroComprobante, setNumeroComprobante] = useState('');
    const [notas, setNotas] = useState('');
    
    // Items state
    const [items, setItems] = useState([]);
    const [currentProduct, setCurrentProduct] = useState('');
    const [currentQty, setCurrentQty] = useState(1);
    const [currentCost, setCurrentCost] = useState(0);

    const loadData = async () => {
        setLoading(true);
        try {
            const purRes = await fetch(`${API_BASE}/api/compras`);
            const provRes = await fetch(`${API_BASE}/api/proveedores`);
            const prodRes = await fetch(`${API_BASE}/api/productos`);
            const settingsRes = await fetch(`${API_BASE}/api/settings`);

            if (purRes.ok) setPurchases(await purRes.json());
            if (provRes.ok) setSuppliers(await provRes.json());
            if (prodRes.ok) setProducts(await prodRes.json());
            if (settingsRes.ok) {
                const settingsData = await settingsRes.json();
                if (settingsData['igv.porcentaje']) {
                    setIgvPercentage(parseFloat(settingsData['igv.porcentaje']));
                }
            }
        } catch (e) {
            console.error("Error loading purchases data", e);
            Swal.fire('Error', 'No se pudieron cargar los datos de compras.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleNew = () => {
        setProviderId('');
        setFechaCompra(new Date().toISOString().split('T')[0]);
        setTipoComprobante('Factura');
        setNumeroComprobante('');
        setNotas('');
        setItems([]);
        setCurrentProduct('');
        setCurrentQty(1);
        setCurrentCost(0);
        setShowModal(true);
    };

    const handleAddProduct = () => {
        if (!currentProduct) {
            Swal.fire('Error', 'Selecciona un producto.', 'warning');
            return;
        }
        if (currentQty <= 0) {
            Swal.fire('Error', 'La cantidad debe ser mayor que cero.', 'warning');
            return;
        }

        const prod = products.find(p => String(p.id) === String(currentProduct));
        if (!prod) return;

        // Check if item already added
        const exists = items.find(i => String(i.id) === String(currentProduct));
        if (exists) {
            Swal.fire('Error', 'Este producto ya ha sido agregado. Modifica su cantidad o elimínalo primero.', 'warning');
            return;
        }

        const qty = parseFloat(currentQty);
        const cost = parseFloat(currentCost);
        const subtotal = qty * cost;

        setItems([
            ...items,
            {
                id: prod.id,
                codigo: prod.codigo,
                nombre: prod.nombre,
                cantidad: qty,
                costo: cost,
                subtotal: subtotal
            }
        ]);

        // Reset inputs
        setCurrentProduct('');
        setCurrentQty(1);
        setCurrentCost(0);
    };

    const handleRemoveProduct = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    // Calculate totals based on items list
    const subtotalTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const igvTotal = subtotalTotal * (igvPercentage / 100);
    const grandTotal = subtotalTotal + igvTotal;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!providerId) {
            Swal.fire('Error', 'Debes seleccionar un proveedor.', 'warning');
            return;
        }
        if (items.length === 0) {
            Swal.fire('Error', 'Debes agregar al menos un producto a la compra.', 'warning');
            return;
        }

        setSaving(true);
        try {
            const data = {
                proveedor_id: parseInt(providerId),
                fecha_compra: fechaCompra,
                tipo_comprobante: tipoComprobante,
                numero_comprobante: numeroComprobante,
                subtotal: subtotalTotal,
                igv: igvTotal,
                total: grandTotal,
                notas: notas,
                items: items.map(item => ({
                    producto_id: item.id,
                    cantidad: item.cantidad,
                    costo_unitario: item.costo,
                    subtotal: item.subtotal
                }))
            };

            const res = await fetch(`${API_BASE}/api/compras/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Compra registrada',
                    text: 'La compra se guardó como borrador con éxito.',
                    timer: 1500,
                    showConfirmButton: false
                });
                setShowModal(false);
                loadData();
            } else {
                Swal.fire('Error', 'No se pudo guardar la orden de compra.', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleViewDetails = async (id) => {
        try {
            const res = await fetch(`${API_BASE}/api/compras/${id}`);
            if (res.ok) {
                setSelectedPurchase(await res.json());
                setShowDetails(true);
            } else {
                Swal.fire('Error', 'No se pudieron obtener los detalles de la compra.', 'error');
            }
        } catch (e) {
            Swal.fire('Error', 'Error al consultar la compra.', 'error');
        }
    };

    const handleReceivePurchase = (id) => {
        Swal.fire({
            title: '¿Confirmas el ingreso de mercadería?',
            text: 'Esto cargará el stock actual de los productos al almacén y registrará automáticamente un egreso contable.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            confirmButtonText: 'Sí, Ingresar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`${API_BASE}/api/compras/receive/${id}`, {
                        method: 'POST'
                    });
                    const data = await res.json();
                    if (res.ok) {
                        Swal.fire('Ingresada', 'Mercadería cargada y egreso contable generado.', 'success');
                        loadData();
                    } else {
                        Swal.fire('Error', data.message || 'No se pudo ingresar la mercadería.', 'error');
                    }
                } catch (e) {
                    Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
                }
            }
        });
    };

    const handleDeletePurchase = (id) => {
        Swal.fire({
            title: '¿Deseas eliminar este borrador?',
            text: 'Se eliminará la orden de compra permanentemente.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Eliminar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`${API_BASE}/api/compras/${id}`, {
                        method: 'DELETE'
                    });
                    const data = await res.json();
                    if (res.ok) {
                        Swal.fire('Eliminada', 'La compra fue eliminada.', 'success');
                        loadData();
                    } else {
                        Swal.fire('Error', data.message || 'No se pudo eliminar la compra.', 'error');
                    }
                } catch (e) {
                    Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
                }
            }
        });
    };

    return (
        <Container fluid className="px-4 py-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-extrabold text-dark mb-1">Compras de Almacén</h2>
                    <p className="text-muted small mb-0">Registra compras de inventario a proveedores y carga automáticamente el stock a tu almacén físico.</p>
                </div>
                <Button variant="primary" className="fw-bold px-3 py-2" onClick={handleNew}>
                    <Icons.Plus size={16} className="me-2" />
                    Registrar Orden de Compra
                </Button>
            </div>

            {/* List Table */}
            {loading ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                    <Spinner animation="border" color="primary" />
                    <span className="ms-2">Cargando compras...</span>
                </div>
            ) : (
                <Card className="border-0 shadow-sm rounded-3 overflow-hidden bg-white">
                    <Table hover responsive className="align-middle mb-0 text-nowrap">
                        <thead className="table-light text-muted font-size-12">
                            <tr>
                                <th>Nro Compra</th>
                                <th>Fecha</th>
                                <th>Proveedor</th>
                                <th>Productos</th>
                                <th>Subtotal</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th className="text-end">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="font-size-13">
                            {purchases.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(p => {
                                const initials = p.proveedor_nombre ? p.proveedor_nombre.substring(0, 2).toUpperCase() : '?';
                                const colors = ['primary', 'info', 'success', 'warning', 'danger', 'violet'];
                                const avtBg = colors[(p.id || 0) % colors.length];
                                
                                return (
                                <tr key={p.id}>
                                    <td className="ps-3">
                                        <strong className="text-dark" style={{ fontSize: '13px' }}>{p.numero_compra}</strong>
                                    </td>
                                    <td>
                                        <span className="small text-muted">{p.fecha_compra ? p.fecha_compra.split('T')[0].split('-').reverse().join('/') : ''}</span>
                                    </td>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <div className="me-2">
                                                <div className={`avatar avatar-xs avatar-rounded bg-soft-${avtBg} text-${avtBg} d-flex align-items-center justify-content-center fw-bold`} style={{ width: '32px', height: '32px', fontSize: '11px', borderRadius: '50%' }}>
                                                    {initials}
                                                </div>
                                            </div>
                                            <div className="fw-semibold text-dark text-high-em" style={{ fontSize: '13px' }}>{p.proveedor_nombre}</div>
                                        </div>
                                    </td>
                                    <td style={{ maxWidth: '200px' }}>
                                        <span className="text-muted small text-wrap d-block text-truncate" style={{ fontSize: '12px', lineHeight: '1.4' }} title={p.productos_detalle}>
                                            {p.productos_detalle || 'Sin productos'}
                                        </span>
                                    </td>
                                    <td><span className="text-muted">S/ {parseFloat(p.subtotal || 0).toFixed(2)}</span></td>
                                    <td>
                                        <span className="fw-bold text-primary">S/ {parseFloat(p.total || 0).toFixed(2)}</span>
                                    </td>
                                    <td>
                                        <Badge bg={p.estado === 'recibida' ? 'success text-white' : 'warning text-dark'} className="border-0 rounded-pill px-2 py-1">
                                            {p.estado === 'recibida' ? '● Recibida en Almacén' : '○ Borrador / Pendiente'}
                                        </Badge>
                                    </td>
                                    <td className="text-end">
                                        <Button variant="link" className="p-1 text-info hover-bg rounded-circle" onClick={() => handleViewDetails(p.id)} title="Ver detalles">
                                            <Icons.InfoCircle size={16} />
                                        </Button>
                                        {p.estado === 'pendiente' && (
                                            <>
                                                <Button variant="link" className="p-1 text-success hover-bg rounded-circle" onClick={() => handleReceivePurchase(p.id)} title="Ingresar a Almacén">
                                                    <Icons.Check size={16} />
                                                </Button>
                                                <Button variant="link" className="p-1 text-danger hover-bg rounded-circle" onClick={() => handleDeletePurchase(p.id)} title="Eliminar">
                                                    <Icons.Trash size={16} />
                                                </Button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                                );
                            })}
                            {purchases.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center py-4 text-muted">No se encontraron compras de almacén registradas.</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                    {purchases.length > 0 && (
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-3 border-top bg-light-soft">
                            <div className="text-muted small mb-2 mb-md-0 fw-semibold">
                                Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, purchases.length)} de {purchases.length} compras
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
                                        {currentPage} / {Math.ceil(purchases.length / itemsPerPage)}
                                    </Button>
                                    <Button 
                                        variant="outline-secondary" 
                                        size="sm" 
                                        className="fw-bold"
                                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(purchases.length / itemsPerPage), p + 1))}
                                        disabled={currentPage === Math.ceil(purchases.length / itemsPerPage)}
                                    >
                                        Siguiente
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* Create Purchase Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" backdrop="static">
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title className="fw-bold">Nueva Orden de Compra</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        {/* Section 1: Header details */}
                        <h6 className="fw-bold text-primary mb-3 pb-2 border-bottom">1. Datos Generales de la Compra</h6>
                        <Row className="g-3 mb-4">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Proveedor</Form.Label>
                                    <Form.Select
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={providerId}
                                        onChange={(e) => setProviderId(e.target.value)}
                                        required
                                    >
                                        <option value="">Selecciona Proveedor...</option>
                                        {suppliers.filter(s => s.activo).map(s => (
                                            <option key={s.id} value={s.id}>{s.razon_social} (RUC: {s.ruc})</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Fecha de Compra</Form.Label>
                                    <Form.Control
                                        type="date"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={fechaCompra}
                                        onChange={(e) => setFechaCompra(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Tipo de Comprobante</Form.Label>
                                    <Form.Select
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={tipoComprobante}
                                        onChange={(e) => setTipoComprobante(e.target.value)}
                                    >
                                        <option value="Factura">Factura</option>
                                        <option value="Boleta">Boleta</option>
                                        <option value="Nota de Venta">Nota de Venta</option>
                                        <option value="Guía">Guía de Remisión / Nota de Crédito</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Nro de Comprobante / Factura</Form.Label>
                                    <Form.Control
                                        type="text"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={numeroComprobante}
                                        onChange={(e) => setNumeroComprobante(e.target.value)}
                                        placeholder="Ej: F001-0001048"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* Section 2: Items loader */}
                        <h6 className="fw-bold text-primary mb-3 pb-2 border-bottom">2. Agregar Productos al Detalle</h6>
                        <Card className="bg-light-soft border-0 mb-4 rounded-3 p-3">
                            <Row className="g-3 align-items-end">
                                <Col md={5}>
                                    <Form.Group>
                                        <Form.Label className="small fw-bold text-muted mb-1">Producto</Form.Label>
                                        <Form.Select
                                            className="shadow-none border-light-soft bg-white"
                                            value={currentProduct}
                                            onChange={(e) => {
                                                setCurrentProduct(e.target.value);
                                                const prod = products.find(p => String(p.id) === String(e.target.value));
                                                if (prod) {
                                                    const salePrice = prod.precioVenta || prod.precio_venta || 0;
                                                    setCurrentCost(parseFloat((salePrice * 0.7).toFixed(2)));
                                                }
                                            }}
                                        >
                                            <option value="">Selecciona Producto...</option>
                                            {products.filter(p => p.activo).map(p => (
                                                <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stock_actual})</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label className="small fw-bold text-muted mb-1">Costo Unitario (S/)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            step="0.01"
                                            className="shadow-none border-light-soft bg-white"
                                            value={currentCost}
                                            onChange={(e) => setCurrentCost(parseFloat(e.target.value) || 0)}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={2}>
                                    <Form.Group>
                                        <Form.Label className="small fw-bold text-muted mb-1">Cantidad</Form.Label>
                                        <Form.Control
                                            type="number"
                                            className="shadow-none border-light-soft bg-white"
                                            value={currentQty}
                                            onChange={(e) => setCurrentQty(parseInt(e.target.value) || 1)}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={2}>
                                    <Button variant="outline-primary" className="w-100 fw-bold py-2" onClick={handleAddProduct}>
                                        <Icons.Plus size={16} /> Agregar
                                    </Button>
                                </Col>
                            </Row>
                        </Card>

                        {/* Items Table */}
                        <Table responsive hover className="align-middle mb-4 border rounded-3 bg-white text-nowrap">
                            <thead className="table-light text-muted font-size-12">
                                <tr>
                                    <th>Cód</th>
                                    <th>Producto</th>
                                    <th>Cantidad</th>
                                    <th>Costo Unit.</th>
                                    <th>Subtotal</th>
                                    <th className="text-end" style={{ width: '60px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={item.id}>
                                        <td className="small text-muted">{item.codigo || '—'}</td>
                                        <td className="fw-bold">{item.nombre}</td>
                                        <td>{item.cantidad}</td>
                                        <td>S/ {parseFloat(item.costo).toFixed(2)}</td>
                                        <td>S/ {parseFloat(item.subtotal).toFixed(2)}</td>
                                        <td className="text-end">
                                            <Button variant="link" className="p-0 text-danger" onClick={() => handleRemoveProduct(index)}>
                                                <Icons.Trash size={16} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-4 text-muted">Aún no has agregado productos al detalle.</td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>

                        {/* Section 3: Totals calculation */}
                        <Row className="g-3">
                            <Col md={7}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Notas / Observaciones</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={notas}
                                        onChange={(e) => setNotas(e.target.value)}
                                        placeholder="Términos de pago, guía de despacho o detalles del flete..."
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={5} className="d-flex flex-column align-items-end justify-content-center">
                                <div className="w-100 border-top pt-3" style={{ maxWidth: '280px' }}>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted fw-bold small">Subtotal:</span>
                                        <strong className="text-dark">S/ {subtotalTotal.toFixed(2)}</strong>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted fw-bold small">IGV ({igvPercentage}%):</span>
                                        <strong className="text-dark">S/ {igvTotal.toFixed(2)}</strong>
                                    </div>
                                    <div className="d-flex justify-content-between border-top pt-2">
                                        <span className="text-primary fw-extrabold fs-6">TOTAL COMPRA:</span>
                                        <strong className="text-primary fs-6">S/ {grandTotal.toFixed(2)}</strong>
                                    </div>
                                </div>
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
                                    Guardar Compra
                                </>
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* View Details Modal */}
            <Modal show={showDetails} onHide={() => setShowDetails(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold">
                        Detalle de Compra: {selectedPurchase?.purchase.numero_compra}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {selectedPurchase && (
                        <>
                            <Row className="mb-4 g-3 bg-light-soft p-3 rounded-3">
                                <Col md={6}>
                                    <div className="small text-muted fw-bold text-uppercase">Proveedor</div>
                                    <div className="fw-bold text-dark fs-6">{selectedPurchase.purchase.proveedor_nombre}</div>
                                </Col>
                                <Col md={3}>
                                    <div className="small text-muted fw-bold text-uppercase">Fecha</div>
                                    <div className="fw-bold text-dark">{selectedPurchase.purchase.fecha_compra.split('T')[0].split('-').reverse().join('/')}</div>
                                </Col>
                                <Col md={3}>
                                    <div className="small text-muted fw-bold text-uppercase">Estado</div>
                                    <Badge bg={selectedPurchase.purchase.estado === 'recibida' ? 'success' : 'warning'}>
                                        {selectedPurchase.purchase.estado === 'recibida' ? 'Recibida' : 'Pendiente'}
                                    </Badge>
                                </Col>
                                {selectedPurchase.purchase.numero_comprobante && (
                                    <Col md={12} className="border-top pt-2">
                                        <span className="small text-muted fw-bold text-uppercase me-2">Documento:</span>
                                        <strong>{selectedPurchase.purchase.tipo_comprobante} — {selectedPurchase.purchase.numero_comprobante}</strong>
                                    </Col>
                                )}
                            </Row>

                            <Table responsive hover className="align-middle mb-4 border rounded-3 bg-white text-nowrap">
                                <thead className="table-light text-muted font-size-12">
                                    <tr>
                                        <th>Cód</th>
                                        <th>Producto</th>
                                        <th>Cantidad</th>
                                        <th>Costo Unitario</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedPurchase.details.map(item => (
                                        <tr key={item.id}>
                                            <td className="small text-muted">{item.producto_codigo}</td>
                                            <td className="fw-bold">{item.producto_nombre}</td>
                                            <td>{item.cantidad}</td>
                                            <td>S/ {parseFloat(item.costo_unitario).toFixed(2)}</td>
                                            <td>S/ {parseFloat(item.subtotal).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>

                            <Row className="g-3">
                                <Col md={7}>
                                    {selectedPurchase.purchase.notas && (
                                        <div className="p-3 bg-light rounded-3">
                                            <div className="small text-muted fw-bold mb-1">Notas:</div>
                                            <p className="small mb-0 text-dark" style={{ whiteSpace: 'pre-wrap' }}>{selectedPurchase.purchase.notas}</p>
                                        </div>
                                    )}
                                </Col>
                                <Col md={5} className="d-flex flex-column align-items-end justify-content-center">
                                    <div className="w-100" style={{ maxWidth: '280px' }}>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="text-muted fw-bold small">Subtotal:</span>
                                            <strong className="text-dark">S/ {parseFloat(selectedPurchase.purchase.subtotal).toFixed(2)}</strong>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="text-muted fw-bold small">IGV:</span>
                                            <strong className="text-dark">S/ {parseFloat(selectedPurchase.purchase.igv).toFixed(2)}</strong>
                                        </div>
                                        <div className="d-flex justify-content-between border-top pt-2">
                                            <span className="text-primary fw-extrabold fs-6">TOTAL COMPRA:</span>
                                            <strong className="text-primary fs-6">S/ {parseFloat(selectedPurchase.purchase.total).toFixed(2)}</strong>
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => setShowDetails(false)}>
                        Cerrar
                    </Button>
                    {selectedPurchase?.purchase.estado === 'pendiente' && (
                        <Button variant="success" onClick={() => { setShowDetails(false); handleReceivePurchase(selectedPurchase.purchase.id); }}>
                            <Icons.Check size={16} className="me-2" /> Ingresar a Almacén
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
