"use client"
import React, { useState, useEffect } from 'react';
import { Row, Col, Table, Form, Button, Modal, Spinner, Badge, InputGroup, Nav, Card } from 'react-bootstrap';
import { Inbox, Archive, RefreshCw, Download, Upload, Plus, Edit, Trash, Settings, MoreVertical, Menu, Folder, HelpCircle, Package, Box, Search, List, Grid } from 'react-feather';
import SimpleBar from 'simplebar-react';
import classNames from 'classnames';
import Swal from 'sweetalert2';

const getApiBase = () => {
    if (typeof window !== 'undefined') {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        return `${protocol}//${hostname}:8080`;
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
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

export default function ProductosPage() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCatId, setSelectedCatId] = useState(null);
    const [filterType, setFilterType] = useState('all'); // 'all' | 'pack' | 'retorno'
    const [showSidebar, setShowSidebar] = useState(false);
    const [sortBy, setSortBy] = useState('created'); // 'created' | 'name' | 'price' | 'stock'
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'

    // Modal state for Product
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [saving, setSaving] = useState(false);
    const [formVal, setFormVal] = useState({
        id: null,
        codigo: '',
        nombre: '',
        descripcion: '',
        categoriaId: '',
        precioVenta: 0.0,
        stockActual: 0,
        imagen: '',
        esPack: false,
        requiereRetorno: false,
        activo: true,
        components: []
    });

    // Modal state for Import
    const [showImportModal, setShowImportModal] = useState(false);
    const [importProgress, setImportProgress] = useState(false);
    const [importMsg, setImportMsg] = useState('');

    const fetchCategories = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/categorias-producto`);
            if (res.ok) {
                const data = await res.json();
                setCategories(data.filter(c => c.activo !== false));
            }
        } catch (err) {
            console.error("Error loading categories:", err);
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/productos`);
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            } else {
                Swal.fire('Error', 'No se pudieron cargar los productos del servidor.', 'error');
            }
        } catch (err) {
            console.error("Error fetching products:", err);
            Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
        } finally {
            setLoading(false);
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

    // Convert file to Base64 for storing in DB
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormVal(prev => ({
                    ...prev,
                    imagen: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePrepareAdd = () => {
        setFormVal({
            id: null,
            codigo: '',
            nombre: '',
            descripcion: '',
            categoriaId: categories.length > 0 ? categories[0].id : '',
            precioVenta: 0.0,
            stockActual: 0,
            imagen: '',
            esPack: false,
            requiereRetorno: false,
            activo: true,
            components: []
        });
        setModalMode('add');
        setShowModal(true);
    };

    const handlePrepareEdit = async (prodId) => {
        try {
            const res = await fetch(`${API_BASE}/api/productos/${prodId}`);
            if (res.ok) {
                const d = await res.json();
                setFormVal({
                    id: d.id,
                    codigo: d.codigo || '',
                    nombre: d.nombre || '',
                    descripcion: d.descripcion || '',
                    categoriaId: d.categoriaId || '',
                    precioVenta: d.precioVenta || 0.0,
                    stockActual: d.stockActual || 0,
                    imagen: d.imagen || '',
                    esPack: d.esPack === true,
                    requiereRetorno: d.requiereRetorno === true,
                    activo: d.activo !== false,
                    components: d.components || []
                });
                setModalMode('edit');
                setShowModal(true);
            } else {
                Swal.fire('Error', 'No se pudo obtener la información del producto.', 'error');
            }
        } catch (err) {
            console.error("Error loading product details:", err);
            Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
        }
    };

    // Packs Composition Row Helpers
    const handleAddComponentRow = () => {
        setFormVal(prev => ({
            ...prev,
            components: [
                ...prev.components,
                { productoHijoId: '', cantidad: 1.0, nombre: '', requiereRetorno: false }
            ]
        }));
    };

    const handleRemoveComponentRow = (index) => {
        setFormVal(prev => ({
            ...prev,
            components: prev.components.filter((_, i) => i !== index)
        }));
    };

    const handleComponentChange = (index, field, value) => {
        setFormVal(prev => {
            const updated = [...prev.components];
            updated[index] = {
                ...updated[index],
                [field]: value
            };
            return {
                ...prev,
                components: updated
            };
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formVal.nombre.trim()) {
            Swal.fire('Atención', 'El nombre es obligatorio.', 'warning');
            return;
        }

        setSaving(true);
        try {
            const method = modalMode === 'add' ? 'POST' : 'PUT';
            const url = modalMode === 'add' 
                ? `${API_BASE}/api/productos` 
                : `${API_BASE}/api/productos/${formVal.id}`;

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formVal)
            });

            if (res.ok) {
                setShowModal(false);
                Swal.fire(
                    'Guardado', 
                    `El producto se ha ${modalMode === 'add' ? 'creado' : 'actualizado'} correctamente.`, 
                    'success'
                );
                fetchProducts();
            } else {
                const errData = await res.json();
                Swal.fire('Error', errData.message || 'Error al guardar el producto.', 'error');
            }
        } catch (err) {
            console.error("Error saving product:", err);
            Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (prod) => {
        const result = await Swal.fire({
            title: `¿Eliminar el producto "${prod.nombre}"?`,
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
                const res = await fetch(`${API_BASE}/api/productos/${prod.id}`, {
                    method: 'DELETE'
                });

                if (res.ok) {
                    Swal.fire('Eliminado', 'El producto ha sido eliminado.', 'success');
                    fetchProducts();
                } else {
                    const errData = await res.json();
                    Swal.fire('Error', errData.message || 'Error en el servidor al intentar eliminar.', 'error');
                }
            } catch (err) {
                console.error("Error deleting product:", err);
                Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
            }
        }
    };

    // Excel Export
    const handleExportExcel = async () => {
        if (products.length === 0) {
            Swal.fire('Atención', 'No hay productos para exportar.', 'info');
            return;
        }

        const XLSX = await loadSheetJS();
        
        const data = products.map(p => ({
            'Código (SKU)': p.codigo || '-',
            'Nombre': p.nombre,
            'Categoría': p.categoriaNombre || 'Sin categoría',
            'Precio Venta': parseFloat(p.precioVenta),
            'Stock Actual': parseInt(p.stockActual),
            'Es Pack': p.esPack ? 'SÍ' : 'NO',
            'Requiere Préstamo': p.requiereRetorno ? 'SÍ' : 'NO',
            'Descripción': p.descripcion || '-'
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Productos");
        XLSX.writeFile(wb, `Catalogo_Productos_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    // Download Sample Import Template
    const handleDownloadTemplate = async () => {
        const XLSX = await loadSheetJS();

        const sampleData = [
            {
                'Codigo': 'PROD-001',
                'Nombre': 'Recarga Agua 20L',
                'Categoria': 'AGUA 20L',
                'Precio': '12.00',
                'Stock': '50',
                'Descripcion': 'Recarga de bidón de 20 litros'
            },
            {
                'Codigo': 'PACK-001',
                'Nombre': 'Pack 5 Recargas',
                'Categoria': 'PACKS',
                'Precio': '55.00',
                'Stock': '0',
                'Descripcion': 'Pack promocional de 5 recargas'
            }
        ];

        const ws = XLSX.utils.json_to_sheet(sampleData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Plantilla Productos");
        XLSX.writeFile(wb, "Plantilla_Carga_Productos.xlsx");
    };

    // Excel file parsing and uploading
    const handleImportFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImportProgress(true);
        setImportMsg('Leyendo archivo Excel...');

        try {
            const XLSX = await loadSheetJS();
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.SheetNames[0];
                    const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);

                    if (jsonData.length === 0) {
                        Swal.fire('Error', 'El archivo Excel está vacío.', 'error');
                        setImportProgress(false);
                        return;
                    }

                    setImportMsg(`Enviando ${jsonData.length} productos al servidor...`);

                    const res = await fetch(`${API_BASE}/api/productos/import`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(jsonData)
                    });

                    const resData = await res.json();
                    if (res.ok && resData.status === 'success') {
                        setShowImportModal(false);
                        Swal.fire('¡Éxito!', resData.message, 'success');
                        fetchProducts();
                        fetchCategories();
                    } else {
                        Swal.fire('Error de Importación', resData.message || 'Error al procesar el archivo en el servidor.', 'error');
                    }
                } catch (err) {
                    console.error("Error reading file stream:", err);
                    Swal.fire('Error', 'Error al procesar los datos del archivo.', 'error');
                } finally {
                    setImportProgress(false);
                }
            };
            reader.readAsArrayBuffer(file);
        } catch (err) {
            console.error("Error loading Excel engine:", err);
            Swal.fire('Error', 'No se pudo cargar la librería de importación de Excel.', 'error');
            setImportProgress(false);
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = 
            (p.nombre && p.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.codigo && p.codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.descripcion && p.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesCategory = 
            !selectedCatId || 
            (p.categoriaId && String(p.categoriaId) === String(selectedCatId));

        let matchesType = true;
        if (filterType === 'pack') {
            matchesType = p.esPack === true;
        } else if (filterType === 'retorno') {
            matchesType = p.requiereRetorno === true;
        }

        return matchesSearch && matchesCategory && matchesType;
    }).sort((a, b) => {
        if (sortBy === 'name') {
            return (a.nombre || '').localeCompare(b.nombre || '');
        }
        if (sortBy === 'price') {
            return (a.precioVenta || 0) - (b.precioVenta || 0);
        }
        if (sortBy === 'stock') {
            return (a.stockActual || 0) - (b.stockActual || 0);
        }
        return (b.id || 0) - (a.id || 0);
    });

    return (
        <div className="hk-pg-body py-0">
            <div className={classNames("contactapp-wrap", { "contactapp-sidebar-toggle": showSidebar })}>
                {/* Sidebar Izquierda (Categorías y Filtros) */}
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
                                <span>Crear Producto</span>
                            </Button>
                            
                            <div className="menu-group">
                                <Nav className="nav-light navbar-nav flex-column">
                                    <Nav.Item>
                                        <Nav.Link 
                                            active={filterType === 'all' && !selectedCatId} 
                                            onClick={() => { setFilterType('all'); setSelectedCatId(null); }}
                                        >
                                            <span className="nav-icon-wrap">
                                                <span className="feather-icon">
                                                    <Inbox size={16} />
                                                </span>
                                            </span>
                                            <span className="nav-link-text">Todos los Productos</span>
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link 
                                            active={filterType === 'pack'} 
                                            onClick={() => { setFilterType('pack'); setSelectedCatId(null); }}
                                        >
                                            <span className="nav-icon-wrap">
                                                <span className="feather-icon">
                                                    <Box size={16} />
                                                </span>
                                            </span>
                                            <span className="nav-link-text">Packs / Combos</span>
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link 
                                            active={filterType === 'retorno'} 
                                            onClick={() => { setFilterType('retorno'); setSelectedCatId(null); }}
                                        >
                                            <span className="nav-icon-wrap">
                                                <span className="feather-icon">
                                                    <RefreshCw size={16} />
                                                </span>
                                            </span>
                                            <span className="nav-link-text">Requiere Retorno</span>
                                        </Nav.Link>
                                    </Nav.Item>
                                </Nav>
                            </div>
                            
                            <div className="separator separator-light" />
                            <div className="d-flex align-items-center justify-content-between mb-2">
                                <div className="title-sm text-primary mb-0" style={{ fontWeight: 600 }}>Categorías</div>
                            </div>
                            
                            <div className="menu-group">
                                <Nav className="nav-light navbar-nav flex-column">
                                    {categories.map(c => {
                                        const count = products.filter(p => String(p.categoriaId) === String(c.id)).length;
                                        return (
                                            <Nav.Item key={c.id}>
                                                <Nav.Link 
                                                    active={selectedCatId === c.id} 
                                                    onClick={() => { setSelectedCatId(c.id); setFilterType('all'); }}
                                                    className="link-badge-right"
                                                >
                                                    <span className="nav-link-text">{c.nombre}</span>
                                                    <span className="badge badge-pill badge-sm badge-soft-primary ms-auto">{count}</span>
                                                </Nav.Link>
                                            </Nav.Item>
                                        );
                                    })}
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
                                    <Nav.Item>
                                        <Nav.Link onClick={() => { setImportProgress(false); setImportMsg(''); setShowImportModal(true); }}>
                                            <span className="nav-icon-wrap">
                                                <span className="feather-icon">
                                                    <Upload size={16} />
                                                </span>
                                            </span>
                                            <span className="nav-link-text">Importar Excel</span>
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
                                    <Button variant="flush-dark" as="a" href="/productos/categorias" className="btn-icon btn-rounded flush-soft-hover" title="Administrar Categorías">
                                        <span className="icon">
                                            <span className="feather-icon">
                                                <Settings size={16} />
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
                
                {/* Contenido Principal (Catálogo de Productos) */}
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
                                    <h1 className="fw-bold text-dark mb-0" style={{ fontSize: '1.25rem' }}>Ficha de Catálogo</h1>
                                </div>
                                <div className="d-flex align-items-center gap-3">
                                    <nav aria-label="breadcrumb" className="d-none d-sm-block">
                                        <ol className="breadcrumb mb-0" style={{ fontSize: '0.85rem' }}>
                                            <li className="breadcrumb-item">Productos</li>
                                            <li className="breadcrumb-item active" aria-current="page">Catálogo</li>
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
                                    
                                    {/* Toolbar de Filtros (Estilo Contactos) */}
                                    <Row className="mb-3">
                                        <Col xs={12} xxl={8} className="mb-3 mb-xxl-0">
                                            <div className="contact-toolbar-left flex-wrap gap-2">
                                                <Form.Group className="d-flex align-items-center mb-0">
                                                    <Form.Select 
                                                        size="sm" 
                                                        className="w-130p" 
                                                        value={filterType}
                                                        onChange={(e) => setFilterType(e.target.value)}
                                                    >
                                                        <option value="all">Todos los tipos</option>
                                                        <option value="pack">📦 Packs / Combos</option>
                                                        <option value="retorno">🔄 Requiere Retorno</option>
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
                                                        <option value="created">Fecha Creado</option>
                                                        <option value="name">Nombre</option>
                                                        <option value="price">Precio Venta</option>
                                                        <option value="stock">Stock Actual</option>
                                                    </Form.Select>
                                                </Form.Group>

                                                <Form.Select 
                                                    size="sm" 
                                                    className="d-flex align-items-center w-130p"
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === "excel") handleExportExcel();
                                                        else if (val === "template") handleDownloadTemplate();
                                                        else if (val === "import") {
                                                            setImportProgress(false);
                                                            setImportMsg('');
                                                            setShowImportModal(true);
                                                        }
                                                        e.target.value = "default";
                                                    }}
                                                    defaultValue="default"
                                                >
                                                    <option value="default" disabled hidden>Exportar CSV</option>
                                                    <option value="excel">📊 Exportar Excel</option>
                                                    <option value="template">📋 Descargar Plantilla</option>
                                                    <option value="import">📥 Importar Excel</option>
                                                </Form.Select>

                                                <span className="text-muted align-self-center ms-2" style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                                                    {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''}
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
                                                    <span>Nuevo</span>
                                                </Button>
                                                <Button size="sm" variant="outline-secondary" className="ms-2" onClick={fetchProducts} title="Recargar">
                                                    🔄
                                                </Button>
                                            </div>
                                        </Col>
                                    </Row>
                                    
                                    {/* Grilla / Tabla / Grid View */}
                                    {loading ? (
                                        <div className="text-center py-5">
                                            <Spinner animation="border" variant="primary" className="mb-2" />
                                            <p className="text-muted mb-0">Cargando productos...</p>
                                        </div>
                                    ) : filteredProducts.length === 0 ? (
                                        <div className="text-center py-5 text-muted">
                                            <Inbox size={48} className="mb-2" />
                                            <p className="mb-0">No se encontraron productos.</p>
                                        </div>
                                    ) : viewMode === 'grid' ? (
                                        <Row className="row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4 mb-5 animate-fade-in">
                                            {filteredProducts.map(p => (
                                                <Col key={p.id}>
                                                    <Card className="h-100 border-0 shadow-sm transition-all hover-shadow" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                                                        {/* Badge de tipo pack o retorno */}
                                                        <div className="position-absolute top-0 start-0 m-2 d-flex flex-column gap-1" style={{ zIndex: 2 }}>
                                                            {p.esPack && (
                                                                <Badge bg="purple" className="text-white fw-bold px-2.5 py-1 shadow-sm" style={{ borderRadius: '6px', fontSize: '0.72rem' }}>
                                                                    📦 PACK
                                                                </Badge>
                                                            )}
                                                            {p.requiereRetorno && (
                                                                <Badge bg="warning" className="text-dark fw-bold px-2.5 py-1 shadow-sm" style={{ borderRadius: '6px', fontSize: '0.72rem' }}>
                                                                    🔄 RETORNABLE
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        {/* Imagen Container (Square Aspect Ratio) */}
                                                        <div className="bg-light d-flex justify-content-center align-items-center p-3 position-relative w-100" style={{ aspectRatio: '1/1', overflow: 'hidden' }}>
                                                            <img 
                                                                src={p.imagen || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-package"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>'} 
                                                                alt={p.nombre} 
                                                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-package"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>';
                                                                }}
                                                            />
                                                        </div>

                                                        {/* Contenido */}
                                                        <Card.Body className="d-flex flex-column justify-content-between p-3">
                                                            <div>
                                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                                    <Badge bg="primary-subtle" className="text-primary" style={{ borderRadius: '6px', fontSize: '0.72rem' }}>
                                                                        {p.categoriaNombre || 'Sin categoría'}
                                                                    </Badge>
                                                                    <small className="text-secondary fw-semibold">SKU: {p.codigo || '-'}</small>
                                                                </div>
                                                                <h6 className="card-title fw-bold text-dark text-truncate mb-1">{p.nombre}</h6>
                                                                <p className="text-muted small text-truncate mb-2" style={{ maxHeight: '36px' }}>{p.descripcion || 'Sin descripción.'}</p>
                                                            </div>

                                                            <div>
                                                                <div className="d-flex justify-content-between align-items-center mb-2.5">
                                                                    <div className="price-display fw-bold text-primary" style={{ fontSize: '1.1rem' }}>
                                                                        S/ {(p.precioVenta || 0.0).toFixed(2)}
                                                                    </div>
                                                                    <div className="stock-display">
                                                                        <span className={`badge px-2 py-1.5 ${p.stockActual < 5 ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'}`} style={{ borderRadius: '6px', fontSize: '0.72rem' }}>
                                                                            Stock: {p.stockActual}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Botones de acción footer */}
                                                                <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                                                                    <small className="text-muted">ID: {p.id}</small>
                                                                    <div className="d-flex gap-1.5">
                                                                        <Button 
                                                                            variant="flush-dark" 
                                                                            className="btn-icon btn-rounded btn-xs flush-soft-hover" 
                                                                            onClick={() => handlePrepareEdit(p.id)}
                                                                            title="Editar"
                                                                        >
                                                                            <Edit size={15} />
                                                                        </Button>
                                                                        <Button 
                                                                            variant="flush-dark" 
                                                                            className="btn-icon btn-rounded btn-xs flush-soft-hover text-danger" 
                                                                            onClick={() => handleDelete(p)}
                                                                            title="Eliminar"
                                                                        >
                                                                            <Trash size={15} />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </Card.Body>
                                                    </Card>
                                                </Col>
                                            ))}
                                        </Row>
                                    ) : (
                                        <Table hover responsive className="align-middle mb-5">
                                            <thead className="table-light">
                                                <tr>
                                                    <th className="py-2.5" style={{ fontSize: '0.8rem', textTransform: 'uppercase', width: '250px' }}>Producto</th>
                                                    <th className="py-2.5" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Código (SKU)</th>
                                                    <th className="py-2.5" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Categoría</th>
                                                    <th className="py-2.5" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Precio</th>
                                                    <th className="py-2.5" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Stock</th>
                                                    <th className="py-2.5 text-end" style={{ fontSize: '0.8rem', textTransform: 'uppercase', width: '100px' }}>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredProducts.map(p => (
                                                    <tr key={p.id}>
                                                        <td>
                                                            <div className="media align-items-center">
                                                                <div className="media-head me-2">
                                                                    {p.imagen ? (
                                                                        <div className="avatar avatar-xs avatar-rounded">
                                                                            <img 
                                                                                src={p.imagen} 
                                                                                alt={p.nombre} 
                                                                                className="avatar-img"
                                                                                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                                                                onError={(e) => {
                                                                                    e.target.onerror = null;
                                                                                    e.target.style.display = 'none';
                                                                                    e.target.parentNode.innerHTML = '<div class="avatar avatar-xs avatar-rounded avatar-soft-primary"><span class="initial-wrap">📦</span></div>';
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="avatar avatar-xs avatar-rounded avatar-soft-primary">
                                                                            <span className="initial-wrap">📦</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="media-body">
                                                                    <span className="d-block text-high-em fw-semibold text-dark">{p.nombre}</span>
                                                                    {p.descripcion && (
                                                                        <span className="d-block text-muted small text-truncate" style={{ maxWidth: '220px' }}>
                                                                            {p.descripcion}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <Badge bg="light" className="text-secondary px-2 py-1.5 fw-semibold border" style={{ borderRadius: '6px', fontSize: '0.78rem' }}>
                                                                {p.codigo || '-'}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            <Badge bg="primary-subtle" className="text-primary px-2.5 py-1.5" style={{ borderRadius: '6px' }}>
                                                                {p.categoriaNombre || 'Sin categoría'}
                                                            </Badge>
                                                        </td>
                                                        <td className="fw-bold text-dark">
                                                            S/ {(p.precioVenta || 0.0).toFixed(2)}
                                                        </td>
                                                        <td>
                                                            <span className={`fw-bold ${p.stockActual < 5 ? 'text-danger' : 'text-success'}`}>
                                                                {p.stockActual}
                                                            </span>
                                                        </td>
                                                        <td className="text-end">
                                                            <div className="d-inline-flex align-items-center">
                                                                <Button 
                                                                    variant="flush-dark" 
                                                                    className="btn-icon btn-rounded flush-soft-hover" 
                                                                    title="Editar"
                                                                    onClick={() => handlePrepareEdit(p.id)}
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
                                                                    onClick={() => handleDelete(p)}
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
                                                ))}
                                            </tbody>
                                        </Table>
                                    )}
                                </div>
                            </SimpleBar>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Producto / Pack */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
                <Modal.Header closeButton className="border-bottom-0 pb-0">
                    <Modal.Title className="fw-bold" style={{ fontSize: '1.25rem' }}>
                        {modalMode === 'add' ? '🆕 Nuevo Producto' : '✏️ Editar Producto'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSave}>
                    <Modal.Body className="pt-2 pb-4">
                        <Row>
                            {/* Panel Izquierdo: Foto del producto */}
                            <Col md={4} className="text-center mb-3 mb-md-0">
                                <Form.Label className="small fw-bold text-uppercase text-muted d-block text-start mb-2" style={{ letterSpacing: '0.03em' }}>Imagen del Producto</Form.Label>
                                <div className="p-2 border bg-light rounded mb-3 text-center d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                                    <img 
                                        src={formVal.imagen || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-package"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>'} 
                                        alt="Preview" 
                                        className="img-fluid rounded" 
                                        style={{ maxHeight: '180px', objectFit: 'contain' }}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-package"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>';
                                        }}
                                    />
                                </div>
                                <Form.Group controlId="prodFile">
                                    <Form.Control 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleFileChange} 
                                        className="form-control-sm border-0 bg-light"
                                        style={{ borderRadius: '6px' }}
                                    />
                                </Form.Group>
                            </Col>

                            {/* Panel Derecho: Información General */}
                            <Col md={8}>
                                <Row className="g-2 mb-3">
                                    <Col sm={6}>
                                        <Form.Group controlId="prodCodigo">
                                            <Form.Label className="small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.03em' }}>Código (SKU)</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="codigo"
                                                value={formVal.codigo}
                                                onChange={handleInputChange}
                                                placeholder="Ej: E_B20LSN"
                                                style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col sm={6}>
                                        <Form.Group controlId="prodNombre">
                                            <Form.Label className="small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.03em' }}>Nombre</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="nombre"
                                                value={formVal.nombre}
                                                onChange={handleInputChange}
                                                placeholder="Ej: Recarga Bidón 20L sin Caño"
                                                required
                                                style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3" controlId="prodCategoriaId">
                                    <Form.Label className="small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.03em' }}>Categoría</Form.Label>
                                    <Form.Select
                                        name="categoriaId"
                                        value={formVal.categoriaId}
                                        onChange={handleInputChange}
                                        required
                                        style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                                    >
                                        <option value="">Seleccione una categoría...</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.nombre}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>

                                <Row className="g-2 mb-3">
                                    <Col sm={6}>
                                        <Form.Group controlId="prodPrecioVenta">
                                            <Form.Label className="small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.03em' }}>Precio Venta (S/)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                name="precioVenta"
                                                value={formVal.precioVenta}
                                                onChange={handleInputChange}
                                                placeholder="0.00"
                                                style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col sm={6}>
                                        <Form.Group controlId="prodStockActual">
                                            <Form.Label className="small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.03em' }}>Stock Actual</Form.Label>
                                            <Form.Control
                                                type="number"
                                                name="stockActual"
                                                value={formVal.stockActual}
                                                onChange={handleInputChange}
                                                placeholder="0"
                                                style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <div className="d-flex gap-4 mb-3 align-items-center">
                                    <Form.Group controlId="prodEsPack">
                                        <Form.Check 
                                            type="switch"
                                            name="esPack"
                                            id="es-pack-switch"
                                            label="Es un Pack"
                                            checked={formVal.esPack}
                                            onChange={(e) => {
                                                const isChecked = e.target.checked;
                                                setFormVal(prev => ({
                                                    ...prev,
                                                    esPack: isChecked,
                                                    components: isChecked ? (prev.components.length > 0 ? prev.components : [{ productoHijoId: '', cantidad: 1.0 }]) : []
                                                }));
                                            }}
                                            className="fw-bold"
                                        />
                                    </Form.Group>
                                    <Form.Group controlId="prodRequiereRetorno">
                                        <Form.Check 
                                            type="switch"
                                            name="requiereRetorno"
                                            id="requiere-retorno-switch"
                                            label="Requiere Retorno (Préstamo)"
                                            checked={formVal.requiereRetorno}
                                            onChange={handleInputChange}
                                            className="fw-bold text-primary"
                                        />
                                    </Form.Group>
                                </div>

                                {/* Sección Composición del Pack */}
                                {formVal.esPack && (
                                    <div className="bg-light p-3 rounded border mb-3">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <span className="small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.02em' }}>Composición del Pack (Packs e Items)</span>
                                            <Button variant="primary" size="sm" type="button" onClick={handleAddComponentRow} style={{ borderRadius: '6px' }}>
                                                + Ítem
                                            </Button>
                                        </div>
                                        {formVal.components.length === 0 ? (
                                            <p className="text-muted small mb-0">Agregue elementos hijos a este pack.</p>
                                        ) : (
                                            formVal.components.map((comp, idx) => (
                                                <Row key={idx} className="g-1 mb-2 align-items-center">
                                                    <Col xs={8}>
                                                        <Form.Select
                                                            size="sm"
                                                            value={comp.productoHijoId || ''}
                                                            onChange={(e) => handleComponentChange(idx, 'productoHijoId', Number(e.target.value))}
                                                            style={{ borderRadius: '6px' }}
                                                            required
                                                        >
                                                            <option value="">Seleccione producto...</option>
                                                            {products.filter(p => p.id !== formVal.id && p.esPack !== true).map(p => (
                                                                <option key={p.id} value={p.id}>{p.nombre}</option>
                                                            ))}
                                                        </Form.Select>
                                                    </Col>
                                                    <Col xs={3}>
                                                        <Form.Control
                                                            type="number"
                                                            size="sm"
                                                            value={comp.cantidad}
                                                            onChange={(e) => handleComponentChange(idx, 'cantidad', parseFloat(e.target.value))}
                                                            style={{ borderRadius: '6px' }}
                                                            min="0.1"
                                                            step="0.1"
                                                            required
                                                        />
                                                    </Col>
                                                    <Col xs={1} className="text-end">
                                                        <Button 
                                                            variant="link" 
                                                            type="button" 
                                                            onClick={() => handleRemoveComponentRow(idx)}
                                                            className="text-danger p-0"
                                                        >
                                                            <Trash size={16} />
                                                        </Button>
                                                    </Col>
                                                </Row>
                                            ))
                                        )}
                                    </div>
                                )}

                                <Form.Group controlId="prodDescripcion">
                                    <Form.Label className="small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.03em' }}>Descripción</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        name="descripcion"
                                        value={formVal.descripcion}
                                        onChange={handleInputChange}
                                        placeholder="Características del producto..."
                                        style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
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
                                <span>Guardar Producto</span>
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Modal de Importación Excel */}
            <Modal show={showImportModal} onHide={() => setShowImportModal(false)} centered>
                <Modal.Header closeButton className="border-bottom-0 pb-0">
                    <Modal.Title className="fw-bold" style={{ fontSize: '1.25rem' }}>
                        📥 Importar Productos desde Excel
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4 text-center">
                    <p className="text-muted small mb-4">
                        Asegúrese de que el archivo contiene las columnas de la plantilla. Las categorías nuevas se crearán de forma automática.
                    </p>
                    <Button variant="outline-primary" size="sm" className="mb-4 fw-semibold btn-rounded" onClick={handleDownloadTemplate} style={{ borderRadius: '8px' }}>
                        <Download size={14} className="me-1" />
                        Descargar Plantilla de Muestra
                    </Button>

                    <div 
                        className="border border-dashed p-4 rounded bg-light" 
                        style={{ cursor: 'pointer' }}
                        onClick={() => document.getElementById('excelFileInput').click()}
                    >
                        <Package size={48} className="text-muted mb-2 d-block mx-auto" />
                        <h6 className="mb-1 fw-bold">Seleccionar archivo Excel</h6>
                        <small className="text-muted">Formatos admitidos: .xlsx, .xls</small>
                        <input 
                            type="file" 
                            id="excelFileInput" 
                            accept=".xlsx, .xls"
                            className="d-none" 
                            onChange={handleImportFileChange}
                            onClick={(e) => { e.target.value = null; }}
                        />
                    </div>

                    {importProgress && (
                        <div className="mt-3 text-center">
                            <Spinner animation="border" size="sm" variant="primary" className="me-2" />
                            <span className="small fw-semibold text-primary">{importMsg}</span>
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
}
