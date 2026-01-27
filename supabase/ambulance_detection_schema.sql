-- Ambulance Detection Schema

-- Table for ambulance location and status events
CREATE TABLE IF NOT EXISTS ambulance_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ambulance_id TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'dispatched', 'available', 'maintenance')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Realtime for ambulance_events
ALTER TABLE ambulance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambulance_events REPLICA IDENTITY FULL;

-- Create view for latest ambulance positions
CREATE OR REPLACE VIEW ambulance_latest_positions AS
WITH ranked_events AS (
    SELECT 
        ambulance_id,
        lat,
        lng,
        status,
        updated_at,
        ROW_NUMBER() OVER (PARTITION BY ambulance_id ORDER BY updated_at DESC) as rn
    FROM ambulance_events
)
SELECT 
    ambulance_id,
    lat,
    lng,
    status,
    updated_at
FROM ranked_events
WHERE rn = 1
ORDER BY updated_at DESC;

-- Insert sample data for testing
INSERT INTO ambulance_events (ambulance_id, lat, lng, status, updated_at) VALUES
('AMB-001', 40.7128, -74.0060, 'active', NOW() - INTERVAL '2 minutes'),
('AMB-002', 40.7489, -73.9680, 'dispatched', NOW() - INTERVAL '5 minutes'),
('AMB-003', 40.7282, -74.0776, 'available', NOW() - INTERVAL '1 minute'),
('AMB-004', 40.7589, -73.9851, 'maintenance', NOW() - INTERVAL '3 hours')
ON CONFLICT DO NOTHING;
