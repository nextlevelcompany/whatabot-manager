"use client"
import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Badge, Modal, Spinner, Card } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import { Plus, Tag, Trash, Edit2, Move, Star, DollarSign, Settings, Check, Save } from 'react-feather';
import Swal from 'sweetalert2';

const getApiBase = () => {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
        return `${window.location.protocol}//${hostname}:8080`;
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';
};
const API_BASE = getApiBase();

export default function OpportunitiesKanbanPage() {
    const [columns, setColumns] = useState([]);
    const [opportunities, setOpportunities] = useState([]);
    const [tags, setTags] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPriority, setFilterPriority] = useState('');

    // Modals
    const [showOppModal, setShowOppModal] = useState(false);
    const [savingOpp, setSavingOpp] = useState(false);
    const [showTagsModal, setShowTagsModal] = useState(false);
    const [savingTag, setSavingTag] = useState(false);
    const [showColModal, setShowColModal] = useState(false);
    const [savingCol, setSavingCol] = useState(false);

    // Form states
    const defaultOppForm = {
        id: null,
        titulo: '',
        contacto_id: '',
        etapa_id: '',
        valor: 0.0,
        prioridad: 'Media',
        etiquetas: ''
    };
    const [oppForm, setOppForm] = useState(defaultOppForm);

    const defaultColForm = {
        id: null,
        nombre: '',
        es_ganada: false,
        label_ganada: 'Ganada',
        es_perdida: false,
        label_perdida: 'Perdida'
    };
    const [colForm, setColForm] = useState(defaultColForm);

    const [newTagForm, setNewTagForm] = useState({ nombre: '', color: '#6366f1' });

    // Load Kanban bundle
    const loadKanbanData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/opportunities/kanban`);
            if (res.ok) {
                const data = await res.json();
                setColumns(data.columns || []);
                setOpportunities(data.opportunities || []);
                setTags(data.tags || []);
                setContacts(data.contacts || []);
            }
        } catch (e) {
            console.error("Error loading Kanban data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadKanbanData();
    }, []);

    // Drag and Drop implementation using HTML5 DND
    const handleDragStart = (e, oppId) => {
        e.dataTransfer.setData("oppId", oppId.toString());
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = async (e, targetColumnId) => {
        e.preventDefault();
        const oppIdStr = e.dataTransfer.getData("oppId");
        if (!oppIdStr) return;
        const oppId = parseInt(oppIdStr);

        // Optimistic UI update
        const updatedOpps = opportunities.map(o => {
            if (o.id === oppId) {
                return { ...o, etapa_id: targetColumnId };
            }
            return o;
        });
        setOpportunities(updatedOpps);

        try {
            const res = await fetch(`${API_BASE}/api/opportunities/move`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ opp_id: oppId, etapa_id: targetColumnId })
            });
            if (!res.ok) {
                // rollback on failure
                loadKanbanData();
            }
        } catch (err) {
            loadKanbanData();
        }
    };

    // Opportunity Actions
    const handleNewOpp = (columnId = '') => {
        setOppForm({
            ...defaultOppForm,
            etapa_id: columnId || (columns.length > 0 ? columns[0].id : '')
        });
        setShowOppModal(true);
    };

    const handleEditOpp = (opp) => {
        setOppForm({
            id: opp.id,
            titulo: opp.titulo,
            contacto_id: opp.contacto_id || '',
            etapa_id: opp.etapa_id || '',
            valor: parseFloat(opp.valor),
            prioridad: opp.prioridad || 'Media',
            etiquetas: opp.etiquetas || ''
        });
        setShowOppModal(true);
    };

    const handleSaveOpp = async (e) => {
        e.preventDefault();
        setSavingOpp(true);
        try {
            const body = {
                ...oppForm,
                contacto_id: oppForm.contacto_id ? parseInt(oppForm.contacto_id) : null,
                etapa_id: parseInt(oppForm.etapa_id),
                valor: parseFloat(oppForm.valor)
            };

            const res = await fetch(`${API_BASE}/api/opportunities/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setShowOppModal(false);
                loadKanbanData();
                Swal.fire({ icon: 'success', title: 'Oportunidad Guardada', timer: 1000, showConfirmButton: false });
            } else {
                Swal.fire('Error', 'No se pudo guardar la oportunidad.', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Error al guardar.', 'error');
        } finally {
            setSavingOpp(false);
        }
    };

    const handleDeleteOpp = () => {
        if (!oppForm.id) return;
        Swal.fire({
            title: '¿Eliminar Oportunidad?',
            text: 'Se borrarán permanentemente todos los datos comerciales.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Eliminar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`${API_BASE}/api/opportunities/${oppForm.id}`, { method: 'DELETE' });
                    if (res.ok) {
                        setShowOppModal(false);
                        loadKanbanData();
                        Swal.fire('Eliminada', 'Oportunidad borrada.', 'success');
                    }
                } catch (e) {
                    Swal.fire('Error', 'Error de conexión.', 'error');
                }
            }
        });
    };

    // Column Actions
    const handleNewColumn = () => {
        setColForm(defaultColForm);
        setShowColModal(true);
    };

    const handleEditColumn = (col) => {
        setColForm({
            id: col.id,
            nombre: col.nombre,
            es_ganada: col.es_ganada,
            label_ganada: col.label_ganada || 'Ganada',
            es_perdida: col.es_perdida,
            label_perdida: col.label_perdida || 'Perdida'
        });
        setShowColModal(true);
    };

    const handleSaveColumn = async (e) => {
        e.preventDefault();
        setSavingCol(true);
        try {
            const res = await fetch(`${API_BASE}/api/opportunities/columns/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(colForm)
            });

            if (res.ok) {
                setShowColModal(false);
                loadKanbanData();
            } else {
                Swal.fire('Error', 'No se pudo guardar la columna.', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Error de red.', 'error');
        } finally {
            setSavingCol(false);
        }
    };

    const handleDeleteColumn = (colId) => {
        Swal.fire({
            title: '¿Eliminar Etapa?',
            text: 'Solo puedes eliminar etapas que no tengan oportunidades asignadas.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Eliminar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`${API_BASE}/api/opportunities/columns/${colId}`, { method: 'DELETE' });
                    if (res.ok) {
                        loadKanbanData();
                        Swal.fire('Eliminado', 'La etapa ha sido removida.', 'success');
                    } else {
                        const err = await res.json();
                        Swal.fire('Error', err.message || 'No se pudo eliminar.', 'error');
                    }
                } catch (e) {
                    Swal.fire('Error', 'Error al eliminar.', 'error');
                }
            }
        });
    };

    // Tags Management
    const handleSaveTag = async (e) => {
        e.preventDefault();
        setSavingTag(true);
        try {
            const res = await fetch(`${API_BASE}/api/opportunities/tags/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTagForm)
            });
            if (res.ok) {
                setNewTagForm({ nombre: '', color: '#6366f1' });
                loadKanbanData();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSavingTag(false);
        }
    };

    const handleDeleteTag = async (tagId) => {
        try {
            const res = await fetch(`${API_BASE}/api/opportunities/tags/${tagId}`, { method: 'DELETE' });
            if (res.ok) {
                loadKanbanData();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleToggleTagOnOpp = (tagName) => {
        const currentSelected = oppForm.etiquetas ? oppForm.etiquetas.split(',').map(t => t.trim()).filter(Boolean) : [];
        let updated;
        if (currentSelected.includes(tagName)) {
            updated = currentSelected.filter(t => t !== tagName);
        } else {
            updated = [...currentSelected, tagName];
        }
        setOppForm({ ...oppForm, etiquetas: updated.join(', ') });
    };

    // Helper functions for values
    const getColumnOpps = (columnId) => {
        return opportunities.filter(o => o.etapa_id === columnId && (
            searchTerm === '' ||
            o.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (o.contacto_nombre_completo && o.contacto_nombre_completo.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (o.etiquetas && o.etiquetas.toLowerCase().includes(searchTerm.toLowerCase()))
        ) && (
            filterPriority === '' || o.prioridad === filterPriority
        ));
    };

    const getColumnTotal = (columnId) => {
        return getColumnOpps(columnId).reduce((sum, o) => sum + parseFloat(o.valor), 0.0);
    };

    const getPriorityBadgeColor = (p) => {
        if (p === 'Alta') return 'danger';
        if (p === 'Media') return 'warning';
        return 'secondary';
    };

    return (
        <div className="contact-body">
            <SimpleBar className="nicescroll-bar">
                <div className="px-4 py-4">
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                        <div>
                            <h4 className="fw-extrabold text-dark mb-0">Embudo de Ventas (CRM)</h4>
                            <p className="text-muted small mb-0">Visualiza, califica y arrastra tus prospectos y cotizaciones a través del embudo de conversión.</p>
                        </div>
                        <div className="d-flex gap-2">
                            <Button variant="outline-secondary" size="sm" onClick={() => setShowTagsModal(true)} className="fw-semibold d-flex align-items-center gap-1">
                                <Tag size={14} />
                                Etiquetas
                            </Button>
                            <Button variant="outline-primary" size="sm" onClick={handleNewColumn} className="fw-semibold d-flex align-items-center gap-1">
                                <Plus size={14} />
                                Nueva Etapa
                            </Button>
                            <Button variant="primary" size="sm" onClick={() => handleNewOpp()} className="fw-bold d-flex align-items-center gap-1">
                                <Plus size={14} />
                                Nueva Oportunidad
                            </Button>
                        </div>
                    </div>

                    {/* Filter toolbar */}
                    <Row className="mb-4 g-2">
                        <Col md={6}>
                            <Form.Control 
                                size="sm"
                                type="search" 
                                placeholder="🔍 Buscar por título, cliente o etiqueta..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </Col>
                        <Col md={3}>
                            <Form.Select size="sm" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                                <option value="">Todas las prioridades</option>
                                <option value="Alta">🔴 Prioridad Alta</option>
                                <option value="Media">🟡 Prioridad Media</option>
                                <option value="Baja">⚪ Prioridad Baja</option>
                            </Form.Select>
                        </Col>
                        <Col md={3} className="text-end">
                            <Button size="sm" variant="outline-secondary" className="w-100" onClick={loadKanbanData}>
                                🔄 Sincronizar Kanban
                            </Button>
                        </Col>
                    </Row>

                    {/* Kanban Scroll Wrap */}
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" />
                            <p className="mt-2 text-muted">Cargando embudo CRM...</p>
                        </div>
                    ) : (
                        <SimpleBar className="w-100">
                            <div className="d-flex gap-3 pb-3 align-items-stretch" style={{ minHeight: '65vh', overflowX: 'auto', minWidth: `${columns.length * 280}px` }}>
                                {columns.map(col => {
                                    const opps = getColumnOpps(col.id);
                                    const total = getColumnTotal(col.id);
                                    return (
                                        <div 
                                            key={col.id} 
                                            className="kanban-column flex-shrink-0 bg-light rounded-3 p-3 d-flex flex-column"
                                            style={{ width: '270px' }}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, col.id)}
                                        >
                                            {/* Column Header */}
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <div>
                                                    <h6 className="fw-extrabold text-dark mb-0 d-inline-block text-truncate mw-150p" title={col.nombre}>{col.nombre}</h6>
                                                    <span className="badge bg-secondary-soft text-secondary ms-2 small">{opps.length}</span>
                                                </div>
                                                <div className="d-flex align-items-center">
                                                    <Button variant="link" className="p-0 text-muted me-1" onClick={() => handleEditColumn(col)}>
                                                        <Settings size={14} />
                                                    </Button>
                                                    {opps.length === 0 && (
                                                        <Button variant="link" className="p-0 text-danger" onClick={() => handleDeleteColumn(col.id)}>
                                                            <Trash size={14} />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Column Total Value */}
                                            <div className="text-muted small mb-3 border-bottom pb-2 d-flex justify-content-between">
                                                <span>Total:</span>
                                                <span className="fw-bold text-dark">S/ {total.toFixed(2)}</span>
                                            </div>

                                            {/* Cards list */}
                                            <SimpleBar className="flex-grow-1" style={{ maxHeight: '500px' }}>
                                                <div className="d-flex flex-column gap-2 pe-1">
                                                    {opps.map(o => {
                                                        const cardTags = o.etiquetas ? o.etiquetas.split(',').map(t => t.trim()) : [];
                                                        return (
                                                            <Card 
                                                                key={o.id}
                                                                draggable
                                                                onDragStart={(e) => handleDragStart(e, o.id)}
                                                                onClick={() => handleEditOpp(o)}
                                                                className="border-light shadow-none cursor-grab bg-white p-3 rounded-3 hover-shadow-sm transition-all"
                                                                style={{ cursor: 'grab' }}
                                                            >
                                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                                    <Badge bg={getPriorityBadgeColor(o.prioridad)} style={{ fontSize: '10px' }}>
                                                                        {o.prioridad}
                                                                    </Badge>
                                                                    <span className="text-muted small" style={{ fontSize: '11px' }}>
                                                                        {o.created_at ? o.created_at.split('T')[0] : ''}
                                                                    </span>
                                                                </div>

                                                                <h6 className="fw-bold text-dark mb-1 font-size-14 text-wrap">{o.titulo}</h6>
                                                                
                                                                {o.contacto_nombre_completo && (
                                                                    <div className="text-muted small mb-2">
                                                                        👤 {o.contacto_nombre_completo}
                                                                    </div>
                                                                )}

                                                                {cardTags.length > 0 && (
                                                                    <div className="d-flex flex-wrap gap-1 mb-3">
                                                                        {cardTags.map((ct, cti) => {
                                                                            const mTag = tags.find(t => t.nombre === ct);
                                                                            const bgColor = mTag ? mTag.color : '#6366f1';
                                                                            return (
                                                                                <span key={cti} className="badge text-white px-2 py-1 font-size-10" style={{ backgroundColor: bgColor }}>
                                                                                    {ct}
                                                                                </span>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}

                                                                <div className="d-flex justify-content-between align-items-center mt-2 border-top pt-2">
                                                                    <span className="small text-muted">Sueldo/Valor:</span>
                                                                    <span className="fw-extrabold text-primary font-size-13">S/ {parseFloat(o.valor).toFixed(2)}</span>
                                                                </div>
                                                            </Card>
                                                        );
                                                    })}

                                                    {/* Quick add card button */}
                                                    <Button 
                                                        variant="outline-dashed" 
                                                        className="w-100 border-light-soft text-muted py-2 font-size-12 d-flex align-items-center justify-content-center gap-1"
                                                        onClick={() => handleNewOpp(col.id)}
                                                    >
                                                        <Plus size={12} />
                                                        Añadir Oportunidad
                                                    </Button>
                                                </div>
                                            </SimpleBar>
                                        </div>
                                    );
                                })}
                            </div>
                        </SimpleBar>
                    )}
                </div>
            </SimpleBar>

            {/* Opportunity Edit/Create Modal */}
            <Modal show={showOppModal} onHide={() => setShowOppModal(false)} size="md" backdrop="static">
                <Form onSubmit={handleSaveOpp}>
                    <Modal.Header closeButton>
                        <Modal.Title className="fw-bold">{oppForm.id ? 'Editar Oportunidad' : 'Nueva Oportunidad'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        <Row className="g-3">
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Título / Nombre Trato</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        placeholder="Ej: Suministro de agua bidón 20L empresa"
                                        className="shadow-none border-light-soft bg-light-soft" 
                                        value={oppForm.titulo} 
                                        onChange={e => setOppForm({ ...oppForm, titulo: e.target.value })} 
                                        required 
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Contacto / Cliente Asignado</Form.Label>
                                    <Form.Select 
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={oppForm.contacto_id}
                                        onChange={e => setOppForm({ ...oppForm, contacto_id: e.target.value })}
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
                                        value={oppForm.valor} 
                                        onChange={e => setOppForm({ ...oppForm, valor: e.target.value })} 
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Prioridad</Form.Label>
                                    <Form.Select 
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={oppForm.prioridad}
                                        onChange={e => setOppForm({ ...oppForm, prioridad: e.target.value })}
                                    >
                                        <option value="Baja">Baja</option>
                                        <option value="Media">Media</option>
                                        <option value="Alta">Alta</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Etapa del Embudo</Form.Label>
                                    <Form.Select 
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={oppForm.etapa_id}
                                        onChange={e => setOppForm({ ...oppForm, etapa_id: e.target.value })}
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
                                        const selected = oppForm.etiquetas ? oppForm.etiquetas.split(',').map(t => t.trim()).includes(tag.nombre) : false;
                                        return (
                                            <span 
                                                key={tag.id}
                                                className={`badge border text-dark preset-badge cursor-pointer px-3 py-2 d-flex align-items-center gap-1 ${selected ? 'bg-primary text-white border-primary' : 'bg-white'}`}
                                                onClick={() => handleToggleTagOnOpp(tag.nombre)}
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
                    </Modal.Body>
                    <Modal.Footer>
                        {oppForm.id && (
                            <Button variant="outline-danger" className="me-auto" onClick={handleDeleteOpp}>
                                Eliminar
                            </Button>
                        )}
                        <Button variant="light" onClick={() => setShowOppModal(false)} disabled={savingOpp}>
                            Cancelar
                        </Button>
                        <Button variant="primary" type="submit" disabled={savingOpp}>
                            {savingOpp ? <Spinner size="sm" /> : <Save size={14} className="me-1" />}
                            Guardar Oportunidad
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Columns Customizer Modal */}
            <Modal show={showColModal} onHide={() => setShowColModal(false)} size="md" backdrop="static">
                <Form onSubmit={handleSaveColumn}>
                    <Modal.Header closeButton>
                        <Modal.Title className="fw-bold">Configuración de Etapa</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        <Row className="g-3">
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Nombre de la Etapa</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        className="shadow-none border-light-soft bg-light-soft" 
                                        value={colForm.nombre} 
                                        onChange={e => setColForm({ ...colForm, nombre: e.target.value })} 
                                        required 
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12} className="mt-3">
                                <Form.Check 
                                    type="checkbox" 
                                    id="col-es-ganada-chk"
                                    label="Marcar como etapa GANADA (cierra los tratos con éxito)" 
                                    checked={colForm.es_ganada} 
                                    onChange={e => setColForm({ ...colForm, es_ganada: e.target.checked })} 
                                />
                            </Col>
                            <Col md={12} className="mt-2">
                                <Form.Check 
                                    type="checkbox" 
                                    id="col-es-perdida-chk"
                                    label="Marcar como etapa PERDIDA (cierra los tratos sin éxito)" 
                                    checked={colForm.es_perdida} 
                                    onChange={e => setColForm({ ...colForm, es_perdida: e.target.checked })} 
                                />
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" onClick={() => setShowColModal(false)} disabled={savingCol}>
                            Cancelar
                        </Button>
                        <Button variant="primary" type="submit" disabled={savingCol}>
                            {savingCol ? <Spinner size="sm" /> : <Save size={14} className="me-1" />}
                            Guardar Etapa
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Tags Management Modal */}
            <Modal show={showTagsModal} onHide={() => setShowTagsModal(false)} size="md" backdrop="static">
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold">Gestionar Etiquetas CRM</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {/* Add Tag Form */}
                    <Form onSubmit={handleSaveTag} className="mb-4 pb-3 border-bottom">
                        <Row className="g-2 align-items-end">
                            <Col md={7}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Nombre Etiqueta</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        size="sm"
                                        placeholder="Ej: Cliente Mayorista"
                                        className="shadow-none border-light-soft bg-light-soft" 
                                        value={newTagForm.nombre} 
                                        onChange={e => setNewTagForm({ ...newTagForm, nombre: e.target.value })} 
                                        required 
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Color</Form.Label>
                                    <Form.Control 
                                        type="color" 
                                        size="sm"
                                        className="w-100"
                                        value={newTagForm.color} 
                                        onChange={e => setNewTagForm({ ...newTagForm, color: e.target.value })} 
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Button type="submit" variant="primary" size="sm" className="w-100" disabled={savingTag}>
                                    Añadir
                                </Button>
                            </Col>
                        </Row>
                    </Form>

                    {/* Tags List */}
                    <h6 className="fw-bold text-dark mb-3">Etiquetas Registradas</h6>
                    <div className="d-flex flex-wrap gap-2">
                        {tags.map(tag => (
                            <span 
                                key={tag.id}
                                className="badge bg-light text-dark border p-2 d-flex align-items-center gap-2"
                                style={{ borderRadius: '50px' }}
                            >
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: tag.color }}></span>
                                <span className="fw-bold">{tag.nombre}</span>
                                <Button variant="link" className="p-0 text-danger line-height-1" onClick={() => handleDeleteTag(tag.id)}>
                                    ✖
                                </Button>
                            </span>
                        ))}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => setShowTagsModal(false)}>
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
