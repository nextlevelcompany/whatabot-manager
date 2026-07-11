"use client";
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Table, Modal, Spinner, ListGroup } from 'react-bootstrap';
import { ArrowLeft, Plus, Trash, CheckCircle } from 'react-feather';
import { useRouter } from 'next/navigation';
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
const IGV_RATE = 0.18;

export default function CreateSalePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Master lists
    const [productList, setProductList] = useState([]);
    const [compositions, setCompositions] = useState([]);

    // Client search state
    const [clientSearch, setClientSearch] = useState('');
    const [clientResults, setClientResults] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);

    // Products table
    const [productosVenta, setProductosVenta] = useState([]);

    // Sale Form details
    const [fechaVenta, setFechaVenta] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });
    const [metodoPago, setMetodoPago] = useState('Efectivo');
    const [estadoValidacion, setEstadoValidacion] = useState('completada'); // completada or pendiente

    // Modal state
    const [showProductModal, setShowProductModal] = useState(false);
    const [modalSelectedProdId, setModalSelectedProdId] = useState('');
    const [modalProdCant, setModalProdCant] = useState(1);
    const [modalProdPrice, setModalProdPrice] = useState(0.0);

    // Initial Master List Fetch
    useEffect(() => {
        const fetchMasters = async () => {
            try {
                const prodRes = await fetch(`${API_BASE}/api/productos`);
                if (prodRes.ok) {
                    const prods = await prodRes.json();
                    setProductList(prods.filter(p => p.activo !== false));
                }

                const compRes = await fetch(`${API_BASE}/api/sales/compositions`);
                if (compRes.ok) {
                    const data = await compRes.json();
                    setCompositions(data.compositions || []);
                }
            } catch (err) {
                console.error("Error fetching products list", err);
            }
        };
        fetchMasters();
    }, []);

    // Search contacts
    useEffect(() => {
        if (clientSearch.trim().length < 2) {
            setClientResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            try {
                const res = await fetch(`${API_BASE}/api/pedidos/search-contacts?q=${encodeURIComponent(clientSearch)}`);
                if (res.ok) {
                    const data = await res.json();
                    setClientResults(data);
                }
            } catch (e) {
                console.error("Error searching contacts", e);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [clientSearch]);

    const loadClientDetails = async (clientId) => {
        try {
            const res = await fetch(`${API_BASE}/api/pedidos/contact-details/${clientId}`);
            if (res.ok) {
                const data = await res.json();
                setAddresses(data.addresses || []);
                if (data.addresses && data.addresses.length > 0) {
                    setSelectedAddressId(data.addresses[0].id);
                }
            }
        } catch (e) {
            console.error("Error loading client addresses", e);
        }
    };

    const handleSelectClient = async (client) => {
        try {
            const res = await fetch(`${API_BASE}/api/contacts/${client.id}`);
            if (res.ok) {
                const fullContact = await res.json();
                setSelectedClient({
                    id: client.id,
                    text: client.text,
                    bidones_prestados: fullContact.bidonesPrestados || fullContact.bidones_prestados || 0
                });
            } else {
                setSelectedClient({ id: client.id, text: client.text, bidones_prestados: 0 });
            }
        } catch (e) {
            setSelectedClient({ id: client.id, text: client.text, bidones_prestados: 0 });
        }
        
        setClientSearch('');
        setClientResults([]);
        await loadClientDetails(client.id);
    };

    // Calculate bottle suggestions
    const getSuggestedBottleCounts = () => {
        let entregados = 0;
        let devueltos = 0;
        let vendidos = 0;

        productosVenta.forEach(p => {
            let pEntregados = 0;
            let pDevueltos = 0;
            let pVendidos = 0;

            const requiresReturn = p.requiere_retorno === 1 || p.requiereRetorno === true;

            if (p.es_pack === 1 || p.esPack === true) {
                const components = compositions.filter(c => c.producto_padre_id === p.id);
                if (components.length > 0) {
                    let countRetorno = 0;
                    let countVenta = 0;

                    components.forEach(comp => {
                        if (requiresReturn && comp.requiere_retorno === 1) {
                            countRetorno += parseFloat(comp.cantidad || 0);
                        }
                        if (comp.categoria_id === 2 || comp.categoria_id === 6) {
                            countVenta += parseFloat(comp.cantidad || 0);
                        }
                    });

                    pEntregados = countRetorno;
                    pDevueltos = countRetorno;
                    pVendidos = countVenta;
                }
            } else {
                if (requiresReturn) {
                    pEntregados = 1;
                    pDevueltos = 1;
                } else {
                    pEntregados = 0;
                    pDevueltos = 0;
                    if (p.categoria_id === 2 || p.categoria_id === 6) pVendidos = 1;
                }
            }

            entregados += (pEntregados * p.cantidad);
            devueltos += (pDevueltos * p.cantidad);
            vendidos += (pVendidos * p.cantidad);
        });

        return { entregados, devueltos, vendidos };
    };

    const suggestions = getSuggestedBottleCounts();

    // Calculate totals
    const totalVal = productosVenta.reduce((sum, item) => sum + (item.precio * item.cantidad), 0.0);
    const subtotalVal = totalVal / (1 + IGV_RATE);
    const igvVal = totalVal - subtotalVal;

    // Fill price automatically when modal product changes
    useEffect(() => {
        if (modalSelectedProdId) {
            const p = productList.find(prod => String(prod.id) === String(modalSelectedProdId));
            if (p) setModalProdPrice(parseFloat(p.precioVenta || p.precio_order || p.precio_venta || 0.0));
        }
    }, [modalSelectedProdId, productList]);

    const handleAddProduct = () => {
        const prod = productList.find(p => String(p.id) === String(modalSelectedProdId));
        if (!prod) return;

        const exists = productosVenta.findIndex(p => p.id === prod.id);
        if (exists !== -1) {
            const updated = [...productosVenta];
            updated[exists].cantidad += parseInt(modalProdCant);
            updated[exists].precio = parseFloat(modalProdPrice);
            setProductosVenta(updated);
        } else {
            setProductosVenta([
                ...productosVenta,
                {
                    id: prod.id,
                    nombre: prod.nombre,
                    precio: parseFloat(modalProdPrice),
                    cantidad: parseInt(modalProdCant),
                    requiere_retorno: prod.requiereRetorno || prod.requiere_retorno ? 1 : 0,
                    es_pack: prod.esPack || prod.es_pack ? 1 : 0,
                    categoria_id: prod.categoriaId || prod.categoria_id
                }
            ]);
        }

        setShowProductModal(false);
        setModalSelectedProdId('');
        setModalProdCant(1);
        setModalProdPrice(0.0);
    };

    const handleQuantityChange = (index, val) => {
        const updated = [...productosVenta];
        updated[index].cantidad = Math.max(1, parseInt(val) || 1);
        setProductosVenta(updated);
    };

    const handlePriceChange = (index, val) => {
        const updated = [...productosVenta];
        updated[index].precio = Math.max(0, parseFloat(val) || 0.0);
        setProductosVenta(updated);
    };

    const handleRemoveProduct = (index) => {
        const updated = productosVenta.filter((_, i) => i !== index);
        setProductosVenta(updated);
    };

    const executeSave = async (extraData = {}) => {
        setSaving(true);
        try {
            const selectedAddrObj = addresses.find(a => a.id === selectedAddressId);
            const finalMonto = extraData.monto !== undefined ? parseFloat(extraData.monto) : parseFloat(totalVal);
            const finalMetodo = extraData.metodo || metodoPago;
            const finalEntregados = extraData.entregados !== undefined ? parseInt(extraData.entregados) : parseInt(suggestions.entregados);
            const finalRecogidos = extraData.devueltos !== undefined ? parseInt(extraData.devueltos) : parseInt(suggestions.devueltos);

            let noteField = "";
            if (extraData.recibio) {
                noteField = `RECIBIÓ: ${extraData.recibio}`;
            }

            const body = {
                contacto_id: selectedClient.id,
                estado: estadoValidacion,
                metodo_pago: finalMetodo,
                estado_pago: estadoValidacion === 'completada' ? 'pagado' : 'pendiente',
                subtotal: parseFloat(subtotalVal),
                igv: parseFloat(igvVal),
                total: finalMonto,
                monto_pagado: estadoValidacion === 'completada' ? finalMonto : 0.0,
                bidones_entregados: finalEntregados,
                bidones_recogidos: finalRecogidos,
                notas: noteField,
                direccion_entrega: selectedAddrObj ? selectedAddrObj.direccion : 'Sin dirección',
                fecha_venta: fechaVenta,
                items: productosVenta.map(item => ({
                    producto_id: item.id,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio
                }))
            };

            const res = await fetch(`${API_BASE}/api/sales/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Venta Registrada',
                    text: 'La venta ha sido guardada correctamente y se ha reflejado en stock.',
                    timer: 1500,
                    showConfirmButton: false
                });
                router.push('/ventas/view');
            } else {
                const err = await res.json();
                Swal.fire('Error', err.message || 'No se pudo guardar la venta.', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Error de red al guardar la venta.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = () => {
        if (!selectedClient) {
            Swal.fire('Error', 'Debe seleccionar un cliente.', 'error');
            return;
        }
        if (selectedAddressId === null) {
            Swal.fire('Error', 'Debe elegir una dirección de entrega.', 'error');
            return;
        }
        if (productosVenta.length === 0) {
            Swal.fire('Error', 'Debe agregar productos a la venta.', 'error');
            return;
        }

        if (estadoValidacion === 'completada') {
            const productsDetail = productosVenta.map(p => `<div class="mb-1"><b>${p.cantidad}x</b> ${p.nombre}</div>`).join('');
            const currentDebt = selectedClient.bidones_prestados || 0;

            Swal.fire({
                title: 'Confirmar Entrega y Cobro',
                html: `
                    <div class="text-start">
                        <div class="alert alert-info p-2 mb-3 d-flex align-items-center" style="font-size: 11px; background-color: #f0fdfa; border: 1px solid #14b8a6; color: #0d9488;">
                            <span class="me-2">🔄</span>
                            <div>Saldo actual del cliente: <b>${currentDebt} bidones prestados</b></div>
                        </div>

                        <div class="bg-light p-2 mb-3 rounded border" style="background-color: #f8fafc;">
                            <label class="small fw-bold text-muted mb-1" style="font-size: 9px; text-transform: uppercase;">Detalle del Pedido:</label>
                            <div class="small text-dark">${productsDetail}</div>
                        </div>

                        ${suggestions.vendidos > 0 ? `
                        <div class="alert p-2 mb-3 d-flex align-items-center" style="font-size: 11px; background-color: #f0fdf4; border: 1px solid #22c55e; color: #16a34a;">
                            <span class="me-2">✓</span>
                            <div><b>INFO:</b> Se están vendiendo <b>${suggestions.vendidos} envases</b>. No se sumarán como deuda de préstamo.</div>
                        </div>` : ''}

                        <div class="mb-3">
                            <label class="small fw-bold text-dark mb-1">¿Quién recibe la mercadería?</label>
                            <input id="swal-recibio" class="form-control form-control-sm shadow-none" placeholder="Nombre de la persona...">
                        </div>

                        <div class="row g-2 mb-3 border-bottom pb-3">
                            <div class="col-6">
                                <label class="small fw-bold text-primary mb-1">Envases Entregados:</label>
                                <input id="swal-entregados" type="number" class="form-control form-control-sm" value="${suggestions.entregados}">
                            </div>
                            <div class="col-6">
                                <label class="small fw-bold text-success mb-1">Envases Devueltos:</label>
                                <input id="swal-devueltos" type="number" class="form-control form-control-sm" value="${suggestions.devueltos}">
                            </div>
                        </div>

                        <div class="row g-2">
                            <div class="col-6">
                                <label class="small fw-bold text-dark mb-1">Monto Final (S/):</label>
                                <input id="swal-monto" type="number" step="0.01" class="form-control form-control-sm" value="${totalVal}">
                            </div>
                            <div class="col-6">
                                <label class="small fw-bold text-dark mb-1">Medio de Pago:</label>
                                <select id="swal-metodo" class="form-select form-select-sm">
                                    <option value="Efectivo" ${metodoPago === 'Efectivo' ? 'selected' : ''}>Efectivo</option>
                                    <option value="Yape" ${metodoPago === 'Yape' ? 'selected' : ''}>Yape</option>
                                    <option value="Plin" ${metodoPago === 'Plin' ? 'selected' : ''}>Plin</option>
                                    <option value="Transferencia" ${metodoPago === 'Transferencia' ? 'selected' : ''}>Transferencia</option>
                                </select>
                            </div>
                        </div>
                    </div>`,
                showCancelButton: true, 
                confirmButtonText: 'Confirmar y Cerrar Venta',
                cancelButtonText: 'Cancelar',
                preConfirm: () => {
                    return {
                        recibio: document.getElementById('swal-recibio').value,
                        entregados: parseInt(document.getElementById('swal-entregados').value) || 0,
                        devueltos: parseInt(document.getElementById('swal-devueltos').value) || 0,
                        monto: parseFloat(document.getElementById('swal-monto').value) || totalVal,
                        metodo: document.getElementById('swal-metodo').value
                    }
                }
            }).then((r) => { 
                if (r.isConfirmed) {
                    executeSave(r.value);
                } 
            });
        } else {
            executeSave();
        }
    };

    return (
        <div className="hk-pg-body">
            <div className="container-fluid px-4 py-4">
                {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-4">
                <h4 className="text-primary fw-bold mb-0">Registro de Nueva Venta</h4>
                <Button variant="outline-secondary" size="sm" className="fw-bold px-3" onClick={() => router.push('/ventas/view')}>
                    VOLVER
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                </div>
            ) : (
                <Row className="g-4">
                    {/* Column 1: Información del Cliente */}
                    <Col lg={4}>
                        <Card className="shadow-sm border-0 h-100 rounded-3 bg-white">
                            <Card.Body className="p-4">
                                <div className="fw-extrabold text-uppercase text-muted border-bottom pb-2 mb-3" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>
                                    1. Información del Cliente
                                </div>

                                <div className="mb-4">
                                    <Form.Label className="fw-bold small text-muted text-uppercase" style={{ fontSize: '10px' }}>SELECCIONAR CLIENTE</Form.Label>
                                    {selectedClient ? (
                                        <div className="d-flex align-items-center justify-content-between p-2 border rounded-3 bg-light">
                                            <span className="small fw-bold text-dark">{selectedClient.text}</span>
                                            <Button variant="link" size="sm" className="text-danger p-0 text-decoration-none shadow-none border-0" onClick={() => {
                                                setSelectedClient(null);
                                                setAddresses([]);
                                                setSelectedAddressId(null);
                                            }}>
                                                Cambiar
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <Form.Control
                                                className="shadow-none border-light-soft bg-light-soft"
                                                placeholder="Buscar cliente..."
                                                value={clientSearch}
                                                onChange={(e) => setClientSearch(e.target.value)}
                                            />
                                            {clientResults.length > 0 && (
                                                <ListGroup className="position-absolute w-100 shadow-lg border-0" style={{ zIndex: 10 }}>
                                                    {clientResults.map(client => (
                                                        <ListGroup.Item
                                                            key={client.id}
                                                            action
                                                            className="small"
                                                            onClick={() => handleSelectClient(client)}
                                                        >
                                                            {client.text}
                                                        </ListGroup.Item>
                                                    ))}
                                                </ListGroup>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="mt-4">
                                    <Form.Label className="fw-bold small text-muted text-uppercase mb-2" style={{ fontSize: '10px' }}>DIRECCIÓN DE FACTURACIÓN / ENTREGA</Form.Label>
                                    <div className="overflow-auto" style={{ maxHeight: '300px' }}>
                                        {addresses.map(addr => {
                                            const isActive = selectedAddressId === addr.id;
                                            return (
                                                <div
                                                    key={addr.id}
                                                    onClick={() => setSelectedAddressId(addr.id)}
                                                    className={`p-3 border rounded-3 mb-2 cursor-pointer transition-all ${
                                                        isActive ? 'border-primary bg-primary-soft shadow-sm border-2' : 'border-light bg-light-soft hover-bg'
                                                    }`}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <div>
                                                            <strong className="small d-block mb-1">{addr.referencia || 'Dirección'}</strong>
                                                            <span className="text-muted small" style={{ fontSize: '10.5px' }}>{addr.direccion}</span>
                                                        </div>
                                                        {isActive && <CheckCircle size={16} className="text-primary" />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {addresses.length === 0 && (
                                            <div className="text-center py-5 text-muted small border rounded bg-light">
                                                Selecciona un cliente para cargar direcciones
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Column 2: Detalle de Productos */}
                    <Col lg={4}>
                        <Card className="shadow-sm border-0 h-100 rounded-3 bg-white d-flex flex-column">
                            <Card.Body className="p-4 d-flex flex-column h-100">
                                <div className="fw-extrabold text-uppercase text-muted border-bottom pb-2 mb-3 d-flex align-items-center justify-content-between" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>
                                    <span>2. Detalle de Productos</span>
                                    <Button variant="soft-primary" size="sm" className="p-1 px-2 fw-bold" onClick={() => setShowProductModal(true)}>
                                        <Plus size={16} />
                                    </Button>
                                </div>

                                <div className="flex-grow-1 overflow-auto mb-3" style={{ maxHeight: '400px' }}>
                                    <Table hover responsive size="sm" className="align-middle">
                                        <thead className="table-light text-muted" style={{ fontSize: '9px' }}>
                                            <tr>
                                                <th>PRODUCTO</th>
                                                <th className="text-center">CANT.</th>
                                                <th className="text-center">PRECIO</th>
                                                <th className="text-end">SUB.</th>
                                                <th className="text-center" style={{ width: '30px' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody style={{ fontSize: '12px' }}>
                                            {productosVenta.map((item, index) => (
                                                <tr key={item.id}>
                                                    <td className="fw-bold">{item.nombre}</td>
                                                    <td className="text-center">
                                                        <Form.Control
                                                            type="number"
                                                            size="sm"
                                                            value={item.cantidad}
                                                            className="text-center p-1"
                                                            style={{ width: '45px', margin: '0 auto' }}
                                                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="text-center">
                                                        <Form.Control
                                                            type="number"
                                                            size="sm"
                                                            step="0.01"
                                                            value={item.precio}
                                                            className="text-center p-1"
                                                            style={{ width: '60px', margin: '0 auto' }}
                                                            onChange={(e) => handlePriceChange(index, e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="text-end fw-bold">S/ {(item.precio * item.cantidad).toFixed(2)}</td>
                                                    <td className="text-center">
                                                        <Button variant="link" className="p-0 text-danger border-0 shadow-none" onClick={() => handleRemoveProduct(index)}>
                                                            <Trash size={14} />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                    {productosVenta.length === 0 && (
                                        <div id="empty-state" className="text-center py-5 text-muted small">No hay productos en la venta</div>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Column 3: Resumen y Confirmación */}
                    <Col lg={4}>
                        <Card className="shadow-sm border-0 h-100 rounded-3 bg-white d-flex flex-column">
                            <Card.Body className="p-4 d-flex flex-column h-100">
                                <div className="fw-extrabold text-uppercase text-muted border-bottom pb-2 mb-3" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>
                                    3. Resumen y Confirmación
                                </div>

                                <div className="bg-light p-3 rounded mb-4 mt-2">
                                    <div className="d-flex justify-content-between mb-1 small text-muted">
                                        <span>Subtotal</span>
                                        <span>S/ {subtotalVal.toFixed(2)}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-1 small text-muted">
                                        <span>IGV ({(IGV_RATE * 100).toFixed(0)}%)</span>
                                        <span>S/ {igvVal.toFixed(2)}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mt-2 pt-2 border-top">
                                        <span className="fw-bold">TOTAL VENTA</span>
                                        <span className="fw-bold text-primary fs-5">S/ {totalVal.toFixed(2)}</span>
                                    </div>
                                </div>

                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold small text-muted text-uppercase" style={{ fontSize: '10px' }}>FECHA DE VENTA</Form.Label>
                                    <Form.Control
                                        type="date"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={fechaVenta}
                                        onChange={(e) => setFechaVenta(e.target.value)}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold small text-muted text-uppercase" style={{ fontSize: '10px' }}>MÉTODO DE PAGO</Form.Label>
                                    <Form.Select 
                                        className="shadow-none border-light-soft bg-light-soft" 
                                        value={metodoPago} 
                                        onChange={(e) => setMetodoPago(e.target.value)}
                                    >
                                        <option value="Efectivo">Efectivo</option>
                                        <option value="Yape">Yape</option>
                                        <option value="Plin">Plin</option>
                                        <option value="Transferencia">Transferencia</option>
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold small text-muted text-uppercase" style={{ fontSize: '10px' }}>ESTADO DE VALIDACIÓN</Form.Label>
                                    <Form.Select 
                                        className="shadow-none border-light-soft bg-light-soft" 
                                        value={estadoValidacion} 
                                        onChange={(e) => setEstadoValidacion(e.target.value)}
                                    >
                                        <option value="completada">Completada (Entregado)</option>
                                        <option value="pendiente">Pendiente (Por entregar)</option>
                                    </Form.Select>
                                </Form.Group>

                                <Button
                                    variant="primary"
                                    className="w-100 py-2.5 fw-bold mt-auto"
                                    onClick={handleSubmit}
                                    disabled={saving}
                                >
                                    {saving ? 'PROCESANDO...' : 'REGISTRAR VENTA'}
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Add Product Modal */}
            <Modal show={showProductModal} onHide={() => setShowProductModal(false)} centered>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold">Añadir Producto</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold small">Seleccionar Producto</Form.Label>
                        <Form.Select
                            value={modalSelectedProdId}
                            onChange={(e) => setModalSelectedProdId(e.target.value)}
                        >
                            <option value="">-- Seleccionar --</option>
                            {productList.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre} (S/ {parseFloat(p.precioVenta || p.precio_venta || 0).toFixed(2)})</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                    <Row className="g-2">
                        <Col xs={6}>
                            <Form.Group>
                                <Form.Label className="fw-bold small">Cantidad</Form.Label>
                                <Form.Control
                                    type="number"
                                    min="1"
                                    value={modalProdCant}
                                    onChange={(e) => setModalProdCant(Math.max(1, parseInt(e.target.value) || 1))}
                                />
                            </Form.Group>
                        </Col>
                        <Col xs={6}>
                            <Form.Group>
                                <Form.Label className="fw-bold small">P. Unitario (S/)</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    value={modalProdPrice}
                                    onChange={(e) => setModalProdPrice(parseFloat(e.target.value) || 0.0)}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="link" className="text-muted text-decoration-none" onClick={() => setShowProductModal(false)}>
                        Cancelar
                    </Button>
                    <Button variant="primary" className="px-4" onClick={handleAddProduct} disabled={!modalSelectedProdId}>
                        Agregar
                    </Button>
                </Modal.Footer>
            </Modal>
            </div>
        </div>
    );
}
