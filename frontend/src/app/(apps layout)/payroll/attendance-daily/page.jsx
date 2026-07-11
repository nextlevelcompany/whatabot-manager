"use client"
import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Badge, Spinner, Table, Card } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import { Save, Calendar, Check, X, AlertTriangle } from 'react-feather';
import Swal from 'sweetalert2';

const getApiBase = () => {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
        return `${window.location.protocol}//${hostname}:8081`;
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8081';
};
const API_BASE = getApiBase();

export default function AttendanceDailyPage() {
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [locked, setLocked] = useState(false);

    const loadAttendance = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/payroll/attendance?fecha=${fecha}`);
            if (res.ok) {
                const data = await res.json();
                setRecords(data);
                // Check if any record is linked to a payment
                const isAnyPaid = data.some(r => r.pago_id !== null);
                setLocked(isAnyPaid);
            }
        } catch (e) {
            console.error("Error loading attendance", e);
            Swal.fire('Error', 'No se pudo obtener la asistencia del día.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAttendance();
    }, [fecha]);

    const handleStatusChange = (idx, status) => {
        if (locked) return;
        const copy = [...records];
        copy[idx].estado = status;
        
        // Auto pre-fill times if present
        if (status === 'Presente' || status === 'Tardanza') {
            if (!copy[idx].hora_entrada) copy[idx].hora_entrada = '08:00';
            if (!copy[idx].hora_salida) copy[idx].hora_salida = '17:00';
        } else {
            copy[idx].hora_entrada = '';
            copy[idx].hora_salida = '';
        }
        setRecords(copy);
    };

    const handleTimeChange = (idx, field, val) => {
        if (locked) return;
        const copy = [...records];
        copy[idx][field] = val;
        setRecords(copy);
    };

    const handleNotesChange = (idx, val) => {
        if (locked) return;
        const copy = [...records];
        copy[idx].notes = val; // support both notes or notes alias
        copy[idx].notas = val;
        setRecords(copy);
    };

    const handleSave = async () => {
        if (locked) {
            Swal.fire('Bloqueado', 'Esta asistencia ya fue liquidada en una planilla procesada.', 'warning');
            return;
        }
        setSaving(true);
        try {
            const body = {
                fecha,
                records: records.map(r => ({
                    trabajador_id: r.trabajador_id,
                    hora_entrada: r.hora_entrada || null,
                    hora_salida: r.hora_salida || null,
                    estado: r.estado || 'Presente',
                    notas: r.notas || ''
                }))
            };

            const res = await fetch(`${API_BASE}/api/payroll/attendance/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Guardado',
                    text: 'Asistencias guardadas con éxito.',
                    timer: 1500,
                    showConfirmButton: false
                });
                loadAttendance();
            } else {
                Swal.fire('Error', 'No se pudo guardar la asistencia.', 'error');
            }
        } catch (e) {
            Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="contact-body">
            <SimpleBar className="nicescroll-bar">
                <div className="px-4 py-4">
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                        <div>
                            <h4 className="fw-extrabold text-dark mb-0">Control de Asistencia Diaria</h4>
                            <p className="text-muted small mb-0">Registra las entradas, salidas, tardanzas o faltas justificadas de tu personal activo.</p>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <Form.Group className="d-flex align-items-center mb-0 gap-2">
                                <Calendar size={18} className="text-muted" />
                                <Form.Control
                                    type="date"
                                    size="sm"
                                    value={fecha}
                                    onChange={e => setFecha(e.target.value)}
                                    style={{ width: '160px' }}
                                />
                            </Form.Group>
                            <Button 
                                variant="primary" 
                                size="sm" 
                                className="fw-bold d-flex align-items-center gap-1 py-2 px-3"
                                onClick={handleSave}
                                disabled={saving || locked || loading}
                            >
                                <Save size={16} />
                                {saving ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                        </div>
                    </div>

                    {/* Alert banner if locked */}
                    {locked && (
                        <Card className="bg-warning-soft border-warning-soft mb-4">
                            <Card.Body className="py-2 px-3 d-flex align-items-center gap-2 text-warning-dark">
                                <AlertTriangle size={18} />
                                <span className="small fw-semibold">
                                    Esta fecha ya ha sido incluida en el pago de planilla de uno o más colaboradores. La edición está deshabilitada para proteger la integridad contable.
                                </span>
                            </Card.Body>
                        </Card>
                    )}

                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" />
                            <p className="mt-2 text-muted">Buscando marcaciones de asistencia...</p>
                        </div>
                    ) : records.length === 0 ? (
                        <div className="text-center py-5">
                            <p className="text-muted">No se encontraron colaboradores activos registrados para esta fecha.</p>
                            <Button variant="outline-primary" size="sm" href="/payroll/staff">Ir a Gestión de Personal</Button>
                        </div>
                    ) : (
                        <Card className="border-0 shadow-sm rounded-3">
                            <Table responsive hover className="align-middle mb-0 custom-attendance-table bg-white">
                                <thead className="table-light">
                                    <tr>
                                        <th>Colaborador</th>
                                        <th>Rol</th>
                                        <th style={{ width: '280px' }}>Estado Asistencia</th>
                                        <th>Hora Entrada</th>
                                        <th>Hora Salida</th>
                                        <th>Notas / Observaciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((r, idx) => (
                                        <tr key={idx}>
                                            <td className="fw-bold text-dark">{r.nombre} {r.apellido}</td>
                                            <td>
                                                <Badge bg="light" className="text-dark border">{r.rol_operativo}</Badge>
                                            </td>
                                            <td>
                                                <div className="btn-group btn-group-sm w-100" role="group">
                                                    <Button 
                                                        variant={r.estado === 'Presente' ? 'success' : 'outline-light'}
                                                        className={r.estado === 'Presente' ? 'text-white' : 'text-dark border-light-soft'}
                                                        onClick={() => handleStatusChange(idx, 'Presente')}
                                                        disabled={locked}
                                                    >
                                                        Presente
                                                    </Button>
                                                    <Button 
                                                        variant={r.estado === 'Tardanza' ? 'warning' : 'outline-light'}
                                                        className={r.estado === 'Tardanza' ? 'text-dark' : 'text-dark border-light-soft'}
                                                        onClick={() => handleStatusChange(idx, 'Tardanza')}
                                                        disabled={locked}
                                                    >
                                                        Tardanza
                                                    </Button>
                                                    <Button 
                                                        variant={r.estado === 'Falta' ? 'danger' : 'outline-light'}
                                                        className={r.estado === 'Falta' ? 'text-white' : 'text-dark border-light-soft'}
                                                        onClick={() => handleStatusChange(idx, 'Falta')}
                                                        disabled={locked}
                                                    >
                                                        Falta
                                                    </Button>
                                                    <Button 
                                                        variant={r.estado === 'Permiso' ? 'info' : 'outline-light'}
                                                        className={r.estado === 'Permiso' ? 'text-white' : 'text-dark border-light-soft'}
                                                        onClick={() => handleStatusChange(idx, 'Permiso')}
                                                        disabled={locked}
                                                    >
                                                        Permiso
                                                    </Button>
                                                    <Button 
                                                        variant={r.estado === 'Vacaciones' ? 'secondary' : 'outline-light'}
                                                        className={r.estado === 'Vacaciones' ? 'text-white' : 'text-dark border-light-soft'}
                                                        onClick={() => handleStatusChange(idx, 'Vacaciones')}
                                                        disabled={locked}
                                                    >
                                                        Vac.
                                                    </Button>
                                                </div>
                                            </td>
                                            <td>
                                                <Form.Control
                                                    type="time"
                                                    size="sm"
                                                    value={r.hora_entrada || ''}
                                                    onChange={e => handleTimeChange(idx, 'hora_entrada', e.target.value)}
                                                    disabled={locked || (r.estado !== 'Presente' && r.estado !== 'Tardanza')}
                                                    style={{ width: '100px' }}
                                                />
                                            </td>
                                            <td>
                                                <Form.Control
                                                    type="time"
                                                    size="sm"
                                                    value={r.hora_salida || ''}
                                                    onChange={e => handleTimeChange(idx, 'hora_salida', e.target.value)}
                                                    disabled={locked || (r.estado !== 'Presente' && r.estado !== 'Tardanza')}
                                                    style={{ width: '100px' }}
                                                />
                                            </td>
                                            <td>
                                                <Form.Control
                                                    type="text"
                                                    size="sm"
                                                    placeholder="Anotaciones..."
                                                    value={r.notas || ''}
                                                    onChange={e => handleNotesChange(idx, e.target.value)}
                                                    disabled={locked}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card>
                    )}
                </div>
            </SimpleBar>
        </div>
    );
}
