const { body, validationResult, param, query } = require('express-validator');
const BloodInventoryModel = require('../models/BloodInventory');

class BloodInventoryController {
  
  // Get all blood inventory
  static async getAll(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      const filters = {
        blood_type: req.query.blood_type,
        blood_group: req.query.blood_group,
        rh_factor: req.query.rh_factor,
        received_by: req.query.received_by,
        status: req.query.status
      };
      
      // Remove empty filters
      Object.keys(filters).forEach(key => {
        if (!filters[key]) delete filters[key];
      });
      
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;
      
      const pagination = { page, limit, offset };
      
      const result = await BloodInventoryModel.getAll(filters, pagination);
      
      res.json({
        success: true,
        message: 'Blood inventory retrieved successfully',
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit)
        }
      });
      
    } catch (error) {
      console.error('Error getting blood inventory:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  // Get blood inventory by ID
  static async getById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      const { id } = req.params;
      const bloodInventory = await BloodInventoryModel.getById(id);
      
      if (!bloodInventory) {
        return res.status(404).json({
          success: false,
          message: 'Blood inventory not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Blood inventory retrieved successfully',
        data: bloodInventory
      });
      
    } catch (error) {
      console.error('Error getting blood inventory by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  // Create new blood inventory
  static async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      const {
        received_date,
        blood_type,
        blood_group,
        rh_factor,
        bag_number,
        expiry_date,
        received_by
      } = req.body;
      
      // Check if bag number already exists
      const bagExists = await BloodInventoryModel.checkBagNumberExists(bag_number);
      if (bagExists) {
        return res.status(409).json({
          success: false,
          message: 'Bag number already exists'
        });
      }
      
      const bloodData = {
        received_date,
        blood_type,
        blood_group,
        rh_factor,
        bag_number,
        expiry_date,
        received_by
      };
      
      const newBloodInventory = await BloodInventoryModel.create(bloodData);
      
      res.status(201).json({
        success: true,
        message: 'Blood inventory created successfully',
        data: newBloodInventory
      });
      
    } catch (error) {
      console.error('Error creating blood inventory:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  // Update blood inventory
  static async update(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      const { id } = req.params;
      const {
        received_date,
        blood_type,
        blood_group,
        rh_factor,
        bag_number,
        expiry_date,
        received_by
      } = req.body;
      
      // Check if blood inventory exists
      const existingBlood = await BloodInventoryModel.getById(id);
      if (!existingBlood) {
        return res.status(404).json({
          success: false,
          message: 'Blood inventory not found'
        });
      }
      
      // Check if bag number already exists (excluding current record)
      const bagExists = await BloodInventoryModel.checkBagNumberExists(bag_number, id);
      if (bagExists) {
        return res.status(409).json({
          success: false,
          message: 'Bag number already exists'
        });
      }
      
      const bloodData = {
        received_date,
        blood_type,
        blood_group,
        rh_factor,
        bag_number,
        expiry_date,
        received_by
      };
      
      const updatedBloodInventory = await BloodInventoryModel.update(id, bloodData);
      
      res.json({
        success: true,
        message: 'Blood inventory updated successfully',
        data: updatedBloodInventory
      });
      
    } catch (error) {
      console.error('Error updating blood inventory:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  // Delete blood inventory
  static async delete(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      const { id } = req.params;
      
      const deletedBloodInventory = await BloodInventoryModel.delete(id);
      
      if (!deletedBloodInventory) {
        return res.status(404).json({
          success: false,
          message: 'Blood inventory not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Blood inventory deleted successfully',
        data: deletedBloodInventory
      });
      
    } catch (error) {
      console.error('Error deleting blood inventory:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  // Get blood inventory statistics
  static async getStatistics(req, res) {
    try {
      const statistics = await BloodInventoryModel.getStatistics();
      
      res.json({
        success: true,
        message: 'Blood inventory statistics retrieved successfully',
        data: statistics
      });
      
    } catch (error) {
      console.error('Error getting blood inventory statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get dashboard statistics grouped by blood type
  static async getDashboardStats(req, res) {
    try {
      const dashboardStats = await BloodInventoryModel.getDashboardStats();
      
      res.json({
        success: true,
        message: 'Dashboard statistics retrieved successfully',
        data: dashboardStats
      });
      
    } catch (error) {
      console.error('Error getting dashboard statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get blood group statistics for dashboard cards
  static async getBloodGroupStats(req, res) {
    try {
      const bloodGroupStats = await BloodInventoryModel.getBloodGroupStats();
      
      res.json({
        success: true,
        message: 'Blood group statistics retrieved successfully',
        data: bloodGroupStats
      });
      
    } catch (error) {
      console.error('Error getting blood group statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get status statistics for dashboard
  static async getStatusStats(req, res) {
    try {
      const [nearExpiry, reserved, usedToday] = await Promise.all([
        BloodInventoryModel.getNearExpiry(),
        BloodInventoryModel.getReservedCount(),
        BloodInventoryModel.getUsedToday()
      ]);
      
      res.json({
        success: true,
        message: 'Status statistics retrieved successfully',
        data: {
          nearExpiry,
          reserved,
          usedToday
        }
      });
      
    } catch (error) {
      console.error('Error getting status statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Update blood status
  static async updateStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { status, reserved_for, notes } = req.body;

      // Validate status transition
      if (status === 'reserved' && !reserved_for) {
        return res.status(400).json({
          success: false,
          message: 'Reserved for is required when setting status to reserved'
        });
      }

      const updatedBloodInventory = await BloodInventoryModel.updateStatus(id, status, reserved_for, notes);

      if (!updatedBloodInventory) {
        return res.status(404).json({
          success: false,
          message: 'Blood inventory not found or invalid status transition'
        });
      }

      res.json({
        success: true,
        message: 'Blood inventory status updated successfully',
        data: updatedBloodInventory
      });

    } catch (error) {
      console.error('Error updating blood inventory status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get available blood
  static async getAvailable(req, res) {
    try {
      const filters = {
        blood_type: req.query.blood_type,
        blood_group: req.query.blood_group,
        rh_factor: req.query.rh_factor
      };

      // Remove empty filters
      Object.keys(filters).forEach(key => {
        if (!filters[key]) delete filters[key];
      });

      const availableBlood = await BloodInventoryModel.getAvailable(filters);

      res.json({
        success: true,
        message: 'Available blood inventory retrieved successfully',
        data: availableBlood
      });

    } catch (error) {
      console.error('Error getting available blood inventory:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

// Validation middleware
const validateBloodInventory = [
  body('received_date')
    .notEmpty()
    .withMessage('Received date is required')
    .isISO8601()
    .withMessage('Received date must be a valid date'),
  
  body('blood_type')
    .notEmpty()
    .withMessage('Blood type is required')
    .isIn(['Whole blood', 'PRC', 'LPRC'])
    .withMessage('Blood type must be one of: Whole blood, PRC, LPRC'),
  
  body('blood_group')
    .notEmpty()
    .withMessage('Blood group is required')
    .isIn(['A', 'B', 'AB', 'O'])
    .withMessage('Blood group must be one of: A, B, AB, O'),
  
  body('rh_factor')
    .notEmpty()
    .withMessage('Rh factor is required')
    .isIn(['Positive', 'Negative'])
    .withMessage('Rh factor must be either Positive or Negative'),
  
  body('bag_number')
    .notEmpty()
    .withMessage('Bag number is required')
    .matches(/^\d{3}\.\d{2}\.\d{1}\.\d{5}$/)
    .withMessage('Bag number must be in format xxx.xx.x.xxxxx'),
  
  body('expiry_date')
    .notEmpty()
    .withMessage('Expiry date is required')
    .isISO8601()
    .withMessage('Expiry date must be a valid date')
    .custom((value, { req }) => {
      const expiryDate = new Date(value);
      const receivedDate = new Date(req.body.received_date);
      if (expiryDate <= receivedDate) {
        throw new Error('Expiry date must be after received date');
      }
      return true;
    }),
  
  body('received_by')
    .notEmpty()
    .withMessage('Received by is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Received by must be between 2 and 100 characters')
];

const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer')
];

const validateQuery = [
  query('blood_type')
    .optional()
    .isIn(['Whole blood', 'PRC', 'LPRC'])
    .withMessage('Blood type must be one of: Whole blood, PRC, LPRC'),
  
  query('blood_group')
    .optional()
    .isIn(['A', 'B', 'AB', 'O'])
    .withMessage('Blood group must be one of: A, B, AB, O'),
  
  query('rh_factor')
    .optional()
    .isIn(['Positive', 'Negative'])
    .withMessage('Rh factor must be either Positive or Negative'),
  
  query('status')
    .optional()
    .isIn(['available', 'reserved', 'used', 'expired'])
    .withMessage('Status must be one of: available, reserved, used, expired'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Validation for status update
const validateStatusUpdate = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),
  
  body('status')
    .isIn(['available', 'reserved', 'used', 'expired'])
    .withMessage('Status must be one of: available, reserved, used, expired'),
  
  body('reserved_for')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Reserved for must be between 1 and 100 characters'),
  
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
];

module.exports = {
  BloodInventoryController,
  validateBloodInventory,
  validateId,
  validateQuery,
  validateStatusUpdate
};