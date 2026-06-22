'use client';
import { useState, useEffect, useCallback } from 'react';
import { Button, Col, Form, Modal, Row, Alert, Spinner, Card } from 'react-bootstrap';
import { Search, MapPin, Link as LinkIcon } from 'react-feather';
import InteractiveMap from './InteractiveMap';

const getApiBase = () => {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
        return `${window.location.protocol}//${hostname}:8080`;
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';
};
const API_BASE = getApiBase();

// Bloque de una sola dirección
const DireccionBlock = ({ index, direccion, onChange, onRemove, ubigeos }) => {
    const [geocoding, setGeocoding] = useState(false);
    const [showMap, setShowMap] = useState(false);

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
                        style={{ fontSize: '0.75rem', cursor: 'pointer', color: '#0d6efd', fontWeight: '550' }}
                    >
                        {showMap ? '🗺️ Ocultar Mapa' : '🗺️ Ver Mapa'}
                    </span>
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>|</span>
                    <span 
                        onClick={() => onRemove(index)} 
                        style={{ fontSize: '0.75rem', cursor: 'pointer', color: '#dc3545', fontWeight: '550' }}
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
                    <Col xs={12} className="mt-1" style={{ height: '100px' }}>
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

const CreateNewContact = ({ show, close, onCreated }) => {
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
    const [loading, setLoading] = useState(false);
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
        if (tipoDocumento === 'DNI') return '8 dígitos';
        if (tipoDocumento === 'RUC') return '11 dígitos, empieza con 10 o 20';
        if (tipoDocumento === 'CE') return '8 a 12 caracteres alfanuméricos';
        return '';
    };

    useEffect(() => {
        if (!show) return;
        // Cargar ubigeos y empresas al abrir el modal
        fetch(`${API_BASE}/api/contacts/ubigeos`)
            .then(r => r.json()).then(setUbigeos).catch(() => {});
        fetch(`${API_BASE}/api/contacts/empresas`)
            .then(r => r.json()).then(setEmpresas).catch(() => {});
    }, [show]);

    useEffect(() => {
        // Al cambiar tipo de persona, resetear campos de documento
        if (tipoPersona === 'EMPRESA') setTipoDocumento('RUC');
        else setTipoDocumento('DNI');
        setNumeroDocumento('');
    }, [tipoPersona]);

    const resetForm = () => {
        setTipoPersona('NATURAL'); setTipoDocumento('DNI'); setNumeroDocumento('');
        setNombres(''); setApellidos(''); setRazonSocial('');
        setTelefonoPrincipal(''); setTelefonoSecundario(''); setEmail('');
        setEmpresaId(''); setDirecciones([emptyDireccion()]); setActiveDirIndex(0);
        setError(null);
    };

    const handleClose = () => { resetForm(); close(); };

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

    const addDireccion = () => {
        const newDirs = [...direcciones, emptyDireccion()];
        setDirecciones(newDirs);
        setActiveDirIndex(newDirs.length - 1);
    };

    const handleSubmit = async () => {
        setError(null);
        setLoading(true);
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
            const res = await fetch(`${API_BASE}/api/contacts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                resetForm();
                onCreated && onCreated();
                close();
            } else {
                let errMsg = 'Ocurrió un error en el servidor.';
                try {
                    const contentType = res.headers.get("content-type");
                    if (contentType && contentType.indexOf("application/json") !== -1) {
                        const data = await res.json();
                        errMsg = Array.isArray(data) ? data.join(' • ') : String(data);
                    } else {
                        errMsg = await res.text() || 'Error sin respuesta';
                    }
                } catch (parseErr) {
                    console.error("Error parsing response:", parseErr);
                }
                setError(errMsg);
            }
        } catch (e) {
            console.error("Submit fetch error:", e);
            setError('Error de conexión con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    const labelStyle = {
        fontSize: '0.78rem',
        fontWeight: '600',
        color: '#475569',
        marginBottom: '6px',
        display: 'block'
    };

    const inputStyle = {
        fontSize: '0.85rem',
        padding: '6px 10px',
        borderRadius: '8px',
        borderColor: '#cbd5e1',
        boxShadow: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s'
    };

    return (
        <Modal show={show} onHide={handleClose} centered size="lg" className="add-new-contact">
            <Modal.Header closeButton style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                <Modal.Title className="fw-bold text-dark" style={{ fontSize: '1.1rem' }}>👤 Nuevo Contacto</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4" style={{ maxHeight: '75vh', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
                {error && <Alert variant="danger" className="py-2 mb-3 shadow-sm" style={{ fontSize: '0.85rem', borderRadius: '8px' }}>{error}</Alert>}

                <Row className="gx-4">
                    {/* Columna Izquierda: Información de Identificación y Contacto */}
                    <Col lg={6}>
                        {/* Tarjeta 1: Identificación y Tipo */}
                        <Card className="border shadow-sm mb-4" style={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <Card.Body className="p-3">
                                <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                                    <span className="fw-bold text-primary text-uppercase" style={{ fontSize: '0.78rem', letterSpacing: '0.05em' }}>
                                        1. Identificación y Tipo
                                    </span>
                                </div>

                                <Form.Group className="mb-3">
                                    <Form.Label style={labelStyle}>Tipo de Contacto *</Form.Label>
                                    <div className="btn-group btn-group-sm w-100" style={{ borderRadius: '8px', overflow: 'hidden' }}>
                                        <Button
                                            variant={tipoPersona === 'NATURAL' ? 'primary' : 'outline-secondary'}
                                            onClick={() => setTipoPersona('NATURAL')}
                                            style={{ 
                                                fontSize: '0.78rem', 
                                                padding: '6px 12px',
                                                fontWeight: tipoPersona === 'NATURAL' ? '600' : 'normal',
                                            }}
                                        >
                                            👤 Persona Natural
                                        </Button>
                                        <Button
                                            variant={tipoPersona === 'EMPRESA' ? 'primary' : 'outline-secondary'}
                                            onClick={() => setTipoPersona('EMPRESA')}
                                            style={{ 
                                                fontSize: '0.78rem', 
                                                padding: '6px 12px',
                                                fontWeight: tipoPersona === 'EMPRESA' ? '600' : 'normal',
                                            }}
                                        >
                                            🏢 Empresa
                                        </Button>
                                    </div>
                                </Form.Group>

                                <Row className="gx-2">
                                    <Col sm={4} className="mb-3">
                                        <Form.Group>
                                            <Form.Label style={labelStyle}>Tipo Doc. *</Form.Label>
                                            {tipoPersona === 'EMPRESA' ? (
                                                <Form.Control size="sm" value="RUC" style={inputStyle} disabled />
                                            ) : (
                                                <Form.Select size="sm" value={tipoDocumento} style={inputStyle} onChange={e => { setTipoDocumento(e.target.value); setNumeroDocumento(''); }}>
                                                    <option value="DNI">DNI</option>
                                                    <option value="CE">CE</option>
                                                </Form.Select>
                                            )}
                                        </Form.Group>
                                    </Col>
                                    <Col sm={8} className="mb-3">
                                        <Form.Group>
                                            <Form.Label style={labelStyle}>N° Documento *</Form.Label>
                                            <Form.Control
                                                size="sm"
                                                type="text"
                                                value={numeroDocumento}
                                                style={inputStyle}
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
                                                <Form.Label style={labelStyle}>Nombres *</Form.Label>
                                                <Form.Control size="sm" type="text" style={inputStyle} value={nombres} onChange={e => setNombres(e.target.value)} placeholder="Carlos Andrés" />
                                            </Form.Group>
                                        </Col>
                                        <Col sm={6} className="mb-3">
                                            <Form.Group>
                                                <Form.Label style={labelStyle}>Apellidos *</Form.Label>
                                                <Form.Control size="sm" type="text" style={inputStyle} value={apellidos} onChange={e => setApellidos(e.target.value)} placeholder="Quispe Mamani" />
                                            </Form.Group>
                                        </Col>
                                        <Col sm={12} className="mb-3">
                                            <Form.Group>
                                                <Form.Label style={labelStyle}>Empresa Vinculada <span className="text-muted">(opcional)</span></Form.Label>
                                                <Form.Select size="sm" style={inputStyle} value={empresaId} onChange={e => setEmpresaId(e.target.value)}>
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
                                                <Form.Label style={labelStyle}>Razón Social *</Form.Label>
                                                <Form.Control size="sm" type="text" style={inputStyle} value={razonSocial} onChange={e => setRazonSocial(e.target.value)} placeholder="NextLead Technologies S.A.C." />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                )}
                            </Card.Body>
                        </Card>

                        {/* Tarjeta 2: Datos de Contacto */}
                        <Card className="border shadow-sm mb-4" style={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <Card.Body className="p-3">
                                <div className="mb-3 pb-2 border-bottom">
                                    <span className="fw-bold text-primary text-uppercase" style={{ fontSize: '0.78rem', letterSpacing: '0.05em' }}>
                                        2. Datos de Contacto
                                    </span>
                                </div>
                                <Row className="gx-2">
                                    <Col sm={6} className="mb-3">
                                        <Form.Group>
                                            <Form.Label style={labelStyle}>Teléfono Principal *</Form.Label>
                                            <div className="input-group input-group-sm">
                                                <span className="input-group-text" style={{ borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px', backgroundColor: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1', fontSize: '0.8rem' }}>+51</span>
                                                <Form.Control type="text" maxLength={9} value={telefonoPrincipal}
                                                    style={{ ...inputStyle, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                                                    onChange={e => setTelefonoPrincipal(e.target.value.replace(/\D/g, ''))}
                                                    placeholder="999888777" />
                                            </div>
                                            <Form.Text className="text-muted" style={{ fontSize: '0.7rem' }}>9 dígitos</Form.Text>
                                        </Form.Group>
                                    </Col>
                                    <Col sm={6} className="mb-3">
                                        <Form.Group>
                                            <Form.Label style={labelStyle}>Teléfono Secundario</Form.Label>
                                            <div className="input-group input-group-sm">
                                                <span className="input-group-text" style={{ borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px', backgroundColor: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1', fontSize: '0.8rem' }}>+51</span>
                                                <Form.Control type="text" maxLength={9} value={telefonoSecundario}
                                                    style={{ ...inputStyle, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                                                    onChange={e => setTelefonoSecundario(e.target.value.replace(/\D/g, ''))}
                                                    placeholder="999777666" />
                                            </div>
                                        </Form.Group>
                                    </Col>
                                    <Col sm={12} className="mb-3">
                                        <Form.Group>
                                            <Form.Label style={labelStyle}>Email</Form.Label>
                                            <Form.Control size="sm" type="email" style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@ejemplo.com" />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Columna Derecha: Direcciones */}
                    <Col lg={6}>
                        <Card className="border shadow-sm mb-4" style={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <Card.Body className="p-3">
                                <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                                    <span className="fw-bold text-primary text-uppercase" style={{ fontSize: '0.78rem', letterSpacing: '0.05em' }}>
                                        3. Direcciones de Entrega
                                    </span>
                                    <Button variant="soft-primary" size="sm" onClick={addDireccion} style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '6px' }}>
                                        + Agregar Dirección
                                    </Button>
                                </div>

                                {/* Selectores de direcciones estilo pestañas */}
                                {direcciones.length > 0 && (
                                    <div className="d-flex gap-1 flex-wrap mb-3 pb-2 border-bottom">
                                        {direcciones.map((dir, idx) => (
                                            <Button
                                                key={idx}
                                                variant={activeDirIndex === idx ? 'primary' : 'outline-secondary'}
                                                size="sm"
                                                onClick={() => setActiveDirIndex(idx)}
                                                style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: '15px' }}
                                            >
                                                📍 {dir.nombreUbicacion || `Dirección ${idx + 1}`}
                                            </Button>
                                        ))}
                                    </div>
                                )}

                                <div className="pe-1">
                                    {direcciones.length === 0 ? (
                                        <Alert variant="info" className="py-2 mb-0" style={{ fontSize: '0.8rem', borderRadius: '8px' }}>
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
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Modal.Body>
            <Modal.Footer className="align-items-center" style={{ borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                <Button variant="secondary" size="sm" onClick={handleClose} disabled={loading} style={{ borderRadius: '8px', padding: '6px 16px' }}>Cancelar</Button>
                {tipoPersona && (
                    <Button variant="primary" size="sm" onClick={handleSubmit} disabled={loading} style={{ borderRadius: '8px', padding: '6px 16px' }}>
                        {loading ? <><Spinner animation="border" size="sm" className="me-2" />Guardando...</> : 'Crear Contacto'}
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default CreateNewContact;
