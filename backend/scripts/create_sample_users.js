const pool = require('../config/database');

async function createSampleUsers() {
  try {
    const users = [
      {
        username: 'siriporn.nakphet',
        email: 'siriporn.nakphet@hospital.com',
        firstname: 'ศิริพร',
        lastname: 'นาคเพชร'
      },
      {
        username: 'somchai.jaidee',
        email: 'somchai.jaidee@hospital.com', 
        firstname: 'สมชาย',
        lastname: 'ใจดี'
      },
      {
        username: 'pensri.saifah',
        email: 'pensri.saifah@hospital.com',
        firstname: 'เพ็ญศรี', 
        lastname: 'สายฟ้า'
      }
    ];

    // ใช้ password hash เดียวกับ users ที่มีอยู่แล้ว
    const password = '$2b$10$k9qVXqJ8v7XJ8v7XJ8v7XO9LdYjJ7qT6O7fQ7fQ7fQ7fQ7fQ7fQ7f';

    for (const user of users) {
      const result = await pool.query(`
        INSERT INTO users (username, email, password, firstname, lastname, created_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        ON CONFLICT (username) DO UPDATE SET
          firstname = EXCLUDED.firstname,
          lastname = EXCLUDED.lastname
        RETURNING id, username, firstname, lastname;
      `, [user.username, user.email, password, user.firstname, user.lastname]);

      console.log(`✅ User created/updated: ${result.rows[0].firstname} ${result.rows[0].lastname} (ID: ${result.rows[0].id})`);
    }

    // แสดงรายชื่อผู้ใช้ทั้งหมด
    const allUsers = await pool.query(`
      SELECT id, username, firstname, lastname 
      FROM users 
      ORDER BY id;
    `);

    console.log('\n📋 All users with full names:');
    allUsers.rows.forEach(user => {
      console.log(`${user.id}: ${user.firstname} ${user.lastname} (${user.username})`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createSampleUsers();