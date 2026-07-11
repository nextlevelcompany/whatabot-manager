'use client'
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Spinner, Alert, Badge } from 'react-bootstrap';
import * as Icons from 'tabler-icons-react';

const getApiBase = () => {
    if (typeof window !== 'undefined') {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
        return `${protocol}//${hostname}:8081`;
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8081';
};

const API_BASE = getApiBase();

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });
    const [isEditMode, setIsEditMode] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        role: 'USER',
        firstName: '',
        lastName: '',
        phone: '',
        location: '',
        bio: ''
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/api/admin/users`, {
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                showAlert('danger', 'Error al cargar los usuarios del servidor.');
            }
        } catch (err) {
            console.error('Error fetching users:', err);
            showAlert('danger', 'Error de conexión con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const showAlert = (type, message) => {
        setAlert({ show: true, type, message });
        setTimeout(() => {
            setAlert(prev => ({ ...prev, show: false }));
        }, 5000);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEditClick = (user) => {
        setIsEditMode(true);
        setFormData({
            username: user.username,
            password: '', // Dejar en blanco en edición para mantener la existente
            confirmPassword: '',
            role: user.role,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            phone: user.phone || '',
            location: user.location || '',
            bio: user.bio || ''
        });
        setShowModal(true);
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            showAlert('danger', 'Las contraseñas no coinciden.');
            return;
        }

        if (!isEditMode && (!formData.password || formData.password.trim() === '')) {
            showAlert('danger', 'La contraseña es obligatoria para nuevos usuarios.');
            return;
        }

        setSaving(true);
        try {
            const userPayload = {
                username: formData.username,
                password: formData.password || null,
                role: formData.role,
                firstName: formData.firstName || null,
                lastName: formData.lastName || null,
                phone: formData.phone || null,
                location: formData.location || null,
                bio: formData.bio || null,
                avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(formData.username)}`
            };

            const url = isEditMode ? `${API_BASE}/api/admin/users/${formData.username}` : `${API_BASE}/api/admin/users`;
            const method = isEditMode ? 'PUT' : 'POST';

            const token = localStorage.getItem("token");
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(userPayload)
            });

            if (res.ok) {
                showAlert('success', isEditMode ? `Usuario "${formData.username}" actualizado correctamente.` : `Usuario "${formData.username}" creado exitosamente.`);
                setShowModal(false);
                setFormData({
                    username: '',
                    password: '',
                    confirmPassword: '',
                    role: 'USER',
                    firstName: '',
                    lastName: '',
                    phone: '',
                    location: '',
                    bio: ''
                });
                fetchUsers();
            } else {
                const msg = await res.text();
                showAlert('danger', msg || 'Error al procesar el usuario.');
            }
        } catch (err) {
            console.error('Error saving user:', err);
            showAlert('danger', 'Error de red al intentar procesar el usuario.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteUser = async (username) => {
        const currentUser = localStorage.getItem('username');
        if (username === currentUser) {
            alert('No puedes eliminar tu propio usuario activo.');
            return;
        }

        if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente al usuario "${username}"?`)) {
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/api/admin/users/${username}`, {
                method: 'DELETE',
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });

            if (res.ok) {
                showAlert('success', `Usuario "${username}" eliminado.`);
                fetchUsers();
            } else {
                showAlert('danger', 'Error al eliminar el usuario.');
            }
        } catch (err) {
            console.error('Error deleting user:', err);
            showAlert('danger', 'Error de red al intentar eliminar el usuario.');
        }
    };

    const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const adminCount = users.filter(u => u.role === 'ADMIN').length;
    const userCount = users.filter(u => u.role === 'USER').length;

    return (
        <Container fluid className="pt-4">
            <Row className="mb-4">
                <Col>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h1 className="pg-title font-weight-bold" style={{ letterSpacing: '-0.02em' }}>👥 Gestión de Usuarios</h1>
                            <p className="text-muted">Crea, edita y administra las cuentas de acceso al sistema NextLead CRM.</p>
                        </div>
                        <Button variant="primary" onClick={() => {
                            setIsEditMode(false);
                            setFormData({
                                username: '',
                                password: '',
                                confirmPassword: '',
                                role: 'USER',
                                firstName: '',
                                lastName: '',
                                phone: '',
                                location: '',
                                bio: ''
                            });
                            setShowModal(true);
                        }} className="d-flex align-items-center gap-1">
                            <Icons.UserPlus size={18} /> Crear Usuario
                        </Button>
                    </div>
                </Col>
            </Row>

            {alert.show && (
                <Row className="mb-3">
                    <Col>
                        <Alert variant={alert.type} onClose={() => setAlert({ ...alert, show: false })} dismissible>
                            {alert.message}
                        </Alert>
                    </Col>
                </Row>
            )}

            {/* Tarjetas de Estadísticas */}
            <Row className="mb-4 row-cols-1 row-cols-md-3 g-3">
                <Col>
                    <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                        <Card.Body className="d-flex align-items-center gap-3 py-3">
                            <div className="p-3 bg-primary-subtle text-primary rounded-circle">
                                <Icons.Users size={24} />
                            </div>
                            <div>
                                <h3 className="mb-0 fw-bold">{users.length}</h3>
                                <span className="text-muted small">Usuarios Totales</span>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col>
                    <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                        <Card.Body className="d-flex align-items-center gap-3 py-3">
                            <div className="p-3 bg-success-subtle text-success rounded-circle">
                                <Icons.ShieldCheck size={24} />
                            </div>
                            <div>
                                <h3 className="mb-0 fw-bold">{adminCount}</h3>
                                <span className="text-muted small">Administradores</span>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col>
                    <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                        <Card.Body className="d-flex align-items-center gap-3 py-3">
                            <div className="p-3 bg-info-subtle text-info rounded-circle">
                                <Icons.User size={24} />
                            </div>
                            <div>
                                <h3 className="mb-0 fw-bold">{userCount}</h3>
                                <span className="text-muted small">Operadores (Users)</span>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Listado de Usuarios */}
            <Row>
                <Col>
                    <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                        <Card.Header className="bg-light border-0 py-3 d-flex justify-content-between align-items-center">
                            <span className="fw-bold">📋 Listado de Cuentas</span>
                            <div style={{ maxWidth: '300px' }} className="w-100">
                                <Form.Group className="mb-0">
                                    <Form.Control
                                        type="text"
                                        placeholder="Buscar usuario..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        size="sm"
                                    />
                                </Form.Group>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {loading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="primary" className="mb-2" />
                                    <p className="text-muted mb-0">Cargando usuarios...</p>
                                </div>
                            ) : (
                                <Table hover responsive className="mb-0 align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Avatar</th>
                                            <th>Nombre de Usuario</th>
                                            <th>Nombre Completo</th>
                                            <th>Rol</th>
                                            <th>Teléfono</th>
                                            <th>Ubicación</th>
                                            <th className="text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.length > 0 ? (
                                            filteredUsers.map((user) => (
                                                <tr key={user.id}>
                                                    <td>
                                                        <img 
                                                            src={user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`} 
                                                            alt={user.username} 
                                                            className="rounded-circle border" 
                                                            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                                        />
                                                    </td>
                                                    <td className="fw-semibold">{user.username}</td>
                                                    <td>
                                                        {user.firstName || user.lastName ? (
                                                            `${user.firstName || ''} ${user.lastName || ''}`.trim()
                                                        ) : (
                                                            <span className="text-muted small">- Sin registrar -</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <Badge bg={user.role === 'ADMIN' ? 'danger' : 'info'}>
                                                            {user.role}
                                                        </Badge>
                                                    </td>
                                                    <td>{user.phone || <span className="text-muted small">-</span>}</td>
                                                    <td>{user.location || <span className="text-muted small">-</span>}</td>
                                                    <td className="text-center">
                                                        <div className="d-flex justify-content-center gap-2">
                                                            <Button 
                                                                variant="outline-primary" 
                                                                size="sm" 
                                                                onClick={() => handleEditClick(user)}
                                                                className="btn-icon rounded-circle"
                                                                title="Editar usuario"
                                                            >
                                                                <Icons.Pencil size={16} />
                                                            </Button>
                                                            <Button 
                                                                variant="outline-danger" 
                                                                size="sm" 
                                                                onClick={() => handleDeleteUser(user.username)}
                                                                className="btn-icon rounded-circle"
                                                                title="Eliminar usuario"
                                                            >
                                                                <Icons.Trash size={16} />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="text-center text-muted py-4">No se encontraron usuarios.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* MODAL CREAR USUARIO */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold fs-5">
                        {isEditMode ? '📝 Editar Usuario' : '👥 Crear Nuevo Usuario'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCreateUser}>
                    <Modal.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">Nombre de Usuario (Username) *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        required
                                        readOnly={isEditMode}
                                        className={isEditMode ? "bg-light" : ""}
                                        placeholder="Ej. admin_pedidos"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">Rol del Sistema *</Form.Label>
                                    <Form.Select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="USER">USER (Operador / Vendedor)</option>
                                        <option value="ADMIN">ADMIN (Administrador total)</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">
                                        {isEditMode ? 'Nueva Contraseña (dejar en blanco para mantener la actual)' : 'Contraseña *'}
                                    </Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required={!isEditMode}
                                        placeholder={isEditMode ? "Solo si deseas cambiarla" : "Mínimo 6 caracteres"}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">
                                        {isEditMode ? 'Confirmar Nueva Contraseña' : 'Confirmar Contraseña *'}
                                    </Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        required={!isEditMode && formData.password !== ''}
                                        placeholder={isEditMode ? "Solo si deseas cambiarla" : "Repite la contraseña"}
                                    />
                                </Form.Group>
                            </Col>

                            <hr className="my-3" />
                            <h6 className="fw-bold mb-0">Detalles de Perfil (Opcional)</h6>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">Nombres</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        placeholder="Ej. Juan"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">Apellidos</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        placeholder="Ej. Pérez"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">Teléfono</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="Ej. 987654321"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">Ubicación</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        placeholder="Ej. Miraflores, Lima"
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={12}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">Biografía</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleInputChange}
                                        placeholder="Breve descripción del usuario o notas..."
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="outline-secondary" onClick={() => setShowModal(false)} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button variant="primary" type="submit" disabled={saving}>
                            {saving ? <Spinner size="sm" className="me-1" /> : null} Guardar Usuario
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
}
