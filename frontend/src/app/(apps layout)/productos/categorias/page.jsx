"use client"
import React, { useState, useEffect } from 'react';
import { Row, Col, Table, Form, Button, Modal, Spinner, Badge, InputGroup, Nav, Card } from 'react-bootstrap';
import { Inbox, RefreshCw, Plus, Edit, Trash, Settings, HelpCircle, Folder, Menu, Search, Eye, EyeOff, List, Grid, Download } from 'react-feather';
import SimpleBar from 'simplebar-react';
import classNames from 'classnames';
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

// Helper to dynamically load SheetJS (XLSX) from CDN
const loadSheetJS = () => {
    return new Promise((resolve) => {
        if (typeof window !== 'undefined' && window.XLSX) {
            resolve(window.XLSX);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js';
        script.onload = () => resolve(window.XLSX);
        document.body.appendChild(script);
    });
};

export default function CategoriasPage() {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'active' | 'inactive'
    const [sortBy, setSortBy] = useState('id'); // 'id' | 'name'
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
    const [showSidebar, setShowSidebar] = useState(false);
    
    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [saving, setSaving] = useState(false);
    const [formVal, setFormVal] = useState({
        id: null,
        nombre: '',
        descripcion: '',
        activo: true
    });

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/categorias-producto`);
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            } else {
                Swal.fire('Error', 'No se pudieron cargar las categorías del servidor.', 'error');
            }
        } catch (err) {
            console.error("Error fetching categories:", err);
            Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/productos`);
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            }
        } catch (err) {
            console.error("Error fetching products:", err);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchProducts();
    }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormVal(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handlePrepareAdd = () => {
        setFormVal({
            id: null,
            nombre: '',
            descripcion: '',
            activo: true
        });
        setModalMode('add');
        setShowModal(true);
    };

    const handlePrepareEdit = (cat) => {
        setFormVal({
            id: cat.id,
            nombre: cat.nombre || '',
            descripcion: cat.descripcion || '',
            activo: cat.activo !== false
        });
        setModalMode('edit');
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formVal.nombre.trim()) {
            Swal.fire('Atención', 'El nombre de la categoría es obligatorio.', 'warning');
            return;
        }

        setSaving(true);
        try {
            const method = modalMode === 'add' ? 'POST' : 'PUT';
            const url = modalMode === 'add' 
                ? `${API_BASE}/api/categorias-producto` 
                : `${API_BASE}/api/categorias-producto/${formVal.id}`;

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formVal)
            });

            if (res.ok) {
                setShowModal(false);
                Swal.fire(
                    'Guardado', 
                    `La categoría se ha ${modalMode === 'add' ? 'creado' : 'actualizado'} correctamente.`, 
                    'success'
                );
                fetchCategories();
                fetchProducts();
            } else {
                const errData = await res.json();
                Swal.fire('Error', errData.message || 'Error al guardar la categoría.', 'error');
            }
        } catch (err) {
            console.error("Error saving category:", err);
            Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (cat) => {
        const result = await Swal.fire({
            title: `¿Eliminar la categoría "${cat.nombre}"?`,
            text: "Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`${API_BASE}/api/categorias-producto/${cat.id}`, {
                    method: 'DELETE'
                });

                if (res.ok) {
                    Swal.fire('Eliminado', 'La categoría ha sido eliminada.', 'success');
                    fetchCategories();
                    fetchProducts();
                } else {
                    const errData = await res.json();
                    Swal.fire('No se puede eliminar', errData.message || 'Error en el servidor al intentar eliminar.', 'error');
                }
            } catch (err) {
                console.error("Error deleting category:", err);
                Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
            }
        }
    };

    const handleExportExcel = async () => {
        if (categories.length === 0) {
            Swal.fire('Atención', 'No hay categorías para exportar.', 'info');
            return;
        }

        const XLSX = await loadSheetJS();
        
        const data = categories.map(c => {
            const count = products.filter(p => String(p.categoriaId) === String(c.id)).length;
            return {
                'ID': c.id,
                'Nombre': c.nombre,
                'Descripción': c.descripcion || '-',
                'Estado': c.activo !== false ? 'ACTIVO' : 'INACTIVO',
                'Productos Asociados': count
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Categorías");
        XLSX.writeFile(wb, `Categorias_Productos_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    const filteredCategories = categories.filter(cat => {
        const matchesSearch = 
            (cat.nombre && cat.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (cat.descripcion && cat.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));
            
        let matchesStatus = true;
        if (filterStatus === 'active') {
            matchesStatus = cat.activo !== false;
        } else if (filterStatus === 'inactive') {
            matchesStatus = cat.activo === false;
        }
        
        return matchesSearch && matchesStatus;
    }).sort((a, b) => {
        if (sortBy === 'name') {
            return (a.nombre || '').localeCompare(b.nombre || '');
        }
        return (b.id || 0) - (a.id || 0);
    });

    return (
        <div className="hk-pg-body py-0">
            <div className={classNames("contactapp-wrap", { "contactapp-sidebar-toggle": showSidebar })}>
                {/* Sidebar Izquierda (Categorías de Productos) */}
                <Nav className="contactapp-sidebar">
                    <SimpleBar className="nicescroll-bar" style={{ height: 'calc(100vh - 200px)' }}>
                        <div className="menu-content-wrap">
                            <Button 
                                variant="primary" 
                                onClick={handlePrepareAdd} 
                                className="btn-rounded btn-block mb-4 d-inline-flex align-items-center justify-content-center gap-1.5"
                                style={{ width: '100%' }}
                            >
                                <Plus size={16} />
                                <span>Crear Categoría</span>
                            </Button>
                            
                            <div className="menu-group">
                                <Nav className="nav-light navbar-nav flex-column">
                                    <Nav.Item>
                                        <Nav.Link 
                                            active={filterStatus === 'all'} 
                                            onClick={() => setFilterStatus('all')}
                                        >
                                            <span className="nav-icon-wrap">
                                                <span className="feather-icon">
                                                    <Inbox size={16} />
                                                </span>
                                            </span>
                                            <span className="nav-link-text">Todas las Categorías</span>
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link 
                                            active={filterStatus === 'active'} 
                                            onClick={() => setFilterStatus('active')}
                                        >
                                            <span className="nav-icon-wrap">
                                                <span className="feather-icon text-success">
                                                    <Eye size={16} />
                                                </span>
                                            </span>
                                            <span className="nav-link-text">Categorías Activas</span>
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link 
                                            active={filterStatus === 'inactive'} 
                                            onClick={() => setFilterStatus('inactive')}
                                        >
                                            <span className="nav-icon-wrap">
                                                <span className="feather-icon text-danger">
                                                    <EyeOff size={16} />
                                                </span>
                                            </span>
                                            <span className="nav-link-text">Categorías Inactivas</span>
                                        </Nav.Link>
                                    </Nav.Item>
                                </Nav>
                            </div>
                            
                            <div className="separator separator-light" />
                            <div className="d-flex align-items-center justify-content-between mb-2">
                                <div className="title-sm text-primary mb-0" style={{ fontWeight: 600 }}>Resumen</div>
                            </div>
                            
                            <div className="menu-group">
                                <Nav className="nav-light navbar-nav flex-column">
                                    <Nav.Item>
                                        <div className="nav-link d-flex justify-content-between py-1" style={{ fontSize: '0.85rem' }}>
                                            <span className="text-muted">Total:</span>
                                            <span className="fw-bold text-dark">{categories.length}</span>
                                        </div>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <div className="nav-link d-flex justify-content-between py-1" style={{ fontSize: '0.85rem' }}>
                                            <span className="text-muted">Activas:</span>
                                            <span className="fw-bold text-success">{categories.filter(c => c.activo !== false).length}</span>
                                        </div>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <div className="nav-link d-flex justify-content-between py-1" style={{ fontSize: '0.85rem' }}>
                                            <span className="text-muted">Inactivas:</span>
                                            <span className="fw-bold text-danger">{categories.filter(c => c.activo === false).length}</span>
                                        </div>
                                    </Nav.Item>
                                </Nav>
                            </div>

                            <div className="separator separator-light" />
                            <div className="menu-group">
                                <Nav className="nav-light navbar-nav flex-column">
                                    <Nav.Item>
                                        <Nav.Link onClick={handleExportExcel}>
                                            <span className="nav-icon-wrap">
                                                <span className="feather-icon">
                                                    <Download size={16} />
                                                </span>
                                            </span>
                                            <span className="nav-link-text">Exportar Excel</span>
                                        </Nav.Link>
                                    </Nav.Item>
                                </Nav>
                            </div>
                        </div>
                    </SimpleBar>
                    
                    {/* Fixed Navbar Footer */}
                    <div className="contactapp-fixednav">
                        <div className="hk-toolbar">
                            <Nav className="nav-light">
                                <Nav.Item className="nav-link">
                                    <Button variant="flush-dark" as="a" href="/productos/view" className="btn-icon btn-rounded flush-soft-hover" title="Ver Catálogo de Productos">
                                        <span className="icon">
                                            <span className="feather-icon">
                                                <Folder size={16} />
                                            </span>
                                        </span>
                                    </Button>
                                </Nav.Item>
                                <Nav.Item className="nav-link">
                                    <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover" title="Ayuda / Guía">
                                        <span className="icon">
                                            <span className="feather-icon">
                                                <HelpCircle size={16} />
                                            </span>
                                        </span>
                                    </Button>
                                </Nav.Item>
                            </Nav>
                        </div>
                    </div>
                </Nav>
                
                {/* Contenido Principal (Categorías) */}
                <div className="contactapp-content">
                    <div className="contactapp-detail-wrap">
                        {/* Header estilo Contacts Ficha */}
                        <header className="contact-header">
                            <div className="d-flex align-items-center justify-content-between w-100 me-3">
                                <div className="d-flex align-items-center gap-2">
                                    <Button 
                                        variant="light" 
                                        onClick={() => setShowSidebar(!showSidebar)}
                                        className="d-md-none p-1.5 border"
                                        style={{ borderRadius: '6px' }}
                                    >
                                        <Menu size={20} />
                                    </Button>
                                    <h1 className="fw-bold text-dark mb-0" style={{ fontSize: '1.25rem' }}>Ficha de Categorías</h1>
                                </div>
                                <div className="d-flex align-items-center gap-3">
                                    <nav aria-label="breadcrumb" className="d-none d-sm-block">
                                        <ol className="breadcrumb mb-0" style={{ fontSize: '0.85rem' }}>
                                            <li className="breadcrumb-item">Productos</li>
                                            <li className="breadcrumb-item active" aria-current="page">Categorías</li>
                                        </ol>
                                    </nav>
                                    <div className="contact-options-wrap">
                                        <div className="dropdown">
                                            <Button 
                                                variant="flush-dark" 
                                                className="btn-icon btn-rounded flush-soft-hover dropdown-toggle no-caret"
                                                data-bs-toggle="dropdown"
                                            >
                                                <span className="icon">
                                                    <span className="feather-icon">
                                                        {viewMode === 'list' ? <List size={16} /> : <Grid size={16} />}
                                                    </span>
                                                </span>
                                            </Button>
                                            <div className="dropdown-menu dropdown-menu-end">
                                                <button 
                                                    className={classNames("dropdown-item d-flex align-items-center gap-2", { "active": viewMode === 'list' })} 
                                                    onClick={() => setViewMode('list')}
                                                >
                                                    <List size={16} />
                                                    <span>List View</span>
                                                </button>
                                                <button 
                                                    className={classNames("dropdown-item d-flex align-items-center gap-2", { "active": viewMode === 'grid' })} 
                                                    onClick={() => setViewMode('grid')}
                                                >
                                                    <Grid size={16} />
                                                    <span>Grid View</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={classNames("hk-sidebar-togglable", { "active": showSidebar })} onClick={() => setShowSidebar(false)} />
                        </header>
                        
                        {/* Cuerpo de la Lista */}
                        <div className="contact-body">
                            <SimpleBar className="nicescroll-bar" style={{ height: 'calc(100vh - 210px)' }}>
                                <div className="contact-list-view px-4 py-3">
                                    
                                    {/* Toolbar de Filtros (Exacto al de ver productos) */}
                                    <Row className="mb-3">
                                        <Col xs={12} xxl={8} className="mb-3 mb-xxl-0">
                                            <div className="contact-toolbar-left flex-wrap gap-2">
                                                <Form.Group className="d-flex align-items-center mb-0">
                                                    <Form.Select 
                                                        size="sm" 
                                                        className="w-130p" 
                                                        value={filterStatus}
                                                        onChange={(e) => setFilterStatus(e.target.value)}
                                                    >
                                                        <option value="all">Todos los estados</option>
                                                        <option value="active">🟢 Activos</option>
                                                        <option value="inactive">🔴 Inactivos</option>
                                                    </Form.Select>
                                                </Form.Group>
                                                
                                                <Form.Group className="d-xxl-flex d-none align-items-center mb-0">
                                                    <Form.Select size="sm" className="w-120p" defaultValue="1">
                                                        <option value="1">Acciones lote</option>
                                                        <option value="2">Eliminar seleccionados</option>
                                                    </Form.Select>
                                                    <Button size="sm" variant="light" className="ms-2">Aplicar</Button>
                                                </Form.Group>

                                                <Form.Group className="d-xxl-flex d-none align-items-center mb-0">
                                                    <label className="flex-shrink-0 mb-0 me-2" style={{ fontSize: '0.82rem' }}>Ordenar:</label>
                                                    <Form.Select 
                                                        size="sm" 
                                                        className="w-130p"
                                                        value={sortBy}
                                                        onChange={(e) => setSortBy(e.target.value)}
                                                    >
                                                        <option value="id">Fecha Creado</option>
                                                        <option value="name">Nombre</option>
                                                    </Form.Select>
                                                </Form.Group>

                                                <Form.Select 
                                                    size="sm" 
                                                    className="d-flex align-items-center w-130p"
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === "excel") handleExportExcel();
                                                        e.target.value = "default";
                                                    }}
                                                    defaultValue="default"
                                                >
                                                    <option value="default" disabled hidden>Exportar CSV</option>
                                                    <option value="excel">📊 Exportar Excel</option>
                                                </Form.Select>

                                                <span className="text-muted align-self-center ms-2" style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                                                    {filteredCategories.length} categoría{filteredCategories.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </Col>
                                        <Col xs={12} xxl={4}>
                                            <div className="contact-toolbar-right justify-content-start justify-content-xxl-end">
                                                <div className="dataTables_filter mb-0">
                                                    <Form.Label className="mb-0">
                                                        <Form.Control
                                                            size="sm"
                                                            type="search"
                                                            placeholder="Buscar..."
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                            style={{ minWidth: '160px' }}
                                                        />
                                                    </Form.Label>
                                                </div>
                                                <div className="btn-group btn-group-sm ms-2">
                                                    <Button 
                                                        variant={viewMode === 'list' ? 'primary' : 'outline-secondary'} 
                                                        onClick={() => setViewMode('list')}
                                                        title="Vista de Lista"
                                                        className="d-flex align-items-center gap-1.5"
                                                    >
                                                        <List size={14} />
                                                        <span className="d-none d-xxl-inline">Lista</span>
                                                    </Button>
                                                    <Button 
                                                        variant={viewMode === 'grid' ? 'primary' : 'outline-secondary'} 
                                                        onClick={() => setViewMode('grid')}
                                                        title="Vista de Cuadrícula"
                                                        className="d-flex align-items-center gap-1.5"
                                                    >
                                                        <Grid size={14} />
                                                        <span className="d-none d-xxl-inline">Cuadrícula</span>
                                                    </Button>
                                                </div>
                                                <Button 
                                                    size="sm" 
                                                    variant="primary" 
                                                    className="ms-2 d-inline-flex align-items-center gap-1 fw-bold btn-rounded" 
                                                    onClick={handlePrepareAdd}
                                                >
                                                    <Plus size={14} />
                                                    <span>Nueva</span>
                                                </Button>
                                                <Button size="sm" variant="outline-secondary" className="ms-2" onClick={fetchCategories} title="Recargar">
                                                    🔄
                                                </Button>
                                            </div>
                                        </Col>
                                    </Row>
                                    
                                    {/* Grilla / Tabla */}
                                    {loading ? (
                                        <div className="text-center py-5">
                                            <Spinner animation="border" variant="primary" className="mb-2" />
                                            <p className="text-muted mb-0">Cargando categorías...</p>
                                        </div>
                                    ) : filteredCategories.length === 0 ? (
                                        <div className="text-center py-5 text-muted">
                                            <Inbox size={48} className="mb-2" />
                                            <p className="mb-0">No se encontraron categorías.</p>
                                        </div>
                                    ) : viewMode === 'grid' ? (
                                        <Row className="row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4 mb-5 animate-fade-in">
                                            {filteredCategories.map(cat => {
                                                const initials = (cat.nombre || '?')[0].toUpperCase();
                                                const count = products.filter(p => String(p.categoriaId) === String(cat.id)).length;
                                                return (
                                                    <Col key={cat.id}>
                                                        <Card className="h-100 border-0 shadow-sm transition-all hover-shadow" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                                                            {/* Status Badge */}
                                                            <div className="position-absolute top-0 start-0 m-2" style={{ zIndex: 2 }}>
                                                                {cat.activo !== false ? (
                                                                    <Badge bg="success" className="text-white fw-bold px-2.5 py-1 shadow-sm" style={{ borderRadius: '6px', fontSize: '0.72rem' }}>
                                                                        ACTIVO
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge bg="danger" className="text-white fw-bold px-2.5 py-1 shadow-sm" style={{ borderRadius: '6px', fontSize: '0.72rem' }}>
                                                                        INACTIVO
                                                                    </Badge>
                                                                )}
                                                            </div>

                                                            {/* Initials Avatar Container (Square Aspect Ratio) */}
                                                            <div className="bg-light d-flex justify-content-center align-items-center p-3 position-relative w-100" style={{ aspectRatio: '1/1', overflow: 'hidden' }}>
                                                                <div className="avatar avatar-xxl avatar-rounded avatar-soft-primary d-flex align-items-center justify-content-center" style={{ width: '90px', height: '90px', fontSize: '2.2rem', fontWeight: 'bold' }}>
                                                                    <span className="initial-wrap">{initials}</span>
                                                                </div>
                                                            </div>

                                                            {/* Card Content */}
                                                            <Card.Body className="d-flex flex-column justify-content-between p-3">
                                                                <div>
                                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                                        <Badge bg="primary-subtle" className="text-primary" style={{ borderRadius: '6px', fontSize: '0.72rem' }}>
                                                                            Categoría
                                                                        </Badge>
                                                                        <small className="text-secondary fw-semibold">ID: {cat.id}</small>
                                                                    </div>
                                                                    <h6 className="card-title fw-bold text-dark text-truncate mb-1">{cat.nombre}</h6>
                                                                    <p className="text-muted small text-truncate mb-2" style={{ maxHeight: '36px' }}>{cat.descripcion || 'Sin descripción.'}</p>
                                                                </div>

                                                                <div>
                                                                    <div className="d-flex justify-content-between align-items-center mb-2.5">
                                                                        <div className="price-display fw-semibold text-secondary" style={{ fontSize: '0.85rem' }}>
                                                                            📦 {count} producto{count !== 1 ? 's' : ''} asociado{count !== 1 ? 's' : ''}
                                                                        </div>
                                                                    </div>

                                                                    {/* Actions footer */}
                                                                    <div className="d-flex justify-content-end align-items-center pt-2 border-top gap-1.5">
                                                                        <Button 
                                                                            variant="flush-dark" 
                                                                            className="btn-icon btn-rounded btn-xs flush-soft-hover" 
                                                                            onClick={() => handlePrepareEdit(cat)}
                                                                            title="Editar"
                                                                        >
                                                                            <Edit size={15} />
                                                                        </Button>
                                                                        <Button 
                                                                            variant="flush-dark" 
                                                                            className="btn-icon btn-rounded btn-xs flush-soft-hover text-danger" 
                                                                            onClick={() => handleDelete(cat)}
                                                                            title="Eliminar"
                                                                        >
                                                                            <Trash size={15} />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </Card.Body>
                                                        </Card>
                                                    </Col>
                                                );
                                            })}
                                        </Row>
                                    ) : (
                                        <Table hover responsive className="align-middle mb-5">
                                            <thead className="table-light">
                                                <tr>
                                                    <th className="py-2.5" style={{ fontSize: '0.8rem', textTransform: 'uppercase', width: '220px' }}>Categoría</th>
                                                    <th className="py-2.5" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Descripción</th>
                                                    <th className="py-2.5" style={{ fontSize: '0.8rem', textTransform: 'uppercase', width: '120px' }}>Estado</th>
                                                    <th className="py-2.5 text-end" style={{ fontSize: '0.8rem', textTransform: 'uppercase', width: '100px' }}>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredCategories.map(cat => {
                                                    const initials = (cat.nombre || '?')[0].toUpperCase();
                                                    return (
                                                        <tr key={cat.id}>
                                                            <td>
                                                                <div className="media align-items-center">
                                                                    <div className="media-head me-2">
                                                                        <div className="avatar avatar-xs avatar-rounded avatar-soft-primary">
                                                                            <span className="initial-wrap">{initials}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="media-body">
                                                                        <span className="d-block text-high-em fw-semibold text-dark">{cat.nombre}</span>
                                                                        <small className="text-muted d-block" style={{ fontSize: '0.78rem' }}>ID: {cat.id}</small>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="text-muted">
                                                                {cat.descripcion || <span className="text-muted italic small">Sin descripción</span>}
                                                            </td>
                                                            <td>
                                                                {cat.activo !== false ? (
                                                                    <Badge bg="success-subtle" className="text-success px-2.5 py-1.5" style={{ borderRadius: '6px' }}>Activo</Badge>
                                                                ) : (
                                                                    <Badge bg="danger-subtle" className="text-danger px-2.5 py-1.5" style={{ borderRadius: '6px' }}>Inactivo</Badge>
                                                                )}
                                                            </td>
                                                            <td className="text-end">
                                                                <div className="d-inline-flex align-items-center">
                                                                    <Button 
                                                                        variant="flush-dark" 
                                                                        className="btn-icon btn-rounded flush-soft-hover" 
                                                                        title="Editar"
                                                                        onClick={() => handlePrepareEdit(cat)}
                                                                    >
                                                                        <span className="icon">
                                                                            <span className="feather-icon">
                                                                                <Edit size={16} />
                                                                            </span>
                                                                        </span>
                                                                    </Button>
                                                                    <Button 
                                                                        variant="flush-dark" 
                                                                        className="btn-icon btn-rounded flush-soft-hover text-danger" 
                                                                        title="Eliminar"
                                                                        onClick={() => handleDelete(cat)}
                                                                    >
                                                                        <span className="icon">
                                                                            <span className="feather-icon">
                                                                                <Trash size={16} />
                                                                            </span>
                                                                        </span>
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </Table>
                                    )}
                                </div>
                            </SimpleBar>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Categoría */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton className="border-bottom-0 pb-0">
                    <Modal.Title className="fw-bold" style={{ fontSize: '1.25rem' }}>
                        {modalMode === 'add' ? '🆕 Nueva Categoría' : '✏️ Editar Categoría'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSave}>
                    <Modal.Body className="pt-2 pb-4">
                        <Form.Group className="mb-3" controlId="catNombre">
                            <Form.Label className="small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.03em' }}>Nombre de la Categoría</Form.Label>
                            <Form.Control
                                type="text"
                                name="nombre"
                                value={formVal.nombre}
                                onChange={handleInputChange}
                                placeholder="Ej: Recargas, Accesorios, Bidones..."
                                required
                                style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="catDescripcion">
                            <Form.Label className="small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.03em' }}>Descripción</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="descripcion"
                                value={formVal.descripcion}
                                onChange={handleInputChange}
                                placeholder="Indica una breve descripción del tipo de productos en esta categoría..."
                                style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                            />
                        </Form.Group>

                        <Form.Group className="mb-1" controlId="catActivo">
                            <Form.Check 
                                type="switch"
                                name="activo"
                                id="cat-activo-switch"
                                label="Categoría Activa"
                                checked={formVal.activo}
                                onChange={handleInputChange}
                                className="fw-bold"
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer className="border-top-0 pt-0">
                        <Button variant="light" onClick={() => setShowModal(false)} className="px-4" style={{ borderRadius: '8px' }}>
                            Cerrar
                        </Button>
                        <Button 
                            variant="primary" 
                            type="submit" 
                            disabled={saving}
                            className="px-4 fw-bold shadow-none" 
                            style={{ borderRadius: '8px' }}
                        >
                            {saving ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    <span>Guardando...</span>
                                </>
                            ) : (
                                <span>Guardar Categoría</span>
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}
