import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Form, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import bloodReservationAPI, { BloodReservation } from '../services/bloodReservationAPI';
import ReservationDetailsModal from './ReservationDetailsModal';
import PaginationComponent from '../shared/components/PaginationComponent';
import { 
  BLOOD_TYPES, 
  BLOOD_TYPE_LABELS, 
  BLOOD_GROUPS, 
  DEPARTMENTS, 
  DEPARTMENT_LABELS, 
  RESERVATION_STATUS,
  RESERVATION_STATUS_LABELS,
  type BloodType,
  type BloodGroup,
  type Department,
  type ReservationStatus
} from '../shared/constants/bloodConstants';

// Mock data for fallback (using BloodReservation structure)
const mockReservations: BloodReservation[] = [
  {
    id: 1,
    blood_group: BLOOD_GROUPS.A,
    blood_type: BLOOD_TYPES.PRC,
    rh_factor: 'Positive',
    quantity: 2,
    patient_name: 'นายสมชาย ใจดี',
    department: DEPARTMENTS.IPD,
    status: RESERVATION_STATUS.PENDING,
    reservation_date: '2025-10-29T10:30:00Z',
    user_id: 1,
    reserved_by: 'พยาบาล สมหญิง',
    created_at: '2025-10-29T10:30:00Z',
    updated_at: '2025-10-29T10:30:00Z'
  },
  {
    id: 2,
    blood_group: BLOOD_GROUPS.O,
    blood_type: BLOOD_TYPES.WHOLE_BLOOD,
    rh_factor: 'Positive',
    quantity: 1,
    patient_name: 'นางสาวศิริ สบายดี',
    department: DEPARTMENTS.ER,
    status: RESERVATION_STATUS.COMPLETED,
    reservation_date: '2025-10-29T09:15:00Z',
    user_id: 2,
    reserved_by: 'แพทย์ สมศักดิ์',
    completed_by_username: 'ผู้ช่วยพยาบาล มาลี',
    created_at: '2025-10-29T09:15:00Z',
    updated_at: '2025-10-29T09:15:00Z'
  }
];

const BloodReservationList: React.FC = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<BloodReservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [idFilter, setIdFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState<string>('');
  const [patientNameFilter, setPatientNameFilter] = useState<string>('');
  
  // Use refs to get current state values in debounced functions
  const filtersRef = useRef({
    statusFilter: '',
    idFilter: '',
    departmentFilter: '',
    bloodGroupFilter: '',
    patientNameFilter: ''
  });

  // Update refs when state changes
  useEffect(() => {
    filtersRef.current = {
      statusFilter,
      idFilter,
      departmentFilter,
      bloodGroupFilter,
      patientNameFilter
    };
  }, [statusFilter, idFilter, departmentFilter, bloodGroupFilter, patientNameFilter]);
  
  // Modal state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedReservationId, setSelectedReservationId] = useState<number | null>(null);
  
  // Cancellation modal state
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelReservationId, setCancelReservationId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancellingReservation, setCancellingReservation] = useState<boolean>(false);
  
  const itemsPerPage = 10;

  // Load reservations from API with filters
  const loadReservations = useCallback(async (page: number = 1, filters?: {
    status?: string;
    id?: string;
    department?: string;
    blood_group?: string;
    patient_name?: string;
  }) => {
    try {
      setLoading(true);
      setError('');
      
      // Prepare API parameters
      const apiParams: any = {
        page,
        limit: itemsPerPage
      };

      // Add filters to API params if they exist
      if (filters?.status) apiParams.status = filters.status;
      if (filters?.id) apiParams.id = filters.id;
      if (filters?.department) apiParams.department = filters.department;
      if (filters?.blood_group) apiParams.blood_group = filters.blood_group;
      if (filters?.patient_name) apiParams.patient_name = filters.patient_name;

      const response = await bloodReservationAPI.getReservations(apiParams);
      
      if (response.success && response.data) {
        setReservations(response.data);
        
        // Debug pagination data
        console.log('🔍 Pagination Debug:', {
          responseData: response.data.length,
          responsePagination: response.pagination,
          totalFromBackend: response.pagination?.total,
          itemsPerPage,
          calculatedTotalPages: Math.ceil((response.pagination?.total || 0) / itemsPerPage)
        });
        
        // Use pagination total from backend (no fallback needed)
        const total = response.pagination?.total || 0;
        setTotalPages(Math.ceil(total / itemsPerPage));
      } else {
        console.error('API Error:', response.error);
        setReservations([]);
        setTotalPages(1);
        setError(response.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
    } catch (error) {
      console.error('Error loading reservations:', error);
      setReservations([]);
      setTotalPages(1);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  }, []); // ลบ dependencies ที่ทำให้เกิด infinite loop

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const currentFilters = filtersRef.current;
    loadReservations(page, {
      status: currentFilters.statusFilter,
      id: currentFilters.idFilter,
      department: currentFilters.departmentFilter,
      blood_group: currentFilters.bloodGroupFilter,
      patient_name: currentFilters.patientNameFilter
    });
  };

  // Handle filter changes - call API with new filters
  const handleFilterChange = (filterType: string, value: string) => {
    // Update the appropriate filter state
    switch (filterType) {
      case 'status':
        setStatusFilter(value);
        break;
      case 'id':
        setIdFilter(value);
        break;
      case 'department':
        setDepartmentFilter(value);
        break;
      case 'blood_group':
        setBloodGroupFilter(value);
        break;
      case 'patient_name':
        setPatientNameFilter(value);
        break;
    }

    // Reset to page 1 when filtering
    setCurrentPage(1);

    // Prepare new filters object
    const newFilters = {
      status: filterType === 'status' ? value : statusFilter,
      id: filterType === 'id' ? value : idFilter,
      department: filterType === 'department' ? value : departmentFilter,
      blood_group: filterType === 'blood_group' ? value : bloodGroupFilter,
      patient_name: filterType === 'patient_name' ? value : patientNameFilter
    };

    // Call API with new filters
    loadReservations(1, newFilters);
  };

  // Debounced search functions - using refs for current values
  const debouncedIdSearch = useCallback(
    debounce((searchValue: string) => {
      setCurrentPage(1);
      setIsLoading(true);
      
      // ใช้ current values จาก ref
      const currentFilters = filtersRef.current;
      
      const filterParams: any = {
        id: searchValue, // ค่าที่ผู้ใช้พิมพ์
        page: 1,
        limit: itemsPerPage
      };

      // เพิ่ม filters อื่นๆ ที่มีค่า
      if (currentFilters.statusFilter) filterParams.status = currentFilters.statusFilter;
      if (currentFilters.departmentFilter) filterParams.department = currentFilters.departmentFilter;
      if (currentFilters.bloodGroupFilter) filterParams.blood_group = currentFilters.bloodGroupFilter;
      if (currentFilters.patientNameFilter && searchValue !== currentFilters.patientNameFilter) {
        filterParams.patient_name = currentFilters.patientNameFilter;
      }

      console.log('ID Search - Filter params:', filterParams);

      bloodReservationAPI.getReservations(filterParams).then(response => {
        if (response.success && response.data) {
          setReservations(response.data);
          const total = response.pagination?.total || response.data.length;
          setTotalPages(Math.ceil(total / itemsPerPage));
        } else {
          setReservations([]);
          setTotalPages(1);
        }
      }).catch(error => {
        console.error('Error searching by ID:', error);
        setReservations([]);
        setTotalPages(1);
      }).finally(() => {
        setIsLoading(false);
      });
    }, 1000),
    [] // ไม่ต้องมี dependencies
  );

  const debouncedPatientNameSearch = useCallback(
    debounce((searchValue: string) => {
      setCurrentPage(1);
      setIsLoading(true);
      
      // ใช้ current values จาก ref
      const currentFilters = filtersRef.current;
      
      const filterParams: any = {
        patient_name: searchValue, // ค่าที่ผู้ใช้พิมพ์
        page: 1,
        limit: itemsPerPage
      };

      // เพิ่ม filters อื่นๆ ที่มีค่า
      if (currentFilters.statusFilter) filterParams.status = currentFilters.statusFilter;
      if (currentFilters.idFilter && searchValue !== currentFilters.idFilter) {
        filterParams.id = currentFilters.idFilter;
      }
      if (currentFilters.departmentFilter) filterParams.department = currentFilters.departmentFilter;
      if (currentFilters.bloodGroupFilter) filterParams.blood_group = currentFilters.bloodGroupFilter;

      console.log('Patient Name Search - Filter params:', filterParams);

      bloodReservationAPI.getReservations(filterParams).then(response => {
        if (response.success && response.data) {
          setReservations(response.data);
          const total = response.pagination?.total || response.data.length;
          setTotalPages(Math.ceil(total / itemsPerPage));
        } else {
          setReservations([]);
          setTotalPages(1);
        }
      }).catch(error => {
        console.error('Error searching by patient name:', error);
        setReservations([]);
        setTotalPages(1);
      }).finally(() => {
        setIsLoading(false);
      });
    }, 1000),
    [] // ไม่ต้องมี dependencies
  );

  // Handle ID filter change
  const handleIdFilterChange = (value: string) => {
    console.log('ID Filter onChange:', value);
    setIdFilter(value);
    
    // ยกเลิก debounce ที่กำลังรอ
    debouncedIdSearch.cancel();
    
    if (value.trim() !== '') {
      // ค้นหาเมื่อพิมพ์ค่าใดๆ แล้วหยุดพิมพ์ 2 วินาที (ไม่ disable input ตอนนี้)
      console.log('Calling debouncedIdSearch with:', value);
      debouncedIdSearch(value);
    } else {
      // ถ้าไม่มีค่า ให้โหลดข้อมูลทั้งหมด
      console.log('Clearing ID filter, loading all data');
      setIsLoading(true);
      loadReservations(1).finally(() => setIsLoading(false));
    }
  };

  // Handle patient name filter change
  const handlePatientNameFilterChange = (value: string) => {
    console.log('Patient Name Filter onChange:', value);
    setPatientNameFilter(value);
    
    // ยกเลิก debounce ที่กำลังรอ
    debouncedPatientNameSearch.cancel();
    
    if (value.trim() !== '') {
      // ค้นหาเมื่อพิมพ์ค่าใดๆ แล้วหยุดพิมพ์ 2 วินาที (ไม่ disable input ตอนนี้)
      console.log('Calling debouncedPatientNameSearch with:', value);
      debouncedPatientNameSearch(value);
    } else {
      // ถ้าไม่มีค่า ให้โหลดข้อมูลทั้งหมด
      console.log('Clearing patient name filter, loading all data');
      setIsLoading(true);
      loadReservations(1).finally(() => setIsLoading(false));
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    // Cancel any pending debounced searches
    debouncedIdSearch.cancel();
    debouncedPatientNameSearch.cancel();
    
    // Reset all filters
    setStatusFilter('');
    setIdFilter('');
    setDepartmentFilter('');
    setBloodGroupFilter('');
    setPatientNameFilter('');
    setCurrentPage(1);
    
    // Force clear form inputs
    setTimeout(() => {
      const inputs = document.querySelectorAll('input[name="idFilter"], input[name="patientNameFilter"], select[name="statusFilter"], select[name="departmentFilter"], select[name="bloodGroupFilter"]');
      inputs.forEach((input: any) => {
        if (input.type === 'text') {
          input.value = '';
        } else if (input.type === 'select-one') {
          input.selectedIndex = 0;
        }
      });
    }, 50);
    
    // Load all data without filters
    setIsLoading(true);
    loadReservations(1, {}).finally(() => {
      setIsLoading(false);
    });
  };

  // Cancel reservation
  const handleCancelReservation = (reservationId: number) => {
    setCancelReservationId(reservationId);
    setCancelReason('');
    setShowCancelModal(true);
  };

  // Confirm cancellation with reason
  const confirmCancelReservation = async () => {
    if (!cancelReservationId || !cancelReason.trim()) {
      alert('กรุณาระบุสาเหตุในการยกเลิกการจอง');
      return;
    }

    setCancellingReservation(true);
    try {
      const response = await bloodReservationAPI.cancelReservationWithReason(
        cancelReservationId,
        cancelReason.trim()
      );

      if (response.success) {
        // Close modal and reset state
        setShowCancelModal(false);
        setCancelReservationId(null);
        setCancelReason('');
        
        // Reload current page data
        loadReservations(currentPage, {
          status: statusFilter,
          id: idFilter,
          department: departmentFilter,
          blood_group: bloodGroupFilter,
          patient_name: patientNameFilter
        });
        
        // Success feedback without alert
        console.log('ยกเลิกการจองเรียบร้อยแล้ว');
      } else {
        console.error('เกิดข้อผิดพลาดในการยกเลิกการจอง:', response.error || 'ไม่ทราบสาเหตุ');
      }
    } catch (error) {
      console.error('Error canceling reservation:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setCancellingReservation(false);
    }
  };

  // Handle row click to show details
  const handleRowClick = (reservationId: number) => {
    setSelectedReservationId(reservationId);
    setShowModal(true);
  };

  // Initialize data on component mount
  useEffect(() => {
    loadReservations(1);
  }, []); // ลบ dependency ที่ทำให้เกิด infinite loop

  // Cleanup debounced functions on unmount
  useEffect(() => {
    return () => {
      debouncedIdSearch.cancel();
      debouncedPatientNameSearch.cancel();
    };
  }, [debouncedIdSearch, debouncedPatientNameSearch]);

  const formatBloodType = (type: BloodType) => {
    return BLOOD_TYPE_LABELS[type] || type;
  };

  const formatDepartment = (dept: Department) => {
    return DEPARTMENT_LABELS[dept] || dept;
  };

  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case RESERVATION_STATUS.PENDING: return <Badge bg="warning">รอดำเนินการ</Badge>;
      case RESERVATION_STATUS.APPROVED: return <Badge bg="primary">อนุมัติแล้ว</Badge>;
      case RESERVATION_STATUS.COMPLETED: return <Badge bg="success">เสร็จสิ้น</Badge>;
      case RESERVATION_STATUS.CANCELLED: return <Badge bg="secondary">ยกเลิก</Badge>;
      case RESERVATION_STATUS.CANCELLED_BY_DISPENSER: return <Badge bg="danger">ยกเลิกโดยผู้จ่าย</Badge>;
      case RESERVATION_STATUS.REJECTED: return <Badge bg="danger">ถูกปฏิเสธ</Badge>;
      default: return <Badge bg="light">{status}</Badge>;
    }
  };

  const getStatusText = (status: ReservationStatus) => {
    switch (status) {
      case RESERVATION_STATUS.PENDING: return 'รอดำเนินการ';
      case RESERVATION_STATUS.APPROVED: return 'อนุมัติแล้ว';
      case RESERVATION_STATUS.COMPLETED: return 'เสร็จสิ้น';
      case RESERVATION_STATUS.CANCELLED: return 'ยกเลิก';
      case RESERVATION_STATUS.CANCELLED_BY_DISPENSER: return 'ยกเลิกโดยผู้จ่าย';
      case RESERVATION_STATUS.REJECTED: return 'ถูกปฏิเสธ';
      default: return status;
    }
  };

  // Remove client-side filtering since we're now filtering on server
  // All filtering is now handled by the API
  const filteredReservations = reservations;

  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Container fluid className="py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">กำลังโหลด...</span>
          </div>
          <div className="mt-3">กำลังโหลดรายการจองเลือด...</div>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          {/* Combined Filter and Data Card */}
          <Card>
             <Card.Header className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0"><i className="fas fa-list me-2"></i>รายการจองเลือด (จัดการทั่วไป)</h4>
                <Button className="btn btn-primary"  onClick={() => navigate('/blood-reservation-form')}>
                  <i className="fas fa-plus me-2"></i>จองเลือด
                </Button>
              </Card.Header>
            <Card.Body>
              <div className="alert alert-info mb-3">
                <i className="fas fa-info-circle me-2"></i>
                <strong>หมายเหตุ:</strong> หน้านี้ใช้สำหรับจัดการและดูรายการจองเลือดทั่วไป การจ่ายเลือดจริงให้ไปที่หน้า "รายการรอจ่าย"
              </div>
              
              {/* Filter Section */}
              <Row className="mb-4">
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>รหัสการจอง {isLoading && <span className="spinner-border spinner-border-sm ms-1" role="status" aria-hidden="true"></span>}</Form.Label>
                    <Form.Control
                      type="text"
                      name="idFilter"
                      placeholder="ค้นหารหัส..."
                      value={idFilter}
                      onChange={(e) => handleIdFilterChange(e.target.value)}
                      disabled={isLoading}
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>สถานะ</Form.Label>
                    <Form.Select
                      name="statusFilter"
                      value={statusFilter}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      disabled={isLoading}
                    >
                      <option value="">ทั้งหมด</option>
                      <option value={RESERVATION_STATUS.PENDING}>รอดำเนินการ</option>
                      <option value={RESERVATION_STATUS.APPROVED}>อนุมัติแล้ว</option>
                      <option value={RESERVATION_STATUS.COMPLETED}>เสร็จสิ้น</option>
                      <option value={RESERVATION_STATUS.CANCELLED}>ยกเลิก</option>
                      <option value={RESERVATION_STATUS.CANCELLED_BY_DISPENSER}>ยกเลิกโดยผู้จ่าย</option>
                      <option value={RESERVATION_STATUS.REJECTED}>ถูกปฏิเสธ</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={1}>
                  <Form.Group>
                    <Form.Label>หมู่เลือด</Form.Label>
                    <Form.Select
                      name="bloodGroupFilter"
                      value={bloodGroupFilter}
                      onChange={(e) => handleFilterChange('blood_group', e.target.value)}
                      disabled={isLoading}
                    >
                      <option value="">ทั้งหมด</option>
                      {Object.entries(BLOOD_GROUPS).map(([key, value]) => (
                        <option key={key} value={value}>
                          {value}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>หน่วยงาน</Form.Label>
                    <Form.Select
                      name="departmentFilter"
                      value={departmentFilter}
                      onChange={(e) => handleFilterChange('department', e.target.value)}
                      disabled={isLoading}
                    >
                      <option value="">ทั้งหมด</option>
                      {Object.entries(DEPARTMENTS).map(([key, value]) => (
                        <option key={key} value={value}>
                          {DEPARTMENT_LABELS[value as Department]}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>ชื่อผู้ป่วย {isLoading && <span className="spinner-border spinner-border-sm ms-1" role="status" aria-hidden="true"></span>}</Form.Label>
                    <Form.Control
                      type="text"
                      name="patientNameFilter"
                      placeholder="ค้นหาชื่อผู้ป่วย..."
                      value={patientNameFilter}
                      onChange={(e) => handlePatientNameFilterChange(e.target.value)}
                      disabled={isLoading}
                    />
                  </Form.Group>
                </Col>
                <Col md={1} className="d-flex align-items-end">
                  <Button 
                    variant="outline-secondary"
                    className="w-100" 
                    onClick={clearAllFilters}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        กำลังล้าง...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-eraser me-1"></i>
                        ล้าง
                      </>
                    )}
                  </Button>
                </Col>
              </Row>

              {/* Table Section */}
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead className="bg-light">
                    <tr>
                      <th style={{width: '6%'}}>รหัส</th>
                      <th style={{width: '9%'}}>สถานะ</th>
                      <th style={{width: '7%'}}>หมู่เลือด</th>
                      <th style={{width: '10%'}}>ชนิดเลือด</th>
                      <th style={{width: '5%'}}>จำนวน</th>
                      <th style={{width: '13%'}}>ชื่อผู้ป่วย</th>
                      <th style={{width: '8%'}}>หน่วยงาน</th>
                      <th style={{width: '10%'}}>วันที่จอง</th>
                      <th style={{width: '9%'}}>ผู้จอง</th>
                      <th style={{width: '12%'}}>ผู้จ่าย/ผู้ยกเลิก</th>
                      <th style={{width: '10%'}}>การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReservations.length > 0 ? (
                      filteredReservations.map((reservation) => (
                        <tr 
                          key={reservation.id}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleRowClick(reservation.id)}
                          className="reservation-row"
                        >
                          <td>
                            <strong className="text-primary">#{reservation.id.toString().padStart(4, '0')}</strong>
                          </td>
                          <td>
                            {getStatusBadge(reservation.status)}
                          </td>
                          <td className="fw-bold text-danger">{reservation.blood_group}</td>
                          <td>{formatBloodType(reservation.blood_type)}</td>
                          <td>
                            <span className="fw-bold">{reservation.quantity} ถุง</span>
                          </td>
                          <td>{reservation.patient_name}</td>
                          <td>{formatDepartment(reservation.department)}</td>
                          <td>
                            {formatDateTime(reservation.reservation_date)}
                          </td>
                          <td>{reservation.reserved_by}</td>
                          <td>
                            {reservation.status === RESERVATION_STATUS.COMPLETED && reservation.completed_by_username ? (
                              <span>
                                {reservation.completed_by_username}
                              </span>
                            ) : (reservation.status === RESERVATION_STATUS.CANCELLED || reservation.status === RESERVATION_STATUS.CANCELLED_BY_DISPENSER) && reservation.cancelled_by_username ? (
                              <span>
                                {reservation.cancelled_by_username}
                              </span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            {reservation.status === RESERVATION_STATUS.PENDING ? (
                              <Button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleCancelReservation(reservation.id)}
                                title="ยกเลิกการจอง"
                              >
                                <i className="fas fa-times me-1"></i>ยกเลิก
                              </Button>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={11} className="text-center py-4 text-muted">
                          <div className="py-3">
                            {(statusFilter || idFilter || departmentFilter || bloodGroupFilter || patientNameFilter) ? (
                              <>
                                <h5>ไม่พบรายการตามเงื่อนไขที่เลือก</h5>
                                <p>ลองเปลี่ยน filter หรือเคลียร์ filter เพื่อดูรายการทั้งหมด</p>
                              </>
                            ) : (
                              <>
                                <h5>ไม่มีรายการจองเลือด</h5>
                                <p>คลิกปุ่ม "จองเลือด" เพื่อสร้างรายการจองใหม่</p>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>

            {/* Pagination */}
            <PaginationComponent
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              loading={loading}
              showInfo={true}
              className="border-top p-3"
            />
            <Card.Footer className="d-flex justify-content-left">
              <Button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                <i className="fas fa-arrow-left me-2"></i>กลับสู่หน้าหลัก
              </Button>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      {/* Reservation Details Modal */}
      <ReservationDetailsModal
        show={showModal}
        onHide={() => setShowModal(false)}
        reservationId={selectedReservationId}
      />

      {/* Cancel Reservation Modal */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">
            <i className="fas fa-times-circle me-2"></i>
            ยกเลิกการจองเลือด
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <p className="mb-3">
              <strong>คุณต้องการยกเลิกการจองหมายเลข {cancelReservationId} หรือไม่?</strong>
            </p>
            <p className="text-muted small mb-3">
              กรุณาระบุสาเหตุในการยกเลิกการจอง (ข้อมูลนี้จะบันทึกไว้ในระบบเพื่อการตรวจสอบ)
            </p>
            <Form.Group>
              <Form.Label className="fw-bold">สาเหตุในการยกเลิก <span className="text-danger">*</span></Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="ระบุสาเหตุในการยกเลิกการจอง เช่น ผู้ป่วยไม่ต้องการเลือดแล้ว, ยกเลิกการผ่าตัด, เปลี่ยนแปลงการรักษา เป็นต้น"
                disabled={cancellingReservation}
                maxLength={500}
              />
              <Form.Text className="text-muted">
                {cancelReason.length}/500 ตัวอักษร
              </Form.Text>
            </Form.Group>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowCancelModal(false)}
            disabled={cancellingReservation}
          >
            <i className="fas fa-arrow-left me-1"></i>
            ย้อนกลับ
          </Button>
          <Button 
            variant="danger" 
            onClick={confirmCancelReservation}
            disabled={cancellingReservation || !cancelReason.trim()}
          >
            {cancellingReservation ? (
              <>
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                กำลังยกเลิก...
              </>
            ) : (
              <>
                <i className="fas fa-times me-1"></i>
                ยืนยันยกเลิกการจอง
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .reservation-row {
          transition: all 0.2s ease-in-out;
        }
        .reservation-row:hover {
          background-color: #f8f9fa !important;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
      `}</style>
    </Container>
  );
};

export default BloodReservationList;