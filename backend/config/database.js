const { Pool } = require('pg');
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Legacy PostgreSQL pool for backward compatibility
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'blood_stock_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  // Connection pool settings
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Legacy pool event handlers
pool.on('connect', () => {
  console.log('✅ Connected to postgres database successfully.');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err);
});

// Multi-database configuration for Sequelize
const dbConfig = {
  development: {
    dialect: process.env.DB_DIALECT || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'blood_stock_db',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    pool: {
      max: 20,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false
  },
  production: {
    dialect: process.env.DB_DIALECT || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'blood_stock_db',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    pool: {
      max: 50,
      min: 5,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    logging: false
  }
};

// Get current environment configuration
const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

// Initialize Sequelize with multi-database support
let sequelize;
try {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
} catch (error) {
  console.error('❌ Failed to initialize Sequelize:', error.message);
}

// Function to test database connection
const testConnection = async () => {
  try {
    if (sequelize) {
      await sequelize.authenticate();
      console.log('✅ Connected to postgres database successfully.');
      return true;
    } else {
      throw new Error('Sequelize not initialized');
    }
  } catch (error) {
    console.error('❌ Unable to connect to database:', error.message);
    return false;
  }
};

// Export both legacy pool and modern Sequelize
module.exports = {
  pool,           // Legacy PostgreSQL pool
  sequelize,      // Sequelize instance
  testConnection, // Connection test function
  config: dbConfig[env]  // Current environment config
};