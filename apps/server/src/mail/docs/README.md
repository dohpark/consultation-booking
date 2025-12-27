# Mail Module Documentation

## 개요

SMTP를 통한 이메일 전송 서비스입니다. nodemailer를 사용하여 다양한 SMTP 서버를 지원하며, 현재는 초대 링크 이메일 전송 기능을 제공합니다.

**주요 기능:**

- SMTP 서버를 통한 이메일 전송
- Gmail SMTP 지원 (앱 비밀번호 사용)
- HTML 및 텍스트 형식 이메일 템플릿
- 상담사 이름 포함한 개인화된 이메일

## 필수 설정

### 환경 변수 설정

`apps/server/.env` 또는 `apps/server/.env.development` 파일에 다음 환경 변수를 설정하세요:

```env
# SMTP 설정 (이메일 전송용)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
```

**기본값:**

- `SMTP_HOST`: `smtp.gmail.com`
- `SMTP_PORT`: `587`
- `SMTP_FROM`: `SMTP_USER` (설정되지 않은 경우)

**Gmail 사용 시 주의사항:**

1. **2단계 인증 필수**: Google 계정에서 2단계 인증을 활성화해야 합니다.
2. **앱 비밀번호 사용**: 일반 비밀번호가 아닌 앱 비밀번호를 사용해야 합니다.
   - 생성 경로: Google 계정 > 보안 > 2단계 인증 > 앱 비밀번호
   - 16자리 앱 비밀번호를 `SMTP_PASSWORD`에 설정
3. **일일 전송 한도**: 일반 Gmail 계정은 하루 최대 500통까지 전송 가능

**다른 SMTP 서버 사용:**

- SendGrid, Mailgun, AWS SES 등 다른 SMTP 서버도 사용 가능
- 해당 서버의 SMTP 설정에 맞게 `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` 설정

## 주요 기능

### 1. 초대 링크 이메일 전송 (`sendInvitationEmail`)

상담 예약 초대 링크를 이메일로 전송합니다.

**파라미터:**

- `to` (string, required): 수신자 이메일 주소
- `link` (string, required): 초대 링크 URL
- `counselorName` (string, optional): 상담사 이름 (이메일 본문에 포함)

**이메일 내용:**

- 제목: "상담 예약 초대 링크"
- HTML 형식: 스타일링된 이메일 템플릿
  - 상담사 이름 포함 인사말
  - "예약하기" 버튼
  - 링크 복사 가능한 텍스트
- 텍스트 형식: 간단한 텍스트 버전 (HTML을 지원하지 않는 클라이언트용)

**사용 예시:**

```typescript
import { MailService } from './mail.service';

// MailService는 InvitationsModule에서 주입받아 사용
async sendInvitation(counselorId: string, email: string) {
  const link = `${frontendUrl}/reservation?token=${token}`;
  const counselor = await this.prisma.counselor.findUnique({
    where: { id: counselorId },
    select: { name: true },
  });

  await this.mailService.sendInvitationEmail(
    email,
    link,
    counselor?.name
  );
}
```

## 에러 처리

### Gmail 인증 오류

**에러 메시지:**

```
530-5.7.0 Authentication Required
```

**해결 방법:**

1. `SMTP_USER`와 `SMTP_PASSWORD`가 올바르게 설정되었는지 확인
2. Gmail의 경우 앱 비밀번호를 사용해야 합니다 (일반 비밀번호 사용 불가)
3. Google 계정 > 보안 > 2단계 인증 > 앱 비밀번호에서 앱 비밀번호 생성

### 일반 SMTP 오류

**에러 메시지:**

```
이메일 전송에 실패했습니다: [에러 메시지]. SMTP 설정을 확인해주세요.
```

**확인 사항:**

- SMTP 서버 주소 (`SMTP_HOST`)가 올바른지 확인
- SMTP 포트 (`SMTP_PORT`)가 올바른지 확인
- 인증 정보 (`SMTP_USER`, `SMTP_PASSWORD`)가 올바른지 확인
- 방화벽이나 네트워크 설정으로 SMTP 포트가 차단되지 않았는지 확인

## 파일 구조

```
mail/
├── mail.service.ts        # 이메일 전송 서비스
├── mail.module.ts         # 모듈 설정
└── docs/
    └── README.md          # 이 문서
```

## 기술 스택

- **nodemailer**: SMTP 이메일 전송 라이브러리
- **@nestjs/config**: 환경 변수 관리

## 향후 확장 가능성

1. **다양한 이메일 템플릿**: 예약 확인, 취소 알림 등
2. **이메일 큐 시스템**: 대량 이메일 전송 시 큐 사용
3. **이메일 전송 로그**: 전송 이력 추적
4. **템플릿 엔진**: Handlebars, EJS 등 사용
5. **첨부 파일 지원**: PDF, 이미지 등 첨부

## 참고 자료

- [nodemailer 공식 문서](https://nodemailer.com/about/)
- [Gmail SMTP 설정 가이드](https://support.google.com/mail/answer/7126229)
- [Gmail 앱 비밀번호 생성](https://support.google.com/accounts/answer/185833)
