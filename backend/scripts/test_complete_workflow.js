const pool = require('../config/database');

async function testCompleteWorkflow() {
  try {
    console.log('🔄 Testing complete user tracking workflow...\n');

    // 1. จ่ายเลือด ID 12 โดย user 8 (สมชาย ใจดี)
    await pool.query(`
      UPDATE blood_reservations 
      SET status = 'completed', completed_by = $1, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [8, 12]);
    console.log('✅ Reservation 12 completed by สมชาย ใจดี');

    // 2. ยกเลิกโดยผู้จ่าย ID 13 โดย user 9 (เพ็ญศรี สายฟ้า)
    await pool.query(`
      UPDATE blood_reservations 
      SET status = 'cancelled_by_dispenser', cancelled_by = $1, cancelled_at = CURRENT_TIMESTAMP, 
          cancellation_notes = 'ผู้ป่วยไม่มารับเลือดตามนัด', updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [9, 13]);
    console.log('✅ Reservation 13 cancelled by dispenser เพ็ญศรี สายฟ้า');

    // 3. ยกเลิกปกติ ID 14 โดย user 7 (ศิริพร นาคเพชร)
    await pool.query(`
      UPDATE blood_reservations 
      SET status = 'cancelled', cancelled_by = $1, cancelled_at = CURRENT_TIMESTAMP,
          cancellation_notes = 'ผู้ป่วยไม่ต้องการเลือดแล้ว', updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [7, 14]);
    console.log('✅ Reservation 14 cancelled by ศิริพร นาคเพชร');

    // 4. ดูผลลัพธ์ทั้งหมดพร้อมชื่อเต็ม
    const result = await pool.query(`
      SELECT 
        br.id,
        br.patient_name,
        br.status,
        br.notes,
        br.cancellation_notes,
        u1.firstname || ' ' || u1.lastname as reserved_by,
        u2.firstname || ' ' || u2.lastname as completed_by,
        u3.firstname || ' ' || u3.lastname as cancelled_by
      FROM blood_reservations br
      LEFT JOIN users u1 ON br.user_id = u1.id
      LEFT JOIN users u2 ON br.completed_by = u2.id  
      LEFT JOIN users u3 ON br.cancelled_by = u3.id
      WHERE br.id IN (12, 13, 14)
      ORDER BY br.id;
    `);

    console.log('\n📋 Complete workflow results:');
    result.rows.forEach(row => {
      console.log(`\n--- Reservation ID: ${row.id} ---`);
      console.log(`Patient: ${row.patient_name}`);
      console.log(`Status: ${row.status}`);
      console.log(`Reserved by: ${row.reserved_by}`);
      console.log(`Completed by: ${row.completed_by || 'N/A'}`);
      console.log(`Cancelled by: ${row.cancelled_by || 'N/A'}`);
      console.log(`Notes: ${row.notes || 'N/A'}`);
      console.log(`Cancellation Notes: ${row.cancellation_notes || 'N/A'}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

testCompleteWorkflow();