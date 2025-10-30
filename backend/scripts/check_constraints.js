const pool = require('../config/database');

async function checkConstraints() {
  try {
    const result = await pool.query(`
      SELECT tc.constraint_name, cc.check_clause 
      FROM information_schema.table_constraints tc 
      JOIN information_schema.check_constraints cc 
        ON tc.constraint_name = cc.constraint_name 
      WHERE tc.table_name = 'blood_reservations' 
        AND tc.constraint_type = 'CHECK';
    `);
    
    console.log('✅ Current check constraints:');
    result.rows.forEach(row => {
      console.log(`- ${row.constraint_name}: ${row.check_clause}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkConstraints();