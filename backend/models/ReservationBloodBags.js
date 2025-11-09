const { pool } = require('../config/database');

class ReservationBloodBagsModel {
  // Create new reservation blood bag record
  static async create(reservationId, bloodBagId, dispensedBy, notes = null) {
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO reservation_blood_bags (reservation_id, blood_bag_id, dispensed_by, notes)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const result = await client.query(query, [reservationId, bloodBagId, dispensedBy, notes]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Create multiple reservation blood bag records
  static async createMultiple(reservationId, bloodBags, dispensedBy, notes = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const records = [];
      for (const bloodBag of bloodBags) {
        const query = `
          INSERT INTO reservation_blood_bags (reservation_id, blood_bag_id, dispensed_by, notes)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `;
        
        const result = await client.query(query, [reservationId, bloodBag.id, dispensedBy, notes]);
        records.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      return records;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get blood bags for a reservation
  static async getByReservationId(reservationId) {
    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          rbb.*,
          bi.bag_number,
          bi.blood_type,
          bi.blood_group,
          bi.rh_factor,
          bi.received_date,
          bi.expiry_date,
          bi.received_by,
          bi.status as blood_status
        FROM reservation_blood_bags rbb
        JOIN blood_inventory bi ON rbb.blood_bag_id = bi.id
        WHERE rbb.reservation_id = $1
        ORDER BY rbb.dispensed_at ASC
      `;
      
      const result = await client.query(query, [reservationId]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Get all reservations with their blood bags
  static async getAllWithBloodBags() {
    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          br.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', rbb.id,
                'blood_bag_id', rbb.blood_bag_id,
                'bag_number', bi.bag_number,
                'blood_type', bi.blood_type,
                'blood_group', bi.blood_group,
                'rh_factor', bi.rh_factor,
                'received_date', bi.received_date,
                'expiry_date', bi.expiry_date,
                'dispensed_by', rbb.dispensed_by,
                'dispensed_at', rbb.dispensed_at,
                'notes', rbb.notes
              ) ORDER BY rbb.dispensed_at ASC
            ) FILTER (WHERE rbb.id IS NOT NULL),
            '[]'::json
          ) as dispensed_blood_bags
        FROM blood_reservations br
        LEFT JOIN reservation_blood_bags rbb ON br.id = rbb.reservation_id
        LEFT JOIN blood_inventory bi ON rbb.blood_bag_id = bi.id
        GROUP BY br.id
        ORDER BY br.reservation_date DESC
      `;
      
      const result = await client.query(query);
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Get reservation details with blood bags by ID
  static async getReservationWithBloodBags(reservationId) {
    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          br.*,
          u1.firstname || ' ' || u1.lastname as reserved_by,
          u2.firstname || ' ' || u2.lastname as approved_by_username,
          u3.firstname || ' ' || u3.lastname as completed_by_username,
          u4.firstname || ' ' || u4.lastname as cancelled_by_username,
          COALESCE(
            json_agg(
              json_build_object(
                'id', rbb.id,
                'blood_bag_id', rbb.blood_bag_id,
                'bag_number', bi.bag_number,
                'blood_type', bi.blood_type,
                'blood_group', bi.blood_group,
                'rh_factor', bi.rh_factor,
                'received_date', bi.received_date,
                'expiry_date', bi.expiry_date,
                'dispensed_by', rbb.dispensed_by,
                'dispensed_at', rbb.dispensed_at,
                'notes', rbb.notes
              ) ORDER BY rbb.dispensed_at ASC
            ) FILTER (WHERE rbb.id IS NOT NULL),
            '[]'::json
          ) as dispensed_blood_bags
        FROM blood_reservations br
        LEFT JOIN users u1 ON br.user_id = u1.id
        LEFT JOIN users u2 ON br.approved_by = u2.id
        LEFT JOIN users u3 ON br.completed_by = u3.id
        LEFT JOIN users u4 ON br.cancelled_by = u4.id
        LEFT JOIN reservation_blood_bags rbb ON br.id = rbb.reservation_id
        LEFT JOIN blood_inventory bi ON rbb.blood_bag_id = bi.id
        WHERE br.id = $1
        GROUP BY br.id, u1.firstname, u1.lastname, u2.firstname, u2.lastname, u3.firstname, u3.lastname, u4.firstname, u4.lastname
      `;
      
      const result = await client.query(query, [reservationId]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Delete reservation blood bag record
  static async delete(id) {
    const client = await pool.connect();
    try {
      const query = 'DELETE FROM reservation_blood_bags WHERE id = $1 RETURNING *';
      const result = await client.query(query, [id]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Delete all records for a reservation
  static async deleteByReservationId(reservationId) {
    const client = await pool.connect();
    try {
      const query = 'DELETE FROM reservation_blood_bags WHERE reservation_id = $1 RETURNING *';
      const result = await client.query(query, [reservationId]);
      return result.rows;
    } finally {
      client.release();
    }
  }
}

module.exports = ReservationBloodBagsModel;