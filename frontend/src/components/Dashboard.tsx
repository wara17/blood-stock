import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import bloodInventoryAPI, { BloodGroupStats, StatusStats } from '../services/bloodInventoryAPI';
import bloodReservationAPI from '../services/bloodReservationAPI';

// Interface for blood group data (using API types)
interface BloodGroupData {
  A: BloodGroupStats['A'];
  B: BloodGroupStats['B'];
  AB: BloodGroupStats['AB'];
  O: BloodGroupStats['O'];
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bloodGroupData, setBloodGroupData] = useState<BloodGroupData | null>(null);
  const [statusStats, setStatusStats] = useState<StatusStats | null>(null);
  const [pendingReservationsCount, setPendingReservationsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [showDonationGuide, setShowDonationGuide] = useState<boolean>(false);

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
    }
  };

  // Load status statistics
  const loadStatusStats = async () => {
    try {
      const response = await bloodInventoryAPI.getStatusStats();
      
      if (response.success) {
        setStatusStats(response.data);
      }
    } catch (error) {
      console.error('Error loading status stats:', error);
      // Set default values if error
      setStatusStats({
        nearExpiry: 0,
        reserved: 0,
        usedToday: 0
      });
    }
  };

  // Load pending reservations count
  const loadPendingReservationsCount = async () => {
    try {
      const response = await bloodReservationAPI.getPendingReservationsCount();
      
      if (response.success && response.data) {
        // ใช้จำนวนรายการจอง (count) แทนจำนวนถุงเลือด (totalQuantity)
        setPendingReservationsCount(response.data.count);
        console.log('📊 Pending reservations - Count:', response.data.count, 'Total Quantity:', response.data.totalQuantity);
      }
    } catch (error) {
      console.error('Error loading pending reservations count:', error);
      setPendingReservationsCount(0);
    }
  };

  // Load all data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadBloodGroupStats(),
        loadStatusStats(),
        loadPendingReservationsCount()
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Get total count for a blood group
  const getTotalCount = (groupStats: BloodGroupStats['A']): number => {
    return Object.values(groupStats).reduce((sum, count) => sum + count, 0);
  };

  return (
    <>
      {/* Main Content */}
      <Container className="mt-4">
        <Row>
          <Col>
            <h2 className="mb-4">ยินดีต้อนรับสู่ระบบจัดการคลังเลือด</h2>
            
            {/* Welcome Card */}
            <Card className="mb-4">
              <Card.Body>
                <Card.Title><i className="fas fa-hand-wave me-2"></i>สวัสดี, {user?.username}!</Card.Title>
                <Card.Text>
                  คุณได้เข้าสู่ระบบเรียบร้อยแล้ว เวลา: {new Date().toLocaleString('th-TH')}
                </Card.Text>
                <Card.Text className="text-muted">
                  <small>
                    <i className="fas fa-envelope me-1"></i>อีเมล: {user?.email} | 
                    <i className="fas fa-calendar-plus ms-2 me-1"></i>สมาชิกตั้งแต่: {user?.created_at ? new Date(user.created_at).toLocaleDateString('th-TH') : '-'}
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
                      <div className="fs-2 text-primary me-3"><i className="fas fa-tint"></i></div>
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
                  onClick={() => navigate('/blood-reservation-list')}
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
                      <div className="fs-2 text-success me-3"><i className="fas fa-calendar-check"></i></div>
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
                  className="border-danger shadow-sm h-100" 
                  style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onClick={() => navigate('/pending-dispense')}
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
                      <div className="fs-2 text-danger me-3"><i className="fas fa-clock"></i></div>
                      <div>
                        <Card.Title className="h6 mb-1">จ่ายเลือด</Card.Title>
                        <Card.Text className="small text-muted mb-0">จัดการการจ่ายเลือด</Card.Text>
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
                      <div className="fs-2 text-info me-3"><i className="fas fa-heart"></i></div>
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
                      <i className="fas fa-tint me-2"></i>สถิติเลือดตามหมู่เลือด (เลือดพร้อมใช้งาน)
                      {loading && <i className="fas fa-spinner fa-spin ms-2"></i>}
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    {bloodGroupData && (
                      <>
                        {/* Total Summary - Inline Layout */}
                        <Row className="mb-4">
                          <Col>
                            <Card className="bg-light border-0">
                              <Card.Body className="py-3">
                                <Row className="align-items-center">
                                  <Col lg={6} className="text-center">
                                    <h5 className="text-primary mb-1">สรุปเลือดพร้อมใช้ทั้งหมด</h5>
                                    <small className="text-muted">ข้อมูล ณ วันที่ {new Date().toLocaleDateString('th-TH')}</small>
                                  </Col>
                                  <Col lg={4} className="text-center">
                                    <h1 className="text-primary mb-0 display-4">
                                      {getTotalCount(bloodGroupData.A) + 
                                       getTotalCount(bloodGroupData.B) + 
                                       getTotalCount(bloodGroupData.AB) + 
                                       getTotalCount(bloodGroupData.O)}
                                    </h1>
                                  </Col>
                                  <Col lg={2} className="text-center">
                                    <h5 className="text-primary mb-1">ถุง</h5>
                                  </Col>
                                </Row>
                              </Card.Body>
                            </Card>
                          </Col>
                        </Row>

                        {/* Blood Groups - Single Row (4 columns) */}
                        <Row className="g-3 mb-3">
                          {/* Group A */}
                          <Col lg={3} md={6}>
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
                          <Col lg={3} md={6}>
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

                          {/* Group AB */}
                          <Col lg={3} md={6}>
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
                          <Col lg={3} md={6}>
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
                  <Card className="border-danger">
                    <Card.Header className="bg-danger text-white">
                      <h6 className="mb-0 text-center"><i className="fas fa-exclamation-triangle me-2"></i>ใกล้หมดอายุ</h6>
                    </Card.Header>
                    <Card.Body className="text-center p-3">
                      <div className="display-6 text-danger mb-2">
                        {loading ? '...' : (statusStats?.nearExpiry || 0)}
                      </div>
                      <p className="mb-0 small text-muted">ถุงเลือดที่ใกล้หมดอายุ<br />(ภายใน 7 วัน)</p>
                    </Card.Body>
                  </Card>

                  {/* จองแล้ว */}
                  <Card 
                    className="border-info" 
                    style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onClick={() => navigate('/pending-dispense')}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    }}
                  >
                    <Card.Header className="bg-info text-white">
                      <h6 className="mb-0 text-center"><i className="fas fa-calendar-check me-2"></i> รอจ่าย</h6>
                    </Card.Header>
                    <Card.Body className="text-center p-3">
                      <div className="display-6 text-info mb-2">
                        {loading ? '...' : pendingReservationsCount}
                      </div>
                      <p className="mb-0 small text-muted">รายการจองที่รอจ่าย<br />(รายการ)</p>
                    </Card.Body>
                  </Card>
                </div>
              </Col>
            </Row>

            {/* Development Note */}
            <Card className="mt-4 border-secondary">
              <Card.Body>
                <Card.Title className="text-secondary"><i className="fas fa-tools me-2"></i>โหมดพัฒนา</Card.Title>
                <Card.Text>
                  ระบบนี้อยู่ในโหมดการพัฒนา ฟีเจอร์ต่างๆ จะถูกเพิ่มเข้ามาในอนาคต
                </Card.Text>
                <Card.Text className="text-muted">
                  <small>
                    <i className="fas fa-lock text-success me-1"></i>JWT Authentication: ✅ สำเร็จ<br />
                    <i className="fas fa-database text-success me-1"></i>Database: ✅ PostgreSQL พร้อมใช้งาน<br />
                    <i className="fas fa-globe text-success me-1"></i>API: ✅ Backend ทำงานได้ปกติ<br />
                    <i className="fas fa-laptop-code text-success me-1"></i>Frontend: ✅ React + Bootstrap พร้อม
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
          <Modal.Title><i className="fas fa-clipboard-list me-2"></i>การเตรียมตัวก่อนบริจาคเลือด</Modal.Title>
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
        {/* <Modal.Footer>
          <Button className="btn btn-secondary" onClick={closeDonationGuide}>
            <i className="fas fa-times me-2"></i>ปิด
          </Button>
        </Modal.Footer> */}
      </Modal>
    </>
  );
};

export default Dashboard;