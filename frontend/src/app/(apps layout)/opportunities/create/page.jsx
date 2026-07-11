"use client"
import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Spinner, Card } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import { Save, ArrowLeft, Star, DollarSign, Check } from 'react-feather';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

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
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        titulo: '',
        contacto_id: '',
        etapa_id: '',
        valor: 0.0,
        prioridad: 'Media',
        etiquetas: ''
    });

    useEffect(() => {
        const loadMetadata = async () => {
            try {
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
            } catch (e) {
                console.error("Error loading Kanban metadata", e);
            } finally {
                setLoading(false);
            }
        };
        loadMetadata();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const body = {
                ...form,
                contacto_id: form.contacto_id ? parseInt(form.contacto_id) : null,
                etapa_id: parseInt(form.etapa_id),
                valor: parseFloat(form.valor)
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
                    text: 'Se ha agregado al embudo de ventas.',
                    timer: 1500,
                    showConfirmButton: false
                });
                router.push('/opportunities/view');
            } else {
                Swal.fire('Error', 'No se pudo guardar la oportunidad.', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Error de conexión.', 'error');
        } finally {
            setSaving(false);
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

    return (
        <div className="contact-body">
            <SimpleBar className="nicescroll-bar">
                <div className="px-4 py-4" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    {/* Header */}
                    <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
                        <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover" onClick={() => router.push('/opportunities/view')}>
                            <ArrowLeft size={18} />
                        </Button>
                        <div>
                            <h4 className="fw-extrabold text-dark mb-0">Crear Oportunidad</h4>
                            <p className="text-muted small mb-0">Registra un nuevo trato comercial o prospecto para el embudo de ventas.</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" />
                        </div>
                    ) : (
                        <Card className="border-0 shadow-sm rounded-3">
                            <Card.Body className="p-4">
                                <Form onSubmit={handleSubmit}>
                                    <Row className="g-3">
                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label className="small fw-bold text-muted mb-1">Título de la Oportunidad / Trato</Form.Label>
                                                <Form.Control 
                                                    type="text" 
                                                    placeholder="Ej: Suministro de agua bidón 20L empresa"
                                                    className="shadow-none border-light-soft bg-light-soft" 
                                                    value={form.titulo} 
                                                    onChange={e => setForm({ ...form, titulo: e.target.value })} 
                                                    required 
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label className="small fw-bold text-muted mb-1">Contacto / Cliente Asignado</Form.Label>
                                                <Form.Select 
                                                    className="shadow-none border-light-soft bg-light-soft"
                                                    value={form.contacto_id}
                                                    onChange={e => setForm({ ...form, contacto_id: e.target.value })}
                                                >
                                                    <option value="">-- Vincular Contacto (Opcional) --</option>
                                                    {contacts.map(c => (
                                                        <option key={c.id} value={c.id}>{c.display_name} ({c.tipo_persona})</option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="small fw-bold text-muted mb-1">Valor Estimado (S/)</Form.Label>
                                                <Form.Control 
                                                    type="number" 
                                                    step="0.01" 
                                                    className="shadow-none border-light-soft bg-light-soft" 
                                                    value={form.valor} 
                                                    onChange={e => setForm({ ...form, valor: e.target.value })} 
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="small fw-bold text-muted mb-1">Prioridad</Form.Label>
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
                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label className="small fw-bold text-muted mb-1">Etapa Inicial del Embudo</Form.Label>
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

                                        <Col md={12}>
                                            <Form.Label className="small fw-bold text-muted mb-1">Etiquetas del Trato</Form.Label>
                                            <div className="d-flex flex-wrap gap-2 p-2 border rounded bg-light-soft" style={{ minHeight: '45px' }}>
                                                {tags.map(tag => {
                                                    const selected = form.etiquetas ? form.etiquetas.split(',').map(t => t.trim()).includes(tag.nombre) : false;
                                                    return (
                                                        <span 
                                                            key={tag.id}
                                                            className={`badge border text-dark preset-badge cursor-pointer px-3 py-2 d-flex align-items-center gap-1 ${selected ? 'bg-primary text-white border-primary' : 'bg-white'}`}
                                                            onClick={() => handleToggleTag(tag.nombre)}
                                                            style={{ cursor: 'pointer', borderRadius: '50px' }}
                                                        >
                                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: tag.color }}></span>
                                                            {tag.nombre}
                                                            {selected && <Check size={10} className="ms-1" />}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </Col>
                                    </Row>

                                    <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                                        <Button variant="light" onClick={() => router.push('/opportunities/view')} disabled={saving}>
                                            Cancelar
                                        </Button>
                                        <Button variant="primary" type="submit" disabled={saving}>
                                            {saving ? <Spinner size="sm" /> : <Save size={14} className="me-1" />}
                                            Crear Oportunidad
                                        </Button>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>
                    )}
                </div>
            </SimpleBar>
        </div>
    );
}
