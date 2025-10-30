const pool = require('../config/database');

async function checkAllColumns() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'blood_reservations' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 All columns in blood_reservations:');
    result.rows.forEach((row, i) => {
      console.log(`${i+1}. ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkAllColumns();