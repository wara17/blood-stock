const pool = require('../config/database');

async function createBloodInventoryTable() {
  const client = await pool.connect();
  
  try {
    // Create blood_inventory table
    await client.query(`
      CREATE TABLE IF NOT EXISTS blood_inventory (
        id SERIAL PRIMARY KEY,
        received_date DATE NOT NULL,
        blood_type VARCHAR(20) NOT NULL CHECK (blood_type IN ('Whole blood', 'PRC', 'LPRC')),
        blood_group VARCHAR(5) NOT NULL CHECK (blood_group IN ('A', 'B', 'AB', 'O')),
        rh_factor VARCHAR(10) NOT NULL CHECK (rh_factor IN ('Positive', 'Negative')),
        bag_number VARCHAR(20) NOT NULL UNIQUE,
        expiry_date DATE NOT NULL,
        received_by VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create index for better query performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_blood_inventory_blood_group ON blood_inventory(blood_group);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_blood_inventory_blood_type ON blood_inventory(blood_type);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_blood_inventory_expiry_date ON blood_inventory(expiry_date);
    `);

    // Create trigger to update updated_at timestamp
    await client.query(`
      CREATE OR REPLACE FUNCTION update_blood_inventory_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trigger_blood_inventory_updated_at ON blood_inventory;
      CREATE TRIGGER trigger_blood_inventory_updated_at
        BEFORE UPDATE ON blood_inventory
        FOR EACH ROW
        EXECUTE FUNCTION update_blood_inventory_updated_at();
    `);

    console.log('Blood inventory table created successfully!');
    
    // Insert sample data
    await client.query(`
      INSERT INTO blood_inventory 
        (received_date, blood_type, blood_group, rh_factor, bag_number, expiry_date, received_by)
      VALUES 
        ('2025-10-01', 'Whole blood', 'A', 'Positive', '001.01.1.00001', '2025-11-01', 'นาย สมชาย ใจดี'),
        ('2025-10-02', 'PRC', 'B', 'Negative', '002.02.2.00002', '2025-11-15', 'นางสาว สุดา มีใจ'),
        ('2025-10-03', 'LPRC', 'AB', 'Positive', '003.03.3.00003', '2025-12-01', 'นาย วิชัย รักสะอาด')
      ON CONFLICT (bag_number) DO NOTHING;
    `);

    console.log('Sample blood inventory data inserted successfully!');
    
  } catch (err) {
    console.error('Error creating blood inventory table:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  createBloodInventoryTable()
    .then(() => {
      console.log('Blood inventory migration completed successfully!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Blood inventory migration failed:', err);
      process.exit(1);
    });
}

module.exports = { createBloodInventoryTable };