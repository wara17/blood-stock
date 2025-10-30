// Test script for cancellation features
// This script creates test data for both normal cancellation and cancellation by dispenser

const pool = require('../config/database');

async function createCancellationTestData() {
  try {
    console.log('🧪 Creating test data for cancellation features...');

    // 1. Update a reservation to 'cancelled' with cancellation_notes
    const normalCancellation = `
      UPDATE blood_reservations 
      SET 
        status = 'cancelled',
        cancelled_by = (SELECT id FROM users WHERE username = 'admin2' LIMIT 1),
        cancelled_at = CURRENT_TIMESTAMP - INTERVAL '1 hour',
        cancellation_notes = 'ผู้ป่วยไม่ต้องการรับการรักษาแล้ว',
        notes = 'หมายเหตุการจองเดิม: ผู้ป่วยมีภาวะฉุกเฉิน',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = (
        SELECT id 
        FROM blood_reservations 
        WHERE status = 'pending' 
        LIMIT 1
      )
      RETURNING id, status, cancelled_by, cancellation_notes, notes;
    `;

    const normalResult = await pool.query(normalCancellation);
    if (normalResult.rows.length > 0) {
      console.log('✅ Created normal cancellation test data:', normalResult.rows[0]);
    }

    // 2. Update another reservation to 'cancelled_by_dispenser' with cancellation_notes
    const dispenserCancellation = `
      UPDATE blood_reservations 
      SET 
        status = 'cancelled_by_dispenser',
        cancelled_by = (SELECT id FROM users WHERE username = 'admin2' LIMIT 1),
        cancelled_at = CURRENT_TIMESTAMP - INTERVAL '30 minutes',
        cancellation_notes = 'ถุงเลือดที่มีไม่เพียงพอสำหรับความต้องการ กรุ๊ปเลือดหมด',
        notes = 'หมายเหตุการจองเดิม: ต้องการเร่งด่วน',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = (
        SELECT id 
        FROM blood_reservations 
        WHERE status = 'pending' 
        AND id != (SELECT id FROM blood_reservations WHERE status = 'cancelled' LIMIT 1)
        LIMIT 1
      )
      RETURNING id, status, cancelled_by, cancellation_notes, notes;
    `;

    const dispenserResult = await pool.query(dispenserCancellation);
    if (dispenserResult.rows.length > 0) {
      console.log('✅ Created dispenser cancellation test data:', dispenserResult.rows[0]);
    }

    // 3. Query all test data to verify
    const verifyQuery = `
      SELECT 
        br.id,
        br.status,
        br.patient_name,
        br.blood_group,
        u.username as reserved_by,
        cn.username as cancelled_by_username,
        br.cancelled_at,
        br.notes as reservation_notes,
        br.cancellation_notes,
        br.created_at
      FROM blood_reservations br
      JOIN users u ON br.user_id = u.id
      LEFT JOIN users cn ON br.cancelled_by = cn.id
      WHERE br.status IN ('cancelled', 'cancelled_by_dispenser')
      ORDER BY br.cancelled_at DESC;
    `;

    const verifyResult = await pool.query(verifyQuery);
    
    console.log('\n📋 Current cancellation test data:');
    verifyResult.rows.forEach(row => {
      console.log(`\n🔹 Reservation #${row.id} - ${row.patient_name}`);
      console.log(`   Status: ${row.status}`);
      console.log(`   Blood Group: ${row.blood_group}`);
      console.log(`   Reserved by: ${row.reserved_by}`);
      console.log(`   Cancelled by: ${row.cancelled_by_username}`);
      console.log(`   Cancelled at: ${row.cancelled_at}`);
      console.log(`   Reservation notes: ${row.reservation_notes || 'None'}`);
      console.log(`   Cancellation notes: ${row.cancellation_notes || 'None'}`);
    });

    console.log('\n✅ Test data creation completed!');
    console.log('\n📝 You can now test:');
    console.log('   1. View reservations in the list to see different cancellation statuses');
    console.log('   2. Click on cancelled reservations to see separation of notes');
    console.log('   3. Try the "Cancel by Dispenser" button in the dispense page');
    console.log('   4. Verify that both cancellation types show different labels and notes');

  } catch (error) {
    console.error('❌ Error creating test data:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the test data creation
createCancellationTestData();