# 상담예약 시스템 (Consultation Booking System)

상담사가 스케줄(30분 슬롯)을 등록하고, 이메일로 발송한 링크를 통해 신청자가 예약(및 취소)을 하는 시스템입니다.

## 프로젝트 구조

이 프로젝트는 **모노레포** 구조로 구성되어 있으며, `pnpm workspace`를 사용합니다.

```
consultation-booking/
└── apps/
    ├── admin/          # Admin Frontend (React + TailwindCSS)
    ├── applicant/      # Applicant Frontend (React + TailwindCSS)
    └── server/         # Backend (NestJS + PostgreSQL)
```

## 시작하기

### 사전 요구사항

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 설치

```bash
pnpm install
```

### 개발 서버 실행

각 앱을 독립적으로 실행할 수 있습니다:

```bash
# Admin Frontend
pnpm dev:admin

# Applicant Frontend
pnpm dev:applicant

# Backend
pnpm dev:server
```

### 빌드

```bash
# 특정 앱 빌드
pnpm build:admin
pnpm build:applicant
pnpm build:server

# 모든 앱 빌드
pnpm build:all
```

## 앱별 상세 정보

각 앱의 상세한 설정 및 실행 방법은 해당 디렉토리의 README를 참조하세요:

- [Admin Frontend](./apps/admin/README.md)
- [Applicant Frontend](./apps/applicant/README.md)
- [Backend](./apps/server/README.md)

## 기술 스택

### Frontend

- React
- TailwindCSS
- TypeScript

### Backend

- NestJS
- PostgreSQL
- TypeScript

### 인프라

- AWS ECS Fargate
- AWS RDS PostgreSQL
- AWS S3 + CloudFront
- AWS Secrets Manager

## 라이선스

Private
