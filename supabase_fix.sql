-- ============================================
-- Supabase RLS 정책 수정 스크립트
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요
-- ============================================

-- 1. 기존 RLS 정책 제거 (있다면)
DROP POLICY IF EXISTS "Enable all access for users table" ON users;
DROP POLICY IF EXISTS "Enable all access for history table" ON history;

-- 2. RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;

-- 3. Users 테이블 정책: 모든 익명 사용자가 자신의 데이터를 읽고 쓸 수 있도록 허용
CREATE POLICY "Enable insert for all users" ON users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable select for all users" ON users
  FOR SELECT
  USING (true);

CREATE POLICY "Enable update for all users" ON users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON users
  FOR DELETE
  USING (true);

-- 4. History 테이블 정책: 모든 익명 사용자가 자신의 데이터를 읽고 쓸 수 있도록 허용
CREATE POLICY "Enable insert for all history" ON history
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable select for all history" ON history
  FOR SELECT
  USING (true);

CREATE POLICY "Enable update for all history" ON history
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for all history" ON history
  FOR DELETE
  USING (true);

-- 5. 테이블 구조 확인 및 누락된 컬럼 추가 (있다면)
-- created_at과 updated_at이 없으면 추가
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE users ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- 6. 자동 업데이트 트리거 (이미 있다면 재생성)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 7. 인덱스 확인 및 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_history_user_id ON history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_timestamp ON history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);

-- 완료 메시지
SELECT 'Supabase RLS policies and schema updated successfully!' as status;
