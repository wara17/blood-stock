const pool = require('../config/database');

async function fixBloodTypeConstraint() {
  const client = await pool.connect();
  
  try {
    console.log('Starting blood type constraint fix...');

    // Step 1: Update existing data to use Whole_blood instead of Whole blood
    const updateResult = await client.query(`
      UPDATE blood_inventory 
      SET blood_type = 'Whole_blood' 
      WHERE blood_type = 'Whole blood'
    `);
    
    console.log(`✅ Updated ${updateResult.rowCount} rows from 'Whole blood' to 'Whole_blood'`);

    // Step 2: Drop the existing check constraint
    await client.query(`
      ALTER TABLE blood_inventory 
      DROP CONSTRAINT IF EXISTS blood_inventory_blood_type_check
    `);
    
    console.log('✅ Dropped old blood_type check constraint');

    // Step 3: Add new check constraint with correct values
    await client.query(`
      ALTER TABLE blood_inventory 
      ADD CONSTRAINT blood_inventory_blood_type_check 
      CHECK (blood_type IN ('Whole_blood', 'PRC', 'LPRC'))
    `);
    
    console.log('✅ Added new blood_type check constraint');

    // Step 4: Update blood_reservations table as well (if needed)
    const updateReservationResult = await client.query(`
      UPDATE blood_reservations 
      SET blood_type = 'Whole_blood' 
      WHERE blood_type = 'Whole blood'
    `);
    
    console.log(`✅ Updated ${updateReservationResult.rowCount} rows in blood_reservations table`);

    console.log('🎉 Blood type constraint fix completed successfully!');

  } catch (error) {
    console.error('❌ Error fixing blood type constraint:', error);
    throw error;
  } finally {
    client.release();
    process.exit();
  }
}

fixBloodTypeConstraint().catch(console.error);