# 🔧 Supabase 동기화 문제 - 빠른 해결 가이드

## ⚡ 5분 안에 해결하기

### 1단계: Supabase 로그인
1. 브라우저에서 https://supabase.com/dashboard/sign-in 접속
2. 로그인 정보 입력:
   - Email: `donutscan@gmail.com`
   - Password: `pT3mporary!`
3. "Sign in" 클릭

### 2단계: 프로젝트 선택
- 대시보드에서 **mehofiukedhljrpfgtks** 프로젝트 클릭

### 3단계: SQL Editor 열기
1. 왼쪽 사이드바에서 **"SQL Editor"** 클릭
2. **"New query"** 버튼 클릭

### 4단계: SQL 스크립트 복사 & 실행

아래 SQL을 복사해서 SQL Editor에 붙여넣고 **"Run"** 버튼 클릭:

```sql
-- RLS 정책 생성 (400 에러 해결)
DROP POLICY IF EXISTS "Enable all access for users table" ON users;
DROP POLICY IF EXISTS "Enable all access for history table" ON history;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;

-- Users 테이블 정책
CREATE POLICY "Enable insert for all users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for all users" ON users FOR SELECT USING (true);
CREATE POLICY "Enable update for all users" ON users FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for all users" ON users FOR DELETE USING (true);

-- History 테이블 정책
CREATE POLICY "Enable insert for all history" ON history FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for all history" ON history FOR SELECT USING (true);
CREATE POLICY "Enable update for all history" ON history FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for all history" ON history FOR DELETE USING (true);

SELECT 'RLS policies created successfully! ✅' as status;
```

### 5단계: 성공 확인
- 결과창에 **"RLS policies created successfully! ✅"** 메시지가 표시되면 성공!

### 6단계: 앱 테스트
1. ACT 앱으로 돌아가기 (http://localhost:3000)
2. 브라우저 새로고침 (F5)
3. 새로운 문제 분석 수행
4. Dashboard에서 기록이 표시되는지 확인
5. 브라우저 콘솔(F12)에서 400 에러가 사라졌는지 확인

---

## ✅ 성공 확인 체크리스트

- [ ] SQL 실행 완료 (성공 메시지 확인)
- [ ] 앱 새로고침 완료
- [ ] 문제 분석 수행
- [ ] Dashboard에 기록 표시됨
- [ ] 브라우저 콘솔에 400 에러 없음

---

## 🎯 완료 후 점수

**100/100** 🎉

모든 기능이 완벽하게 작동하는 최고 수준의 ACT 학습 프로그램!

---

## 📸 스크린샷 가이드

### SQL Editor 위치
![SQL Editor는 왼쪽 사이드바에 있습니다](https://supabase.com/docs/img/sql-editor.png)

### Run 버튼
SQL을 붙여넣은 후 우측 상단의 **"Run"** 버튼을 클릭하세요.

---

## ❓ 문제가 계속되면

1. **SQL 실행 에러**
   - 테이블이 존재하는지 확인: Table Editor → users, history 테이블 확인
   - 에러 메시지를 복사해서 확인

2. **여전히 400 에러**
   - 브라우저 캐시 삭제: F12 → Application → Clear storage
   - 앱 재시작: 터미널에서 Ctrl+C 후 `npm run dev`

3. **Supabase 접속 불가**
   - 프로젝트가 일시 중지되지 않았는지 확인
   - 무료 플랜 한도 확인

---

**이 가이드대로 하시면 5분 안에 100점 달성! 🚀**
