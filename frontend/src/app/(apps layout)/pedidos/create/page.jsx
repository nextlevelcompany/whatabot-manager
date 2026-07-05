"use client";
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Table, Modal, Spinner, InputGroup, ListGroup } from 'react-bootstrap';
import { User, Truck, Package, ArrowLeft, Plus, Trash, CheckCircle } from 'react-feather';
import { useRouter, useSearchParams } from 'next/navigation';
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
const IGV_RATE = 0.18;

export default function PedidosCreatePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit_id');

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Master lists from server
    const [zonas, setZonas] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [productList, setProductList] = useState([]);

    // Client search state
    const [clientSearch, setClientSearch] = useState('');
    const [clientResults, setClientResults] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);

    // Sede / Contact Persons
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [contactsPerson, setContactsPerson] = useState([]);
    const [selectedContactPersonId, setSelectedContactPersonId] = useState('');

    const getLocalDateString = (d = new Date()) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    // Order form fields
    const [fechaEntrega, setFechaEntrega] = useState(getLocalDateString());
    const [horaEntrega, setHoraEntrega] = useState('');
    const [prioridad, setPrioridad] = useState('Media');
    const [choferId, setChoferId] = useState('');
    const [zona, setZona] = useState('');
    const [tipoEnvio, setTipoEnvio] = useState('Despacho');
    const [notas, setNotas] = useState('');

    // Products table
    const [productosVenta, setProductosVenta] = useState([]);
    const [metodoPago, setMetodoPago] = useState('efectivo');
    const [estadoPago, setEstadoPago] = useState('Pendiente');

    // Modal state
    const [showProductModal, setShowProductModal] = useState(false);
    const [modalSelectedProdId, setModalSelectedProdId] = useState('');
    const [modalProdCant, setModalProdCant] = useState(1);

    // Initial Master List Fetch
    useEffect(() => {
        const fetchMasters = async () => {
            try {
                // Get products list
                const prodRes = await fetch(`${API_BASE}/api/productos`);
                if (prodRes.ok) {
                    const prods = await prodRes.json();
                    setProductList(prods.filter(p => p.activo !== false));
                }

                // Get logistics data
                const logRes = await fetch(`${API_BASE}/api/pedidos/logistics-data`);
                if (logRes.ok) {
                    const data = await logRes.json();
                    setZonas(data.zonas || []);
                    setDrivers(data.drivers || []);
                }
            } catch (err) {
                console.error("Error fetching master lists", err);
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

    // Load Order if in edit mode
    useEffect(() => {
        if (!editId) return;

        const loadOrder = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE}/api/pedidos/${editId}`);
                if (res.ok) {
                    const order = await res.json();
                    
                    // Client details
                    setSelectedClient({
                        id: order.contacto_id,
                        text: `${order.contacto_nombre || ''} ${order.contacto_apellido || ''} (Doc: ${order.numero_documento || 'S.D.'})`
                    });
                    setClientSearch('');

                    // Load client locations & contact persons
                    await loadClientDetails(order.contacto_id, order.direccion_entrega);

                    // Form fields
                    setFechaEntrega(order.fecha_entrega || '');
                    setHoraEntrega(order.hora_entrega || '');
                    setPrioridad(order.prioridad || 'Media');
                    setChoferId(order.chofer_id ? String(order.chofer_id) : '');
                    setZona(order.zona ? String(order.zona) : '');
                    setTipoEnvio(order.tipo_envio || 'Despacho');
                    setNotas(order.notas || '');

                    // Products & payment
                    setMetodoPago(order.metodo_pago || 'efectivo');
                    setEstadoPago(order.estado_pago || 'Pendiente');

                    if (order.items) {
                        setProductosVenta(order.items.map(item => ({
                            id: item.producto_id,
                            nombre: item.nombre,
                            precio: parseFloat(item.precio_unitario || 0),
                            cantidad: parseInt(item.cantidad || 1)
                        })));
                    }
                }
            } catch (e) {
                console.error("Error loading order", e);
                Swal.fire('Error', 'No se pudo cargar el pedido logístico.', 'error');
            } finally {
                setLoading(false);
            }
        };

        loadOrder();
    }, [editId]);

    const loadClientDetails = async (clientId, selectAddressText = null) => {
        try {
            const res = await fetch(`${API_BASE}/api/pedidos/contact-details/${clientId}`);
            if (res.ok) {
                const data = await res.json();
                setAddresses(data.addresses || []);
                setContactsPerson(data.contacts_person || []);

                // Select address
                if (data.addresses && data.addresses.length > 0) {
                    if (selectAddressText) {
                        const found = data.addresses.find(a => a.direccion === selectAddressText);
                        if (found) {
                            setSelectedAddressId(found.id);
                        } else {
                            setSelectedAddressId(data.addresses[0].id);
                        }
                    } else {
                        setSelectedAddressId(data.addresses[0].id);
                    }
                }
            }
        } catch (e) {
            console.error("Error loading client addresses", e);
        }
    };

    const handleSelectClient = async (client) => {
        setSelectedClient(client);
        setClientSearch('');
        setClientResults([]);
        await loadClientDetails(client.id);
    };

    // Table Totals calculation
    const subtotalVal = productosVenta.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const igvVal = subtotalVal * IGV_RATE;
    const totalVal = subtotalVal + igvVal;

    const handleAddProduct = () => {
        const prod = productList.find(p => String(p.id) === String(modalSelectedProdId));
        if (!prod) return;

        const exists = productosVenta.findIndex(p => p.id === prod.id);
        if (exists !== -1) {
            const updated = [...productosVenta];
            updated[exists].cantidad += parseInt(modalProdCant);
            setProductosVenta(updated);
        } else {
            setProductosVenta([
                ...productosVenta,
                {
                    id: prod.id,
                    nombre: prod.nombre,
                    precio: parseFloat(prod.precioVenta || 0),
                    cantidad: parseInt(modalProdCant)
                }
            ]);
        }

        setShowProductModal(false);
        setModalSelectedProdId('');
        setModalProdCant(1);
    };

    const handleQuantityChange = (index, val) => {
        const updated = [...productosVenta];
        updated[index].cantidad = Math.max(1, parseInt(val) || 1);
        setProductosVenta(updated);
    };

    const handlePriceChange = (index, val) => {
        const updated = [...productosVenta];
        updated[index].precio = Math.max(0, parseFloat(val) || 0);
        setProductosVenta(updated);
    };

    const handleRemoveProduct = (index) => {
        const updated = productosVenta.filter((_, i) => i !== index);
        setProductosVenta(updated);
    };

    const handleSubmit = async () => {
        if (!selectedClient) {
            Swal.fire('Faltan Datos', 'Por favor, seleccione un cliente.', 'warning');
            return;
        }
        if (selectedAddressId === null || selectedAddressId === undefined) {
            Swal.fire('Faltan Datos', 'Por favor, elija una dirección de entrega.', 'warning');
            return;
        }
        if (productosVenta.length === 0) {
            Swal.fire('Faltan Datos', 'Por favor, agregue al menos un producto al pedido.', 'warning');
            return;
        }
        if (!fechaEntrega) {
            Swal.fire('Faltan Datos', 'Por favor, indique la fecha de entrega.', 'warning');
            return;
        }

        const selectedAddrObj = addresses.find(a => a.id === selectedAddressId);
        if (!selectedAddrObj) return;

        // Get contact person name
        let contactPersonName = "";
        if (selectedContactPersonId) {
            const cp = contactsPerson.find(c => String(c.id) === String(selectedContactPersonId));
            if (cp) contactPersonName = cp.nombre;
        }

        const payload = {
            pedido_id: editId ? parseInt(editId) : null,
            contacto_id: selectedClient.id,
            contacto_persona_nombre: contactPersonName,
            metodoPago,
            estado_pago: estadoPago,
            subtotal: subtotalVal,
            igv: igvVal,
            total: totalVal,
            direccion_entrega: selectedAddrObj.direccion,
            latitud: selectedAddrObj.latitud,
            longitud: selectedAddrObj.longitud,
            notas,
            fecha_entrega: fechaEntrega,
            hora_entrega: horaEntrega,
            chofer_id: choferId || null,
            prioridad,
            zona: zona || null,
            tipo_envio: tipoEnvio,
            productos: productosVenta
        };

        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/pedidos/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Listo!',
                    text: editId ? 'Cambios guardados con éxito.' : 'Pedido registrado con éxito.',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    router.push('/pedidos/view');
                });
            } else {
                const err = await res.json();
                Swal.fire('Error', err.message || 'Error al guardar el pedido.', 'error');
            }
        } catch (err) {
            Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-4" style={{ background: '#f8fafc', minHeight: '100vh' }}>
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-4">
                <h4 className="text-primary fw-bold mb-0">
                    {editId ? 'Editar Pedido Logístico' : 'Registro de Nuevo Pedido'}
                </h4>
                <Button variant="outline-secondary" size="sm" className="fw-bold" onClick={() => router.push('/pedidos/view')}>
                    <ArrowLeft size={16} className="me-1" /> VOLVER
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                </div>
            ) : (
                <Row className="g-4">
                    {/* Column 1: Client details */}
                    <Col lg={4}>
                        <Card className="shadow-sm border-0 h-100 rounded-3 bg-white">
                            <Card.Body className="p-4">
                                <div className="fw-extrabold text-uppercase text-muted border-bottom pb-2 mb-3 d-flex align-items-center" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>
                                    <User size={16} className="me-2 text-primary" />
                                    1. Información del Cliente
                                </div>

                                <div className="mb-3 position-relative">
                                    <Form.Label className="fw-bold small">Buscar Cliente / Empresa</Form.Label>
                                    {selectedClient ? (
                                        <div className="d-flex align-items-center justify-content-between p-2 border rounded-3 bg-light">
                                            <span className="small fw-bold text-dark">{selectedClient.text}</span>
                                            <Button variant="link" size="sm" className="text-danger p-0 text-decoration-none" onClick={() => {
                                                setSelectedClient(null);
                                                setAddresses([]);
                                                setContactsPerson([]);
                                                setSelectedAddressId(null);
                                                setSelectedContactPersonId('');
                                            }}>
                                                Cambiar
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <Form.Control
                                                className="shadow-none"
                                                placeholder="Escribe nombres, DNI o RUC..."
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

                                {contactsPerson.length > 0 && (
                                    <div className="mb-3">
                                        <Form.Label className="fw-bold small text-primary">Persona de Contacto (Empresa)</Form.Label>
                                        <Form.Select
                                            className="shadow-none"
                                            value={selectedContactPersonId}
                                            onChange={(e) => setSelectedContactPersonId(e.target.value)}
                                        >
                                            <option value="">-- Seleccionar Persona --</option>
                                            {contactsPerson.map(cp => (
                                                <option key={cp.id} value={cp.id}>{cp.nombre}</option>
                                            ))}
                                        </Form.Select>
                                    </div>
                                )}

                                <div className="mt-4">
                                    <Form.Label className="fw-bold small text-muted text-uppercase mb-2">Dirección de Entrega</Form.Label>
                                    <div className="overflow-auto" style={{ maxHeight: '300px' }}>
                                        {addresses.map(addr => {
                                            const isActive = selectedAddressId === addr.id;
                                            const hasGps = addr.latitud && addr.longitud;
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
                                                            <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                                                                <strong className="small">{addr.referencia || 'Principal'}</strong>
                                                                {hasGps ? (
                                                                    <span className="badge bg-success-soft text-success border border-success-soft" style={{ fontSize: '9px', padding: '2px 6px' }}>
                                                                        📍 Con GPS
                                                                    </span>
                                                                ) : (
                                                                    <span className="badge bg-danger-soft text-danger border border-danger-soft" style={{ fontSize: '9px', padding: '2px 6px' }}>
                                                                        ⚠️ Sin GPS (No se verá en el mapa)
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-muted small" style={{ fontSize: '10.5px' }}>{addr.direccion}</span>
                                                        </div>
                                                        {isActive && <CheckCircle size={16} className="text-primary" />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {addresses.length === 0 && (
                                            <div className="text-center py-5 text-muted small border rounded bg-light">
                                                Seleccione un cliente para cargar direcciones.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Column 2: Logistics details */}
                    <Col lg={4}>
                        <Card className="shadow-sm border-0 h-100 rounded-3 bg-white">
                            <Card.Body className="p-4">
                                <div className="fw-extrabold text-uppercase text-muted border-bottom pb-2 mb-3 d-flex align-items-center" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>
                                    <Truck size={16} className="me-2 text-primary" />
                                    2. Detalles de Logística
                                </div>

                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold small">Fecha de Entrega</Form.Label>
                                    <Form.Control
                                        type="date"
                                        className="fw-bold text-primary shadow-none"
                                        value={fechaEntrega}
                                        onChange={(e) => setFechaEntrega(e.target.value)}
                                        min={new Date().toISOString().slice(0, 10)}
                                    />
                                </Form.Group>

                                <Row className="g-2 mb-3">
                                    <Col xs={6}>
                                        <Form.Group>
                                            <Form.Label className="fw-bold small">Hora Estimada</Form.Label>
                                            <Form.Control
                                                type="time"
                                                className="shadow-none"
                                                value={horaEntrega}
                                                onChange={(e) => setHoraEntrega(e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col xs={6}>
                                        <Form.Group>
                                            <Form.Label className="fw-bold small">Prioridad</Form.Label>
                                            <Form.Select className="shadow-none" value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
                                                <option value="Baja">Baja</option>
                                                <option value="Media">Media</option>
                                                <option value="Alta">Alta</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold small">Conductor Asignado</Form.Label>
                                    <Form.Select className="shadow-none" value={choferId} onChange={(e) => setChoferId(e.target.value)}>
                                        <option value="">-- Sin asignar --</option>
                                        {drivers.map(d => (
                                            <option key={d.id} value={d.id}>[{d.vehiculo_placa}] {d.nombre} {d.apellido}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>

                                <Row className="g-2 mb-3">
                                    <Col xs={6}>
                                        <Form.Group>
                                            <Form.Label className="fw-bold small">Zona</Form.Label>
                                            <Form.Select className="shadow-none" value={zona} onChange={(e) => setZona(e.target.value)}>
                                                <option value="">Seleccione...</option>
                                                {zonas.map(z => (
                                                    <option key={z.id} value={z.id}>{z.nombre}</option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col xs={6}>
                                        <Form.Group>
                                            <Form.Label className="fw-bold small">Tipo de Envío</Form.Label>
                                            <Form.Select className="shadow-none" value={tipoEnvio} onChange={(e) => setTipoEnvio(e.target.value)}>
                                                <option value="Despacho">Despacho</option>
                                                <option value="Recojo">Recojo</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group>
                                    <Form.Label className="fw-bold small">Notas / Observaciones</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={4}
                                        className="shadow-none"
                                        placeholder="Indicaciones especiales para el conductor..."
                                        value={notas}
                                        onChange={(e) => setNotas(e.target.value)}
                                    />
                                </Form.Group>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Column 3: Products & payment */}
                    <Col lg={4}>
                        <Card className="shadow-sm border-0 h-100 rounded-3 bg-white d-flex flex-column">
                            <Card.Body className="p-4 d-flex flex-column h-100">
                                <div className="fw-extrabold text-uppercase text-muted border-bottom pb-2 mb-3 d-flex align-items-center justify-content-between" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>
                                    <span className="d-flex align-items-center">
                                        <Package size={16} className="me-2 text-primary" />
                                        3. Detalle y Pago
                                    </span>
                                    <Button variant="outline-primary" size="sm" className="p-1 px-2 border-0 shadow-none fw-bold" onClick={() => setShowProductModal(true)}>
                                        <Plus size={16} />
                                    </Button>
                                </div>

                                <div className="flex-grow-1 overflow-auto mb-3" style={{ maxHeight: '250px' }}>
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
                                                        <Button variant="link" className="p-0 text-danger" onClick={() => handleRemoveProduct(index)}>
                                                            <Trash size={14} />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                    {productosVenta.length === 0 && (
                                        <div className="text-center py-4 text-muted small">Sin productos agregados.</div>
                                    )}
                                </div>

                                <div className="bg-light p-3 rounded mb-4">
                                    <div className="d-flex justify-content-between mb-1 small text-muted">
                                        <span>Subtotal</span>
                                        <span>S/ {subtotalVal.toFixed(2)}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-1 small text-muted">
                                        <span>IGV ({(IGV_RATE * 100).toFixed(0)}%)</span>
                                        <span>S/ {igvVal.toFixed(2)}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mt-2 pt-2 border-top">
                                        <span className="fw-bold">TOTAL</span>
                                        <span className="fw-bold text-primary fs-5">S/ {totalVal.toFixed(2)}</span>
                                    </div>
                                </div>

                                <Row className="g-2 mb-4">
                                    <Col xs={6}>
                                        <Form.Group>
                                            <Form.Label className="fw-bold small text-muted" style={{ fontSize: '10px' }}>Método Pago</Form.Label>
                                            <Form.Select className="shadow-none" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                                                <option value="efectivo">Efectivo</option>
                                                <option value="yape">Yape</option>
                                                <option value="plin">Plin</option>
                                                <option value="transferencia">Transferencia</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col xs={6}>
                                        <Form.Group>
                                            <Form.Label className="fw-bold small text-muted" style={{ fontSize: '10px' }}>Estado Pago</Form.Label>
                                            <Form.Select className="shadow-none" value={estadoPago} onChange={(e) => setEstadoPago(e.target.value)}>
                                                <option value="Pendiente">Pendiente</option>
                                                <option value="Pagado">Pagado</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Button
                                    variant="primary"
                                    className="w-100 py-2.5 fw-bold mt-auto"
                                    onClick={handleSubmit}
                                    disabled={saving}
                                >
                                    {saving ? 'PROCESANDO...' : editId ? 'GUARDAR CAMBIOS' : 'REGISTRAR PEDIDO'}
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
                                <option key={p.id} value={p.id}>{p.nombre} (S/ {parseFloat(p.precioVenta || 0).toFixed(2)})</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label className="fw-bold small">Cantidad</Form.Label>
                        <Form.Control
                            type="number"
                            min="1"
                            value={modalProdCant}
                            onChange={(e) => setModalProdCant(Math.max(1, parseInt(e.target.value) || 1))}
                        />
                    </Form.Group>
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
    );
}
