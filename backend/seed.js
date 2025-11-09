const { sequelize, testConnection } = require('./config/database');
const bcrypt = require('bcryptjs');

// Import models explicitly  
const { User } = require('./models/BloodReservation');

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Cannot connect to database');
    }
    
    // Use the User model from BloodReservation
    if (!User) {
      console.log('⚠️  User model not found. Please run migration first.');
      console.log('Run: npm run migrate');
      return;
    }
    
    // Create admin user if not exists
    const adminExists = await User.findOne({ where: { username: 'admin' } });
    
    if (!adminExists) {
      console.log('👤 Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await User.create({
        username: 'admin',
        email: 'admin@bloodbank.com',
        password: hashedPassword,
        firstname: 'System',
        lastname: 'Administrator'
      });
      
      console.log('✅ Admin user created');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    } else {
      console.log('👤 Admin user already exists');
    }
    
    // Create sample users
    const usersToCreate = [
      {
        username: 'doctor1',
        email: 'doctor1@hospital.com',
        password: 'doctor123',
        firstname: 'Dr. John',
        lastname: 'Smith'
      },
      {
        username: 'nurse1', 
        email: 'nurse1@hospital.com',
        password: 'nurse123',
        firstname: 'Jane',
        lastname: 'Doe'
      }
    ];
    
    for (const userData of usersToCreate) {
      const userExists = await User.findOne({ where: { username: userData.username } });
      
      if (!userExists) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        await User.create({
          ...userData,
          password: hashedPassword
        });
        console.log(`✅ Created user: ${userData.username}`);
      }
    }
    
    console.log('🎉 Database seeding completed!');
    console.log('📋 Sample users created:');
    console.log('   👨‍⚕️ admin / admin123');
    console.log('   👨‍⚕️ doctor1 / doctor123');  
    console.log('   👩‍⚕️ nurse1 / nurse123');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔒 Database connection closed');
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;