'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Col, Form, Row, Alert, Spinner, Card, Badge } from 'react-bootstrap';
import Link from 'next/link';
import { Search, MapPin, Link as LinkIcon } from 'react-feather';
import InteractiveMap from '../InteractiveMap';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Bloque de una sola dirección
const DireccionBlock = ({ index, direccion, onChange, onRemove, ubigeos }) => {
    const [geocoding, setGeocoding] = useState(false);

    const departamentos = [...new Set(ubigeos.map(u => u.departamento))].sort();
    const provincias = direccion.departamento
        ? [...new Set(ubigeos.filter(u => u.departamento === direccion.departamento).map(u => u.provincia))].sort()
        : [];
    const distritos = direccion.provincia
        ? ubigeos.filter(u => u.departamento === direccion.departamento && u.provincia === direccion.provincia).sort((a, b) => a.distrito.localeCompare(b.distrito))
        : [];

    const handleChange = (field, value) => {
        let updated;
        if (typeof field === 'object') {
            updated = { ...direccion, ...field };
        } else {
            updated = { ...direccion, [field]: value };
            if (field === 'departamento') { updated.provincia = ''; updated.codigoUbigeo = ''; updated.distrito = ''; }
            if (field === 'provincia') { updated.codigoUbigeo = ''; updated.distrito = ''; }
            if (field === 'distrito') {
                const ubigeo = ubigeos.find(u => u.departamento === updated.departamento && u.provincia === updated.provincia && u.distrito === value);
                updated.codigoUbigeo = ubigeo ? ubigeo.codigoUbigeo : '';
            }
        }
        onChange(index, updated);
    };

    const handleGeocode = async () => {
        if (!direccion.direccionCompleta?.trim()) {
            alert("Por favor ingresa una dirección escrita para buscar.");
            return;
        }
        setGeocoding(true);
        try {
            const queryParts = [direccion.direccionCompleta];
            if (direccion.distrito) queryParts.push(direccion.distrito);
            if (direccion.provincia) queryParts.push(direccion.provincia);
            if (direccion.departamento) queryParts.push(direccion.departamento);
            queryParts.push("Peru");
            
            const q = encodeURIComponent(queryParts.join(", "));
            const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, {
                headers: { 'User-Agent': 'NextLead-CRM-Peru' }
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) {
                    handleChange({ latitud: parseFloat(data[0].lat), longitud: parseFloat(data[0].lon) });
                } else {
                    alert("No se encontraron coordenadas para la dirección especificada.");
                }
            } else {
                alert("Error al conectar con el servicio de geocodificación.");
            }
        } catch (err) {
            console.error(err);
            alert("Error al buscar la dirección.");
        } finally {
            setGeocoding(false);
        }
    };

    const handleLocateCurrent = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    handleChange({ latitud: pos.coords.latitude, longitud: pos.coords.longitude });
                },
                (err) => {
                    alert("No se pudo obtener la ubicación GPS actual: " + err.message);
                }
            );
        } else {
            alert("Tu navegador no soporta geolocalización.");
        }
    };

    const handlePasteLink = async () => {
        const url = prompt("Pega el enlace de Google Maps:");
        if (!url) return;
        try {
            const res = await fetch(`${API_BASE}/api/contacts/resolve-maps-url?url=${encodeURIComponent(url)}`);
            if (res.ok) {
                const data = await res.json();
                handleChange({ latitud: data.lat, longitud: data.lng });
            } else {
                const txt = await res.text();
                alert("Error: " + (txt || "No se pudo extraer coordenadas del link de Google Maps. Asegúrate de que sea un link válido."));
            }
        } catch (err) {
            console.error(err);
            alert("Error de conexión al resolver el link.");
        }
    };

    const [showMap, setShowMap] = useState(false);

    const labelStyle = {
        fontSize: '11px',
        fontWeight: '600',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
        marginBottom: '2px',
        display: 'block'
    };

    const inputStyle = {
        fontSize: '0.8rem',
        padding: '4px 8px',
        borderRadius: '6px'
    };

    return (
        <div className="direccion-block border rounded p-2 mb-2 position-relative" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
            <div className="d-flex justify-content-between align-items-center mb-1 pb-1 border-bottom">
                <span className="fw-semibold text-primary" style={{ fontSize: '0.8rem' }}>📍 Dirección {index + 1}</span>
                <div className="d-flex gap-2 align-items-center">
                    <span 
                        onClick={() => setShowMap(!showMap)} 
                        style={{ fontSize: '0.75rem', cursor: 'pointer', color: '#0d6efd', fontWeight: '600' }}
                    >
                        {showMap ? '🗺️ Ocultar Mapa' : '🗺️ Ver Mapa'}
                    </span>
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>|</span>
                    <span 
                        onClick={() => onRemove(index)} 
                        style={{ fontSize: '0.75rem', cursor: 'pointer', color: '#dc3545', fontWeight: '600' }}
                    >
                        ✕ Quitar
                    </span>
                </div>
            </div>
            <Row className="gx-2 gy-1">
                <Col xs={12}>
                    <Form.Label style={labelStyle}>Nombre Ubicación *</Form.Label>
                    <Form.Control size="sm" type="text" placeholder="Ej: Casa, Sede" style={inputStyle}
                        value={direccion.nombreUbicacion || ''}
                        onChange={e => handleChange('nombreUbicacion', e.target.value)} />
                </Col>
                <Col xs={12}>
                    <Form.Label style={labelStyle}>Dirección completa *</Form.Label>
                    <div className="input-group input-group-sm">
                        <Form.Control size="sm" type="text" placeholder="Av. Las Palmeras 123..." style={inputStyle}
                            value={direccion.direccionCompleta || ''}
                            onChange={e => handleChange('direccionCompleta', e.target.value)} />
                        <Button variant="outline-secondary" title="Buscar por dirección escrita" onClick={handleGeocode} disabled={geocoding}>
                            {geocoding ? <Spinner size="xs" animation="border" /> : <Search size={13} />}
                        </Button>
                        <Button variant="outline-success" title="Obtener ubicación actual (GPS)" onClick={handleLocateCurrent}>
                            <MapPin size={13} />
                        </Button>
                        <Button variant="outline-primary" title="Insertar link de Google Maps" onClick={handlePasteLink}>
                            <LinkIcon size={13} />
                        </Button>
                    </div>
                </Col>
                <Col xs={12}>
                    <Form.Label style={labelStyle}>Referencia</Form.Label>
                    <Form.Control size="sm" type="text" placeholder="Frente al parque..." style={inputStyle}
                        value={direccion.referencia || ''}
                        onChange={e => handleChange('referencia', e.target.value)} />
                </Col>
                
                <Col xs={4}>
                    <Form.Label style={labelStyle}>Dpto.</Form.Label>
                    <Form.Select size="sm" value={direccion.departamento || ''} style={inputStyle}
                        onChange={e => handleChange('departamento', e.target.value)}>
                        <option value="">-- Dpto --</option>
                        {departamentos.map(d => <option key={d} value={d}>{d}</option>)}
                    </Form.Select>
                </Col>
                <Col xs={4}>
                    <Form.Label style={labelStyle}>Prov.</Form.Label>
                    <Form.Select size="sm" value={direccion.provincia || ''} style={inputStyle}
                        disabled={!direccion.departamento}
                        onChange={e => handleChange('provincia', e.target.value)}>
                        <option value="">-- Prov --</option>
                        {provincias.map(p => <option key={p} value={p}>{p}</option>)}
                    </Form.Select>
                </Col>
                <Col xs={4}>
                    <Form.Label style={labelStyle}>Dist. {direccion.codigoUbigeo ? `(${direccion.codigoUbigeo})` : ''}</Form.Label>
                    <Form.Select size="sm" value={direccion.distrito || ''} style={inputStyle}
                        disabled={!direccion.provincia}
                        onChange={e => handleChange('distrito', e.target.value)}>
                        <option value="">-- Dist --</option>
                        {distritos.map(d => <option key={d.codigoUbigeo} value={d.distrito}>{d.distrito}</option>)}
                    </Form.Select>
                </Col>
                <Col xs={6}>
                    <Form.Label style={labelStyle}>Latitud</Form.Label>
                    <Form.Control size="sm" type="number" step="any" placeholder="-12.0464" style={inputStyle}
                        value={direccion.latitud || ''}
                        onChange={e => handleChange('latitud', e.target.value ? parseFloat(e.target.value) : null)} />
                </Col>
                <Col xs={6}>
                    <Form.Label style={labelStyle}>Longitud</Form.Label>
                    <Form.Control size="sm" type="number" step="any" placeholder="-77.0428" style={inputStyle}
                        value={direccion.longitud || ''}
                        onChange={e => handleChange('longitud', e.target.value ? parseFloat(e.target.value) : null)} />
                </Col>
 
                {/* Mapa Interactivo (Colapsable) */}
                {showMap && (
                    <Col xs={12} className="mt-1" style={{ height: '220px' }}>
                        <InteractiveMap 
                            lat={direccion.latitud} 
                            lng={direccion.longitud} 
                            onChange={(lat, lng) => {
                                handleChange({ latitud: lat, longitud: lng });
                            }} 
                        />
                    </Col>
                )}
            </Row>
        </div>
    );
};

const emptyDireccion = () => ({
    nombreUbicacion: '', departamento: '', provincia: '', distrito: '',
    codigoUbigeo: '', direccionCompleta: '', referencia: '', latitud: null, longitud: null
});

const EditContactForm = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id'); // ID del contacto si se está editando

    const [tipoPersona, setTipoPersona] = useState('NATURAL'); // 'NATURAL' | 'EMPRESA'
    const [tipoDocumento, setTipoDocumento] = useState('DNI');
    const [numeroDocumento, setNumeroDocumento] = useState('');
    const [nombres, setNombres] = useState('');
    const [apellidos, setApellidos] = useState('');
    const [razonSocial, setRazonSocial] = useState('');
    const [telefonoPrincipal, setTelefonoPrincipal] = useState('');
    const [telefonoSecundario, setTelefonoSecundario] = useState('');
    const [email, setEmail] = useState('');
    const [empresaId, setEmpresaId] = useState('');
    const [direcciones, setDirecciones] = useState([emptyDireccion()]);
    const [activeDirIndex, setActiveDirIndex] = useState(0);

    const [ubigeos, setUbigeos] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [loadingData, setLoadingData] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Validación de documento en tiempo real
    const docValido = useCallback(() => {
        if (!numeroDocumento) return null;
        if (tipoDocumento === 'DNI') return /^[0-9]{8}$/.test(numeroDocumento);
        if (tipoDocumento === 'RUC') return /^(10|20)[0-9]{9}$/.test(numeroDocumento);
        if (tipoDocumento === 'CE') return /^[a-zA-Z0-9]{8,12}$/.test(numeroDocumento);
        return null;
    }, [numeroDocumento, tipoDocumento]);

    const docHint = () => {
        if (tipoDocumento === 'DNI') return '8 dígitos numéricos';
        if (tipoDocumento === 'RUC') return '11 dígitos, empieza con 10 o 20';
        if (tipoDocumento === 'CE') return '8 a 12 caracteres alfanuméricos';
        return '';
    };

    // Cargar catálogos
    useEffect(() => {
        const fetchCatalogs = async () => {
            try {
                const [rUbigeos, rEmpresas] = await Promise.all([
                    fetch(`${API_BASE}/api/contacts/ubigeos`),
                    fetch(`${API_BASE}/api/contacts/empresas`)
                ]);
                const dUbigeos = await rUbigeos.json();
                const dEmpresas = await rEmpresas.json();
                setUbigeos(dUbigeos);
                setEmpresas(dEmpresas);
            } catch (err) {
                console.error("Error al cargar catálogos:", err);
            }
        };
        fetchCatalogs();
    }, []);

    // Cargar datos del contacto si estamos editando (id != null)
    useEffect(() => {
        if (!id) {
            setTipoPersona('NATURAL');
            return;
        }

        const fetchContactData = async () => {
            setLoadingData(true);
            try {
                const [rContact, rAddresses] = await Promise.all([
                    fetch(`${API_BASE}/api/contacts/${id}`),
                    fetch(`${API_BASE}/api/contacts/${id}/addresses`)
                ]);

                if (rContact.ok && rAddresses.ok) {
                    const cData = await rContact.json();
                    const aData = await rAddresses.json();

                    setTipoPersona(cData.tipoPersona || 'NATURAL');
                    setTipoDocumento(cData.tipoDocumento || 'DNI');
                    setNumeroDocumento(cData.numeroDocumento || '');
                    setNombres(cData.nombres || '');
                    setApellidos(cData.apellidos || '');
                    setRazonSocial(cData.razonSocial || '');
                    setTelefonoPrincipal(cData.telefonoPrincipal || '');
                    setTelefonoSecundario(cData.telefonoSecundario || '');
                    setEmail(cData.email || '');
                    setEmpresaId(cData.empresaId || '');
                    
                    if (aData.length > 0) {
                        setDirecciones(aData);
                    } else {
                        setDirecciones([emptyDireccion()]);
                    }
                } else {
                    setError("No se pudo cargar la información del contacto.");
                }
            } catch (err) {
                setError("Error de conexión al cargar el contacto.");
            } finally {
                setLoadingData(false);
            }
        };

        fetchContactData();
    }, [id]);

    useEffect(() => {
        if (id) return;
        if (tipoPersona === 'EMPRESA') setTipoDocumento('RUC');
        else setTipoDocumento('DNI');
        setNumeroDocumento('');
    }, [tipoPersona, id]);

    const updateDireccion = (index, updated) => {
        const arr = [...direcciones];
        arr[index] = updated;
        setDirecciones(arr);
    };

    const removeDireccion = (index) => {
        const newDirs = direcciones.filter((_, i) => i !== index);
        setDirecciones(newDirs);
        if (activeDirIndex >= newDirs.length) {
            setActiveDirIndex(Math.max(0, newDirs.length - 1));
        }
    };

    const addDireccionBlock = () => {
        const newDirs = [...direcciones, emptyDireccion()];
        setDirecciones(newDirs);
        setActiveDirIndex(newDirs.length - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSaving(true);

        const body = {
            tipoPersona,
            tipoDocumento,
            numeroDocumento,
            nombres: tipoPersona === 'NATURAL' ? nombres : null,
            apellidos: tipoPersona === 'NATURAL' ? apellidos : null,
            razonSocial: tipoPersona === 'EMPRESA' ? razonSocial : null,
            telefonoPrincipal,
            telefonoSecundario: telefonoSecundario || null,
            email: email || null,
            empresaId: tipoPersona === 'NATURAL' && empresaId ? parseInt(empresaId) : null,
            direcciones: direcciones.filter(d => d.nombreUbicacion && d.direccionCompleta).map(d => ({
                nombreUbicacion: d.nombreUbicacion,
                codigoUbigeo: d.codigoUbigeo || null,
                direccionCompleta: d.direccionCompleta,
                referencia: d.referencia || null,
                latitud: d.latitud || null,
                longitud: d.longitud || null,
            })),
        };

        try {
            const url = id ? `${API_BASE}/api/contacts/${id}` : `${API_BASE}/api/contacts`;
            const method = id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                router.push('/apps/contact/contact-list');
            } else {
                const data = await res.json();
                setError(Array.isArray(data) ? data.join(' • ') : String(data));
            }
        } catch (e) {
            setError('Error de conexión con el servidor.');
        } finally {
            setSaving(false);
        }
    };

    if (loadingData) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" />
                <p className="mt-2 text-muted">Cargando datos del contacto...</p>
            </div>
        );
    }

    return (
        <Card className="card-flush mt-4 border shadow-sm">
            <Card.Header className="pt-4 pb-0 bg-transparent border-bottom-0">
                <h4 className="card-title fw-bold text-dark">{id ? '✏️ Editar Contacto' : '👤 Nuevo Contacto'}</h4>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>Completa los datos de identidad y gestiona sus ubicaciones de entrega.</p>
            </Card.Header>
            <Card.Body className="pt-0">
                <Form onSubmit={handleSubmit}>
                    {error && <Alert variant="danger" className="py-2 mb-3" style={{ fontSize: '0.85rem' }}>{error}</Alert>}
                    <Row className="gx-4">
                        {/* Columna Izquierda: Identidad y Contacto */}
                        <Col lg={6} className="border-end pe-lg-4 mb-4">
                            <div className="title title-xs title-wth-divider text-primary text-uppercase mb-3 fw-bold d-flex justify-content-between align-items-center" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                                <span>Tipo de Contacto *</span>
                                <Button variant="soft-primary" size="sm" style={{ fontSize: '0.75rem', padding: '3px 8px', visibility: 'hidden' }}>
                                    &nbsp;
                                </Button>
                            </div>

                            <div className="d-flex gap-1 flex-wrap mb-2 pb-2 border-bottom">
                                <Button
                                    variant={tipoPersona === 'NATURAL' ? 'primary' : 'outline-secondary'}
                                    size="sm"
                                    onClick={() => !id && setTipoPersona('NATURAL')}
                                    style={{ 
                                        fontSize: '0.72rem', 
                                        padding: '2px 8px', 
                                        borderRadius: '15px',
                                        cursor: id ? 'not-allowed' : 'pointer',
                                        fontWeight: tipoPersona === 'NATURAL' ? 'bold' : 'normal'
                                    }}
                                    disabled={id && tipoPersona !== 'NATURAL'}
                                >
                                    👤 Persona Natural
                                </Button>
                                <Button
                                    variant={tipoPersona === 'EMPRESA' ? 'primary' : 'outline-secondary'}
                                    size="sm"
                                    onClick={() => !id && setTipoPersona('EMPRESA')}
                                    style={{ 
                                        fontSize: '0.72rem', 
                                        padding: '2px 8px', 
                                        borderRadius: '15px',
                                        cursor: id ? 'not-allowed' : 'pointer',
                                        fontWeight: tipoPersona === 'EMPRESA' ? 'bold' : 'normal'
                                    }}
                                    disabled={id && tipoPersona !== 'EMPRESA'}
                                >
                                    🏢 Empresa
                                </Button>
                            </div>

                                <div className="title title-xs title-wth-divider text-primary text-uppercase mb-3 fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                                    <span>1. Identidad</span>
                                </div>

                                <Row className="gx-2">
                                    <Col sm={4} className="mb-3">
                                        <Form.Group>
                                            <Form.Label className="fw-semibold form-label-sm">Tipo Doc. *</Form.Label>
                                            {tipoPersona === 'EMPRESA' ? (
                                                <Form.Control size="sm" value="RUC" disabled />
                                            ) : (
                                                <Form.Select size="sm" value={tipoDocumento} onChange={e => { setTipoDocumento(e.target.value); setNumeroDocumento(''); }}>
                                                    <option value="DNI">DNI</option>
                                                    <option value="CE">CE</option>
                                                </Form.Select>
                                            )}
                                        </Form.Group>
                                    </Col>
                                    <Col sm={8} className="mb-3">
                                        <Form.Group>
                                            <Form.Label className="fw-semibold form-label-sm">N° Documento *</Form.Label>
                                            <Form.Control
                                                size="sm"
                                                type="text"
                                                value={numeroDocumento}
                                                onChange={e => setNumeroDocumento(e.target.value.replace(/\s/g, ''))}
                                                isValid={docValido() === true}
                                                isInvalid={docValido() === false}
                                                placeholder={tipoDocumento === 'DNI' ? '12345678' : tipoDocumento === 'RUC' ? '20512382819' : 'CE12345678'}
                                            />
                                            <Form.Text className="text-muted" style={{ fontSize: '0.7rem' }}>{docHint()}</Form.Text>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                {tipoPersona === 'NATURAL' && (
                                    <Row className="gx-2">
                                        <Col sm={6} className="mb-3">
                                            <Form.Group>
                                                <Form.Label className="fw-semibold form-label-sm">Nombres *</Form.Label>
                                                <Form.Control size="sm" type="text" value={nombres} onChange={e => setNombres(e.target.value)} placeholder="Carlos Andrés" />
                                            </Form.Group>
                                        </Col>
                                        <Col sm={6} className="mb-3">
                                            <Form.Group>
                                                <Form.Label className="fw-semibold form-label-sm">Apellidos *</Form.Label>
                                                <Form.Control size="sm" type="text" value={apellidos} onChange={e => setApellidos(e.target.value)} placeholder="Quispe Mamani" />
                                            </Form.Group>
                                        </Col>
                                        <Col sm={12} className="mb-3">
                                            <Form.Group>
                                                <Form.Label className="fw-semibold form-label-sm">Empresa Vinculada <span className="text-muted">(opcional)</span></Form.Label>
                                                <Form.Select size="sm" value={empresaId} onChange={e => setEmpresaId(e.target.value)}>
                                                    <option value="">-- Sin empresa --</option>
                                                    {empresas.map(e => (
                                                        <option key={e.id} value={e.id}>
                                                            {e.razonSocial} — RUC: {e.numeroDocumento}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                )}

                                {tipoPersona === 'EMPRESA' && (
                                    <Row className="gx-2">
                                        <Col sm={12} className="mb-3">
                                            <Form.Group>
                                                <Form.Label className="fw-semibold form-label-sm">Razón Social *</Form.Label>
                                                <Form.Control size="sm" type="text" value={razonSocial} onChange={e => setRazonSocial(e.target.value)} placeholder="NextLead Technologies S.A.C." />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                )}

                                <div className="title title-xs title-wth-divider text-primary text-uppercase my-3 fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                                    <span>2. Datos de Contacto</span>
                                </div>
                                <Row className="gx-2">
                                    <Col sm={6} className="mb-3">
                                        <Form.Group>
                                            <Form.Label className="fw-semibold form-label-sm">Teléfono Principal *</Form.Label>
                                            <div className="input-group input-group-sm">
                                                <span className="input-group-text">+51</span>
                                                <Form.Control type="text" maxLength={9} value={telefonoPrincipal}
                                                    onChange={e => setTelefonoPrincipal(e.target.value.replace(/\D/g, ''))}
                                                    placeholder="999888777" />
                                            </div>
                                            <Form.Text className="text-muted" style={{ fontSize: '0.7rem' }}>9 dígitos</Form.Text>
                                        </Form.Group>
                                    </Col>
                                    <Col sm={6} className="mb-3">
                                        <Form.Group>
                                            <Form.Label className="fw-semibold form-label-sm">Teléfono Secundario</Form.Label>
                                            <div className="input-group input-group-sm">
                                                <span className="input-group-text">+51</span>
                                                <Form.Control type="text" maxLength={9} value={telefonoSecundario}
                                                    onChange={e => setTelefonoSecundario(e.target.value.replace(/\D/g, ''))}
                                                    placeholder="999777666" />
                                            </div>
                                        </Form.Group>
                                    </Col>
                                    <Col sm={12} className="mb-3">
                                        <Form.Group>
                                            <Form.Label className="fw-semibold form-label-sm">Email</Form.Label>
                                            <Form.Control size="sm" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="cliente@correo.com" />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Col>

                            {/* Columna Derecha: Direcciones */}
                            <Col lg={6} className="ps-lg-4 mb-4 d-flex flex-column" style={{ maxHeight: '72vh' }}>
                                <div className="title title-xs title-wth-divider text-primary text-uppercase mb-3 fw-bold d-flex justify-content-between align-items-center" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                                    <span>3. Direcciones de Entrega</span>
                                    <Button variant="soft-primary" size="sm" onClick={addDireccionBlock} style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                                        + Agregar Dirección
                                    </Button>
                                </div>

                                {/* Selectores de direcciones arriba, estilo pestañas */}
                                {direcciones.length > 0 && (
                                    <div className="d-flex gap-1 flex-wrap mb-2 pb-2 border-bottom">
                                        {direcciones.map((dir, idx) => (
                                            <Button
                                                key={idx}
                                                variant={activeDirIndex === idx ? 'primary' : 'outline-secondary'}
                                                size="sm"
                                                onClick={() => setActiveDirIndex(idx)}
                                                style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '15px' }}
                                            >
                                                📍 {dir.nombreUbicacion || `Dirección ${idx + 1}`}
                                            </Button>
                                        ))}
                                    </div>
                                )}

                                <div style={{ overflowY: 'auto', flexGrow: 1, paddingRight: '5px', minHeight: '300px', maxHeight: '48vh' }} className="pe-2">
                                    {direcciones.length === 0 ? (
                                        <Alert variant="info" className="py-2 mb-0" style={{ fontSize: '0.8rem' }}>
                                            Ninguna dirección agregada. Haz clic en &quot;+ Agregar Dirección&quot;.
                                        </Alert>
                                    ) : (
                                        <DireccionBlock
                                            index={activeDirIndex}
                                            direccion={direcciones[activeDirIndex]}
                                            ubigeos={ubigeos}
                                            onChange={updateDireccion}
                                            onRemove={removeDireccion}
                                        />
                                    )}
                                </div>

                                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top bg-white">
                                    <Link href="/apps/contact/contact-list" className="btn btn-secondary">
                                        Cancelar
                                    </Link>
                                    <Button variant="primary" type="submit" disabled={saving}>
                                        {saving ? 'Guardando...' : id ? 'Guardar Cambios' : 'Crear Contacto'}
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default EditContactForm;
