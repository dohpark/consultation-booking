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
    "accessToken": "jwt-token-string",
    "user": {
      "email": "user@example.com",
      "name": "User Name"
    }
  }
}
```

### 보호된 엔드포인트 사용

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

## 프론트엔드 연동

```typescript
// 1. Google OAuth 로그인 후 id_token 획득
const idToken = await googleSignIn();

// 2. 백엔드에 id_token 전달하여 JWT 획득
const response = await fetch('http://localhost:3002/api/auth/google', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ idToken }),
});

const { data } = await response.json();
const { accessToken } = data;

// 3. API 요청 시 JWT 토큰 포함
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

## 파일 구조

```
auth/
├── auth.controller.ts          # 인증 엔드포인트
├── auth.service.ts             # 인증 비즈니스 로직
├── auth.module.ts              # Auth 모듈 설정
├── dto/                        # 요청/응답 DTO
├── guards/                     # JWT Guard
├── strategies/                 # JWT Strategy
└── decorators/                 # CurrentUser 데코레이터
```
