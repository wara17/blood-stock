import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert, Spinner, Badge, Toast, ToastContainer } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import bloodInventoryAPI, { BloodInventoryItem, BloodInventoryFilter } from '../services/bloodInventoryAPI';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../shared/components/ConfirmModal';
import PaginationComponent from '../shared/components/PaginationComponent';

const BloodInventoryDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bloodInventory, setBloodInventory] = useState<BloodInventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<BloodInventoryItem | null>(null);
  const [statusUpdateItem, setStatusUpdateItem] = useState<BloodInventoryItem | null>(null);
  const [viewingItem, setViewingItem] = useState<BloodInventoryItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<BloodInventoryItem | null>(null);
  const [statusFormData, setStatusFormData] = useState({
    status: 'available' as 'available' | 'reserved' | 'used' | 'expired',
    reserved_for: '',
    notes: ''
  });
  const [bagNumberParts, setBagNumberParts] = useState({
    part1: '', // xxx
    part2: '', // xx
    part3: '', // x
    part4: ''  // xxxxx
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState<BloodInventoryFilter>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [receivedByFilter, setReceivedByFilter] = useState<string>('');

  // Use refs to get current state values in debounced functions
  const filtersRef = useRef({
    receivedByFilter: ''
  });

  // Update refs when state changes
  useEffect(() => {
    filtersRef.current = {
      receivedByFilter
    };
  }, [receivedByFilter]);

  // Form state
  const [formData, setFormData] = useState<Omit<BloodInventoryItem, 'id' | 'created_at' | 'updated_at'>>({
    received_date: new Date().toISOString().split('T')[0], // Default to today
    blood_type: '' as any,
    blood_group: '' as any,
    rh_factor: '' as any,
    bag_number: '',
    expiry_date: '',
    received_by: ''
  });

  // Load blood inventory data
  const loadBloodInventory = async (currentFilters: BloodInventoryFilter = {}) => {
    try {
      setLoading(true);
      setError('');
      
      const filterParams = {
        ...currentFilters,
        page: currentFilters.page || pagination.page,
        limit: currentFilters.limit || pagination.limit
      };
      
      const response = await bloodInventoryAPI.getAll(filterParams);
      
      if (response.success) {
        setBloodInventory(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
      setError(errorMessage);
      
      // If it's an auth error, don't stay on this page
      if (err.response?.status === 401) {
        console.log('Authentication failed, user should be redirected');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and set default received_by
  useEffect(() => {
    if (user?.username) {
      setFormData(prev => ({
        ...prev,
        received_by: user.username
      }));
    }
    loadBloodInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Auto-hide success message after 6 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Auto-hide error message after 8 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      let response;
      if (editingItem) {
        // For update, only send basic blood data (no status changes)
        response = await bloodInventoryAPI.update(editingItem.id!, formData);
      } else {
        response = await bloodInventoryAPI.create(formData);
      }

      if (response.success) {
        setSuccess(response.message);
        setShowModal(false);
        setEditingItem(null);
        resetForm();
        loadBloodInventory(filters);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  // Handle delete - show confirm modal
  const handleDelete = (item: BloodInventoryItem) => {
    setDeleteItem(item);
    setShowConfirmModal(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!deleteItem) return;

    try {
      const response = await bloodInventoryAPI.delete(deleteItem.id!);
      if (response.success) {
        setSuccess('ลบข้อมูลสำเร็จ');
        loadBloodInventory(filters);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการลบข้อมูล');
    } finally {
      setShowConfirmModal(false);
      setDeleteItem(null);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowConfirmModal(false);
    setDeleteItem(null);
  };

  // Handle status update
  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusUpdateItem) return;

    setError('');
    setSuccess('');

    try {
      const response = await bloodInventoryAPI.updateStatus(statusUpdateItem.id!, statusFormData);
      
      if (response.success) {
        setSuccess('อัปเดตสถานะสำเร็จ');
        setShowStatusModal(false);
        setStatusUpdateItem(null);
        resetStatusForm();
        loadBloodInventory(filters);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  // Open status modal
  const openStatusModal = (item: BloodInventoryItem) => {
    setStatusUpdateItem(item);
    setStatusFormData({
      status: item.status || 'available',
      reserved_for: item.reserved_for || '',
      notes: item.notes || ''
    });
    setShowStatusModal(true);
  };

  // Open view modal
  const openViewModal = (item: BloodInventoryItem) => {
    setViewingItem(item);
    setShowViewModal(true);
  };

  // Handle edit
  const handleEdit = (item: BloodInventoryItem) => {
    setEditingItem(item);
    
    // Convert date strings to proper format for input[type="date"]
    const formatDateForInput = (dateString: string) => {
      if (!dateString) return '';
      
      // If it's already in YYYY-MM-DD format, return as is
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString;
      }
      
      // Otherwise, create date object and format
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '';
      }
      
      // Get date in local timezone to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formatted = `${year}-${month}-${day}`;
      
      return formatted;
    };
    
    const formDataToSet = {
      received_date: formatDateForInput(item.received_date),
      blood_type: item.blood_type,
      blood_group: item.blood_group,
      rh_factor: item.rh_factor,
      bag_number: item.bag_number,
      expiry_date: formatDateForInput(item.expiry_date),
      received_by: item.received_by
    };
    
    setFormData(formDataToSet);
    parseBagNumber(item.bag_number); // Parse bag number into parts
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  // Reset form
  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    setFormData({
      received_date: today,
      blood_type: '' as any,
      blood_group: '' as any,
      rh_factor: '' as any,
      bag_number: '',
      expiry_date: '',
      received_by: user?.username || ''
    });
    setBagNumberParts({ part1: '', part2: '', part3: '', part4: '' });
  };

  // Reset status form
  const resetStatusForm = () => {
    setStatusFormData({
      status: 'available',
      reserved_for: '',
      notes: ''
    });
  };

  // Handle new blood entry
  const handleNewBlood = () => {
    setEditingItem(null);
    resetForm();
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  // Debounced search function for received_by
  const debouncedReceivedBySearch = useCallback(
    debounce((searchValue: string) => {
      setIsLoading(true);
      
      // ใช้ current values จาก ref
      const currentFilters = filtersRef.current;
      
      const newFilters = {
        ...filters,
        received_by: searchValue,
        page: 1 // Reset to first page when searching
      };

      // Remove empty filters
      Object.keys(newFilters).forEach(key => {
        if (newFilters[key as keyof BloodInventoryFilter] === '' || newFilters[key as keyof BloodInventoryFilter] === undefined) {
          delete newFilters[key as keyof BloodInventoryFilter];
        }
      });

      console.log('Received By Search - Filter params:', newFilters);

      setFilters(newFilters);
      loadBloodInventory(newFilters).finally(() => {
        setIsLoading(false);
      });
    }, 1000),
    [filters] // Include filters as dependency
  );

  // Handle received_by filter change
  const handleReceivedByFilterChange = (value: string) => {
    console.log('Received By Filter onChange:', value);
    setReceivedByFilter(value);
    
    // ยกเลิก debounce ที่กำลังรอ
    debouncedReceivedBySearch.cancel();
    
    if (value.trim() !== '') {
      // ค้นหาเมื่อพิมพ์ค่าใดๆ แล้วหยุดพิมพ์ 1 วินาที
      console.log('Calling debouncedReceivedBySearch with:', value);
      debouncedReceivedBySearch(value);
    } else {
      // ถ้าไม่มีค่า ให้โหลดข้อมูลทั้งหมด
      console.log('Clearing received_by filter, loading all data');
      setIsLoading(true);
      const newFilters = { ...filters };
      delete newFilters.received_by;
      setFilters(newFilters);
      loadBloodInventory(newFilters).finally(() => setIsLoading(false));
    }
  };

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedReceivedBySearch.cancel();
    };
  }, [debouncedReceivedBySearch]);

  // Handle filter change
  const handleFilterChange = (filterName: string, value: string) => {
    const newFilters = {
      ...filters,
      [filterName]: value || undefined,
      page: 1 // Reset to first page when filtering
    };
    
    // Remove empty filters
    Object.keys(newFilters).forEach(key => {
      if (newFilters[key as keyof BloodInventoryFilter] === '' || newFilters[key as keyof BloodInventoryFilter] === undefined) {
        delete newFilters[key as keyof BloodInventoryFilter];
      }
    });
    
    setFilters(newFilters);
    loadBloodInventory(newFilters);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    loadBloodInventory(newFilters);
  };

  // Handle bag number part change
  const handleBagNumberChange = (part: string, value: string, maxLength: number) => {
    // Only allow digits
    const numericValue = value.replace(/\D/g, '');
    
    if (numericValue.length <= maxLength) {
      const newParts = { ...bagNumberParts, [part]: numericValue };
      setBagNumberParts(newParts);
      
      // Combine parts to form complete bag number
      const completeBagNumber = `${newParts.part1}.${newParts.part2}.${newParts.part3}.${newParts.part4}`;
      setFormData({...formData, bag_number: completeBagNumber});
    }
  };

  // Parse bag number into parts (for editing)
  const parseBagNumber = (bagNumber: string) => {
    if (!bagNumber) {
      setBagNumberParts({ part1: '', part2: '', part3: '', part4: '' });
      return;
    }
    
    const parts = bagNumber.split('.');
    setBagNumberParts({
      part1: parts[0] || '',
      part2: parts[1] || '',
      part3: parts[2] || '',
      part4: parts[3] || ''
    });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid
    
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Get badge color for blood type
  const getBloodTypeBadge = (bloodType: string) => {
    switch (bloodType) {
      case 'Whole_blood': return 'primary';
      case 'PRC': return 'success';
      case 'LPRC': return 'warning';
      default: return 'secondary';
    }
  };

  // Format blood type for display
  const formatBloodType = (bloodType: string) => {
    switch (bloodType) {
      case 'Whole_blood': return 'Whole blood';
      case 'PRC': return 'PRC';
      case 'LPRC': return 'LPRC';
      default: return bloodType;
    }
  };

  // Check if blood is expiring soon (within 7 days)
  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  // Get badge color for blood status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available': return 'success';
      case 'reserved': return 'warning';
      case 'used': return 'secondary';
      case 'expired': return 'danger';
      default: return 'secondary';
    }
  };

  // Get status text in Thai
  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'พร้อมใช้งาน';
      case 'reserved': return 'จองไว้';
      case 'used': return 'ใช้แล้ว';
      case 'expired': return 'หมดอายุ';
      default: return 'ไม่ทราบสถานะ';
    }
  };

  // Get badge color for Rh factor
  const getRhFactorBadge = (rhFactor: string) => {
    switch (rhFactor) {
      case 'Positive': return 'success';
      case 'Negative': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <>
    <Container fluid className="py-4">
      <Row>
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0"><i className="fas fa-warehouse me-2"></i>ระบบคลังเลือด</h4>
              <div className="d-flex gap-2">
                <Button className="btn btn-danger" onClick={() => navigate('/pending-dispense')}>
                  <i className="fas fa-clock me-2"></i>รายการรอจ่าย
                </Button>
                <Button className="btn btn-primary" onClick={handleNewBlood}>
                  <i className="fas fa-plus me-2"></i>เพิ่มข้อมูลเลือด
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {/* Filters */}
              <Row className="mb-3">
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>สถานะ</Form.Label>
                    <Form.Select
                      value={filters.status || ''}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                      <option value="">ทั้งหมด</option>
                      <option value="available">พร้อมใช้งาน</option>
                      <option value="reserved">จองไว้</option>
                      <option value="used">ใช้แล้ว</option>
                      <option value="expired">หมดอายุ</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={1}>
                  <Form.Group>
                    <Form.Label>หมู่เลือด</Form.Label>
                    <Form.Select
                      value={filters.blood_group || ''}
                      onChange={(e) => handleFilterChange('blood_group', e.target.value)}
                    >
                      <option value="">ทั้งหมด</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="AB">AB</option>
                      <option value="O">O</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>ชนิดของเลือด</Form.Label>
                    <Form.Select
                      value={filters.blood_type || ''}
                      onChange={(e) => handleFilterChange('blood_type', e.target.value)}
                    >
                      <option value="">ทั้งหมด</option>
                      <option value="Whole_blood">Whole blood</option>
                      <option value="PRC">PRC</option>
                      <option value="LPRC">LPRC</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>ระบบ Rh</Form.Label>
                    <Form.Select
                      value={filters.rh_factor || ''}
                      onChange={(e) => handleFilterChange('rh_factor', e.target.value)}
                    >
                      <option value="">ทั้งหมด</option>
                      <option value="Positive">Positive</option>
                      <option value="Negative">Negative</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>ผู้รับ {isLoading && <span className="spinner-border spinner-border-sm ms-1" role="status" aria-hidden="true"></span>}</Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type="text"
                        placeholder="ค้นหาชื่อผู้รับ..."
                        value={receivedByFilter}
                        onChange={(e) => handleReceivedByFilterChange(e.target.value)}
                        disabled={isLoading}
                      />
                      {isLoading && (
                        <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                          <div className="spinner-border spinner-border-sm text-primary" role="status">
                            <span className="visually-hidden">กำลังค้นหา...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </Form.Group>
                </Col>
                <Col md={1} className="d-flex align-items-end">
                  <Button 
                    className="btn btn-secondary w-100" 
                    onClick={() => {
                      // Cancel any pending debounced searches
                      debouncedReceivedBySearch.cancel();
                      
                      // Reset all filters and state
                      setFilters({});
                      setReceivedByFilter('');
                      setIsLoading(true);
                      loadBloodInventory({}).finally(() => setIsLoading(false));
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        กำลังล้าง...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-eraser me-2"></i> ล้าง
                      </>
                    )}
                  </Button>
                </Col>
              </Row>

              {/* Table */}
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" />
                  <p className="mt-2">กำลังโหลดข้อมูล...</p>
                </div>
              ) : (
                <>
                  <Table responsive striped hover>
                    <thead>
                      <tr>
                        <th>สถานะ</th>
                        <th>วันที่รับ</th>
                        <th>ชนิดของเลือด</th>
                        <th>หมู่เลือด</th>
                        <th>ระบบ Rh</th>
                        <th>หมายเลขถุง</th>
                        <th>วันหมดอายุ</th>
                        <th>ผู้รับ</th>
                        <th>การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bloodInventory.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center py-4">
                            ไม่มีข้อมูลเลือด
                          </td>
                        </tr>
                      ) : (
                        bloodInventory.map((item) => (
                          <tr 
                            key={item.id} 
                            onClick={() => openViewModal(item)}
                            style={{ cursor: 'pointer' }}
                            className="table-row-hover"
                          >
                            <td>
                              <Badge bg={getStatusBadge(item.status || 'available')}>
                                {getStatusText(item.status || 'available')}
                              </Badge>
                              {item.status === 'reserved' && item.reserved_for && (
                                <div className="small text-muted">จอง: {item.reserved_for}</div>
                              )}
                            </td>
                            <td>{formatDate(item.received_date)}</td>
                            <td>
                              <Badge bg={getBloodTypeBadge(item.blood_type)}>
                                {formatBloodType(item.blood_type)}
                              </Badge>
                            </td>
                            <td>
                              <strong>{item.blood_group}</strong>
                            </td>
                            <td>
                              <Badge bg={getRhFactorBadge(item.rh_factor)}>
                                {item.rh_factor}
                              </Badge>
                            </td>
                            <td>
                              <code>{item.bag_number}</code>
                            </td>
                            <td>
                              <span className={isExpiringSoon(item.expiry_date) ? 'text-danger fw-bold' : ''}>
                                {formatDate(item.expiry_date)}
                                {isExpiringSoon(item.expiry_date) && (
                                  <Badge bg="danger" className="ms-1">ใกล้หมดอายุ</Badge>
                                )}
                              </span>
                            </td>
                            <td>{item.received_by}</td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <Button
                                className="btn btn-sm btn-primary me-1"
                                onClick={() => handleEdit(item)}
                              >
                                <i className="fas fa-edit me-1"></i>แก้ไข
                              </Button>
                              <Button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(item)}
                              >
                                <i className="fas fa-trash me-1"></i>ลบ
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>

                  {/* Pagination */}
                  <PaginationComponent
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                    loading={loading}
                    showInfo={true}
                    className="mt-3"
                  />
                </>
              )}
            </Card.Body>
            <Card.Footer className="d-flex justify-content-left">
              <Button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                <i className="fas fa-arrow-left me-2"></i>กลับสู่หน้าหลัก
              </Button>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingItem ? 'แก้ไขข้อมูลเลือด' : 'เพิ่มข้อมูลเลือดใหม่'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>วันที่รับ <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.received_date || ''}
                    max={editingItem ? undefined : new Date().toISOString().split('T')[0]} // Only restrict for new entries
                    onChange={(e) => setFormData({...formData, received_date: e.target.value})}
                    required
                  />
                  <Form.Text className="text-muted">
                    {!editingItem && 'ไม่สามารถเลือกวันที่ในอนาคตได้'}
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>วันหมดอายุ <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.expiry_date || ''}
                    min={formData.received_date || (editingItem ? undefined : new Date().toISOString().split('T')[0])} // More flexible for edit
                    onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                    required
                  />
                  <Form.Text className="text-muted">
                    ต้องเป็นวันที่หลังจากวันที่รับ
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>ชนิดของเลือด <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={formData.blood_type}
                    onChange={(e) => setFormData({...formData, blood_type: e.target.value as any})}
                    required
                  >
                    <option value="">-- เลือกชนิดของเลือด --</option>
                    <option value="Whole_blood">Whole blood</option>
                    <option value="PRC">PRC</option>
                    <option value="LPRC">LPRC</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>หมู่เลือด <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={formData.blood_group}
                    onChange={(e) => setFormData({...formData, blood_group: e.target.value as any})}
                    required
                  >
                    <option value="">-- เลือกหมู่เลือด --</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>ระบบ Rh <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={formData.rh_factor}
                    onChange={(e) => setFormData({...formData, rh_factor: e.target.value as any})}
                    required
                  >
                    <option value="">-- เลือกระบบ Rh --</option>
                    <option value="Positive">Positive</option>
                    <option value="Negative">Negative</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>หมายเลขถุง <span className="text-danger">*</span></Form.Label>
              <Row className="g-2">
                <Col md={3}>
                  <Form.Control
                    type="text"
                    placeholder="000"
                    maxLength={3}
                    value={bagNumberParts.part1}
                    onChange={(e) => handleBagNumberChange('part1', e.target.value, 3)}
                    required
                    className="text-center"
                  />
                </Col>
                <Col md="auto" className="d-flex align-items-center">
                  <span className="fw-bold">.</span>
                </Col>
                <Col md={2}>
                  <Form.Control
                    type="text"
                    placeholder="00"
                    maxLength={2}
                    value={bagNumberParts.part2}
                    onChange={(e) => handleBagNumberChange('part2', e.target.value, 2)}
                    required
                    className="text-center"
                  />
                </Col>
                <Col md="auto" className="d-flex align-items-center">
                  <span className="fw-bold">.</span>
                </Col>
                <Col md={1}>
                  <Form.Control
                    type="text"
                    placeholder="0"
                    maxLength={1}
                    value={bagNumberParts.part3}
                    onChange={(e) => handleBagNumberChange('part3', e.target.value, 1)}
                    required
                    className="text-center"
                  />
                </Col>
                <Col md="auto" className="d-flex align-items-center">
                  <span className="fw-bold">.</span>
                </Col>
                <Col md={4}>
                  <Form.Control
                    type="text"
                    placeholder="00000"
                    maxLength={5}
                    value={bagNumberParts.part4}
                    onChange={(e) => handleBagNumberChange('part4', e.target.value, 5)}
                    required
                    className="text-center"
                  />
                </Col>
              </Row>
              <Form.Text className="text-muted">
                ตัวอย่าง: 001.01.1.12345 (กรอกเฉพาะตัวเลข)
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>ผู้รับ (นักเทคนิคการแพทย์) <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="ชื่อ-นามสกุล นักเทคนิคการแพทย์"
                value={formData.received_by}
                onChange={(e) => setFormData({...formData, received_by: e.target.value})}
                required
              />
              <Form.Text className="text-muted">
                {!editingItem ? 'ใช้ชื่อผู้ใช้ปัจจุบันโดยอัตโนมัติ' : 'สามารถแก้ไขข้อมูลผู้รับได้'}
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button className="btn btn-secondary" onClick={() => setShowModal(false)}>
              <i className="fas fa-times me-2"></i>ยกเลิก
            </Button>
            <Button className="btn btn-primary" type="submit">
              <i className="fas fa-save me-2"></i>{editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มข้อมูล'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Status Update Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>อัปเดตสถานะเลือด</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleStatusUpdate}>
          <Modal.Body>
            {statusUpdateItem && (
              <>
                <div className="mb-3 p-3 bg-light rounded">
                  <h6 className="mb-2">ข้อมูลเลือด</h6>
                  <p className="mb-1"><strong>หมายเลขถุง:</strong> {statusUpdateItem.bag_number}</p>
                  <p className="mb-1"><strong>ชนิด:</strong> {formatBloodType(statusUpdateItem.blood_type)}</p>
                  <p className="mb-0">
                    <strong>หมู่เลือด:</strong> {statusUpdateItem.blood_group}{' '}
                    <Badge bg={getRhFactorBadge(statusUpdateItem.rh_factor)}>
                      {statusUpdateItem.rh_factor}
                    </Badge>
                  </p>
                </div>

                <Form.Group className="mb-3">
                  <Form.Label>สถานะ <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={statusFormData.status}
                    onChange={(e) => setStatusFormData({...statusFormData, status: e.target.value as any})}
                    required
                  >
                    <option value="available">พร้อมใช้งาน</option>
                    <option value="reserved">จองไว้</option>
                    <option value="used">ใช้แล้ว</option>
                    <option value="expired">หมดอายุ</option>
                  </Form.Select>
                </Form.Group>

                {statusFormData.status === 'reserved' && (
                  <Form.Group className="mb-3">
                    <Form.Label>จองไว้สำหรับ <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="ชื่อผู้ที่จองเลือด..."
                      value={statusFormData.reserved_for}
                      onChange={(e) => setStatusFormData({...statusFormData, reserved_for: e.target.value})}
                      required={statusFormData.status === 'reserved'}
                    />
                  </Form.Group>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>หมายเหตุ</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="หมายเหตุเพิ่มเติม..."
                    value={statusFormData.notes}
                    onChange={(e) => setStatusFormData({...statusFormData, notes: e.target.value})}
                  />
                </Form.Group>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button className="btn btn-secondary" onClick={() => setShowStatusModal(false)}>
              ยกเลิก
            </Button>
            <Button className="btn btn-primary" type="submit">
              อัปเดตสถานะ
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* View Details Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>รายละเอียดข้อมูลเลือด</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewingItem && (
            <>
              <Row>
                <Col md={6}>
                  <Card className="mb-3">
                    <Card.Header>
                      <h6 className="mb-0">ข้อมูลเลือด</h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-2">
                        <strong>หมายเลขถุง:</strong>
                        <br />
                        <code className="fs-6">{viewingItem.bag_number}</code>
                      </div>
                      <div className="mb-2">
                        <strong>ชนิดของเลือด:</strong>
                        <br />
                        <Badge bg={getBloodTypeBadge(viewingItem.blood_type)} className="fs-6">
                          {formatBloodType(viewingItem.blood_type)}
                        </Badge>
                      </div>
                      <div className="mb-2">
                        <strong>หมู่เลือด:</strong>
                        <br />
                        <span className="fs-5 fw-bold">{viewingItem.blood_group}</span>{' '}
                        <Badge bg={getRhFactorBadge(viewingItem.rh_factor)} className="fs-6">
                          {viewingItem.rh_factor}
                        </Badge>
                      </div>
                      <div className="mb-0">
                        <strong>สถานะ:</strong>
                        <br />
                        <Badge bg={getStatusBadge(viewingItem.status || 'available')} className="fs-6">
                          {getStatusText(viewingItem.status || 'available')}
                        </Badge>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="mb-3">
                    <Card.Header>
                      <h6 className="mb-0">ข้อมูลการรับ</h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-2">
                        <strong>วันที่รับ:</strong>
                        <br />
                        {formatDate(viewingItem.received_date)}
                      </div>
                      <div className="mb-2">
                        <strong>วันหมดอายุ:</strong>
                        <br />
                        <span className={isExpiringSoon(viewingItem.expiry_date) ? 'text-danger fw-bold' : ''}>
                          {formatDate(viewingItem.expiry_date)}
                          {isExpiringSoon(viewingItem.expiry_date) && (
                            <Badge bg="danger" className="ms-2">ใกล้หมดอายุ</Badge>
                          )}
                        </span>
                      </div>
                      <div className="mb-0">
                        <strong>ผู้รับ:</strong>
                        <br />
                        {viewingItem.received_by}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Status specific information */}
              {viewingItem.status === 'reserved' && viewingItem.reserved_for && (
                <Card className="mb-3 border-warning">
                  <Card.Header className="bg-warning bg-opacity-10">
                    <h6 className="mb-0">ข้อมูลการจอง</h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-2">
                      <strong>จองไว้สำหรับ:</strong>
                      <br />
                      {viewingItem.reserved_for}
                    </div>
                    {viewingItem.reserved_at && (
                      <div className="mb-0">
                        <strong>วันที่จอง:</strong>
                        <br />
                        {formatDate(viewingItem.reserved_at)}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              )}

              {viewingItem.status === 'used' && viewingItem.used_at && (
                <Card className="mb-3 border-secondary">
                  <Card.Header className="bg-secondary bg-opacity-10">
                    <h6 className="mb-0">ข้อมูลการใช้</h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-0">
                      <strong>วันที่ใช้:</strong>
                      <br />
                      {formatDate(viewingItem.used_at)}
                    </div>
                  </Card.Body>
                </Card>
              )}

              {viewingItem.notes && (
                <Card className="mb-3">
                  <Card.Header>
                    <h6 className="mb-0">หมายเหตุ</h6>
                  </Card.Header>
                  <Card.Body>
                    <p className="mb-0">{viewingItem.notes}</p>
                  </Card.Body>
                </Card>
              )}

              {/* Timestamps */}
              <Card className="border-light">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">ข้อมูลระบบ</h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <div className="small text-muted">
                        <strong>สร้างเมื่อ:</strong>
                        <br />
                        {viewingItem.created_at && formatDate(viewingItem.created_at)}
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="small text-muted">
                        <strong>แก้ไขล่าสุด:</strong>
                        <br />
                        {viewingItem.updated_at && formatDate(viewingItem.updated_at)}
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>
            ปิด
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Toast Container for notifications */}
      <ToastContainer position="top-center" className="p-3 w-100" style={{ zIndex: 1056, maxWidth: '100%' }}>
        {error && (
          <Toast 
            show={!!error} 
            onClose={() => setError('')} 
            bg="danger"
            delay={8000}
            autohide
            className="w-100 mx-auto shadow-lg"
            style={{ maxWidth: '90vw', minWidth: '400px' }}
          >
            <Toast.Body className="text-white fs-6 py-3 d-flex align-items-center">
              <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
              {error}
            </Toast.Body>
          </Toast>
        )}
        {success && (
          <Toast 
            show={!!success} 
            onClose={() => setSuccess('')} 
            bg="success"
            delay={6000}
            autohide
            className="w-100 mx-auto shadow-lg"
            style={{ maxWidth: '90vw', minWidth: '400px' }}
          >
            <Toast.Body className="text-white fs-6 py-3 d-flex align-items-center">
              <i className="bi bi-check-circle-fill me-2 fs-5"></i>
              {success}
            </Toast.Body>
          </Toast>
        )}
      </ToastContainer>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        show={showConfirmModal}
        title="ยืนยันการลบข้อมูล"
        message={deleteItem ? `คุณแน่ใจหรือไม่ที่จะลบข้อมูลเลือดหมายเลขถุง "${deleteItem.bag_number}"?` : ''}
        confirmText="ลบข้อมูล"
        cancelText="ยกเลิก"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
      </Container>
    </>
  );
};

export default BloodInventoryDashboard;