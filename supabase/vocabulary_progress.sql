-- Vocabulary Progress Table for Spaced Repetition System
-- Tracks individual word learning progress using SM-2 algorithm

CREATE TABLE IF NOT EXISTS vocabulary_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  
  -- Spaced Repetition Fields (SM-2 Algorithm)
  ease_factor FLOAT DEFAULT 2.5,  -- Difficulty multiplier (1.3 - 3.0)
  interval INT DEFAULT 1,          -- Days until next review
  next_review_date DATE NOT NULL,  -- When to show this word next
  
  -- Performance Tracking
  review_count INT DEFAULT 0,      -- Total number of reviews
  correct_count INT DEFAULT 0,     -- Number of correct answers
  last_reviewed_at TIMESTAMP,      -- Last review timestamp
  
  -- Status Tracking
  status TEXT DEFAULT 'learning' CHECK (status IN ('learning', 'reviewing', 'mastered')),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure one record per user per word
  UNIQUE(user_id, word)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_vocab_next_review 
  ON vocabulary_progress(user_id, next_review_date) 
  WHERE status != 'mastered';

CREATE INDEX IF NOT EXISTS idx_vocab_status 
  ON vocabulary_progress(user_id, status);

CREATE INDEX IF NOT EXISTS idx_vocab_user 
  ON vocabulary_progress(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vocabulary_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS vocabulary_progress_updated_at ON vocabulary_progress;
CREATE TRIGGER vocabulary_progress_updated_at
  BEFORE UPDATE ON vocabulary_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_vocabulary_progress_updated_at();

-- Sample query to get words due for review today
-- SELECT word, ease_factor, interval, review_count, correct_count
-- FROM vocabulary_progress
-- WHERE user_id = 'USER_ID'
--   AND next_review_date <= CURRENT_DATE
--   AND status IN ('learning', 'reviewing')
-- ORDER BY next_review_date ASC
-- LIMIT 10;
