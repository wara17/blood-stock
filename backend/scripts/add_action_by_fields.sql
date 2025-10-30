-- Add fields to track who performed actions on reservations
ALTER TABLE blood_reservations 
ADD COLUMN IF NOT EXISTS completed_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS cancelled_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;

-- Add comments for documentation
COMMENT ON COLUMN blood_reservations.completed_by IS 'User ID who marked the reservation as completed (dispensed blood)';
COMMENT ON COLUMN blood_reservations.cancelled_by IS 'User ID who cancelled the reservation';
COMMENT ON COLUMN blood_reservations.cancelled_at IS 'Timestamp when the reservation was cancelled';

-- Update the updateStatus method to handle these new fields