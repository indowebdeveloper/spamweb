-- Create tables

-- Create spam_clicks table
CREATE TABLE IF NOT EXISTS spam_clicks (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_stats table
CREATE TABLE IF NOT EXISTS user_stats (
  id SERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  total_clicks INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_click_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create global_stats table
CREATE TABLE IF NOT EXISTS global_stats (
  id SERIAL PRIMARY KEY,
  total_spam_count INTEGER DEFAULT 0,
  total_users INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT NOT NULL,
  threshold INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  achievement_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, achievement_id)
);

-- Create functions and triggers

-- Function to update global stats on spam click
CREATE OR REPLACE FUNCTION update_global_stats_on_spam_click()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE global_stats 
  SET 
    total_spam_count = total_spam_count + 1,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for insert on spam_clicks
DROP TRIGGER IF EXISTS update_global_stats_on_insert ON spam_clicks;
CREATE TRIGGER update_global_stats_on_insert
AFTER INSERT ON spam_clicks
FOR EACH ROW
EXECUTE FUNCTION update_global_stats_on_spam_click();

-- Function to update global users on user_stats insert
CREATE OR REPLACE FUNCTION update_global_users_on_user_stats_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE global_stats 
  SET 
    total_users = total_users + 1,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for insert on user_stats
DROP TRIGGER IF EXISTS update_global_users_on_insert ON user_stats;
CREATE TRIGGER update_global_users_on_insert
AFTER INSERT ON user_stats
FOR EACH ROW
EXECUTE FUNCTION update_global_users_on_user_stats_insert();

-- Function to get leaderboard position
CREATE OR REPLACE FUNCTION get_leaderboard_position(user_id_param TEXT)
RETURNS INTEGER AS $$
DECLARE
  user_rank INTEGER;
BEGIN
  SELECT rank INTO user_rank
  FROM (
    SELECT user_id, COUNT(*) as click_count,
           RANK() OVER (ORDER BY COUNT(*) DESC) as rank
    FROM spam_clicks
    GROUP BY user_id
  ) as user_clicks
  WHERE user_id = user_id_param;
  
  RETURN user_rank;
END;
$$ LANGUAGE plpgsql;

-- Insert initial global stats record if it doesn't exist
INSERT INTO global_stats (id, total_spam_count, total_users)
VALUES (1, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Insert default achievements
INSERT INTO achievements (title, description, emoji, threshold)
VALUES 
  ('SPAM Beginner', 'You sent your first SPAM!', '🥉', 1),
  ('SPAM Enthusiast', 'You sent 10 SPAMs!', '🥈', 10),
  ('SPAM Master', 'You sent 100 SPAMs!', '🥇', 100),
  ('SPAM Legend', 'You sent 1,000 SPAMs!', '👑', 1000),
  ('SPAM God', 'You sent 10,000 SPAMs!', '🔱', 10000)
ON CONFLICT DO NOTHING;

-- Create spam_facts table
CREATE TABLE IF NOT EXISTS spam_facts (
  id SERIAL PRIMARY KEY,
  fact TEXT NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default spam facts
INSERT INTO spam_facts (fact, emoji)
VALUES 
  ('SPAM stands for ''Spiced Ham''', '🍖'),
  ('SPAM was first introduced in 1937', '📅'),
  ('Over 8 billion cans of SPAM have been sold worldwide', '🌎'),
  ('Hawaii consumes more SPAM per capita than any other US state', '🏝️'),
  ('There is a SPAM museum in Austin, Minnesota', '🏛️'),
  ('SPAM is sold in more than 44 countries', '🌍'),
  ('During WWII, SPAM became a crucial food source for Allied troops', '🪖'),
  ('The longest recorded SPAM email chain contained over 500,000 replies', '📧'),
  ('The first SPAM email was sent in 1978', '💻'),
  ('About 95% of all email traffic is SPAM', '📊')
ON CONFLICT DO NOTHING;
