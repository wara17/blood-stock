// Fix status column to use enum or extend length
// Since we have enum created, let's change the column to use it

const pool = require('../config/database');

async function fixStatusColumn() {
  try {
    console.log('🔧 Fixing status column...');
    
    // Option 1: Change column to use enum type
    await pool.query(`
      ALTER TABLE blood_reservations 
      ALTER COLUMN status TYPE reservation_status 
      USING status::reservation_status
    `);
    
    console.log('✅ Status column updated to use reservation_status enum');
    
    // Verify the change
    const result = await pool.query(`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'blood_reservations' AND column_name = 'status'
    `);
    
    console.log('Updated column info:', result.rows);
    
  } catch (error) {
    console.error('❌ Error fixing status column:', error.message);
    
    // Fallback: just extend the varchar length
    try {
      console.log('🔄 Trying fallback: extending VARCHAR length...');
      await pool.query(`
        ALTER TABLE blood_reservations 
        ALTER COLUMN status TYPE VARCHAR(30)
      `);
      console.log('✅ Status column extended to VARCHAR(30)');
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError.message);
    }
  } finally {
    await pool.end();
  }
}

fixStatusColumn();