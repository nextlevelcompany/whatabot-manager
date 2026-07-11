'use client'
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Button, Col, Container, Form, Nav, Row, Tab } from 'react-bootstrap';
//Image
import avatar3 from '@/assets/img/avatar3.jpg';

const EditProfile = ({ toggleCollapsedNav }) => {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [location, setLocation] = useState("");
    const [bio, setBio] = useState("");
    const [website, setWebsite] = useState("");
    const [phone, setPhone] = useState("");
    const [avatar, setAvatar] = useState("");
    
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        const storedUser = localStorage.getItem("username") || "admin";
        setUsername(storedUser);
        
        const fetchProfile = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8081';
                const res = await fetch(`${apiUrl}/api/auth/profile/${storedUser}`);
                if (res.ok) {
                    const data = await res.json();
                    setFirstName(data.firstName || "");
                    setLastName(data.lastName || "");
                    setLocation(data.location || "");
                    setBio(data.bio || "");
                    setWebsite(data.website || "");
                    setPhone(data.phone || "");
                    setAvatar(data.avatar || "");
                }
            } catch (err) {
                console.error("Error fetching profile:", err);
            }
        };
        fetchProfile();
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setErrorMsg("El tamaño de la imagen no debe exceder los 5MB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSuccessMsg("");
        setErrorMsg("");
        setLoading(true);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8081';
            const res = await fetch(`${apiUrl}/api/auth/profile/${username}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    location,
                    bio,
                    phone,
                    website,
                    avatar
                })
            });

            if (res.ok) {
                setSuccessMsg("¡Perfil actualizado con éxito!");
                setTimeout(() => setSuccessMsg(""), 4000);
            } else {
                setErrorMsg("Error al actualizar el perfil.");
            }
        } catch (err) {
            setErrorMsg("Error de conexión al guardar cambios.");
            console.error("Save profile error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <div className="hk-pg-header pt-7 pb-4">
                <h1 className="pg-title">Edit Profile</h1>
                <p>Configure personal details and account settings stored in the database.</p>
            </div>
            {/* Page Body */}
            <div className="hk-pg-body">
                <Tab.Container defaultActiveKey="tabBlock1">
                    <Row className="edit-profile-wrap">
                        <Col xs={4} sm={3} lg={2}>
                            <div className="nav-profile mt-4">
                                <div className="nav-header">
                                    <span>Account</span>
                                </div>
                                <Nav as="ul" variant="tabs" className="nav-light nav-vertical">
                                    <Nav.Item as="li">
                                        <Nav.Link eventKey="tabBlock1">
                                            <span className="nav-link-text">Public Profile</span>
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item as="li">
                                        <Nav.Link eventKey="tabBlock2">
                                            <span className="nav-link-text">Account Settings</span>
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item as="li">
                                        <Nav.Link eventKey="tabBlock3">
                                            <span className="nav-link-text">Privacy Settings</span>
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item as="li">
                                        <Nav.Link eventKey="tabBlock4">
                                            <span className="nav-link-text">Login &amp; Security</span>
                                        </Nav.Link>
                                    </Nav.Item>
                                </Nav>
                            </div>
                        </Col>
                        <Col lg={10} sm={9} xs={8}>
                            <Tab.Content>
                                <Tab.Pane eventKey="tabBlock1">
                                    <Form onSubmit={handleSaveProfile}>
                                        <Row className="gx-3">
                                            <Col sm={12}>
                                                <Form.Group>
                                                    <div className="media align-items-center">
                                                        <div className="media-head me-5">
                                                            <div className="avatar avatar-rounded avatar-xxl">
                                                                <img src={avatar || avatar3.src} alt="user" className="avatar-img" style={{ objectFit: 'cover', width: '100%', height: '100%', borderRadius: '50%' }} />
                                                            </div>
                                                        </div>
                                                        <div className="media-body">
                                                            <Button variant="soft-primary" className="btn-file mb-1">
                                                                Upload Photo
                                                                <Form.Control type="file" className="upload" accept="image/*" onChange={handleFileChange} />
                                                            </Button>
                                                            <Form.Text as="div" className="form-text text-muted">
                                                                For better preview recommended size is 450px x 450px. Max size 5mb.
                                                            </Form.Text>
                                                        </div>
                                                    </div>
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        
                                        <div className="title title-xs title-wth-divider text-primary text-uppercase my-4"><span>Personal Info</span></div>
                                        
                                        {successMsg && (
                                            <div className="alert alert-success py-2 text-center fs-7 mb-3" role="alert">
                                                {successMsg}
                                            </div>
                                        )}
                                        {errorMsg && (
                                            <div className="alert alert-danger py-2 text-center fs-7 mb-3" role="alert">
                                                {errorMsg}
                                            </div>
                                        )}

                                        <Row className="gx-3">
                                            <Col sm={6}>
                                                <Form.Group className="mb-3" >
                                                    <Form.Label>First Name</Form.Label>
                                                    <Form.Control type="text" value={firstName} onChange={e => setFirstName(e.target.value)} disabled={loading} />
                                                </Form.Group>
                                            </Col>
                                            <Col sm={6}>
                                                <Form.Group className="mb-3" >
                                                    <Form.Label>Last Name</Form.Label>
                                                    <Form.Control type="text" value={lastName} onChange={e => setLastName(e.target.value)} disabled={loading} />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <Row className="gx-3">
                                            <Col sm={12}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Location</Form.Label>
                                                    <Form.Control type="text" value={location} onChange={e => setLocation(e.target.value)} disabled={loading} />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <Row className="gx-3">
                                            <Col sm={12}>
                                                <Form.Group className="mb-3">
                                                    <div className="form-label-group">
                                                        <Form.Label>Bio</Form.Label>
                                                    </div>
                                                    <Form.Control as="textarea" rows={6} value={bio} onChange={e => setBio(e.target.value)} disabled={loading} placeholder="Write a brief bio about yourself..." />
                                                    <Form.Text muted>
                                                        Brief bio about yourself. This will be displayed on your profile page.
                                                    </Form.Text>
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        
                                        <div className="title title-xs title-wth-divider text-primary text-uppercase my-4">
                                            <span>Additional Info</span>
                                        </div>
                                        <Row className="gx-3">
                                            <Col sm={12}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Personal Website</Form.Label>
                                                    <Form.Control type="text" value={website} onChange={e => setWebsite(e.target.value)} disabled={loading} />
                                                </Form.Group>
                                            </Col>
                                            <Col sm={12}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Phone</Form.Label>
                                                    <Form.Control type="tel" value={phone} onChange={e => setPhone(e.target.value)} disabled={loading} />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <Button variant="primary" type="submit" className="mt-5" disabled={loading}>
                                            {loading ? "Saving..." : "Save Changes"}
                                        </Button>
                                    </Form>
                                </Tab.Pane>
                                <Tab.Pane eventKey="tabBlock2">
                                    <div className="title-lg fs-4"><span>Account Settings</span></div>
                                    <p className="mb-4">Standard settings linked to your user account.</p>
                                    <Form>
                                        <Row className="gx-3">
                                            <Col sm={12}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Username</Form.Label>
                                                    <Form.Control type="text" value={username} disabled />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </Form>
                                </Tab.Pane>
                                <Tab.Pane eventKey="tabBlock3">
                                    <div className="title-lg fs-4 mb-4">
                                        <span>Privacy Settings</span>
                                    </div>
                                    <p>Default template configuration. Save functionality is preset.</p>
                                </Tab.Pane>
                                <Tab.Pane eventKey="tabBlock4">
                                    <div className="title-lg fs-4"><span>Login &amp; Security</span></div>
                                    <p>Standard security policies.</p>
                                </Tab.Pane>
                            </Tab.Content>
                        </Col>
                    </Row>
                </Tab.Container>
            </div>
        </Container>
    )
}

export default EditProfile;
