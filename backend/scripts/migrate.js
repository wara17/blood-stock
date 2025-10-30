const pool = require('../config/database');

async function createTables() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        refresh_token TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP WITH TIME ZONE
      )
    `);

    console.log('✅ Users table created successfully');

    // Create blood_reservations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blood_reservations (
        id SERIAL PRIMARY KEY,
        blood_group VARCHAR(3) NOT NULL CHECK (blood_group IN ('A', 'B', 'AB', 'O')),
        blood_type VARCHAR(20) NOT NULL CHECK (blood_type IN ('Whole_blood', 'PRC', 'LPRC')),
        rh_factor VARCHAR(10) NOT NULL CHECK (rh_factor IN ('Positive', 'Negative')),
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        patient_name VARCHAR(100) NOT NULL,
        department VARCHAR(50) NOT NULL CHECK (department IN ('ER', 'ICU', 'Surgery', 'Pediatrics', 'Internal', 'Oncology', 'Cardiology', 'Orthopedics')),
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
        reservation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        notes TEXT,
        approved_by INTEGER REFERENCES users(id),
        approved_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Blood inventory table created successfully');

    // Create reservation_blood_bags table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reservation_blood_bags (
        id SERIAL PRIMARY KEY,
        reservation_id INTEGER NOT NULL REFERENCES blood_reservations(id) ON DELETE CASCADE,
        blood_bag_id INTEGER NOT NULL REFERENCES blood_inventory(id) ON DELETE CASCADE,
        dispensed_by VARCHAR(100) NOT NULL,
        dispensed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(reservation_id, blood_bag_id)
      )
    `);

    // Create indexes for reservation_blood_bags
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_reservation_blood_bags_reservation_id ON reservation_blood_bags(reservation_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_reservation_blood_bags_blood_bag_id ON reservation_blood_bags(blood_bag_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_reservation_blood_bags_dispensed_at ON reservation_blood_bags(dispensed_at)
    `);

    console.log('✅ Reservation blood bags table created successfully');

    console.log('✅ All tables created successfully!');

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON blood_reservations(user_id);
      CREATE INDEX IF NOT EXISTS idx_reservations_status ON blood_reservations(status);
      CREATE INDEX IF NOT EXISTS idx_reservations_blood_group ON blood_reservations(blood_group);
      CREATE INDEX IF NOT EXISTS idx_reservations_department ON blood_reservations(department);
      CREATE INDEX IF NOT EXISTS idx_reservations_date ON blood_reservations(reservation_date);
    `);

    console.log('✅ Database indexes created successfully');
    console.log('🎉 Database migration completed!');

  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    process.exit();
  }
}

createTables();