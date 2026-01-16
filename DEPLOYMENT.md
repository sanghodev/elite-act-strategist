# 🚀 GitHub & Cloudflare Pages 배포 가이드

## 📋 단계별 가이드

### 1단계: Git 저장소 초기화

```bash
# ACT 프로젝트 폴더에서 실행
git init
git add .
git commit -m "Initial commit: Elite ACT Strategist"
```

### 2단계: GitHub 저장소 생성

1. **GitHub 웹사이트 접속**: https://github.com
2. **New Repository 클릭**
3. **저장소 설정**:
   - Repository name: `elite-act-strategist` (또는 원하는 이름)
   - Description: `AI-powered ACT prep tool for 34-36 students`
   - **Public** 선택 (Cloudflare Pages 무료 플랜 사용)
   - ❌ **Initialize this repository with** 체크 해제 (이미 로컬에 코드 있음)
4. **Create repository 클릭**

### 3단계: GitHub에 코드 푸시

GitHub에서 제공하는 명령어 실행:

```bash
# GitHub 저장소 연결
git remote add origin https://github.com/[사용자명]/elite-act-strategist.git

# 기본 브랜치 이름 설정
git branch -M main

# 코드 푸시
git push -u origin main
```

**예시**:
```bash
git remote add origin https://github.com/donutscan/elite-act-strategist.git
git branch -M main
git push -u origin main
```

### 4단계: Cloudflare Pages 설정

1. **Cloudflare 대시보드 접속**: https://dash.cloudflare.com
2. **Workers & Pages** 메뉴 클릭
3. **Create application** → **Pages** → **Connect to Git** 선택
4. **GitHub 계정 연결**:
   - "Connect GitHub" 클릭
   - 권한 승인
   - 저장소 선택: `elite-act-strategist`

5. **빌드 설정 구성**:
   ```
   Project name: elite-act-strategist (자동 생성됨)
   Production branch: main
   
   Build settings:
   - Framework preset: Vite
   - Build command: npm run build
   - Build output directory: dist
   ```

6. **환경 변수 설정** (중요!):
   - **Environment variables** 섹션에서 **Add variable** 클릭
   - 다음 변수 추가:
   
   ```
   VITE_GEMINI_API_KEY = [여기에 Gemini API 키 입력]
   VITE_SUPABASE_URL = https://mehofiukedhljrpfgtks.supabase.co
   VITE_SUPABASE_ANON_KEY = [여기에 Supabase Anon 키 입력]
   ```

7. **Save and Deploy** 클릭

### 5단계: 배포 완료 및 확인

1. **배포 진행 상황 확인**:
   - 빌드 로그 실시간 확인
   - 약 2-3분 소요

2. **배포 완료 후**:
   - Cloudflare가 자동으로 URL 생성
   - 예: `https://elite-act-strategist.pages.dev`

3. **사이트 접속 테스트**:
   - 생성된 URL로 접속
   - 모든 기능 작동 확인
   - 모바일에서도 테스트

---

## 🔧 환경 변수 찾기

### Gemini API Key
1. https://aistudio.google.com/app/apikey 접속
2. "Create API Key" 클릭
3. 생성된 키 복사

### Supabase Keys
1. Supabase 프로젝트 대시보드 접속
2. **Settings** → **API** 메뉴
3. **Project URL** 복사 → `VITE_SUPABASE_URL`
4. **anon public** 키 복사 → `VITE_SUPABASE_ANON_KEY`

---

## 📝 중요 참고사항

### ⚠️ 보안
- ❌ `.env.local` 파일은 절대 GitHub에 올리지 마세요!
- ✅ `.gitignore`에 이미 추가되어 있음
- ✅ Cloudflare Pages 환경 변수로만 관리

### 🔄 업데이트 방법
코드 수정 후 배포:
```bash
git add .
git commit -m "업데이트 내용 설명"
git push
```
→ Cloudflare Pages가 자동으로 재배포!

### 🌐 커스텀 도메인 (선택사항)
1. Cloudflare Pages 대시보드
2. **Custom domains** 탭
3. **Set up a custom domain** 클릭
4. 본인 도메인 입력 (예: `act.yourdomain.com`)

---

## ✅ 체크리스트

배포 전:
- [ ] `.env.local` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] 모든 코드가 커밋되었는지 확인
- [ ] 로컬에서 `npm run build` 성공하는지 테스트

배포 후:
- [ ] 사이트 접속 확인
- [ ] 문제 분석 기능 작동 확인 (Gemini API)
- [ ] Supabase 동기화 확인
- [ ] 모바일 반응형 확인

---

## 🐛 문제 해결

### 빌드 실패
**증상**: Cloudflare Pages에서 빌드 에러
**해결**:
1. 로컬에서 `npm run build` 실행
2. 에러 메시지 확인 및 수정
3. 다시 푸시

### 환경 변수 오류
**증상**: "API key not valid" 에러
**해결**:
1. Cloudflare Pages → Settings → Environment variables
2. 변수 이름 확인 (`VITE_` 접두사 필수!)
3. 값 재입력 후 **Redeploy** 클릭

### 404 에러
**증상**: 페이지를 찾을 수 없음
**해결**:
1. Build output directory가 `dist`인지 확인
2. Build command가 `npm run build`인지 확인

---

## 🎉 완료!

배포가 완료되면:
- ✅ 전 세계 어디서나 접속 가능
- ✅ 자동 HTTPS (보안 연결)
- ✅ 무료 호스팅 (Cloudflare Pages)
- ✅ 자동 배포 (Git push만 하면 됨)
- ✅ CDN으로 빠른 속도

**배포 URL 예시**: `https://elite-act-strategist.pages.dev`

친구들과 공유하고 함께 ACT 36점 도전! 🚀
