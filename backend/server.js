const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const bloodInventoryRoutes = require('./routes/bloodInventory');
const reservationRoutes = require('./routes/reservations');

// Import models and database setup
const { testConnection, syncDatabase, initializeModels } = require('./models/index');

const app = express();
const PORT = process.env.PORT || 3002;

// CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/blood-inventory', bloodInventoryRoutes);
app.use('/api/reservations', reservationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Blood Stock API is running',
    timestamp: new Date().toISOString()
  });
});

// Default route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Blood Stock Management API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      bloodInventory: '/api/blood-inventory',
      reservations: '/api/reservations',
      health: '/api/health'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Start server with database initialization
const startServer = async () => {
  try {
    console.log('🔄 Initializing Blood Stock Management API...');
    
    // Initialize models (will fallback to legacy if needed)
    const sequelizeReady = await initializeModels();
    
    if (sequelizeReady) {
      // If Sequelize models are ready, sync database
      try {
        await syncDatabase(false);
        console.log('📊 Sequelize models synced successfully');
      } catch (syncError) {
        console.warn('⚠️  Warning: Could not sync database models:', syncError.message);
      }
    }
    
    // Start the Express server
    app.listen(PORT, () => {
      console.log(`\n🚀 Backend server is running on port ${PORT}`);
      console.log(`📍 API available at: http://localhost:${PORT}`);
      
      if (sequelizeReady) {
        console.log(`🏥 Blood Stock Management API ready with Sequelize ORM!`);
        console.log(`🗄️  Database: Connected and synced successfully`);
        console.log(`✨ Multiple database support enabled`);
      } else {
        console.log(`🏥 Blood Stock Management API ready with Legacy SQL!`);
        console.log(`📝 Using PostgreSQL with raw SQL queries`);
        console.log(`💡 Install and start PostgreSQL to enable ORM features`);
      }
      
      console.log(`\n📋 Available endpoints:`);
      console.log(`   🔐 Authentication: /api/auth`);
      console.log(`   🩸 Blood Inventory: /api/blood-inventory`);
      console.log(`   📋 Reservations: /api/reservations`);
      console.log(`   ❤️  Health Check: /api/health\n`);
    });
    
  } catch (error) {
    console.error('❌ Critical error starting server:', error);
    process.exit(1);
  }
};

// Initialize server
startServer();

module.exports = app;

module.exports = app;