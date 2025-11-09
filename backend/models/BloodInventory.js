const { pool } = require('../config/database');

class BloodInventoryModel {
  
  // Get all blood inventory with pagination and filters
  static async getAll(filters = {}, pagination = {}) {
    const client = await pool.connect();
    
    try {
      let query = `
        SELECT 
          id,
          received_date,
          blood_type,
          blood_group,
          rh_factor,
          bag_number,
          expiry_date,
          received_by,
          status,
          reserved_for,
          reserved_at,
          used_at,
          notes,
          created_at,
          updated_at
        FROM blood_inventory
        WHERE 1=1
      `;
      
      const queryParams = [];
      let paramCount = 0;
      
      // Apply filters
      if (filters.blood_type) {
        paramCount++;
        query += ` AND blood_type = $${paramCount}`;
        queryParams.push(filters.blood_type);
      }
      
      if (filters.blood_group) {
        paramCount++;
        query += ` AND blood_group = $${paramCount}`;
        queryParams.push(filters.blood_group);
      }
      
      if (filters.rh_factor) {
        paramCount++;
        query += ` AND rh_factor = $${paramCount}`;
        queryParams.push(filters.rh_factor);
      }
      
      if (filters.received_by) {
        paramCount++;
        query += ` AND received_by ILIKE $${paramCount}`;
        queryParams.push(`%${filters.received_by}%`);
      }
      
      if (filters.status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        queryParams.push(filters.status);
      }
      
      // Add ordering
      query += ` ORDER BY received_date DESC, created_at DESC`;
      
      // Add pagination
      if (pagination.limit) {
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        queryParams.push(pagination.limit);
        
        if (pagination.offset) {
          paramCount++;
          query += ` OFFSET $${paramCount}`;
          queryParams.push(pagination.offset);
        }
      }
      
      const result = await client.query(query, queryParams);
      
      // Get total count for pagination
      let countQuery = `SELECT COUNT(*) FROM blood_inventory WHERE 1=1`;
      const countParams = [];
      let countParamCount = 0;
      
      if (filters.blood_type) {
        countParamCount++;
        countQuery += ` AND blood_type = $${countParamCount}`;
        countParams.push(filters.blood_type);
      }
      
      if (filters.blood_group) {
        countParamCount++;
        countQuery += ` AND blood_group = $${countParamCount}`;
        countParams.push(filters.blood_group);
      }
      
      if (filters.rh_factor) {
        countParamCount++;
        countQuery += ` AND rh_factor = $${countParamCount}`;
        countParams.push(filters.rh_factor);
      }
      
      if (filters.received_by) {
        countParamCount++;
        countQuery += ` AND received_by ILIKE $${countParamCount}`;
        countParams.push(`%${filters.received_by}%`);
      }
      
      if (filters.status) {
        countParamCount++;
        countQuery += ` AND status = $${countParamCount}`;
        countParams.push(filters.status);
      }
      
      const countResult = await client.query(countQuery, countParams);
      const totalCount = parseInt(countResult.rows[0].count);
      
      return {
        data: result.rows,
        total: totalCount,
        page: pagination.page || 1,
        limit: pagination.limit || result.rows.length
      };
      
    } finally {
      client.release();
    }
  }
  
  // Get single blood inventory by ID
  static async getById(id) {
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM blood_inventory WHERE id = $1',
        [id]
      );
      
      return result.rows[0] || null;
      
    } finally {
      client.release();
    }
  }
  
  // Create new blood inventory entry
  static async create(bloodData) {
    const client = await pool.connect();
    
    try {
      const {
        received_date,
        blood_type,
        blood_group,
        rh_factor,
        bag_number,
        expiry_date,
        received_by,
        status = 'available',
        reserved_for = null,
        notes = null
      } = bloodData;
      
      const result = await client.query(
        `INSERT INTO blood_inventory 
         (received_date, blood_type, blood_group, rh_factor, bag_number, expiry_date, received_by, status, reserved_for, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [received_date, blood_type, blood_group, rh_factor, bag_number, expiry_date, received_by, status, reserved_for, notes]
      );
      
      return result.rows[0];
      
    } finally {
      client.release();
    }
  }
  
  // Update blood inventory entry
  static async update(id, bloodData) {
    const client = await pool.connect();
    
    try {
      const {
        received_date,
        blood_type,
        blood_group,
        rh_factor,
        bag_number,
        expiry_date,
        received_by,
        status,
        reserved_for,
        notes
      } = bloodData;
      
      const result = await client.query(
        `UPDATE blood_inventory 
         SET received_date = $1, blood_type = $2, blood_group = $3, 
             rh_factor = $4, bag_number = $5, expiry_date = $6, received_by = $7,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $8
         RETURNING *`,
        [received_date, blood_type, blood_group, rh_factor, bag_number, expiry_date, received_by, id]
      );
      
      return result.rows[0] || null;
      
    } finally {
      client.release();
    }
  }
  
  // Delete blood inventory entry
  static async delete(id) {
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'DELETE FROM blood_inventory WHERE id = $1 RETURNING *',
        [id]
      );
      
      return result.rows[0] || null;
      
    } finally {
      client.release();
    }
  }
  
  // Check if bag number exists
  static async checkBagNumberExists(bagNumber, excludeId = null) {
    const client = await pool.connect();
    
    try {
      let query = 'SELECT id FROM blood_inventory WHERE bag_number = $1';
      const params = [bagNumber];
      
      if (excludeId) {
        query += ' AND id != $2';
        params.push(excludeId);
      }
      
      const result = await client.query(query, params);
      return result.rows.length > 0;
      
    } finally {
      client.release();
    }
  }
  
  // Get blood inventory statistics
  static async getStatistics() {
    const client = await pool.connect();
    
    try {
      const totalQuery = 'SELECT COUNT(*) as total FROM blood_inventory';
      const byTypeQuery = `
        SELECT blood_type, COUNT(*) as count 
        FROM blood_inventory 
        GROUP BY blood_type 
        ORDER BY blood_type
      `;
      const byGroupQuery = `
        SELECT blood_group, rh_factor, COUNT(*) as count 
        FROM blood_inventory 
        GROUP BY blood_group, rh_factor 
        ORDER BY blood_group, rh_factor
      `;
      const byStatusQuery = `
        SELECT status, COUNT(*) as count 
        FROM blood_inventory 
        GROUP BY status 
        ORDER BY status
      `;
      const expiringQuery = `
        SELECT COUNT(*) as count 
        FROM blood_inventory 
        WHERE expiry_date <= CURRENT_DATE + INTERVAL '7 days' AND status = 'available'
      `;
      
      const [totalResult, byTypeResult, byGroupResult, byStatusResult, expiringResult] = await Promise.all([
        client.query(totalQuery),
        client.query(byTypeQuery),
        client.query(byGroupQuery),
        client.query(byStatusQuery),
        client.query(expiringQuery)
      ]);
      
      return {
        total: parseInt(totalResult.rows[0].total),
        byType: byTypeResult.rows,
        byGroup: byGroupResult.rows,
        byStatus: byStatusResult.rows,
        expiringSoon: parseInt(expiringResult.rows[0].count)
      };
      
    } finally {
      client.release();
    }
  }

  // Get blood inventory statistics grouped by type and blood group for dashboard
  static async getDashboardStats() {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          blood_type,
          blood_group,
          rh_factor,
          COUNT(*) as count
        FROM blood_inventory 
        WHERE status = 'available'
        GROUP BY blood_type, blood_group, rh_factor
        ORDER BY blood_type, blood_group, rh_factor
      `;
      
      const result = await client.query(query);
      
      // Group data by blood_type
      const groupedData = {
        'Whole blood': {},
        'PRC': {},
        'LPRC': {}
      };
      
      // Initialize all combinations
      ['A', 'B', 'AB', 'O'].forEach(group => {
        ['Positive', 'Negative'].forEach(rh => {
          groupedData['Whole blood'][`${group}_${rh}`] = 0;
          groupedData['PRC'][`${group}_${rh}`] = 0;
          groupedData['LPRC'][`${group}_${rh}`] = 0;
        });
      });
      
      // Fill with actual data
      result.rows.forEach(row => {
        const key = `${row.blood_group}_${row.rh_factor}`;
        if (groupedData[row.blood_type]) {
          groupedData[row.blood_type][key] = parseInt(row.count);
        }
      });
      
      return groupedData;
      
    } finally {
      client.release();
    }
  }

  // Get blood inventory grouped by blood groups for dashboard
  static async getBloodGroupStats() {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          blood_group,
          blood_type,
          rh_factor,
          COUNT(*) as count
        FROM blood_inventory 
        WHERE status = 'available'
        GROUP BY blood_group, blood_type, rh_factor
        ORDER BY blood_group, blood_type, rh_factor
      `;
      
      const result = await client.query(query);
      
      // Initialize data structure
      const groupedData = {
        A: { 'Whole_Positive': 0, 'Whole_Negative': 0, 'PRC_Positive': 0, 'PRC_Negative': 0, 'LPRC_Positive': 0, 'LPRC_Negative': 0 },
        B: { 'Whole_Positive': 0, 'Whole_Negative': 0, 'PRC_Positive': 0, 'PRC_Negative': 0, 'LPRC_Positive': 0, 'LPRC_Negative': 0 },
        AB: { 'Whole_Positive': 0, 'Whole_Negative': 0, 'PRC_Positive': 0, 'PRC_Negative': 0, 'LPRC_Positive': 0, 'LPRC_Negative': 0 },
        O: { 'Whole_Positive': 0, 'Whole_Negative': 0, 'PRC_Positive': 0, 'PRC_Negative': 0, 'LPRC_Positive': 0, 'LPRC_Negative': 0 }
      };
      
      // Fill with actual data
      result.rows.forEach(row => {
        const bloodGroup = row.blood_group;
        const bloodType = row.blood_type === 'Whole blood' ? 'Whole' : row.blood_type;
        const rhFactor = row.rh_factor;
        const key = `${bloodType}_${rhFactor}`;
        
        if (groupedData[bloodGroup] && groupedData[bloodGroup][key] !== undefined) {
          groupedData[bloodGroup][key] = parseInt(row.count);
        }
      });
      
      return groupedData;
      
    } finally {
      client.release();
    }
  }

  // Update blood status
  static async updateStatus(id, status, reservedFor = null, notes = null) {
    const client = await pool.connect();
    
    try {
      let query, params;
      
      if (status === 'reserved') {
        query = `
          UPDATE blood_inventory 
          SET status = $1, reserved_for = $2, reserved_at = CURRENT_TIMESTAMP, notes = $3
          WHERE id = $4 AND status = 'available'
          RETURNING *
        `;
        params = [status, reservedFor, notes, id];
      } else if (status === 'used') {
        query = `
          UPDATE blood_inventory 
          SET status = $1, used_at = CURRENT_TIMESTAMP, notes = $2,
              reserved_for = NULL, reserved_at = NULL
          WHERE id = $3 AND status IN ('available', 'reserved')
          RETURNING *
        `;
        params = [status, notes, id];
      } else if (status === 'available') {
        query = `
          UPDATE blood_inventory 
          SET status = $1, reserved_for = NULL, reserved_at = NULL, notes = $2
          WHERE id = $3 AND status = 'reserved'
          RETURNING *
        `;
        params = [status, notes, id];
      } else {
        throw new Error('Invalid status transition');
      }
      
      const result = await client.query(query, params);
      return result.rows[0] || null;
      
    } finally {
      client.release();
    }
  }

  // Get available blood by type and group
  static async getAvailable(filters = {}) {
    const client = await pool.connect();
    
    try {
      let query = `
        SELECT 
          id, received_date, blood_type, blood_group, rh_factor, 
          bag_number, expiry_date, received_by, notes
        FROM blood_inventory
        WHERE status = 'available' AND expiry_date > CURRENT_DATE
      `;
      
      const queryParams = [];
      let paramCount = 0;
      
      if (filters.blood_type) {
        paramCount++;
        query += ` AND blood_type = $${paramCount}`;
        queryParams.push(filters.blood_type);
      }
      
      if (filters.blood_group) {
        paramCount++;
        query += ` AND blood_group = $${paramCount}`;
        queryParams.push(filters.blood_group);
      }
      
      if (filters.rh_factor) {
        paramCount++;
        query += ` AND rh_factor = $${paramCount}`;
        queryParams.push(filters.rh_factor);
      }
      
      query += ` ORDER BY expiry_date ASC, received_date ASC`;
      
      const result = await client.query(query, queryParams);
      return result.rows;
      
    } finally {
      client.release();
    }
  }

  // Get blood inventory near expiry (within 7 days)
  static async getNearExpiry() {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM blood_inventory 
        WHERE status = 'available' 
        AND expiry_date <= CURRENT_DATE + INTERVAL '7 days'
        AND expiry_date > CURRENT_DATE
      `;
      
      const result = await client.query(query);
      return parseInt(result.rows[0].count) || 0;
      
    } finally {
      client.release();
    }
  }

  // Get reserved blood inventory count
  static async getReservedCount() {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM blood_inventory 
        WHERE status = 'reserved'
      `;
      
      const result = await client.query(query);
      return parseInt(result.rows[0].count) || 0;
      
    } finally {
      client.release();
    }
  }

  // Get blood inventory used today
  static async getUsedToday() {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM blood_inventory 
        WHERE status = 'used'
        AND DATE(used_at) = CURRENT_DATE
      `;
      
      const result = await client.query(query);
      return parseInt(result.rows[0].count) || 0;
      
    } finally {
      client.release();
    }
  }

  // Check availability for reservation
  static async checkAvailability(blood_type, blood_group, rh_factor, requiredQuantity) {
    const client = await pool.connect();
    
    try {
      // Get available count from inventory
      const inventoryQuery = `
        SELECT COUNT(*) as available_count
        FROM blood_inventory 
        WHERE status = 'available' 
        AND expiry_date > CURRENT_DATE
        AND blood_type = $1
        AND blood_group = $2
        AND rh_factor = $3
      `;
      
      const inventoryResult = await client.query(inventoryQuery, [blood_type, blood_group, rh_factor]);
      const availableCount = parseInt(inventoryResult.rows[0].available_count) || 0;
      
      // Get pending reservations count
      const pendingQuery = `
        SELECT COALESCE(SUM(quantity), 0) as pending_count
        FROM blood_reservations 
        WHERE status = 'pending'
        AND blood_type = $1
        AND blood_group = $2
        AND rh_factor = $3
      `;
      
      const pendingResult = await client.query(pendingQuery, [blood_type, blood_group, rh_factor]);
      const pendingCount = parseInt(pendingResult.rows[0].pending_count) || 0;
      
      // Calculate actual available after pending reservations
      let actualAvailable = Math.max(0, availableCount - pendingCount);
      
      // Special rule for blood group O: always reserve 2 units
      let effectiveAvailableCount = actualAvailable;
      if (blood_group === 'O') {
        effectiveAvailableCount = Math.max(0, actualAvailable - 2); // Reserve 2 units for emergency
      }
      
      return {
        available: effectiveAvailableCount >= requiredQuantity,
        availableCount: effectiveAvailableCount,
        totalCount: availableCount,
        pendingCount: pendingCount,
        actualAvailable: actualAvailable,
        requiredQuantity,
        reservedUnits: blood_group === 'O' ? 2 : 0
      };
      
    } finally {
      client.release();
    }
  }
}

module.exports = BloodInventoryModel;