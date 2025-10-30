const pool = require('../config/database');
const BloodReservation = require('../models/BloodReservation');

async function debugReservedBy() {
  try {
    console.log('🔍 Debugging reserved_by field...\n');
    
    // ทดสอบ BloodReservation.getById
    const result = await BloodReservation.getById(12);
    
    console.log('📋 BloodReservation.getById(12) result:');
    console.log('reserved_by field:', result.reserved_by);
    console.log('Type of reserved_by:', typeof result.reserved_by);
    console.log('Is reserved_by truthy?', !!result.reserved_by);
    
    // ทดสอบ raw query
    const rawResult = await pool.query(`
      SELECT 
        br.*,
        u.firstname || ' ' || u.lastname as reserved_by_fullname,
        u.username as reserved_by_username
      FROM blood_reservations br
      JOIN users u ON br.user_id = u.id
      WHERE br.id = 12;
    `);
    
    console.log('\n📋 Raw query result:');
    console.log('reserved_by_fullname:', rawResult.rows[0].reserved_by_fullname);
    console.log('reserved_by_username:', rawResult.rows[0].reserved_by_username);
    console.log('user_id:', rawResult.rows[0].user_id);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

debugReservedBy();