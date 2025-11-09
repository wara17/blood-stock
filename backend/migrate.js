const { sequelize, testConnection } = require('./config/database');

async function migrateDatabase() {
  console.log('🔄 Starting database migration...');
  
  try {
    // Test database connection
    console.log('📊 Testing database connection...');
    const connected = await testConnection();
    
    if (!connected) {
      throw new Error('Cannot connect to database');
    }
    
    // Sync all models (create tables if they don't exist)
    console.log('📋 Creating/updating database tables...');
    await sequelize.sync({ 
      alter: true,  // Update existing tables to match models
      logging: console.log 
    });
    
    console.log('✅ Database migration completed successfully!');
    console.log('📊 Tables created/updated:');
    console.log('  - users');
    console.log('  - blood_reservations'); 
    console.log('  - blood_inventory');
    console.log('  - reservation_blood_bags');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    await sequelize.close();
    console.log('🔒 Database connection closed');
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateDatabase();
}

module.exports = migrateDatabase;