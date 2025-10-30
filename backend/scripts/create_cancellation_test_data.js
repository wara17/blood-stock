const pool = require('../config/database');

async function createTestData() {
  try {
    console.log('🧪 Creating test reservations for cancellation testing...');
    
    // Create a few pending reservations for testing
    const testReservations = [
      {
        blood_group: 'O',
        blood_type: 'Whole_blood',
        rh_factor: 'Positive',
        quantity: 2,
        patient_name: 'ทดสอบการยกเลิกปกติ',
        department: 'IPD',
        reservation_date: new Date().toISOString().split('T')[0]
      },
      {
        blood_group: 'A',
        blood_type: 'PRC',
        rh_factor: 'Negative',
        quantity: 1,
        patient_name: 'ทดสอบยกเลิกโดยผู้จ่าย',
        department: 'ER',
        reservation_date: new Date().toISOString().split('T')[0]
      },
      {
        blood_group: 'B',
        blood_type: 'LPRC',
        rh_factor: 'Positive',
        quantity: 3,
        patient_name: 'ทดสอบการจ่ายปกติ',
        department: 'OPD',
        reservation_date: new Date().toISOString().split('T')[0]
      }
    ];

    // Get admin2 user ID
    const userResult = await pool.query('SELECT id FROM users WHERE username = $1', ['admin2']);
    if (userResult.rows.length === 0) {
      throw new Error('Admin2 user not found');
    }
    const userId = userResult.rows[0].id;

    for (const reservation of testReservations) {
      const result = await pool.query(`
        INSERT INTO blood_reservations (
          blood_group, blood_type, rh_factor, quantity, 
          patient_name, department, reservation_date, user_id, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
        RETURNING id, patient_name
      `, [
        reservation.blood_group,
        reservation.blood_type,
        reservation.rh_factor,
        reservation.quantity,
        reservation.patient_name,
        reservation.department,
        reservation.reservation_date,
        userId
      ]);

      console.log(`✅ Created reservation #${result.rows[0].id} for ${result.rows[0].patient_name}`);
    }

    console.log('\n📋 Test scenarios ready:');
    console.log('1. ใน Blood Reservation List: ใช้ปุ่ม "ยกเลิก" → จะได้สถานะ "ยกเลิก" (cancelled)');
    console.log('2. ใน Pending Dispense List: ใช้ปุ่ม "ยกเลิก" → จะได้สถานะ "ยกเลิกโดยผู้จ่าย" (cancelled_by_dispenser)');
    console.log('3. สามารถดูรายละเอียดการยกเลิกแยกหมายเหตุได้ใน Modal');

  } catch (error) {
    console.error('❌ Error creating test data:', error.message);
  } finally {
    await pool.end();
  }
}

createTestData();