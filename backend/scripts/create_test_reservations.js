const pool = require('../config/database');

async function createTestReservations() {
  try {
    const reservations = [
      {
        blood_group: 'A',
        blood_type: 'PRC', 
        rh_factor: 'Positive',
        quantity: 2,
        patient_name: 'สมหญิง ใจดี',
        department: 'OPD',
        user_id: 7, // ศิริพร นาคเพชร
        notes: 'ผู้ป่วยต้องการเลือดเร่งด่วน'
      },
      {
        blood_group: 'B',
        blood_type: 'LPRC',
        rh_factor: 'Negative', 
        quantity: 1,
        patient_name: 'สมศักดิ์ เมืองไทย',
        department: 'IPD',
        user_id: 8, // สมชาย ใจดี
        notes: 'ผู้ป่วยผ่าตัด'
      },
      {
        blood_group: 'O',
        blood_type: 'Whole_blood',
        rh_factor: 'Positive',
        quantity: 3,
        patient_name: 'มาลี สวยงาม', 
        department: 'ER',
        user_id: 9, // เพ็ญศรี สายฟ้า
        notes: 'ผู้ป่วยอุบัติเหตุ'
      }
    ];

    for (const reservation of reservations) {
      const result = await pool.query(`
        INSERT INTO blood_reservations 
        (blood_group, blood_type, rh_factor, quantity, patient_name, department, user_id, notes, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id;
      `, [
        reservation.blood_group,
        reservation.blood_type,
        reservation.rh_factor, 
        reservation.quantity,
        reservation.patient_name,
        reservation.department,
        reservation.user_id,
        reservation.notes
      ]);

      console.log(`✅ Created reservation ID: ${result.rows[0].id} for ${reservation.patient_name}`);
    }

    // แสดงผลรวมพร้อมชื่อผู้จอง
    const allReservations = await pool.query(`
      SELECT 
        br.id,
        br.patient_name,
        br.status,
        u.firstname || ' ' || u.lastname as reserved_by_fullname
      FROM blood_reservations br
      JOIN users u ON br.user_id = u.id
      ORDER BY br.id DESC
      LIMIT 5;
    `);

    console.log('\n📋 Latest reservations with full names:');
    allReservations.rows.forEach(row => {
      console.log(`ID: ${row.id}, Patient: ${row.patient_name}, Status: ${row.status}, Reserved by: ${row.reserved_by_fullname}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createTestReservations();