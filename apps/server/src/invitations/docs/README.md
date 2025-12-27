# Invitations Module Documentation

## 개요

예약 링크 토큰 발급 및 이메일 전송 시스템입니다. Admin이 이메일 주소를 입력하면 초대 링크가 생성되고 자동으로 이메일로 전송됩니다. 예약자는 이메일의 링크를 클릭하여 예약 페이지에 접근할 수 있습니다.

**토큰 정책**: 1회 예약용이 아니라 "해당 email에 대한 관리 토큰" 성격으로, 취소/조회 등 관리 기능에 사용됩니다.

## 필수 설정

### 환경 변수 설정

`apps/server/.env` 파일에 다음 환경 변수를 설정하세요:

```env
# 초대 토큰 만료일 (일 단위, 기본값: 7일)
INVITATION_TOKEN_EXPIRES_DAYS=7

# 예약자 프론트엔드 URL (초대 링크 생성 시 사용)
APPLICANT_FRONTEND_URL=http://localhost:5173

# SMTP 설정 (이메일 전송용)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
```

**참고**: 환경 변수가 설정되지 않은 경우 기본값이 사용됩니다.

- `INVITATION_TOKEN_EXPIRES_DAYS`: 기본값 7일
- `APPLICANT_FRONTEND_URL`: 기본값 `http://localhost:5173`
- `SMTP_HOST`: 기본값 `smtp.gmail.com`
- `SMTP_PORT`: 기본값 `587`
- `SMTP_USER`, `SMTP_PASSWORD`: 이메일 전송을 위해 필수
- `SMTP_FROM`: 발신자 이메일 (기본값: `SMTP_USER`)

## API 엔드포인트

### POST /api/admin/invitations

Admin이 이메일 주소를 입력하면 초대 링크 토큰을 생성하고 해당 이메일로 자동 전송합니다.

**인증**: `AdminRoleGuard` 필요 (JWT 인증 필수)

**Request:**

```json
{
  "email": "client@example.com",
  "expiresInDays": 7
}
```

**Request DTO:**

- `email` (required): 예약자 이메일 주소
- `expiresInDays` (optional): 토큰 만료일 (일 단위, 기본값: 환경변수 또는 7일)
  - 최소: 1일
  - 최대: 365일

**Response:**

```json
{
  "success": true,
  "data": {
    "token": "a1b2c3d4e5f6...",
    "link": "http://localhost:5173/reservation?token=a1b2c3d4e5f6...",
    "email": "client@example.com",
    "expiresAt": "2025-01-14T00:00:00.000Z",
    "counselorId": "counselor-uuid"
  },
  "message": "이메일이 전송되었습니다."
}
```

**동작 방식:**

1. 이메일 정규화 (`toLowerCase().trim()`)
2. 만료일 계산 (요청 파라미터 또는 환경변수 또는 기본값 7일)
3. 기존 토큰이 있으면 삭제 후 새로 생성 (재발급)
4. 랜덤 토큰 생성 (32바이트 = 64자리 hex 문자열)
5. 초대 링크 생성 (`APPLICANT_FRONTEND_URL/reservation?token=...`)
6. 상담사 정보 조회 (이메일 본문에 이름 포함)
7. 이메일 전송 (SMTP를 통해 예약자에게 초대 링크 전송)

**에러 응답:**

- `400 Bad Request`: 유효하지 않은 이메일 주소
- `500 Internal Server Error`: 이메일 전송 실패 (SMTP 설정 확인 필요)
5. 프론트엔드 링크 생성

**에러 응답:**

- `400 Bad Request`: 이메일 형식 오류, 만료일 범위 초과
- `401 Unauthorized`: 인증 실패
- `403 Forbidden`: Admin 권한 없음

### GET /api/public/invitations/validate

토큰을 검증하고 상담사 정보를 반환합니다.

**인증**: 불필요 (Public 엔드포인트)

**Query Parameters:**

- `token` (required): 검증할 토큰

**Request Example:**

```
GET /api/public/invitations/validate?token=a1b2c3d4e5f6...
```

**Response:**

```json
{
  "success": true,
  "data": {
    "email": "counselor@example.com",
    "counselorId": "counselor-uuid",
    "expiresAt": "2025-01-14T00:00:00.000Z"
  },
  "message": "토큰이 유효합니다."
}
```

**에러 응답:**

- `400 Bad Request`: 토큰 파라미터 없음
- `404 Not Found`: 유효하지 않거나 만료된 토큰, 상담사 정보 없음

## 토큰 정책

### 토큰 특성

1. **관리 토큰**: 1회 예약용이 아니라 해당 email에 대한 관리 토큰
   - 예약 생성
   - 예약 취소
   - 예약 조회

2. **재발급 가능**: 같은 상담사(counselorId)로 새 토큰을 생성하면 기존 토큰은 자동 삭제되고 새 토큰이 발급됩니다.

3. **만료 설정**:
   - 기본값: 7일
   - 환경변수로 변경 가능 (`INVITATION_TOKEN_EXPIRES_DAYS`)
   - 요청 시 `expiresInDays` 파라미터로 개별 설정 가능

4. **토큰 형식**: 32바이트 랜덤 hex 문자열 (64자리)

### 토큰 검증 로직

1. 토큰 존재 확인
2. 만료일 확인 (`expiresAt < 현재시간`)
3. 상담사 정보 조회 및 반환

## 프론트엔드 연동

### Admin: 초대 링크 생성

```typescript
// Admin이 이메일로 초대 링크 생성
const response = await fetch('http://localhost:3002/api/admin/invitations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // JWT 쿠키 전송
  body: JSON.stringify({
    email: 'client@example.com',
    expiresInDays: 7, // 선택사항
  }),
});

const data = await response.json();
if (data.success) {
  const { link, token } = data.data;
  // 링크를 이메일로 발송하거나 클립보드에 복사
  console.log('초대 링크:', link);
}
```

### Public: 토큰 검증

```typescript
// 예약 페이지 접근 시 토큰 검증
const token = new URLSearchParams(window.location.search).get('token');

if (token) {
  const response = await fetch(`http://localhost:3002/api/public/invitations/validate?token=${token}`, {
    method: 'GET',
  });

  const data = await response.json();
  if (data.success) {
    const { email, counselorId, expiresAt } = data.data;
    // 토큰이 유효함 - 예약 페이지 표시
    console.log('상담사 이메일:', email);
  } else {
    // 토큰이 유효하지 않음 - 에러 페이지 표시
    console.error('유효하지 않은 토큰');
  }
}
```

## 데이터베이스 스키마

### InviteToken 모델

```prisma
model InviteToken {
  id          String   @id @default(uuid())
  counselorId String   @map("counselor_id")
  token       String   @unique
  expiresAt   DateTime @map("expires_at")
  createdAt   DateTime @default(now()) @map("created_at")

  counselor Counselor @relation(fields: [counselorId], references: [id], onDelete: Cascade)

  @@index([expiresAt]) // 만료된 토큰 정리 쿼리 최적화
  @@map("invite_tokens")
}
```

**관계:**

- `Counselor`와 1:N 관계 (한 상담사는 여러 토큰 생성 가능, 하지만 활성 토큰은 1개)
- `counselorId`로 기존 토큰 조회 시 만료되지 않은 토큰만 반환

## 파일 구조

```
invitations/
├── admin-invitations.controller.ts    # Admin 전용 초대 링크 생성 API
├── public-invitations.controller.ts    # Public 토큰 검증 API
├── invitations.service.ts              # 비즈니스 로직
├── invitations.repository.ts           # 데이터 접근 계층
├── invitations.module.ts               # 모듈 설정
├── dto/                                # 요청/응답 DTO
│   ├── create-invitation.dto.ts       # 초대 링크 생성 요청 DTO
│   ├── invitation-response.dto.ts     # 초대 링크 생성 응답 DTO
│   └── validate-token-response.dto.ts # 토큰 검증 응답 DTO
└── docs/
    └── README.md                       # 이 문서
```

## 주요 기능

### 1. 토큰 생성 (`createInvitation`)

- 이메일 정규화 (`toLowerCase().trim()`)
- 만료일 계산 (환경변수 또는 요청 파라미터 또는 기본값)
- 기존 토큰 재발급 (같은 counselorId의 기존 토큰 삭제 후 새로 생성)
- 프론트엔드 링크 생성

### 2. 토큰 검증 (`validateToken`)

- 토큰 존재 확인
- 만료일 확인
- 상담사 정보 조회 및 반환

### 3. Repository 메서드

- `createOrUpdateInviteToken`: 토큰 생성/재발급
- `validateToken`: 토큰 검증 (counselor 정보 포함)
- `findByCounselorId`: 상담사 ID로 활성 토큰 조회

## 에러 처리

### BadRequestException (400)

- 이메일 형식 오류
- 만료일 범위 초과 (1일 미만 또는 365일 초과)
- 토큰 파라미터 없음

### NotFoundException (404)

- 유효하지 않은 토큰
- 만료된 토큰
- 상담사 정보 없음

### ForbiddenException (403)

- Admin 권한 없음 (Admin 엔드포인트 접근 시)

## 보안 고려사항

1. **토큰 생성**: Admin 전용 (`AdminRoleGuard` 적용)
2. **토큰 검증**: Public 엔드포인트 (인증 불필요)
3. **토큰 형식**: 32바이트 랜덤 hex 문자열 (예측 불가능)
4. **만료 처리**: 자동 만료 확인 및 검증 실패 처리
5. **재발급**: 기존 토큰 자동 삭제로 중복 토큰 방지

## 향후 확장 가능성

1. **이메일 발송**: 초대 링크 생성 시 자동 이메일 발송
2. **토큰 사용 횟수 제한**: 토큰별 사용 횟수 추적
3. **토큰 만료 연장**: 만료 전 토큰 연장 기능
4. **토큰 목록 조회**: Admin이 생성한 토큰 목록 조회
5. **토큰 수동 만료**: Admin이 토큰을 수동으로 만료 처리
