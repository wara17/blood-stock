const pool = require('../config/database');

async function testUserTracking() {
  try {
    // สร้างการจองใหม่เพื่อทดสอบ
    const reservationData = {
      blood_group: 'A',
      blood_type: 'PRC',
      rh_factor: 'Positive',
      quantity: 2,
      patient_name: 'ทดสอบแสดงชื่อเต็ม',
      department: 'OPD',
      user_id: 6, // admin2
      notes: 'ทดสอบการแสดงชื่อเต็มแทน username'
    };

    // Insert ข้อมูลใหม่
    const insertResult = await pool.query(`
      INSERT INTO blood_reservations 
      (blood_group, blood_type, rh_factor, quantity, patient_name, department, user_id, notes, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id;
    `, [
      reservationData.blood_group,
      reservationData.blood_type, 
      reservationData.rh_factor,
      reservationData.quantity,
      reservationData.patient_name,
      reservationData.department,
      reservationData.user_id,
      reservationData.notes
    ]);

    const newId = insertResult.rows[0].id;
    console.log(`✅ Created new reservation with ID: ${newId}`);

    // ทดสอบการ dispense (complete) โดยเก็บ user ID
    await pool.query(`
      UPDATE blood_reservations 
      SET status = 'completed', completed_by = $1, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [6, newId]); // user ID 6 เป็นคน dispense

    console.log(`✅ Marked reservation ${newId} as completed by user 6`);

    // ดึงข้อมูลที่อัปเดตแล้วพร้อมชื่อเต็ม
    const result = await pool.query(`
      SELECT 
        br.id,
        br.patient_name,
        br.status,
        br.user_id as reserved_by_id,
        u1.firstname || ' ' || u1.lastname as reserved_by_fullname,
        br.completed_by as completed_by_id,
        u2.firstname || ' ' || u2.lastname as completed_by_fullname,
        br.notes
      FROM blood_reservations br
      LEFT JOIN users u1 ON br.user_id = u1.id
      LEFT JOIN users u2 ON br.completed_by = u2.id  
      WHERE br.id = $1
    `, [newId]);

    console.log('\n📋 Updated reservation with full names:');
    const reservation = result.rows[0];
    console.log(`ID: ${reservation.id}`);
    console.log(`Patient: ${reservation.patient_name}`);
    console.log(`Status: ${reservation.status}`);
    console.log(`Reserved by: ${reservation.reserved_by_fullname} (ID: ${reservation.reserved_by_id})`);
    console.log(`Completed by: ${reservation.completed_by_fullname} (ID: ${reservation.completed_by_id})`);
    console.log(`Notes: ${reservation.notes}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

testUserTracking();