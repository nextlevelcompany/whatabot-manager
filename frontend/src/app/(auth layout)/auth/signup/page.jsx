'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { faFacebook, faGoogle } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Card, Col, Container, Form, InputGroup, Row } from 'react-bootstrap';
import CommonFooter1 from '../CommonFooter1';

//Images
import signupBg from '@/assets/img/signup-bg.jpg';
import slide1 from '@/assets/img/slide1.jpg';
import slide2 from '@/assets/img/slide2.jpg';
import jampackImg from '@/assets/img/nextlead-logo.png';
import jampackImgDark from '@/assets/img/nextlead-logo.png';
import { useTheme } from '@/layout/theme-provider/theme-provider';


import { useRouter } from 'next/navigation';

const Signup = (props) => {
    const [showPassword, setShowPassword] = useState(false);
    const [userName, setUserName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [loading, setLoading] = useState(false);
    
    const router = useRouter();
    const { theme } = useTheme();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");
        setLoading(true);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';
            const res = await fetch(`${apiUrl}/api/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: userName,
                    email: email,
                    password: password,
                    role: "USER"
                })
            });

            if (res.ok) {
                setSuccessMsg("¡Registro exitoso! Redirigiendo al login...");
                setTimeout(() => {
                    router.push("/auth/login");
                }, 2000);
            } else {
                try {
                    const data = await res.json();
                    setErrorMsg(data.error || "Error al registrar el usuario");
                } catch (jsonErr) {
                    setErrorMsg("Error al registrar el usuario");
                }
            }
        } catch (err) {
            setErrorMsg("Error al conectar con el servidor. Inténtalo de nuevo.");
            console.error("Signup error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="hk-pg-wrapper py-0">
            <div className="hk-pg-body py-0">
                <Container fluid>
                    <Row className="auth-split">
                        <Col xl={5} lg={6} md={5} className="d-md-block d-none bg-primary-dark-3 bg-opacity-85 position-relative">
                            <Image className="bg-img" src={signupBg} alt="bg-img" />
                            <div className="auth-content py-8">
                                <Row>
                                    <Col xxl={8} className="mx-auto">
                                        <div className="text-center">
                                            <h3 className="text-white mb-2">High quality Bootstrap template for your next web project.</h3>
                                            <p className="text-white">Start your <u>14 Days FREE</u> trial.</p>
                                        </div>
                                        <ul className="list-icon text-white mt-4">
                                            <li className="mb-1">
                                                <p><i className="ri-check-fill" /><span>There are many variations of passages of Lorem Ipsum available, in some form, by injected humour</span></p>
                                            </li>
                                            <li className="mb-1">
                                                <p><i className="ri-check-fill" /><span>There are many variations of passages of Lorem Ipsum available, in some form, by injected humour</span></p>
                                            </li>
                                        </ul>
                                        <Row className="gx-3 mt-7">
                                            <Col lg={6}>
                                                <Card className="card-shadow">
                                                    <Card.Img variant="top" src={slide1.src} alt="Card img cap" />
                                                    <Card.Body>
                                                        <Card.Title className="text-uppercase">Help Centre</Card.Title>
                                                        <Card.Text>This is a wider card with supporting text.</Card.Text>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col lg={6}>
                                                <Card className="card-shadow">
                                                    <Card.Img variant="top" src={slide2.src} alt="Card img cap" />
                                                    <Card.Body>
                                                        <Card.Title className="text-uppercase">Research Centre</Card.Title>
                                                        <Card.Text>This is a wider card with supporting text.</Card.Text>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>
                            </div>
                            <p className="p-xs text-white credit-text opacity-55">All illustration are powered by <a href="https://icons8.com/ouch/" target="_blank" className="link-white" rel="noreferrer"><u>OUCH</u></a></p>
                        </Col>
                        <Col xl={7} lg={6} md={7} sm={10} className="position-relative mx-auto">
                            <div className="auth-content flex-column pt-8 pb-md-8 pb-13">
                                <div className="text-center mb-7">
                                    <Link href="/" className="navbar-brand me-0">
                                        {theme === "light" ? (
                                            <Image className="brand-img d-inline-block" src={jampackImg} alt="brand" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
                                        ) : (
                                            <Image className="brand-img d-inline-block" src={jampackImgDark} alt="brand" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
                                        )}
                                    </Link>
                                </div>
                                <Form className="w-100" onSubmit={handleSubmit}>
                                    <Row>
                                        <Col xxl={5} xl={7} lg={10} className="mx-auto">
                                            <h4 className="text-center mb-4">Sign Up to Jampack</h4>
                                            {errorMsg && (
                                                <div className="alert alert-danger py-2 text-center fs-7 mb-3" role="alert">
                                                    {errorMsg}
                                                </div>
                                            )}
                                            {successMsg && (
                                                <div className="alert alert-success py-2 text-center fs-7 mb-3" role="alert">
                                                    {successMsg}
                                                </div>
                                            )}
                                            <Button variant="outline-dark" className="btn-rounded btn-block mb-3">
                                                <span>
                                                    <span className="icon">
                                                        <FontAwesomeIcon icon={faGoogle} />
                                                    </span>
                                                    <span>Sign Up with Gmail</span>
                                                </span>
                                            </Button>
                                            <Button variant="social-facebook" className="btn-social btn-rounded btn-block">
                                                <span>
                                                    <span className="icon">
                                                        <FontAwesomeIcon icon={faFacebook} />
                                                    </span>
                                                    <span>Sign Up with Facebook</span>
                                                </span>
                                            </Button>
                                            <div className="title-sm title-wth-divider divider-center my-4"><span>Or</span></div>
                                            <Row className="gx-3">
                                                <Col lg={6} as={Form.Group} className="mb-3">
                                                    <Form.Label>Name</Form.Label>
                                                    <Form.Control placeholder="Enter your name" type="text" disabled={loading} />
                                                </Col>
                                                <Col lg={6} as={Form.Group} className="mb-3">
                                                    <Form.Label>Username</Form.Label>
                                                    <Form.Control placeholder="Enter username" type="text" value={userName} onChange={e => setUserName(e.target.value)} required disabled={loading} />
                                                </Col>
                                                <Col lg={12} as={Form.Group} className="mb-3">
                                                    <Form.Label>Email</Form.Label>
                                                    <Form.Control placeholder="Enter your email id" type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
                                                </Col>
                                                <Col lg={12} as={Form.Group} className="mb-3">
                                                    <Form.Label>Password</Form.Label>
                                                    <InputGroup className="password-check">
                                                        <span className="input-affix-wrapper affix-wth-text">
                                                            <Form.Control placeholder="6+ characters" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} />
                                                            <a href="#" className="input-suffix text-primary text-uppercase fs-8 fw-medium" onClick={(e) => { e.preventDefault(); setShowPassword(!showPassword); }} >
                                                                {showPassword
                                                                    ?
                                                                    <span>Hide</span>
                                                                    :
                                                                    <span>Show</span>
                                                                }
                                                            </a>
                                                        </span>
                                                    </InputGroup>
                                                </Col>
                                            </Row>
                                            <Form.Check id="logged_in" className="form-check-sm mb-3" >
                                                <Form.Check.Input type="checkbox" defaultChecked />
                                                <Form.Check.Label className="text-muted fs-7">
                                                    By creating an account you specify that you have read and agree with our <a href="#">Terms of use</a> and <a href="#">Privacy policy</a>. We may keep you informed about latest updates through our default <a href="#">notification settings</a>
                                                </Form.Check.Label>
                                            </Form.Check>
                                            <Button variant='primary' type="submit" className="btn-rounded btn-uppercase btn-block" disabled={loading}>
                                                {loading ? "Creando cuenta..." : "Create account"}
                                            </Button>
                                            <p className="p-xs mt-2 text-center">Already a member ? <a href="#"><u>Sign In</u></a></p>
                                        </Col>
                                    </Row>
                                </Form>
                            </div>
                            {/* Page Footer */}
                            <CommonFooter1 />
                        </Col>
                    </Row>
                </Container>
            </div>
        </div>

    )
}

export default Signup
