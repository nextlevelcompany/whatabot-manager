"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Row, Col, Card, Form, Button, Table, Badge, Dropdown, Spinner, InputGroup } from 'react-bootstrap';
import { Search, List, Grid, Map, Settings, Trash, Edit, Plus, Send, RefreshCw, Calendar, MapPin, Truck, Download, Clock, ChevronLeft } from 'react-feather';
import Swal from 'sweetalert2';

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

const getApiBase = () => {
    if (typeof window !== 'undefined') {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
        return `${protocol}//${hostname}:8080`;
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';
};

const API_BASE = getApiBase();

const getLocalDateString = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

export default function PedidosViewPage() {
    const [allData, setAllData] = useState({ columns: [], pedidos: [], zonas: [], drivers: [], categories: [] });
    const [currentFiltered, setCurrentFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list' | 'map'
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [hoveredCardId, setHoveredCardId] = useState(null);
    const [settings, setSettings] = useState({
        'formato.fecha': 'd/m/Y',
        'formato.hora': '24h',
        'timezone': 'America/Lima'
    });

    // View configurations settings states
    const [cardSettings, setCardSettings] = useState({
        orderCode: true, clientName: true, address: true, deliveryDate: true, requestDate: true, products: true, payment: true, 
        driver: true, total: true, priority: true, zone: true, winTag: true 
    });
    const [filterSettings, setFilterSettings] = useState({
        dates: true, week: true, zones: true, drivers: true, payment: true, priority: true, category: true
    });
    const [listSettings, setListSettings] = useState({
        orderCode: true, client: true, requestDate: true, date: true, zone: true, products: true, stage: true, total: true, actions: true
    });
    const [whatsappSettings, setWhatsappSettings] = useState({
        orderCode: true, clientName: true, contactPerson: true, phone: true, address: true, zone: true, driver: true, date: true, products: true, total: true, mapLink: true
    });

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDesde, setFilterDesde] = useState('');
    const [filterHasta, setFilterHasta] = useState('');
    const [filterZona, setFilterZona] = useState('all');
    const [filterChofer, setFilterChofer] = useState('all');
    const [filterPago, setFilterPago] = useState('all');
    const [filterPrioridad, setFilterPrioridad] = useState('all');
    const [filterCategoria, setFilterCategoria] = useState('all');

    // Route / Map State
    const [routeListIds, setRouteListIds] = useState([]);
    const [tripDist, setTripDist] = useState('0 km');
    const [tripTime, setTripTime] = useState('0 min');
    const [mapFilter, setMapFilter] = useState('all');

    // Refs for Map
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markersRef = useRef([]);
    const routeLineRef = useRef(null);

    // Driver colors map
    const driverColors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
    const getDriverColor = (name) => {
        if (!name) return '#94a3b8';
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % driverColors.length;
        return driverColors[index];
    };

    // Load data
    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/pedidos/logistics-data`);
            if (res.ok) {
                const data = await res.json();
                setAllData(data);
            }
            
            // Load settings
            const settingsRes = await fetch(`${API_BASE}/api/settings`);
            if (settingsRes.ok) {
                const settingsData = await settingsRes.json();
                setSettings(prev => ({ ...prev, ...settingsData }));
            }
        } catch (err) {
            console.error("Error loading logistics data:", err);
            Swal.fire('Error', 'No se pudieron cargar los datos logísticos.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        
        let yyyy, mm, dd;
        
        // If it's a full ISO timestamp or has time info, parse it with timezone support
        if (dateStr.includes('T') || (dateStr.includes(' ') && dateStr.includes(':'))) {
            const normalized = dateStr.replace(' ', 'T');
            const d = new Date(normalized);
            if (!isNaN(d.getTime())) {
                yyyy = String(d.getFullYear());
                mm = String(d.getMonth() + 1).padStart(2, '0');
                dd = String(d.getDate()).padStart(2, '0');
            }
        }
        
        // Fallback for simple date-only strings or failed parsing
        if (!yyyy || !mm || !dd) {
            const cleanDateStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
            const parts = cleanDateStr.split('-');
            if (parts.length !== 3) return dateStr;
            yyyy = parts[0];
            mm = parts[1];
            dd = parts[2];
        }
        
        const format = settings['formato.fecha'] || 'd/m/Y';
        if (format === 'm/d/Y') {
            return `${mm}/${dd}/${yyyy}`;
        } else if (format === 'Y-m-d') {
            return `${yyyy}-${mm}-${dd}`;
        } else {
            return `${dd}/${mm}/${yyyy}`; // d/m/Y
        }
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const format = settings['formato.hora'] || '24h';
        const parts = timeStr.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
        if (!parts) return timeStr;
        
        let hours = parseInt(parts[1]);
        const minutes = parts[2];
        const ampm = parts[3];
        
        if (ampm) {
            if (format === '24h') {
                if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
                if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
                return `${String(hours).padStart(2, '0')}:${minutes}`;
            }
            return timeStr;
        } else {
            if (format === '12h') {
                const suffix = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12;
                if (hours === 0) hours = 12;
                return `${String(hours).padStart(2, '0')}:${minutes} ${suffix}`;
            }
            return timeStr;
        }
    };

    useEffect(() => {
        loadData();
        // Load stored route
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('pedidos_route_list');
            if (stored) {
                try {
                    setRouteListIds(JSON.parse(stored));
                } catch (e) {
                    console.error("Error parsing stored route", e);
                }
            }

            // Load view configurations
            const getStored = (key, defaults) => {
                try {
                    const storedVal = localStorage.getItem(key);
                    return storedVal ? { ...defaults, ...JSON.parse(storedVal) } : defaults;
                } catch (e) {
                    return defaults;
                }
            };
            setCardSettings(getStored('pedidos_card_settings', cardSettings));
            setFilterSettings(getStored('pedidos_filter_settings', filterSettings));
            setListSettings(getStored('pedidos_list_settings', listSettings));
            setWhatsappSettings(getStored('pedidos_whatsapp_settings', whatsappSettings));

            const storedCollapsed = localStorage.getItem('pedidos_sidebar_collapsed') === 'true';
            setSidebarCollapsed(storedCollapsed);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Filter Logic
    useEffect(() => {
        if (!allData.pedidos) return;

        const filtered = allData.pedidos.filter(p => {
            const clientName = ((p.contacto_nombre || '') + ' ' + (p.contacto_apellido || '')).toLowerCase();
            const orderNo = (p.numero_pedido || '').toLowerCase();
            const driverName = ((p.chofer_n || '') + ' ' + (p.chofer_a || '')).toLowerCase();
            const products = (p.productos_resumen || '').toLowerCase();

            const matchesSearch = !searchTerm ||
                clientName.includes(searchTerm.toLowerCase()) ||
                orderNo.includes(searchTerm.toLowerCase()) ||
                driverName.includes(searchTerm.toLowerCase()) ||
                products.includes(searchTerm.toLowerCase());

            const matchesZona = filterZona === 'all' || String(p.zona) === String(filterZona);
            const matchesChofer = filterChofer === 'all' || String(p.chofer_id) === String(filterChofer);
            const matchesPago = filterPago === 'all' || p.estado_pago === filterPago;
            const matchesPrioridad = filterPrioridad === 'all' || p.prioridad === filterPrioridad;
            const matchesCategoria = filterCategoria === 'all' || (p.categoria_nombre && String(p.categoria_nombre) === String(filterCategoria));

            let matchesDate = true;
            if (filterDesde || filterHasta) {
                const pDate = p.fecha_entrega || "";
                if (pDate === "") {
                    matchesDate = false;
                } else {
                    if (filterDesde && pDate < filterDesde) matchesDate = false;
                    if (filterHasta && pDate > filterHasta) matchesDate = false;
                }
            }

            return matchesSearch && matchesZona && matchesChofer && matchesPago && matchesPrioridad && matchesCategoria && matchesDate;
        });

        setCurrentFiltered(filtered);
    }, [allData.pedidos, searchTerm, filterDesde, filterHasta, filterZona, filterChofer, filterPago, filterPrioridad, filterCategoria]);

    // Save Route
    const saveRoute = (newRoute) => {
        setRouteListIds(newRoute);
        localStorage.setItem('pedidos_route_list', JSON.stringify(newRoute));
    };

    // Calculate KPI Totals
    const getKpiTotals = () => {
        let totalEnt = 0;
        let totalDev = 0;
        let totalSold = 0;

        currentFiltered.forEach(p => {
            const ent = parseInt(p.envases_entregados || 0);
            const dev = parseInt(p.envases_devueltos || 0);
            const sold = parseInt(p.cant_vendidos || 0);
            totalEnt += ent;
            totalDev += dev;
            if (ent > 0) totalSold += sold;
        });

        const balance = totalEnt - totalDev - totalSold;
        const recovery = totalEnt > totalSold ? ((totalDev / (totalEnt - totalSold)) * 100).toFixed(1) : '0.0';

        return {
            entregados: totalEnt,
            devueltos: totalDev,
            balance: balance,
            recuperacion: parseFloat(recovery) > 100 ? '100%' : recovery + '%'
        };
    };

    const kpi = getKpiTotals();

    const exportToExcel = async () => {
        if (!currentFiltered || currentFiltered.length === 0) {
            Swal.fire('Atención', 'No hay datos de pedidos para exportar con los filtros actuales.', 'info');
            return;
        }

        try {
            const XLSX = await loadSheetJS();
            const dataToExport = currentFiltered.map(p => {
                const colName = (allData.columns && allData.columns.find(c => String(c.id) === String(p.etapa_id))) 
                    ? allData.columns.find(c => String(c.id) === String(p.etapa_id)).nombre 
                    : 'N/A';
                return {
                    'Pedido': p.numero_pedido || '',
                    'Cliente': ((p.contacto_nombre || '') + ' ' + (p.contacto_apellido || '')).trim(),
                    'Fecha Registro': p.created_at || '',
                    'Fecha Pedido': p.fecha_pedido || '',
                    'Fecha Entrega': p.fecha_entrega || '',
                    'Zona': p.zona_nombre || '',
                    'Dirección': p.direccion_entrega || '',
                    'Prioridad': p.prioridad || '',
                    'Resumen Productos': p.productos_resumen || '',
                    'Estado Pago': p.estado_pago || '',
                    'Chofer/Conductor': ((p.chofer_n || '') + ' ' + (p.chofer_a || '')).trim() || 'No asignado',
                    'Etapa': colName,
                    'Total (S/)': parseFloat(p.total || 0),
                    'Envases Entregados': parseInt(p.envases_entregados || 0),
                    'Envases Devueltos': parseInt(p.envases_devueltos || 0),
                    'Estado Venta': p.venta_estado || 'Pendiente'
                };
            });

            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Pedidos");
            
            // Auto-fit columns
            const maxLen = {};
            dataToExport.forEach(row => {
                Object.keys(row).forEach(key => {
                    const val = String(row[key] || '');
                    maxLen[key] = Math.max(maxLen[key] || key.length, val.length);
                });
            });
            ws['!cols'] = Object.keys(maxLen).map(key => ({ wch: Math.min(30, maxLen[key] + 2) }));

            const filename = 'Reporte_Pedidos_' + new Date().toISOString().slice(0, 10) + '.xlsx';
            XLSX.writeFile(wb, filename);

            Swal.fire({
                icon: 'success',
                title: '¡Descarga Iniciada!',
                text: 'El reporte de pedidos se ha exportado correctamente.',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            console.error("Error exporting to Excel", err);
            Swal.fire('Error', 'No se pudo exportar a Excel.', 'error');
        }
    };

    const openGlobalConfig = () => {
        Swal.fire({
            title: 'Configuración de Vista',
            width: '750px',
            html: `
                <div class="text-start" style="font-family: sans-serif; font-size: 14px;">
                    <ul class="nav nav-tabs nav-tabs-custom nav-justified mb-3" role="tablist" style="display: flex; list-style: none; border-bottom: 2px solid #e2e8f0; padding-left: 0; margin-bottom: 15px;">
                        <li class="nav-item" style="flex: 1; text-align: center;"><a class="nav-link active fw-bold py-2" style="color: #3b82f6; display: block; border-bottom: 2px solid #3b82f6; text-decoration: none;" href="#config-cards">Tarjetas (Kanban)</a></li>
                        <li class="nav-item" style="flex: 1; text-align: center;"><a class="nav-link py-2" style="color: #64748b; display: block; text-decoration: none;" href="#config-list">Tabla (Lista)</a></li>
                        <li class="nav-item" style="flex: 1; text-align: center;"><a class="nav-link py-2" style="color: #64748b; display: block; text-decoration: none;" href="#config-filters">Filtros (Lateral)</a></li>
                        <li class="nav-item" style="flex: 1; text-align: center;"><a class="nav-link py-2" style="color: #64748b; display: block; text-decoration: none;" href="#config-whatsapp">Plantilla WhatsApp</a></li>
                    </ul>
                    <div class="tab-content p-3 pt-0">
                        <div class="tab-pane active" id="config-cards" style="display: block;">
                            <div class="row">
                                <div class="col-6">
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-c-req" ${cardSettings.requestDate ? 'checked' : ''}> <label class="small fw-bold">Registro Sistema</label></div>
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-c-code" ${cardSettings.orderCode ? 'checked' : ''}> <label class="small fw-bold">Nro Pedido</label></div>
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-c-client" ${cardSettings.clientName ? 'checked' : ''}> <label class="small fw-bold">Cliente</label></div>
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-c-address" ${cardSettings.address ? 'checked' : ''}> <label class="small fw-bold">Dirección</label></div>
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-c-date" ${cardSettings.deliveryDate ? 'checked' : ''}> <label class="small fw-bold">Fecha Entrega</label></div>
                                </div>
                                <div class="col-6">
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-c-products" ${cardSettings.products ? 'checked' : ''}> <label class="small fw-bold">Productos</label></div>
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-c-driver" ${cardSettings.driver ? 'checked' : ''}> <label class="small fw-bold">Chofer</label></div>
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-c-total" ${cardSettings.total ? 'checked' : ''}> <label class="small fw-bold">Total</label></div>
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-c-priority" ${cardSettings.priority ? 'checked' : ''}> <label class="small fw-bold">Prioridad</label></div>
                                </div>
                            </div>
                        </div>
                        <div class="tab-pane" id="config-list" style="display: none;">
                            <div class="row">
                                <div class="col-6">
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-l-req" ${listSettings.requestDate ? 'checked' : ''}> <label class="small fw-bold">Registro Sistema</label></div>
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-l-code" ${listSettings.orderCode ? 'checked' : ''}> <label class="small fw-bold">Pedido</label></div>
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-l-client" ${listSettings.client ? 'checked' : ''}> <label class="small fw-bold">Cliente</label></div>
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-l-date" ${listSettings.date ? 'checked' : ''}> <label class="small fw-bold">Entrega</label></div>
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-l-zone" ${listSettings.zone ? 'checked' : ''}> <label class="small fw-bold">Zona</label></div>
                                </div>
                                <div class="col-6">
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-l-products" ${listSettings.products ? 'checked' : ''}> <label class="small fw-bold">Resumen Productos</label></div>
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-l-stage" ${listSettings.stage ? 'checked' : ''}> <label class="small fw-bold">Etapa (Columna)</label></div>
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-l-total" ${listSettings.total ? 'checked' : ''}> <label class="small fw-bold">Total</label></div>
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-l-actions" ${listSettings.actions ? 'checked' : ''}> <label class="small fw-bold">Acciones</label></div>
                                </div>
                            </div>
                        </div>
                        <div class="tab-pane" id="config-filters" style="display: none;">
                            <div class="row">
                                <div class="col-6">
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-f-dates" ${filterSettings.dates ? 'checked' : ''}> <label class="small fw-bold">Rango Fechas</label></div>
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-f-week" ${filterSettings.week ? 'checked' : ''}> <label class="small fw-bold">Prog. Semanal</label></div>
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-f-zones" ${filterSettings.zones ? 'checked' : ''}> <label class="small fw-bold">Zonas</label></div>
                                </div>
                                <div class="col-6">
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-f-drivers" ${filterSettings.drivers ? 'checked' : ''}> <label class="small fw-bold">Choferes</label></div>
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-f-payment" ${filterSettings.payment ? 'checked' : ''}> <label class="small fw-bold">Edo. Pago</label></div>
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-f-priority" ${filterSettings.priority ? 'checked' : ''}> <label class="small fw-bold">Prioridad</label></div>
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-f-category" ${filterSettings.category ? 'checked' : ''}> <label class="small fw-bold">Categorías</label></div>
                                </div>
                            </div>
                        </div>
                        <div class="tab-pane" id="config-whatsapp" style="display: none;">
                            <div class="row">
                                <div class="col-6">
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-w-code" ${whatsappSettings.orderCode ? 'checked' : ''}> <label class="small fw-bold">Nro Pedido</label></div>
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-w-client" ${whatsappSettings.clientName ? 'checked' : ''}> <label class="small fw-bold">Cliente</label></div>
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-w-contact" ${whatsappSettings.contactPerson ? 'checked' : ''}> <label class="small fw-bold">Contacto (Empresas)</label></div>
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-w-phone" ${whatsappSettings.phone ? 'checked' : ''}> <label class="small fw-bold">Teléfono</label></div>
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-w-address" ${whatsappSettings.address ? 'checked' : ''}> <label class="small fw-bold">Dirección</label></div>
                                </div>
                                <div class="col-6">
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-w-zone" ${whatsappSettings.zone ? 'checked' : ''}> <label class="small fw-bold">Zona Logística</label></div>
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-w-driver" ${whatsappSettings.driver ? 'checked' : ''}> <label class="small fw-bold">Chofer</label></div>
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-w-date" ${whatsappSettings.date ? 'checked' : ''}> <label class="small fw-bold">Fecha Entrega</label></div>
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-w-products" ${whatsappSettings.products ? 'checked' : ''}> <label class="small fw-bold">Resumen Productos</label></div>
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-w-total" ${whatsappSettings.total ? 'checked' : ''}> <label class="small fw-bold">Total / Edo Pago</label></div>
                                    <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" id="cfg-w-map" ${whatsappSettings.mapLink ? 'checked' : ''}> <label class="small fw-bold">📍 Link Ubicación</label></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            didOpen: () => {
                const triggerTabList = [].slice.call(document.querySelectorAll('.swal2-html-container .nav-link'));
                triggerTabList.forEach(triggerEl => {
                    triggerEl.addEventListener('click', (e) => {
                        e.preventDefault();
                        triggerTabList.forEach(el => {
                            el.classList.remove('active');
                            el.style.color = '#64748b';
                            el.style.borderBottom = 'none';
                            const target = document.querySelector(el.getAttribute('href'));
                            if (target) target.style.display = 'none';
                        });
                        triggerEl.classList.add('active');
                        triggerEl.style.color = '#3b82f6';
                        triggerEl.style.borderBottom = '2px solid #3b82f6';
                        const target = document.querySelector(triggerEl.getAttribute('href'));
                        if (target) target.style.display = 'block';
                    });
                });
            },
            preConfirm: () => {
                return {
                    cards: {
                        orderCode: document.getElementById('cfg-c-code').checked,
                        clientName: document.getElementById('cfg-c-client').checked,
                        address: document.getElementById('cfg-c-address').checked,
                        deliveryDate: document.getElementById('cfg-c-date').checked,
                        requestDate: document.getElementById('cfg-c-req').checked,
                        products: document.getElementById('cfg-c-products').checked,
                        payment: true,
                        driver: document.getElementById('cfg-c-driver').checked,
                        total: document.getElementById('cfg-c-total').checked,
                        priority: document.getElementById('cfg-c-priority').checked,
                        winTag: true,
                        zone: true
                    },
                    filters: {
                        dates: document.getElementById('cfg-f-dates').checked,
                        week: document.getElementById('cfg-f-week').checked,
                        zones: document.getElementById('cfg-f-zones').checked,
                        drivers: document.getElementById('cfg-f-drivers').checked,
                        payment: document.getElementById('cfg-f-payment').checked,
                        priority: document.getElementById('cfg-f-priority').checked,
                        category: document.getElementById('cfg-f-category').checked
                    },
                    list: {
                        orderCode: document.getElementById('cfg-l-code').checked,
                        client: document.getElementById('cfg-l-client').checked,
                        requestDate: document.getElementById('cfg-l-req').checked,
                        date: document.getElementById('cfg-l-date').checked,
                        zone: document.getElementById('cfg-l-zone').checked,
                        products: document.getElementById('cfg-l-products').checked,
                        stage: document.getElementById('cfg-l-stage').checked,
                        total: document.getElementById('cfg-l-total').checked,
                        actions: document.getElementById('cfg-l-actions').checked
                    },
                    whatsapp: {
                        orderCode: document.getElementById('cfg-w-code').checked,
                        clientName: document.getElementById('cfg-w-client').checked,
                        contactPerson: document.getElementById('cfg-w-contact').checked,
                        phone: document.getElementById('cfg-w-phone').checked,
                        address: document.getElementById('cfg-w-address').checked,
                        zone: document.getElementById('cfg-w-zone').checked,
                        driver: document.getElementById('cfg-w-driver').checked,
                        date: document.getElementById('cfg-w-date').checked,
                        products: document.getElementById('cfg-w-products').checked,
                        total: document.getElementById('cfg-w-total').checked,
                        mapLink: document.getElementById('cfg-w-map').checked
                    }
                };
            }
        }).then((r) => {
            if (r.isConfirmed) {
                setCardSettings(r.value.cards);
                setFilterSettings(r.value.filters);
                setListSettings(r.value.list);
                setWhatsappSettings(r.value.whatsapp);
                localStorage.setItem('pedidos_card_settings', JSON.stringify(r.value.cards));
                localStorage.setItem('pedidos_filter_settings', JSON.stringify(r.value.filters));
                localStorage.setItem('pedidos_list_settings', JSON.stringify(r.value.list));
                localStorage.setItem('pedidos_whatsapp_settings', JSON.stringify(r.value.whatsapp));
            }
        });
    };

    // Map initialization & rendering
    useEffect(() => {
        if (viewMode !== 'map' || typeof window === 'undefined') return;

        let isMounted = true;
        let mapInstance = null;

        const initLeafletMap = () => {
            if (!window.L || !mapContainerRef.current) return;

            // Destroy existing map
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }

            mapInstance = window.L.map(mapContainerRef.current).setView([-12.046374, -77.042793], 12);
            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(mapInstance);

            mapRef.current = mapInstance;
            renderMarkers();
        };

        // Load Leaflet CSS
        if (!document.getElementById('leaflet-css-interactive')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css-interactive';
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }

        // Load Leaflet JS
        if (!window.L) {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => {
                if (isMounted) initLeafletMap();
            };
            document.head.appendChild(script);
        } else {
            initLeafletMap();
        }

        return () => {
            isMounted = false;
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [viewMode, currentFiltered, routeListIds, mapFilter]);

    const renderMarkers = () => {
        const map = mapRef.current;
        if (!map || !window.L) return;

        // Clear markers
        markersRef.current.forEach(m => map.removeLayer(m));
        markersRef.current = [];

        if (routeLineRef.current) {
            map.removeLayer(routeLineRef.current);
            routeLineRef.current = null;
        }

        const validPeds = currentFiltered.filter(p => p.latitud && p.longitud);

        validPeds.forEach(p => {
            const lat = parseFloat(p.latitud);
            const lng = parseFloat(p.longitud);
            if (isNaN(lat) || isNaN(lng)) return;

            const col = allData.columns.find(c => String(c.id) == String(p.etapa_id)) || { nombre: 'N/A', es_entregado: 0, es_perdido: 0 };
            const isLocked = (col.es_entregado == 1) || (col.es_perdido == 1) || (p.venta_id && (p.venta_estado === 'completada' || p.venta_estado === 'cancelada'));

            if (mapFilter === 'pending' && isLocked) return;
            if (mapFilter === 'done' && !isLocked) return;

            const markerColor = isLocked ? '#64748b' : '#3b82f6';
            const routeIndex = routeListIds.indexOf(String(p.id));
            const isRouted = routeIndex !== -1;
            const markerText = isRouted ? (routeIndex + 1) : (p.numero_pedido ? p.numero_pedido.slice(-3) : '?');

            const customIcon = window.L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="background-color:${markerColor}; color:white; font-size:10px; font-weight:bold; display:flex; align-items:center; justify-content:center; width:24px; height:24px; border-radius:50%; border:2px solid white; box-shadow:0 2px 5px rgba(0,0,0,0.3); ${isRouted ? 'border: 2px solid #f59e0b;' : ''}">${markerText}</div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });

            const marker = window.L.marker([lat, lng], { icon: customIcon }).addTo(map);
            const clientName = ((p.contacto_nombre || '') + ' ' + (p.contacto_apellido || '')).trim();

            marker.bindPopup(`
                <div style="min-width: 160px; font-family: sans-serif;">
                    <strong style="display:block; margin-bottom: 4px;">${clientName}</strong>
                    <div style="font-size: 11px; color:#64748b; margin-bottom: 6px;">${p.direccion_entrega}</div>
                    <div style="font-weight: bold; color:#4f46e5; margin-bottom: 8px; font-size:11px;">${p.productos_resumen || 'Sin productos'}</div>
                    ${!isLocked ? `<button id="btn-add-route-${p.id}" class="btn btn-primary btn-sm w-100 py-1" style="font-size:10px; font-weight:bold;">Agregar a Ruta</button>` : `<span class="badge bg-secondary w-100 py-1">Atendido</span>`}
                </div>
            `);

            marker.on('popupopen', () => {
                const btn = document.getElementById(`btn-add-route-${p.id}`);
                if (btn) {
                    btn.onclick = () => {
                        addToRoute(p.id);
                        marker.closePopup();
                    };
                }
            });

            markersRef.current.push(marker);
        });

        if (markersRef.current.length > 0) {
            const group = new window.L.featureGroup(markersRef.current);
            map.fitBounds(group.getBounds(), { padding: [30, 30] });
        }
    };

    const addToRoute = (id) => {
        const strId = String(id);
        if (routeListIds.includes(strId)) {
            Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Ya está en la ruta', showConfirmButton: false, timer: 1500 });
            return;
        }
        const newRoute = [...routeListIds, strId];
        saveRoute(newRoute);
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Agregado a la ruta', showConfirmButton: false, timer: 1500 });
    };

    const removeFromRoute = (id) => {
        const strId = String(id);
        const newRoute = routeListIds.filter(x => x !== strId);
        saveRoute(newRoute);
    };

    // Draw route line via OSRM
    const drawRouteLine = async () => {
        const currentRouteObjects = routeListIds.map(id => allData.pedidos.find(p => String(p.id) === String(id))).filter(Boolean);
        if (currentRouteObjects.length < 2) {
            Swal.fire('Atención', 'Necesitas al menos 2 paradas.', 'warning');
            return;
        }
        const coordString = currentRouteObjects.map(p => `${parseFloat(p.longitud)},${parseFloat(p.latitud)}`).join(';');
        const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`;

        Swal.fire({ title: 'Trazando ruta...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

        try {
            const res = await fetch(url);
            Swal.close();
            if (res.ok) {
                const data = await res.json();
                if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                    const map = mapRef.current;
                    if (routeLineRef.current) map.removeLayer(routeLineRef.current);

                    const route = data.routes[0];
                    const coordinates = route.geometry.coordinates.map(c => [c[1], c[0]]);

                    routeLineRef.current = window.L.polyline(coordinates, {
                        color: '#3b82f6',
                        weight: 5,
                        opacity: 0.8,
                        dashArray: '10, 10'
                    }).addTo(map);

                    const distKm = (route.distance / 1000).toFixed(1);
                    const timeMin = Math.round(route.duration / 60);
                    setTripDist(`${distKm} km`);
                    setTripTime(`${timeMin} min`);

                    map.fitBounds(routeLineRef.current.getBounds(), { padding: [30, 30] });
                } else {
                    Swal.fire('Error', 'No se pudo generar la ruta entre los puntos.', 'error');
                }
            }
        } catch (err) {
            Swal.close();
            Swal.fire('Error de red', 'No se pudo conectar con el servidor de rutas.', 'error');
        }
    };

    // Optimize Route
    const optimizeRouteOrder = async () => {
        const currentRouteObjects = routeListIds.map(id => allData.pedidos.find(p => String(p.id) === String(id))).filter(Boolean);
        if (currentRouteObjects.length < 3) {
            Swal.fire('Atención', 'Necesitas al menos 3 paradas para optimizar.', 'info');
            return;
        }
        const coordString = currentRouteObjects.map(p => `${parseFloat(p.longitud)},${parseFloat(p.latitud)}`).join(';');
        const url = `https://router.project-osrm.org/trip/v1/driving/${coordString}?source=first&overview=full&geometries=geojson`;

        Swal.fire({ title: 'Optimizando ruta...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

        try {
            const res = await fetch(url);
            Swal.close();
            if (res.ok) {
                const data = await res.json();
                if (data.code === 'Ok' && data.trips && data.trips.length > 0) {
                    const newRouteIds = data.waypoints.map(wp => String(currentRouteObjects[wp.waypoint_index].id));
                    saveRoute(newRouteIds);

                    const map = mapRef.current;
                    if (routeLineRef.current) map.removeLayer(routeLineRef.current);

                    const trip = data.trips[0];
                    const coordinates = trip.geometry.coordinates.map(c => [c[1], c[0]]);

                    routeLineRef.current = window.L.polyline(coordinates, {
                        color: '#10b981',
                        weight: 5,
                        opacity: 0.8,
                        dashArray: '10, 10'
                    }).addTo(map);

                    const distKm = (trip.distance / 1000).toFixed(1);
                    const timeMin = Math.round(trip.duration / 60);
                    setTripDist(`${distKm} km`);
                    setTripTime(`${timeMin} min`);
                } else {
                    Swal.fire('Error', 'No se pudo optimizar la secuencia de paradas.', 'error');
                }
            }
        } catch (err) {
            Swal.close();
            Swal.fire('Error', 'Error al conectar con el optimizador.', 'error');
        }
    };

    const sendRouteToDriver = () => {
        const currentRouteObjects = routeListIds.map(id => allData.pedidos.find(p => String(p.id) === String(id))).filter(Boolean);
        if (currentRouteObjects.length === 0) {
            Swal.fire('Atención', 'Agrega paradas a la ruta.', 'warning');
            return;
        }
        const url = "https://www.google.com/maps/dir/" + currentRouteObjects.map(p => `${p.latitud},${p.longitud}`).join('/');
        const msg = `📍 *Ruta de Reparto:*\n${url}\n\n` + currentRouteObjects.map((p, i) => `${i + 1}. ${p.contacto_nombre} (${p.direccion_entrega})`).join('\n');

        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(msg);
            Swal.fire({
                icon: 'success',
                title: '¡Copiado!',
                html: `La ruta de reparto ha sido copiada. Puedes enviarla por WhatsApp.<br><br><a href="${url}" target="_blank" class="btn btn-primary btn-sm mt-3">Ver en Google Maps</a>`
            });
        }
    };

    // Drag and drop handlers
    const handleDragStart = (e, orderId) => {
        e.dataTransfer.setData("text/plain", orderId);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = async (e, columnId) => {
        e.preventDefault();
        const orderId = e.dataTransfer.getData("text/plain");
        const order = allData.pedidos.find(x => String(x.id) === String(orderId));
        const tc = allData.columns.find(c => String(c.id) === String(columnId));

        if (!order || !tc) return;

        const executeMove = async (extra = {}) => {
            try {
                const res = await fetch(`${API_BASE}/api/pedidos/move`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        pedido_id: parseInt(orderId),
                        etapa_id: parseInt(columnId),
                        ...extra
                    })
                });
                if (res.ok) {
                    loadData();
                } else {
                    const err = await res.json();
                    Swal.fire('Error', err.message || 'Error al mover pedido.', 'error');
                }
            } catch (err) {
                Swal.fire('Error', 'Error de conexión.', 'error');
            }
        };

        if (tc.es_entregado == 1) {
            const todayStr = getLocalDateString(new Date());
            const isDifferentDate = order.fecha_entrega !== todayStr;
            let dateWarning = '';
            if (isDifferentDate) {
                dateWarning = `
                    <div class="alert alert-info p-2 mb-3 d-flex align-items-center" style="font-size: 11px; text-align: left;">
                        <span>Pedido programado para: <b>${order.fecha_entrega}</b>. Se actualizará a HOY.</span>
                    </div>
                `;
            }

            Swal.fire({
                title: 'Confirmar Entrega',
                html: `
                    <div style="font-family: sans-serif; font-size: 14px;">
                        ${dateWarning}
                        <div class="alert alert-warning p-2 mb-3" style="font-size: 11px; text-align: left;">
                            Saldo actual del cliente: <b>${order.saldo_actual_cliente || 0} bidones</b>
                        </div>
                        <div class="bg-light p-2 mb-3 rounded border text-start">
                            <small class="text-muted text-uppercase d-block" style="font-size: 9px; font-weight:800;">Detalle del Pedido:</small>
                            <span class="fw-bold">${order.productos_resumen || 'Sin detalle'}</span>
                        </div>
                        <div class="mb-3 text-start">
                            <label class="small fw-bold">¿Quién recibió el pedido?</label>
                            <input id="swal-recibio" class="form-control form-control-sm" value="${((order.contacto_nombre || '') + ' ' + (order.contacto_apellido || '')).trim()}">
                        </div>
                        <div class="row g-2 mb-3 text-start">
                            <div class="col-6">
                                <label class="small fw-bold text-primary">Envases Entregados:</label>
                                <input id="swal-entregados" type="number" class="form-control form-control-sm" value="0">
                            </div>
                            <div class="col-6">
                                <label class="small fw-bold text-success">Envases Devueltos:</label>
                                <input id="swal-devueltos" type="number" class="form-control form-control-sm" value="0">
                            </div>
                        </div>
                        <div class="row g-2 mb-3 text-start">
                            <div class="col-6">
                                <label class="small fw-bold">Monto Cobrado (S/):</label>
                                <input id="swal-monto" type="number" step="0.01" class="form-control form-control-sm" value="${order.total}">
                            </div>
                            <div class="col-6">
                                <label class="small fw-bold">Método de Pago:</label>
                                <select id="swal-metodo" class="form-select form-select-sm">
                                    <option value="efectivo" ${order.metodo_pago === 'efectivo' ? 'selected' : ''}>Efectivo</option>
                                    <option value="yape" ${order.metodo_pago === 'yape' ? 'selected' : ''}>Yape</option>
                                    <option value="plin" ${order.metodo_pago === 'plin' ? 'selected' : ''}>Plin</option>
                                    <option value="transferencia" ${order.metodo_pago === 'transferencia' ? 'selected' : ''}>Transferencia</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-check form-switch text-start">
                            <input class="form-check-input" type="checkbox" id="swal-pendiente-pago" ${order.estado_pago !== 'Pagado' ? 'checked' : ''}>
                            <label class="form-check-label small fw-bold text-danger" for="swal-pendiente-pago">Marcar como PENDIENTE DE PAGO</label>
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Confirmar y Entregar',
                preConfirm: () => ({
                    quien_recibio: document.getElementById('swal-recibio').value,
                    envases_entregados: parseInt(document.getElementById('swal-entregados').value) || 0,
                    envases_devueltos: parseInt(document.getElementById('swal-devueltos').value) || 0,
                    monto_final: parseFloat(document.getElementById('swal-monto').value) || 0.0,
                    metodo_pago_real: document.getElementById('swal-metodo').value,
                    pendiente_pago: document.getElementById('swal-pendiente-pago').checked ? 1 : 0
                })
            }).then(r => {
                if (r.isConfirmed) executeMove(r.value);
            });
        } else {
            executeMove();
        }
    };

    // Columns CRUD
    const addColumn = () => {
        Swal.fire({
            title: 'Nueva Etapa',
            input: 'text',
            inputPlaceholder: 'Nombre de la etapa...',
            showCancelButton: true,
            confirmButtonText: 'Crear'
        }).then(async r => {
            if (r.isConfirmed && r.value) {
                try {
                    const res = await fetch(`${API_BASE}/api/pedidos/columns`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: r.value })
                    });
                    if (res.ok) {
                        loadData();
                    }
                } catch (e) {
                    Swal.fire('Error', 'No se pudo crear la etapa', 'error');
                }
            }
        });
    };

    const configCol = (id, currentName) => {
        Swal.fire({
            title: 'Configurar Etapa',
            input: 'text',
            inputValue: currentName,
            showCancelButton: true,
            confirmButtonText: 'Guardar'
        }).then(async r => {
            if (r.isConfirmed && r.value) {
                try {
                    const res = await fetch(`${API_BASE}/api/pedidos/columns/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: r.value })
                    });
                    if (res.ok) {
                        loadData();
                    }
                } catch (e) {
                    Swal.fire('Error', 'No se pudo guardar la configuración', 'error');
                }
            }
        });
    };

    const deleteCol = (id) => {
        Swal.fire({
            title: '¿Eliminar Etapa?',
            text: 'Esta acción no se puede deshacer si existen pedidos asociados.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Eliminar'
        }).then(async r => {
            if (r.isConfirmed) {
                try {
                    const res = await fetch(`${API_BASE}/api/pedidos/columns/${id}`, {
                        method: 'DELETE'
                    });
                    if (res.ok) {
                        loadData();
                    } else {
                        const err = await res.json();
                        Swal.fire('Error', err.message || 'No se puede eliminar la etapa.', 'error');
                    }
                } catch (e) {
                    Swal.fire('Error', 'Error de red al eliminar.', 'error');
                }
            }
        });
    };

    const deleteOrder = (id) => {
        Swal.fire({
            title: '¿Eliminar Pedido?',
            text: 'Se eliminará permanentemente de la base de datos.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Eliminar'
        }).then(async r => {
            if (r.isConfirmed) {
                try {
                    const res = await fetch(`${API_BASE}/api/pedidos/${id}`, {
                        method: 'DELETE'
                    });
                    if (res.ok) {
                        loadData();
                    }
                } catch (e) {
                    Swal.fire('Error', 'No se pudo eliminar el pedido.', 'error');
                }
            }
        });
    };

    const shareOrderWhatsapp = (order) => {
        let client = '';
        let contact = '';
        let phone = '';

        if (order.tipo_contacto === 'empresa') {
            client = (order.contacto_nombre || '').trim();
            contact = (order.persona_vinculada || 'No especificado').trim();
            phone = (order.telefono_vinculado || order.telefono_movil || order.telefono_fijo || 'Sin teléfono').trim();
        } else {
            client = ((order.contacto_nombre || '') + ' ' + (order.contacto_apellido || '')).trim();
            if (order.empresa_nombre) client = `${order.empresa_nombre} (${client})`;
            phone = (order.telefono_movil || order.telefono_fijo || 'Sin teléfono').trim();
        }

        const date = formatDate(order.fecha_entrega);
        const time = order.hora_entrega ? formatTime(order.hora_entrega) : '';
        const driver = order.chofer_n ? `${order.chofer_n} ${order.chofer_a || ''}`.trim() : 'No asignado';
        const total = parseFloat(order.total || 0).toFixed(2);

        let msg = `📦 *DETALLES DEL PEDIDO*\n\n`;
        if (whatsappSettings.orderCode) msg += `*Pedido:* ${order.numero_pedido || 'N/A'}\n`;
        if (whatsappSettings.clientName) msg += `👤 *Cliente:* ${client}\n`;
        if (whatsappSettings.contactPerson && order.tipo_contacto === 'empresa') msg += `👤 *Contacto:* ${contact}\n`;
        if (whatsappSettings.phone) msg += `📞 *Teléfono:* ${phone}\n`;
        if (whatsappSettings.address) msg += `📍 *Dirección:* ${order.direccion_entrega} (${order.distrito || 'S.D.'})\n`;
        if (whatsappSettings.zone) msg += `🗺️ *Zona:* ${order.zona_nombre || 'N/A'}\n`;
        if (whatsappSettings.driver) msg += `🚛 *Chofer:* ${driver}\n`;
        if (whatsappSettings.date) msg += `📅 *Fecha Entrega:* ${date}${time ? ' ' + time : ''}\n`;
        if (whatsappSettings.products) msg += `🛒 *Productos:* ${order.productos_resumen || ''}\n`;
        if (whatsappSettings.total) msg += `💰 *Total / Pago:* S/ ${total} (${order.estado_pago})\n`;

        if (order.notes || order.notas) msg += `📝 *Notas:* ${order.notes || order.notas}\n`;

        if (whatsappSettings.mapLink) {
            if (order.latitud && order.longitud) {
                msg += `\n📍 *Ubicación:* https://www.google.com/maps?q=${order.latitud},${order.longitud}`;
            } else {
                msg += `\n📍 *Ubicación:* https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.direccion_entrega + ' ' + (order.distrito || ''))}`;
            }
        }

        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(msg);
            Swal.fire({
                icon: 'success',
                title: '¡Copiado!',
                text: 'La información del pedido ha sido copiada. Pégala en WhatsApp.',
                timer: 2000,
                showConfirmButton: false
            });
        }
    };

    // Filter Helper: Weekday Programming
    const filterByDay = (dateStr) => {
        setFilterDesde(filterDesde === dateStr ? '' : dateStr);
        setFilterHasta(filterHasta === dateStr ? '' : dateStr);
    };

    const getWeekDays = () => {
        const list = [];
        const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
        const now = new Date();
        now.setHours(12, 0, 0, 0); // Normalize to midday to prevent timezone/DST date shifts
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

            // Count pending vs delivered for this day
            const dayOrders = (allData.pedidos || []).filter(p => p.fecha_entrega === dateStr);
            const pendingCount = dayOrders.filter(p => p.venta_estado !== 'cancelada' && p.venta_estado !== 'completada' && p.venta_estado !== 'entregado').length;
            const deliveredCount = dayOrders.filter(p => p.venta_estado === 'completada' || p.venta_estado === 'entregado').length;

            list.push({ dateStr, label, dayNum, isToday, isActive, pendingCount, deliveredCount });
        }
        return list;
    };

    const weekDays = getWeekDays();

    return (
        <div className="p-4" style={{ background: '#f8fafc', minHeight: '100vh' }}>
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
                            localStorage.setItem('pedidos_sidebar_collapsed', String(newCollapsed));
                        }} 
                        title={sidebarCollapsed ? "Mostrar filtros" : "Ocultar filtros"}
                    >
                        <List size={15} />
                        <span className="fw-semibold">{sidebarCollapsed ? "Mostrar Filtros" : "Ocultar Filtros"}</span>
                    </Button>
                    <h4 className="mb-0 text-primary fw-bold d-flex align-items-center">
                        <Truck size={24} className="me-2" />
                        Logística y Pedidos
                    </h4>
                </div>
                <div style={{ maxWidth: '400px', flexGrow: 1 }} className="mx-lg-4">
                    <InputGroup>
                        <InputGroup.Text className="bg-white border-end-0">
                            <Search size={18} className="text-muted" />
                        </InputGroup.Text>
                        <Form.Control
                            className="border-start-0 shadow-none"
                            placeholder="Buscar pedido, cliente, chofer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>
                </div>
                <div className="d-flex gap-2 align-items-center">
                    <div className="btn-group bg-light border rounded p-1" style={{ height: '40px' }}>
                        <Button
                            variant={viewMode === 'kanban' ? 'primary' : 'light'}
                            size="sm"
                            className="fw-bold px-3 border-0"
                            onClick={() => setViewMode('kanban')}
                        >
                            KANBAN
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'primary' : 'light'}
                            size="sm"
                            className="fw-bold px-3 border-0"
                            onClick={() => setViewMode('list')}
                        >
                            LISTA
                        </Button>
                        <Button
                            variant={viewMode === 'map' ? 'primary' : 'light'}
                            size="sm"
                            className="fw-bold px-3 border-0"
                            onClick={() => setViewMode('map')}
                        >
                            <Map size={14} className="me-1" /> MAPA
                        </Button>
                    </div>
                    <Button 
                        variant="success" 
                        className="fw-bold d-inline-flex align-items-center justify-content-center bg-success text-white border-0" 
                        style={{ height: '40px' }} 
                        onClick={exportToExcel}
                        title="Exportar a Excel"
                    >
                        <Download size={16} className="me-1" /> EXCEL
                    </Button>
                    <Button 
                        variant="light" 
                        className="fw-bold d-inline-flex align-items-center justify-content-center border me-2" 
                        style={{ height: '40px' }} 
                        onClick={openGlobalConfig}
                        title="Configurar vista"
                    >
                        <Settings size={16} />
                    </Button>
                    <Button variant="primary" className="fw-bold" style={{ height: '40px' }} href="/pedidos/create">
                        <Plus size={16} className="me-1" /> NUEVO
                    </Button>
                </div>
            </div>

            {/* KPI Summary Row */}
            <Row className="mb-4">
                <Col md={3}>
                    <Card className="shadow-sm border-0 bg-white">
                        <Card.Body className="p-3 text-center">
                            <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '10px' }}>Envases Entregados</small>
                            <h4 className="mb-0 fw-bold text-primary mt-1">{kpi.entregados}</h4>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="shadow-sm border-0 bg-white">
                        <Card.Body className="p-3 text-center">
                            <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '10px' }}>Envases Devueltos</small>
                            <h4 className="mb-0 fw-bold text-success mt-1">{kpi.devueltos}</h4>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="shadow-sm border-0 bg-white">
                        <Card.Body className="p-3 text-center">
                            <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '10px' }}>Balance (Deuda)</small>
                            <h4 className="mb-0 fw-bold text-danger mt-1">{kpi.balance}</h4>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="shadow-sm border-0 bg-white">
                        <Card.Body className="p-3 text-center">
                            <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '10px' }}>Recuperación</small>
                            <h4 className="mb-0 fw-bold text-dark mt-1">{kpi.recuperacion}</h4>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                {/* Filters Sidebar */}
                {!sidebarCollapsed && (
                    <Col lg={3} className="mb-4">
                        <div className="bg-white p-4 rounded shadow-sm border" style={{ position: 'sticky', top: '20px' }}>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div className="d-flex align-items-center gap-2">
                                    <h5 className="mb-0 fw-bold text-dark" style={{ fontSize: '14px' }}>FILTROS</h5>
                                    <Button
                                        variant="light"
                                        size="sm"
                                        className="p-1 border d-flex align-items-center justify-content-center rounded-circle"
                                        onClick={() => {
                                            setSidebarCollapsed(true);
                                            localStorage.setItem('pedidos_sidebar_collapsed', 'true');
                                        }}
                                        title="Ocultar filtros"
                                    >
                                        <ChevronLeft size={14} className="text-muted" />
                                    </Button>
                                </div>
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="text-danger fw-bold text-decoration-none p-0"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFilterDesde('');
                                        setFilterHasta('');
                                        setFilterZona('all');
                                        setFilterChofer('all');
                                        setFilterPago('all');
                                        setFilterPrioridad('all');
                                    }}
                                >
                                    LIMPIAR
                                </Button>
                            </div>

                            {/* Date filters */}
                            {filterSettings.dates && (
                                <div className="mb-4">
                                    <span className="d-block text-muted fw-bold mb-2" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Rango de Fechas</span>
                                    <Row className="g-2">
                                        <Col xs={6}>
                                            <Form.Control
                                                type="date"
                                                size="sm"
                                                value={filterDesde}
                                                onChange={(e) => setFilterDesde(e.target.value)}
                                            />
                                        </Col>
                                        <Col xs={6}>
                                            <Form.Control
                                                type="date"
                                                size="sm"
                                                value={filterHasta}
                                                onChange={(e) => setFilterHasta(e.target.value)}
                                            />
                                        </Col>
                                    </Row>
                                </div>
                            )}

                            {/* Weekly Programming */}
                            {filterSettings.week && (
                                <div className="mb-4">
                                    <span className="d-block text-muted fw-bold mb-2" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Programación Semanal</span>
                                    <div className="d-flex justify-content-between gap-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                                        {weekDays.map(day => (
                                            <button
                                                key={day.dateStr}
                                                onClick={() => filterByDay(day.dateStr)}
                                                className={`btn btn-sm d-flex flex-column align-items-center justify-content-center p-1 rounded-3 ${
                                                    day.isActive ? 'btn-primary' : (day.isToday ? 'btn-soft-primary border-primary' : 'btn-light border')
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
                                                        color: day.isActive ? '#0d6efd' : '#ffffff'
                                                    }}>
                                                        {day.pendingCount}
                                                    </span>
                                                    {day.deliveredCount > 0 && (
                                                        <span className="d-flex align-items-center justify-content-center fw-bold rounded-circle" style={{ 
                                                            width: '14px', 
                                                            height: '14px', 
                                                            fontSize: '6.5px',
                                                            backgroundColor: day.isActive ? '#ffffff' : '#198754',
                                                            color: day.isActive ? '#198754' : '#ffffff'
                                                        }}>
                                                            {day.deliveredCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Logistics Zone */}
                            {filterSettings.zones && (
                                <div className="mb-3">
                                    <span className="d-block text-muted fw-bold mb-1" style={{ fontSize: '10px' }}>Zona Logística</span>
                                    <Form.Select size="sm" value={filterZona} onChange={(e) => setFilterZona(e.target.value)}>
                                        <option value="all">Todas las zonas</option>
                                        {allData.zonas.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
                                    </Form.Select>
                                </div>
                            )}

                            {/* Driver */}
                            {filterSettings.drivers && (
                                <div className="mb-3">
                                    <span className="d-block text-muted fw-bold mb-1" style={{ fontSize: '10px' }}>Conductor</span>
                                    <Form.Select size="sm" value={filterChofer} onChange={(e) => setFilterChofer(e.target.value)}>
                                        <option value="all">Todos los choferes</option>
                                        {allData.drivers.map(d => <option key={d.id} value={d.id}>{d.nombre} {d.apellido}</option>)}
                                    </Form.Select>
                                </div>
                            )}

                            {/* Payment Status */}
                            {filterSettings.payment && (
                                <div className="mb-3">
                                    <span className="d-block text-muted fw-bold mb-1" style={{ fontSize: '10px' }}>Estado de Pago</span>
                                    <Form.Select size="sm" value={filterPago} onChange={(e) => setFilterPago(e.target.value)}>
                                        <option value="all">Cualquier estado</option>
                                        <option value="Pendiente">Pendiente</option>
                                        <option value="Pagado">Pagado</option>
                                    </Form.Select>
                                </div>
                            )}

                            {/* Priority */}
                            {filterSettings.priority && (
                                <div className="mb-3">
                                    <span className="d-block text-muted fw-bold mb-1" style={{ fontSize: '10px' }}>Prioridad</span>
                                    <Form.Select size="sm" value={filterPrioridad} onChange={(e) => setFilterPrioridad(e.target.value)}>
                                        <option value="all">Todas</option>
                                        <option value="Alta">Alta</option>
                                        <option value="Media">Media</option>
                                        <option value="Baja">Baja</option>
                                    </Form.Select>
                                </div>
                            )}

                            {/* Category */}
                            {filterSettings.category && (
                                <div>
                                    <span className="d-block text-muted fw-bold mb-1" style={{ fontSize: '10px' }}>Categoría</span>
                                    <Form.Select size="sm" value={filterCategoria} onChange={(e) => setFilterCategoria(e.target.value)}>
                                        <option value="all">Todas</option>
                                        {allData.categories && allData.categories.map((c, i) => <option key={i} value={c.nombre}>{c.nombre}</option>)}
                                    </Form.Select>
                                </div>
                            )}
                        </div>
                    </Col>
                )}

                {/* Content Panel */}
                <Col lg={sidebarCollapsed ? 12 : 9}>
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                        </div>
                    ) : (
                        <>
                            {/* KANBAN VIEW */}
                            {viewMode === 'kanban' && (
                                <div className="d-flex overflow-auto pb-4 gap-3 align-items-start" style={{ minHeight: 'calc(100vh - 280px)' }}>
                                    {allData.columns.map(col => {
                                        const colOrders = currentFiltered.filter(o => String(o.etapa_id) === String(col.id));
                                        const colTotal = colOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

                                        return (
                                            <div
                                                key={col.id}
                                                className="bg-light rounded-3 border p-3 flex-shrink-0"
                                                style={{ width: '300px', minHeight: '300px' }}
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e, col.id)}
                                            >
                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                    <span className="fw-bold text-dark small text-uppercase" style={{ letterSpacing: '0.05em' }}>
                                                        {col.nombre}
                                                    </span>
                                                    <Dropdown align="end">
                                                        <Dropdown.Toggle variant="link" className="p-0 text-muted shadow-none border-0 m-0" style={{ height: 'auto', width: 'auto' }}>
                                                            <Settings size={14} />
                                                        </Dropdown.Toggle>
                                                        <Dropdown.Menu size="sm">
                                                            <Dropdown.Item onClick={() => configCol(col.id, col.nombre)}>Configurar</Dropdown.Item>
                                                            <Dropdown.Item className="text-danger" onClick={() => deleteCol(col.id)}>Eliminar</Dropdown.Item>
                                                        </Dropdown.Menu>
                                                    </Dropdown>
                                                </div>

                                                <div className="bg-white rounded-3 border p-2 mb-3 text-muted text-center fw-bold" style={{ fontSize: '11px' }}>
                                                    S/ {colTotal.toFixed(2)} ({colOrders.length})
                                                </div>

                                                <div style={{ minHeight: '150px' }}>
                                                    {colOrders.map(order => {
                                                        const isLocked = col.es_entregado == 1 || col.es_perdido == 1 || (order.venta_id && (order.venta_estado === 'completada' || order.venta_estado === 'cancelada'));
                                                        const dColor = getDriverColor(order.chofer_n);
                                                        const priorityColors = {
                                                            Alta: '#ef4444', 
                                                            Media: '#f59e0b', 
                                                            Baja: '#10b981'
                                                        };
                                                        const leftBorder = priorityColors[order.prioridad] || '#cbd5e1';
                                                        const isHovered = hoveredCardId === order.id;

                                                        return (
                                                            <Card
                                                                key={order.id}
                                                                className={`mb-3 border rounded-3 ${isLocked ? 'opacity-75' : ''}`}
                                                                style={{ 
                                                                    cursor: isLocked ? 'default' : 'grab',
                                                                    borderLeft: `4px solid ${leftBorder}`,
                                                                    transform: isHovered ? 'translateY(-3px)' : 'none',
                                                                    boxShadow: isHovered ? '0 10px 20px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.04)' : '0 2px 4px rgba(0,0,0,0.02)',
                                                                    borderColor: isHovered ? 'rgba(0,0,0,0.12)' : '#e2e8f0',
                                                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                }}
                                                                draggable={!isLocked}
                                                                onDragStart={(e) => handleDragStart(e, order.id)}
                                                                onMouseEnter={() => setHoveredCardId(order.id)}
                                                                onMouseLeave={() => setHoveredCardId(null)}
                                                            >
                                                                <Card.Body className="p-3">
                                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                                        {cardSettings.orderCode ? (
                                                                            <Badge bg="light" className="text-muted border fw-bold px-2 py-1 shadow-none" style={{ fontSize: '10px', borderRadius: '4px' }}>
                                                                                📄 {order.numero_pedido}
                                                                            </Badge>
                                                                        ) : <div />}
                                                                        <div className="d-flex gap-1 align-items-center">
                                                                            {order.es_reprogramado == 1 && (
                                                                                <span className="badge bg-warning-soft text-warning border border-warning-soft" style={{ fontSize: '9px', padding: '3px 6px', borderRadius: '4px' }}>
                                                                                    🔄 Reprog.
                                                                                </span>
                                                                            )}
                                                                            {cardSettings.priority && (
                                                                                <span className={`badge ${
                                                                                    order.prioridad === 'Alta' ? 'bg-danger-soft text-danger border border-danger-soft' : order.prioridad === 'Media' ? 'bg-warning-soft text-warning border border-warning-soft' : 'bg-success-soft text-success border border-success-soft'
                                                                                }`} style={{ fontSize: '9px', padding: '3px 6px', borderRadius: '4px' }}>{order.prioridad}</span>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {cardSettings.clientName && (
                                                                        <div className="fw-extrabold mb-2" style={{ fontSize: '14px', letterSpacing: '-0.01em' }}>
                                                                            <Link 
                                                                                href={`/apps/contact/view-contact?id=${order.contacto_id}`} 
                                                                                className="text-dark text-decoration-none transition-all"
                                                                                style={{ cursor: 'pointer' }}
                                                                                onMouseEnter={(e) => e.target.style.color = '#0d6efd'}
                                                                                onMouseLeave={(e) => e.target.style.color = '#212529'}
                                                                            >
                                                                                {((order.contacto_nombre || '') + ' ' + (order.contacto_apellido || '')).trim() || 'Cliente Anónimo'}
                                                                            </Link>
                                                                        </div>
                                                                    )}

                                                                    {cardSettings.address && (
                                                                        <div className="d-flex align-items-center gap-2 text-muted mb-1" style={{ fontSize: '11.5px' }} title={order.latitud ? "Tiene coordenadas GPS" : "Sin coordenadas GPS"}>
                                                                            <MapPin size={12} className={order.latitud ? "text-success" : "text-muted"} />
                                                                            <span className="text-truncate" style={{ maxWidth: '210px' }}>{order.direccion_entrega}</span>
                                                                        </div>
                                                                    )}

                                                                    {cardSettings.requestDate && (
                                                                        <div className="d-flex align-items-center gap-2 text-muted mb-1" style={{ fontSize: '11.5px' }}>
                                                                            <Clock size={12} className="text-secondary" />
                                                                            <span>Reg: <strong className="text-dark">{formatDate(order.created_at || order.fecha_registro || order.fecha_venta)}</strong></span>
                                                                        </div>
                                                                    )}

                                                                    {cardSettings.deliveryDate && (
                                                                        <div className="d-flex align-items-center gap-2 text-muted mb-2.5" style={{ fontSize: '11.5px' }}>
                                                                            <Calendar size={12} className="text-secondary" />
                                                                            <span>Entrega: <strong className="text-dark">{formatDate(order.fecha_entrega)}{order.hora_entrega ? ` ${formatTime(order.hora_entrega)}` : ''}</strong></span>
                                                                        </div>
                                                                    )}

                                                                    {cardSettings.products && order.productos_resumen && (
                                                                        <div className="p-2 mb-2 bg-light-soft border border-light rounded-3 text-secondary" style={{ fontSize: '11px', lineHeight: '1.4' }}>
                                                                            <span className="fw-semibold">🛒 {order.productos_resumen}</span>
                                                                        </div>
                                                                    )}

                                                                    {order.venta_estado === 'entregado' && (
                                                                        <div className="w-100 py-1.5 px-3 mb-2 rounded-3 text-center fw-bold text-info border border-info" style={{ fontSize: '11.5px', background: '#e0f2fe' }}>
                                                                            ✓ PEDIDO ENTREGADO
                                                                        </div>
                                                                    )}
                                                                    {order.venta_estado === 'completada' && (
                                                                        <div className="w-100 py-1.5 px-3 mb-2 rounded-3 text-center fw-bold text-success border border-success" style={{ fontSize: '11.5px', background: '#dcfce7' }}>
                                                                            ✓ ENTREGADO Y COBRADO
                                                                        </div>
                                                                    )}

                                                                    <div className="d-flex justify-content-between align-items-center mt-3 border-top pt-2">
                                                                        <div className="d-flex flex-column gap-1">
                                                                            <span className={`badge border text-center ${
                                                                                order.estado_pago === 'Pagado' ? 'bg-success-soft text-success border-success-soft' : 'bg-danger-soft text-danger border-danger-soft'
                                                                            }`} style={{ fontSize: '9px', padding: '3px 6px', display: 'inline-block', width: 'fit-content' }}>
                                                                                {order.estado_pago === 'Pagado' ? '💳 Pagado' : '💵 Pendiente'}
                                                                            </span>
                                                                            {cardSettings.driver && order.chofer_n && (
                                                                                <div className="text-white rounded px-2 py-0.5 fw-bold" style={{ background: dColor, fontSize: '9px', display: 'inline-block', width: 'fit-content' }}>
                                                                                    🚚 [{order.vehiculo_placa}] {order.chofer_n}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-end">
                                                                            {cardSettings.total ? (
                                                                                <strong className="text-primary d-block mb-1" style={{ fontSize: '14px', letterSpacing: '-0.02em' }}>S/ {parseFloat(order.total || 0).toFixed(2)}</strong>
                                                                            ) : <div className="mb-1" style={{ height: '18px' }} />}
                                                                            <div className="d-flex gap-2 justify-content-end">
                                                                                <Button variant="link" className="p-1 text-success hover-bg rounded-circle" onClick={() => shareOrderWhatsapp(order)} title="Compartir WhatsApp">
                                                                                    <Send size={13} />
                                                                                </Button>
                                                                                {!isLocked && (
                                                                                    <a href={`/pedidos/create?edit_id=${order.id}`} className="p-1 text-muted hover-bg rounded-circle" title="Editar Pedido">
                                                                                        <Edit size={13} />
                                                                                    </a>
                                                                                )}
                                                                                <Button variant="link" className="p-1 text-danger hover-bg rounded-circle" onClick={() => deleteOrder(order.id)} title="Eliminar Pedido">
                                                                                    <Trash size={13} />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </Card.Body>
                                                            </Card>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <div
                                        className="bg-transparent border-dashed border-2 rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                                        style={{ border: '2px dashed #cbd5e1', minHeight: '150px', width: '220px', cursor: 'pointer' }}
                                        onClick={addColumn}
                                    >
                                        <div className="text-center text-muted">
                                            <Plus size={24} />
                                            <div className="fw-bold small mt-1">Añadir Etapa</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                             {/* LIST VIEW */}
                             {viewMode === 'list' && (
                                 <Card className="border-0 shadow-sm rounded-3 overflow-hidden bg-white">
                                     <Table hover responsive className="align-middle mb-0 text-nowrap">
                                         <thead className="table-light text-muted font-size-12">
                                             <tr>
                                                 {listSettings.orderCode && <th className="ps-3">Nro Pedido</th>}
                                                 {listSettings.client && <th>Cliente</th>}
                                                 {listSettings.requestDate && <th>Registro</th>}
                                                 {listSettings.date && <th>Fecha Entrega</th>}
                                                 {listSettings.zone && <th>Zona</th>}
                                                 {listSettings.products && <th>Resumen Productos</th>}
                                                 {listSettings.stage && <th>Etapa</th>}
                                                 {listSettings.total && <th>Total</th>}
                                                 <th>Pago</th>
                                                 {listSettings.actions && <th className="text-end pe-3">Acciones</th>}
                                             </tr>
                                         </thead>
                                         <tbody className="font-size-13">
                                             {currentFiltered.map(order => {
                                                 const orderCol = allData.columns.find(col => String(col.id) === String(order.columna_id));
                                                 const colName = orderCol ? orderCol.nombre : 'Sin etapa';
                                                 const fullName = ((order.contacto_nombre || '') + ' ' + (order.contacto_apellido || '')).trim();
                                                 const initials = fullName ? fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '?';
                                                 const colors = ['info', 'warning', 'success', 'danger', 'primary', 'violet'];
                                                 const avtBg = colors[(order.contacto_id || order.id || 0) % colors.length];

                                                 return (
                                                     <tr key={order.id}>
                                                         {listSettings.orderCode && (
                                                             <td className="ps-3">
                                                                 <strong className="text-dark" style={{ fontSize: '13px' }}>{order.numero_pedido}</strong>
                                                             </td>
                                                         )}
                                                         {listSettings.client && (
                                                             <td>
                                                                 <div className="d-flex align-items-center">
                                                                     <div className="me-2">
                                                                         <div className={`avatar avatar-xs avatar-rounded bg-soft-${avtBg} text-${avtBg} d-flex align-items-center justify-content-center fw-bold`} style={{ width: '32px', height: '32px', fontSize: '11px', borderRadius: '50%' }}>
                                                                             {initials}
                                                                         </div>
                                                                     </div>
                                                                     <div>
                                                                         <div className="fw-semibold text-dark text-high-em" style={{ fontSize: '13px' }}>{fullName || 'Cliente Anónimo'}</div>
                                                                         {order.contacto_telefono && <span className="text-muted d-block" style={{ fontSize: '11px' }}>📱 {order.contacto_telefono}</span>}
                                                                     </div>
                                                                 </div>
                                                             </td>
                                                         )}
                                                         {listSettings.requestDate && (
                                                             <td>
                                                                 <span className="small text-muted">{formatDate(order.created_at || order.fecha_registro || order.fecha_venta)}</span>
                                                             </td>
                                                         )}
                                                         {listSettings.date && (
                                                             <td>
                                                                 <div className="d-flex align-items-center gap-1">
                                                                     <span className="text-dark fw-semibold" style={{ fontSize: '13px' }}>
                                                                         {formatDate(order.fecha_entrega)}
                                                                     </span>
                                                                     {order.hora_entrega && (
                                                                         <Badge bg="light" className="text-muted border" style={{ fontSize: '10px' }}>
                                                                             {formatTime(order.hora_entrega)}
                                                                         </Badge>
                                                                     )}
                                                                 </div>
                                                             </td>
                                                         )}
                                                         {listSettings.zone && (
                                                             <td>
                                                                 <Badge bg="light" className="text-dark border" style={{ fontSize: '11px' }}>{order.zona_nombre || 'N/A'}</Badge>
                                                             </td>
                                                         )}
                                                         {listSettings.products && (
                                                             <td style={{ maxWidth: '200px' }}>
                                                                 <span className="text-muted small text-wrap d-block text-truncate" style={{ fontSize: '12px', lineHeight: '1.4' }} title={order.productos_resumen}>
                                                                     {order.productos_resumen || 'Sin detalle'}
                                                                 </span>
                                                             </td>
                                                         )}
                                                         {listSettings.stage && (
                                                             <td>
                                                                 <Badge bg="" className="bg-soft-info text-info border border-info-soft rounded-pill" style={{ fontSize: '11px', fontWeight: '600', padding: '4px 8px' }}>
                                                                     {colName}
                                                                 </Badge>
                                                             </td>
                                                         )}
                                                         {listSettings.total && (
                                                             <td>
                                                                 <span className="fw-bold text-primary">S/ {parseFloat(order.total || 0).toFixed(2)}</span>
                                                             </td>
                                                         )}
                                                         <td>
                                                             <Badge 
                                                                 bg="" 
                                                                 className={order.estado_pago === 'Pagado' ? 'bg-soft-success text-success border border-success-soft rounded-pill' : 'bg-soft-danger text-danger border border-danger-soft rounded-pill'} 
                                                                 style={{ fontSize: '11px', fontWeight: '600', padding: '4px 8px' }}
                                                             >
                                                                 {order.estado_pago === 'Pagado' ? '● Pagado' : '○ Pendiente'}
                                                             </Badge>
                                                         </td>
                                                         {listSettings.actions && (
                                                             <td className="text-end pe-3">
                                                                 <div className="d-inline-flex gap-1">
                                                                     <Button 
                                                                         variant="flush-dark" 
                                                                         className="btn-icon btn-rounded flush-soft-hover" 
                                                                         title="Enviar WhatsApp"
                                                                         onClick={() => shareOrderWhatsapp(order)}
                                                                         style={{ width: '32px', height: '32px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
                                                                     >
                                                                         <Send size={14} className="text-success" />
                                                                     </Button>
                                                                     <Button 
                                                                         variant="flush-dark" 
                                                                         as="a"
                                                                         href={`/pedidos/create?edit_id=${order.id}`}
                                                                         className="btn-icon btn-rounded flush-soft-hover" 
                                                                         title="Editar"
                                                                         style={{ width: '32px', height: '32px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
                                                                     >
                                                                         <Edit size={14} className="text-primary" />
                                                                     </Button>
                                                                     <Button 
                                                                         variant="flush-dark" 
                                                                         className="btn-icon btn-rounded flush-soft-hover text-danger" 
                                                                         title="Eliminar"
                                                                         onClick={() => deleteOrder(order.id)}
                                                                         style={{ width: '32px', height: '32px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
                                                                     >
                                                                         <Trash size={14} />
                                                                     </Button>
                                                                 </div>
                                                             </td>
                                                         )}
                                                     </tr>
                                                 );
                                             })}
                                             {currentFiltered.length === 0 && (
                                                 <tr>
                                                     <td colSpan={10} className="text-center py-4 text-muted">No se encontraron pedidos.</td>
                                                 </tr>
                                             )}
                                         </tbody>
                                     </Table>
                                 </Card>
                             )}

                            {/* MAP & ROUTING VIEW */}
                            {viewMode === 'map' && (
                                <Card className="border-0 shadow-sm rounded-3 overflow-hidden" style={{ height: 'calc(100vh - 280px)' }}>
                                    <Row className="g-0 h-100">
                                        <Col md={8} className="h-100 position-relative">
                                            <div ref={mapContainerRef} style={{ width: '100%', height: '100%', minHeight: '350px' }}></div>
                                            <div className="position-absolute top-0 end-0 m-3 d-flex gap-2" style={{ zIndex: 1000 }}>
                                                <div className="btn-group bg-white shadow rounded p-1">
                                                    <Button variant={mapFilter === 'all' ? 'primary' : 'light'} size="sm" onClick={() => setMapFilter('all')}>Todos</Button>
                                                    <Button variant={mapFilter === 'pending' ? 'primary' : 'light'} size="sm" onClick={() => setMapFilter('pending')}>Pendientes</Button>
                                                    <Button variant={mapFilter === 'done' ? 'primary' : 'light'} size="sm" onClick={() => setMapFilter('done')}>Atendidos</Button>
                                                </div>
                                            </div>
                                        </Col>

                                        <Col md={4} className="h-100 bg-white border-start d-flex flex-column" style={{ minHeight: '350px' }}>
                                            <div className="p-3 border-bottom bg-light d-flex justify-content-between align-items-center">
                                                <h6 className="mb-0 fw-bold text-dark d-flex align-items-center">
                                                    <MapPin size={16} className="me-2 text-primary" />
                                                    Ruta Asignada
                                                </h6>
                                                <div className="d-flex gap-2">
                                                    <Button variant="link" className="p-0 text-danger small fw-bold text-decoration-none" onClick={() => saveRoute([])}>
                                                        LIMPIAR
                                                    </Button>
                                                    <Badge bg="primary" className="d-flex align-items-center">{routeListIds.length} paradas</Badge>
                                                </div>
                                            </div>

                                            {routeListIds.length >= 2 && (
                                                <div className="p-3 bg-light border-bottom text-center">
                                                    <div className="row">
                                                        <div className="col-6">
                                                            <small className="text-muted d-block" style={{ fontSize: '9px' }}>DISTANCIA</small>
                                                            <strong className="text-primary">{tripDist}</strong>
                                                        </div>
                                                        <div className="col-6 border-start">
                                                            <small className="text-muted d-block" style={{ fontSize: '9px' }}>TIEMPO EST.</small>
                                                            <strong className="text-primary">{tripTime}</strong>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex-grow-1 overflow-auto p-2">
                                                {routeListIds.map((id, index) => {
                                                    const order = allData.pedidos.find(p => String(p.id) === String(id));
                                                    if (!order) return null;
                                                    const clientName = ((order.contacto_nombre || '') + ' ' + (order.contacto_apellido || '')).trim();

                                                    return (
                                                        <Card key={id} className="mb-2 shadow-none border border-start-4 border-start-primary">
                                                            <Card.Body className="p-2 d-flex justify-content-between align-items-center">
                                                                <div className="d-flex align-items-center gap-2 overflow-hidden">
                                                                    <Badge bg="light" className="text-dark border">{index + 1}</Badge>
                                                                    <div className="text-truncate">
                                                                        <div className="fw-bold small text-truncate" style={{ maxWidth: '160px' }}>{clientName}</div>
                                                                        <div className="text-muted" style={{ fontSize: '10px' }}>{order.direccion_entrega}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="d-flex align-items-center gap-1">
                                                                    <Button variant="link" className="p-0 text-success" onClick={() => shareOrderWhatsapp(order)}>
                                                                        <Send size={14} />
                                                                    </Button>
                                                                    <Button variant="link" className="p-0 text-danger" onClick={() => removeFromRoute(order.id)}>
                                                                        <Trash size={14} />
                                                                    </Button>
                                                                </div>
                                                            </Card.Body>
                                                        </Card>
                                                    );
                                                })}
                                                {routeListIds.length === 0 && (
                                                    <div className="text-center text-muted py-5 small">
                                                        Selecciona pedidos en el mapa para agregarlos a la ruta.
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-3 border-top bg-light">
                                                <Row className="g-2 mb-2">
                                                    <Col xs={6}>
                                                        <Button variant="dark" size="sm" className="w-100 fw-bold" onClick={drawRouteLine}>
                                                            TRAZAR
                                                        </Button>
                                                    </Col>
                                                    <Col xs={6}>
                                                        <Button variant="primary" size="sm" className="w-100 fw-bold" onClick={optimizeRouteOrder}>
                                                            OPTIMIZAR
                                                        </Button>
                                                    </Col>
                                                </Row>
                                                <Button variant="success" className="w-100 fw-bold" onClick={sendRouteToDriver}>
                                                    ENVIAR AL CHOFER
                                                </Button>
                                            </div>
                                        </Col>
                                    </Row>
                                </Card>
                            )}
                        </>
                    )}
                </Col>
            </Row>
        </div>
    );
}
