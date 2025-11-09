const { DataTypes, Op } = require('sequelize');
const { sequelize, pool } = require('../config/database');

// Sequelize Model Definition
let BloodReservation, User;

if (sequelize) {
  // User model (for associations)
  User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    firstname: {
      type: DataTypes.STRING,
      allowNull: true
    },
    lastname: {
      type: DataTypes.STRING,
      allowNull: true
    },
    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'users',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  // Blood Reservation Sequelize model
  BloodReservation = sequelize.define('BloodReservation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    blood_group: {
      type: DataTypes.STRING,
      allowNull: false
    },
    blood_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    rh_factor: {
      type: DataTypes.STRING,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    patient_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    department: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending'
    },
    reservation_date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completed_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    cancelled_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancellation_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'blood_reservations',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Define associations
  BloodReservation.belongsTo(User, { 
    foreignKey: 'user_id', 
    as: 'reserved_by_user' 
  });
  BloodReservation.belongsTo(User, { 
    foreignKey: 'approved_by', 
    as: 'approved_by_user' 
  });
  BloodReservation.belongsTo(User, { 
    foreignKey: 'completed_by', 
    as: 'completed_by_user' 
  });
  BloodReservation.belongsTo(User, { 
    foreignKey: 'cancelled_by', 
    as: 'cancelled_by_user' 
  });

  User.hasMany(BloodReservation, { 
    foreignKey: 'user_id', 
    as: 'reservations' 
  });
}

// Legacy SQL implementation for fallback
class LegacyBloodReservation {
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

// Sequelize Model Wrapper
class BloodReservationModel {
  
  // Get all reservations with user information
  static async getAll(filters = {}) {
    try {
      if (!BloodReservation) {
        console.log('⚠️  Using legacy BloodReservation model');
        return await LegacyBloodReservation.getAll(filters);
      }

      console.log('✅ Using Sequelize BloodReservation model');
      
      const whereClause = {};
      const include = [
        {
          model: User,
          as: 'reserved_by_user',
          attributes: ['id', 'firstname', 'lastname']
        },
        {
          model: User,
          as: 'approved_by_user',
          attributes: ['id', 'firstname', 'lastname'],
          required: false
        },
        {
          model: User,
          as: 'completed_by_user',
          attributes: ['id', 'firstname', 'lastname'],
          required: false
        },
        {
          model: User,
          as: 'cancelled_by_user',
          attributes: ['id', 'firstname', 'lastname'],
          required: false
        }
      ];

      // Build where clause from filters
      if (filters.status) whereClause.status = filters.status;
      if (filters.blood_group) whereClause.blood_group = filters.blood_group;
      if (filters.department) whereClause.department = filters.department;
      if (filters.user_id) whereClause.user_id = filters.user_id;
      if (filters.id) {
        whereClause.id = {
          [Op.like]: `%${filters.id}%`
        };
      }
      if (filters.patient_name) {
        whereClause.patient_name = {
          [Op.iLike]: `%${filters.patient_name}%`
        };
      }

      const queryOptions = {
        where: whereClause,
        include,
        order: [['created_at', 'DESC']],
        raw: false,
        nest: true
      };

      // Handle pagination
      if (filters.limit) {
        queryOptions.limit = parseInt(filters.limit);
        if (filters.offset) {
          queryOptions.offset = parseInt(filters.offset);
        }
      }

      const { rows: data, count: total } = await BloodReservation.findAndCountAll(queryOptions);

      // Transform data to match legacy format
      const transformedData = data.map(reservation => {
        const reservationData = reservation.toJSON();
        return {
          ...reservationData,
          reserved_by: reservationData.reserved_by_user ? 
            `${reservationData.reserved_by_user.firstname} ${reservationData.reserved_by_user.lastname}` : null,
          approved_by_username: reservationData.approved_by_user ? 
            `${reservationData.approved_by_user.firstname} ${reservationData.approved_by_user.lastname}` : null,
          completed_by_username: reservationData.completed_by_user ? 
            `${reservationData.completed_by_user.firstname} ${reservationData.completed_by_user.lastname}` : null,
          cancelled_by_username: reservationData.cancelled_by_user ? 
            `${reservationData.cancelled_by_user.firstname} ${reservationData.cancelled_by_user.lastname}` : null
        };
      });

      return {
        data: transformedData,
        total,
        pagination: filters.limit ? {
          page: Math.floor((filters.offset || 0) / filters.limit) + 1,
          limit: filters.limit,
          total,
          totalPages: Math.ceil(total / filters.limit)
        } : null
      };

    } catch (error) {
      console.error('Error in BloodReservationModel.getAll:', error);
      throw error;
    }
  }

  // Get reservation by ID
  static async getById(id) {
    try {
      if (!BloodReservation) {
        return await LegacyBloodReservation.getById(id);
      }

      const reservation = await BloodReservation.findByPk(id, {
        include: [
          {
            model: User,
            as: 'reserved_by_user',
            attributes: ['id', 'firstname', 'lastname']
          },
          {
            model: User,
            as: 'approved_by_user',
            attributes: ['id', 'firstname', 'lastname'],
            required: false
          },
          {
            model: User,
            as: 'completed_by_user',
            attributes: ['id', 'firstname', 'lastname'],
            required: false
          },
          {
            model: User,
            as: 'cancelled_by_user',
            attributes: ['id', 'firstname', 'lastname'],
            required: false
          }
        ]
      });

      if (!reservation) return null;

      // Transform to match legacy format
      const reservationData = reservation.toJSON();
      return {
        ...reservationData,
        reserved_by: reservationData.reserved_by_user ? 
          `${reservationData.reserved_by_user.firstname} ${reservationData.reserved_by_user.lastname}` : null,
        approved_by_username: reservationData.approved_by_user ? 
          `${reservationData.approved_by_user.firstname} ${reservationData.approved_by_user.lastname}` : null,
        completed_by_username: reservationData.completed_by_user ? 
          `${reservationData.completed_by_user.firstname} ${reservationData.completed_by_user.lastname}` : null,
        cancelled_by_username: reservationData.cancelled_by_user ? 
          `${reservationData.cancelled_by_user.firstname} ${reservationData.cancelled_by_user.lastname}` : null
      };

    } catch (error) {
      console.error('Error in BloodReservationModel.getById:', error);
      throw error;
    }
  }

  // Create new reservation
  static async create(data) {
    try {
      if (!BloodReservation) {
        return await LegacyBloodReservation.create(data);
      }

      // Check blood availability first
      const BloodInventoryModel = require('./BloodInventory').BloodInventoryModel;
      if (BloodInventoryModel && BloodInventoryModel.checkAvailability) {
        const availability = await BloodInventoryModel.checkAvailability(
          data.blood_type,
          data.blood_group,
          data.rh_factor,
          data.quantity
        );

        if (!availability.available) {
          const error = new Error('Insufficient blood inventory for this reservation');
          error.code = 'INSUFFICIENT_BLOOD_INVENTORY';
          error.details = availability;
          throw error;
        }
      }

      const reservation = await BloodReservation.create(data);
      return reservation.toJSON();

    } catch (error) {
      console.error('Error in BloodReservationModel.create:', error);
      throw error;
    }
  }

  // Update reservation
  static async update(id, data) {
    try {
      if (!BloodReservation) {
        return await LegacyBloodReservation.update(id, data);
      }

      const [updatedRows] = await BloodReservation.update(data, {
        where: { id },
        returning: true
      });

      if (updatedRows === 0) {
        throw new Error('Reservation not found');
      }

      return await this.getById(id);

    } catch (error) {
      console.error('Error in BloodReservationModel.update:', error);
      throw error;
    }
  }

  // Update reservation status
  static async updateStatus(id, status, userId = null, notes = null, cancellationNotes = null) {
    try {
      if (!BloodReservation) {
        return await LegacyBloodReservation.updateStatus(id, status, userId, notes, cancellationNotes);
      }

      const updateData = { status };
      
      if (status === 'approved' && userId) {
        updateData.approved_by = userId;
        updateData.approved_at = new Date();
      } else if (status === 'completed' && userId) {
        updateData.completed_by = userId;
        updateData.completed_at = new Date();
      } else if (['cancelled', 'cancelled_by_dispenser'].includes(status)) {
        if (userId) updateData.cancelled_by = userId;
        updateData.cancelled_at = new Date();
        if (cancellationNotes) updateData.cancellation_notes = cancellationNotes;
      }

      if (notes) updateData.notes = notes;

      const [updatedRows] = await BloodReservation.update(updateData, {
        where: { id },
        returning: true
      });

      if (updatedRows === 0) {
        throw new Error('Reservation not found');
      }

      return await this.getById(id);

    } catch (error) {
      console.error('Error in BloodReservationModel.updateStatus:', error);
      throw error;
    }
  }

  // Delete reservation
  static async delete(id) {
    try {
      if (!BloodReservation) {
        return await LegacyBloodReservation.delete(id);
      }

      const deletedRows = await BloodReservation.destroy({
        where: { id }
      });

      if (deletedRows === 0) {
        throw new Error('Reservation not found');
      }

      return true;

    } catch (error) {
      console.error('Error in BloodReservationModel.delete:', error);
      throw error;
    }
  }

  // Get reservations by user ID
  static async getByUserId(userId, filters = {}) {
    try {
      if (!BloodReservation) {
        return await LegacyBloodReservation.getByUserId(userId, filters);
      }

      const whereClause = { user_id: userId };
      if (filters.status) whereClause.status = filters.status;

      const queryOptions = {
        where: whereClause,
        include: [
          {
            model: User,
            as: 'reserved_by_user',
            attributes: ['id', 'firstname', 'lastname']
          }
        ],
        order: [['created_at', 'DESC']]
      };

      if (filters.limit) queryOptions.limit = parseInt(filters.limit);

      const reservations = await BloodReservation.findAll(queryOptions);
      return reservations.map(r => r.toJSON());

    } catch (error) {
      console.error('Error in BloodReservationModel.getByUserId:', error);
      throw error;
    }
  }

  // Get statistics
  static async getStats() {
    try {
      if (!BloodReservation) {
        return await LegacyBloodReservation.getStats();
      }

      const stats = await BloodReservation.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      });

      const result = {
        total: 0,
        pending: 0,
        approved: 0,
        completed: 0,
        cancelled: 0
      };

      stats.forEach(stat => {
        result[stat.status] = parseInt(stat.count);
        result.total += parseInt(stat.count);
      });

      return result;

    } catch (error) {
      console.error('Error in BloodReservationModel.getStats:', error);
      throw error;
    }
  }
}

module.exports = {
  BloodReservation: BloodReservationModel,
  BloodReservationModel,
  User,
  LegacyBloodReservation: LegacyBloodReservation,
  SequelizeBloodReservation: BloodReservation || null
};