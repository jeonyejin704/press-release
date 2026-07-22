# PressFlow — 데이터베이스 설계

전체 스키마는 [`prisma/schema.prisma`](../prisma/schema.prisma) 참고.

## DB 선택 (문서화된 기본값)

- MVP는 **SQLite**(`file:./dev.db`)로 무설정 실행.
- SQLite는 Prisma **native enum 미지원** → enum 값은 `String` 컬럼 + `src/lib/enums.ts`에서
  타입/라벨/색상으로 관리하고, 애플리케이션 계층(Zod/유니온)에서 검증.
- **PostgreSQL 전환**: `schema.prisma`의 `provider = "postgresql"`, `DATABASE_URL` 변경,
  (선택) String 상태/유형/역할/언어 컬럼을 native enum으로 승격.

## 모델 개요

| 모델 | 설명 |
| --- | --- |
| `User` | 사용자·역할(APPLICANT/PR_MANAGER/ADMIN) |
| `PressRequest` | 홍보 신청 (유형·상태·일정 등 공통 정보) |
| `ResearchDetail` | 연구성과 상세 (1:1) |
| `AwardDetail` | 수상성과 상세 (1:1) |
| `AppointmentDetail` | 위원 선임 상세 (1:1) |
| `PersonalNewsDetail` | 동정 상세 (1:1) |
| `EventDetail` | 행사/이벤트 상세 (1:1, 육하원칙) |
| `PressRelease` | 보도자료 (요청×언어 unique, KO/EN) |
| `PressReleaseVersion` | 보도자료 버전 스냅샷 |
| `Attachment` | 첨부파일 (유형·메타데이터) |
| `Comment` | 코멘트 |
| `Notification` | 인앱 알림 |
| `ChecklistItem` | 유형별 자료 체크리스트 (요청×key unique) |
| `AuditLog` | 감사 로그 |
| `NewsItem` | 수집된 뉴스 (url unique) |
| `NewsKeyword` | 모니터링 키워드 |

## 관계 (요약)

```
User 1──* PressRequest 1──1 (Research|Award|Appointment|PersonalNews|Event)Detail
                         1──* PressRelease 1──* PressReleaseVersion
                         1──* Attachment
                         1──* Comment
                         1──* ChecklistItem
                         1──* Notification
                         1──* AuditLog
```

## enum-like 값

`src/lib/enums.ts`가 단일 소스:

- **Role**: `APPLICANT`, `PR_MANAGER`, `ADMIN`
- **RequestType**: `RESEARCH`, `AWARD`, `APPOINTMENT`, `PERSONAL_NEWS`, `EVENT`, `OTHER`
- **RequestStatus**: 14단계 (WORKFLOW.md 참고)
- **Language**: `KO`, `EN`
- **AttachmentType**: 연구진 사진/대표 이미지/포스터/논문 PDF 등 9종
- **NotificationType**: 제출/보완요청/배포일안내/검토요청 등

## 인덱스 / 제약

- `PressRequest`: `status`, `type`, `department` 인덱스.
- `PressRelease`: `(pressRequestId, language)` unique.
- `ChecklistItem`: `(pressRequestId, key)` unique.
- `Attachment.fileUrl`: 랜덤 파일명(추측 방지).
- `NewsItem.url`: unique(중복 기사 제거).
- `Notification`: `(userId, isRead)` 인덱스.

## 시드 데이터 (`prisma/seed.ts`)

연구성과 3 · 수상 2 · 행사 2 · 위원선임 1 (서로 다른 학과/상태),
뉴스 10건, 신청자 2 · 담당자 1 · 관리자 1.
