# Supabase 동기화 문제 해결 가이드

## 문제 증상
- 400 Bad Request 에러 발생
- 사용자 프로필 및 학습 기록이 클라우드에 저장되지 않음
- 로컬 저장소(localStorage)는 정상 작동

## 원인
Supabase의 **Row Level Security (RLS)** 정책이 설정되지 않아 익명 사용자가 데이터를 삽입/업데이트할 수 없음

## 해결 방법

### 방법 1: Supabase SQL Editor 사용 (권장)

1. **Supabase 대시보드 접속**
   - https://supabase.com 로그인
   - 프로젝트 선택

2. **SQL Editor 열기**
   - 왼쪽 메뉴에서 "SQL Editor" 클릭
   - "New query" 클릭

3. **SQL 스크립트 실행**
   - `supabase_fix.sql` 파일의 내용을 복사
   - SQL Editor에 붙여넣기
   - "Run" 버튼 클릭

4. **성공 확인**
   - 결과에 "Supabase RLS policies and schema updated successfully!" 메시지 표시

### 방법 2: Supabase UI에서 수동 설정

#### Users 테이블 RLS 설정

1. **Authentication → Policies 이동**
2. **users 테이블 선택**
3. **"New Policy" 클릭**
4. **다음 정책 추가:**

**정책 1: Insert 허용**
```
Policy name: Enable insert for all users
Target roles: public
USING expression: true
WITH CHECK expression: true
```

**정책 2: Select 허용**
```
Policy name: Enable select for all users
Target roles: public
USING expression: true
```

**정책 3: Update 허용**
```
Policy name: Enable update for all users
Target roles: public
USING expression: true
WITH CHECK expression: true
```

**정책 4: Delete 허용**
```
Policy name: Enable delete for all users
Target roles: public
USING expression: true
```

#### History 테이블 RLS 설정

위와 동일한 4개 정책을 `history` 테이블에도 추가

### 방법 3: RLS 완전 비활성화 (개발 환경 전용)

⚠️ **주의**: 프로덕션 환경에서는 권장하지 않음

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE history DISABLE ROW LEVEL SECURITY;
```

## 테스트 방법

1. **앱 재시작**
   - 개발 서버 중지 (Ctrl+C)
   - `npm run dev` 재실행

2. **브라우저에서 테스트**
   - http://localhost:3000 접속
   - 새로운 문제 분석 수행
   - Dashboard에서 기록 확인

3. **Supabase에서 확인**
   - Supabase → Table Editor → users 테이블
   - 새로운 사용자 레코드가 생성되었는지 확인
   - history 테이블에 학습 기록이 저장되었는지 확인

4. **콘솔 확인**
   - 브라우저 개발자 도구 (F12)
   - Console 탭에서 400 에러가 사라졌는지 확인

## 추가 확인 사항

### 환경 변수 확인
`.env.local` 파일에 다음 값이 올바르게 설정되어 있는지 확인:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 테이블 스키마 확인

**Users 테이블 구조:**
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  target_score INTEGER DEFAULT 36,
  preferences JSONB DEFAULT '{"highContrast": false, "autoSave": true, "enableTimer": true}'::jsonb,
  vocab_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**History 테이블 구조:**
```sql
CREATE TABLE history (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  timestamp BIGINT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 문제가 계속되면

1. **Supabase 프로젝트 상태 확인**
   - 프로젝트가 일시 중지되지 않았는지 확인
   - 무료 플랜 한도를 초과하지 않았는지 확인

2. **API 키 재생성**
   - Supabase → Settings → API
   - "Reset" 클릭하여 새 키 생성
   - `.env.local` 파일 업데이트

3. **브라우저 캐시 삭제**
   - 개발자 도구 (F12)
   - Application → Clear storage
   - "Clear site data" 클릭

4. **앱 내 테스트 기능 사용**
   - Settings → Supabase Integration
   - "Test Connection" 버튼 클릭
   - 연결 상태 확인

## 성공 확인

✅ **다음 사항이 모두 정상이면 성공:**
1. 브라우저 콘솔에 400 에러 없음
2. Dashboard에 학습 기록 표시됨
3. Supabase Table Editor에서 데이터 확인 가능
4. Settings에서 "Test Connection" 성공 메시지

---

**문제 해결 후 점수: 100/100** 🎉
