const pool = require('../config/database');

async function testDetailAPI() {
  try {
    // ทดสอบ API response สำหรับรายละเอียดการจอง
    const result = await pool.query(`
      SELECT 
        br.*,
        u1.firstname || ' ' || u1.lastname as reserved_by,
        u2.firstname || ' ' || u2.lastname as completed_by_username,
        u3.firstname || ' ' || u3.lastname as cancelled_by_username
      FROM blood_reservations br
      LEFT JOIN users u1 ON br.user_id = u1.id
      LEFT JOIN users u2 ON br.completed_by = u2.id
      LEFT JOIN users u3 ON br.cancelled_by = u3.id
      WHERE br.id = 12;
    `);

    console.log('📋 API Response for reservation detail (ID: 12):');
    console.log(JSON.stringify(result.rows[0], null, 2));

    // ทดสอบข้อมูลที่มี cancelled_by
    const cancelledResult = await pool.query(`
      SELECT 
        br.*,
        u1.firstname || ' ' || u1.lastname as reserved_by,
        u2.firstname || ' ' || u2.lastname as completed_by_username,
        u3.firstname || ' ' || u3.lastname as cancelled_by_username
      FROM blood_reservations br
      LEFT JOIN users u1 ON br.user_id = u1.id
      LEFT JOIN users u2 ON br.completed_by = u2.id
      LEFT JOIN users u3 ON br.cancelled_by = u3.id
      WHERE br.cancelled_by IS NOT NULL
      LIMIT 1;
    `);

    console.log('\n📋 API Response for cancelled reservation:');
    console.log(JSON.stringify(cancelledResult.rows[0], null, 2));

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

testDetailAPI();