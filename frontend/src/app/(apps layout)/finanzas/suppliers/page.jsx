"use client"
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Badge, Modal, Spinner } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import HkDataTable from '@/components/@hk-data-table';
import { Edit, Trash, Plus, Save } from 'react-feather';
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

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const defaultForm = {
        id: null,
        ruc: '',
        razon_social: '',
        contacto_nombre: '',
        telefono: '',
        email: '',
        direccion: '',
        activo: true
    };

    const [form, setForm] = useState(defaultForm);

    const loadSuppliers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/proveedores`);
            if (res.ok) {
                const data = await res.json();
                setSuppliers(data);
            }
        } catch (e) {
            console.error("Error loading suppliers", e);
            Swal.fire('Error', 'No se pudieron cargar los proveedores.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSuppliers();
    }, []);

    const handleEdit = (supplier) => {
        setForm({
            ...defaultForm,
            ...supplier
        });
        setShowModal(true);
    };

    const handleNew = () => {
        setForm(defaultForm);
        setShowModal(true);
    };

    const handleDelete = (id, razonSocial) => {
        Swal.fire({
            title: '¿Estás seguro?',
            text: `Se eliminará permanentemente al proveedor "${razonSocial}" si no tiene compras o gastos asociados.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Eliminar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`${API_BASE}/api/proveedores/${id}`, {
                        method: 'DELETE'
                    });
                    const data = await res.json();
                    if (res.ok) {
                        Swal.fire('Eliminado', 'El proveedor ha sido eliminado.', 'success');
                        loadSuppliers();
                    } else {
                        Swal.fire('Error', data.message || 'No se pudo eliminar el proveedor.', 'error');
                    }
                } catch (e) {
                    Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
                }
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/proveedores/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(form)
            });

            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Guardado',
                    text: 'Proveedor guardado con éxito.',
                    timer: 1500,
                    showConfirmButton: false
                });
                setShowModal(false);
                loadSuppliers();
            } else {
                Swal.fire('Error', 'No se pudieron guardar los cambios.', 'error');
            }
        } catch (error) {
            console.error("Error saving supplier", error);
            Swal.fire('Error', 'Hubo un error de conexión con el servidor.', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Table mapping
    const getInitials = (name) => {
        if (!name) return 'PR';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return parts[0].substring(0, 2).toUpperCase();
    };

    const tableData = suppliers.map(s => {
        const initials = getInitials(s.razon_social);
        const avColors = ['primary', 'success', 'danger', 'info', 'warning', 'dark'];
        const avtBg = avColors[s.id % avColors.length];

        return {
            id: s.id,
            nameData: {
                id: s.id,
                displayName: s.razon_social,
                initials,
                avtBg
            },
            document: {
                tipo: 'RUC',
                numero: s.ruc || 'SIN RUC'
            },
            contactName: s.contacto_nombre || '—',
            email: s.email || '',
            phone: s.telefono || '',
            direccion: s.direccion || '',
            activo: s.activo,
            actionData: {
                id: s.id,
                displayName: s.razon_social,
                supplier: s
            }
        };
    });

    const columns = [
        {
            accessor: "id",
            title: "ID",
            hidden: true,
        },
        {
            accessor: "nameData",
            title: "Razón Social / Proveedor",
            sort: true,
            cellFormatter: (nameData) => {
                return (
                    <div className="media align-items-center">
                        <div className="media-head me-2">
                            <div className={`avatar avatar-xs avatar-rounded avatar-soft-${nameData.avtBg}`}>
                                <span className="initial-wrap">{nameData.initials}</span>
                            </div>
                        </div>
                        <div className="media-body">
                            <div className="fw-semibold text-high-em text-primary" style={{ cursor: 'pointer' }} onClick={() => handleEdit(nameData.supplier || suppliers.find(s => s.id === nameData.id))}>
                                {nameData.displayName}
                            </div>
                        </div>
                    </div>
                );
            }
        },
        {
            accessor: "document",
            title: "Documento",
            sort: true,
            cellFormatter: (doc) => (
                <div className="d-flex align-items-center gap-1">
                    <Badge bg="light" className="text-dark border" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        {doc.tipo}
                    </Badge>
                    <span>{doc.numero}</span>
                </div>
            )
        },
        {
            accessor: "contactName",
            title: "Contacto",
            sort: true,
        },
        {
            accessor: "email",
            title: "Email",
            sort: true,
            cellFormatter: (cell) => <span className="text-truncate mw-150p d-block">{cell || <span className="text-muted">—</span>}</span>,
        },
        {
            accessor: "phone",
            title: "Teléfono",
            sort: true,
            cellFormatter: (phone) => phone ? (
                <span className="text-nowrap">📱 {phone}</span>
            ) : <span className="text-muted">—</span>,
        },
        {
            accessor: "direccion",
            title: "Dirección",
            sort: true,
            cellFormatter: (cell) => <span className="text-truncate mw-200p d-block" title={cell}>{cell || <span className="text-muted">—</span>}</span>,
        },
        {
            accessor: "activo",
            title: "Estado",
            sort: true,
            cellFormatter: (activo) => (
                <Badge bg={activo ? 'success-soft text-success' : 'danger-soft text-danger'} className="border">
                    {activo ? 'Activo' : 'Inactivo'}
                </Badge>
            )
        },
        {
            accessor: "actionData",
            title: "",
            cellFormatter: (actionData) => {
                return (
                    <div className="d-flex align-items-center">
                        <div className="d-flex">
                            <Button 
                                variant="flush-dark" 
                                className="btn-icon btn-rounded flush-soft-hover" 
                                title="Editar"
                                onClick={() => handleEdit(actionData.supplier)}
                            >
                                <span className="icon">
                                    <span className="feather-icon">
                                        <Edit size={16} />
                                    </span>
                                </span>
                            </Button>
                            <Button 
                                variant="flush-dark" 
                                className="btn-icon btn-rounded flush-soft-hover del-button" 
                                title="Eliminar"
                                onClick={() => handleDelete(actionData.id, actionData.displayName)}
                            >
                                <span className="icon">
                                    <span className="feather-icon">
                                        <Trash size={16} />
                                    </span>
                                </span>
                            </Button>
                        </div>
                    </div>
                );
            }
        }
    ];

    return (
        <div className="contact-body">
            <SimpleBar className="nicescroll-bar">
                <div className="contact-list-view">
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom">
                        <div>
                            <h4 className="fw-extrabold text-dark mb-0">Directorio de Proveedores</h4>
                            <p className="text-muted small mb-0">Catálogo general de proveedores autorizados para compras e insumos contables.</p>
                        </div>
                        <Button variant="primary" className="fw-bold d-flex align-items-center gap-1 py-2" onClick={handleNew}>
                            <Plus size={16} />
                            Nuevo Proveedor
                        </Button>
                    </div>

                    {/* Toolbar & Filter */}
                    <Row className="mb-3 mt-3 px-4" >
                        <Col xs={12} className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-2">
                                <Form.Control
                                    size="sm"
                                    type="search"
                                    placeholder="🔍 Buscar por razón social, RUC o contacto..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    style={{ minWidth: '320px' }}
                                />
                                <span className="text-muted small">
                                    {suppliers.length} proveedor{suppliers.length !== 1 ? 'es' : ''}
                                </span>
                            </div>
                            <Button size="sm" variant="outline-secondary" onClick={loadSuppliers} title="Recargar">
                                🔄 Recargar
                            </Button>
                        </Col>
                    </Row>

                    {/* HkDataTable wrapper */}
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" />
                            <p className="mt-2 text-muted">Cargando directorio de proveedores...</p>
                        </div>
                    ) : (
                        <div className="px-4">
                            <HkDataTable
                                column={columns}
                                rowData={tableData}
                                rowsPerPage={10}
                                rowSelection={true}
                                searchQuery={searchTerm}
                                classes="nowrap w-100 mb-5"
                                responsive
                            />
                        </div>
                    )}
                </div>
            </SimpleBar>

            {/* Edit / New Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" backdrop="static">
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title className="fw-bold">{form.id ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        <Row className="g-3">
                            <Col md={8}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Razón Social</Form.Label>
                                    <Form.Control
                                        type="text"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.razon_social}
                                        onChange={(e) => setForm({ ...form, razon_social: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">RUC / ID Fiscal</Form.Label>
                                    <Form.Control
                                        type="text"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.ruc}
                                        onChange={(e) => setForm({ ...form, ruc: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Persona de Contacto</Form.Label>
                                    <Form.Control
                                        type="text"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.contacto_nombre}
                                        onChange={(e) => setForm({ ...form, contacto_nombre: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Teléfono</Form.Label>
                                    <Form.Control
                                        type="text"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.telefono}
                                        onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Correo Electrónico</Form.Label>
                                    <Form.Control
                                        type="email"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Dirección Física</Form.Label>
                                    <Form.Control
                                        type="text"
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={form.direccion}
                                        onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mt-3">
                                    <Form.Check
                                        type="switch"
                                        id="supplier-active-switch"
                                        label="Proveedor Activo para Compras"
                                        checked={form.activo}
                                        onChange={(e) => setForm({ ...form, activo: e.target.checked })}
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
                                    <Save size={16} className="me-2" />
                                    Guardar Proveedor
                                </>
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}
