const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'blood_stock_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
});

// Department mapping from old to new values
const departmentMapping = {
  'ICU': 'IPD',
  'Surgery': 'IPD',
  'Pediatrics': 'IPD',
  'Internal': 'IPD',
  'Oncology': 'IPD',
  'Cardiology': 'IPD',
  'Orthopedics': 'IPD'
  // ER stays as ER
  // Any other department becomes OPD
};

async function updateDepartments() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting department migration...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Drop existing constraint first
    console.log('🗑️ Dropping old department constraint...');
    try {
      await client.query(`
        ALTER TABLE blood_reservations 
        DROP CONSTRAINT IF EXISTS blood_reservations_department_check
      `);
      console.log('   ✅ Old constraint dropped');
    } catch (error) {
      console.log('   ℹ️  No constraint to drop or error:', error.message);
    }
    
    // Update blood_reservations table
    console.log('📋 Updating blood_reservations table...');
    
    // Update specific mappings
    for (const [oldDept, newDept] of Object.entries(departmentMapping)) {
      const result = await client.query(
        'UPDATE blood_reservations SET department = $1 WHERE department = $2',
        [newDept, oldDept]
      );
      console.log(`   ✅ Updated ${result.rowCount} records from ${oldDept} to ${newDept}`);
    }
    
    // Update any remaining departments (not ER, not in mapping) to OPD
    const result = await client.query(`
      UPDATE blood_reservations 
      SET department = 'OPD' 
      WHERE department NOT IN ('OPD', 'IPD', 'ER')
    `);
    console.log(`   ✅ Updated ${result.rowCount} remaining records to OPD`);
    
    // Get current department distribution
    const deptStats = await client.query(`
      SELECT department, COUNT(*) as count 
      FROM blood_reservations 
      GROUP BY department 
      ORDER BY department
    `);
    
    console.log('\n📊 Current department distribution:');
    deptStats.rows.forEach(row => {
      console.log(`   ${row.department}: ${row.count} records`);
    });
    
    // Add constraint to ensure only valid departments
    console.log('\n🔒 Adding new department constraint...');
    try {
      await client.query(`
        ALTER TABLE blood_reservations 
        ADD CONSTRAINT check_department_values 
        CHECK (department IN ('OPD', 'IPD', 'ER'))
      `);
      console.log('   ✅ Department constraint added successfully');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ℹ️  Department constraint already exists');
      } else {
        console.log('   ⚠️  Could not add constraint:', error.message);
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('\n✅ Department migration completed successfully!');
    
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('❌ Error during migration:', error);
    throw error;
    
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await updateDepartments();
    console.log('\n🎉 All done! Departments are now: OPD, IPD, ER');
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { updateDepartments };