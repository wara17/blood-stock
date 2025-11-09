const express = require('express');
const router = express.Router();
const { BloodReservation } = require('../models/BloodReservation');
const ReservationBloodBagsModel = require('../models/ReservationBloodBags');
const BloodInventoryModel = require('../models/BloodInventory');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all reservations (with optional filters)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      status,
      blood_group,
      department,
      id,
      patient_name,
      page = 1,
      limit = 10,
      user_id
    } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (blood_group) filters.blood_group = blood_group;
    if (department) filters.department = department;
    if (id) filters.id = id;
    if (patient_name) filters.patient_name = patient_name;
    if (user_id) filters.user_id = user_id;

    // Pagination
    const offset = (page - 1) * limit;
    filters.limit = parseInt(limit);
    filters.offset = offset;

    const result = await BloodReservation.getAll(filters);

    res.json({
      success: true,
      data: result.data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.total,
        totalPages: Math.ceil(result.total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการจอง',
      error: error.message
    });
  }
});

// Get pending reservations count (จำนวนรายการจอง)
router.get('/pending-count', authenticateToken, async (req, res) => {
  try {
    const { pool } = require('../config/database');
    
    console.log('🔍 Getting pending reservations count...');
    
    const countQuery = `
      SELECT COUNT(*) as count
      FROM blood_reservations 
      WHERE status = 'pending'
    `;
    
    const totalQuantityQuery = `
      SELECT SUM(quantity) as total_quantity
      FROM blood_reservations 
      WHERE status = 'pending'
    `;
    
    console.log('📝 Executing count query:', countQuery);
    console.log('📝 Executing total quantity query:', totalQuantityQuery);
    
    const [countResult, quantityResult] = await Promise.all([
      pool.query(countQuery),
      pool.query(totalQuantityQuery)
    ]);
    
    const pendingCount = parseInt(countResult.rows[0].count) || 0;
    const totalQuantity = parseInt(quantityResult.rows[0].total_quantity) || 0;
    
    console.log('📊 Pending reservations count:', pendingCount);
    console.log('📊 Total quantity:', totalQuantity);
    
    res.json({
      success: true,
      data: {
        count: pendingCount,          // จำนวนรายการจอง
        totalQuantity: totalQuantity  // จำนวนถุงเลือดรวม
      }
    });
  } catch (error) {
    console.error('❌ Error getting pending reservations count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending reservations count'
    });
  }
});

// Get reservation by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await BloodReservation.getById(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบการจองที่ระบุ'
      });
    }

    res.json({
      success: true,
      data: reservation
    });
  } catch (error) {
    console.error('Error fetching reservation:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการจอง',
      error: error.message
    });
  }
});

// Check blood availability for reservation
router.post('/check-availability', authenticateToken, async (req, res) => {
  try {
    const { blood_type, blood_group, rh_factor, quantity } = req.body;

    if (!blood_type || !blood_group || !rh_factor || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน'
      });
    }

    const BloodInventoryModel = require('../models/BloodInventory');
    const availabilityCheck = await BloodInventoryModel.checkAvailability(
      blood_type,
      blood_group,
      rh_factor,
      parseInt(quantity)
    );

    res.json({
      success: true,
      message: availabilityCheck.available ? 'มีเลือดเพียงพอสำหรับการจอง' : 'เลือดไม่เพียงพอสำหรับการจอง',
      data: availabilityCheck
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบความพร้อมใช้งาน',
      error: error.message
    });
  }
});

// Create new reservation
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      blood_group,
      blood_type,
      rh_factor,
      quantity,
      patient_name,
      department,
      notes
    } = req.body;

    // Validation
    if (!blood_group || !blood_type || !rh_factor || !quantity || !patient_name || !department) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน'
      });
    }

    const reservationData = {
      blood_group,
      blood_type,
      rh_factor,
      quantity: parseInt(quantity),
      patient_name,
      department,
      user_id: req.user.id, // From auth middleware
      notes
    };

    const newReservation = await BloodReservation.create(reservationData);

    res.status(201).json({
      success: true,
      message: 'สร้างการจองเรียบร้อยแล้ว',
      data: newReservation
    });
  } catch (error) {
    console.error('Error creating reservation:', error);
    
    // Handle insufficient inventory error
    if (error.code === 'INSUFFICIENT_BLOOD_INVENTORY') {
      return res.status(400).json({
        success: false,
        message: error.message,
        error: 'INSUFFICIENT_BLOOD_INVENTORY',
        details: error.details
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างการจอง',
      error: error.message
    });
  }
});

// Update reservation
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if reservation exists
    const existingReservation = await BloodReservation.getById(id);
    if (!existingReservation) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบการจองที่ระบุ'
      });
    }

    // Check if user owns the reservation or is admin
    if (existingReservation.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์แก้ไขการจองนี้'
      });
    }

    const updatedReservation = await BloodReservation.update(id, updateData);

    res.json({
      success: true,
      message: 'อัปเดตการจองเรียบร้อยแล้ว',
      data: updatedReservation
    });
  } catch (error) {
    console.error('Error updating reservation:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตการจอง',
      error: error.message
    });
  }
});

// Update reservation status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, cancellation_notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุสถานะ'
      });
    }

    const validStatuses = ['pending', 'approved', 'rejected', 'completed', 'cancelled', 'cancelled_by_dispenser'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'สถานะไม่ถูกต้อง'
      });
    }

    const reservation = await BloodReservation.getById(id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบการจองที่ระบุ'
      });
    }

    const updatedReservation = await BloodReservation.updateStatus(id, status, req.user.id, notes, cancellation_notes);

    res.json({
      success: true,
      message: 'อัปเดตสถานะการจองเรียบร้อยแล้ว',
      data: updatedReservation
    });
  } catch (error) {
    console.error('Error updating reservation status:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะการจอง',
      error: error.message
    });
  }
});

// Delete reservation
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await BloodReservation.getById(id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบการจองที่ระบุ'
      });
    }

    // Check if user owns the reservation
    if (reservation.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์ลบการจองนี้'
      });
    }

    // Only allow deletion of pending or cancelled reservations
    if (!['pending', 'cancelled'].includes(reservation.status)) {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถลบการจองที่มีสถานะนี้ได้'
      });
    }

    await BloodReservation.delete(id);

    res.json({
      success: true,
      message: 'ลบการจองเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบการจอง',
      error: error.message
    });
  }
});

// Get reservation statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const stats = await BloodReservation.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching reservation stats:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงสถิติการจอง',
      error: error.message
    });
  }
});

// Get current user's reservations
router.get('/my/reservations', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 10 } = req.query;
    const filters = { limit: parseInt(limit) };
    if (status) filters.status = status;

    const reservations = await BloodReservation.getByUserId(req.user.id, filters);

    res.json({
      success: true,
      data: reservations
    });
  } catch (error) {
    console.error('Error fetching user reservations:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการจองของคุณ',
      error: error.message
    });
  }
});

// Get reservation details with dispensed blood bags
router.get('/details/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'Valid reservation ID is required'
      });
    }

    const reservationDetails = await ReservationBloodBagsModel.getReservationWithBloodBags(parseInt(id));

    if (!reservationDetails) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    res.json({
      success: true,
      message: 'Reservation details retrieved successfully',
      data: reservationDetails
    });

  } catch (error) {
    console.error('Get reservation details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reservation details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Dispense blood endpoint
router.post('/dispense', authenticateToken, [
  body('reservationId').isInt().withMessage('Reservation ID is required'),
  body('bloodBags').isArray().withMessage('Blood bags array is required'),
  body('bloodBags.*.id').isInt().withMessage('Blood bag ID is required'),
  body('dispensedBy').notEmpty().withMessage('Dispensed by is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { reservationId, bloodBags, dispensedBy, notes } = req.body;

    // Start transaction
    const { pool } = require('../config/database');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify reservation exists and is pending
      const reservation = await BloodReservation.getById(reservationId);
      if (!reservation) {
        throw new Error('Reservation not found');
      }

      if (reservation.status !== 'pending') {
        throw new Error('Only pending reservations can be dispensed');
      }

      // Verify blood bags quantity matches reservation
      if (bloodBags.length !== reservation.quantity) {
        throw new Error(`Expected ${reservation.quantity} blood bags, but received ${bloodBags.length}`);
      }

      // Update blood inventory status to 'used'
      for (const bloodBag of bloodBags) {
        await BloodInventoryModel.updateStatus(
          bloodBag.id, 
          'used', 
          reservation.patient_name, 
          `Dispensed for reservation #${reservationId} - ${reservation.patient_name} (${reservation.department})`
        );
      }

      // Create reservation blood bags records
      const dispensedRecords = await ReservationBloodBagsModel.createMultiple(
        reservationId,
        bloodBags,
        dispensedBy,
        notes
      );

      // Update reservation status to 'completed' with user who dispensed
      await BloodReservation.updateStatus(reservationId, 'completed', req.user.id, notes);

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Blood dispensed successfully',
        data: {
          reservation: await BloodReservation.getById(reservationId),
          dispensedBloodBags: dispensedRecords
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Dispense blood error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to dispense blood',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get pending reservations summary for inventory calculation
router.get('/pending-summary', authenticateToken, async (req, res) => {
  try {
    const { pool } = require('../config/database');
    
    console.log('🔍 Getting pending reservations summary...');
    
    const query = `
      SELECT 
        blood_type,
        blood_group,
        rh_factor,
        SUM(quantity) as quantity
      FROM blood_reservations 
      WHERE status = 'pending'
      GROUP BY blood_type, blood_group, rh_factor
      ORDER BY blood_group, blood_type, rh_factor
    `;
    
    console.log('📝 Executing query:', query);
    
    const result = await pool.query(query);
    
    console.log('📊 Query result rows count:', result.rows.length);
    console.log('📋 Raw data from database:', result.rows);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('❌ Error getting pending reservations summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending reservations summary'
    });
  }
});

module.exports = router;