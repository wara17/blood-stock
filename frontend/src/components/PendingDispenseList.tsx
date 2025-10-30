import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Form, Modal, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import bloodReservationAPI, { BloodReservation } from '../services/bloodReservationAPI';
import ReservationDetailsModal from './ReservationDetailsModal';
import PaginationComponent from '../shared/components/PaginationComponent';
import { 
  BLOOD_GROUPS, 
  DEPARTMENTS, 
  DEPARTMENT_LABELS, 
  RESERVATION_STATUS,
  type Department,
  type ReservationStatus
} from '../shared/constants/bloodConstants';

const PendingDispenseList: React.FC = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<BloodReservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [idFilter, setIdFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState<string>('');
  const [patientNameFilter, setPatientNameFilter] = useState<string>('');
  const [currentSearchType, setCurrentSearchType] = useState<string>('all');
  
  // Use refs to get current state values in debounced functions
  const filtersRef = useRef({
    idFilter: '',
    departmentFilter: '',
    bloodGroupFilter: '',
    patientNameFilter: ''
  });

  // Update refs when state changes
  useEffect(() => {
    filtersRef.current = {
      idFilter,
      departmentFilter,
      bloodGroupFilter,
      patientNameFilter
    };
  }, [idFilter, departmentFilter, bloodGroupFilter, patientNameFilter]);
  
  // Modal state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedReservationId, setSelectedReservationId] = useState<number | null>(null);
  
  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [reservationToCancel, setReservationToCancel] = useState<BloodReservation | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelling, setCancelling] = useState<boolean>(false);
  
  const itemsPerPage = 10;

  // Load reservations from API with filters (only pending status)
  const loadReservations = useCallback(async (page: number = 1, filters?: {
    id?: string;
    department?: string;
    blood_group?: string;
    patient_name?: string;
  }) => {
    try {
      setLoading(true);
      
      const filterParams: any = {
        status: RESERVATION_STATUS.PENDING, // Always filter by pending status
        id: filters?.id || idFilter,
        department: filters?.department || departmentFilter,
        blood_group: filters?.blood_group || bloodGroupFilter,
        patient_name: filters?.patient_name || patientNameFilter,
        page,
        limit: itemsPerPage
      };

      // Remove empty filters
      Object.keys(filterParams).forEach(key => {
        if (filterParams[key as keyof typeof filterParams] === '') {
          delete filterParams[key as keyof typeof filterParams];
        }
      });

      const response = await bloodReservationAPI.getReservations(filterParams);
      
      if (response.success && response.data) {
        setReservations(response.data);
        
        // Debug pagination data for PendingDispenseList
        console.log('🔍 PendingDispense Pagination Debug:', {
          responseData: response.data.length,
          responsePagination: response.pagination,
          totalFromBackend: response.pagination?.total,
          itemsPerPage,
          calculatedTotalPages: Math.ceil((response.pagination?.total || 0) / itemsPerPage)
        });
        
        // Calculate pagination based on returned data
        const total = response.pagination?.total || 0;
        setTotalPages(Math.ceil(total / itemsPerPage));
      } else {
        console.error('API Error:', response.error);
        setReservations([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error loading reservations:', error);
      setReservations([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, []); // ลบ dependencies ที่ทำให้เกิด infinite loop

  // Debounced search functions
  const debouncedSearchById = useCallback(
    debounce((searchTerm: string) => {
      setCurrentPage(1);
      setCurrentSearchType('id');
      setIsLoading(true);
      
      // ใช้ current state values จาก ref
      const currentFilters = filtersRef.current;
      
      const filterParams: any = {
        status: RESERVATION_STATUS.PENDING,
        id: searchTerm,
        page: 1,
        limit: itemsPerPage
      };

      // เพิ่ม filters ที่มีค่า
      if (currentFilters.departmentFilter) {
        filterParams.department = currentFilters.departmentFilter;
      }
      if (currentFilters.bloodGroupFilter) {
        filterParams.blood_group = currentFilters.bloodGroupFilter;
      }
      if (currentFilters.patientNameFilter && searchTerm !== currentFilters.patientNameFilter) {
        filterParams.patient_name = currentFilters.patientNameFilter;
      }

      console.log('Search by ID - Filter params:', filterParams);

      bloodReservationAPI.getReservations(filterParams).then(response => {
        if (response.success && response.data) {
          setReservations(response.data);
          const total = response.pagination?.total || 0;
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
    [] // ไม่ต้องมี dependencies เพราะใช้ ref
  );

  const debouncedSearchByPatient = useCallback(
    debounce((searchTerm: string) => {
      setCurrentPage(1);
      setCurrentSearchType('patient');
      setIsLoading(true);
      
      // ใช้ current state values จาก ref
      const currentFilters = filtersRef.current;
      
      const filterParams: any = {
        status: RESERVATION_STATUS.PENDING,
        patient_name: searchTerm,
        page: 1,
        limit: itemsPerPage
      };

      // เพิ่ม filters ที่มีค่า
      if (currentFilters.idFilter && searchTerm !== currentFilters.idFilter) {
        filterParams.id = currentFilters.idFilter;
      }
      if (currentFilters.departmentFilter) {
        filterParams.department = currentFilters.departmentFilter;
      }
      if (currentFilters.bloodGroupFilter) {
        filterParams.blood_group = currentFilters.bloodGroupFilter;
      }

      console.log('Search by Patient - Filter params:', filterParams);

      bloodReservationAPI.getReservations(filterParams).then(response => {
        if (response.success && response.data) {
          setReservations(response.data);
          const total = response.pagination?.total || 0;
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
    [] // ไม่ต้องมี dependencies เพราะใช้ ref
  );

  // Initial load
  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  // Cleanup debounced functions on unmount
  useEffect(() => {
    return () => {
      debouncedSearchById.cancel();
      debouncedSearchByPatient.cancel();
    };
  }, [debouncedSearchById, debouncedSearchByPatient]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    
    const filterParams: any = {
      status: RESERVATION_STATUS.PENDING,
      id: idFilter,
      department: departmentFilter,
      blood_group: bloodGroupFilter,
      patient_name: patientNameFilter,
      page,
      limit: itemsPerPage
    };

    Object.keys(filterParams).forEach(key => {
      if (filterParams[key as keyof typeof filterParams] === '') {
        delete filterParams[key as keyof typeof filterParams];
      }
    });

    bloodReservationAPI.getReservations(filterParams).then(response => {
      if (response.success && response.data) {
        setReservations(response.data);
        const total = response.pagination?.total || 0;
        setTotalPages(Math.ceil(total / itemsPerPage));
      }
    });
  };

  // Handle filter changes
  const handleDepartmentChange = (value: string) => {
    setDepartmentFilter(value);
    setCurrentPage(1);
    setCurrentSearchType('filter');
    setIsLoading(true);
    
    const filterParams: any = {
      status: RESERVATION_STATUS.PENDING,
      id: idFilter,
      department: value,
      blood_group: bloodGroupFilter,
      patient_name: patientNameFilter,
      page: 1,
      limit: itemsPerPage
    };

    Object.keys(filterParams).forEach(key => {
      if (filterParams[key as keyof typeof filterParams] === '') {
        delete filterParams[key as keyof typeof filterParams];
      }
    });

    bloodReservationAPI.getReservations(filterParams).then(response => {
      if (response.success && response.data) {
        setReservations(response.data);
        const total = response.pagination?.total || 0;
        setTotalPages(Math.ceil(total / itemsPerPage));
      }
    }).finally(() => {
      setIsLoading(false);
    });
  };

  const handleBloodGroupChange = (value: string) => {
    setBloodGroupFilter(value);
    setCurrentPage(1);
    setCurrentSearchType('filter');
    setIsLoading(true);
    
    const filterParams: any = {
      status: RESERVATION_STATUS.PENDING,
      id: idFilter,
      department: departmentFilter,
      blood_group: value,
      patient_name: patientNameFilter,
      page: 1,
      limit: itemsPerPage
    };

    Object.keys(filterParams).forEach(key => {
      if (filterParams[key as keyof typeof filterParams] === '') {
        delete filterParams[key as keyof typeof filterParams];
      }
    });

    bloodReservationAPI.getReservations(filterParams).then(response => {
      if (response.success && response.data) {
        setReservations(response.data);
        const total = response.pagination?.total || 0;
        setTotalPages(Math.ceil(total / itemsPerPage));
      }
    }).finally(() => {
      setIsLoading(false);
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    // Cancel any pending debounced searches
    debouncedSearchById.cancel();
    debouncedSearchByPatient.cancel();
    
    // Reset all state immediately
    setIdFilter('');
    setDepartmentFilter('');
    setBloodGroupFilter('');
    setPatientNameFilter('');
    setCurrentPage(1);
    setCurrentSearchType('all');
    
    // Force clear form inputs using name attributes
    setTimeout(() => {
      const idInput = document.querySelector('input[name="idFilter"]') as HTMLInputElement;
      const patientInput = document.querySelector('input[name="patientNameFilter"]') as HTMLInputElement;
      const departmentSelect = document.querySelector('select[name="departmentFilter"]') as HTMLSelectElement;
      const bloodGroupSelect = document.querySelector('select[name="bloodGroupFilter"]') as HTMLSelectElement;
      
      if (idInput) idInput.value = '';
      if (patientInput) patientInput.value = '';
      if (departmentSelect) departmentSelect.selectedIndex = 0;
      if (bloodGroupSelect) bloodGroupSelect.selectedIndex = 0;
    }, 50);

    // Load all data without filters
    setIsLoading(true);
    setTimeout(() => {
      const filterParams: any = {
        status: RESERVATION_STATUS.PENDING,
        page: 1,
        limit: itemsPerPage
      };

      bloodReservationAPI.getReservations(filterParams).then(response => {
        if (response.success && response.data) {
          setReservations(response.data);
          const total = response.pagination?.total || 0;
          setTotalPages(Math.ceil(total / itemsPerPage));
        }
      }).finally(() => {
        setIsLoading(false);
      });
    }, 100);
  };

  // Handle blood dispensing
  const handleDispenseBlood = (reservation: BloodReservation) => {
    // Navigate to blood dispensing page with reservation data
    navigate(`/blood-dispense/${reservation.id}`, {
      state: { reservation }
    });
  };

  // Handle view details
  const handleViewDetails = (reservationId: number) => {
    setSelectedReservationId(reservationId);
    setShowModal(true);
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: ReservationStatus) => {
    switch (status) {
      case RESERVATION_STATUS.PENDING: return 'warning';
      case RESERVATION_STATUS.APPROVED: return 'info';
      case RESERVATION_STATUS.REJECTED: return 'danger';
      case RESERVATION_STATUS.COMPLETED: return 'success';
      case RESERVATION_STATUS.CANCELLED: return 'secondary';
      case RESERVATION_STATUS.CANCELLED_BY_DISPENSER: return 'warning';
      default: return 'secondary';
    }
  };

  // Format blood type for display
  const formatBloodType = (bloodType: string) => {
    return bloodType; // Just return the blood type as is for now
  };

  // Format department for display
  const formatDepartment = (department: Department) => {
    return DEPARTMENT_LABELS[department] || department;
  };

  // Handle cancel by dispenser
  const handleCancelByDispenser = (reservation: BloodReservation) => {
    setReservationToCancel(reservation);
    setShowCancelModal(true);
    setCancelReason('');
  };

  // Confirm cancel by dispenser
  const confirmCancelByDispenser = async () => {
    if (!reservationToCancel || !cancelReason.trim()) {
      return;
    }

    setCancelling(true);

    try {
      const result = await bloodReservationAPI.cancelReservationByDispenser(
        reservationToCancel.id, 
        cancelReason.trim()
      );
      
      if (!result.success) {
        throw new Error(result.error || 'ไม่สามารถยกเลิกการจองได้');
      }

      // Reload data
      await loadReservations(currentPage);
      setShowCancelModal(false);
      setReservationToCancel(null);
      setCancelReason('');
      
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      alert('เกิดข้อผิดพลาดในการยกเลิกการจอง');
    } finally {
      setCancelling(false);
    }
  };

  // Format date time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h4 className="mb-0">
                <i className="fas fa-clock me-2"></i>
                รายการรอจ่าย
              </h4>
            </Card.Header>
            <Card.Body>
              {/* Filters */}
              <Row className="mb-4">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>ค้นหาด้วยรหัสการจอง</Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type="text"
                        name="idFilter"
                        placeholder="ระบุรหัสการจอง..."
                        value={idFilter}
                        onChange={(e) => {
                          const value = e.target.value;
                          console.log('ID Filter onChange:', value);
                          setIdFilter(value);
                          
                          // ยกเลิก debounce ที่กำลังรอ
                          debouncedSearchById.cancel();
                          
                          if (value.trim() !== '') {
                            // ค้นหาเมื่อพิมพ์ค่าใดๆ แล้วหยุดพิมพ์ 2 วินาที (ไม่ disable input ตอนนี้)
                            setCurrentSearchType('id');
                            console.log('Calling debouncedSearchById with:', value);
                            debouncedSearchById(value);
                          } else {
                            // ถ้าไม่มีค่า ให้โหลดข้อมูลทั้งหมด
                            console.log('Clearing ID filter, loading all data');
                            setIsLoading(true);
                            loadReservations(1).finally(() => setIsLoading(false));
                          }
                        }}
                        disabled={isLoading && currentSearchType === 'id'}
                      />
                      {isLoading && currentSearchType === 'id' && (
                        <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                          <div className="spinner-border spinner-border-sm text-primary" role="status">
                            <span className="visually-hidden">กำลังค้นหา...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>หน่วยงาน</Form.Label>
                    <Form.Select
                      name="departmentFilter"
                      value={departmentFilter}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
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
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>หมู่เลือด</Form.Label>
                    <Form.Select
                      name="bloodGroupFilter"
                      value={bloodGroupFilter}
                      onChange={(e) => handleBloodGroupChange(e.target.value)}
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
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>ชื่อผู้ป่วย</Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type="text"
                        name="patientNameFilter"
                        placeholder="ค้นหาชื่อผู้ป่วย..."
                        value={patientNameFilter}
                        onChange={(e) => {
                          const value = e.target.value;
                          console.log('Patient Name Filter onChange:', value);
                          setPatientNameFilter(value);
                          
                          // ยกเลิก debounce ที่กำลังรอ
                          debouncedSearchByPatient.cancel();
                          
                          if (value.trim() !== '') {
                            // ค้นหาเมื่อพิมพ์ค่าใดๆ แล้วหยุดพิมพ์ 2 วินาที (ไม่ disable input ตอนนี้)
                            setCurrentSearchType('patient');
                            console.log('Calling debouncedSearchByPatient with:', value);
                            debouncedSearchByPatient(value);
                          } else {
                            // ถ้าไม่มีค่า ให้โหลดข้อมูลทั้งหมด
                            console.log('Clearing patient name filter, loading all data');
                            setIsLoading(true);
                            loadReservations(1).finally(() => setIsLoading(false));
                          }
                        }}
                        disabled={isLoading && currentSearchType === 'patient'}
                      />
                      {isLoading && currentSearchType === 'patient' && (
                        <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                          <div className="spinner-border spinner-border-sm text-primary" role="status">
                            <span className="visually-hidden">กำลังค้นหา...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </Form.Group>
                </Col>
                <Col md={2} className="d-flex align-items-end">
                  <Button 
                    variant="outline-secondary" 
                    onClick={handleClearFilters}
                    className="w-100"
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
                        ล้างตัวกรอง
                      </>
                    )}
                  </Button>
                </Col>
              </Row>

              {/* Table */}
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">กำลังโหลดข้อมูล...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>รหัส</th>
                        <th>สถานะ</th>
                        <th>หมู่เลือด</th>
                        <th>ชนิดเลือด</th>
                        <th>จำนวน</th>
                        <th>ผู้ป่วย</th>
                        <th>หน่วยงาน</th>
                        <th>วันที่จอง</th>
                        <th>ผู้จอง</th>
                        <th>การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                    {reservations.length > 0 ? (
                      reservations.map((reservation) => (
                        <tr 
                          key={reservation.id}
                          onClick={() => handleViewDetails(reservation.id)}
                          style={{ cursor: 'pointer' }}
                          className="table-row-hover"
                        >
                          <td>
                            <strong>#{reservation.id}</strong>
                          </td>
                          <td>
                            <Badge bg={getStatusBadgeVariant(reservation.status as ReservationStatus)}>
                              รอดำเนินการ
                            </Badge>
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
                          <td onClick={(e) => e.stopPropagation()}>
                            <Button
                              className="btn btn-sm btn-success me-1"
                              onClick={() => handleDispenseBlood(reservation)}
                              title="ทำจ่ายเลือด"
                            >
                              <i className="fas fa-hand-holding-medical me-1"></i>จ่าย
                            </Button>
                            <Button
                              className="btn btn-sm btn-warning"
                              onClick={() => handleCancelByDispenser(reservation)}
                              title="ยกเลิกโดยผู้จ่าย"
                            >
                              <i className="fas fa-times me-1"></i>ยกเลิก
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="text-center py-4 text-muted">
                          <div className="py-3">
                            {(idFilter || departmentFilter || bloodGroupFilter || patientNameFilter) ? (
                              <>
                                <h5>ไม่พบรายการตามเงื่อนไขที่เลือก</h5>
                                <p>ลองเปลี่ยน filter หรือเคลียร์ filter เพื่อดูรายการทั้งหมด</p>
                              </>
                            ) : (
                              <>
                                <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                                <h5>ไม่มีรายการรอจ่าย</h5>
                                <p>ขณะนี้ไม่มีการจองที่รอดำเนินการ</p>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                    </tbody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              <PaginationComponent
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                loading={loading}
                showInfo={true}
                className="mt-4"
              />
            </Card.Body>
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

      <style>{`
        .table-row-hover:hover {
          background-color: #f8f9fa !important;
        }
        
        .table th {
          border-top: none;
          font-weight: 600;
          color: #495057;
          background-color: #f8f9fa;
        }
        
        .pagination .page-link {
          color: #6c757d;
        }
        
        .pagination .page-item.active .page-link {
          background-color: #0d6efd;
          border-color: #0d6efd;
        }
        
        .card-header h4 {
          color: #495057;
        }
      `}</style>

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
          
          {reservationToCancel && (
            <div className="mb-3">
              <strong>ข้อมูลการจอง:</strong>
              <p>รหัสการจอง: #{reservationToCancel.id}</p>
              <p>ผู้ป่วย: {reservationToCancel.patient_name}</p>
              <p>กรุ๊ปเลือด: {reservationToCancel.blood_group} {reservationToCancel.rh_factor}</p>
              <p>จำนวน: {reservationToCancel.quantity} หน่วย</p>
            </div>
          )}

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
            onClick={confirmCancelByDispenser}
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

export default PendingDispenseList;