# Elite ACT Strategist - 설치 및 설정 가이드

> **목표**: ACT 34점을 35-36점으로 끌어올리기 위한 전문가급 학습 전략 시스템

## 시스템 요구사항

- **Node.js**: v18.0.0 이상 (권장: v20.x LTS)
- **npm**: v9.0.0 이상
- **운영체제**: Windows 10/11, macOS, Linux
- **브라우저**: Chrome, Edge, Safari (최신 버전)

## 빠른 시작 (Quick Start)

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

**Gemini API 키 발급 방법:**
1. [Google AI Studio](https://aistudio.google.com/app/apikey) 접속
2. "Create API Key" 클릭
3. 생성된 키를 복사하여 위 파일에 붙여넣기

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

## 상세 설정 가이드

### Supabase 설정 (선택사항 - 클라우드 동기화)

Supabase를 사용하면 여러 기기에서 학습 데이터를 동기화할 수 있습니다.

#### 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com) 가입 및 로그인
2. "New Project" 클릭
3. 프로젝트 이름 및 비밀번호 설정

#### 2. 데이터베이스 테이블 생성

Supabase SQL Editor에서 다음 쿼리 실행:

```sql
-- Users 테이블 (사용자 프로필 및 학습 설정)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  target_score INTEGER DEFAULT 36,
  preferences JSONB DEFAULT '{"highContrast": false, "autoSave": true, "enableTimer": true}'::jsonb,
  vocab_data JSONB DEFAULT '{"mastered": [], "stats": {"masteredCount": 0, "streak": 0, "lastPracticeDate": "", "avgLatency": 0, "accuracyRate": 0}, "dailyMission": {"date": "", "words": [], "progress": 0}, "latencyHistory": [], "accuracyHistory": []}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- History 테이블 (학습 기록 및 분석 데이터)
CREATE TABLE history (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  timestamp BIGINT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_history_user_id ON history(user_id);
CREATE INDEX idx_history_timestamp ON history(timestamp DESC);
CREATE INDEX idx_users_name ON users(name);

-- 자동 업데이트 트리거
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
```

#### 3. 환경 변수에 Supabase 자격 증명 추가

`.env.local` 파일에 추가:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**자격 증명 찾기:**
- Supabase 프로젝트 → Settings → API
- Project URL과 anon/public key 복사

### 환경 변수 파일 구조

```
ACT/
├── .env.local          # 로컬 개발용 (Git에 포함되지 않음)
└── .env.example        # 템플릿 파일 (Git에 포함됨)
```

## 프로젝트 구조

```
ACT/
├── components/              # React 컴포넌트
│   ├── Dashboard.tsx       # 학습 대시보드 및 통계
│   ├── AnalysisResult.tsx  # AI 분석 결과 표시
│   ├── DrillSession.tsx    # 실전 드릴 세션
│   ├── TrainingGrounds.tsx # 약점 집중 훈련
│   ├── VocabularyTrainer.tsx # 고급 어휘 훈련
│   ├── ProblemInput.tsx    # 문제 입력 및 분석
│   ├── Settings.tsx        # 설정 및 프로필
│   ├── Onboarding.tsx      # 초기 설정
│   └── Documentation.tsx   # 사용 가이드
├── services/               # 외부 서비스 통합
│   ├── geminiService.ts   # Gemini AI 분석 엔진
│   └── supabaseClient.ts  # Supabase 데이터 동기화
├── data/                  # 정적 데이터
│   └── eliteVocab.json   # 34-36점 수준 어휘 데이터
├── types.ts              # TypeScript 타입 정의
├── App.tsx               # 메인 앱 컴포넌트
├── index.tsx             # 앱 진입점
└── index.html            # HTML 템플릿
```

## 개발 스크립트

```bash
# 개발 서버 실행 (Hot Reload)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

## 주요 기능

### 1. 전술적 문제 분석 (Combat Analysis)
- **AI 기반 심층 분석**: Gemini AI가 오답의 근본 원인 파악
- **34-36점 수준 진단**: 미세한 개념 차이 및 ACT 함정 패턴 식별
- **맞춤형 실행 규칙**: 다음 문제에서 즉시 적용 가능한 전략 제시

### 2. 적응형 드릴 시스템
- **Cloned Drill**: 동일 패턴 반복 훈련
- **Pressure Drill**: 시간 압박 상황 시뮬레이션
- **Edge Case Drill**: 예외 상황 및 고난도 변형 문제

### 3. 전술 지도 (Combat Map)
- **약점 시각화**: 섹션별/유형별 정확도 추적
- **집중 훈련**: 취약 영역 타겟 드릴 자동 생성
- **마스터리 추적**: Critical → Unstable → Secured 진행도

### 4. 엘리트 어휘 훈련
- **34-36점 수준 단어**: 실제 ACT 고득점 지문 출처
- **문맥 기반 학습**: 미묘한 뉘앙스 차이 훈련
- **적응형 복습**: 약한 단어 자동 재출제

### 5. 클라우드 동기화 (Supabase)
- **자동 저장**: 모든 학습 기록 실시간 동기화
- **다중 기기 지원**: 어디서나 학습 이어하기
- **데이터 백업**: 학습 데이터 안전 보관

## 일반적인 문제 해결

### 문제: `npm install` 실패

**해결책:**
```bash
# npm 캐시 정리
npm cache clean --force

# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### 문제: Gemini API 에러

**증상**: "API key not valid" 또는 "Empty response from AI"

**해결책:**
1. `.env.local` 파일에 API 키가 올바르게 설정되었는지 확인
2. API 키 앞뒤 공백 제거
3. 환경 변수 이름이 `VITE_GEMINI_API_KEY`인지 확인
4. 개발 서버 재시작 (`Ctrl+C` 후 `npm run dev`)

### 문제: Supabase 연결 실패

**해결책:**
1. Supabase 프로젝트가 활성화되어 있는지 확인
2. URL과 API 키가 정확한지 확인
3. 테이블이 올바르게 생성되었는지 확인
4. 앱 내 Settings에서 "Test Connection" 실행

### 문제: 빌드 에러

**해결책:**
```bash
# TypeScript 타입 체크
npx tsc --noEmit

# 의존성 버전 확인
npm outdated
```

## 성능 최적화 팁

1. **이미지 최적화**: 문제 이미지는 JPEG/WebP 형식으로 압축
2. **로컬 스토리지**: Supabase 없이도 로컬에 데이터 저장됨
3. **캐싱**: 분석 결과는 자동으로 캐시되어 재분석 불필요

## 보안 권장사항

1. **.env.local 파일 보호**: Git에 절대 커밋하지 말 것
2. **API 키 관리**: 주기적으로 키 재생성 권장
3. **Supabase RLS**: Row Level Security 활성화 권장

## 다음 단계

1. ✅ 설치 완료
2. ✅ 환경 변수 설정
3. ✅ 개발 서버 실행
4. 📚 [사용 가이드](./ARCHITECTURE.md) 읽기
5. 🎯 첫 문제 분석 시작!

## 지원 및 문의

문제가 발생하면 다음을 확인하세요:
- [프로젝트 아키텍처](./ARCHITECTURE.md)
- [GitHub Issues](https://github.com/your-repo/issues)
- 앱 내 Documentation 탭

---

**목표를 향해**: ACT 34 → 36점, 함께 달성합시다! 🚀
