-- Test Query to Verify User Tracking Implementation
-- This file contains test queries to verify that the user tracking system is working correctly

-- 1. Check the blood_reservations table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'blood_reservations' 
ORDER BY ordinal_position;

-- 2. Check if we have sample data with user tracking
SELECT 
  br.id,
  br.status,
  br.patient_name,
  br.blood_group,
  u.username as reserved_by,
  ap.username as approved_by_username,
  cp.username as completed_by_username,
  cn.username as cancelled_by_username,
  br.created_at,
  br.approved_at,
  br.completed_at,
  br.cancelled_at
FROM blood_reservations br
JOIN users u ON br.user_id = u.id
LEFT JOIN users ap ON br.approved_by = ap.id
LEFT JOIN users cp ON br.completed_by = cp.id
LEFT JOIN users cn ON br.cancelled_by = cn.id
ORDER BY br.created_at DESC
LIMIT 10;

-- 3. Check user table
SELECT id, username, email, created_at 
FROM users 
ORDER BY created_at DESC;