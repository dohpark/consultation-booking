# 상담예약 시스템 실행 가이드

## 깃허브 주소

- https://github.com/dohpark/consultation-booking

## 사전 요구사항

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker (권장)

## 실행 방법

### 1단계: 저장소 클론 및 설치

```bash
git clone https://github.com/dohpark/consultation-booking
cd consultation-booking
pnpm install
```

### 2단계: 환경 변수 파일 생성

**apps/server/.env.development 파일 생성:**

다음 내용을 복사해서 붙여넣기:

```env
DATABASE_URL="postgresql://consultation_user:consultation_pass@postgres:5432/consultation_booking_dev"
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=3002
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
APPLICANT_FRONTEND_URL="http://localhost:5174"
GOOGLE_CLIENT_ID="your-google-client-id"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="your-email@gmail.com"
RESERVATION_TOKEN_EXPIRES_DAYS=30
```

**apps/admin/.env 파일 생성:**

다음 내용을 복사해서 붙여넣기:

```env
VITE_API_URL=http://localhost:3002
VITE_GOOGLE_CLIENT_ID="your-google-client-id"
```

### 3단계: Google OAuth 및 Gmail SMTP 설정

**Google OAuth 설정 (상담사 로그인용):**

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 또는 기존 프로젝트 선택
3. **APIs & Services** > **Credentials** 이동
4. **Create Credentials** > **OAuth client ID** 선택
5. Application type: **Web application**
6. **Authorized redirect URIs** 추가: `http://localhost:3002/api/auth/google/callback`
7. 생성된 **Client ID**를 복사
8. `apps/server/.env.development`와 `apps/admin/.env` 파일의 `GOOGLE_CLIENT_ID`에 붙여넣기

**Gmail SMTP 설정 (초대 링크 발송용):**

1. Google 계정에서 **2단계 인증** 활성화
2. **앱 비밀번호** 생성:
   - Google 계정 설정 > 보안 > 2단계 인증 > 앱 비밀번호
3. 생성된 앱 비밀번호를 복사
4. `apps/server/.env.development` 파일의 `SMTP_PASSWORD`에 붙여넣기
5. `SMTP_USER`와 `SMTP_FROM`에 본인의 Gmail 주소 입력

> **참고**: 환경 변수 파일의 `your-google-client-id`, `your-email@gmail.com`, `your-app-password` 등을 실제 값으로 변경해야 합니다.

### 4단계: Docker 실행 (PostgreSQL 컨테이너 시작)

**백엔드 서버 실행 (Docker 사용):**

```bash
pnpm dev:server:docker
```

이 명령어는 PostgreSQL 컨테이너를 먼저 시작하고, 백엔드 서버를 실행합니다.

### 5단계: 데이터베이스 마이그레이션

**새 터미널 창을 열고 (첫 실행 시에만 필요):**

```bash
cd apps/server
pnpm prisma migrate dev
```

이 명령어는 Docker 컨테이너에 생성된 PostgreSQL 데이터베이스에 테이블을 생성합니다.

### 6단계: 프론트엔드 실행

**새 터미널 창에서 Admin Frontend 실행:**

```bash
pnpm dev:admin
```

**또 다른 새 터미널 창에서 Applicant Frontend 실행:**

```bash
pnpm dev:applicant
```

### 7단계: 접속

- Admin Frontend (상담사): http://localhost:5173
- Applicant Frontend (신청자): http://localhost:5174
- Backend API: http://localhost:3002/api
