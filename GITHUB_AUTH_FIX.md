# 🔐 GitHub 인증 문제 해결

## ❌ 발생한 오류
```
fatal: Authentication failed for 'https://github.com/donutscan/elite-act-strategist.git'
```

## 🔧 해결 방법 (3가지 중 선택)

### 방법 1: GitHub Desktop 사용 (가장 쉬움) ⭐ 추천

1. **GitHub Desktop 다운로드**: https://desktop.github.com
2. **설치 후 실행**
3. **File** → **Add local repository**
4. **폴더 선택**: `C:\Users\hp\Documents\GitHub\ACT`
5. **Publish repository** 클릭
6. **저장소 이름 확인**: `elite-act-strategist`
7. **Keep this code private** 체크 해제 (Public으로)
8. **Publish repository** 클릭

✅ **완료!** GitHub Desktop이 자동으로 푸시합니다.

---

### 방법 2: Personal Access Token 사용 (명령줄)

#### 2-1. GitHub에서 토큰 생성

1. **GitHub 접속**: https://github.com/settings/tokens
2. **Generate new token** → **Generate new token (classic)** 클릭
3. **설정**:
   ```
   Note: ACT Deployment
   Expiration: 90 days (또는 원하는 기간)
   
   Scopes (권한):
   ✅ repo (전체 선택)
   ```
4. **Generate token** 클릭
5. **토큰 복사** (한 번만 표시됨!)
   - 예: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

#### 2-2. 토큰으로 푸시

```bash
# 기존 origin 제거
git remote remove origin

# 토큰을 포함한 URL로 다시 추가
git remote add origin https://[토큰]@github.com/donutscan/elite-act-strategist.git

# 푸시
git push -u origin main
```

**예시**:
```bash
git remote remove origin
git remote add origin https://ghp_abc123xyz@github.com/donutscan/elite-act-strategist.git
git push -u origin main
```

---

### 방법 3: SSH 키 사용 (고급)

#### 3-1. SSH 키 생성

```bash
# SSH 키 생성
ssh-keygen -t ed25519 -C "donutscan@gmail.com"

# Enter 3번 (기본 위치, 비밀번호 없음)
```

#### 3-2. SSH 키를 GitHub에 추가

```bash
# 공개 키 복사
cat ~/.ssh/id_ed25519.pub
```

1. **GitHub 접속**: https://github.com/settings/keys
2. **New SSH key** 클릭
3. **Title**: `ACT Deployment`
4. **Key**: 복사한 공개 키 붙여넣기
5. **Add SSH key** 클릭

#### 3-3. SSH로 푸시

```bash
# 기존 origin 제거
git remote remove origin

# SSH URL로 다시 추가
git remote add origin git@github.com:donutscan/elite-act-strategist.git

# 푸시
git push -u origin main
```

---

## 🎯 권장 방법

### 초보자: **방법 1 (GitHub Desktop)** ⭐
- 가장 쉽고 빠름
- GUI로 직관적
- 인증 자동 처리

### 중급자: **방법 2 (Personal Access Token)**
- 명령줄 사용 가능
- 토큰 관리 필요
- 90일마다 갱신

### 고급자: **방법 3 (SSH)**
- 가장 안전
- 한 번 설정하면 영구 사용
- 비밀번호 불필요

---

## ✅ 성공 확인

푸시가 성공하면 다음과 같은 메시지가 표시됩니다:

```
Enumerating objects: XX, done.
Counting objects: 100% (XX/XX), done.
Delta compression using up to X threads
Compressing objects: 100% (XX/XX), done.
Writing objects: 100% (XX/XX), XX.XX KiB | XX.XX MiB/s, done.
Total XX (delta XX), reused XX (delta XX), pack-reused 0
To https://github.com/donutscan/elite-act-strategist.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

GitHub 저장소 확인: https://github.com/donutscan/elite-act-strategist

---

## 🚀 다음 단계 (푸시 성공 후)

1. ✅ GitHub 저장소에서 코드 확인
2. 🌐 Cloudflare Pages 배포 시작
   - https://dash.cloudflare.com
   - Workers & Pages → Create → Connect Git
   - 저장소 선택: `elite-act-strategist`

---

## 💡 팁

- **GitHub Desktop 추천**: 가장 쉽고 빠른 방법
- **토큰 저장**: 토큰을 안전한 곳에 보관 (메모장 등)
- **SSH 키**: 한 번 설정하면 계속 사용 가능

어떤 방법을 선택하시겠습니까?
