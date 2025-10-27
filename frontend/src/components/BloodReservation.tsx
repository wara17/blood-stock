import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Badge, Alert, Modal, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import bloodInventoryAPI, { BloodInventoryItem } from '../services/bloodInventoryAPI';

// Interface for reservation form
interface ReservationForm {
  bloodGroup: string;
  bloodType: string;
  rhFactor: string;
  quantity: number;
  patientName: string;
  department: 'OPD' | 'IPD' | 'ER' | '';
}

// Interface for available blood item with reservation limit
interface AvailableBloodItem extends BloodInventoryItem {
  maxReservable: number;
}

const BloodReservation: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ReservationForm>({
    bloodGroup: '',
    bloodType: '',
    rhFactor: '',
    quantity: 1,
    patientName: '',
    department: ''
  });
  
  const [availableBlood, setAvailableBlood] = useState<AvailableBloodItem[]>([]);
  const [filteredBlood, setFilteredBlood] = useState<AvailableBloodItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [selectedBloodItems, setSelectedBloodItems] = useState<BloodInventoryItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Blood group and type options
  const bloodGroups = ['A', 'B', 'AB', 'O'];
  const bloodTypes = ['Whole_blood', 'PRC', 'LPRC'];
  const rhFactors = ['Positive', 'Negative'];
  const departments = [
    { value: 'OPD', label: 'OPD - ผู้ป่วยนอก' },
    { value: 'IPD', label: 'IPD - ผู้ป่วยใน' },
    { value: 'ER', label: 'ER - ห้องฉุกเฉิน' }
  ];

  // Check if basic blood criteria are selected
  const isBasicSelectionComplete = () => {
    return formData.bloodGroup && formData.bloodType && formData.rhFactor;
  };

  // Load available blood inventory with filters
  const loadAvailableBlood = async (bloodGroup?: string, bloodType?: string, rhFactor?: string) => {
    try {
      setLoading(true);
      
      // Prepare filters for API
      const filters: any = {};
      if (bloodGroup) filters.blood_group = bloodGroup;
      if (bloodType) filters.blood_type = bloodType;
      if (rhFactor) filters.rh_factor = rhFactor;
      
      console.log('API filters being sent:', filters);
      
      const response = await bloodInventoryAPI.getAvailable(filters);
      
      console.log('API response received:', response);
      
      if (response.success && response.data) {
        console.log('Blood items from API:', response.data);
        console.log('Number of items:', response.data.length);
        
        if (response.data.length > 0) {
          console.log('Sample blood item structure:', response.data[0]);
        }
        
        // Calculate max reservable quantity for each item
        const bloodWithLimits = response.data.map((item: BloodInventoryItem) => {
          const maxReservable = item.blood_group === 'O' 
            ? Math.max(0, 1 - 2)
            : 1;
          
          return {
            ...item,
            maxReservable
          };
        });
        
        console.log('Processed blood data with limits:', bloodWithLimits);
        
        setAvailableBlood(bloodWithLimits);
        setFilteredBlood(bloodWithLimits);
      } else {
        console.log('No data returned or API call failed');
        setAvailableBlood([]);
        setFilteredBlood([]);
      }
    } catch (error) {
      console.error('Error loading available blood:', error);
      setAvailableBlood([]);
      setFilteredBlood([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter blood based on selected group and type
  const filterBlood = async () => {
    console.log('Filter triggered with:', { 
      bloodGroup: formData.bloodGroup, 
      bloodType: formData.bloodType,
      rhFactor: formData.rhFactor
    });
    
    // Clear selections when filter changes
    clearSelections();
    
    // Call API with current filter values
    await loadAvailableBlood(formData.bloodGroup, formData.bloodType, formData.rhFactor);
  };

  // Auto-select items when data loads or quantity changes
  const autoSelectItems = () => {
    if (filteredBlood.length === 0) return;
    
    // Auto-select up to the required quantity (if not already selected)
    const currentlySelected = Array.from(selectedItemIds);
    const availableItems = filteredBlood.filter(item => item.id && !selectedItemIds.has(item.id));
    const needToSelect = Math.max(0, formData.quantity - currentlySelected.length);
    
    if (needToSelect > 0 && availableItems.length > 0) {
      const itemsToAutoSelect = availableItems.slice(0, needToSelect);
      const newSelectedIds = new Set([...currentlySelected, ...itemsToAutoSelect.map(item => item.id!).filter(id => id !== undefined)]);
      
      setSelectedItemIds(newSelectedIds);
      const selectedItems = filteredBlood.filter(blood => blood.id && newSelectedIds.has(blood.id));
      setSelectedBloodItems(selectedItems);
    }
  };

  // Handle item selection
  const handleItemSelection = (item: AvailableBloodItem, isSelected: boolean) => {
    if (!item.id) return;
    
    const newSelectedIds = new Set(selectedItemIds);
    
    if (isSelected) {
      // Add item if we haven't reached the limit
      if (selectedItemIds.size < formData.quantity) {
        newSelectedIds.add(item.id);
      } else {
        alert(`สามารถเลือกได้สูงสุด ${formData.quantity} ถุง`);
        return;
      }
    } else {
      // Remove item
      newSelectedIds.delete(item.id);
    }
    
    setSelectedItemIds(newSelectedIds);
    
    // Update selected blood items array
    const selectedItems = filteredBlood.filter(blood => blood.id && newSelectedIds.has(blood.id));
    setSelectedBloodItems(selectedItems);
  };

  // Handle quantity change with auto-selection
  const handleQuantityChange = (newQuantity: number) => {
    handleInputChange('quantity', newQuantity);
    
    const currentSelections = Array.from(selectedItemIds);
    
    if (newQuantity > currentSelections.length) {
      // Need to select more - auto-select additional items
      setTimeout(() => autoSelectItems(), 100);
    } else if (newQuantity < currentSelections.length) {
      // Need to remove excess selections - keep first N selections
      const newSelectedIds = new Set(currentSelections.slice(0, newQuantity));
      setSelectedItemIds(newSelectedIds);
      const selectedItems = filteredBlood.filter(blood => blood.id && newSelectedIds.has(blood.id));
      setSelectedBloodItems(selectedItems);
    }
  };
  const handleInputChange = (field: keyof ReservationForm, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear related errors
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.bloodGroup) {
      newErrors.bloodGroup = 'กรุณาเลือกหมู่เลือด';
    }
    
    if (!formData.bloodType) {
      newErrors.bloodType = 'กรุณาเลือกชนิดเลือด';
    }
    
    if (formData.quantity < 1) {
      newErrors.quantity = 'จำนวนต้องมากกว่า 0';
    }
    
    if (!formData.patientName.trim()) {
      newErrors.patientName = 'กรุณากรอกชื่อผู้ป่วย';
    }
    
    if (!formData.department) {
      newErrors.department = 'กรุณาเลือกหน่วยงาน';
    }
    
    // Check if we have selected the required quantity
    if (selectedItemIds.size !== formData.quantity) {
      newErrors.quantity = `กรุณาเลือกถุงเลือด ${formData.quantity} ถุง (เลือกแล้ว ${selectedItemIds.size} ถุง)`;
    }
    
    if (!formData.rhFactor) {
      newErrors.rhFactor = 'กรุณาเลือก RH Factor';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Get total available quantity for selected blood group and type
  const getTotalAvailableQuantity = (): number => {
    return filteredBlood.length;
  };

  // Get maximum allowed quantity based on blood group rules
  const getMaxAllowedQuantity = (): number => {
    const available = getTotalAvailableQuantity();
    
    if (formData.bloodGroup === 'O') {
      return Math.max(0, available - 2);
    }
    
    return available;
  };

  // Clear selections when filters change
  const clearSelections = () => {
    setSelectedItemIds(new Set());
    setSelectedBloodItems([]);
  };

  // Handle reservation submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Use selected items instead of auto-selection
    setShowConfirmModal(true);
  };

  // Confirm reservation
  const confirmReservation = async () => {
    try {
      setSubmitting(true);
      
      // Here you would make API calls to reserve the selected blood items
      // For now, we'll simulate the reservation
      
      // TODO: Implement reservation API call
      console.log('Reserving blood items:', {
        items: selectedBloodItems,
        formData
      });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setShowConfirmModal(false);
      
      // Show success and redirect
      alert('จองเลือดสำเร็จ!');
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Error making reservation:', error);
      alert('เกิดข้อผิดพลาดในการจองเลือด');
    } finally {
      setSubmitting(false);
    }
  };

  // Format blood type display
  const formatBloodType = (type: string): string => {
    const typeMap: {[key: string]: string} = {
      'Whole_blood': 'Whole Blood',
      'PRC': 'PRC',
      'LPRC': 'LPRC'
    };
    return typeMap[type] || type;
  };

  useEffect(() => {
    // Load all available blood on initial load
    loadAvailableBlood();
  }, []);

  useEffect(() => {
    // Re-filter when blood group, type, or RH factor changes
    filterBlood();
  }, [formData.bloodGroup, formData.bloodType, formData.rhFactor]);

  useEffect(() => {
    // Auto-select items when filteredBlood data changes
    if (filteredBlood.length > 0) {
      setTimeout(() => autoSelectItems(), 100);
    }
  }, [filteredBlood, formData.quantity]);

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>🩸 ระบบจองเลือด</h2>
            <Button 
              variant="outline-secondary" 
              onClick={() => navigate('/dashboard')}
            >
              ← กลับหน้าหลัก
            </Button>
          </div>

          <Row>
            {/* Reservation Form */}
            <Col lg={12}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">📋 ข้อมูลการจองเลือด</h5>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={handleSubmit}>
                    <Row>
                      {/* Blood Group */}
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>หมู่เลือด <span className="text-danger">*</span></Form.Label>
                          <Form.Select
                            value={formData.bloodGroup}
                            onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                            isInvalid={!!errors.bloodGroup}
                          >
                            <option value="">เลือกหมู่เลือด</option>
                            {bloodGroups.map(group => (
                              <option key={group} value={group}>กรุ๊ป {group}</option>
                            ))}
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">
                            {errors.bloodGroup}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      {/* Blood Type */}
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>ชนิดเลือด <span className="text-danger">*</span></Form.Label>
                          <Form.Select
                            value={formData.bloodType}
                            onChange={(e) => handleInputChange('bloodType', e.target.value)}
                            isInvalid={!!errors.bloodType}
                          >
                            <option value="">เลือกชนิดเลือด</option>
                            {bloodTypes.map(type => (
                              <option key={type} value={type}>{formatBloodType(type)}</option>
                            ))}
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">
                            {errors.bloodType}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      {/* RH Factor */}
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>RH Factor <span className="text-danger">*</span></Form.Label>
                          <Form.Select
                            value={formData.rhFactor}
                            onChange={(e) => handleInputChange('rhFactor', e.target.value)}
                            isInvalid={!!errors.rhFactor}
                          >
                            <option value="">เลือก RH</option>
                            {rhFactors.map(rh => (
                              <option key={rh} value={rh}>{rh === 'Positive' ? 'Positive (+)' : 'Negative (-)'}</option>
                            ))}
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">
                            {errors.rhFactor}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      {/* Quantity */}
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>จำนวนที่ต้องการ (ถุง) <span className="text-danger">*</span></Form.Label>
                          <div className="d-flex align-items-center">
                            <Form.Control
                              type="number"
                              min="1"
                              max={getMaxAllowedQuantity()}
                              value={formData.quantity}
                              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                              isInvalid={!!errors.quantity}
                              disabled={!isBasicSelectionComplete()}
                            />
                          </div>
                          {!isBasicSelectionComplete() ? (
                            <small className="text-muted text-warning">
                              ⚠️ กรุณาเลือกหมู่เลือด ชนิดเลือด และ RH Factor ก่อน
                            </small>
                          ) : formData.bloodGroup && formData.bloodType ? (
                            <small className="text-muted">
                              สูงสุด {getMaxAllowedQuantity()} ถุง
                              {formData.bloodGroup === 'O' && ' (เหลือไว้ 2 ถุงในคลัง)'}
                            </small>
                          ) : null}
                          <Form.Control.Feedback type="invalid">
                            {errors.quantity}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      {/* Department */}
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>หน่วยงานที่จอง <span className="text-danger">*</span></Form.Label>
                          <Form.Select
                            value={formData.department}
                            onChange={(e) => handleInputChange('department', e.target.value)}
                            isInvalid={!!errors.department}
                            disabled={!isBasicSelectionComplete()}
                          >
                            <option value="">{isBasicSelectionComplete() ? "เลือกหน่วยงาน" : "เลือกข้อมูลเลือดก่อน"}</option>
                            {departments.map(dept => (
                              <option key={dept.value} value={dept.value}>{dept.label}</option>
                            ))}
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">
                            {errors.department}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      {/* Patient Name */}
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>ชื่อผู้ป่วยที่ต้องการรับเลือด <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.patientName}
                            onChange={(e) => handleInputChange('patientName', e.target.value)}
                            placeholder={isBasicSelectionComplete() ? "กรอกชื่อ-นามสกุล ผู้ป่วย" : "เลือกข้อมูลเลือดก่อน"}
                            isInvalid={!!errors.patientName}
                            disabled={!isBasicSelectionComplete()}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.patientName}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="d-grid">
                      {!isBasicSelectionComplete() && (
                        <Alert variant="warning" className="mb-3">
                          <strong>⚠️ กรุณาดำเนินการตามลำดับ:</strong><br />
                          1. เลือกหมู่เลือด<br />
                          2. เลือกชนิดเลือด<br />
                          3. เลือก RH Factor<br />
                          4. ระบุจำนวนที่ต้องการ<br />
                          5. กรอกข้อมูลผู้ป่วยและแผนก
                        </Alert>
                      )}
                      <Button 
                        type="submit" 
                        variant="primary" 
                        size="lg"
                        disabled={loading || !isBasicSelectionComplete() || selectedItemIds.size !== formData.quantity || !formData.patientName || !formData.department}
                      >
                        {loading ? <Spinner size="sm" /> : '📋'} ยืนยันการจองเลือด ({selectedItemIds.size}/{formData.quantity})
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            {/* Available Blood List */}
            <Col lg={12}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">
                    🏥 เลือดที่มีพร้อม 
                    {(formData.bloodGroup || formData.bloodType || formData.rhFactor) && (
                      <Badge bg="info" className="ms-2">
                        {formData.bloodGroup} {formatBloodType(formData.bloodType)} {formData.rhFactor && `(${formData.rhFactor === 'Positive' ? '+' : '-'})`}
                      </Badge>
                    )}
                  </h5>
                </Card.Header>
                <Card.Body>
                  {!isBasicSelectionComplete() ? (
                    <div className="text-center py-5">
                      <Alert variant="info">
                        <h5>🔒 กรุณาเลือกข้อมูลเลือดก่อน</h5>
                        <p className="mb-0">เลือกหมู่เลือด ชนิดเลือด และ RH Factor ให้ครบก่อน<br />จึงจะสามารถดูเลือดที่มีพร้อมได้</p>
                      </Alert>
                    </div>
                  ) : loading ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" />
                      <div className="mt-2">กำลังโหลดข้อมูล...</div>
                    </div>
                  ) : filteredBlood.length > 0 ? (
                    <>
                      <div className="mb-3">
                        <Alert variant="info">
                          <strong>จำนวนที่พร้อมใช้:</strong> {getTotalAvailableQuantity()} ถุง<br />
                          <strong>จำนวนที่ต้องการ:</strong> {formData.quantity} ถุง<br />
                          <strong>เลือกแล้ว:</strong> {selectedItemIds.size} ถุง
                          {formData.bloodGroup === 'O' && (
                            <><br /><strong>จำนวนที่สามารถจองได้:</strong> {getMaxAllowedQuantity()} ถุง (เหลือไว้ 2 ถุงในคลัง)</>
                          )}
                          <br /><small className="text-muted">💡 คลิกที่แถวเพื่อเลือกหรือยกเลิกการเลือกถุงเลือด</small>
                        </Alert>
                      </div>
                      
                      <style>
                        {`
                          .clickable-row:hover {
                            background-color: #f8f9fa !important;
                            transform: translateY(-1px);
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                            transition: all 0.2s ease;
                          }
                          .table-warning.clickable-row:hover {
                            background-color: #fff3cd !important;
                          }
                        `}
                      </style>
                      
                      <Table responsive size="sm">
                        <thead>
                          <tr>
                            <th>รหัสถุง</th>
                            <th>วันที่หมดอายุ</th>
                            <th>หมู่เลือด</th>
                            <th>ชนิดเลือด</th>
                            <th>RH</th>
                            <th>สถานะ</th>
                            <th>เลือกแล้ว</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredBlood.slice(0, 20).map((item, index) => {
                            const isSelected = item.id ? selectedItemIds.has(item.id) : false;
                            const canSelect = !isSelected && selectedItemIds.size < formData.quantity;
                            const canDeselect = isSelected;
                            
                            return (
                              <tr 
                                key={item.id} 
                                className={`${isSelected ? 'table-warning' : ''} ${(canSelect || canDeselect) ? 'clickable-row' : ''}`}
                                style={{
                                  cursor: (canSelect || canDeselect) ? 'pointer' : 'default',
                                  userSelect: 'none'
                                }}
                                onClick={() => {
                                  if (canSelect) {
                                    handleItemSelection(item, true);
                                  } else if (canDeselect) {
                                    handleItemSelection(item, false);
                                  }
                                }}
                                title={
                                  canSelect ? 'คลิกเพื่อเลือกถุงเลือดนี้' : 
                                  canDeselect ? 'คลิกเพื่อยกเลิกการเลือก' :
                                  'เลือกครบจำนวนแล้ว'
                                }
                              >
                                <td>{item.bag_number}</td>
                                <td>{new Date(item.expiry_date).toLocaleDateString('th-TH')}</td>
                                <td>
                                  <Badge bg="danger">{item.blood_group}</Badge>
                                </td>
                                <td>
                                  <Badge bg="primary">{formatBloodType(item.blood_type)}</Badge>
                                </td>
                                <td>
                                  <Badge bg={item.rh_factor === 'Positive' ? 'success' : 'secondary'}>
                                    {item.rh_factor === 'Positive' ? '+' : '-'}
                                  </Badge>
                                </td>
                                <td>
                                  <Badge bg="success">Available</Badge>
                                </td>
                                <td>
                                  {isSelected ? (
                                    <Badge bg="warning">✓ เลือกแล้ว</Badge>
                                  ) : (
                                    <Badge bg="light" text="dark">-</Badge>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                      
                      {filteredBlood.length > 20 && (
                        <small className="text-muted">และอีก {filteredBlood.length - 20} รายการ...</small>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4 text-muted">
                      {isBasicSelectionComplete() ? 
                        'ไม่พบเลือดที่ตรงตามเงื่อนไข' : 
                        'เลือกหมู่เลือด ชนิดเลือด และ RH Factor เพื่อดูข้อมูล'
                      }
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>🔍 ยืนยันการจองเลือด</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h6>ข้อมูลการจอง:</h6>
          <ul>
            <li><strong>หมู่เลือด:</strong> {formData.bloodGroup}</li>
            <li><strong>ชนิดเลือด:</strong> {formatBloodType(formData.bloodType)}</li>
            <li><strong>จำนวน:</strong> {formData.quantity} ถุง</li>
            <li><strong>ชื่อผู้ป่วย:</strong> {formData.patientName}</li>
            <li><strong>หน่วยงาน:</strong> {formData.department}</li>
          </ul>
          
          <h6 className="mt-3">ถุงเลือดที่จะจอง:</h6>
          <Table size="sm">
            <thead>
              <tr>
                <th>รหัสถุง</th>
                <th>วันที่หมดอายุ</th>
              </tr>
            </thead>
            <tbody>
              {selectedBloodItems.map(item => (
                <tr key={item.id}>
                  <td>{item.bag_number}</td>
                  <td>{new Date(item.expiry_date).toLocaleDateString('th-TH')}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            ยกเลิก
          </Button>
          <Button variant="primary" onClick={confirmReservation} disabled={submitting}>
            {submitting ? <Spinner size="sm" /> : '✅'} ยืนยันการจอง
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default BloodReservation;
