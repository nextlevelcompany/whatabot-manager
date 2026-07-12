'use client';
import { useState, useEffect, useCallback } from 'react';
import SimpleBar from 'simplebar-react';
import { Button, Col, Form, Row, Badge, Spinner, InputGroup } from 'react-bootstrap';
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
                    {/* Header Toolbar (Estilo similar a Ver Pedidos) */}
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 bg-white p-3 rounded shadow-sm border mb-4">
                        <div className="d-flex align-items-center">
                            <i className="bi bi-people-fill me-2 fs-4 text-primary"></i>
                            <h4 className="mb-0 text-primary fw-bold">
                                Directorio de Contactos
                            </h4>
                            <span className="badge bg-light text-muted border ms-3 fw-bold px-2 py-1 shadow-none" style={{ fontSize: '11px', borderRadius: '4px' }}>
                                {filtered.length} contacto{filtered.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        
                        {/* Buscador Integrado (Lupa a la izquierda) */}
                        <div style={{ maxWidth: '350px', flexGrow: 1 }} className="mx-lg-3">
                            <InputGroup size="sm">
                                <InputGroup.Text className="bg-white border-end-0">
                                    <i className="bi bi-search text-muted"></i>
                                </InputGroup.Text>
                                <Form.Control
                                    className="border-start-0 shadow-none"
                                    placeholder="Buscar contacto, doc, tel o email..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </div>

                        {/* Filtros Rápidos (Tipo de Persona) y Selector de Vistas */}
                        <div className="d-flex gap-2 align-items-center flex-wrap">
                            <Form.Select 
                                size="sm" 
                                className="w-150p border shadow-none" 
                                value={filterTipo}
                                onChange={e => setFilterTipo(e.target.value)}
                                style={{ width: '150px' }}
                            >
                                <option value="">Todos los tipos</option>
                                <option value="NATURAL">👤 Persona Natural</option>
                                <option value="EMPRESA">🏢 Empresa</option>
                            </Form.Select>

                            {/* Selector de Vistas */}
                            <div className="btn-group bg-light border rounded p-1">
                                <Button
                                    variant={viewMode === 'list' ? 'dark' : 'light'}
                                    size="sm"
                                    className={`fw-bold px-3 border-0 py-1 d-flex align-items-center justify-content-center ${viewMode === 'list' ? 'text-white' : 'text-muted'}`}
                                    onClick={() => setViewMode('list')}
                                    title="Vista de Lista"
                                    style={{ height: '28px' }}
                                >
                                    <List size={14} />
                                </Button>
                                <Button
                                    variant={viewMode === 'map' ? 'dark' : 'light'}
                                    size="sm"
                                    className={`fw-bold px-3 border-0 py-1 d-flex align-items-center justify-content-center ${viewMode === 'map' ? 'text-white' : 'text-muted'}`}
                                    onClick={() => setViewMode('map')}
                                    title="Vista de Mapa"
                                    style={{ height: '28px' }}
                                >
                                    <Map size={14} />
                                </Button>
                                <Button
                                    variant={viewMode === 'chats' ? 'dark' : 'light'}
                                    size="sm"
                                    className={`fw-bold px-3 border-0 py-1 d-flex align-items-center justify-content-center ${viewMode === 'chats' ? 'text-white' : 'text-muted'}`}
                                    onClick={() => setViewMode('chats')}
                                    title="Vista de Chats en Vivo"
                                    style={{ height: '28px' }}
                                >
                                    <MessageSquare size={14} />
                                </Button>
                            </div>

                            {/* Botón Recargar */}
                            <Button size="sm" variant="outline-secondary" className="d-flex align-items-center justify-content-center" onClick={loadContacts} title="Recargar" style={{ height: '34px', width: '34px' }}>
                                <i className="bi bi-arrow-clockwise fs-6"></i>
                            </Button>

                            {/* Botón Crear Contacto */}
                            <Button 
                                variant="primary" 
                                size="sm" 
                                className="fw-bold d-inline-flex align-items-center justify-content-center px-3" 
                                href="/apps/contact/create-contact"
                                style={{ height: '34px' }}
                            >
                                <i className="bi bi-plus-lg me-1"></i> CREAR CONTACTO
                            </Button>
                        </div>
                    </div>

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
