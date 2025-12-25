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

# Backend (로컬 실행 - 로컬 PostgreSQL 필요)
pnpm dev:server

# Backend (Docker 실행 - PostgreSQL 포함, Hot Reload 지원)
pnpm dev:server:docker
```

**개발 시 선택:**

- **로컬 실행**: `pnpm dev:server` - 로컬에 PostgreSQL 설치 필요
- **Docker 실행**: `pnpm dev:server:docker` - PostgreSQL 포함, 컨테이너 환경에서 테스트

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

## Docker 실행

### 개발 모드 (PostgreSQL 포함)

```bash
# Docker로 개발 서버 실행 (PostgreSQL + Hot Reload 지원)
pnpm dev:server:docker

# 중지: Ctrl+C 또는
docker-compose -f docker-compose.dev.yml down

# 데이터베이스 데이터 삭제 (볼륨 삭제)
docker-compose -f docker-compose.dev.yml down -v
```

**개발 모드 특징:**

- PostgreSQL 컨테이너 자동 실행
- 서버와 DB가 같은 네트워크에서 통신
- Hot Reload 지원
- 데이터는 볼륨에 저장 (컨테이너 재시작해도 유지)

### 프로덕션 모드

```bash
# 환경 변수 파일 생성
cp apps/server/.env.example apps/server/.env
# .env 파일에서 DATABASE_URL을 RDS 엔드포인트로 설정

# 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f server

# 중지
docker-compose down
```

**프로덕션 특징:**

- AWS RDS PostgreSQL 사용 (환경 변수로 설정)
- 프로덕션 빌드 이미지 사용
- Health check 포함

## 데이터베이스 설정

### 개발 환경

**Docker 사용 시:**

- `docker-compose.dev.yml`에 PostgreSQL 포함
- 자동으로 서버와 연결됨
- 별도 설정 불필요

**로컬 실행 시:**

- 로컬에 PostgreSQL 설치 필요
- `apps/server/.env`에서 `DATABASE_URL` 설정

### 프로덕션 환경

- AWS RDS PostgreSQL 사용
- `DATABASE_URL` 환경 변수로 RDS 엔드포인트 설정
- AWS Secrets Manager 또는 환경 변수로 관리

## 라이선스

Private
