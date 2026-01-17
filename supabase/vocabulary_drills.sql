-- Vocabulary Drills Cache Table
-- Stores pre-generated drills to avoid repeated API calls
-- Drills are cached per user per day

CREATE TABLE IF NOT EXISTS vocabulary_drills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  
  -- Drill content (JSON)
  drill_data JSONB NOT NULL,
  -- Example structure:
  -- {
  --   "type": "Cloned",
  --   "content": "The policy was designed to _____ the impact.",
  --   "options": ["mitigate", "lessen", "eliminate", "alleviate"],
  --   "correctAnswer": "mitigate",
  --   "explanation": "Mitigate is the precise term..."
  -- }
  
  -- Cache metadata
  generated_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- One drill per user per word per day
  UNIQUE(user_id, word, generated_date)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_vocab_drills_user_date 
  ON vocabulary_drills(user_id, generated_date);

CREATE INDEX IF NOT EXISTS idx_vocab_drills_word 
  ON vocabulary_drills(user_id, word, generated_date);

-- Auto-cleanup: Delete drills older than 7 days
CREATE OR REPLACE FUNCTION cleanup_old_drills()
RETURNS void AS $$
BEGIN
  DELETE FROM vocabulary_drills
  WHERE generated_date < CURRENT_DATE - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Optional: Schedule cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-old-drills', '0 2 * * *', 'SELECT cleanup_old_drills()');

COMMENT ON TABLE vocabulary_drills IS 'Caches generated vocabulary drills to reduce API usage';
COMMENT ON COLUMN vocabulary_drills.drill_data IS 'JSON structure matching DrillProblem type';
COMMENT ON COLUMN vocabulary_drills.generated_date IS 'Date when drill was generated (for daily cache invalidation)';
