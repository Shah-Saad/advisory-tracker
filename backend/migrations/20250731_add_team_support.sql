-- Migration to add team support
-- Add team column to users table
ALTER TABLE users ADD COLUMN team VARCHAR(50) DEFAULT 'general';

-- Add team column to sheet_entries table  
ALTER TABLE sheet_entries ADD COLUMN assigned_team VARCHAR(50);

-- Add distributed_to_teams column to sheets table
ALTER TABLE sheets ADD COLUMN distributed_to_teams TEXT; -- JSON array of teams

-- Update existing users to have a team
UPDATE users SET team = 'general' WHERE team IS NULL;

-- Add index for better performance
CREATE INDEX idx_users_team ON users(team);
CREATE INDEX idx_sheet_entries_team ON sheet_entries(assigned_team);

-- Create teams reference table
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert the three teams
INSERT INTO teams (name, display_name, description) VALUES 
('generation', 'Generation Team', 'Power generation operations and maintenance'),
('distribution', 'Distribution Team', 'Power distribution and delivery systems'),
('transmission', 'Transmission Team', 'Power transmission infrastructure and operations');
