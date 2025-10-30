const pool = require('../config/database');

async function addTestDataForActionTracking() {
  try {
    console.log('🧪 Adding test data for action tracking...');
    
    // Update some existing reservations to show completed_by and cancelled_by
    const updateCompletedReservation = `
      UPDATE blood_reservations 
      SET 
        status = 'completed',
        completed_by = (SELECT id FROM users WHERE username = 'admin2' LIMIT 1),
        completed_at = CURRENT_TIMESTAMP - INTERVAL '1 day',
        notes = 'จ่ายเลือดให้ผู้ป่วยเรียบร้อยแล้ว',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = (SELECT id FROM blood_reservations WHERE status = 'pending' LIMIT 1)
      RETURNING id, status, completed_by;
    `;
    
    const updateCancelledReservation = `
      UPDATE blood_reservations 
      SET 
        status = 'cancelled',
        cancelled_by = (SELECT id FROM users WHERE username = 'admin2' LIMIT 1),
        cancelled_at = CURRENT_TIMESTAMP - INTERVAL '2 hours',
        notes = 'ยกเลิกการจองเนื่องจากผู้ป่วยไม่ต้องการเลือดแล้ว',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = (SELECT id FROM blood_reservations WHERE status = 'pending' AND id != (SELECT id FROM blood_reservations WHERE status = 'pending' LIMIT 1) LIMIT 1)
      RETURNING id, status, cancelled_by;
    `;
    
    const updateApprovedReservation = `
      UPDATE blood_reservations 
      SET 
        status = 'approved',
        approved_by = (SELECT id FROM users WHERE username = 'admin2' LIMIT 1),
        approved_at = CURRENT_TIMESTAMP - INTERVAL '3 hours',
        notes = 'อนุมัติการจองเลือดแล้ว พร้อมจ่าย',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = (SELECT id FROM blood_reservations WHERE status = 'pending' AND id NOT IN (
        SELECT id FROM blood_reservations WHERE status IN ('completed', 'cancelled') LIMIT 2
      ) LIMIT 1)
      RETURNING id, status, approved_by;
    `;
    
    // Execute updates
    const completedResult = await pool.query(updateCompletedReservation);
    if (completedResult.rows.length > 0) {
      console.log('✅ Updated reservation to completed:', completedResult.rows[0]);
    }
    
    const cancelledResult = await pool.query(updateCancelledReservation);
    if (cancelledResult.rows.length > 0) {
      console.log('✅ Updated reservation to cancelled:', cancelledResult.rows[0]);
    }
    
    const approvedResult = await pool.query(updateApprovedReservation);
    if (approvedResult.rows.length > 0) {
      console.log('✅ Updated reservation to approved:', approvedResult.rows[0]);
    }
    
    // Show all reservations with their action users
    const showReservations = `
      SELECT 
        br.id,
        br.status,
        br.patient_name,
        u.username as reserved_by,
        ap.username as approved_by_username,
        cp.username as completed_by_username,
        cn.username as cancelled_by_username,
        br.approved_at,
        br.completed_at,
        br.cancelled_at,
        br.notes
      FROM blood_reservations br
      JOIN users u ON br.user_id = u.id
      LEFT JOIN users ap ON br.approved_by = ap.id
      LEFT JOIN users cp ON br.completed_by = cp.id
      LEFT JOIN users cn ON br.cancelled_by = cn.id
      ORDER BY br.id DESC
      LIMIT 10;
    `;
    
    const reservations = await pool.query(showReservations);
    console.log('\n📋 Current reservations with action tracking:');
    console.table(reservations.rows);
    
    console.log('\n🎉 Test data added successfully!');
    console.log('📝 Now you can see:');
    console.log('   - ผู้จ่ายเลือด (completed_by_username) for completed reservations');
    console.log('   - ผู้ยกเลิก (cancelled_by_username) for cancelled reservations');
    console.log('   - ผู้อนุมัติ (approved_by_username) for approved reservations');
    
  } catch (error) {
    console.error('❌ Error adding test data:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

addTestDataForActionTracking();