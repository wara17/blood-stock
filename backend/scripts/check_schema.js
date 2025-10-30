const pool = require('../config/database');

async function checkSchema() {
  try {
    // Check status column
    const statusResult = await pool.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'blood_reservations' AND column_name = 'status'
    `);
    
    console.log('Status column info:', statusResult.rows);
    
    // Check if enum exists
    const enumResult = await pool.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'reservation_status')
      ORDER BY enumsortorder
    `);
    
    console.log('Enum values:', enumResult.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();