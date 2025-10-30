import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Alert, Spinner, Badge, Modal } from 'react-bootstrap';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import bloodInventoryAPI, { BloodInventoryItem } from '../services/bloodInventoryAPI';
import bloodReservationAPI, { BloodReservation } from '../services/bloodReservationAPI';
import { 
  BLOOD_TYPE_LABELS, 
  DEPARTMENT_LABELS,
  type BloodType,
  type Department
} from '../shared/constants/bloodConstants';

interface LocationState {
  reservation: BloodReservation;
}

const BloodDispensePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { reservationId } = useParams<{ reservationId: string }>();
  const location = useLocation() as { state?: LocationState };
  
  const [reservation, setReservation] = useState<BloodReservation | null>(location.state?.reservation || null);
  const [availableBlood, setAvailableBlood] = useState<BloodInventoryItem[]>([]);
  const [selectedBlood, setSelectedBlood] = useState<BloodInventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelling, setCancelling] = useState<boolean>(false);

  // Load reservation data if not passed via state
  const loadReservation = async () => {
    if (!reservationId) return;
    
    try {
      const response = await bloodReservationAPI.getReservationById(parseInt(reservationId));
      if (response.success && response.data) {
        setReservation(response.data);
      } else {
        setError('ไม่พบข้อมูลการจอง');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูลการจอง');
    }
  };

  // Load available blood based on reservation criteria
  const loadAvailableBlood = async () => {
    if (!reservation) return;

    try {
      setLoading(true);
      
      // Convert blood type format
      let bloodTypeFilter: string;
      switch (reservation.blood_type as string) {
        case 'Whole_Blood':
        case 'Whole blood':
          bloodTypeFilter = 'Whole blood';
          break;
        case 'PRC':
          bloodTypeFilter = 'PRC';
          break;
        case 'LPRC':
          bloodTypeFilter = 'LPRC';
          break;
        default:
          bloodTypeFilter = reservation.blood_type;
      }

      const response = await bloodInventoryAPI.getAll({
        blood_group: reservation.blood_group,
        blood_type: bloodTypeFilter,
        rh_factor: reservation.rh_factor,
        status: 'available',
        limit: 100
      });

      if (response.success && response.data) {
        // Sort by expiry date (earliest first)
        const sortedBlood = response.data.sort((a, b) => 
          new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
        );
        
        setAvailableBlood(sortedBlood);
        
        // Auto-select earliest expiring blood up to required quantity
        const autoSelected = sortedBlood.slice(0, reservation.quantity);
        setSelectedBlood(autoSelected);
      } else {
        setError('ไม่พบเลือดที่ตรงตามเงื่อนไข');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูลเลือด');
    } finally {
      setLoading(false);
    }
  };

  // Handle blood selection
  const handleBloodSelection = (bloodItem: BloodInventoryItem, isSelected: boolean) => {
    if (isSelected) {
      // Add to selection (if not exceeding required quantity)
      if (selectedBlood.length < (reservation?.quantity || 0)) {
        setSelectedBlood(prev => [...prev, bloodItem]);
      }
    } else {
      // Remove from selection
      setSelectedBlood(prev => prev.filter(item => item.id !== bloodItem.id));
    }
  };

  // Handle blood dispensing
  const handleDispense = async () => {
    if (!reservation || selectedBlood.length !== reservation.quantity) {
      setError(`กรุณาเลือกเลือดให้ครบ ${reservation?.quantity} ถุง`);
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // Use service to dispense blood
      const result = await bloodReservationAPI.dispenseBlood({
        reservationId: reservation.id,
        bloodBags: selectedBlood.map(item => ({ id: item.id! })),
        dispensedBy: user?.username || 'Unknown User',
        notes: `จ่ายเลือดให้ผู้ป่วย: ${reservation.patient_name} (${DEPARTMENT_LABELS[reservation.department as Department]})`
      });

      if (!result.success) {
        throw new Error(result.error || 'ไม่สามารถจ่ายเลือดได้');
      }

      setSuccessMessage('จ่ายเลือดสำเร็จ! กำลังนำทางกลับหน้ารายการ...');
      
      // Navigate back after success
      setTimeout(() => {
        navigate('/blood-reservation-list');
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการจ่ายเลือด');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel by dispenser
  const handleCancelByDispenser = async () => {
    if (!reservation || !cancelReason.trim()) {
      setError('กรุณาระบุเหตุผลในการยกเลิก');
      return;
    }

    setCancelling(true);
    setError('');

    try {
      const result = await bloodReservationAPI.cancelReservationByDispenser(reservation.id, cancelReason.trim());
      
      if (!result.success) {
        throw new Error(result.error || 'ไม่สามารถยกเลิกการจองได้');
      }

      setSuccessMessage('ยกเลิกการจองโดยผู้จ่ายสำเร็จ! กำลังนำทางกลับหน้ารายการ...');
      setShowCancelModal(false);
      
      // Navigate back after success
      setTimeout(() => {
        navigate('/blood-reservation-list');
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการยกเลิกการจอง');
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    if (!reservation && reservationId) {
      loadReservation();
    }
  }, [reservationId]);

  useEffect(() => {
    if (reservation) {
      loadAvailableBlood();
    }
  }, [reservation]);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const days = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getExpiryBadgeVariant = (expiryDate: string) => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days <= 7) return 'danger';
    if (days <= 14) return 'warning';
    return 'success';
  };

  if (!reservation) {
    return (
      <Container fluid className="py-4">
        <Row>
          <Col>
            <Alert variant="danger">
              <i className="fas fa-exclamation-triangle me-2"></i>
              ไม่พบข้อมูลการจอง
            </Alert>
            <Button onClick={() => navigate('/blood-reservation-list')}>
              กลับหน้ารายการจอง
            </Button>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <style>{`
        .blood-row {
          cursor: pointer;
          user-select: none;
          transition: all 0.2s ease-in-out;
        }
        .blood-row:hover {
          background-color: #f8f9fa !important;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .blood-row.selected {
          background-color: #e7f3ff !important;
          border-left: 4px solid #0d6efd;
        }
        .blood-row.selected:hover {
          background-color: #ddefff !important;
        }
        .blood-row.expired {
          background-color: #fff2f2 !important;
          color: #dc3545;
        }
        .blood-row.expired:hover {
          background-color: #ffe6e6 !important;
        }
      `}</style>
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2><i className="fas fa-hand-holding-medical me-2"></i>จ่ายเลือด</h2>
            <Button 
              className="btn btn-secondary" 
              onClick={() => navigate('/blood-reservation-list')}
            >
              <i className="fas fa-arrow-left me-2"></i>กลับรายการ
            </Button>
          </div>

          {error && (
            <Alert variant="danger" className="mb-4">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}

          {successMessage && (
            <Alert variant="success" className="mb-4">
              <i className="fas fa-check-circle me-2"></i>
              {successMessage}
            </Alert>
          )}

          {/* Reservation Information */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0"><i className="fas fa-info-circle me-2"></i>ข้อมูลการจอง</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <strong>รหัสการจอง:</strong> #{reservation.id}<br />
                  <strong>ผู้ป่วย:</strong> {reservation.patient_name}<br />
                  <strong>หน่วยงาน:</strong> {DEPARTMENT_LABELS[reservation.department as Department]}<br />
                  <strong>ผู้จอง:</strong> {reservation.reserved_by}
                </Col>
                <Col md={6}>
                  <strong>หมู่เลือด:</strong> {reservation.blood_group} {reservation.rh_factor === 'Positive' ? 'RH+' : 'RH-'}<br />
                  <strong>ชนิดเลือด:</strong> {BLOOD_TYPE_LABELS[reservation.blood_type as BloodType] || reservation.blood_type}<br />
                  <strong>จำนวน:</strong> {reservation.quantity} ถุง<br />
                  <strong>วันที่จอง:</strong> {formatDateTime(reservation.reservation_date)}
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Blood Selection */}
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0"><i className="fas fa-tint me-2"></i>เลือกเลือดที่จะจ่าย</h5>
              <Badge bg="info">
                เลือกแล้ว: {selectedBlood.length}/{reservation.quantity}
              </Badge>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <small className="text-muted">
                  <i className="fas fa-info-circle me-1"></i>
                  คลิกที่แถวเพื่อเลือกหรือยกเลิกการเลือกถุงเลือด (เรียงตามวันหมดอายุใกล้ที่สุดก่อน)
                </small>
              </div>
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" />
                  <div className="mt-2">กำลังโหลดข้อมูลเลือด...</div>
                </div>
              ) : availableBlood.length === 0 ? (
                <Alert variant="warning">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  ไม่พบเลือดที่ตรงตามเงื่อนไข
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead className="bg-light">
                      <tr>
                        <th>หมายเลขถุง</th>
                        <th>วันที่รับ</th>
                        <th>วันหมดอายุ</th>
                        <th>สถานะ</th>
                        <th>ผู้รับ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableBlood.map((bloodItem) => {
                        const isSelected = selectedBlood.some(item => item.id === bloodItem.id);
                        const isSelectable = !isSelected && selectedBlood.length < reservation.quantity;
                        const isExpired = new Date(bloodItem.expiry_date) < new Date();
                        
                        return (
                          <tr 
                            key={bloodItem.id} 
                            className={`blood-row ${isSelected ? 'selected' : ''} ${isExpired ? 'expired' : ''}`}
                            onClick={() => {
                              if (isSelectable || isSelected) {
                                handleBloodSelection(bloodItem, !isSelected);
                              }
                            }}
                            style={{ 
                              cursor: (isSelectable || isSelected) ? 'pointer' : 'not-allowed',
                              userSelect: 'none'
                            }}
                            title={isSelected ? 'คลิกเพื่อยกเลิกการเลือก' : isSelectable ? 'คลิกเพื่อเลือก' : 'ไม่สามารถเลือกได้ (เลือกครบแล้ว)'}
                          >
                            <td>
                              <div className="d-flex align-items-center">
                                {isSelected && <i className="fas fa-check-circle text-success me-2"></i>}
                                <strong>{bloodItem.bag_number}</strong>
                                {isSelected && <Badge bg="success" className="ms-2">เลือกแล้ว</Badge>}
                              </div>
                            </td>
                            <td>{formatDateTime(bloodItem.received_date)}</td>
                            <td>
                              <Badge bg={getExpiryBadgeVariant(bloodItem.expiry_date)}>
                                {formatDateTime(bloodItem.expiry_date)}
                                <br />
                                <small>({getDaysUntilExpiry(bloodItem.expiry_date)} วัน)</small>
                              </Badge>
                            </td>
                            <td>
                              <Badge bg="primary">พร้อมใช้</Badge>
                            </td>
                            <td>{bloodItem.received_by}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Action Buttons */}
          <Card>
            <Card.Footer className="d-flex justify-content-between">
              <Button 
                variant="secondary" 
                onClick={() => navigate('/blood-reservation-list')}
              >
                <i className="fas fa-arrow-left me-2"></i>ยกเลิก
              </Button>

              <Button 
                variant="warning" 
                onClick={() => setShowCancelModal(true)}
                disabled={submitting}
                className="me-2"
              >
                <i className="fas fa-times me-2"></i>ยกเลิกการจองโดยผู้จ่าย
              </Button>
              
              <Button 
                variant="success" 
                onClick={handleDispense}
                disabled={submitting || selectedBlood.length !== reservation.quantity}
              >
                {submitting ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    กำลังจ่าย...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check me-2"></i>
                    ยืนยันจ่ายเลือด ({selectedBlood.length}/{reservation.quantity})
                  </>
                )}
              </Button>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      {/* Cancel by Dispenser Modal */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-times text-warning me-2"></i>
            ยกเลิกการจองโดยผู้จ่าย
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <i className="fas fa-exclamation-triangle me-2"></i>
            คุณต้องการยกเลิกการจองนี้หรือไม่? การดำเนินการนี้จะไม่สามารถย้อนกลับได้
          </Alert>
          
          <div className="mb-3">
            <strong>ข้อมูลการจอง:</strong>
            <p>รหัสการจอง: #{reservation?.id}</p>
            <p>ผู้ป่วย: {reservation?.patient_name}</p>
            <p>กรุ๊ปเลือด: {reservation?.blood_group} {reservation?.rh_factor}</p>
            <p>จำนวน: {reservation?.quantity} หน่วย</p>
          </div>

          <div className="mb-3">
            <label className="form-label">
              <strong>เหตุผลในการยกเลิก <span className="text-danger">*</span></strong>
            </label>
            <textarea
              className="form-control"
              rows={4}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="กรุณาระบุเหตุผลในการยกเลิกการจอง..."
              disabled={cancelling}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowCancelModal(false)}
            disabled={cancelling}
          >
            ปิด
          </Button>
          <Button 
            variant="warning" 
            onClick={handleCancelByDispenser}
            disabled={cancelling || !cancelReason.trim()}
          >
            {cancelling ? (
              <>
                <Spinner size="sm" className="me-2" />
                กำลังยกเลิก...
              </>
            ) : (
              <>
                <i className="fas fa-times me-2"></i>
                ยืนยันยกเลิก
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default BloodDispensePage;