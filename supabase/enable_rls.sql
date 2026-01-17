-- Enable Row Level Security (RLS) for all vocabulary tables
-- This ensures users can only access their own data

-- ============================================
-- 1. vocabulary_progress
-- ============================================
ALTER TABLE vocabulary_progress ENABLE ROW LEVEL SECURITY;

-- Users can only see their own progress
CREATE POLICY "Users can view own vocabulary progress"
  ON vocabulary_progress FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can insert their own progress
CREATE POLICY "Users can insert own vocabulary progress"
  ON vocabulary_progress FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can update their own progress
CREATE POLICY "Users can update own vocabulary progress"
  ON vocabulary_progress FOR UPDATE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can delete their own progress
CREATE POLICY "Users can delete own vocabulary progress"
  ON vocabulary_progress FOR DELETE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================
-- 2. vocabulary_drills
-- ============================================
ALTER TABLE vocabulary_drills ENABLE ROW LEVEL SECURITY;

-- Users can only see their own cached drills
CREATE POLICY "Users can view own vocabulary drills"
  ON vocabulary_drills FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can insert their own drills
CREATE POLICY "Users can insert own vocabulary drills"
  ON vocabulary_drills FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can update their own drills
CREATE POLICY "Users can update own vocabulary drills"
  ON vocabulary_drills FOR UPDATE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can delete their own drills
CREATE POLICY "Users can delete own vocabulary drills"
  ON vocabulary_drills FOR DELETE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================
-- 3. problem_images
-- ============================================
ALTER TABLE problem_images ENABLE ROW LEVEL SECURITY;

-- Users can only see their own images
CREATE POLICY "Users can view own problem images"
  ON problem_images FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can insert their own images
CREATE POLICY "Users can insert own problem images"
  ON problem_images FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can update their own images
CREATE POLICY "Users can update own problem images"
  ON problem_images FOR UPDATE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can delete their own images
CREATE POLICY "Users can delete own problem images"
  ON problem_images FOR DELETE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================
-- 4. study_collections
-- ============================================
ALTER TABLE study_collections ENABLE ROW LEVEL SECURITY;

-- Users can only see their own collections
CREATE POLICY "Users can view own study collections"
  ON study_collections FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can insert their own collections
CREATE POLICY "Users can insert own study collections"
  ON study_collections FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can update their own collections
CREATE POLICY "Users can update own study collections"
  ON study_collections FOR UPDATE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can delete their own collections
CREATE POLICY "Users can delete own study collections"
  ON study_collections FOR DELETE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================
-- 5. collection_items
-- ============================================
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;

-- Users can only see items in their own collections
CREATE POLICY "Users can view own collection items"
  ON collection_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM study_collections
      WHERE study_collections.id = collection_items.collection_id
      AND study_collections.user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Users can insert items into their own collections
CREATE POLICY "Users can insert own collection items"
  ON collection_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM study_collections
      WHERE study_collections.id = collection_items.collection_id
      AND study_collections.user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Users can update items in their own collections
CREATE POLICY "Users can update own collection items"
  ON collection_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM study_collections
      WHERE study_collections.id = collection_items.collection_id
      AND study_collections.user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Users can delete items from their own collections
CREATE POLICY "Users can delete own collection items"
  ON collection_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM study_collections
      WHERE study_collections.id = collection_items.collection_id
      AND study_collections.user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- ============================================
-- Verification
-- ============================================
-- Run this to verify RLS is enabled:
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('vocabulary_progress', 'vocabulary_drills', 'problem_images', 'study_collections', 'collection_items');

COMMENT ON POLICY "Users can view own vocabulary progress" ON vocabulary_progress IS 'RLS policy: Users can only view their own vocabulary progress';
COMMENT ON POLICY "Users can view own vocabulary drills" ON vocabulary_drills IS 'RLS policy: Users can only view their own cached drills';
COMMENT ON POLICY "Users can view own problem images" ON problem_images IS 'RLS policy: Users can only view their own problem images';
COMMENT ON POLICY "Users can view own study collections" ON study_collections IS 'RLS policy: Users can only view their own study collections';
COMMENT ON POLICY "Users can view own collection items" ON collection_items IS 'RLS policy: Users can only view items in their own collections';
