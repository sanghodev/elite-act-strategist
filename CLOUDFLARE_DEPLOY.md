# 🌐 Cloudflare Pages 배포 가이드

## ✅ GitHub 업로드 완료!

**저장소 URL**: https://github.com/sanghodev/elite-act-strategist

**업로드된 파일**: 24개 파일 및 폴더
- ✅ 모든 소스 코드
- ✅ 설정 파일
- ✅ 문서

---

## 🚀 Cloudflare Pages 배포 (5분)

### 1단계: Cloudflare 대시보드 접속

1. **Cloudflare 접속**: https://dash.cloudflare.com
2. **로그인** (계정 없으면 무료 가입)

### 2단계: Pages 프로젝트 생성

1. 왼쪽 메뉴에서 **Workers & Pages** 클릭
2. **Create application** 버튼 클릭
3. **Pages** 탭 선택
4. **Connect to Git** 클릭

### 3단계: GitHub 연결

1. **Connect GitHub** 클릭
2. GitHub 권한 승인
3. **저장소 선택**: `sanghodev/elite-act-strategist` 선택
4. **Begin setup** 클릭

### 4단계: 빌드 설정 (중요!)

```
Project name: elite-act-strategist
Production branch: main

Build settings:
┌─────────────────────────────────────────┐
│ Framework preset: Vite                  │
│ Build command: npm run build            │
│ Build output directory: dist            │
└─────────────────────────────────────────┘
```

### 5단계: 환경 변수 설정 (매우 중요!)

**Environment variables** 섹션에서 다음 3개 변수 추가:

#### 변수 1: VITE_GEMINI_API_KEY
```
Variable name: VITE_GEMINI_API_KEY
Value: AIzaSyDV5inYzNAmMYU-Qga6JYJYIpF-NyaJ0jE
```

#### 변수 2: VITE_SUPABASE_URL
```
Variable name: VITE_SUPABASE_URL
Value: https://mehofiukedhljrpfgtks.supabase.co
```

#### 변수 3: VITE_SUPABASE_ANON_KEY
```
Variable name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1laG9maXVrZWRobGpycGZndGtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NTM3NjIsImV4cCI6MjA4NDAyOTc2Mn0.66vDv46R44muWG4O43qxComyYshXRT7Rk6msaqQEbRc
```

**⚠️ 중요**: 각 변수 추가 후 **Add** 버튼 클릭!

### 6단계: 배포 시작

1. 모든 설정 확인
2. **Save and Deploy** 클릭
3. 빌드 로그 확인 (약 2-3분 소요)

---

## ✅ 배포 완료 확인

### 성공 메시지
```
✓ Build completed successfully
✓ Deploying to Cloudflare's global network
✓ Deployment complete
```

### 생성된 URL
```
https://elite-act-strategist.pages.dev
```

또는 커스텀 서브도메인:
```
https://elite-act-strategist-xxx.pages.dev
```

---

## 🧪 배포 후 테스트

### 1. 사이트 접속
- 생성된 URL로 접속
- 로딩 확인

### 2. 기능 테스트
- [ ] 온보딩 완료
- [ ] 문제 분석 기능 (Gemini API)
- [ ] Dashboard 표시
- [ ] Supabase 동기화

### 3. 모바일 테스트
- [ ] 폰에서 접속
- [ ] 반응형 확인
- [ ] 터치 동작 확인

---

## 🔄 업데이트 방법

코드 수정 후:

```bash
git add .
git commit -m "업데이트 내용"
git push
```

→ Cloudflare Pages가 **자동으로 재배포**! 🚀

---

## 🐛 문제 해결

### 빌드 실패
**증상**: "Build failed" 에러
**해결**:
1. Cloudflare Pages → Deployments → 실패한 빌드 클릭
2. 로그 확인
3. 로컬에서 `npm run build` 테스트
4. 에러 수정 후 다시 푸시

### 환경 변수 오류
**증상**: "API key not valid" 또는 빈 화면
**해결**:
1. Settings → Environment variables
2. 변수 이름 확인 (`VITE_` 접두사 필수!)
3. 값 재입력
4. **Redeploy** 클릭

### 404 에러
**증상**: 페이지를 찾을 수 없음
**해결**:
1. Build output directory가 `dist`인지 확인
2. Build command가 `npm run build`인지 확인
3. Framework preset이 `Vite`인지 확인

---

## 🌐 커스텀 도메인 (선택사항)

### 본인 도메인 연결

1. Cloudflare Pages 대시보드
2. 프로젝트 선택
3. **Custom domains** 탭
4. **Set up a custom domain** 클릭
5. 도메인 입력 (예: `act.yourdomain.com`)
6. DNS 설정 (Cloudflare가 자동 안내)

---

## 📊 배포 완료 체크리스트

- [ ] Cloudflare Pages 프로젝트 생성
- [ ] GitHub 저장소 연결
- [ ] 빌드 설정 (Vite, npm run build, dist)
- [ ] 환경 변수 3개 추가
- [ ] 배포 성공 확인
- [ ] 사이트 접속 테스트
- [ ] AI 분석 기능 테스트
- [ ] Supabase 동기화 테스트
- [ ] 모바일 반응형 테스트

---

## 🎉 완료!

배포가 성공하면:
- ✅ 전 세계 어디서나 접속 가능
- ✅ 자동 HTTPS (보안 연결)
- ✅ 무료 호스팅
- ✅ 자동 배포 (Git push만!)
- ✅ CDN으로 빠른 속도
- ✅ 무제한 대역폭

**URL을 친구들과 공유하고 함께 ACT 36점 도전!** 🚀

---

**다음 단계**: Cloudflare Pages 대시보드에서 배포 시작!
