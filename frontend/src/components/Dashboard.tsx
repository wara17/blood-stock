import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Navbar, Nav, Dropdown, Badge, Modal } from 'react-bootstrap';
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
  const [showDonationGuide, setShowDonationGuide] = useState<boolean>(false);

  const handleLogout = () => {
    logout();
  };

  const navigateToBloodInventory = () => {
    navigate('/blood-inventory');
  };

  const showBloodDonationGuide = () => {
    setShowDonationGuide(true);
  };

  const closeDonationGuide = () => {
    setShowDonationGuide(false);
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

            {/* Menu Shortcuts - Top Row */}
            <Row className="mb-4">
              <Col lg={3} md={6} className="mb-3">
                <Card 
                  className="border-primary shadow-sm h-100" 
                  style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onClick={navigateToBloodInventory}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  }}
                >
                  <Card.Body className="p-3">
                    <div className="d-flex align-items-center">
                      <div className="fs-2 text-primary me-3">🩸</div>
                      <div>
                        <Card.Title className="h6 mb-1">คลังเลือด</Card.Title>
                        <Card.Text className="small text-muted mb-0">จัดการข้อมูลเลือดในคลัง</Card.Text>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={3} md={6} className="mb-3">
                <Card 
                  className="border-success shadow-sm h-100" 
                  style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onClick={() => {/* TODO: navigate to requests */}}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  }}
                >
                  <Card.Body className="p-3">
                    <div className="d-flex align-items-center">
                      <div className="fs-2 text-success me-3">📋</div>
                      <div>
                        <Card.Title className="h6 mb-1">จองเลือด / ขอเลือด</Card.Title>
                        <Card.Text className="small text-muted mb-0">จัดการการจองและคำขอเลือด</Card.Text>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={3} md={6} className="mb-3">
                <Card 
                  className="border-warning shadow-sm h-100" 
                  style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onClick={() => {/* TODO: navigate to donors */}}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  }}
                >
                  <Card.Body className="p-3">
                    <div className="d-flex align-items-center">
                      <div className="fs-2 text-warning me-3">�</div>
                      <div>
                        <Card.Title className="h6 mb-1">จ่ายเลือด</Card.Title>
                        <Card.Text className="small text-muted mb-0">จัดการการจ่ายเลือดให้ผู้ป่วย</Card.Text>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={3} md={6} className="mb-3">
                <Card 
                  className="border-info shadow-sm h-100" 
                  style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onClick={showBloodDonationGuide}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  }}
                >
                  <Card.Body className="p-3">
                    <div className="d-flex align-items-center">
                      <div className="fs-2 text-info me-3">�</div>
                      <div>
                        <Card.Title className="h6 mb-1">การเตรียมตัวก่อนบริจาคเลือด</Card.Title>
                        <Card.Text className="small text-muted mb-0">คำแนะนำการเตรียมตัวสำหรับผู้บริจาค</Card.Text>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Blood Group Statistics - 9 columns & Summary - 3 columns */}
            <Row>
              {/* Blood Group Statistics - 9 columns */}
              <Col lg={9}>
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0 text-center">
                      🩸 สถิติเลือดตามหมู่เลือด (เลือดพร้อมใช้งาน)
                      {loading && <span className="ms-2">🔄</span>}
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    {bloodGroupData && (
                      <>
                        {/* Total Summary - Top Row 12 columns */}
                        <Row className="mb-4">
                          <Col>
                            <Card className="bg-light border-0">
                              <Card.Body className="text-center py-3">
                                <h5 className="text-primary mb-2">สรุปเลือดพร้อมใช้ทั้งหมด</h5>
                                <h3 className="text-primary mb-1">
                                  {getTotalCount(bloodGroupData.A) + 
                                   getTotalCount(bloodGroupData.B) + 
                                   getTotalCount(bloodGroupData.AB) + 
                                   getTotalCount(bloodGroupData.O)} ถุง
                                </h3>
                                <small className="text-muted">ข้อมูล ณ วันที่ {new Date().toLocaleDateString('th-TH')}</small>
                              </Card.Body>
                            </Card>
                          </Col>
                        </Row>

                        {/* Blood Groups Row 1 - A & B */}
                        <Row className="g-3 mb-3">
                          {/* Group A */}
                          <Col md={6}>
                            <Card className="h-100 border-danger">
                              <Card.Header className="bg-danger text-white text-center py-2">
                                <h6 className="mb-0">กรุ๊ป A</h6>
                              </Card.Header>
                              <Card.Body className="p-3">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="small">Whole +:</span>
                                  <Badge bg="success">{bloodGroupData.A.Whole_Positive}</Badge>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="small">Whole -:</span>
                                  <Badge bg="danger">{bloodGroupData.A.Whole_Negative}</Badge>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="small">PRC +:</span>
                                  <Badge bg="success">{bloodGroupData.A.PRC_Positive}</Badge>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="small">PRC -:</span>
                                  <Badge bg="danger">{bloodGroupData.A.PRC_Negative}</Badge>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="small">LPRC +:</span>
                                  <Badge bg="success">{bloodGroupData.A.LPRC_Positive}</Badge>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <span className="small">LPRC -:</span>
                                  <Badge bg="danger">{bloodGroupData.A.LPRC_Negative}</Badge>
                                </div>
                                <hr className="my-2" />
                                <div className="text-center">
                                  <strong className="small">รวม: </strong>
                                  <Badge bg="danger">{getTotalCount(bloodGroupData.A)} ถุง</Badge>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>

                          {/* Group B */}
                          <Col md={6}>
                            <Card className="h-100 border-primary">
                              <Card.Header className="bg-primary text-white text-center py-2">
                                <h6 className="mb-0">กรุ๊ป B</h6>
                              </Card.Header>
                              <Card.Body className="p-3">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="small">Whole +:</span>
                                  <Badge bg="success">{bloodGroupData.B.Whole_Positive}</Badge>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="small">Whole -:</span>
                                  <Badge bg="danger">{bloodGroupData.B.Whole_Negative}</Badge>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="small">PRC +:</span>
                                  <Badge bg="success">{bloodGroupData.B.PRC_Positive}</Badge>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="small">PRC -:</span>
                                  <Badge bg="danger">{bloodGroupData.B.PRC_Negative}</Badge>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="small">LPRC +:</span>
                                  <Badge bg="success">{bloodGroupData.B.LPRC_Positive}</Badge>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <span className="small">LPRC -:</span>
                                  <Badge bg="danger">{bloodGroupData.B.LPRC_Negative}</Badge>
                                </div>
                                <hr className="my-2" />
                                <div className="text-center">
                                  <strong className="small">รวม: </strong>
                                  <Badge bg="primary">{getTotalCount(bloodGroupData.B)} ถุง</Badge>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        </Row>

                        {/* Blood Groups Row 2 - AB & O */}
                        <Row className="g-3 mb-3">
                          {/* Group AB */}
                          <Col md={6}>
                            <Card className="h-100 border-success">
                              <Card.Header className="bg-success text-white text-center py-2">
                                <h6 className="mb-0">กรุ๊ป AB</h6>
                              </Card.Header>
                              <Card.Body className="p-3">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="small">Whole +:</span>
                                  <Badge bg="success">{bloodGroupData.AB.Whole_Positive}</Badge>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="small">Whole -:</span>
                                  <Badge bg="danger">{bloodGroupData.AB.Whole_Negative}</Badge>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="small">PRC +:</span>
                                  <Badge bg="success">{bloodGroupData.AB.PRC_Positive}</Badge>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="small">PRC -:</span>
                                  <Badge bg="danger">{bloodGroupData.AB.PRC_Negative}</Badge>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="small">LPRC +:</span>
                                  <Badge bg="success">{bloodGroupData.AB.LPRC_Positive}</Badge>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <span className="small">LPRC -:</span>
                                  <Badge bg="danger">{bloodGroupData.AB.LPRC_Negative}</Badge>
                                </div>
                                <hr className="my-2" />
                                <div className="text-center">
                                  <strong className="small">รวม: </strong>
                                  <Badge bg="success">{getTotalCount(bloodGroupData.AB)} ถุง</Badge>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>

                          {/* Group O */}
                          <Col md={6}>
                            <Card className="h-100 border-warning">
                              <Card.Header className="bg-warning text-dark text-center py-2">
                                <h6 className="mb-0">กรุ๊ป O</h6>
                              </Card.Header>
                              <Card.Body className="p-3">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="small">Whole +:</span>
                                  <Badge bg="success">{bloodGroupData.O.Whole_Positive}</Badge>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="small">Whole -:</span>
                                  <Badge bg="danger">{bloodGroupData.O.Whole_Negative}</Badge>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="small">PRC +:</span>
                                  <Badge bg="success">{bloodGroupData.O.PRC_Positive}</Badge>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="small">PRC -:</span>
                                  <Badge bg="danger">{bloodGroupData.O.PRC_Negative}</Badge>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="small">LPRC +:</span>
                                  <Badge bg="success">{bloodGroupData.O.LPRC_Positive}</Badge>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <span className="small">LPRC -:</span>
                                  <Badge bg="danger">{bloodGroupData.O.LPRC_Negative}</Badge>
                                </div>
                                <hr className="my-2" />
                                <div className="text-center">
                                  <strong className="small">รวม: </strong>
                                  <Badge bg="warning" className="text-dark">{getTotalCount(bloodGroupData.O)} ถุง</Badge>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        </Row>
                      </>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              {/* Status Summary Card - 3 columns */}
              <Col lg={3}>
                <div className="d-flex flex-column gap-3">
                  {/* ใกล้หมดอายุ */}
                  <Card className="border-warning">
                    <Card.Header className="bg-warning text-dark">
                      <h6 className="mb-0 text-center">⚠️ ใกล้หมดอายุ</h6>
                    </Card.Header>
                    <Card.Body className="text-center p-3">
                      <div className="display-6 text-warning mb-2">-</div>
                      <p className="mb-0 small text-muted">ถุงเลือดที่ใกล้หมดอายุ<br />(ภายใน 7 วัน)</p>
                    </Card.Body>
                  </Card>

                  {/* จองแล้ว */}
                  <Card className="border-info">
                    <Card.Header className="bg-info text-white">
                      <h6 className="mb-0 text-center">📋 จองแล้ว</h6>
                    </Card.Header>
                    <Card.Body className="text-center p-3">
                      <div className="display-6 text-info mb-2">-</div>
                      <p className="mb-0 small text-muted">ถุงเลือดที่มีการจอง<br />รอการใช้งาน</p>
                    </Card.Body>
                  </Card>

                  {/* ใช้งานแล้ว */}
                  <Card className="border-secondary">
                    <Card.Header className="bg-secondary text-white">
                      <h6 className="mb-0 text-center">✅ ใช้งานแล้ว</h6>
                    </Card.Header>
                    <Card.Body className="text-center p-3">
                      <div className="display-6 text-secondary mb-2">-</div>
                      <p className="mb-0 small text-muted">ถุงเลือดที่ใช้งานแล้ว<br />(วันนี้)</p>
                    </Card.Body>
                  </Card>
                </div>
              </Col>
            </Row>

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

      {/* Blood Donation Guide Modal */}
      <Modal 
        show={showDonationGuide} 
        onHide={closeDonationGuide} 
        size="lg" 
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>📋 การเตรียมตัวก่อนบริจาคเลือด</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <img 
            src="/images/blood-donation.jpg" 
            alt="การเตรียมตัวก่อนบริจาคเลือด"
            className="img-fluid"
            style={{ maxHeight: '500px', width: 'auto' }}
          />
          <div className="mt-3">
            <p className="text-muted">
              คำแนะนำการเตรียมตัวก่อนบริจาคเลือดเพื่อความปลอดภัยและประสิทธิภาพสูงสุด
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeDonationGuide}>
            ปิด
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Dashboard;