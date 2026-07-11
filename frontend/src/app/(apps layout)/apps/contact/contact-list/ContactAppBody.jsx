'use client';
import { useState, useEffect, useCallback } from 'react';
import SimpleBar from 'simplebar-react';
import { Button, Col, Form, Row, Badge, Spinner } from 'react-bootstrap';
import Link from 'next/link';
import HkDataTable from '@/components/@hk-data-table';
import { Edit, Trash, Eye, List, Map, MessageSquare } from 'react-feather';
import ContactsMap from './ContactsMap';
import dynamic from 'next/dynamic';

const ContactLiveChats = dynamic(() => import('./ContactLiveChats'), {
    ssr: false,
    loading: () => (
        <div className="text-center py-5">
            <Spinner animation="border" className="text-primary" />
            <p className="mt-2 text-muted">Cargando chats en vivo...</p>
        </div>
    )
});

const getApiBase = () => {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
        return `${window.location.protocol}//${hostname}:8081`;
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8081';
};
const API_BASE = getApiBase();

const ContactAppBody = ({ reloadRef, viewMode, setViewMode }) => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTipo, setFilterTipo] = useState('');

    const loadContacts = useCallback(() => {
        setLoading(true);
        fetch(`${API_BASE}/api/contacts`)
            .then(r => r.json())
            .then(data => setContacts(Array.isArray(data) ? data : []))
            .catch(() => setContacts([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { loadContacts(); }, [loadContacts]);

    useEffect(() => {
        if (reloadRef) reloadRef.current = loadContacts;
    }, [reloadRef, loadContacts]);

    const handleStarredChange = async (row) => {
        await fetch(`${API_BASE}/api/contacts/${row.id}/star`, { method: 'PUT' });
        loadContacts();
    };

    const handleDelete = async (id, displayName) => {
        if (!window.confirm(`¿Eliminar a "${displayName}"?`)) return;
        await fetch(`${API_BASE}/api/contacts/${id}`, { method: 'DELETE' });
        loadContacts();
    };

    const filtered = contacts.filter(c => {
        const nombre = c.tipoPersona === 'NATURAL'
            ? `${c.nombres || ''} ${c.apellidos || ''}`.toLowerCase()
            : (c.razonSocial || '').toLowerCase();
        const matchSearch = nombre.includes(searchTerm.toLowerCase())
            || (c.numeroDocumento || '').includes(searchTerm)
            || (c.telefonoPrincipal || '').includes(searchTerm)
            || (c.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchTipo = !filterTipo || c.tipoPersona === filterTipo;
        return matchSearch && matchTipo;
    });

    const tableData = filtered.map(c => {
        const displayName = c.tipoPersona === 'NATURAL'
            ? `${c.nombres || ''} ${c.apellidos || ''}`.trim()
            : (c.razonSocial || '');
        
        const initials = c.tipoPersona === 'NATURAL'
            ? `${(c.nombres || '?')[0]}${(c.apellidos || '?')[0]}`
            : (c.razonSocial || '?')[0];
        
        const colors = ['info', 'warning', 'success', 'danger', 'primary', 'violet'];
        const avtBg = colors[(c.id || 0) % colors.length];

        return {
            id: c.id,
            starred: c.starred || false,
            nameData: {
                id: c.id,
                displayName,
                initials: initials.toUpperCase(),
                avtBg,
                toString() { return this.displayName; }
            },
            document: {
                tipo: c.tipoDocumento || 'DNI',
                numero: c.numeroDocumento || '',
                toString() { return `${this.tipo} ${this.numero}`; }
            },
            empresa: {
                id: c.empresaId,
                nombre: c.empresaNombre || '',
                toString() { return this.nombre; }
            },
            email: c.email || '',
            phone: c.telefonoPrincipal || '',
            dateCreated: c.dateCreated
                ? new Date(c.dateCreated).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : '—',
            actionData: { id: c.id, displayName }
        };
    });

    const columns = [
        {
            accessor: "id",
            title: "ID",
            hidden: true,
        },
        {
            accessor: "starred",
            title: "",
            hidden: true,
        },
        {
            accessor: "nameData",
            title: "Nombre / Razón Social",
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
                            <Link href={`/apps/contact/view-contact?id=${nameData.id}`} className="d-block text-high-em fw-semibold text-primary">
                                {nameData.displayName}
                            </Link>
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
            accessor: "empresa",
            title: "Empresa Vinculada",
            sort: true,
            cellFormatter: (empresa) => {
                if (empresa.nombre) {
                    return (
                        <Link href={`/apps/contact/view-contact?id=${empresa.id}`} className="text-primary fw-semibold" style={{ fontSize: '0.82rem' }}>
                            🏢 {empresa.nombre}
                        </Link>
                    );
                }
                return <span className="text-muted">—</span>;
            }
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
                <span className="text-nowrap">📱 +51 {phone}</span>
            ) : <span className="text-muted">—</span>,
        },
        {
            accessor: "dateCreated",
            title: "Creado",
            sort: true,
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
                                as={Link} 
                                href={`/apps/contact/view-contact?id=${actionData.id}`} 
                                className="btn-icon btn-rounded flush-soft-hover" 
                                title="Ver Detalles"
                            >
                                <span className="icon">
                                    <span className="feather-icon">
                                        <Eye size={16} />
                                    </span>
                                </span>
                            </Button>
                            <Button 
                                variant="flush-dark" 
                                as={Link} 
                                href={`/apps/contact/edit-contact?id=${actionData.id}`} 
                                className="btn-icon btn-rounded flush-soft-hover" 
                                title="Editar"
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
                    {/* Toolbar */}
                    <Row className="mb-3" >
                        <Col xs={12} xxl={8} className="mb-3 mb-xxl-0">
                            <div className="contact-toolbar-left flex-wrap gap-2">
                                <Form.Group className="d-flex align-items-center mb-0">
                                    <Form.Select size='sm' className="w-130p" value={filterTipo}
                                        onChange={e => setFilterTipo(e.target.value)}>
                                        <option value="">Todos los tipos</option>
                                        <option value="NATURAL">👤 Persona Natural</option>
                                        <option value="EMPRESA">🏢 Empresa</option>
                                    </Form.Select>
                                </Form.Group>
                                <Form.Group className="d-xxl-flex d-none align-items-center mb-0">
                                    <Form.Select size='sm' className="w-120p">
                                        <option value={1}>Acciones lote</option>
                                        <option value={2}>Editar</option>
                                        <option value={3}>Eliminar</option>
                                    </Form.Select>
                                    <Button size="sm" variant="light" className="ms-2">Aplicar</Button>
                                </Form.Group>
                                <Form.Group className="d-xxl-flex d-none align-items-center mb-0">
                                    <label className="flex-shrink-0 mb-0 me-2">Ordenar:</label>
                                    <Form.Select size='sm' className="w-130p">
                                        <option value={1}>Fecha Creado</option>
                                        <option value={2}>Nombre</option>
                                        <option value={3}>Frecuentes</option>
                                    </Form.Select>
                                </Form.Group>
                                <Form.Select size="sm" className="d-flex align-items-center w-130p">
                                    <option value={1}>Exportar CSV</option>
                                    <option value={2}>Exportar PDF</option>
                                </Form.Select>
                                <span className="text-muted align-self-center ms-2" style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                                    {filtered.length} contacto{filtered.length !== 1 ? 's' : ''}
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
                                            onChange={e => setSearchTerm(e.target.value)}
                                            style={{ minWidth: '200px' }}
                                        />
                                    </Form.Label>
                                </div>
                                <div className="btn-group btn-group-sm ms-2">
                                    <Button 
                                        variant={viewMode === 'list' ? 'primary' : 'outline-secondary'} 
                                        onClick={() => setViewMode('list')}
                                        title="Vista de Lista"
                                        className="d-flex align-items-center justify-content-center"
                                        style={{ width: '36px', height: '32px' }}
                                    >
                                        <List size={16} />
                                    </Button>
                                    <Button 
                                        variant={viewMode === 'map' ? 'primary' : 'outline-secondary'} 
                                        onClick={() => setViewMode('map')}
                                        title="Vista de Mapa"
                                        className="d-flex align-items-center justify-content-center"
                                        style={{ width: '36px', height: '32px' }}
                                    >
                                        <Map size={16} />
                                    </Button>
                                    <Button 
                                        variant={viewMode === 'chats' ? 'primary' : 'outline-secondary'} 
                                        onClick={() => setViewMode('chats')}
                                        title="Vista de Chats en Vivo"
                                        className="d-flex align-items-center justify-content-center"
                                        style={{ width: '36px', height: '32px' }}
                                    >
                                        <MessageSquare size={16} />
                                    </Button>
                                </div>
                                <Button size="sm" variant="outline-secondary" className="ms-2" onClick={loadContacts} title="Recargar">
                                    🔄
                                </Button>
                            </div>
                        </Col>
                    </Row>

                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" />
                            <p className="mt-2 text-muted">Cargando contactos...</p>
                        </div>
                    ) : viewMode === 'map' ? (
                        <ContactsMap contacts={filtered} />
                    ) : viewMode === 'chats' ? (
                        <ContactLiveChats contacts={filtered} />
                    ) : (
                        <HkDataTable
                            column={columns}
                            rowData={tableData}
                            rowsPerPage={10}
                            rowSelection={true}
                            markStarred={true}
                            onStarredChange={handleStarredChange}
                            searchQuery={searchTerm}
                            classes="nowrap w-100 mb-5"
                            responsive
                        />
                    )}
                </div>
            </SimpleBar>
        </div>
    );
};

export default ContactAppBody;
