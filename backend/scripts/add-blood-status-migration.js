const pool = require('../config/database');

async function addBloodStatusColumn() {
  const client = await pool.connect();
  
  try {
    // Add status column to blood_inventory table
    await client.query(`
      ALTER TABLE blood_inventory 
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'available'
      CHECK (status IN ('available', 'reserved', 'used', 'expired'));
    `);

    // Add reserved_for column for tracking who reserved the blood
    await client.query(`
      ALTER TABLE blood_inventory 
      ADD COLUMN IF NOT EXISTS reserved_for VARCHAR(100),
      ADD COLUMN IF NOT EXISTS reserved_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS used_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS notes TEXT;
    `);

    // Create index for status column
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_blood_inventory_status ON blood_inventory(status);
    `);

    // Update existing records to set status based on expiry date
    await client.query(`
      UPDATE blood_inventory 
      SET status = CASE 
        WHEN expiry_date < CURRENT_DATE THEN 'expired'
        ELSE 'available'
      END
      WHERE status = 'available' OR status IS NULL;
    `);

    console.log('Blood inventory status columns added successfully!');
    console.log('Status options: available, reserved, used, expired');
    
  } catch (err) {
    console.error('Error adding status columns:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  addBloodStatusColumn()
    .then(() => {
      console.log('Blood inventory status migration completed successfully!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Blood inventory status migration failed:', err);
      process.exit(1);
    });
}

module.exports = { addBloodStatusColumn };