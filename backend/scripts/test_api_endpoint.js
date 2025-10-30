const pool = require('../config/database');

async function testAPIEndpoint() {
  try {
    // สร้าง simple HTTP server สำหรับทดสอบ
    const express = require('express');
    const app = express();
    
    // Import model
    const BloodReservation = require('../models/BloodReservation');
    
    // ทดสอบ getById method
    const reservationDetails = await BloodReservation.getById(12);
    
    console.log('📋 BloodReservation.getById(12) result:');
    console.log(JSON.stringify(reservationDetails, null, 2));
    
    // ทดสอบ getById method สำหรับข้อมูลที่ถูกยกเลิก
    const cancelledReservation = await BloodReservation.getById(13);
    
    console.log('\n📋 BloodReservation.getById(13) result (cancelled):');
    console.log(JSON.stringify(cancelledReservation, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

testAPIEndpoint();