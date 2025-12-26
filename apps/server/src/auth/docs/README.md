# Auth Module Documentation

## 개요

Admin 사용자를 위한 Google OAuth 인증 및 JWT 기반 인증 시스템입니다.

**인증 흐름**: `[Frontend] → Google OAuth → id_token → [Backend] → JWT 발급 → [API 요청]`

## 필수 설정

### 1. Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 → **APIs & Services** > **OAuth consent screen** 설정
3. **Credentials** > **Create Credentials** > **OAuth client ID**
4. Application type: **Web application**
5. **Authorized JavaScript origins** 추가:
   ```
   http://localhost:3000
   http://localhost:5173
   ```
6. **Authorized redirect URIs**: 비워두거나 `http://localhost:3002/api/auth/google/callback` 추가
7. **Client ID 복사**

### 2. 환경 변수 설정

`apps/server/.env.example` 파일을 참고하여 `apps/server/.env` 파일을 생성하세요:

```bash
cp apps/server/.env.example apps/server/.env
```

그리고 `.env` 파일에서 실제 값으로 변경:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
```

**참고**: 현재 구현은 `id_token` 검증 방식을 사용하므로 `GOOGLE_CLIENT_SECRET`은 선택사항입니다. 하지만 향후 확장을 위해 설정해두는 것을 권장합니다.

**JWT Secret 생성:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## API 엔드포인트

### POST /api/auth/google

Google OAuth `id_token`을 검증하고 JWT 토큰을 발급합니다.

**Request:**

```json
{
  "idToken": "google-id-token-string"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "email": "user@example.com",
      "name": "User Name"
    }
  }
}
```

**참고**: JWT 토큰은 HTTP-only 쿠키로 자동 설정됩니다. `accessToken`은 응답 본문에 포함되지 않습니다.

### 보호된 엔드포인트 사용

#### JWT 인증만 필요한 경우 (JwtAuthGuard)

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUser as CurrentUserType } from '../auth/decorators/current-user.decorator';

@Controller('example')
export class ExampleController {
  @Get('protected')
  @UseGuards(JwtAuthGuard)
  getProtectedData(@CurrentUser() user: CurrentUserType) {
    // user.userId, user.email, user.name 사용 가능
    return { message: `Hello ${user.name}!` };
  }
}
```

#### Admin 전용 API (AdminRoleGuard)

Admin 전용 API는 `AdminRoleGuard`를 사용합니다. 현재는 Google OAuth로 로그인한 사용자는 모두 Admin으로 간주됩니다.

**적용된 컨트롤러:**
- `SlotsController` - 슬롯 CRUD
- `ReservationsController` - 신청 내역 조회
- `InvitationsController` - 초대 링크 관리
- `ConsultationNotesController` - 상담 기록 작성

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminRoleGuard } from '../auth/guards/admin-role.guard';
import { CurrentUser, CurrentUser as CurrentUserType } from '../auth/decorators/current-user.decorator';

@Controller('slots')
@UseGuards(AdminRoleGuard)
export class SlotsController {
  @Get()
  getSlots(@CurrentUser() user: CurrentUserType) {
    // Admin만 접근 가능
    return { slots: [] };
  }
}
```

**Guard 동작 방식:**
1. `JwtAuthGuard`를 상속하여 JWT 인증을 먼저 확인
2. JWT가 유효하면 Admin으로 간주 (현재 구현)
3. 향후 Applicant token 기반 인증 추가 시, role 필드를 확인하도록 확장 가능

## 프론트엔드 연동

### 쿠키 기반 인증 (권장)

JWT는 HTTP-only 쿠키로 자동 설정되므로, `credentials: 'include'` 옵션만 추가하면 됩니다.

```typescript
// 1. Google OAuth 로그인 후 id_token 획득
const idToken = await googleSignIn();

// 2. 백엔드에 id_token 전달 (쿠키 자동 설정)
const response = await fetch('http://localhost:3002/api/auth/google', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // 쿠키 전송 허용
  body: JSON.stringify({ idToken }),
});

// 3. API 요청 시 쿠키 자동 포함
const apiResponse = await fetch('/api/profile', {
  credentials: 'include', // 쿠키 전송 허용
});
```

### Authorization 헤더 사용 (선택사항)

쿠키 외에 Authorization 헤더로도 JWT를 전송할 수 있습니다.

```typescript
// JWT 토큰을 직접 관리하는 경우
const apiResponse = await fetch('/api/profile', {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

## 포트 정보

- **백엔드**: `http://localhost:3002`
- **프론트엔드**: `http://localhost:3000` (React) 또는 `http://localhost:5173` (Vite)

## 문제 해결

- **"GOOGLE_CLIENT_ID is not configured"**: `.env` 파일 확인 및 서버 재시작
- **"Invalid Google token"**: Client ID 일치 확인, `id_token` 만료 확인
- **"OAuth client not found"**: Google Cloud Console에서 Client ID 확인

## Guard 종류

### JwtAuthGuard
- JWT 토큰 인증을 확인하는 기본 Guard
- Authorization 헤더 또는 쿠키에서 토큰 추출
- 모든 인증이 필요한 엔드포인트에 사용

### AdminRoleGuard
- Admin 전용 API를 보호하는 Guard
- `JwtAuthGuard`를 상속하여 JWT 인증 먼저 확인
- 현재는 Google OAuth 사용자를 모두 Admin으로 간주
- 향후 Applicant token 기반 인증 추가 시 확장 가능

## 파일 구조

```
auth/
├── auth.controller.ts          # 인증 엔드포인트
├── auth.service.ts             # 인증 비즈니스 로직
├── auth.module.ts              # Auth 모듈 설정
├── auth.repository.ts          # 인증 데이터 접근 (향후 확장용)
├── dto/                        # 요청/응답 DTO
│   ├── google-login.dto.ts
│   └── auth-response.dto.ts
├── guards/                     # 인증/인가 Guard
│   ├── jwt-auth.guard.ts       # JWT 인증 Guard
│   └── admin-role.guard.ts     # Admin 전용 Guard
├── strategies/                 # Passport Strategy
│   └── jwt.strategy.ts         # JWT 검증 Strategy
└── decorators/                 # 커스텀 데코레이터
    └── current-user.decorator.ts # CurrentUser 데코레이터
```
