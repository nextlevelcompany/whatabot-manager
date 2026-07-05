"use client"
import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Card, Table, Spinner } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import { Calendar } from 'react-feather';

const getApiBase = () => {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
        return `${window.location.protocol}//${hostname}:8080`;
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';
};
const API_BASE = getApiBase();

export default function AttendanceMonthlyPage() {
    const today = new Date();
    const [mes, setMes] = useState(today.getMonth() + 1);
    const [anio, setAnio] = useState(today.getFullYear());
    const [staff, setStaff] = useState([]);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadMonthlyAttendance = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/payroll/attendance/monthly?mes=${mes}&anio=${anio}`);
            if (res.ok) {
                const data = await res.json();
                setStaff(data.staff || []);
                setRecords(data.records || []);
            }
        } catch (e) {
            console.error("Error loading monthly attendance", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMonthlyAttendance();
    }, [mes, anio]);

    // Helper to get number of days in chosen month
    const getDaysInMonth = (month, year) => {
        return new Date(year, month, 0).getDate();
    };

    const daysCount = getDaysInMonth(mes, anio);
    const daysArray = Array.from({ length: daysCount }, (_, i) => i + 1);

    // Map records to a quick access lookup Map [workerId-day] -> status
    const recordMap = {};
    records.forEach(r => {
        const day = new Date(r.fecha).getUTCDate();
        recordMap[`${r.trabajador_id}-${day}`] = r.estado;
    });

    const getStatusIndicator = (status) => {
        switch (status) {
            case 'Presente': return <span className="badge bg-success-soft text-success fw-bold" style={{ width: '22px', height: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>P</span>;
            case 'Tardanza': return <span className="badge bg-warning-soft text-warning-dark fw-bold" style={{ width: '22px', height: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>T</span>;
            case 'Falta': return <span className="badge bg-danger-soft text-danger fw-bold" style={{ width: '22px', height: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>F</span>;
            case 'Permiso': return <span className="badge bg-info-soft text-info fw-bold" style={{ width: '22px', height: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>E</span>;
            case 'Vacaciones': return <span className="badge bg-secondary-soft text-secondary fw-bold" style={{ width: '22px', height: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>V</span>;
            default: return <span className="text-muted small">—</span>;
        }
    };

    const getSummary = (workerId) => {
        let present = 0, late = 0, absent = 0, permit = 0, vacs = 0;
        for (let d = 1; d <= daysCount; d++) {
            const status = recordMap[`${workerId}-${d}`];
            if (status === 'Presente') present++;
            else if (status === 'Tardanza') late++;
            else if (status === 'Falta') absent++;
            else if (status === 'Permiso') permit++;
            else if (status === 'Vacaciones') vacs++;
        }
        return { present, late, absent, permit, vacs };
    };

    return (
        <div className="contact-body">
            <SimpleBar className="nicescroll-bar">
                <div className="px-4 py-4">
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                        <div>
                            <h4 className="fw-extrabold text-dark mb-0">Consolidado de Asistencia Mensual</h4>
                            <p className="text-muted small mb-0 font-size-13">Visualiza el calendario completo de asistencias, tardanzas y faltas justificadas del mes.</p>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <Form.Group className="d-flex align-items-center mb-0 gap-2">
                                <Calendar size={18} className="text-muted" />
                                <Form.Select
                                    size="sm"
                                    value={mes}
                                    onChange={e => setMes(parseInt(e.target.value))}
                                    style={{ width: '130px' }}
                                >
                                    <option value={1}>Enero</option>
                                    <option value={2}>Febrero</option>
                                    <option value={3}>Marzo</option>
                                    <option value={4}>Abril</option>
                                    <option value={5}>Mayo</option>
                                    <option value={6}>Junio</option>
                                    <option value={7}>Julio</option>
                                    <option value={8}>Agosto</option>
                                    <option value={9}>Septiembre</option>
                                    <option value={10}>Octubre</option>
                                    <option value={11}>Noviembre</option>
                                    <option value={12}>Diciembre</option>
                                </Form.Select>
                                <Form.Select
                                    size="sm"
                                    value={anio}
                                    onChange={e => setAnio(parseInt(e.target.value))}
                                    style={{ width: '100px' }}
                                >
                                    <option value={2026}>2026</option>
                                    <option value={2025}>2025</option>
                                    <option value={2024}>2024</option>
                                </Form.Select>
                            </Form.Group>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" />
                            <p className="mt-2 text-muted">Generando matriz de asistencia...</p>
                        </div>
                    ) : staff.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            No se encontraron colaboradores activos para este mes.
                        </div>
                    ) : (
                        <Card className="border-0 shadow-sm rounded-3">
                            <SimpleBar className="w-100">
                                <Table bordered hover className="align-middle mb-0 text-center custom-attendance-grid bg-white" style={{ minWidth: '1200px' }}>
                                    <thead className="table-light font-size-12">
                                        <tr>
                                            <th className="text-start ps-3" style={{ minWidth: '220px', position: 'sticky', left: 0, backgroundColor: '#f8fafc', zIndex: 5 }}>Colaborador</th>
                                            {daysArray.map(d => (
                                                <th key={d} style={{ width: '35px' }}>{d}</th>
                                            ))}
                                            <th className="bg-success-soft text-success" style={{ width: '45px' }}>P</th>
                                            <th className="bg-warning-soft text-warning-dark" style={{ width: '45px' }}>T</th>
                                            <th className="bg-danger-soft text-danger" style={{ width: '45px' }}>F</th>
                                            <th className="bg-info-soft text-info" style={{ width: '45px' }}>E</th>
                                            <th className="bg-secondary-soft text-secondary" style={{ width: '45px' }}>V</th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-size-13">
                                        {staff.map(s => {
                                            const sum = getSummary(s.id);
                                            return (
                                                <tr key={s.id}>
                                                    <td className="text-start ps-3 fw-bold text-dark" style={{ position: 'sticky', left: 0, backgroundColor: '#ffffff', zIndex: 4, borderRight: '2px solid #e2e8f0' }}>
                                                        {s.nombre} {s.apellido}
                                                    </td>
                                                    {daysArray.map(d => (
                                                        <td key={d} className="p-1">
                                                            {getStatusIndicator(recordMap[`${s.id}-${d}`])}
                                                        </td>
                                                    ))}
                                                    <td className="fw-bold text-success bg-success-soft">{sum.present}</td>
                                                    <td className="fw-bold text-warning-dark bg-warning-soft">{sum.late}</td>
                                                    <td className="fw-bold text-danger bg-danger-soft">{sum.absent}</td>
                                                    <td className="fw-bold text-info bg-info-soft">{sum.permit}</td>
                                                    <td className="fw-bold text-secondary bg-secondary-soft">{sum.vacs}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            </SimpleBar>
                        </Card>
                    )}

                    {/* Legend */}
                    <div className="mt-4 d-flex gap-4 flex-wrap px-2 small text-muted">
                        <div className="d-flex align-items-center gap-1">
                            <span className="badge bg-success fw-bold text-white">P</span> Presente
                        </div>
                        <div className="d-flex align-items-center gap-1">
                            <span className="badge bg-warning fw-bold text-dark">T</span> Tardanza
                        </div>
                        <div className="d-flex align-items-center gap-1">
                            <span className="badge bg-danger fw-bold text-white">F</span> Falta / Inasistencia
                        </div>
                        <div className="d-flex align-items-center gap-1">
                            <span className="badge bg-info fw-bold text-white">E</span> Permiso / Excusado
                        </div>
                        <div className="d-flex align-items-center gap-1">
                            <span className="badge bg-secondary fw-bold text-white">V</span> Vacaciones
                        </div>
                    </div>
                </div>
            </SimpleBar>
        </div>
    );
}
