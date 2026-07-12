"use client"
import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Spinner, Card, Table, Badge, Modal } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import { Save, ArrowLeft, Star, DollarSign, Check, Plus, Trash2 } from 'react-feather';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import Link from 'next/link';

const getApiBase = () => {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
        return `${window.location.protocol}//${hostname}:8081`;
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8081';
};
const API_BASE = getApiBase();

export default function CreateOpportunityPage() {
    const router = useRouter();
    const [columns, setColumns] = useState([]);
    const [tags, setTags] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [productList, setProductList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [form, setForm] = useState({
        titulo: '',
        contacto_id: '',
        etapa_id: '',
        valor: 0.0,
        prioridad: 'Media',
        etiquetas: '',
        notas: ''
    });

    // Addresses states
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);

    // Products states
    const [productosOportunidad, setProductosOportunidad] = useState([]);
    const [showProdModal, setShowProdModal] = useState(false);
    const [modalSelectedProdId, setModalSelectedProdId] = useState('');
    const [modalProdCant, setModalProdCant] = useState(1);

    // Calculate subtotal
    const subtotalOportunidad = productosOportunidad.reduce((sum, p) => sum + (parseFloat(p.precio) * p.cantidad), 0.0);

    useEffect(() => {
        const loadAllMetadata = async () => {
            try {
                // Fetch columns, tags, contacts
                const res = await fetch(`${API_BASE}/api/opportunities/kanban`);
                if (res.ok) {
                    const data = await res.json();
                    setColumns(data.columns || []);
                    setTags(data.tags || []);
                    setContacts(data.contacts || []);
                    if (data.columns && data.columns.length > 0) {
                        setForm(f => ({ ...f, etapa_id: data.columns[0].id }));
                    }
                }

                // Fetch product catalog
                const prodRes = await fetch(`${API_BASE}/api/productos`);
                if (prodRes.ok) {
                    const prods = await prodRes.json();
                    setProductList(prods.filter(p => p.activo !== false));
                }
            } catch (e) {
                console.error("Error loading metadata", e);
            } finally {
                setLoading(false);
            }
        };
        loadAllMetadata();
    }, []);

    const handleContactChange = async (contactId) => {
        setForm(prev => ({ ...prev, contacto_id: contactId }));
        if (contactId) {
            try {
                const res = await fetch(`${API_BASE}/api/pedidos/contact-details/${contactId}`);
                if (res.ok) {
                    const data = await res.json();
                    setAddresses(data.addresses || []);
                    if (data.addresses && data.addresses.length > 0) {
                        setSelectedAddressId(data.addresses[0].id);
                    }
                }
            } catch (e) {
                console.error("Error loading contact addresses", e);
            }
        } else {
            setAddresses([]);
            setSelectedAddressId(null);
        }
    };

    const handleToggleTag = (tagName) => {
        const currentSelected = form.etiquetas ? form.etiquetas.split(',').map(t => t.trim()).filter(Boolean) : [];
        let updated;
        if (currentSelected.includes(tagName)) {
            updated = currentSelected.filter(t => t !== tagName);
        } else {
            updated = [...currentSelected, tagName];
        }
        setForm({ ...form, etiquetas: updated.join(', ') });
    };

    // Product handlers
    const handleAddProductToOpp = () => {
        const prod = productList.find(p => String(p.id) === String(modalSelectedProdId));
        if (!prod) return;

        const exists = productosOportunidad.findIndex(p => p.id === prod.id);
        if (exists !== -1) {
            const updated = [...productosOportunidad];
            updated[exists].cantidad += parseInt(modalProdCant);
            setProductosOportunidad(updated);
        } else {
            setProductosOportunidad([
                ...productosOportunidad,
                {
                    id: prod.id,
                    nombre: prod.nombre,
                    precio: parseFloat(prod.precioVenta || 0),
                    cantidad: parseInt(modalProdCant)
                }
            ]);
        }

        setShowProdModal(false);
        setModalSelectedProdId('');
        setModalProdCant(1);
    };

    const handleQuantityChangeInOpp = (index, val) => {
        const updated = [...productosOportunidad];
        updated[index].cantidad = Math.max(1, parseInt(val) || 1);
        setProductosOportunidad(updated);
    };

    const handlePriceChangeInOpp = (index, val) => {
        const updated = [...productosOportunidad];
        updated[index].precio = Math.max(0, parseFloat(val) || 0);
        setProductosOportunidad(updated);
    };

    const handleRemoveProductFromOpp = (index) => {
        const updated = productosOportunidad.filter((_, i) => i !== index);
        setProductosOportunidad(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const body = {
                ...form,
                contacto_id: form.contacto_id ? parseInt(form.contacto_id) : null,
                etapa_id: parseInt(form.etapa_id),
                valor: subtotalOportunidad,
                productos_json: JSON.stringify(productosOportunidad)
            };

            const res = await fetch(`${API_BASE}/api/opportunities/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Oportunidad Creada',
                    text: 'Se ha agregado al embudo de ventas con éxito.',
                    timer: 1500,
                    showConfirmButton: false
                });
                router.push('/opportunities/view');
            } else {
                const errData = await res.json().catch(() => ({}));
                console.error("Backend error response:", errData);
                const errMsg = errData.message || 'No se pudo guardar la oportunidad.';
                Swal.fire('Error', errMsg, 'error');
            }
        } catch (error) {
            console.error("Connection error:", error);
            Swal.fire('Error', 'Error de conexión: ' + error.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="contact-body">
            <SimpleBar className="nicescroll-bar" style={{ maxHeight: '100vh' }}>
                <div className="px-4 py-4">
                    {/* Header */}
                    <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom bg-white p-3 rounded shadow-sm border">
                        <div className="d-flex align-items-center gap-3">
                            <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover" onClick={() => router.push('/opportunities/view')}>
                                <ArrowLeft size={18} />
                            </Button>
                            <div>
                                <h4 className="fw-extrabold text-dark mb-0">Registrar Nueva Oportunidad</h4>
                                <p className="text-muted small mb-0">Complete la información de venta, cliente y detalles de reparto para el CRM.</p>
                            </div>
                        </div>
                        <div>
                            <Button variant="light" className="me-2" onClick={() => router.push('/opportunities/view')} disabled={saving}>
                                Cancelar
                            </Button>
                            <Button variant="primary" onClick={handleSubmit} disabled={saving}>
                                {saving ? <Spinner size="sm" className="me-1" /> : <Save size={14} className="me-1" />}
                                Guardar Oportunidad
                            </Button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" />
                            <p className="mt-2 text-muted">Cargando catálogo y metadatos...</p>
                        </div>
                    ) : (
                        <Form onSubmit={handleSubmit}>
                            <Card className="border-0 shadow-sm rounded-3 bg-white">
                                <Card.Body className="p-4">
                                    <Row className="g-4">
                                        {/* Columna 1: Información del Cliente */}
                                        <Col lg={4} className="border-end">
                                            <div className="fw-extrabold text-uppercase text-muted border-bottom pb-2 mb-3 d-flex align-items-center" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>
                                                <i className="bi bi-person-fill me-2 text-primary"></i>
                                                1. Información del Cliente
                                            </div>

                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-bold small text-muted">Título / Nombre Trato</Form.Label>
                                                <Form.Control 
                                                    type="text" 
                                                    placeholder="Ej: Suministro de agua bidón 20L empresa"
                                                    className="shadow-none border-light-soft bg-light-soft fw-bold text-dark" 
                                                    value={form.titulo} 
                                                    onChange={e => setForm({ ...form, titulo: e.target.value })} 
                                                    required 
                                                />
                                            </Form.Group>

                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-bold small text-muted">Contacto / Cliente Asignado</Form.Label>
                                                <Form.Select 
                                                    className="shadow-none border-light-soft bg-light-soft"
                                                    value={form.contacto_id}
                                                    onChange={e => handleContactChange(e.target.value)}
                                                >
                                                    <option value="">-- Vincular Contacto (Opcional) --</option>
                                                    {contacts.map(c => (
                                                        <option key={c.id} value={c.id}>{c.display_name} ({c.tipo_persona})</option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>

                                            <div className="mt-4">
                                                <Form.Label className="fw-bold small text-muted text-uppercase mb-2">Direcciones de Entrega</Form.Label>
                                                <div className="overflow-auto border rounded p-2" style={{ maxHeight: '250px', minHeight: '120px' }}>
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
                                                                    {isActive && <i className="bi bi-check-circle-fill text-primary"></i>}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {addresses.length === 0 && (
                                                        <div className="text-center py-4 text-muted small bg-light-soft rounded border border-dashed">
                                                            Seleccione un cliente para cargar direcciones.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Col>

                                        {/* Columna 2: Detalles del Trato (CRM) */}
                                        <Col lg={4} className="border-end">
                                            <div className="fw-extrabold text-uppercase text-muted border-bottom pb-2 mb-3 d-flex align-items-center" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>
                                                <i className="bi bi-funnel-fill me-2 text-primary"></i>
                                                2. Detalles del Trato (CRM)
                                            </div>

                                            <Row className="g-2 mb-3">
                                                <Col xs={6}>
                                                    <Form.Group>
                                                        <Form.Label className="fw-bold small text-muted">Prioridad</Form.Label>
                                                        <Form.Select 
                                                            className="shadow-none border-light-soft bg-light-soft"
                                                            value={form.prioridad}
                                                            onChange={e => setForm({ ...form, prioridad: e.target.value })}
                                                        >
                                                            <option value="Baja">Baja</option>
                                                            <option value="Media">Media</option>
                                                            <option value="Alta">Alta</option>
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>
                                                <Col xs={6}>
                                                    <Form.Group>
                                                        <Form.Label className="fw-bold small text-muted">Etapa del Embudo</Form.Label>
                                                        <Form.Select 
                                                            className="shadow-none border-light-soft bg-light-soft"
                                                            value={form.etapa_id}
                                                            onChange={e => setForm({ ...form, etapa_id: e.target.value })}
                                                            required
                                                        >
                                                            {columns.map(col => (
                                                                <option key={col.id} value={col.id}>{col.nombre}</option>
                                                            ))}
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>
                                            </Row>

                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-bold small text-muted">Notas / Comentarios comerciales</Form.Label>
                                                <Form.Control
                                                    as="textarea"
                                                    rows={3}
                                                    placeholder="Ingrese notas sobre la oportunidad comercial..."
                                                    className="shadow-none border-light-soft bg-light-soft"
                                                    value={form.notas || ''}
                                                    onChange={e => setForm({ ...form, notas: e.target.value })}
                                                />
                                            </Form.Group>

                                            <div className="mt-3">
                                                <Form.Label className="small fw-bold text-muted mb-2">Etiquetas del Trato</Form.Label>
                                                <div className="d-flex flex-wrap gap-1.5 p-2 border rounded bg-light-soft" style={{ minHeight: '80px' }}>
                                                    {tags.map(tag => {
                                                        const selected = form.etiquetas ? form.etiquetas.split(',').map(t => t.trim()).includes(tag.nombre) : false;
                                                        return (
                                                            <span 
                                                                key={tag.id}
                                                                className={`badge border text-dark preset-badge cursor-pointer px-2.5 py-1.5 d-flex align-items-center gap-1 ${selected ? 'bg-primary text-white border-primary' : 'bg-white'}`}
                                                                onClick={() => handleToggleTag(tag.nombre)}
                                                                style={{ cursor: 'pointer', borderRadius: '50px', fontSize: '10px' }}
                                                            >
                                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: tag.color }}></span>
                                                                {tag.nombre}
                                                                {selected && <Check size={10} className="ms-1" />}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </Col>

                                        {/* Columna 3: Productos y Valor de la Oportunidad */}
                                        <Col lg={4}>
                                            <div className="fw-extrabold text-uppercase text-muted border-bottom pb-2 mb-3 d-flex align-items-center justify-content-between" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>
                                                <span className="d-flex align-items-center">
                                                    <i className="bi bi-box-seam-fill me-2 text-primary"></i>
                                                    3. Productos y Valor
                                                </span>
                                                <Button variant="outline-primary" size="sm" className="p-1 px-2 border-0 shadow-none fw-bold" onClick={() => setShowProdModal(true)}>
                                                    <i className="bi bi-plus-lg"></i>
                                                </Button>
                                            </div>

                                            <div className="overflow-auto border rounded p-1 mb-3" style={{ maxHeight: '220px', minHeight: '120px' }}>
                                                <Table hover responsive size="sm" className="align-middle mb-0">
                                                    <thead className="table-light text-muted" style={{ fontSize: '9px' }}>
                                                        <tr>
                                                            <th>Producto</th>
                                                            <th style={{ width: '60px' }}>Cant.</th>
                                                            <th style={{ width: '80px' }}>Precio</th>
                                                            <th style={{ width: '40px' }} className="text-center"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody style={{ fontSize: '11.5px' }}>
                                                        {productosOportunidad.map((p, idx) => (
                                                            <tr key={idx}>
                                                                <td className="fw-semibold text-dark">{p.nombre}</td>
                                                                <td>
                                                                    <Form.Control 
                                                                        type="number" 
                                                                        size="sm" 
                                                                        min="1" 
                                                                        className="p-1 px-2 text-center border-0 bg-light" 
                                                                        value={p.cantidad} 
                                                                        onChange={e => handleQuantityChangeInOpp(idx, e.target.value)} 
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <Form.Control 
                                                                        type="number" 
                                                                        size="sm" 
                                                                        step="0.01" 
                                                                        className="p-1 px-2 text-center border-0 bg-light" 
                                                                        value={p.precio} 
                                                                        onChange={e => handlePriceChangeInOpp(idx, e.target.value)} 
                                                                    />
                                                                </td>
                                                                <td className="text-center">
                                                                    <Button variant="link" className="p-0 text-danger" onClick={() => handleRemoveProductFromOpp(idx)}>
                                                                        <Trash2 size={12} />
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {productosOportunidad.length === 0 && (
                                                            <tr>
                                                                <td colSpan={4} className="text-center py-4 text-muted small bg-light-soft">
                                                                    Sin productos agregados.
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </Table>
                                            </div>

                                            {/* Subtotal summary card */}
                                            <div className="bg-light-soft p-3 rounded border">
                                                <div className="d-flex justify-content-between align-items-center mb-1 text-muted small">
                                                    <span>Subtotal:</span>
                                                    <span>S/ {subtotalOportunidad.toFixed(2)}</span>
                                                </div>
                                                <div className="d-flex justify-content-between align-items-center mb-1 text-muted small">
                                                    <span>IGV (18%):</span>
                                                    <span>S/ 0.00 (Incluido)</span>
                                                </div>
                                                <div className="d-flex justify-content-between align-items-center border-top pt-2 mt-2">
                                                    <strong className="text-dark">Total Estimado:</strong>
                                                    <h5 className="fw-extrabold text-primary mb-0">S/ {subtotalOportunidad.toFixed(2)}</h5>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Form>
                    )}
                </div>
            </SimpleBar>

            {/* Add Product Modal */}
            <Modal show={showProdModal} onHide={() => setShowProdModal(false)} centered>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold">Añadir Producto al Trato</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <Form.Group className="mb-3">
                        <Modal.Title className="fw-bold small text-muted mb-1">Seleccionar Producto</Modal.Title>
                        <Form.Select
                            value={modalSelectedProdId}
                            onChange={(e) => setModalSelectedProdId(e.target.value)}
                            className="shadow-none border-light-soft bg-light-soft"
                        >
                            <option value="">-- Seleccionar --</option>
                            {productList.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre} (S/ {parseFloat(p.precioVenta || 0).toFixed(2)})</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group>
                        <Modal.Title className="fw-bold small text-muted mb-1">Cantidad</Modal.Title>
                        <Form.Control
                            type="number"
                            min="1"
                            value={modalProdCant}
                            onChange={(e) => setModalProdCant(Math.max(1, parseInt(e.target.value) || 1))}
                            className="shadow-none border-light-soft bg-light-soft"
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="link" className="text-muted text-decoration-none" onClick={() => setShowProdModal(false)}>
                        Cancelar
                    </Button>
                    <Button variant="primary" className="px-4" onClick={handleAddProductToOpp} disabled={!modalSelectedProdId}>
                        Agregar
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
