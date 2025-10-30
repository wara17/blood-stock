-- Migration: Add cancellation notes and update status enum
-- Date: 2025-10-30
-- Description: Separate reservation notes from cancellation notes and add new cancellation status

-- 1. Add cancellation_notes column
ALTER TABLE blood_reservations 
ADD COLUMN IF NOT EXISTS cancellation_notes TEXT;

-- 2. Create or update status enum to include cancelled_by_dispenser
DO $$ 
BEGIN
    -- Check if the enum type exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reservation_status') THEN
        -- Create the enum type if it doesn't exist
        CREATE TYPE reservation_status AS ENUM (
            'pending',
            'approved', 
            'completed',
            'cancelled',
            'cancelled_by_dispenser'
        );
    ELSE
        -- Add the new value if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'cancelled_by_dispenser' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'reservation_status')) THEN
            ALTER TYPE reservation_status ADD VALUE 'cancelled_by_dispenser';
        END IF;
    END IF;
END $$;

-- 3. Add comments to clarify the purpose of each column
COMMENT ON COLUMN blood_reservations.notes IS 'General notes for the reservation (booking notes)';
COMMENT ON COLUMN blood_reservations.cancellation_notes IS 'Notes specifically for cancellation reasons';
COMMENT ON COLUMN blood_reservations.cancelled_by IS 'User ID who cancelled the reservation (both normal and dispenser cancellation)';
COMMENT ON COLUMN blood_reservations.cancelled_at IS 'Timestamp when the reservation was cancelled';

-- 4. Verify the updated enum values
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'reservation_status')
ORDER BY enumsortorder;