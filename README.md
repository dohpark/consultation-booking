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

아래 `.env` 파일들은 **그대로 복사하여 사용하되**,

보안 및 외부 연동과 관련된 다음 값들은 **반드시 본인 환경에 맞게 수정해야 합니다.**

- `GOOGLE_CLIENT_ID`
- `JWT_SECRET`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`
- `VITE_GOOGLE_CLIENT_ID`

**apps/server/.env.development 파일 생성:**

```env
# Development Environment
# 로컬 개발 환경: Docker Compose의 postgres 서비스에 연결
# 호스트 포트 5433 -> 컨테이너 포트 5432

NODE_ENV=development
PORT=3002
FRONTEND_URL=http://localhost:5173

# Database (Docker Compose)
DATABASE_URL=postgresql://consultation_user:consultation_pass@localhost:5433/consultation_booking_dev


# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# JWT
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRES_IN=7d

# 초대 토큰 만료일 (일 단위, 기본값: 7일)
INVITATION_TOKEN_EXPIRES_DAYS=7

# 프론트엔드 URL (초대 링크 생성 시 사용)
APPLICANT_FRONTEND_URL=http://localhost:5174

# SMTP 설정 (이메일 전송용)
# Gmail 사용 시: Google 계정 설정 > 보안 > 2단계 인증 > 앱 비밀번호 생성 필요
# 다른 SMTP 서버 사용 시 해당 서버의 설정에 맞게 변경
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
# SMTP 인증용 이메일 주소
SMTP_USER=your-email@gmail.com
# Gmail의 경우 앱 비밀번호 사용 (일반 비밀번호 아님)
SMTP_PASSWORD=your-app-password
# 발신자 이메일 주소
SMTP_FROM=your-email@gmail.com

# ReservationToken 만료일 (일 단위, 기본값: 30일)
RESERVATION_TOKEN_EXPIRES_DAYS=30
```

**apps/admin/.env 파일 생성:**

다음 내용을 복사해서 붙여넣기:

```env
VITE_API_URL=http://localhost:3002
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 3단계: Google OAuth 및 Gmail SMTP 설정

**Google OAuth 설정 (상담사 로그인용):**

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 또는 기존 프로젝트 선택
3. **API 및 서비스** > **사용자 인증 정보** 이동
4. **사용자 인증정보 만들기 ** > **OAuth 클라이언트 ID** 선택
5. Application type: **Web application**
6. **승인된 JavaScript 원본 추가** 추가: `http://localhost:5173`
7. **승인된 리디렉션 URI 추가** 추가: `http://localhost:3002`
8. 생성된 **Client ID**를 복사
9. 아래 파일에 값 입력
   - `apps/server/.env.development`
   - `apps/admin/.env`

**Gmail SMTP 설정 (초대 링크 발송용):**

1. [https://kincoding.com/entry/Google-Gmail-SMTP-사용을-위한-세팅-2025년-버전](https://kincoding.com/entry/Google-Gmail-SMTP-%EC%82%AC%EC%9A%A9%EC%9D%84-%EC%9C%84%ED%95%9C-%EC%84%B8%ED%8C%85-2025%EB%85%84-%EB%B2%84%EC%A0%84) 참고
2. 생성된 앱 비밀번호를 복사
3. `apps/server/.env.development` 파일의 `SMTP_PASSWORD`에 붙여넣기
4. `SMTP_USER`와 `SMTP_FROM`에 본인의 Gmail 주소 입력

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
