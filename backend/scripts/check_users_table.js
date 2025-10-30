const pool = require('../config/database');

async function checkUsersTable() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    console.log('✅ Current users table structure:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}${row.character_maximum_length ? `(${row.character_maximum_length})` : ''}`);
    });
    
    // ตรวจสอบข้อมูลตัวอย่าง
    const sampleData = await pool.query('SELECT * FROM users LIMIT 3;');
    console.log('\n📋 Sample user data:');
    console.log(sampleData.rows);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkUsersTable();