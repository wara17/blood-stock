const ReservationBloodBags = require('../models/ReservationBloodBags');

async function testUpdatedMethod() {
  try {
    console.log('🔍 Testing updated getReservationWithBloodBags method...\n');
    
    const result = await ReservationBloodBags.getReservationWithBloodBags(12);
    
    console.log('📋 Result:');
    console.log('reserved_by:', result.reserved_by);
    console.log('completed_by_username:', result.completed_by_username);
    console.log('cancelled_by_username:', result.cancelled_by_username);
    console.log('approved_by_username:', result.approved_by_username);
    
    console.log('\n📋 Full result:');
    console.log(JSON.stringify(result, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

testUpdatedMethod();