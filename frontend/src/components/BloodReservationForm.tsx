import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import bloodInventoryAPI, { BloodGroupStats } from '../services/bloodInventoryAPI';
import bloodReservationAPI, { CreateReservationData } from '../services/bloodReservationAPI';
import { 
  BLOOD_TYPES, 
  BLOOD_TYPE_LABELS, 
  BLOOD_GROUPS, 
  DEPARTMENTS, 
  DEPARTMENT_LABELS,
  type BloodType,
  type BloodGroup,
  type Department
} from '../shared/constants/bloodConstants';

interface ReservationForm {
  bloodGroup: BloodGroup | '';
  bloodType: BloodType | '';
  rhFactor: 'Positive' | 'Negative' | '';
  quantity: number;
  patientName: string;
  department: Department | '';
  notes: string;
}

interface BloodGroupData {
  A: BloodGroupStats['A'];
  B: BloodGroupStats['B'];
  AB: BloodGroupStats['AB'];
  O: BloodGroupStats['O'];
}

const BloodReservationForm: React.FC = () => {
  const navigate = useNavigate();
  const [bloodGroupData, setBloodGroupData] = useState<BloodGroupData | null>(null);
  const [pendingReservations, setPendingReservations] = useState<BloodGroupData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  const [formData, setFormData] = useState<ReservationForm>({
    bloodGroup: '',
    bloodType: '',
    rhFactor: '',
    quantity: 1,
    patientName: '',
    department: '',
    notes: ''
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [availabilityCheck, setAvailabilityCheck] = useState<{
    checking: boolean;
    available: boolean;
    availableCount: number;
    totalCount: number;
    pendingCount: number;
    actualAvailable: number;
    requiredQuantity: number;
    reservedUnits: number;
  } | null>(null);

  const getTotalCount = (group: BloodGroupStats['A'] | BloodGroupStats['B'] | BloodGroupStats['AB'] | BloodGroupStats['O']) => {
    return group.Whole_Positive + group.Whole_Negative + 
           group.PRC_Positive + group.PRC_Negative + 
           group.LPRC_Positive + group.LPRC_Negative;
  };

  const getPendingCount = (bloodGroup: keyof BloodGroupData, bloodType: string, rhFactor: string) => {
    console.log(`🔍 getPendingCount called with:`, { bloodGroup, bloodType, rhFactor });
    console.log(`📋 pendingReservations state:`, pendingReservations);
    
    if (!pendingReservations) {
      console.log('❌ No pending reservations data available');
      return 0;
    }
    
    // Handle blood type mapping correctly
    let type = bloodType;
    if (bloodType === 'Whole_Blood' || bloodType === 'Whole blood') {
      type = 'Whole_Blood';
    } else {
      type = bloodType.replace(' ', '_');
    }
    
    console.log(`🔄 Mapped bloodType "${bloodType}" to "${type}"`);
    
    const key = `${type}_${rhFactor}` as keyof BloodGroupData['A'];
    console.log(`🔑 Looking for key: "${key}" in group "${bloodGroup}"`);
    console.log(`📊 Group data:`, pendingReservations[bloodGroup]);
    
    const count = (pendingReservations[bloodGroup] as any)[key] || 0;
    
    console.log(`📊 Getting pending count for ${bloodGroup} ${type} ${rhFactor}: ${count}`);
    
    return count;
  };

  const getAvailableCount = (bloodGroup: BloodGroup, bloodType: BloodType, rhFactor?: 'Positive' | 'Negative') => {
    if (!bloodGroupData) return 0;
    const groupData = bloodGroupData[bloodGroup as keyof BloodGroupData];
    
    if (rhFactor) {
      // Get specific RH Factor count
      switch (bloodType) {
        case BLOOD_TYPES.WHOLE_BLOOD:
          return rhFactor === 'Positive' ? groupData.Whole_Positive : groupData.Whole_Negative;
        case BLOOD_TYPES.PRC:
          return rhFactor === 'Positive' ? groupData.PRC_Positive : groupData.PRC_Negative;
        case BLOOD_TYPES.LPRC:
          return rhFactor === 'Positive' ? groupData.LPRC_Positive : groupData.LPRC_Negative;
        default:
          return 0;
      }
    } else {
      // Get total count (both RH+ and RH-)
      switch (bloodType) {
        case BLOOD_TYPES.WHOLE_BLOOD:
          return groupData.Whole_Positive + groupData.Whole_Negative;
        case BLOOD_TYPES.PRC:
          return groupData.PRC_Positive + groupData.PRC_Negative;
        case BLOOD_TYPES.LPRC:
          return groupData.LPRC_Positive + groupData.LPRC_Negative;
        default:
          return 0;
      }
    }
  };

  const getActualAvailableCount = useCallback((bloodGroup: BloodGroup, bloodType: BloodType, rhFactor: 'Positive' | 'Negative') => {
    const totalInStock = getAvailableCount(bloodGroup, bloodType, rhFactor);
    const pendingCount = getPendingCount(bloodGroup, bloodType.replace(' ', '_'), rhFactor);
    const availableAfterPending = Math.max(0, totalInStock - pendingCount);
    
    // Special rule for blood group O: reserve 2 units for emergency
    return bloodGroup === BLOOD_GROUPS.O ? Math.max(0, availableAfterPending - 2) : availableAfterPending;
  }, [bloodGroupData, pendingReservations]);

  const getMaxQuantity = useCallback((bloodGroup: BloodGroup, bloodType: BloodType, rhFactor?: 'Positive' | 'Negative') => {
    if (rhFactor) {
      // Calculate based on specific RH Factor
      // getActualAvailableCount already handles emergency reserve for O blood group
      const actualAvailable = getActualAvailableCount(bloodGroup, bloodType, rhFactor);
      return actualAvailable;
    } else {
      // Calculate based on total (for display purposes only)
      const available = getAvailableCount(bloodGroup, bloodType);
      return bloodGroup === BLOOD_GROUPS.O ? Math.max(0, available - 2) : available;
    }
  }, [getActualAvailableCount, getAvailableCount, bloodGroupData]);

  const loadBloodGroupStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await bloodInventoryAPI.getBloodGroupStats();
      setBloodGroupData(response.data);
    } catch (error) {
      console.error('Error loading blood group stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Helper function to transform pending reservations data to BloodGroupData format
  const transformPendingReservationsData = useCallback((data: { blood_type: string; blood_group: string; rh_factor: string; quantity: number }[]): BloodGroupData => {
    console.log('🔄 Transforming pending reservations data:', data);
    
    const result: BloodGroupData = {
      A: { Whole_Positive: 0, Whole_Negative: 0, PRC_Positive: 0, PRC_Negative: 0, LPRC_Positive: 0, LPRC_Negative: 0 },
      B: { Whole_Positive: 0, Whole_Negative: 0, PRC_Positive: 0, PRC_Negative: 0, LPRC_Positive: 0, LPRC_Negative: 0 },
      AB: { Whole_Positive: 0, Whole_Negative: 0, PRC_Positive: 0, PRC_Negative: 0, LPRC_Positive: 0, LPRC_Negative: 0 },
      O: { Whole_Positive: 0, Whole_Negative: 0, PRC_Positive: 0, PRC_Negative: 0, LPRC_Positive: 0, LPRC_Negative: 0 }
    };

    data.forEach((item, index) => {
      console.log(`📝 Processing item ${index + 1}:`, item);
      
      const group = item.blood_group as keyof BloodGroupData;
      let type = item.blood_type;
      
      // Handle blood type mapping correctly
      if (type === 'Whole blood') {
        type = 'Whole_Blood';
        console.log(`🔄 Mapped "Whole blood" to "Whole_Blood"`);
      } else if (type === 'Whole_blood') {
        type = 'Whole_Blood';  
        console.log(`🔄 Mapped "Whole_blood" to "Whole_Blood"`);
      } else {
        type = type.replace(' ', '_');
        console.log(`🔄 Mapped "${item.blood_type}" to "${type}"`);
      }
      
      const rhFactor = item.rh_factor;
      const key = `${type}_${rhFactor}` as keyof BloodGroupData['A'];
      
      console.log(`🔑 Key for ${group}: "${key}", quantity: ${item.quantity}`);
      
      if (result[group] && key in result[group]) {
        (result[group] as any)[key] += item.quantity;
        console.log(`✅ Added ${item.quantity} to ${group}.${key}, new total: ${(result[group] as any)[key]}`);
      } else {
        console.log(`❌ Key "${key}" not found in group "${group}" or group doesn't exist`);
      }
    });

    console.log('📊 Final transformed data:', result);
    return result;
  }, []);

  const loadPendingReservations = useCallback(async () => {
    try {
      console.log('🔄 Loading pending reservations...');
      const response = await bloodReservationAPI.getPendingReservationsSummary();
      console.log('📊 Pending reservations raw response:', response);
      
      if (response.success && response.data) {
        const transformedData = transformPendingReservationsData(response.data);
        console.log('🔄 Transformed pending reservations data:', transformedData);
        setPendingReservations(transformedData);
      } else {
        console.log('⚠️ No pending reservations data or failed response');
      }
    } catch (error) {
      console.error('❌ Error loading pending reservations:', error);
    }
  }, [transformPendingReservationsData]);

  // Check availability when blood type, group, rh factor, or quantity changes
  const checkAvailability = useCallback(async () => {
    const { bloodType, bloodGroup, rhFactor, quantity } = formData;
    
    if (!bloodType || !bloodGroup || !rhFactor || !quantity) {
      setAvailabilityCheck(null);
      return;
    }

    setAvailabilityCheck(prev => ({ ...prev, checking: true } as any));

    try {
      const response = await bloodReservationAPI.checkAvailability({
        blood_type: bloodType as BloodType,
        blood_group: bloodGroup as BloodGroup,
        rh_factor: rhFactor as 'Positive' | 'Negative',
        quantity
      });

      if (response.success && response.data) {
        setAvailabilityCheck({
          checking: false,
          available: response.data.available,
          availableCount: response.data.availableCount,
          totalCount: response.data.totalCount,
          pendingCount: response.data.pendingCount,
          actualAvailable: response.data.actualAvailable,
          requiredQuantity: response.data.requiredQuantity,
          reservedUnits: response.data.reservedUnits
        });
      } else {
        setAvailabilityCheck(null);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailabilityCheck(null);
    }
  }, [formData]);

  // Check availability when relevant form fields change
  useEffect(() => {
    const timer = setTimeout(() => {
      checkAvailability();
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [formData.bloodType, formData.bloodGroup, formData.rhFactor, formData.quantity]);

  const handleInputChange = (field: keyof ReservationForm, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    if (successMessage) {
      setSuccessMessage('');
    }

    if (field === 'bloodGroup' || field === 'bloodType' || field === 'rhFactor') {
      setFormData(prev => ({ ...prev, quantity: 1 }));
    }
  };

  const validateForm = useCallback((): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.bloodGroup) newErrors.bloodGroup = 'กรุณาเลือกหมู่เลือด';
    if (!formData.bloodType) newErrors.bloodType = 'กรุณาเลือกชนิดเลือด';
    if (!formData.rhFactor) newErrors.rhFactor = 'กรุณาเลือก RH Factor';
    if (!formData.patientName.trim()) newErrors.patientName = 'กรุณากรอกชื่อผู้ป่วย';
    if (!formData.department) newErrors.department = 'กรุณาเลือกหน่วยงาน';
    
    if (formData.quantity < 1) {
      newErrors.quantity = 'จำนวนต้องมากกว่า 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    // ตรวจสอบ availability ก่อน submit
    if (availabilityCheck && !availabilityCheck.available) {
      setErrors({
        submit: `เลือดไม่เพียงพอ! ต้องการ ${availabilityCheck.requiredQuantity} ถุง แต่ใช้ได้เพียง ${availabilityCheck.availableCount} ถุง`
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const reservationData: CreateReservationData = {
        blood_group: formData.bloodGroup as BloodGroup,
        blood_type: formData.bloodType as BloodType,
        rh_factor: formData.rhFactor as 'Positive' | 'Negative',
        quantity: formData.quantity,
        patient_name: formData.patientName,
        department: formData.department as Department,
        notes: formData.notes
      };

      const response = await bloodReservationAPI.createReservation(reservationData);
      
      if (response.success) {
        setSuccessMessage('จองเลือดสำเร็จ! กำลังนำทางไปยังหน้ารายการจอง...');
        setErrors({});
        
        // Reset form
        setFormData({
          bloodGroup: '',
          bloodType: '',
          rhFactor: '',
          quantity: 1,
          patientName: '',
          department: '',
          notes: ''
        });
        
        // Reload blood group stats and pending reservations
        await Promise.all([loadBloodGroupStats(), loadPendingReservations()]);
        
        // Navigate back to list after 2 seconds
        setTimeout(() => {
          navigate('/blood-reservation-list');
        }, 2000);
      } else {
        throw new Error(response.error || 'เกิดข้อผิดพลาดในการจองเลือด');
      }
      
    } catch (error: any) {
      console.error('Error submitting reservation:', error);
      
      // Handle specific error types
      let errorMessage = 'เกิดข้อผิดพลาดในการจองเลือด';
      
      if (error.response?.data?.error === 'INSUFFICIENT_BLOOD_INVENTORY') {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setErrors({
        submit: errorMessage
      });
    } finally {
      setSubmitting(false);
    }
  }, [formData, validateForm, availabilityCheck, loadBloodGroupStats, loadPendingReservations, navigate]);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadBloodGroupStats(), loadPendingReservations()]);
    };
    loadData();
  }, [loadBloodGroupStats, loadPendingReservations]);

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0"><i className="fas fa-hospital me-2"></i>ระบบจองเลือด</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                {/* ขั้นตอนที่ 1: เลือกรายละเอียดเลือด */}
                <div className="mb-4">
                  <h6 className="mb-3 text-primary"><i className="fas fa-tint me-2"></i>ขั้นตอนที่ 1: เลือกประเภทเลือดที่ต้องการ</h6>
                  
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>หมู่เลือด <span className="text-danger">*</span></Form.Label>
                        <Form.Select
                          value={formData.bloodGroup}
                          onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                          isInvalid={!!errors.bloodGroup}
                        >
                          <option value="">เลือกหมู่เลือด</option>
                          <option value={BLOOD_GROUPS.A}>A</option>
                          <option value={BLOOD_GROUPS.B}>B</option>
                          <option value={BLOOD_GROUPS.AB}>AB</option>
                          <option value={BLOOD_GROUPS.O}>O</option>
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {errors.bloodGroup}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>ชนิดเลือด <span className="text-danger">*</span></Form.Label>
                        <Form.Select
                          value={formData.bloodType}
                          onChange={(e) => handleInputChange('bloodType', e.target.value)}
                          isInvalid={!!errors.bloodType}
                          disabled={!formData.bloodGroup}
                        >
                          <option value="">เลือกชนิดเลือด</option>
                          <option value={BLOOD_TYPES.WHOLE_BLOOD}>Whole blood</option>
                          <option value={BLOOD_TYPES.PRC}>PRC</option>
                          <option value={BLOOD_TYPES.LPRC}>LPRC</option>
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {errors.bloodType}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>RH Factor <span className="text-danger">*</span></Form.Label>
                        <Form.Select
                          value={formData.rhFactor}
                          onChange={(e) => handleInputChange('rhFactor', e.target.value)}
                          isInvalid={!!errors.rhFactor}
                          disabled={!formData.bloodType}
                        >
                          <option value="">เลือก RH Factor</option>
                          <option value="Positive">RH+ (Positive)</option>
                          <option value="Negative">RH- (Negative)</option>
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {errors.rhFactor}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                {/* ขั้นตอนที่ 2: แสดงสถานะเลือด */}
                {formData.bloodGroup && formData.bloodType && formData.rhFactor && (
                  <div className="mb-4">
                    <h6 className="mb-3 text-success"><i className="fas fa-chart-bar me-2"></i>ขั้นตอนที่ 2: สถานะเลือดที่เลือก</h6>
                    
                    <Card className="border-info">
                      <Card.Header className="bg-light">
                        <h6 className="mb-0">
                          <Badge bg="primary" className="me-2">{formData.bloodGroup}</Badge>
                          <Badge bg="success" className="me-2">{BLOOD_TYPE_LABELS[formData.bloodType as BloodType]}</Badge>
                          <Badge bg="info">{formData.rhFactor === 'Positive' ? 'RH+' : 'RH-'}</Badge>
                        </h6>
                      </Card.Header>
                      <Card.Body>
                        {loading ? (
                          <div className="text-center">
                            <Spinner animation="border" size="sm" />
                            <span className="ms-2">กำลังโหลดข้อมูล...</span>
                          </div>
                        ) : bloodGroupData ? (
                          <div className="row g-3">
                            {(() => {
                              // ใช้ข้อมูลจาก API availability check เป็นหลัก หากไม่มีให้ fallback ไปคำนวณเอง
                              let totalInStock, pendingCount, availableForReservation, reserveCount;
                              
                              if (availabilityCheck && !availabilityCheck.checking) {
                                // ใช้ข้อมูลจาก API
                                totalInStock = availabilityCheck.totalCount;
                                pendingCount = availabilityCheck.pendingCount;
                                availableForReservation = availabilityCheck.actualAvailable;
                                reserveCount = availabilityCheck.reservedUnits;
                                
                                console.log('🎯 Using API availability data:', {
                                  totalInStock,
                                  pendingCount,
                                  availableForReservation,
                                  reserveCount,
                                  requiredQuantity: availabilityCheck.requiredQuantity
                                });
                              } else {
                                // Fallback: คำนวณเอง
                                totalInStock = getAvailableCount(formData.bloodGroup as BloodGroup, formData.bloodType as BloodType, formData.rhFactor as 'Positive' | 'Negative');
                                pendingCount = getPendingCount(formData.bloodGroup, formData.bloodType.replace(' ', '_'), formData.rhFactor);
                                reserveCount = formData.bloodGroup === BLOOD_GROUPS.O ? 2 : 0;
                                availableForReservation = Math.max(0, totalInStock - pendingCount - reserveCount);
                                
                                console.log('🔄 Using fallback calculation:', {
                                  totalInStock,
                                  pendingCount,
                                  reserveCount,
                                  availableForReservation
                                });
                              }
                              
                              console.log('🩸 Final blood status display:', {
                                bloodGroup: formData.bloodGroup,
                                bloodType: formData.bloodType,
                                rhFactor: formData.rhFactor,
                                totalInStock,
                                pendingCount,
                                reserveCount,
                                availableForReservation,
                                pendingReservationsState: !!pendingReservations
                              });
                              
                              return (
                                <>
                                  {/* มีในคลัง */}
                                  <div className="col-12 col-md-6 col-lg-3">
                                    <div className="card bg-primary text-white h-100">
                                      <div className="card-body text-center p-3">
                                        <div className="d-flex align-items-center justify-content-center mb-2">
                                          <i className="fas fa-warehouse fa-2x me-2"></i>
                                          <div>
                                            <h3 className="mb-0 fw-bold">{totalInStock}</h3>
                                            <small className="opacity-75">ถุง</small>
                                          </div>
                                        </div>
                                        <div className="fw-bold">มีในคลัง</div>
                                        <small className="opacity-75">จำนวนทั้งหมดในสต็อก</small>
                                      </div>
                                    </div>
                                  </div>

                                  {/* จองรอจ่าย */}
                                  <div className="col-12 col-md-6 col-lg-3">
                                    <div className="card bg-warning text-dark h-100">
                                      <div className="card-body text-center p-3">
                                        <div className="d-flex align-items-center justify-content-center mb-2">
                                          <i className="fas fa-clock fa-2x me-2"></i>
                                          <div>
                                            <h3 className="mb-0 fw-bold">{pendingCount}</h3>
                                            <small className="opacity-75">ถุง</small>
                                          </div>
                                        </div>
                                        <div className="fw-bold">จองรอจ่าย</div>
                                        <small className="opacity-75">รอการอนุมัติและจ่าย</small>
                                      </div>
                                    </div>
                                  </div>

                                  {/* ต้องสำรอง (แสดงเฉพาะเมื่อมีการสำรอง) */}
                                  {reserveCount > 0 && (
                                    <div className="col-12 col-md-6 col-lg-3">
                                      <div className="card bg-danger text-white h-100">
                                        <div className="card-body text-center p-3">
                                          <div className="d-flex align-items-center justify-content-center mb-2">
                                            <i className="fas fa-shield-alt fa-2x me-2"></i>
                                            <div>
                                              <h3 className="mb-0 fw-bold">{reserveCount}</h3>
                                              <small className="opacity-75">ถุง</small>
                                            </div>
                                          </div>
                                          <div className="fw-bold">ต้องสำรอง</div>
                                          <small className="opacity-75">
                                            {formData.bloodGroup === BLOOD_GROUPS.O ? 'สำหรับเหตุฉุกเฉิน' : 'จำเป็นต้องสำรอง'}
                                          </small>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* สามารถจองได้ */}
                                  <div className="col-12 col-md-6 col-lg-3">
                                    {(() => {
                                      // สำหรับหมู่เลือด O ใช้ข้อมูลจาก API availability check
                                      let canReserve = availableForReservation > 0;
                                      let displayCount = availableForReservation;
                                      let statusText = canReserve ? 'พร้อมจองได้ทันที' : 'ไม่สามารถจองได้';
                                      
                                      // ถ้ามี API response และเป็นหมู่เลือด O
                                      if (availabilityCheck && !availabilityCheck.checking && formData.bloodGroup === BLOOD_GROUPS.O) {
                                        canReserve = availabilityCheck.available;
                                        // แสดงจำนวนที่สามารถจองได้จริง (หลังหักสำรอง)
                                        displayCount = Math.max(0, availabilityCheck.totalCount - availabilityCheck.pendingCount - availabilityCheck.reservedUnits);
                                        
                                        if (!canReserve && availabilityCheck.actualAvailable > 0) {
                                          statusText = `ต้องสำรอง ${availabilityCheck.reservedUnits} ถุง`;
                                        }
                                        
                                        console.log('🅾️ Special O blood group logic:', {
                                          available: availabilityCheck.available,
                                          actualAvailable: availabilityCheck.actualAvailable,
                                          displayCount,
                                          canReserve,
                                          statusText
                                        });
                                      }
                                      
                                      return (
                                        <div className={`card h-100 ${canReserve ? 'bg-success text-white' : 'bg-secondary text-white'}`}>
                                          <div className="card-body text-center p-3">
                                            <div className="d-flex align-items-center justify-content-center mb-2">
                                              <i className={`fas ${canReserve ? 'fa-check-circle' : 'fa-times-circle'} fa-2x me-2`}></i>
                                              <div>
                                                <h3 className="mb-0 fw-bold">{displayCount}</h3>
                                                <small className="opacity-75">ถุง</small>
                                              </div>
                                            </div>
                                            <div className="fw-bold">สามารถจองได้</div>
                                            <small className="opacity-75">{statusText}</small>
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="text-danger">
                            <i className="fas fa-exclamation-circle me-2"></i>
                            ไม่สามารถโหลดข้อมูลสถานะเลือดได้
                          </div>
                        )}

                        {/* Warning for blood group O */}
                        {formData.bloodGroup === BLOOD_GROUPS.O && (
                          <div className="alert alert-warning mt-3 mb-0 py-2">
                            <i className="fas fa-exclamation-triangle me-1"></i>
                            <small>
                              <strong>หมายเหตุ:</strong> หมู่เลือด O ต้องสำรองไว้ 2 ถุงสำหรับฉุกเฉิน
                            </small>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </div>
                )}

                {/* ขั้นตอนที่ 3: รายละเอียดการจอง */}
                {formData.bloodGroup && formData.bloodType && formData.rhFactor && (
                  <div className="mb-4">
                    <h6 className="mb-3 text-warning"><i className="fas fa-edit me-2"></i>ขั้นตอนที่ 3: รายละเอียดการจอง</h6>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>จำนวนที่ต้องการ (ถุง) <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="number"
                            min="1"
                            max={availabilityCheck ? availabilityCheck.actualAvailable : getMaxQuantity(formData.bloodGroup as BloodGroup, formData.bloodType as BloodType, formData.rhFactor as 'Positive' | 'Negative')}
                            value={formData.quantity}
                            onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                            isInvalid={!!errors.quantity}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.quantity}
                          </Form.Control.Feedback>
                          
                          {/* Availability Status */}
                          {availabilityCheck && (
                            <div className="mt-2">
                              {availabilityCheck.checking ? (
                                <div className="text-info">
                                  <i className="fas fa-spinner fa-spin me-1"></i>
                                  กำลังตรวจสอบความพร้อมใช้งาน...
                                </div>
                              ) : availabilityCheck.available ? (
                                <div className="text-success">
                                  <i className="fas fa-check-circle me-1"></i>
                                  มีเลือดเพียงพอสำหรับการจอง
                                </div>
                              ) : (
                                <div className="text-danger">
                                  <i className="fas fa-exclamation-circle me-1"></i>
                                  เลือดไม่เพียงพอ! ต้องการ {availabilityCheck.requiredQuantity} ถุง แต่ใช้ได้เพียง {availabilityCheck.availableCount} ถุง
                                </div>
                              )}
                            </div>
                          )}
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>ชื่อผู้ป่วยที่ต้องการรับเลือด <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.patientName}
                            onChange={(e) => handleInputChange('patientName', e.target.value)}
                            placeholder="กรอกชื่อผู้ป่วย"
                            isInvalid={!!errors.patientName}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.patientName}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>หน่วยงาน/แผนก <span className="text-danger">*</span></Form.Label>
                          <Form.Select
                            value={formData.department}
                            onChange={(e) => handleInputChange('department', e.target.value)}
                            isInvalid={!!errors.department}
                          >
                            <option value="">เลือกหน่วยงาน</option>
                            <option value={DEPARTMENTS.OPD}>{DEPARTMENT_LABELS[DEPARTMENTS.OPD]}</option>
                            <option value={DEPARTMENTS.IPD}>{DEPARTMENT_LABELS[DEPARTMENTS.IPD]}</option>
                            <option value={DEPARTMENTS.ER}>{DEPARTMENT_LABELS[DEPARTMENTS.ER]}</option>
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">
                            {errors.department}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>หมายเหตุ (ไม่บังคับ)</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            placeholder="หมายเหตุเพิ่มเติม..."
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                )}

                {errors.submit && (
                  <Alert variant="danger" className="mb-3">
                    {errors.submit}
                  </Alert>
                )}

                {successMessage && (
                  <Alert variant="success" className="mb-3">
                    {successMessage}
                  </Alert>
                )}
              </Form>
            </Card.Body>
            
            <Card.Footer className="d-flex justify-content-between">
              <Button variant="secondary" onClick={() => navigate('/blood-reservation-list')}>
                <i className="fas fa-arrow-left me-2"></i>กลับไปรายการจอง
              </Button>
                  
              <Button 
                type="button"
                variant="primary" 
                disabled={submitting || !formData.bloodGroup || !formData.bloodType || !formData.rhFactor}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    กำลังจอง...
                  </>
                ) : (
                  <>
                    <i className="fas fa-clipboard-check me-2"></i>ยืนยันการจอง
                  </>
                )}
              </Button>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default BloodReservationForm;