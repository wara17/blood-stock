-- Create table for storing relationship between reservations and blood bags
-- This will track which blood bags were dispensed for each reservation

CREATE TABLE IF NOT EXISTS reservation_blood_bags (
    id SERIAL PRIMARY KEY,
    reservation_id INTEGER NOT NULL REFERENCES blood_reservations(id) ON DELETE CASCADE,
    blood_bag_id INTEGER NOT NULL REFERENCES blood_inventory(id) ON DELETE CASCADE,
    dispensed_by VARCHAR(100) NOT NULL, -- ผู้จ่ายเลือด
    dispensed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT, -- หมายเหตุเพิ่มเติม
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one blood bag can only be dispensed once per reservation
    UNIQUE(reservation_id, blood_bag_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reservation_blood_bags_reservation_id ON reservation_blood_bags(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_blood_bags_blood_bag_id ON reservation_blood_bags(blood_bag_id);
CREATE INDEX IF NOT EXISTS idx_reservation_blood_bags_dispensed_at ON reservation_blood_bags(dispensed_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reservation_blood_bags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reservation_blood_bags_updated_at
    BEFORE UPDATE ON reservation_blood_bags
    FOR EACH ROW
    EXECUTE FUNCTION update_reservation_blood_bags_updated_at();

-- Add comment to table
COMMENT ON TABLE reservation_blood_bags IS 'Tracks which blood bags were dispensed for each reservation';
COMMENT ON COLUMN reservation_blood_bags.dispensed_by IS 'Name or ID of the person who dispensed the blood';
COMMENT ON COLUMN reservation_blood_bags.dispensed_at IS 'Timestamp when the blood was dispensed';
COMMENT ON COLUMN reservation_blood_bags.notes IS 'Additional notes about the dispensing process';