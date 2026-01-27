-- Resource Decay Prediction Schema

-- Table for resource usage tracking
CREATE TABLE IF NOT EXISTS resource_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_type TEXT NOT NULL,
    hospital_id UUID DEFAULT gen_random_uuid(), -- In real app, this would reference hospitals table
    quantity INTEGER NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Realtime for resource_usage
ALTER TABLE resource_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_usage REPLICA IDENTITY FULL;

-- Create view for resource decay summary
CREATE OR REPLACE VIEW resource_decay_summary AS
WITH resource_trends AS (
    SELECT 
        resource_type,
        hospital_id,
        quantity,
        recorded_at,
        LAG(quantity) OVER (
            PARTITION BY resource_type, hospital_id 
            ORDER BY recorded_at
        ) as previous_quantity,
        LAG(recorded_at) OVER (
            PARTITION BY resource_type, hospital_id 
            ORDER BY recorded_at
        ) as previous_recorded_at
    FROM resource_usage
),
decay_calculations AS (
    SELECT 
        resource_type,
        hospital_id,
        quantity as current_stock,
        previous_quantity,
        recorded_at as last_updated,
        previous_recorded_at,
        CASE 
            WHEN previous_quantity IS NULL THEN 0
            ELSE (previous_quantity - quantity) / NULLIF(
                EXTRACT(EPOCH FROM (recorded_at - previous_recorded_at)) / 86400, 0
            )
        END as daily_usage_rate,
        CASE 
            WHEN previous_quantity IS NULL THEN 'stable'
            WHEN quantity <= previous_quantity * 0.5 THEN 'critical'
            WHEN quantity <= previous_quantity * 0.75 THEN 'high'
            WHEN quantity <= previous_quantity * 0.9 THEN 'medium'
            ELSE 'low'
        END as waste_risk,
        -- Simulate expiry date (in real app, this would come from inventory data)
        recorded_at + INTERVAL '30 days' as expiry_date
    FROM resource_trends
)
SELECT 
    resource_type as name,
    'Supplies' as category, -- Default category, in real app this would be from inventory
    current_stock,
    COALESCE(ROUND(daily_usage_rate), 0) as usage_velocity,
    TO_CHAR(expiry_date, 'YYYY-MM-DD') as expiry_date,
    waste_risk,
    TO_CHAR(last_updated, 'YYYY-MM-DD HH24:MI:SS') as last_updated,
    'Storage Area' as location -- Default location, in real app this would be from inventory
FROM decay_calculations
ORDER BY waste_risk DESC, current_stock ASC;

-- Insert sample data for testing
INSERT INTO resource_usage (resource_type, hospital_id, quantity, recorded_at) VALUES
('Paracetamol 500mg', gen_random_uuid(), 245, NOW() - INTERVAL '2 hours'),
('Paracetamol 500mg', gen_random_uuid(), 260, NOW() - INTERVAL '1 day'),
('IV Catheters', gen_random_uuid(), 89, NOW() - INTERVAL '1 hour'),
('IV Catheters', gen_random_uuid(), 95, NOW() - INTERVAL '2 days'),
('Surgical Gloves', gen_random_uuid(), 1200, NOW() - INTERVAL '30 minutes'),
('Surgical Gloves', gen_random_uuid(), 1250, NOW() - INTERVAL '1 day'),
('Insulin Vials', gen_random_uuid(), 34, NOW() - INTERVAL '15 minutes'),
('Insulin Vials', gen_random_uuid(), 40, NOW() - INTERVAL '3 hours'),
('Blood Bags O+', gen_random_uuid(), 8, NOW() - INTERVAL '5 minutes'),
('Blood Bags O+', gen_random_uuid(), 12, NOW() - INTERVAL '1 hour')
ON CONFLICT DO NOTHING;
