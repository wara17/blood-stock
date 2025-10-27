import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const { login, register, isLoading, error, clearError } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegisterInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    try {
      await login(formData.username, formData.password);
    } catch (error) {
      // Error handled by context
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (registerData.password !== registerData.confirmPassword) {
      return;
    }

    try {
      await register(registerData.username, registerData.email, registerData.password);
    } catch (error) {
      // Error handled by context
    }
  };

  const toggleForm = () => {
    setShowRegister(!showRegister);
    clearError();
    setFormData({ username: '', password: '' });
    setRegisterData({ username: '', email: '', password: '', confirmPassword: '' });
  };

  return (
    <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <Row className="w-100">
        <Col xs={12} sm={8} md={6} lg={4} className="mx-auto">
          <Card className="shadow">
            <Card.Header className="bg-danger text-white text-center">
              <h4 className="mb-0">
                🩸 Blood Stock Management
              </h4>
            </Card.Header>
            <Card.Body className="p-4">
              {error && (
                <Alert variant="danger" dismissible onClose={clearError}>
                  {error}
                </Alert>
              )}

              {!showRegister ? (
                // Login Form
                <Form onSubmit={handleLogin}>
                  <h5 className="text-center mb-4">เข้าสู่ระบบ</h5>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>ชื่อผู้ใช้ หรือ อีเมล</Form.Label>
                    <Form.Control
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="กรอกชื่อผู้ใช้ หรือ อีเมล"
                      required
                      disabled={isLoading}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>รหัสผ่าน</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="กรอกรหัสผ่าน"
                      required
                      disabled={isLoading}
                    />
                  </Form.Group>

                  <Button
                    variant="danger"
                    type="submit"
                    className="w-100 mb-3"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        กำลังเข้าสู่ระบบ...
                      </>
                    ) : (
                      'เข้าสู่ระบบ'
                    )}
                  </Button>

                  <div className="text-center">
                    <Button
                      variant="link"
                      onClick={toggleForm}
                      disabled={isLoading}
                      className="text-decoration-none"
                    >
                      ยังไม่มีบัญชี? สมัครสมาชิก
                    </Button>
                  </div>
                </Form>
              ) : (
                // Register Form
                <Form onSubmit={handleRegister}>
                  <h5 className="text-center mb-4">สมัครสมาชิก</h5>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>ชื่อผู้ใช้</Form.Label>
                    <Form.Control
                      type="text"
                      name="username"
                      value={registerData.username}
                      onChange={handleRegisterInputChange}
                      placeholder="กรอกชื่อผู้ใช้ (อย่างน้อย 3 ตัวอักษร)"
                      required
                      disabled={isLoading}
                      minLength={3}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>อีเมล</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={registerData.email}
                      onChange={handleRegisterInputChange}
                      placeholder="กรอกอีเมล"
                      required
                      disabled={isLoading}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>รหัสผ่าน</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={registerData.password}
                      onChange={handleRegisterInputChange}
                      placeholder="กรอกรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                      required
                      disabled={isLoading}
                      minLength={6}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>ยืนยันรหัสผ่าน</Form.Label>
                    <Form.Control
                      type="password"
                      name="confirmPassword"
                      value={registerData.confirmPassword}
                      onChange={handleRegisterInputChange}
                      placeholder="กรอกรหัสผ่านอีกครั้ง"
                      required
                      disabled={isLoading}
                      isInvalid={registerData.confirmPassword !== '' && registerData.password !== registerData.confirmPassword}
                    />
                    <Form.Control.Feedback type="invalid">
                      รหัสผ่านไม่ตรงกัน
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Button
                    variant="success"
                    type="submit"
                    className="w-100 mb-3"
                    disabled={isLoading || registerData.password !== registerData.confirmPassword}
                  >
                    {isLoading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        กำลังสมัครสมาชิก...
                      </>
                    ) : (
                      'สมัครสมาชิก'
                    )}
                  </Button>

                  <div className="text-center">
                    <Button
                      variant="link"
                      onClick={toggleForm}
                      disabled={isLoading}
                      className="text-decoration-none"
                    >
                      มีบัญชีแล้ว? เข้าสู่ระบบ
                    </Button>
                  </div>
                </Form>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;