import React, { useState, useEffect } from 'react';
import { Modal, Button, Table, Badge, Spinner, Alert, Row, Col, Card } from 'react-bootstrap';
import bloodReservationAPI, { BloodReservation } from '../services/bloodReservationAPI';
import { 
  BLOOD_TYPE_LABELS, 
  DEPARTMENT_LABELS,
  RESERVATION_STATUS,
  RESERVATION_STATUS_LABELS,
  type BloodType,
  type Department,
  type ReservationStatus
} from '../shared/constants/bloodConstants';

interface ReservationDetailsModalProps {
  show: boolean;
  onHide: () => void;
  reservationId: number | null;
}

interface DispensedBloodBag {
  id: number;
  blood_bag_id: number;
  bag_number: string;
  blood_type: string;
  blood_group: string;
  rh_factor: string;
  received_date: string;
  expiry_date: string;
  dispensed_by: string;
  dispensed_at: string;
  notes?: string;
}

interface ReservationWithBags extends BloodReservation {
  dispensed_blood_bags: DispensedBloodBag[];
}

const ReservationDetailsModal: React.FC<ReservationDetailsModalProps> = ({ 
  show, 
  onHide, 
  reservationId 
}) => {
  const [reservation, setReservation] = useState<ReservationWithBags | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Load reservation details
  const loadReservationDetails = async () => {
    if (!reservationId) return;

    try {
      setLoading(true);
      setError('');
      
      const response = await bloodReservationAPI.getReservationDetails(reservationId);
      
      if (response.success && response.data) {
        setReservation(response.data as ReservationWithBags);
      } else {
        setError(response.error || 'ไม่สามารถโหลดข้อมูลได้');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  // Load data when modal opens
  useEffect(() => {
    if (show && reservationId) {
      loadReservationDetails();
    }
  }, [show, reservationId]);

  // Clear data when modal closes
  useEffect(() => {
    if (!show) {
      setReservation(null);
      setError('');
    }
  }, [show]);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeVariant = (status: ReservationStatus) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'info';
      case 'completed': return 'success';
      case 'rejected': return 'danger';
      case 'cancelled': return 'secondary';
      default: return 'secondary';
    }
  };

  const getExpiryBadgeVariant = (expiryDate: string) => {
    const days = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'danger';
    if (days <= 7) return 'warning';
    if (days <= 14) return 'info';
    return 'success';
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const days = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return `หมดอายุแล้ว ${Math.abs(days)} วัน`;
    return `เหลือ ${days} วัน`;
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-file-medical me-2"></i>
          รายละเอียดการจอง
          {reservation && ` #${reservation.id}`}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
            <div className="mt-2">กำลังโหลดข้อมูล...</div>
          </div>
        ) : error ? (
          <Alert variant="danger">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        ) : reservation ? (
          <>
            {/* Reservation Info */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">
                  <i className="fas fa-info-circle me-2"></i>
                  ข้อมูลการจอง
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <p><strong>รหัสการจอง:</strong> #{reservation.id}</p>
                    <p><strong>ผู้ป่วย:</strong> {reservation.patient_name}</p>
                    <p><strong>หน่วยงาน:</strong> {DEPARTMENT_LABELS[reservation.department as Department]}</p>
                    <p><strong>ผู้จอง:</strong> {reservation.reserved_by || 'ไม่มีข้อมูล'}</p>
                    <p><strong>วันที่จอง:</strong> {formatDateTime(reservation.reservation_date)}</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>หมู่เลือด:</strong> {reservation.blood_group} {reservation.rh_factor === 'Positive' ? 'RH+' : 'RH-'}</p>
                    <p><strong>ชนิดเลือด:</strong> {BLOOD_TYPE_LABELS[reservation.blood_type as BloodType] || reservation.blood_type}</p>
                    <p><strong>จำนวน:</strong> {reservation.quantity} ถุง</p>
                    <p><strong>สถานะ:</strong> {' '}
                      <Badge bg={getStatusBadgeVariant(reservation.status as ReservationStatus)}>
                        {RESERVATION_STATUS_LABELS[reservation.status as ReservationStatus] || reservation.status}
                      </Badge>
                    </p>
                    
                    {/* ข้อมูลผู้ดำเนินการตามสถานะ */}
                    {reservation.status === RESERVATION_STATUS.COMPLETED && reservation.completed_by_username && (
                      <>
                        <p><strong>ผู้จ่ายเลือด:</strong> {reservation.completed_by_username}</p>
                        <p><strong>วันที่จ่าย:</strong> {formatDateTime(reservation.completed_at!)}</p>
                      </>
                    )}
                    {reservation.status === RESERVATION_STATUS.CANCELLED && reservation.cancelled_by_username && (
                      <>
                        <p><strong>ผู้ยกเลิก:</strong> {reservation.cancelled_by_username}</p>
                        <p><strong>วันที่ยกเลิก:</strong> {formatDateTime(reservation.cancelled_at!)}</p>
                      </>
                    )}
                    {reservation.status === RESERVATION_STATUS.CANCELLED_BY_DISPENSER && reservation.cancelled_by_username && (
                      <>
                        <p><strong>ผู้ยกเลิก (โดยผู้จ่าย):</strong> {reservation.cancelled_by_username}</p>
                        <p><strong>วันที่ยกเลิก:</strong> {formatDateTime(reservation.cancelled_at!)}</p>
                      </>
                    )}
                    {reservation.status === RESERVATION_STATUS.APPROVED && reservation.approved_by_username && (
                      <>
                        <p><strong>ผู้อนุมัติ:</strong> {reservation.approved_by_username}</p>
                        <p><strong>วันที่อนุมัติ:</strong> {formatDateTime(reservation.approved_at!)}</p>
                      </>
                    )}
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* หมายเหตุการจอง - Card แยกต่างหาก */}
            {reservation.notes && (
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">
                    <i className="fas fa-sticky-note me-2"></i>
                    หมายเหตุการจอง
                  </h5>
                </Card.Header>
                <Card.Body>
                  <p className="mb-0">
                    {reservation.notes}
                  </p>
                </Card.Body>
              </Card>
            )}

            {/* หมายเหตุการยกเลิก - Card แยกต่างหาก */}
            {(reservation.status === RESERVATION_STATUS.CANCELLED || reservation.status === RESERVATION_STATUS.CANCELLED_BY_DISPENSER) && reservation.cancellation_notes && (
              <Card className="mb-4 border-warning">
                <Card.Header className="bg-warning bg-opacity-10">
                  <h5 className="mb-0">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    หมายเหตุการยกเลิก
                  </h5>
                </Card.Header>
                <Card.Body>
                  <p className="mb-0">
                    {reservation.cancellation_notes}
                  </p>
                </Card.Body>
              </Card>
            )}

            {/* Dispensed Blood Bags - แสดงเฉพาะเมื่อสถานะเป็น completed */}
            {reservation.status === RESERVATION_STATUS.COMPLETED && (
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">
                    <i className="fas fa-tint me-2"></i>
                    ถุงเลือดที่จ่าย
                  </h5>
                </Card.Header>
                <Card.Body>
                  {reservation.dispensed_blood_bags.length === 0 ? (
                    <Alert variant="warning">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      ไม่พบข้อมูลถุงเลือดที่จ่าย
                    </Alert>
                  ) : (
                    <div className="table-responsive">
                      <Table striped bordered hover>
                        <thead className="bg-light">
                          <tr>
                            <th>หมายเลขถุง</th>
                            <th>ชนิดเลือด</th>
                            <th>วันที่รับ</th>
                            <th>วันหมดอายุ</th>
                            <th>ผู้จ่าย</th>
                            <th>วันที่จ่าย</th>
                            <th>หมายเหตุ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reservation.dispensed_blood_bags.map((bloodBag, index) => (
                            <tr key={bloodBag.id}>
                              <td>
                                <strong>{bloodBag.bag_number}</strong>
                              </td>
                              <td>
                                {bloodBag.blood_group} {bloodBag.rh_factor === 'Positive' ? 'RH+' : 'RH-'} ({bloodBag.blood_type})
                              </td>
                              <td>{formatDateTime(bloodBag.received_date)}</td>
                              <td>
                                <Badge bg={getExpiryBadgeVariant(bloodBag.expiry_date)}>
                                  {formatDateTime(bloodBag.expiry_date)}
                                  <br />
                                  <small>({getDaysUntilExpiry(bloodBag.expiry_date)})</small>
                                </Badge>
                              </td>
                              <td>{bloodBag.dispensed_by}</td>
                              <td>{formatDateTime(bloodBag.dispensed_at)}</td>
                              <td>
                                {bloodBag.notes ? (
                                  <div className="p-2 bg-light border-start border-3 border-info">
                                    <small className="text-dark fw-medium">
                                      <i className="fas fa-comment-alt me-1 text-info"></i>
                                      {bloodBag.notes}
                                    </small>
                                  </div>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}
          </>
        ) : null}
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          <i className="fas fa-times me-2"></i>
          ปิด
        </Button>
        {reservation && reservation.status === 'pending' && (
          <Button 
            variant="success" 
            onClick={() => {
              // Navigate to dispense page
              window.location.href = `/blood-dispense/${reservation.id}`;
            }}
          >
            <i className="fas fa-hand-holding-medical me-2"></i>
            จ่ายเลือด
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ReservationDetailsModal;