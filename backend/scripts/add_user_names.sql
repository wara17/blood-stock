-- เพิ่ม firstname และ lastname ให้กับตาราง users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS firstname VARCHAR(50),
ADD COLUMN IF NOT EXISTS lastname VARCHAR(50);

-- เพิ่ม cancellation_notes ให้กับตาราง blood_reservations (ถ้ายังไม่มี)
ALTER TABLE blood_reservations 
ADD COLUMN IF NOT EXISTS cancellation_notes TEXT;

-- อัปเดตข้อมูล users ที่มีอยู่แล้วให้มี firstname และ lastname
UPDATE users SET 
  firstname = CASE
    WHEN username = 'patchree.rodkaew' THEN 'ปัจเจรี'
    WHEN username = 'chayapol.kerdprom' THEN 'ชัยพล'
    WHEN username = 'bunmee.maitong' THEN 'บุญมี'
    WHEN username = 'admin2' THEN 'ผู้ดูแลระบบ'
    ELSE SPLIT_PART(username, '.', 1)
  END,
  lastname = CASE
    WHEN username = 'patchree.rodkaew' THEN 'รอดแก้ว'
    WHEN username = 'chayapol.kerdprom' THEN 'เกิดปรม'
    WHEN username = 'bunmee.maitong' THEN 'ไม้ทอง'
    WHEN username = 'admin2' THEN 'หลัก'
    ELSE SPLIT_PART(username, '.', 2)
  END
WHERE firstname IS NULL OR lastname IS NULL;