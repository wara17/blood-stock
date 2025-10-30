const pool = require('../config/database');

class BloodReservation {
  // Get all reservations with user information
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT 
          br.*,
          u.firstname || ' ' || u.lastname as reserved_by,
          ap.firstname || ' ' || ap.lastname as approved_by_username,
          cp.firstname || ' ' || cp.lastname as completed_by_username,
          cn.firstname || ' ' || cn.lastname as cancelled_by_username
        FROM blood_reservations br
        JOIN users u ON br.user_id = u.id
        LEFT JOIN users ap ON br.approved_by = ap.id
        LEFT JOIN users cp ON br.completed_by = cp.id
        LEFT JOIN users cn ON br.cancelled_by = cn.id
        WHERE 1=1
      `;
      
      const params = [];
      let paramIndex = 1;

      // Add filters
      if (filters.status) {
        query += ` AND br.status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }

      if (filters.blood_group) {
        query += ` AND br.blood_group = $${paramIndex}`;
        params.push(filters.blood_group);
        paramIndex++;
      }

      if (filters.department) {
        query += ` AND br.department = $${paramIndex}`;
        params.push(filters.department);
        paramIndex++;
      }

      if (filters.user_id) {
        query += ` AND br.user_id = $${paramIndex}`;
        params.push(filters.user_id);
        paramIndex++;
      }

      if (filters.id) {
        query += ` AND br.id::text LIKE $${paramIndex}`;
        params.push(`%${filters.id}%`);
        paramIndex++;
      }

      if (filters.patient_name) {
        query += ` AND br.patient_name ILIKE $${paramIndex}`;
        params.push(`%${filters.patient_name}%`);
        paramIndex++;
      }

      // Add ordering
      query += ` ORDER BY br.created_at DESC`;

      // Add pagination
      if (filters.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(filters.limit);
        paramIndex++;
      }

      if (filters.offset) {
        query += ` OFFSET $${paramIndex}`;
        params.push(filters.offset);
      }

      const result = await pool.query(query, params);

      // Get total count for pagination (without limit/offset)
      const countFilters = { ...filters };
      delete countFilters.limit;
      delete countFilters.offset;
      const totalCount = await this.getTotalCount(countFilters);

      return {
        data: result.rows,
        total: totalCount,
        page: Math.floor((filters.offset || 0) / (filters.limit || 10)) + 1,
        limit: filters.limit || result.rows.length
      };
    } catch (error) {
      throw error;
    }
  }

  // Get reservation by ID
  static async getById(id) {
    try {
      const query = `
        SELECT 
          br.*,
          u.firstname || ' ' || u.lastname as reserved_by,
          ap.firstname || ' ' || ap.lastname as approved_by_username,
          cp.firstname || ' ' || cp.lastname as completed_by_username,
          cn.firstname || ' ' || cn.lastname as cancelled_by_username
        FROM blood_reservations br
        JOIN users u ON br.user_id = u.id
        LEFT JOIN users ap ON br.approved_by = ap.id
        LEFT JOIN users cp ON br.completed_by = cp.id
        LEFT JOIN users cn ON br.cancelled_by = cn.id
        WHERE br.id = $1
      `;
      
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Create new reservation
  static async create(reservationData) {
    try {
      const {
        blood_group,
        blood_type,
        rh_factor,
        quantity,
        patient_name,
        department,
        user_id,
        notes
      } = reservationData;

      // Import BloodInventory model for availability check
      const BloodInventoryModel = require('./BloodInventory');

      // Check availability before creating reservation
      const availabilityCheck = await BloodInventoryModel.checkAvailability(
        blood_type,
        blood_group,
        rh_factor,
        quantity
      );

      if (!availabilityCheck.available) {
        let errorMessage = `ไม่มีเลือดเพียงพอสำหรับการจอง ต้องการ ${quantity} ถุง แต่มีเพียง ${availabilityCheck.availableCount} ถุง`;
        
        // Add detailed breakdown
        errorMessage += ` (มีในคลัง: ${availabilityCheck.totalCount} ถุง, จองรออยู่: ${availabilityCheck.pendingCount} ถุง`;
        
        if (availabilityCheck.reservedUnits > 0) {
          errorMessage += `, สำรองไว้: ${availabilityCheck.reservedUnits} ถุง`;
        }
        
        errorMessage += ')';
        
        const error = new Error(errorMessage);
        error.code = 'INSUFFICIENT_BLOOD_INVENTORY';
        error.details = availabilityCheck;
        throw error;
      }

      const query = `
        INSERT INTO blood_reservations 
        (blood_group, blood_type, rh_factor, quantity, patient_name, department, user_id, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const result = await pool.query(query, [
        blood_group,
        blood_type,
        rh_factor,
        quantity,
        patient_name,
        department,
        user_id,
        notes
      ]);

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Update reservation
  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];
      let paramIndex = 1;

      // Build dynamic update query
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          fields.push(`${key} = $${paramIndex}`);
          values.push(updateData[key]);
          paramIndex++;
        }
      });

      // Always update the updated_at timestamp
      fields.push(`updated_at = CURRENT_TIMESTAMP`);

      if (fields.length === 1) { // Only updated_at field
        throw new Error('No fields to update');
      }

      const query = `
        UPDATE blood_reservations 
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      values.push(id);
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Update reservation status
  static async updateStatus(id, status, userId = null, notes = null, cancellationNotes = null) {
    try {
      let query;
      let params;

      if (status === 'approved' && userId) {
        if (notes) {
          query = `
            UPDATE blood_reservations 
            SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP, notes = $3, updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING *
          `;
          params = [status, userId, notes, id];
        } else {
          query = `
            UPDATE blood_reservations 
            SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
          `;
          params = [status, userId, id];
        }
      } else if (status === 'completed') {
        if (notes) {
          query = `
            UPDATE blood_reservations 
            SET status = $1, completed_by = $2, completed_at = CURRENT_TIMESTAMP, notes = $3, updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING *
          `;
          params = [status, userId, notes, id];
        } else {
          query = `
            UPDATE blood_reservations 
            SET status = $1, completed_by = $2, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
          `;
          params = [status, userId, id];
        }
      } else if (status === 'cancelled' || status === 'cancelled_by_dispenser') {
        // Handle both cancellation types with separate notes
        const updateFields = ['status = $1', 'cancelled_by = $2', 'cancelled_at = CURRENT_TIMESTAMP', 'updated_at = CURRENT_TIMESTAMP'];
        params = [status, userId];
        let paramIndex = 3;

        // Add regular notes if provided
        if (notes) {
          updateFields.push(`notes = $${paramIndex}`);
          params.push(notes);
          paramIndex++;
        }

        // Add cancellation notes if provided
        if (cancellationNotes) {
          updateFields.push(`cancellation_notes = $${paramIndex}`);
          params.push(cancellationNotes);
          paramIndex++;
        }

        query = `
          UPDATE blood_reservations 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING *
        `;
        params.push(id);
      } else {
        if (notes) {
          query = `
            UPDATE blood_reservations 
            SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
          `;
          params = [status, notes, id];
        } else {
          query = `
            UPDATE blood_reservations 
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
          `;
          params = [status, id];
        }
      }

      const result = await pool.query(query, params);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Delete reservation
  static async delete(id) {
    try {
      const query = 'DELETE FROM blood_reservations WHERE id = $1 RETURNING *';
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get reservation statistics
  static async getStats() {
    try {
      const query = `
        SELECT 
          status,
          COUNT(*) as count,
          blood_group,
          department
        FROM blood_reservations 
        GROUP BY status, blood_group, department
        ORDER BY status, blood_group, department
      `;
      
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get user's reservations
  static async getByUserId(userId, filters = {}) {
    try {
      let query = `
        SELECT 
          br.*,
          u.firstname || ' ' || u.lastname as reserved_by,
          ap.firstname || ' ' || ap.lastname as approved_by_username,
          cp.firstname || ' ' || cp.lastname as completed_by_username,
          cn.firstname || ' ' || cn.lastname as cancelled_by_username
        FROM blood_reservations br
        JOIN users u ON br.user_id = u.id
        LEFT JOIN users ap ON br.approved_by = ap.id
        LEFT JOIN users cp ON br.completed_by = cp.id
        LEFT JOIN users cn ON br.cancelled_by = cn.id
        WHERE br.user_id = $1
      `;
      
      const params = [userId];
      let paramIndex = 2;

      if (filters.status) {
        query += ` AND br.status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }

      query += ` ORDER BY br.created_at DESC`;

      if (filters.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(filters.limit);
      }

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get total count for pagination
  static async getTotalCount(filters = {}) {
    try {
      let query = `
        SELECT COUNT(*) as total
        FROM blood_reservations br
        WHERE 1=1
      `;
      
      const params = [];
      let paramIndex = 1;

      // Add same filters as getAll
      if (filters.status) {
        query += ` AND br.status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }

      if (filters.blood_group) {
        query += ` AND br.blood_group = $${paramIndex}`;
        params.push(filters.blood_group);
        paramIndex++;
      }

      if (filters.department) {
        query += ` AND br.department = $${paramIndex}`;
        params.push(filters.department);
        paramIndex++;
      }

      if (filters.user_id) {
        query += ` AND br.user_id = $${paramIndex}`;
        params.push(filters.user_id);
        paramIndex++;
      }

      if (filters.id) {
        query += ` AND br.id::text LIKE $${paramIndex}`;
        params.push(`%${filters.id}%`);
        paramIndex++;
      }

      if (filters.patient_name) {
        query += ` AND br.patient_name ILIKE $${paramIndex}`;
        params.push(`%${filters.patient_name}%`);
        paramIndex++;
      }

      const result = await pool.query(query, params);
      return parseInt(result.rows[0].total);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = BloodReservation;