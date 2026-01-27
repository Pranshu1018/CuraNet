-- Disease Outbreak Detection Schema

-- Table for individual disease cases
CREATE TABLE IF NOT EXISTS disease_cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    disease TEXT NOT NULL,
    area TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    cases INTEGER NOT NULL DEFAULT 1,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Realtime for disease_cases
ALTER TABLE disease_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE disease_cases REPLICA IDENTITY FULL;

-- Create view for aggregated outbreak summary
CREATE OR REPLACE VIEW disease_outbreak_summary AS
SELECT 
    disease,
    area,
    severity,
    SUM(cases) as total_cases,
    COUNT(*) as reports,
    MAX(detected_at) as latest_detection,
    MIN(detected_at) as first_detection,
    CASE 
        WHEN SUM(cases) <= 10 THEN 'low'
        WHEN SUM(cases) <= 50 THEN 'medium'
        WHEN SUM(cases) <= 200 THEN 'high'
        ELSE 'critical'
    END as calculated_severity,
    CASE 
        WHEN COUNT(*) = 1 THEN 'stable'
        WHEN MAX(detected_at) > MIN(detected_at) + INTERVAL '24 hours' THEN 'increasing'
        ELSE 'stable'
    END as trend
FROM disease_cases 
GROUP BY disease, area, severity
ORDER BY latest_detection DESC;

-- Insert sample data for testing
INSERT INTO disease_cases (disease, area, severity, cases, detected_at) VALUES
('Influenza Type A', 'Downtown District', 'high', 342, NOW() - INTERVAL '4 days'),
('Influenza Type A', 'North Suburbs', 'high', 128, NOW() - INTERVAL '3 days'),
('Influenza Type A', 'East Side', 'medium', 87, NOW() - INTERVAL '2 days'),
('Norovirus', 'West End', 'medium', 45, NOW() - INTERVAL '5 days'),
('Norovirus', 'Central District', 'medium', 42, NOW() - INTERVAL '4 days'),
('RSV (Respiratory Syncytial Virus)', 'Pediatric Ward - City General', 'critical', 89, NOW() - INTERVAL '9 days'),
('RSV (Respiratory Syncytial Virus)', 'Children''s Hospital', 'critical', 67, NOW() - INTERVAL '8 days'),
('Hand, Foot & Mouth Disease', 'South District', 'low', 23, NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;
