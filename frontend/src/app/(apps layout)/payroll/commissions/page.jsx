"use client"
import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Badge, Modal, Spinner, Table, Card, Tabs, Tab } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import { Play, RotateCcw, Plus, Trash, DollarSign, Calendar, Eye, ShieldAlert } from 'react-feather';
import Swal from 'sweetalert2';

const getApiBase = () => {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
        return `${window.location.protocol}//${hostname}:8081`;
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8081';
};
const API_BASE = getApiBase();

export default function CommissionsPage() {
    // Tab control
    const [activeTab, setActiveTab] = useState('payroll');

    // Payroll Calculator States
    const [desde, setDesde] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [hasta, setHasta] = useState(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]);
    const [frecuencia, setFrecuencia] = useState('Mensual');
    const [payrollData, setPayrollData] = useState([]);
    const [calculating, setCalculating] = useState(false);
    const [processingId, setProcessingId] = useState(null);

    // Advances States
    const [advances, setAdvances] = useState([]);
    const [loadingAdvances, setLoadingAdvances] = useState(false);
    const [showAdvanceModal, setShowAdvanceModal] = useState(false);
    const [savingAdvance, setSavingAdvance] = useState(false);
    const [workers, setWorkers] = useState([]);

    const defaultAdvanceForm = {
        id: null,
        trabajador_id: '',
        monto: '',
        fecha: new Date().toISOString().split('T')[0],
        notas: ''
    };
    const [advanceForm, setAdvanceForm] = useState(defaultAdvanceForm);

    // Load active staff for dropdown
    const loadWorkers = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/payroll/staff?estado=Activo`);
            if (res.ok) setWorkers(await res.json());
        } catch (e) {
            console.error("Error loading workers", e);
        }
    };

    // Load salary advances
    const loadAdvances = async () => {
        setLoadingAdvances(true);
        try {
            const res = await fetch(`${API_BASE}/api/payroll/advances`);
            if (res.ok) setAdvances(await res.json());
        } catch (e) {
            console.error("Error loading advances", e);
        } finally {
            setLoadingAdvances(false);
        }
    };

    useEffect(() => {
        loadWorkers();
        loadAdvances();
    }, []);

    // Calculate payroll trigger
    const handleCalculate = async (e) => {
        if (e) e.preventDefault();
        setCalculating(true);
        try {
            const res = await fetch(`${API_BASE}/api/payroll/calculate?desde=${desde}&hasta=${hasta}&frecuencia=${frecuencia}`);
            if (res.ok) {
                setPayrollData(await res.json());
            } else {
                Swal.fire('Error', 'No se pudieron calcular las planillas.', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
        } finally {
            setCalculating(false);
        }
    };

    // Process single payroll payment
    const handleProcessPayment = async (workerRow) => {
        setProcessingId(workerRow.trabajador_id);
        try {
            const body = {
                trabajador_id: workerRow.trabajador_id,
                periodo_inicio: desde,
                periodo_fin: hasta,
                frecuencia: frecuencia,
                monto_base: workerRow.monto_base,
                retencion_pension: workerRow.retencion_pension,
                retencion_quinta: workerRow.retencion_quinta,
                descuento_tardanza: workerRow.descuento_tardanza,
                descuento_faltas: workerRow.descuento_faltas,
                adelantos: workerRow.adelantos,
                total_pagar: workerRow.total_pagar
            };

            const res = await fetch(`${API_BASE}/api/payroll/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Procesado',
                    text: 'Planilla procesada y egreso contable generado.',
                    timer: 1500,
                    showConfirmButton: false
                });
                handleCalculate(); // refresh calculation
                loadAdvances(); // refresh remaining advances
            } else {
                const data = await res.json();
                Swal.fire('Error', data.message || 'No se pudo procesar el pago.', 'error');
            }
        } catch (e) {
            Swal.fire('Error', 'Error al conectarse con el servidor.', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    // Void/cancel single payroll payment
    const handleCancelPayment = (pagoId) => {
        Swal.fire({
            title: '¿Anular Planilla?',
            text: 'Esto liberará los días de asistencia para volver a ser calculados y anulará el gasto contable generado.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, Anular'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`${API_BASE}/api/payroll/cancel-payment`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pago_id: pagoId })
                    });
                    if (res.ok) {
                        Swal.fire('Anulado', 'La planilla ha sido anulada.', 'success');
                        handleCalculate();
                        loadAdvances();
                    } else {
                        const data = await res.json();
                        Swal.fire('Error', data.message || 'No se pudo anular.', 'error');
                    }
                } catch (e) {
                    Swal.fire('Error', 'Error al conectar con el servidor.', 'error');
                }
            }
        });
    };

    // Create Advance Modal Actions
    const handleNewAdvance = () => {
        setAdvanceForm(defaultAdvanceForm);
        setShowAdvanceModal(true);
    };

    const handleSaveAdvance = async (e) => {
        e.preventDefault();
        setSavingAdvance(true);
        try {
            const body = {
                ...advanceForm,
                trabajador_id: parseInt(advanceForm.trabajador_id),
                monto: parseFloat(advanceForm.monto)
            };

            const res = await fetch(`${API_BASE}/api/payroll/advances/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Adelanto Creado',
                    text: 'Se registró el adelanto y se descontó de caja chica.',
                    timer: 1500,
                    showConfirmButton: false
                });
                setShowAdvanceModal(false);
                loadAdvances();
            } else {
                Swal.fire('Error', 'No se pudo registrar el adelanto.', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
        } finally {
            setSavingAdvance(false);
        }
    };

    const handleDeleteAdvance = (id) => {
        Swal.fire({
            title: '¿Anular Adelanto?',
            text: 'Esto reembolsará el egreso de caja chica y removerá el descuento del colaborador.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, Anular'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`${API_BASE}/api/payroll/advances/${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        Swal.fire('Anulado', 'El adelanto ha sido retirado.', 'success');
                        loadAdvances();
                    } else {
                        Swal.fire('Error', 'No se pudo eliminar.', 'error');
                    }
                } catch (e) {
                    Swal.fire('Error', 'Error al conectarse con el servidor.', 'error');
                }
            }
        });
    };

    return (
        <div className="contact-body">
            <SimpleBar className="nicescroll-bar">
                <div className="px-4 py-4">
                    {/* Page Title */}
                    <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                        <div>
                            <h4 className="fw-extrabold text-dark mb-0">Planillas, Comisiones y Nóminas</h4>
                            <p className="text-muted small mb-0 font-size-13">Procesa los pagos periódicos, calcula retenciones de ley y gestiona adelantos de sueldo.</p>
                        </div>
                    </div>

                    <Tabs activeKey={activeTab} onSelect={k => setActiveTab(k)} className="mb-4 nav-light-soft">
                        {/* Tab 1: Payroll calculator */}
                        <Tab eventKey="payroll" title={<><DollarSign size={15} className="me-1" /> Calculadora de Nómina</>}>
                            {/* Filter Bar */}
                            <Card className="bg-light-soft border-0 mb-4 rounded-3 p-3">
                                <Form onSubmit={handleCalculate}>
                                    <Row className="g-3 align-items-end">
                                        <Col md={3}>
                                            <Form.Group>
                                                <Form.Label className="small fw-bold text-muted mb-1">Fecha Desde</Form.Label>
                                                <Form.Control 
                                                    type="date" 
                                                    size="sm" 
                                                    className="shadow-none bg-white border-light-soft" 
                                                    value={desde} 
                                                    onChange={e => setDesde(e.target.value)} 
                                                    required 
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Group>
                                                <Form.Label className="small fw-bold text-muted mb-1">Fecha Hasta</Form.Label>
                                                <Form.Control 
                                                    type="date" 
                                                    size="sm" 
                                                    className="shadow-none bg-white border-light-soft" 
                                                    value={hasta} 
                                                    onChange={e => setHasta(e.target.value)} 
                                                    required 
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Group>
                                                <Form.Label className="small fw-bold text-muted mb-1">Frecuencia Pago</Form.Label>
                                                <Form.Select 
                                                    size="sm" 
                                                    className="shadow-none bg-white border-light-soft" 
                                                    value={frecuencia} 
                                                    onChange={e => setFrecuencia(e.target.value)}
                                                >
                                                    <option value="Mensual">Mensual</option>
                                                    <option value="Quincenal">Quincenal</option>
                                                    <option value="Semanal">Semanal</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                            <Button type="submit" variant="primary" size="sm" className="w-100 fw-bold py-2" disabled={calculating}>
                                                {calculating ? (
                                                    <Spinner size="sm" className="me-2" />
                                                ) : (
                                                    <Play size={14} className="me-2" />
                                                )}
                                                Calcular Planilla
                                            </Button>
                                        </Col>
                                    </Row>
                                </Form>
                            </Card>

                            {/* Calculation Matrix */}
                            {payrollData.length > 0 ? (
                                <Card className="border-0 shadow-sm rounded-3">
                                    <Table responsive hover className="align-middle mb-0 custom-payroll-table bg-white text-center">
                                        <thead className="table-light font-size-12">
                                            <tr>
                                                <th className="text-start ps-3" style={{ minWidth: '180px' }}>Colaborador</th>
                                                <th>Rol</th>
                                                <th>Ingresos (Base+Asig)</th>
                                                <th>Dscto Tardanzas</th>
                                                <th>Dscto Faltas</th>
                                                <th>Adelantos</th>
                                                <th>Retención (AFP/ONP)</th>
                                                <th>Neto a Pagar</th>
                                                <th>Estado</th>
                                                <th style={{ width: '130px' }}>Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="font-size-13">
                                            {payrollData.map((row, idx) => (
                                                <tr key={idx}>
                                                    <td className="text-start ps-3 fw-bold text-dark">{row.nombre_completo}</td>
                                                    <td><Badge bg="light" className="text-dark border">{row.rol}</Badge></td>
                                                    <td>S/ {(row.monto_base + row.asig_familiar).toFixed(2)}</td>
                                                    <td className={row.descuento_tardanza > 0 ? "text-danger" : ""}>
                                                        {row.descuento_tardanza > 0 ? `- S/ ${row.descuento_tardanza.toFixed(2)}` : 'S/ 0.00'}
                                                    </td>
                                                    <td className={row.descuento_faltas > 0 ? "text-danger" : ""}>
                                                        {row.descuento_faltas > 0 ? `- S/ ${row.descuento_faltas.toFixed(2)}` : 'S/ 0.00'}
                                                    </td>
                                                    <td className={row.adelantos > 0 ? "text-warning-dark" : ""}>
                                                        {row.adelantos > 0 ? `- S/ ${row.adelantos.toFixed(2)}` : 'S/ 0.00'}
                                                    </td>
                                                    <td className={row.retencion_pension > 0 ? "text-danger" : ""}>
                                                        {row.retencion_pension > 0 ? `- S/ ${row.retencion_pension.toFixed(2)}` : 'S/ 0.00'}
                                                        {row.metadata && <span className="d-block text-muted" style={{ fontSize: '10px' }}>{row.metadata.detalles_pension}</span>}
                                                    </td>
                                                    <td className="fw-extrabold text-primary font-size-14">S/ {row.total_pagar.toFixed(2)}</td>
                                                    <td>
                                                        {row.pago_id ? (
                                                            <Badge bg="success-soft text-success" className="border">Líquido</Badge>
                                                        ) : (
                                                            <Badge bg="warning-soft text-warning-dark" className="border">Borrador</Badge>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {row.pago_id ? (
                                                            <Button 
                                                                variant="outline-danger" 
                                                                size="sm" 
                                                                className="d-flex align-items-center gap-1 font-size-11"
                                                                onClick={() => handleCancelPayment(row.pago_id)}
                                                            >
                                                                <RotateCcw size={12} />
                                                                Anular
                                                            </Button>
                                                        ) : (
                                                            <Button 
                                                                variant="success" 
                                                                size="sm" 
                                                                className="d-flex align-items-center gap-1 font-size-11 text-white"
                                                                onClick={() => handleProcessPayment(row)}
                                                                disabled={processingId === row.trabajador_id}
                                                            >
                                                                {processingId === row.trabajador_id ? (
                                                                    <Spinner size="sm" />
                                                                ) : (
                                                                    <Play size={12} />
                                                                )}
                                                                Pagar
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Card>
                            ) : (
                                <div className="text-center py-5 text-muted border border-dashed rounded-3">
                                    Introduce el rango de fechas y frecuencia de pago para simular las nóminas de tus colaboradores activos.
                                </div>
                            )}
                        </Tab>

                        {/* Tab 2: Salary advances list */}
                        <Tab eventKey="advances" title={<><DollarSign size={15} className="me-1" /> Adelantos de Sueldo</>}>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="fw-bold text-dark mb-0">Adelantos Pendientes de Liquidar</h6>
                                <Button variant="primary" size="sm" className="fw-bold d-flex align-items-center gap-1" onClick={handleNewAdvance}>
                                    <Plus size={14} />
                                    Nuevo Adelanto
                                </Button>
                            </div>

                            {loadingAdvances ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" />
                                </div>
                            ) : advances.length > 0 ? (
                                <Card className="border-0 shadow-sm rounded-3">
                                    <Table responsive hover className="align-middle mb-0 bg-white">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="ps-3">Colaborador</th>
                                                <th>Monto</th>
                                                <th>Fecha Desembolso</th>
                                                <th>Notas</th>
                                                <th>Estado</th>
                                                <th className="text-end pe-3">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {advances.map(a => (
                                                <tr key={a.id}>
                                                    <td className="ps-3 fw-bold text-dark">{a.colab_name}</td>
                                                    <td className="fw-bold text-danger">S/ {parseFloat(a.monto).toFixed(2)}</td>
                                                    <td>{a.fecha}</td>
                                                    <td className="text-muted small">{a.notas || 'Sin notas'}</td>
                                                    <td>
                                                        <Badge bg="warning-soft text-warning-dark" className="border">Pendiente</Badge>
                                                    </td>
                                                    <td className="text-end pe-3">
                                                        <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover" title="Anular Adelanto" onClick={() => handleDeleteAdvance(a.id)}>
                                                            <Trash size={15} className="text-danger" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Card>
                            ) : (
                                <div className="text-center py-5 text-muted border border-dashed rounded-3">
                                    No hay adelantos de sueldo pendientes en este momento.
                                </div>
                            )}
                        </Tab>
                    </Tabs>
                </div>
            </SimpleBar>

            {/* Advance creator modal */}
            <Modal show={showAdvanceModal} onHide={() => setShowAdvanceModal(false)} size="md" backdrop="static">
                <Form onSubmit={handleSaveAdvance}>
                    <Modal.Header closeButton>
                        <Modal.Title className="fw-bold">Adelantar Sueldo</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        <Row className="g-3">
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Colaborador</Form.Label>
                                    <Form.Select 
                                        className="shadow-none border-light-soft bg-light-soft" 
                                        value={advanceForm.trabajador_id} 
                                        onChange={e => setAdvanceForm({ ...advanceForm, trabajador_id: e.target.value })} 
                                        required
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {workers.map(w => (
                                            <option key={w.id} value={w.id}>{w.nombre} {w.apellido}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Monto (S/)</Form.Label>
                                    <Form.Control 
                                        type="number" 
                                        step="0.01" 
                                        className="shadow-none border-light-soft bg-light-soft" 
                                        value={advanceForm.monto} 
                                        onChange={e => setAdvanceForm({ ...advanceForm, monto: e.target.value })} 
                                        required 
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Fecha Desembolso</Form.Label>
                                    <Form.Control 
                                        type="date" 
                                        className="shadow-none border-light-soft bg-light-soft" 
                                        value={advanceForm.fecha} 
                                        onChange={e => setAdvanceForm({ ...advanceForm, fecha: e.target.value })} 
                                        required 
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Notas / Motivo</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        placeholder="Ej: Adelanto quincena regular"
                                        className="shadow-none border-light-soft bg-light-soft" 
                                        value={advanceForm.notas} 
                                        onChange={e => setAdvanceForm({ ...advanceForm, notas: e.target.value })} 
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" onClick={() => setShowAdvanceModal(false)} disabled={savingAdvance}>
                            Cancelar
                        </Button>
                        <Button variant="primary" type="submit" disabled={savingAdvance}>
                            {savingAdvance ? (
                                <Spinner size="sm" />
                            ) : (
                                <DollarSign size={14} className="me-1" />
                            )}
                            Registrar Adelanto
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}
