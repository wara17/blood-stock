const pool = require('../config/database');

async function checkUserTracking() {
  try {
    // ตรวจสอบ columns ที่เกี่ยวกับ user tracking
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'blood_reservations' 
        AND column_name ~ '(user|by)$'
      ORDER BY ordinal_position;
    `);
    
    console.log('✅ User tracking columns in blood_reservations:');
    columns.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // ตรวจสอบข้อมูลตัวอย่างรวมกับ users
    const sampleData = await pool.query(`
      SELECT 
        br.id,
        br.patient_name,
        br.status,
        br.user_id as reserved_by_user_id,
        u1.firstname || ' ' || u1.lastname as reserved_by_fullname,
        br.completed_by,
        u2.firstname || ' ' || u2.lastname as completed_by_fullname,
        br.cancelled_by,
        u3.firstname || ' ' || u3.lastname as cancelled_by_fullname,
        br.notes,
        br.cancellation_notes
      FROM blood_reservations br
      LEFT JOIN users u1 ON br.user_id = u1.id
      LEFT JOIN users u2 ON br.completed_by = u2.id  
      LEFT JOIN users u3 ON br.cancelled_by = u3.id
      ORDER BY br.id DESC
      LIMIT 5;
    `);
    
    console.log('\n📋 Sample reservation data with user tracking:');
    sampleData.rows.forEach(row => {
      console.log(`ID: ${row.id}, Patient: ${row.patient_name}, Status: ${row.status}`);
      console.log(`  Reserved by: ${row.reserved_by_fullname} (ID: ${row.reserved_by_user_id})`);
      console.log(`  Completed by: ${row.completed_by_fullname} (ID: ${row.completed_by})`);
      console.log(`  Cancelled by: ${row.cancelled_by_fullname} (ID: ${row.cancelled_by})`);
      console.log(`  Notes: ${row.notes || 'N/A'}`);
      console.log(`  Cancellation Notes: ${row.cancellation_notes || 'N/A'}`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkUserTracking();