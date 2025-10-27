const express = require('express');
const { 
  BloodInventoryController, 
  validateBloodInventory, 
  validateId, 
  validateQuery,
  validateStatusUpdate
} = require('../controllers/bloodInventoryController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/blood-inventory/statistics - Get blood inventory statistics
router.get('/statistics', BloodInventoryController.getStatistics);

// GET /api/blood-inventory/dashboard-stats - Get dashboard statistics grouped by blood type
router.get('/dashboard-stats', BloodInventoryController.getDashboardStats);

// GET /api/blood-inventory/blood-group-stats - Get blood group statistics for dashboard
router.get('/blood-group-stats', BloodInventoryController.getBloodGroupStats);

// GET /api/blood-inventory/status-stats - Get status statistics for dashboard
router.get('/status-stats', BloodInventoryController.getStatusStats);

// GET /api/blood-inventory/available - Get available blood inventory
router.get('/available', validateQuery, BloodInventoryController.getAvailable);

// GET /api/blood-inventory - Get all blood inventory with filters and pagination
router.get('/', validateQuery, BloodInventoryController.getAll);

// GET /api/blood-inventory/:id - Get blood inventory by ID
router.get('/:id', validateId, BloodInventoryController.getById);

// POST /api/blood-inventory - Create new blood inventory
router.post('/', validateBloodInventory, BloodInventoryController.create);

// PUT /api/blood-inventory/:id - Update blood inventory
router.put('/:id', validateId, validateBloodInventory, BloodInventoryController.update);

// PATCH /api/blood-inventory/:id/status - Update blood inventory status
router.patch('/:id/status', validateStatusUpdate, BloodInventoryController.updateStatus);

// DELETE /api/blood-inventory/:id - Delete blood inventory
router.delete('/:id', validateId, BloodInventoryController.delete);

module.exports = router;