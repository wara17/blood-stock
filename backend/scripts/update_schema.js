const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

async function updateDatabase() {
  try {
    console.log('🔄 Updating database schema...');
    
    // Read SQL script
    const sqlScript = fs.readFileSync(path.join(__dirname, 'add_action_by_fields.sql'), 'utf8');
    
    // Execute the script
    await pool.query(sqlScript);
    
    console.log('✅ Database schema updated successfully!');
    console.log('Added fields:');
    console.log('  - completed_by: User who marked reservation as completed');
    console.log('  - cancelled_by: User who cancelled reservation');
    console.log('  - cancelled_at: Timestamp when reservation was cancelled');
    
  } catch (error) {
    console.error('❌ Error updating database:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

updateDatabase();