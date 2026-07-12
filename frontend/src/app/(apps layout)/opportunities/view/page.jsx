"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Row, Col, Form, Button, Badge, Modal, Spinner, Card, InputGroup, Table } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import { Plus, Tag, Trash, Edit2, Move, Star, DollarSign, Settings, Check, Save, Send } from 'react-feather';
import Swal from 'sweetalert2';

const getApiBase = () => {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
        return `${window.location.protocol}//${hostname}:8081`;
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8081';
};
const API_BASE = getApiBase();

const getLocalDateString = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const formatDate = (dateStr, userTimezone = 'America/Lima') => {
    if (!dateStr) return '';
    
    let d;
    // If it has no timezone designator, assume UTC and append 'Z'
    if (dateStr.includes('T') && !dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-')) {
        d = new Date(dateStr + 'Z');
    } else if (!dateStr.includes('T')) {
        // Plain format "yyyy-mm-dd hh:mm:ss"
        const normalized = dateStr.replace(' ', 'T') + 'Z';
        d = new Date(normalized);
    } else {
        d = new Date(dateStr);
    }

    if (isNaN(d.getTime())) {
        return dateStr;
    }

    try {
        return new Intl.DateTimeFormat('es-PE', {
            timeZone: userTimezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(d);
    } catch (e) {
        return d.toLocaleDateString();
    }
};

const getLocalDatePart = (dateStr, userTimezone = 'America/Lima') => {
    if (!dateStr) return '';
    let d;
    if (dateStr.includes('T') && !dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-')) {
        d = new Date(dateStr + 'Z');
    } else if (!dateStr.includes('T')) {
        const normalized = dateStr.replace(' ', 'T') + 'Z';
        d = new Date(normalized);
    } else {
        d = new Date(dateStr);
    }

    if (isNaN(d.getTime())) {
        return dateStr.split('T')[0];
    }

    try {
        const parts = new Intl.DateTimeFormat('es-PE', {
            timeZone: userTimezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).formatToParts(d);
        const yyyy = parts.find(p => p.type === 'year').value;
        const mm = parts.find(p => p.type === 'month').value;
        const dd = parts.find(p => p.type === 'day').value;
        return `${yyyy}-${mm}-${dd}`;
    } catch (e) {
        console.error("Error in getLocalDatePart:", e);
        return dateStr.split('T')[0];
    }
};

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

export default function OpportunitiesKanbanPage() {
    const [columns, setColumns] = useState([]);
    const [opportunities, setOpportunities] = useState([]);
    const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [tags, setTags] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({
        'formato.fecha': 'd/m/Y',
        'formato.hora': '24h',
        'timezone': 'America/Lima'
    });

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [filterTag, setFilterTag] = useState('');
    const [filterDesde, setFilterDesde] = useState('');
    const [filterHasta, setFilterHasta] = useState('');
    const [hoveredCardId, setHoveredCardId] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('opps_sidebar_collapsed');
            if (stored === 'true') {
                setSidebarCollapsed(true);
            }
        }
    }, []);

    const filterByDay = (dateStr) => {
        setFilterDesde(filterDesde === dateStr ? '' : dateStr);
        setFilterHasta(filterHasta === dateStr ? '' : dateStr);
    };

    const getWeekDays = () => {
        const list = [];
        const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
        const now = new Date();
        now.setHours(12, 0, 0, 0); // Normalize to midday to prevent timezone shifts
        const start = new Date(now);
        start.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));

        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const dateStr = getLocalDateString(d);
            const label = days[d.getDay()];
            const dayNum = d.getDate();
            const isToday = dateStr === getLocalDateString(now);
            const isActive = filterDesde === dateStr && filterHasta === dateStr;

            // Count day opportunities (active vs won)
            const dayOpps = opportunities.filter(o => o.created_at && getLocalDatePart(o.created_at, settings.timezone) === dateStr);
            const activeCount = dayOpps.filter(o => {
                const col = columns.find(c => c.id === o.etapa_id);
                return col ? (!col.es_ganada && !col.es_perdida) : true;
            }).length;
            const wonCount = dayOpps.filter(o => {
                const col = columns.find(c => c.id === o.etapa_id);
                return col ? col.es_ganada : false;
            }).length;

            list.push({ dateStr, label, dayNum, isToday, isActive, activeCount, wonCount });
        }
        return list;
    };

    const weekDays = getWeekDays();

    // Modals
    const [showOppModal, setShowOppModal] = useState(false);
    const [savingOpp, setSavingOpp] = useState(false);
    const [showTagsModal, setShowTagsModal] = useState(false);
    const [savingTag, setSavingTag] = useState(false);
    const [showColModal, setShowColModal] = useState(false);
    const [savingCol, setSavingCol] = useState(false);

    // Product and Logistics selection for CRM Opportunity
    const [productList, setProductList] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [productosOportunidad, setProductosOportunidad] = useState([]);
    const [showProdModal, setShowProdModal] = useState(false);
    const [modalSelectedProdId, setModalSelectedProdId] = useState('');
    const [modalProdCant, setModalProdCant] = useState(1);

    // Form states
    const defaultOppForm = {
        id: null,
        titulo: '',
        contacto_id: '',
        etapa_id: '',
        valor: 0.0,
        prioridad: 'Media',
        etiquetas: '',
        notas: '',
        productos_json: '[]'
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

            // Fetch products catalog
            const prodRes = await fetch(`${API_BASE}/api/productos`);
            if (prodRes.ok) {
                const prods = await prodRes.json();
                setProductList(prods.filter(p => p.activo !== false));
            }

            // Fetch settings
            try {
                const settingsRes = await fetch(`${API_BASE}/api/settings`);
                if (settingsRes.ok) {
                    const settingsData = await settingsRes.json();
                    setSettings(prev => ({ ...prev, ...settingsData }));
                }
            } catch (err) {
                console.error("Error loading settings:", err);
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

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterPriority, filterTag, filterDesde, filterHasta, viewMode]);

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

        const targetCol = columns.find(c => c.id === targetColumnId);
        if (targetCol && targetCol.es_ganada) {
            const opp = opportunities.find(o => o.id === oppId);
            if (opp) {
                // Parse products
                const prodListParsed = [];
                if (opp.productos_json) {
                    try {
                        const parsed = JSON.parse(opp.productos_json);
                        if (Array.isArray(parsed)) {
                            prodListParsed.push(...parsed);
                        }
                    } catch (err2) {}
                }

                const dataToTransfer = {
                    contacto_id: opp.contacto_id,
                    prioridad: opp.prioridad,
                    notas: opp.notas || '',
                    productos: prodListParsed
                };

                localStorage.setItem('convert_opportunity_data', JSON.stringify(dataToTransfer));

                // Move stage in database first so it stays updated
                try {
                    await fetch(`${API_BASE}/api/opportunities/move`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ opp_id: oppId, etapa_id: targetColumnId })
                    });
                } catch (err) {
                    console.error("Error moving opportunity on drop", err);
                }

                Swal.fire({
                    icon: 'success',
                    title: '¡Oportunidad Ganada!',
                    text: 'Se ha creado el pedido automáticamente en el tablero de Pedidos.',
                    timer: 2500,
                    showConfirmButton: false
                }).then(() => {
                    window.location.href = '/pedidos/view';
                });
                return;
            }
        }

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
        setProductosOportunidad([]);
        setAddresses([]);
        setSelectedAddressId(null);
        setShowOppModal(true);
    };

    const handleEditOpp = async (opp) => {
        const prodListParsed = [];
        if (opp.productos_json) {
            try {
                const parsed = JSON.parse(opp.productos_json);
                if (Array.isArray(parsed)) {
                    prodListParsed.push(...parsed);
                }
            } catch (e) {
                console.error("Error parsing productos_json", e);
            }
        }

        setOppForm({
            id: opp.id,
            titulo: opp.titulo,
            contacto_id: opp.contacto_id || '',
            etapa_id: opp.etapa_id || '',
            valor: parseFloat(opp.valor || 0),
            prioridad: opp.prioridad || 'Media',
            etiquetas: opp.etiquetas || '',
            notas: opp.notas || '',
            productos_json: opp.productos_json || '[]'
        });
        setProductosOportunidad(prodListParsed);

        // Load contact directions if exists
        if (opp.contacto_id) {
            try {
                const res = await fetch(`${API_BASE}/api/pedidos/contact-details/${opp.contacto_id}`);
                if (res.ok) {
                    const data = await res.json();
                    setAddresses(data.addresses || []);
                    if (data.addresses && data.addresses.length > 0) {
                        setSelectedAddressId(data.addresses[0].id);
                    }
                }
            } catch (e) {
                console.error("Error loading contact details on edit", e);
            }
        } else {
            setAddresses([]);
            setSelectedAddressId(null);
        }

        setShowOppModal(true);
    };

    const handleContactChange = async (contactId) => {
        setOppForm(prev => ({ ...prev, contacto_id: contactId }));
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

    // Products table inside Opportunity Modal
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

    // Calculate dynamic subtotal
    const subtotalOportunidad = productosOportunidad.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

    // Convert Opportunity into a Logistics Order
    const handleConvertToOrder = () => {
        if (!oppForm.contacto_id) {
            Swal.fire('Faltan Datos', 'Debes vincular un cliente para poder crear un pedido.', 'warning');
            return;
        }

        const dataToTransfer = {
            contacto_id: oppForm.contacto_id,
            prioridad: oppForm.prioridad,
            notas: oppForm.notas,
            productos: productosOportunidad
        };

        localStorage.setItem('convert_opportunity_data', JSON.stringify(dataToTransfer));
        
        setShowOppModal(false);
        
        Swal.fire({
            icon: 'info',
            title: 'Redirigiendo...',
            text: 'Cargando datos de la oportunidad en el formulario de Pedidos.',
            timer: 1500,
            showConfirmButton: false
        }).then(() => {
            window.location.href = '/pedidos/create?from_opp=true';
        });
    };

    const shareOpportunityWhatsapp = (opp) => {
        const client = opp.contacto_nombre_completo || 'Cliente Anónimo';
        const total = parseFloat(opp.valor || 0).toFixed(2);
        
        let prodsSummary = '';
        if (opp.productos_json) {
            try {
                const prods = JSON.parse(opp.productos_json);
                if (Array.isArray(prods) && prods.length > 0) {
                    prodsSummary = prods.map(p => `- ${p.cantidad}x ${p.nombre} (S/ ${parseFloat(p.precio).toFixed(2)})`).join('\n');
                }
            } catch (err) {}
        }

        let msg = `💼 *COTIZACIÓN / OPORTUNIDAD COMERCIAL*\n\n`;
        msg += `*Trato:* ${opp.titulo}\n`;
        msg += `👤 *Cliente:* ${client}\n`;
        msg += `📅 *Fecha:* ${formatDate(opp.created_at, settings.timezone)}\n`;
        msg += `⭐ *Prioridad:* ${opp.prioridad || 'Media'}\n`;
        if (prodsSummary) {
            msg += `\n🛒 *Productos Cotizados:*\n${prodsSummary}\n`;
        }
        msg += `\n💰 *Total Estimado:* S/ ${total}\n`;
        if (opp.notas) msg += `📝 *Notas:* ${opp.notas}\n`;

        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(msg);
            Swal.fire({
                icon: 'success',
                title: '¡Copiado!',
                text: 'La cotización comercial ha sido copiada. Puedes pegarla en WhatsApp.',
                timer: 2000,
                showConfirmButton: false
            });
        }
    };

    const handleSaveOpp = async (e) => {
        if (e) e.preventDefault();
        setSavingOpp(true);
        try {
            const body = {
                ...oppForm,
                contacto_id: oppForm.contacto_id ? parseInt(oppForm.contacto_id) : null,
                etapa_id: parseInt(oppForm.etapa_id),
                valor: subtotalOportunidad,
                productos_json: JSON.stringify(productosOportunidad)
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
                const errData = await res.json().catch(() => ({}));
                console.error("Backend error response:", errData);
                const errMsg = errData.message || 'No se pudo guardar la oportunidad.';
                Swal.fire('Error', errMsg, 'error');
            }
        } catch (error) {
            console.error("Connection error:", error);
            Swal.fire('Error', 'Error al guardar: ' + error.message, 'error');
        } finally {
            setSavingOpp(false);
        }
    };

    const handleDeleteOpp = (targetOpp = null) => {
        const idToDelete = targetOpp ? targetOpp.id : oppForm.id;
        if (!idToDelete) return;
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
                    const res = await fetch(`${API_BASE}/api/opportunities/${idToDelete}`, { method: 'DELETE' });
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
        ) && (
            filterTag === '' || (o.etiquetas && o.etiquetas.split(',').map(t => t.trim()).includes(filterTag))
        ) && (() => {
            if (!filterDesde && !filterHasta) return true;
            const oppDate = o.created_at ? getLocalDatePart(o.created_at, settings.timezone) : '';
            if (!oppDate) return false;
            if (filterDesde && oppDate < filterDesde) return false;
            if (filterHasta && oppDate > filterHasta) return false;
            return true;
        })());
    };

    const getColumnTotal = (columnId) => {
        return getColumnOpps(columnId).reduce((sum, o) => sum + parseFloat(o.valor), 0.0);
    };

    const getFilteredOpportunities = () => {
        return opportunities.filter(o => (
            searchTerm === '' ||
            o.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (o.contacto_nombre_completo && o.contacto_nombre_completo.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (o.etiquetas && o.etiquetas.toLowerCase().includes(searchTerm.toLowerCase()))
        ) && (
            filterPriority === '' || o.prioridad === filterPriority
        ) && (
            filterTag === '' || (o.etiquetas && o.etiquetas.split(',').map(t => t.trim()).includes(filterTag))
        ) && (() => {
            if (!filterDesde && !filterHasta) return true;
            const oppDate = o.created_at ? getLocalDatePart(o.created_at, settings.timezone) : '';
            if (!oppDate) return false;
            if (filterDesde && oppDate < filterDesde) return false;
            if (filterHasta && oppDate > filterHasta) return false;
            return true;
        })());
    };

    const exportToExcel = async () => {
        const filteredOpps = getFilteredOpportunities();
        if (!filteredOpps || filteredOpps.length === 0) {
            Swal.fire('Atención', 'No hay datos de oportunidades para exportar con los filtros actuales.', 'info');
            return;
        }

        try {
            const XLSX = await loadSheetJS();
            const dataToExport = filteredOpps.map(o => {
                const col = columns.find(c => c.id === o.etapa_id);
                const colName = col ? col.nombre : 'Sin etapa';
                return {
                    'Título / Trato': o.titulo || '',
                    'Contacto / Cliente': o.contacto_nombre_completo || 'Sin contacto',
                    'Etapa': colName,
                    'Valor Estimado (S/)': parseFloat(o.valor || 0),
                    'Prioridad': o.prioridad || '',
                    'Etiquetas': o.etiquetas || '',
                    'Fecha Registro': o.created_at ? getLocalDatePart(o.created_at, settings.timezone) : '',
                    'Notas': o.notas || ''
                };
            });

            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Oportunidades");
            
            // Auto-fit columns
            const maxLen = {};
            dataToExport.forEach(row => {
                Object.keys(row).forEach(key => {
                    const val = String(row[key] || '');
                    maxLen[key] = Math.max(maxLen[key] || key.length, val.length);
                });
            });
            ws['!cols'] = Object.keys(maxLen).map(key => ({ wch: Math.min(30, maxLen[key] + 2) }));

            const filename = 'Reporte_Oportunidades_' + new Date().toISOString().slice(0, 10) + '.xlsx';
            XLSX.writeFile(wb, filename);

            Swal.fire({
                icon: 'success',
                title: '¡Descarga Iniciada!',
                text: 'El reporte de oportunidades se ha exportado correctamente.',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            console.error("Error exporting to Excel", err);
            Swal.fire('Error', 'No se pudo exportar a Excel.', 'error');
        }
    };

    const getPriorityBadgeColor = (p) => {
        if (p === 'Alta') return 'danger';
        if (p === 'Media') return 'warning';
        return 'secondary';
    };

    // KPI Calculations
    const kpiOppsActivas = opportunities.filter(o => {
        const col = columns.find(c => c.id === o.etapa_id);
        return col ? (!col.es_ganada && !col.es_perdida) : true;
    });
    
    const kpiTotalValue = opportunities.reduce((sum, o) => sum + parseFloat(o.valor || 0), 0);
    
    const kpiOppsGanadas = opportunities.filter(o => {
        const col = columns.find(c => c.id === o.etapa_id);
        return col ? col.es_ganada : false;
    });
    const kpiGanadoValue = kpiOppsGanadas.reduce((sum, o) => sum + parseFloat(o.valor || 0), 0);

    const kpiOppsPerdidas = opportunities.filter(o => {
        const col = columns.find(c => c.id === o.etapa_id);
        return col ? col.es_perdida : false;
    });

    const totalCerradas = kpiOppsGanadas.length + kpiOppsPerdidas.length;
    const conversionRate = totalCerradas > 0 ? ((kpiOppsGanadas.length / totalCerradas) * 100).toFixed(1) : '0.0';

    return (
        <div className="hk-pg-body">
            <div className="container-fluid px-4 py-4">
                {/* Header Toolbar */}
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 bg-white p-3 rounded shadow-sm border mb-4">
                    <div className="d-flex align-items-center">
                        <Button 
                            variant={sidebarCollapsed ? "primary" : "outline-primary"} 
                            size="sm" 
                            className="me-3 d-flex align-items-center gap-1 shadow-sm" 
                            onClick={() => {
                                const newCollapsed = !sidebarCollapsed;
                                setSidebarCollapsed(newCollapsed);
                                localStorage.setItem('opps_sidebar_collapsed', String(newCollapsed));
                            }} 
                            title={sidebarCollapsed ? "Mostrar filtros" : "Ocultar filtros"}
                            style={{ height: '34px' }}
                        >
                            <i className="bi bi-filter"></i>
                            <span className="fw-semibold">{sidebarCollapsed ? "Mostrar Filtros" : "Ocultar Filtros"}</span>
                        </Button>
                        <h4 className="mb-0 text-primary fw-bold d-flex align-items-center">
                            <i className="bi bi-funnel-fill me-2 fs-4"></i>
                            Embudo de Ventas (CRM)
                        </h4>
                    </div>
                    
                    {/* Buscador Integrado (Lupa a la izquierda) */}
                    <div style={{ maxWidth: '350px', flexGrow: 1 }} className="mx-lg-4">
                        <InputGroup size="sm">
                            <InputGroup.Text className="bg-white border-end-0">
                                <i className="bi bi-search text-muted"></i>
                            </InputGroup.Text>
                            <Form.Control
                                className="border-start-0 shadow-none"
                                placeholder="Buscar por título, cliente o etiqueta..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                    </div>

                    {/* Acciones Rápidas */}
                    <div className="d-flex gap-2 align-items-center flex-wrap">
                        {/* Selector de Vista (Kanban / Lista) */}
                        <div className="btn-group bg-light border rounded p-1" style={{ height: '34px' }}>
                            <Button
                                variant={viewMode === 'kanban' ? 'dark' : 'light'}
                                size="sm"
                                className={`d-flex align-items-center fw-bold px-3 border-0 ${viewMode === 'kanban' ? 'text-white' : 'text-muted'}`}
                                onClick={() => setViewMode('kanban')}
                                style={{ height: '24px' }}
                                title="Vista Kanban"
                            >
                                <i className="bi bi-columns-gap"></i>
                            </Button>
                            <Button
                                variant={viewMode === 'list' ? 'dark' : 'light'}
                                size="sm"
                                className={`d-flex align-items-center fw-bold px-3 border-0 ${viewMode === 'list' ? 'text-white' : 'text-muted'}`}
                                onClick={() => setViewMode('list')}
                                style={{ height: '24px' }}
                                title="Vista Lista"
                            >
                                <i className="bi bi-list-task"></i>
                            </Button>
                        </div>

                        {/* Botones de Acción */}
                        <Button variant="outline-secondary" size="sm" onClick={() => setShowTagsModal(true)} className="fw-semibold d-inline-flex align-items-center justify-content-center" style={{ height: '34px', width: '34px' }} title="Etiquetas">
                            <i className="bi bi-tags-fill"></i>
                        </Button>
                        
                        <Button variant="outline-primary" size="sm" onClick={handleNewColumn} className="fw-semibold d-inline-flex align-items-center justify-content-center" style={{ height: '34px', width: '34px' }} title="Nueva Etapa">
                            <i className="bi bi-folder-plus"></i>
                        </Button>

                        <Button variant="outline-dark" size="sm" onClick={loadKanbanData} className="fw-semibold d-inline-flex align-items-center justify-content-center" style={{ height: '34px', width: '34px' }} title="Sincronizar">
                            <i className="bi bi-arrow-clockwise"></i>
                        </Button>

                        <Button variant="outline-success" size="sm" onClick={exportToExcel} className="fw-semibold d-inline-flex align-items-center justify-content-center" style={{ height: '34px', width: '34px' }} title="Exportar a Excel">
                            <i className="bi bi-download"></i>
                        </Button>

                        <Button variant="primary" size="sm" onClick={() => handleNewOpp()} className="fw-bold d-inline-flex align-items-center justify-content-center gap-1.5 px-3" style={{ height: '34px' }}>
                            <i className="bi bi-plus-lg"></i> NUEVA OPORTUNIDAD
                        </Button>
                    </div>
                </div>

                {/* KPI Summary Row */}
                <Row className="mb-4 g-3">
                    <Col md={3}>
                        <Card className="shadow-sm border-0 bg-white">
                            <Card.Body className="p-3 text-center">
                                <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '10px' }}>Oportunidades Activas</small>
                                <h4 className="mb-0 fw-bold text-primary mt-1">{kpiOppsActivas.length}</h4>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="shadow-sm border-0 bg-white">
                            <Card.Body className="p-3 text-center">
                                <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '10px' }}>Valor Total del Embudo</small>
                                <h4 className="mb-0 fw-bold text-dark mt-1">S/ {kpiTotalValue.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="shadow-sm border-0 bg-white">
                            <Card.Body className="p-3 text-center">
                                <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '10px' }}>Cerrado Ganado</small>
                                <h4 className="mb-0 fw-bold text-success mt-1">S/ {kpiGanadoValue.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="shadow-sm border-0 bg-white">
                            <Card.Body className="p-3 text-center">
                                <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '10px' }}>Tasa de Conversión</small>
                                <h4 className="mb-0 fw-bold text-warning mt-1">{conversionRate}%</h4>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Kanban & Filters Layout Row */}
                <Row>
                    {/* Filters Sidebar (A la izquierda, replicado de pedidos) */}
                    {!sidebarCollapsed && (
                        <Col lg={3} className="mb-4">
                            <div className="bg-white p-4 rounded shadow-sm border" style={{ position: 'sticky', top: '20px' }}>
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h5 className="mb-0 fw-bold text-dark" style={{ fontSize: '13px', letterSpacing: '0.03em' }}>FILTROS</h5>
                                    <Button
                                        variant="light"
                                        size="sm"
                                        className="p-1 border d-flex align-items-center justify-content-center rounded-circle"
                                        onClick={() => {
                                            setSidebarCollapsed(true);
                                            localStorage.setItem('opps_sidebar_collapsed', 'true');
                                        }}
                                        title="Ocultar filtros"
                                        style={{ width: '24px', height: '24px' }}
                                    >
                                        <i className="bi bi-chevron-left text-muted" style={{ fontSize: '10px' }}></i>
                                    </Button>
                                </div>

                                {/* Rango de Fechas */}
                                <div className="mb-3">
                                    <span className="d-block text-muted fw-bold mb-2" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>RANGO DE FECHAS</span>
                                    <Row className="g-2">
                                        <Col xs={6}>
                                            <Form.Control
                                                type="date"
                                                size="sm"
                                                value={filterDesde}
                                                onChange={(e) => setFilterDesde(e.target.value)}
                                                className="border shadow-none"
                                            />
                                        </Col>
                                        <Col xs={6}>
                                            <Form.Control
                                                type="date"
                                                size="sm"
                                                value={filterHasta}
                                                onChange={(e) => setFilterHasta(e.target.value)}
                                                className="border shadow-none"
                                            />
                                        </Col>
                                    </Row>
                                </div>

                                {/* Programación Semanal */}
                                <div className="mb-4">
                                    <span className="d-block text-muted fw-bold mb-2" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>PROGRAMACIÓN SEMANAL</span>
                                    <div className="d-flex justify-content-between gap-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                                        {weekDays.map(day => (
                                            <button
                                                key={day.dateStr}
                                                type="button"
                                                onClick={() => filterByDay(day.dateStr)}
                                                className={`btn btn-sm d-flex flex-column align-items-center justify-content-center p-1 rounded-3 ${
                                                    day.isActive ? 'bg-dark text-white shadow border-dark' : (day.isToday ? 'btn-soft-primary border-primary' : 'btn-light border')
                                                }`}
                                                style={{ minHeight: '56px', width: '100%', minWidth: 0, overflow: 'hidden' }}
                                            >
                                                <span style={{ fontSize: '7.5px', fontWeight: '800' }}>{day.label}</span>
                                                <span className="fw-bold" style={{ fontSize: '11px' }}>{day.dayNum}</span>
                                                <div className="d-flex gap-1 mt-1">
                                                    <span className="d-flex align-items-center justify-content-center fw-bold rounded-circle" style={{ 
                                                        width: '14px', 
                                                        height: '14px', 
                                                        fontSize: '6.5px',
                                                        backgroundColor: day.isActive ? '#ffffff' : '#0d6efd',
                                                        color: day.isActive ? '#212529' : '#ffffff'
                                                    }}>
                                                        {day.activeCount}
                                                    </span>
                                                    {day.wonCount > 0 && (
                                                        <span className="d-flex align-items-center justify-content-center fw-bold rounded-circle" style={{ 
                                                            width: '14px', 
                                                            height: '14px', 
                                                            fontSize: '6.5px',
                                                            backgroundColor: day.isActive ? '#ffffff' : '#198754',
                                                            color: day.isActive ? '#198754' : '#ffffff'
                                                        }}>
                                                            {day.wonCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Filtro por Prioridad */}
                                <div className="mb-3">
                                    <span className="d-block text-muted fw-bold mb-1" style={{ fontSize: '10px', letterSpacing: '0.03em' }}>PRIORIDAD</span>
                                    <Form.Select 
                                        size="sm" 
                                        className="border shadow-none" 
                                        value={filterPriority}
                                        onChange={e => setFilterPriority(e.target.value)}
                                    >
                                        <option value="">Todas las prioridades</option>
                                        <option value="Alta">🔴 Prioridad Alta</option>
                                        <option value="Media">🟡 Prioridad Media</option>
                                        <option value="Baja">⚪ Prioridad Baja</option>
                                    </Form.Select>
                                </div>

                                {/* Filtro por Etiqueta */}
                                <div className="mb-4">
                                    <span className="d-block text-muted fw-bold mb-1" style={{ fontSize: '10px', letterSpacing: '0.03em' }}>ETIQUETA COMERCIAL</span>
                                    <Form.Select 
                                        size="sm" 
                                        className="border shadow-none" 
                                        value={filterTag}
                                        onChange={e => setFilterTag(e.target.value)}
                                    >
                                        <option value="">Todas las etiquetas</option>
                                        {tags.map(t => (
                                            <option key={t.id} value={t.nombre}>{t.nombre}</option>
                                        ))}
                                    </Form.Select>
                                </div>

                                {/* Botón Limpiar Filtros */}
                                <Button 
                                    variant="link" 
                                    className="text-danger fw-bold text-decoration-none p-0 w-100 text-start d-inline-flex align-items-center gap-1" 
                                    style={{ fontSize: '11.5px' }}
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFilterPriority('');
                                        setFilterTag('');
                                        setFilterDesde('');
                                        setFilterHasta('');
                                    }}
                                >
                                    <i className="bi bi-trash3"></i> Limpiar Filtros
                                </Button>
                            </div>
                        </Col>
                    )}

                    {/* Content Panel (Kanban Board / List View) */}
                    <Col lg={sidebarCollapsed ? 12 : 9} className="mb-4">
                        {loading ? (
                            <div className="text-center py-5">
                                <Spinner animation="border" />
                                <p className="mt-2 text-muted">Cargando embudo CRM...</p>
                            </div>
                        ) : viewMode === 'list' ? (
                            <Card className="border-0 shadow-sm rounded-3 overflow-hidden bg-white">
                                <Table hover responsive className="align-middle mb-0 text-nowrap">
                                    <thead className="table-light text-muted font-size-12">
                                        <tr>
                                            <th className="ps-4">Título / Trato</th>
                                            <th>Contacto / Cliente</th>
                                            <th>Etapa</th>
                                            <th>Valor Estimado</th>
                                            <th>Prioridad</th>
                                            <th>Etiquetas</th>
                                            <th>Fecha Registro</th>
                                            <th className="text-end pe-4">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-size-13">
                                        {getFilteredOpportunities().length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="text-center py-5 text-muted">
                                                    No se encontraron oportunidades.
                                                </td>
                                            </tr>
                                        ) : (
                                            getFilteredOpportunities().slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(o => {
                                                const col = columns.find(c => c.id === o.etapa_id);
                                                const isWon = col ? col.es_ganada : false;
                                                const colName = col ? col.nombre : 'Sin etapa';
                                                const stageColors = ['primary', 'warning', 'info', 'violet', 'dark', 'success', 'danger'];
                                                const stageColor = stageColors[(o.etapa_id || 0) % stageColors.length];

                                                return (
                                                    <tr key={o.id}>
                                                        <td className="ps-4">
                                                            <div className="d-flex align-items-center gap-1">
                                                                {isWon && <span className="text-success" title="Ganada y Bloqueada">🔒</span>}
                                                                <strong 
                                                                    className="text-dark hover-text-primary" 
                                                                    style={{ cursor: 'pointer', fontSize: '13.5px' }}
                                                                    onClick={() => {
                                                                        if (isWon) {
                                                                            Swal.fire({
                                                                                icon: 'info',
                                                                                title: 'Oportunidad Ganada',
                                                                                text: 'Esta oportunidad ya ha sido ganada y convertida en pedido. Está bloqueada para modificaciones.',
                                                                                confirmButtonText: 'Entendido'
                                                                            });
                                                                            return;
                                                                        }
                                                                        handleEditOpp(o);
                                                                    }}
                                                                >
                                                                    {o.titulo}
                                                                </strong>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            {o.contacto_nombre_completo ? (
                                                                <Link 
                                                                    href={`/apps/contact/view-contact?id=${o.contacto_id}`}
                                                                    className="text-dark fw-medium text-decoration-none hover-text-primary"
                                                                >
                                                                    👤 {o.contacto_nombre_completo}
                                                                </Link>
                                                            ) : (
                                                                <span className="text-muted">Sin contacto</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <Badge bg={isWon ? 'success' : stageColor} className={isWon ? 'text-white border-0' : `bg-soft-${stageColor} text-${stageColor} border-0`}>
                                                                {isWon ? `🏆 ${colName}` : colName}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            <span className="fw-bold text-dark">S/ {parseFloat(o.valor || 0).toFixed(2)}</span>
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${
                                                                isWon ? 'bg-secondary text-white' : o.prioridad === 'Alta' ? 'bg-danger-soft text-danger border border-danger-soft' : o.prioridad === 'Media' ? 'bg-warning-soft text-warning border border-warning-soft' : 'bg-success-soft text-success border border-success-soft'
                                                            }`} style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px' }}>
                                                                {o.prioridad}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="d-flex flex-wrap gap-1">
                                                                {o.etiquetas ? o.etiquetas.split(',').map((t, idx) => (
                                                                    <Badge key={idx} bg="light" className="text-muted border">
                                                                        {t.trim()}
                                                                    </Badge>
                                                                )) : (
                                                                    <span className="text-muted">-</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="text-muted">{formatDate(o.created_at, settings.timezone)}</span>
                                                        </td>
                                                        <td className="text-end pe-4">
                                                            <div className="d-flex justify-content-end gap-1.5">
                                                                <Button 
                                                                    variant="outline-light" 
                                                                    size="xs" 
                                                                    className="btn-icon p-1 border-0" 
                                                                    onClick={() => {
                                                                        if (isWon) {
                                                                            Swal.fire({
                                                                                icon: 'info',
                                                                                title: 'Oportunidad Ganada',
                                                                                text: 'Esta oportunidad ya ha sido ganada y convertida en pedido. Está bloqueada para modificaciones.',
                                                                                confirmButtonText: 'Entendido'
                                                                            });
                                                                            return;
                                                                        }
                                                                        handleEditOpp(o);
                                                                    }}
                                                                    title="Editar"
                                                                >
                                                                    <i className="bi bi-pencil-fill text-muted"></i>
                                                                </Button>
                                                                <Button 
                                                                    variant="outline-light" 
                                                                    size="xs" 
                                                                    className="btn-icon p-1 border-0" 
                                                                    onClick={() => handleDeleteOpp(o)}
                                                                    title="Eliminar"
                                                                >
                                                                    <i className="bi bi-trash-fill text-danger"></i>
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </Table>
                                {/* Paginación del Modo Lista */}
                                <div className="d-flex justify-content-between align-items-center p-3 bg-light border-top">
                                    <div className="text-muted small">
                                        Mostrando {getFilteredOpportunities().length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, getFilteredOpportunities().length)} de {getFilteredOpportunities().length} oportunidades
                                    </div>
                                    <div className="d-flex gap-2">
                                        <Button 
                                            variant="outline-secondary" 
                                            size="sm" 
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            Anterior
                                        </Button>
                                        <span className="align-self-center text-muted fw-bold small px-2">
                                            Pág. {currentPage} de {Math.max(1, Math.ceil(getFilteredOpportunities().length / itemsPerPage))}
                                        </span>
                                        <Button 
                                            variant="outline-secondary" 
                                            size="sm" 
                                            onClick={() => setCurrentPage(p => Math.min(Math.ceil(getFilteredOpportunities().length / itemsPerPage), p + 1))}
                                            disabled={currentPage === Math.ceil(getFilteredOpportunities().length / itemsPerPage) || getFilteredOpportunities().length === 0}
                                        >
                                            Siguiente
                                        </Button>
                                    </div>
                                </div>
                            </Card>
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
                                                            const priorityColors = {
                                                                Alta: '#ef4444', 
                                                                Media: '#FF8924', 
                                                                Baja: '#10b981'
                                                            };
                                                            const leftBorder = priorityColors[o.prioridad] || '#cbd5e1';
                                                            const isHovered = hoveredCardId === o.id;
                                                            const col = columns.find(c => c.id === o.etapa_id);
                                                            const isWon = col ? col.es_ganada : false;

                                                            return (
                                                                <Card 
                                                                    key={o.id}
                                                                    draggable={!isWon}
                                                                    onDragStart={(e) => handleDragStart(e, o.id)}
                                                                    onClick={() => {
                                                                        if (isWon) {
                                                                            Swal.fire({
                                                                                icon: 'info',
                                                                                title: 'Oportunidad Ganada',
                                                                                text: 'Esta oportunidad ya ha sido ganada y convertida en pedido. Está bloqueada para modificaciones.',
                                                                                confirmButtonText: 'Entendido'
                                                                            });
                                                                            return;
                                                                        }
                                                                        handleEditOpp(o);
                                                                    }}
                                                                    onMouseEnter={() => !isWon && setHoveredCardId(o.id)}
                                                                    onMouseLeave={() => setHoveredCardId(null)}
                                                                    className={`border rounded-3 p-3 transition-all ${isWon ? 'bg-light text-muted' : 'bg-white'}`}
                                                                    style={{ 
                                                                        cursor: isWon ? 'not-allowed' : 'grab',
                                                                        borderLeftWidth: '4px',
                                                                        borderLeftStyle: 'solid',
                                                                        borderLeftColor: isWon ? '#cbd5e1' : leftBorder,
                                                                        borderTopColor: isHovered ? 'rgba(0,0,0,0.12)' : '#e2e8f0',
                                                                        borderRightColor: isHovered ? 'rgba(0,0,0,0.12)' : '#e2e8f0',
                                                                        borderBottomColor: isHovered ? 'rgba(0,0,0,0.12)' : '#e2e8f0',
                                                                        transform: (isHovered && !isWon) ? 'translateY(-3px)' : 'none',
                                                                        boxShadow: (isHovered && !isWon) ? '0 10px 20px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.04)' : '0 2px 4px rgba(0,0,0,0.02)',
                                                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                        opacity: isWon ? 0.75 : 1
                                                                    }}
                                                                >
                                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                                        {isWon ? (
                                                                            <Badge bg="success" className="text-white border-0 fw-bold px-2 py-1 shadow-none" style={{ fontSize: '10px', borderRadius: '4px' }}>
                                                                                🔒 Ganada (Bloqueada)
                                                                            </Badge>
                                                                        ) : (
                                                                            <Badge bg="light" className="text-muted border fw-bold px-2 py-1 shadow-none" style={{ fontSize: '10px', borderRadius: '4px' }}>
                                                                                💼 Oportunidad
                                                                            </Badge>
                                                                        )}
                                                                        <div className="d-flex gap-1 align-items-center">
                                                                            <span className={`badge ${
                                                                                isWon ? 'bg-secondary text-white' : o.prioridad === 'Alta' ? 'bg-danger-soft text-danger border border-danger-soft' : o.prioridad === 'Media' ? 'bg-warning-soft text-warning border border-warning-soft' : 'bg-success-soft text-success border border-success-soft'
                                                                            }`} style={{ fontSize: '9px', padding: '3px 6px', borderRadius: '4px' }}>{o.prioridad}</span>
                                                                        </div>
                                                                    </div>

                                                                    <h6 className="fw-bold text-dark mb-1 font-size-14 text-wrap">{o.titulo}</h6>
                                                                    
                                                                    {o.contacto_nombre_completo && (
                                                                        <div className="fw-semibold mb-2" style={{ fontSize: '13px', letterSpacing: '-0.01em' }}>
                                                                            <Link 
                                                                                href={`/apps/contact/view-contact?id=${o.contacto_id}`} 
                                                                                className="text-dark text-decoration-none transition-all"
                                                                                style={{ cursor: 'pointer' }}
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                onMouseEnter={(e) => e.target.style.color = '#0d6efd'}
                                                                                onMouseLeave={(e) => e.target.style.color = '#212529'}
                                                                            >
                                                                                👤 {o.contacto_nombre_completo}
                                                                            </Link>
                                                                        </div>
                                                                    )}

                                                                    {o.productos_json && (() => {
                                                                        try {
                                                                            const prods = JSON.parse(o.productos_json);
                                                                            if (Array.isArray(prods) && prods.length > 0) {
                                                                                const summary = prods.map(p => `${p.cantidad}x ${p.nombre}`).join(', ');
                                                                                return (
                                                                                    <div className="p-2 mb-2 bg-light-soft border border-light rounded-3 text-secondary" style={{ fontSize: '11px', lineHeight: '1.4' }}>
                                                                                        <span className="fw-semibold">🛒 {summary}</span>
                                                                                    </div>
                                                                                );
                                                                            }
                                                                        } catch (err) {}
                                                                        return null;
                                                                    })()}

                                                                    {(o.notes || o.notas) && (
                                                                        <div className="text-muted mb-2 text-truncate" style={{ fontSize: '11.5px' }}>
                                                                            📝 {o.notes || o.notas}
                                                                        </div>
                                                                    )}

                                                                    <div className="d-flex justify-content-between align-items-center mt-3 border-top pt-2">
                                                                        <div className="d-flex flex-column gap-1">
                                                                            {cardTags.length > 0 && (
                                                                                <div className="d-flex flex-wrap gap-1">
                                                                                    {cardTags.map((ct, cti) => {
                                                                                        const mTag = tags.find(t => t.nombre === ct);
                                                                                        const bgColor = mTag ? mTag.color : '#6366f1';
                                                                                        return (
                                                                                            <span key={cti} className="badge text-white px-2 py-0.5" style={{ backgroundColor: bgColor, borderRadius: '4px', fontSize: '9px' }}>
                                                                                                {ct}
                                                                                            </span>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            )}
                                                                            <span className="text-muted" style={{ fontSize: '10px' }}>
                                                                                🕒 {formatDate(o.created_at, settings.timezone)}
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-end">
                                                                            <strong className="text-primary d-block mb-1" style={{ fontSize: '14px', letterSpacing: '-0.02em' }}>S/ {parseFloat(o.valor || 0).toFixed(2)}</strong>
                                                                            <div className="d-flex gap-2 justify-content-end">
                                                                                <Button variant="link" className="p-1 text-success hover-bg rounded-circle" onClick={(e) => { e.stopPropagation(); shareOpportunityWhatsapp(o); }} title="Compartir WhatsApp">
                                                                                    <Send size={13} />
                                                                                </Button>
                                                                                <Button variant="link" className="p-1 text-muted hover-bg rounded-circle" onClick={(e) => { e.stopPropagation(); handleEditOpp(o); }} title="Editar Oportunidad">
                                                                                    <Edit2 size={13} />
                                                                                </Button>
                                                                                <Button variant="link" className="p-1 text-danger hover-bg rounded-circle" onClick={(e) => { e.stopPropagation(); handleDeleteOpp(o); }} title="Eliminar Oportunidad">
                                                                                    <Trash size={13} />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
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
                    </Col>
                </Row>
            </div>

            {/* Opportunity Edit/Create Modal (3 Columns, replicated from orders) */}
            <Modal show={showOppModal} onHide={() => setShowOppModal(false)} size="xl" backdrop="static">
                <Form onSubmit={handleSaveOpp}>
                    <Modal.Header closeButton>
                        <Modal.Title className="fw-bold">{oppForm.id ? 'Editar Oportunidad CRM' : 'Nueva Oportunidad CRM'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        <Row className="g-4">
                            {/* Columna 1: Información del Cliente */}
                            <Col lg={4} className="border-end">
                                <div className="fw-extrabold text-uppercase text-muted border-bottom pb-2 mb-3 d-flex align-items-center" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>
                                    <i className="bi bi-person-fill me-2 text-primary"></i>
                                    1. Información del Cliente
                                </div>

                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold small">Título / Nombre Trato</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        placeholder="Ej: Suministro de agua bidón 20L empresa"
                                        className="shadow-none border-light-soft bg-light-soft fw-bold text-dark" 
                                        value={oppForm.titulo} 
                                        onChange={e => setOppForm({ ...oppForm, titulo: e.target.value })} 
                                        required 
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold small">Contacto / Cliente Asignado</Form.Label>
                                    <Form.Select 
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={oppForm.contacto_id}
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
                                    <div className="overflow-auto" style={{ maxHeight: '250px' }}>
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
                                            <div className="text-center py-4 text-muted small border rounded bg-light">
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
                                            <Form.Label className="fw-bold small">Prioridad</Form.Label>
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
                                    <Col xs={6}>
                                        <Form.Group>
                                            <Form.Label className="fw-bold small">Etapa del Embudo</Form.Label>
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
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold small">Notas / Comentarios comerciales</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        placeholder="Ingrese notas sobre la oportunidad comercial..."
                                        className="shadow-none border-light-soft bg-light-soft"
                                        value={oppForm.notes || oppForm.notas || ''}
                                        onChange={e => setOppForm({ ...oppForm, notas: e.target.value })}
                                    />
                                </Form.Group>

                                <div className="mt-3">
                                    <Form.Label className="small fw-bold text-muted mb-2">Etiquetas del Trato</Form.Label>
                                    <div className="d-flex flex-wrap gap-1.5 p-2 border rounded bg-light-soft" style={{ minHeight: '80px' }}>
                                        {tags.map(tag => {
                                            const selected = oppForm.etiquetas ? oppForm.etiquetas.split(',').map(t => t.trim()).includes(tag.nombre) : false;
                                            return (
                                                <span 
                                                    key={tag.id}
                                                    className={`badge border text-dark preset-badge cursor-pointer px-2.5 py-1.5 d-flex align-items-center gap-1 ${selected ? 'bg-primary text-white border-primary' : 'bg-white'}`}
                                                    onClick={() => handleToggleTagOnOpp(tag.nombre)}
                                                    style={{ cursor: 'pointer', borderRadius: '50px', fontSize: '10px' }}
                                                >
                                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: tag.color }}></span>
                                                    {tag.nombre}
                                                    {selected && <i className="bi bi-check" style={{ fontSize: '12px' }}></i>}
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

                                <div className="overflow-auto mb-3" style={{ maxHeight: '200px', minHeight: '120px' }}>
                                    <Table hover responsive size="sm" className="align-middle">
                                        <thead className="table-light text-muted" style={{ fontSize: '9px' }}>
                                            <tr>
                                                <th>PRODUCTO</th>
                                                <th className="text-center" style={{ width: '50px' }}>CANT.</th>
                                                <th className="text-center" style={{ width: '65px' }}>PRECIO</th>
                                                <th className="text-end">SUB.</th>
                                                <th className="text-center" style={{ width: '25px' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody style={{ fontSize: '11.5px' }}>
                                            {productosOportunidad.map((item, index) => (
                                                <tr key={item.id}>
                                                    <td className="fw-bold text-dark">{item.nombre}</td>
                                                    <td className="text-center">
                                                        <Form.Control
                                                            type="number"
                                                            size="sm"
                                                            value={item.cantidad}
                                                            className="text-center p-1 shadow-none border-light"
                                                            style={{ height: '24px' }}
                                                            onChange={(e) => handleQuantityChangeInOpp(index, e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="text-center">
                                                        <Form.Control
                                                            type="number"
                                                            size="sm"
                                                            step="0.01"
                                                            value={item.precio}
                                                            className="text-center p-1 shadow-none border-light"
                                                            style={{ height: '24px' }}
                                                            onChange={(e) => handlePriceChangeInOpp(index, e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="text-end fw-bold text-primary">S/ {(item.precio * item.cantidad).toFixed(2)}</td>
                                                    <td className="text-center">
                                                        <Button variant="link" className="p-0 text-danger" onClick={() => handleRemoveProductFromOpp(index)}>
                                                            <i className="bi bi-trash3"></i>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {productosOportunidad.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="text-center py-4 text-muted small">Sin productos asignados.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>

                                <div className="bg-light p-3 rounded mb-4">
                                    <div className="d-flex justify-content-between mt-1 pt-1 border-top">
                                        <span className="fw-bold text-muted small">VALOR ESTIMADO TOTAL</span>
                                        <span className="fw-extrabold text-primary fs-5">S/ {subtotalOportunidad.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Acciones del Modal */}
                                <div className="d-flex flex-column gap-2 mt-auto">
                                    {oppForm.contacto_id && (
                                        <Button
                                            type="button"
                                            variant="success"
                                            className="w-100 py-2 fw-bold text-white d-flex align-items-center justify-content-center gap-1.5"
                                            onClick={handleConvertToOrder}
                                            style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
                                        >
                                            <i className="bi bi-cart-check-fill fs-6"></i>
                                            CONVERTIR EN PEDIDO
                                        </Button>
                                    )}

                                    <Button variant="primary" type="submit" className="w-100 py-2 fw-bold" disabled={savingOpp}>
                                        {savingOpp ? <Spinner size="sm" /> : <Save size={14} className="me-1" />}
                                        GUARDAR OPORTUNIDAD
                                    </Button>

                                    <div className="d-flex gap-2">
                                        {oppForm.id && (
                                            <Button variant="outline-danger" className="w-50 fw-semibold" onClick={handleDeleteOpp}>
                                                Eliminar
                                            </Button>
                                        )}
                                        <Button variant="light" className="flex-grow-1 border fw-semibold" onClick={() => setShowOppModal(false)} disabled={savingOpp}>
                                            Cancelar
                                        </Button>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </Modal.Body>
                </Form>
            </Modal>

            {/* Add Product Modal inside Opportunity */}
            <Modal show={showProdModal} onHide={() => setShowProdModal(false)} centered>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold">Añadir Producto al Trato</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold small">Seleccionar Producto</Form.Label>
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
                        <Form.Label className="fw-bold small">Cantidad</Form.Label>
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
