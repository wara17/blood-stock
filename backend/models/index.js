const { sequelize, testConnection: dbTestConnection } = require('../config/database');

let models = {};
let BloodInventoryModel, BloodReservationModel, ReservationBloodBagsModel;
let User, BloodInventory, BloodReservation, ReservationBloodBags;

// Function to test database connection
const testConnection = async () => {
  try {
    if (dbTestConnection) {
      return await dbTestConnection();
    } else if (sequelize) {
      await sequelize.authenticate();
      console.log('✅ Connected to postgres database successfully.');
      return true;
    } else {
      throw new Error('No database connection available');
    }
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    return false;
  }
};

// Function to initialize models (only if database is connected)
const initializeModels = async () => {
  try {
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.log('📝 Database not connected - using legacy models');
      
      // Load legacy models as fallback
      try {
        BloodInventoryModel = require('./BloodInventory-old');
        BloodReservationModel = require('./BloodReservation-old');
        ReservationBloodBagsModel = require('./ReservationBloodBags-old');
        
        models.BloodInventoryModel = BloodInventoryModel;
        models.BloodReservationModel = BloodReservationModel;
        models.ReservationBloodBagsModel = ReservationBloodBagsModel;
        
        console.log('✅ Legacy models loaded as fallback');
      } catch (legacyError) {
        console.error('❌ Failed to load legacy models:', legacyError.message);
      }
      
      return false;
    }
    
    // Import Sequelize models
    const bloodInventoryModule = require('./BloodInventory');
    const bloodReservationModule = require('./BloodReservation');
    const reservationBloodBagsModule = require('./ReservationBloodBags');
    
    BloodInventoryModel = bloodInventoryModule.BloodInventoryModel;
    BloodReservationModel = bloodReservationModule.BloodReservationModel;
    ReservationBloodBagsModel = reservationBloodBagsModule.ReservationBloodBagsModel;
    
    User = bloodReservationModule.User;
    BloodInventory = bloodInventoryModule.BloodInventory;
    BloodReservation = bloodReservationModule.BloodReservation;
    ReservationBloodBags = reservationBloodBagsModule.ReservationBloodBags;
    
    // Add wrapper models to the models object
    models.BloodInventoryModel = BloodInventoryModel;
    models.BloodReservationModel = BloodReservationModel;
    models.ReservationBloodBagsModel = ReservationBloodBagsModel;
    models.User = User;
    models.BloodInventory = BloodInventory;
    models.BloodReservation = BloodReservation;
    models.ReservationBloodBags = ReservationBloodBags;
    
    console.log('✅ Sequelize models loaded successfully');
    return true;
    
  } catch (error) {
    console.error('Error initializing models:', error.message);
    
    // Fallback to legacy models
    try {
      BloodInventoryModel = require('./BloodInventory-old');
      BloodReservationModel = require('./BloodReservation-old');
      ReservationBloodBagsModel = require('./ReservationBloodBags-old');
      console.log('📝 Loaded legacy models as fallback');
    } catch (legacyError) {
      console.error('❌ Failed to load legacy models:', legacyError.message);
    }
    
    return false;
  }
};

// Function to sync database
const syncDatabase = async (force = false) => {
  try {
    const modelsInitialized = await initializeModels();
    
    if (!modelsInitialized) {
      console.log('📝 Skipping database sync - using legacy models');
      return false;
    }
    
    console.log('Syncing database models...');
    
    // Sync all models
    await sequelize.sync({ force });
    
    console.log('Database models synced successfully!');
    return true;
    
  } catch (error) {
    console.error('Error syncing database:', error.message);
    return false;
  }
};

module.exports = {
  sequelize,
  models,
  syncDatabase,
  testConnection,
  initializeModels,
  
  // Export model classes - these will be set by initializeModels
  get BloodInventoryModel() { return BloodInventoryModel; },
  get BloodReservationModel() { return BloodReservationModel; },
  get ReservationBloodBagsModel() { return ReservationBloodBagsModel; },
  
  // Export Sequelize models - these will be set by initializeModels
  get User() { return User; },
  get BloodInventory() { return BloodInventory; },
  get BloodReservation() { return BloodReservation; },
  get ReservationBloodBags() { return ReservationBloodBags; }
};