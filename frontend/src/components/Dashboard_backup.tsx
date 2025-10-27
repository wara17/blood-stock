import React from 'react';
import { Container, Row, Col, Card, Button, Navbar, Nav, Dropdown } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  const navigateToBloodInventory = () => {
    navigate('/blood-inventory');
  };

  return (
    <>
      {/* Navigation Bar */}
      <Navbar bg="danger" variant="dark" expand="lg" className="shadow">
        <Container>
          <Navbar.Brand as={Link} to="/dashboard">
            🩸 Blood Stock Management
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/dashboard" active>หน้าหลัก</Nav.Link>
              <Nav.Link as={Link} to="/blood-inventory">คลังเลือด</Nav.Link>
              <Nav.Link href="#requests">การร้องขอ</Nav.Link>
              <Nav.Link href="#reports">รายงาน</Nav.Link>
            </Nav>
            <Nav>
              <Dropdown align="end">
                <Dropdown.Toggle variant="outline-light" id="dropdown-basic">
                  👤 {user?.username}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item href="#profile">โปรไฟล์</Dropdown.Item>
                  <Dropdown.Item href="#settings">การตั้งค่า</Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout}>ออกจากระบบ</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main Content */}
      <Container className="mt-4">
        <Row>
          <Col>
            <h2 className="mb-4">ยินดีต้อนรับสู่ระบบจัดการคลังเลือด</h2>
            
            {/* Welcome Card */}
            <Card className="mb-4">
              <Card.Body>
                <Card.Title>สวัสดี, {user?.username}! 👋</Card.Title>
                <Card.Text>
                  คุณได้เข้าสู่ระบบเรียบร้อยแล้ว เวลา: {new Date().toLocaleString('th-TH')}
                </Card.Text>
                <Card.Text className="text-muted">
                  <small>
                    อีเมล: {user?.email} | 
                    สมาชิกตั้งแต่: {user?.created_at ? new Date(user.created_at).toLocaleDateString('th-TH') : '-'}
                  </small>
                </Card.Text>
              </Card.Body>
            </Card>

            {/* Dashboard Cards */}
            <Row>
              <Col md={6} lg={3} className="mb-4">
                <Card className="h-100 border-primary">
                  <Card.Body className="text-center">
                    <div className="display-4 text-primary">🩸</div>
                    <Card.Title>คลังเลือด</Card.Title>
                    <Card.Text>จัดการข้อมูลเลือดในคลัง</Card.Text>
                    <Button variant="primary" size="sm" onClick={navigateToBloodInventory}>เข้าสู่หน้า</Button>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6} lg={3} className="mb-4">
                <Card className="h-100 border-success">
                  <Card.Body className="text-center">
                    <div className="display-4 text-success">📋</div>
                    <Card.Title>การร้องขอ</Card.Title>
                    <Card.Text>จัดการคำขอเลือด</Card.Text>
                    <Button variant="success" size="sm">เข้าสู่หน้า</Button>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6} lg={3} className="mb-4">
                <Card className="h-100 border-warning">
                  <Card.Body className="text-center">
                    <div className="display-4 text-warning">👥</div>
                    <Card.Title>ผู้บริจาค</Card.Title>
                    <Card.Text>จัดการข้อมูลผู้บริจาค</Card.Text>
                    <Button variant="warning" size="sm">เข้าสู่หน้า</Button>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6} lg={3} className="mb-4">
                <Card className="h-100 border-info">
                  <Card.Body className="text-center">
                    <div className="display-4 text-info">📊</div>
                    <Card.Title>รายงาน</Card.Title>
                    <Card.Text>ดูรายงานและสถิติ</Card.Text>
                    <Button variant="info" size="sm">เข้าสู่หน้า</Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Stats Overview */}
            <Card className="mt-4">
              <Card.Header>
                <h5 className="mb-0">ภาพรวมระบบ</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={3} className="text-center">
                    <h3 className="text-primary">-</h3>
                    <p className="text-muted">หน่วยเลือดทั้งหมด</p>
                  </Col>
                  <Col md={3} className="text-center">
                    <h3 className="text-success">-</h3>
                    <p className="text-muted">เลือดพร้อมใช้</p>
                  </Col>
                  <Col md={3} className="text-center">
                    <h3 className="text-warning">-</h3>
                    <p className="text-muted">เลือดใกล้หมดอายุ</p>
                  </Col>
                  <Col md={3} className="text-center">
                    <h3 className="text-danger">-</h3>
                    <p className="text-muted">คำขอรอดำเนินการ</p>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Development Note */}
            <Card className="mt-4 border-secondary">
              <Card.Body>
                <Card.Title className="text-secondary">🚧 โหมดพัฒนา</Card.Title>
                <Card.Text>
                  ระบบนี้อยู่ในโหมดการพัฒนา ฟีเจอร์ต่างๆ จะถูกเพิ่มเข้ามาในอนาคต
                </Card.Text>
                <Card.Text className="text-muted">
                  <small>
                    🔐 JWT Authentication: ✅ สำเร็จ<br />
                    🗄️ Database: ✅ PostgreSQL พร้อมใช้งาน<br />
                    🌐 API: ✅ Backend ทำงานได้ปกติ<br />
                    💻 Frontend: ✅ React + Bootstrap พร้อม
                  </small>
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Dashboard;