-- ลบ constraint เก่า
ALTER TABLE blood_reservations 
DROP CONSTRAINT IF EXISTS blood_reservations_status_check;

-- สร้าง constraint ใหม่ที่รองรับ cancelled_by_dispenser
ALTER TABLE blood_reservations 
ADD CONSTRAINT blood_reservations_status_check 
CHECK (status IN ('pending', 'completed', 'cancelled', 'cancelled_by_dispenser'));

-- ตรวจสอบ constraint ใหม่
SELECT 
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'blood_reservations'
    AND tc.constraint_type = 'CHECK';