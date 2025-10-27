const pool = require('../config/database');

async function alterBloodTypeConstraint() {
  const client = await pool.connect();
  
  try {
    console.log('Starting blood_type constraint alteration...');
    
    // Step 1: Find the constraint name
    const constraintQuery = `
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = 'blood_inventory'::regclass 
      AND contype = 'c' 
      AND pg_get_constraintdef(oid) LIKE '%blood_type%';
    `;
    
    const constraints = await client.query(constraintQuery);
    console.log('Found constraints:', constraints.rows);
    
    if (constraints.rows.length > 0) {
      const constraintName = constraints.rows[0].conname;
      console.log(`Dropping constraint: ${constraintName}`);
      
      // Step 2: Drop the existing constraint
      await client.query(`ALTER TABLE blood_inventory DROP CONSTRAINT ${constraintName};`);
      console.log('Old constraint dropped successfully!');
    }
    
    // Step 3: Update existing data (if any)
    console.log('Updating existing data...');
    await client.query(`
      UPDATE blood_inventory 
      SET blood_type = 'Whole_blood' 
      WHERE blood_type = 'Whole blood';
    `);
    console.log('Data updated successfully!');
    
    // Step 4: Add new constraint
    console.log('Adding new constraint...');
    await client.query(`
      ALTER TABLE blood_inventory 
      ADD CONSTRAINT blood_inventory_blood_type_check 
      CHECK (blood_type IN ('Whole_blood', 'PRC', 'LPRC'));
    `);
    console.log('New constraint added successfully!');
    
    // Step 5: Verify the change
    const verifyQuery = `
      SELECT blood_type, COUNT(*) 
      FROM blood_inventory 
      GROUP BY blood_type;
    `;
    const result = await client.query(verifyQuery);
    console.log('Current blood types in database:', result.rows);
    
    console.log('Blood type constraint alteration completed successfully!');
    
  } catch (err) {
    console.error('Error altering blood type constraint:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Run alteration if this file is executed directly
if (require.main === module) {
  alterBloodTypeConstraint()
    .then(() => {
      console.log('Alteration completed successfully!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Alteration failed:', err);
      process.exit(1);
    });
}

module.exports = { alterBloodTypeConstraint };