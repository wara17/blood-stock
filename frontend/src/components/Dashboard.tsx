import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Navbar, Nav, Dropdown, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import bloodInventoryAPI, { BloodGroupStats } from '../services/bloodInventoryAPI';

// Interface for blood group data (using API types)
interface BloodGroupData {
  A: BloodGroupStats['A'];
  B: BloodGroupStats['B'];
  AB: BloodGroupStats['AB'];
  O: BloodGroupStats['O'];
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [bloodGroupData, setBloodGroupData] = useState<BloodGroupData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogout = () => {
    logout();
  };

  const navigateToBloodInventory = () => {
    navigate('/blood-inventory');
  };

  // Load blood group statistics
  const loadBloodGroupStats = async () => {
    try {
      setLoading(true);
      const response = await bloodInventoryAPI.getBloodGroupStats();
      
      if (response.success) {
        setBloodGroupData(response.data);
      }
    } catch (error) {
      console.error('Error loading blood group stats:', error);
      // Set default values if error
      setBloodGroupData({
        A: { 'Whole_Positive': 0, 'Whole_Negative': 0, 'PRC_Positive': 0, 'PRC_Negative': 0, 'LPRC_Positive': 0, 'LPRC_Negative': 0 },
        B: { 'Whole_Positive': 0, 'Whole_Negative': 0, 'PRC_Positive': 0, 'PRC_Negative': 0, 'LPRC_Positive': 0, 'LPRC_Negative': 0 },
        AB: { 'Whole_Positive': 0, 'Whole_Negative': 0, 'PRC_Positive': 0, 'PRC_Negative': 0, 'LPRC_Positive': 0, 'LPRC_Negative': 0 },
        O: { 'Whole_Positive': 0, 'Whole_Negative': 0, 'PRC_Positive': 0, 'PRC_Negative': 0, 'LPRC_Positive': 0, 'LPRC_Negative': 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBloodGroupStats();
  }, []);

  // Get total count for a blood group
  const getTotalCount = (groupStats: BloodGroupStats['A']): number => {
    return Object.values(groupStats).reduce((sum, count) => sum + count, 0);
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

            {/* Blood Groups Inventory */}
            <Row className="mt-4">
              <Col>
                <h5 className="mb-3 text-center">
                  🩸 สถิติเลือดตามหมู่เลือด (เลือดพร้อมใช้งาน)
                  {loading && <span className="ms-2">🔄</span>}
                </h5>
              </Col>
            </Row>
            
            {bloodGroupData && (
              <Row className="g-4">
                {/* Group A */}
                <Col lg={3} md={6}>
                  <Card className="h-100 border-danger">
                    <Card.Header className="bg-danger text-white text-center">
                      <h5 className="mb-0">กรุ๊ป A</h5>
                    </Card.Header>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>Whole +:</span>
                        <Badge bg="success">{bloodGroupData.A.Whole_Positive}</Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>Whole -:</span>
                        <Badge bg="danger">{bloodGroupData.A.Whole_Negative}</Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>PRC +:</span>
                        <Badge bg="success">{bloodGroupData.A.PRC_Positive}</Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>PRC -:</span>
                        <Badge bg="danger">{bloodGroupData.A.PRC_Negative}</Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>LPRC +:</span>
                        <Badge bg="success">{bloodGroupData.A.LPRC_Positive}</Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span>LPRC -:</span>
                        <Badge bg="danger">{bloodGroupData.A.LPRC_Negative}</Badge>
                      </div>
                      <hr />
                      <div className="text-center">
                        <strong>รวม: </strong>
                        <Badge bg="danger" className="fs-6">{getTotalCount(bloodGroupData.A)} ถุง</Badge>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Group B */}
                <Col lg={3} md={6}>
                  <Card className="h-100 border-primary">
                    <Card.Header className="bg-primary text-white text-center">
                      <h5 className="mb-0">กรุ๊ป B</h5>
                    </Card.Header>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>Whole +:</span>
                        <Badge bg="success">{bloodGroupData.B.Whole_Positive}</Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>Whole -:</span>
                        <Badge bg="danger">{bloodGroupData.B.Whole_Negative}</Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>PRC +:</span>
                        <Badge bg="success">{bloodGroupData.B.PRC_Positive}</Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>PRC -:</span>
                        <Badge bg="danger">{bloodGroupData.B.PRC_Negative}</Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>LPRC +:</span>
                        <Badge bg="success">{bloodGroupData.B.LPRC_Positive}</Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span>LPRC -:</span>
                        <Badge bg="danger">{bloodGroupData.B.LPRC_Negative}</Badge>
                      </div>
                      <hr />
                      <div className="text-center">
                        <strong>รวม: </strong>
                        <Badge bg="primary" className="fs-6">{getTotalCount(bloodGroupData.B)} ถุง</Badge>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Group AB */}
                <Col lg={3} md={6}>
                  <Card className="h-100 border-success">
                    <Card.Header className="bg-success text-white text-center">
                      <h5 className="mb-0">กรุ๊ป AB</h5>
                    </Card.Header>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>Whole +:</span>
                        <Badge bg="success">{bloodGroupData.AB.Whole_Positive}</Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>Whole -:</span>
                        <Badge bg="danger">{bloodGroupData.AB.Whole_Negative}</Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>PRC +:</span>
                        <Badge bg="success">{bloodGroupData.AB.PRC_Positive}</Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>PRC -:</span>
                        <Badge bg="danger">{bloodGroupData.AB.PRC_Negative}</Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>LPRC +:</span>
                        <Badge bg="success">{bloodGroupData.AB.LPRC_Positive}</Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span>LPRC -:</span>
                        <Badge bg="danger">{bloodGroupData.AB.LPRC_Negative}</Badge>
                      </div>
                      <hr />
                      <div className="text-center">
                        <strong>รวม: </strong>
                        <Badge bg="success" className="fs-6">{getTotalCount(bloodGroupData.AB)} ถุง</Badge>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Group O */}
                <Col lg={3} md={6}>
                  <Card className="h-100 border-warning">
                    <Card.Header className="bg-warning text-dark text-center">
                      <h5 className="mb-0">กรุ๊ป O</h5>
                    </Card.Header>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>Whole +:</span>
                        <Badge bg="success">{bloodGroupData.O.Whole_Positive}</Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>Whole -:</span>
                        <Badge bg="danger">{bloodGroupData.O.Whole_Negative}</Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>PRC +:</span>
                        <Badge bg="success">{bloodGroupData.O.PRC_Positive}</Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>PRC -:</span>
                        <Badge bg="danger">{bloodGroupData.O.PRC_Negative}</Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>LPRC +:</span>
                        <Badge bg="success">{bloodGroupData.O.LPRC_Positive}</Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span>LPRC -:</span>
                        <Badge bg="danger">{bloodGroupData.O.LPRC_Negative}</Badge>
                      </div>
                      <hr />
                      <div className="text-center">
                        <strong>รวม: </strong>
                        <Badge bg="warning" className="fs-6 text-dark">{getTotalCount(bloodGroupData.O)} ถุง</Badge>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

            {/* Total Summary */}
            {bloodGroupData && (
              <Row className="mt-4">
                <Col>
                  <Card className="bg-light">
                    <Card.Body className="text-center">
                      <h4>สรุปเลือดพร้อมใช้ทั้งหมด</h4>
                      <h2 className="text-primary">
                        {getTotalCount(bloodGroupData.A) + 
                         getTotalCount(bloodGroupData.B) + 
                         getTotalCount(bloodGroupData.AB) + 
                         getTotalCount(bloodGroupData.O)} ถุง
                      </h2>
                      <p className="text-muted">ข้อมูล ณ วันที่ {new Date().toLocaleDateString('th-TH')}</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

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