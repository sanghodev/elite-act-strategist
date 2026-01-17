-- Add study_plan column to users table
-- This stores the user's customized study period and daily goals

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS study_plan JSONB DEFAULT '{
  "period": "balanced",
  "start_date": null,
  "target_date": null,
  "daily_goal": 16,
  "total_words": 300,
  "custom": {
    "new_words_per_day": 6,
    "review_words_per_day": 10
  }
}'::jsonb;

-- Add index for faster queries on study_plan period
CREATE INDEX IF NOT EXISTS idx_users_study_plan_period 
ON users ((study_plan->>'period'));

-- Add index for faster queries on target_date
CREATE INDEX IF NOT EXISTS idx_users_study_plan_target_date 
ON users ((study_plan->>'target_date'));

-- Example queries:

-- Get users with intensive study plans
-- SELECT id, email, study_plan 
-- FROM users 
-- WHERE study_plan->>'period' = 'intensive';

-- Get users with upcoming test dates (within 7 days)
-- SELECT id, email, study_plan->>'target_date' as test_date
-- FROM users
-- WHERE (study_plan->>'target_date')::date <= CURRENT_DATE + INTERVAL '7 days'
-- AND (study_plan->>'target_date')::date >= CURRENT_DATE;

-- Update a user's study plan
-- UPDATE users
-- SET study_plan = '{
--   "period": "intensive",
--   "start_date": "2026-01-17T00:00:00.000Z",
--   "target_date": "2026-01-31T00:00:00.000Z",
--   "daily_goal": 40,
--   "total_words": 300,
--   "custom": {
--     "new_words_per_day": 22,
--     "review_words_per_day": 18
--   }
-- }'::jsonb
-- WHERE id = 'USER_ID';
