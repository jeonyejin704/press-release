# PressFlow — 대학 언론홍보 관리 시스템

> 대학 홍보팀의 **언론홍보 신청 · AI 보도자료 초안 생성 · 검토 · 수정이력 · 영문본 검토 · 현황 대시보드 · 뉴스 모니터링**을 하나의 웹 솔루션에서 처리합니다.

Google Form + Outlook 메일 + 분산된 첨부파일로 진행되던 보도자료 업무를,
신청부터 배포까지 하나의 흐름(Flow)으로 관리하기 위해 만든 MVP입니다.

---

## 1. 프로젝트 개요

- 신청자(교수·연구원·행정 담당자)와 홍보팀 담당자가 **같은 시스템**에서
  신청 → 초안 → 검토 → 수정 → 국문/영문 최종본 → 배포까지 진행합니다.
- 연구성과는 **논문 초록을 입력하면 AI가 보도자료 초안을 자동 생성**합니다.
- 모든 수정은 **버전 이력**으로 추적되고, 주요 변경은 **감사 로그(AuditLog)** 에 기록됩니다.

## 2. 해결하려는 문제

| 기존 방식 | PressFlow |
| --- | --- |
| Google Form으로 신청 접수 | 유형별 신청 폼 (연구성과/수상/위원선임/동정/행사/기타) |
| 초안·사진을 Outlook 메일로 별도 수신 | 신청 건에 초안·첨부파일·코멘트 일괄 관리 |
| 메일 반복 (수정요청·재검토·확인) | 상태 워크플로우 + 인앱 알림 |
| 국문/영문 버전 관리 어려움 | KO/EN 릴리스 + 버전 스냅샷 |
| 현황 파악 어려움 | 유형·학과·상태·월별 대시보드 |
| 언론 보도 수동 검색 | 키워드 뉴스 모니터링 (Mock/확장형 Provider) |

## 3. 주요 기능

- **역할 기반**: 신청자 / 홍보팀 담당자 / 관리자
- **홍보 신청**: 6개 유형별 상세 폼, 임시저장·제출
- **AI 초안 생성**: 연구성과 → 논문 초록 기반 보도자료 초안 (제목/부제/본문/요약/쉬운설명/캡션)
- **보도자료 에디터**: 국문·영문, 미리보기, **버전 이력/변경자/변경사유**
- **검토 워크플로우**: 14단계 상태, 자료 보완 요청, 예상 배포일 안내, 최종본 확정
- **첨부파일**: 유형별 업로드(로컬 스토리지), 대표 이미지, **자료 누락 자동 감지**
- **체크리스트**: 유형별 자료 확인 체크리스트
- **대시보드**: KPI 카드, 월별 추이/유형별 비율/학과별 차트, "오늘 할 일" 목록
- **뉴스 모니터링**: POSTECH/포항공과대학교/포스텍 키워드, 중요 표시
- **알림**: 인앱 알림 (이메일/Graph 연동은 확장 지점)

## 4. 기술 스택

- **Frontend/Backend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS (네이비/블루/화이트)
- **Charts**: Recharts
- **DB/ORM**: Prisma + **SQLite** (개발), PostgreSQL 전환 지원
- **Validation**: Zod
- **AI/News/Notification**: Provider 추상화 (Mock 기본, 실연동 확장)

> **설계 결정(문서화된 기본값)**
> - MVP는 **SQLite**로 무설정 실행됩니다. SQLite는 Prisma enum을 지원하지 않으므로 enum 값은 `String` + `src/lib/enums.ts`의 타입/라벨로 관리합니다. PostgreSQL 전환 방법은 `prisma/schema.prisma` 상단 주석 참고.
> - `shadcn/ui` 대신 무설정 실행을 위해 Tailwind 기반 경량 UI 컴포넌트(`src/components/ui.tsx`)를 직접 구현했습니다.
> - 인증은 데모용 이메일 쿠키 세션입니다. 실제 SSO/Entra ID 연동 시 `src/lib/session.ts`만 교체하면 됩니다.

## 5. 설치 방법

```bash
git clone <repo-url>
cd pressflow
npm install
cp .env.example .env      # 기본값(SQLite/Mock)으로 바로 실행 가능
```

## 6. 환경변수 설정

`.env.example`를 복사한 `.env`로 실행합니다. 기본값만으로 동작합니다.

| 변수 | 설명 | 기본값 |
| --- | --- | --- |
| `DATABASE_URL` | DB 연결 | `file:./dev.db` |
| `AI_PROVIDER` | `mock` / `anthropic` | `mock` |
| `ANTHROPIC_API_KEY` | Anthropic 사용 시 | (빈값) |
| `NEWS_PROVIDER` | `mock` / `naver`(TODO) | `mock` |
| `NOTIFICATION_EMAIL_PROVIDER` | `none` / `smtp` / `graph`(TODO) | `none` |

실제 AI 초안을 쓰려면: `AI_PROVIDER=anthropic`, `ANTHROPIC_API_KEY=sk-...` 설정.

## 7. 개발 서버 실행

```bash
npm run setup    # prisma generate + db push + seed (최초 1회)
npm run dev      # http://localhost:3000
```

프로덕션 빌드:

```bash
npm run build && npm run start
```

## 8. 데이터베이스 마이그레이션

```bash
npm run db:push      # 스키마를 DB에 반영 (개발용, 빠름)
npm run db:migrate   # 마이그레이션 파일 생성/적용
npm run db:seed      # 샘플 데이터 삽입
npm run db:reset     # 초기화 후 재시드
```

## 9. 테스트 / 확인 방법

```bash
npm run typecheck    # 타입 검사
npm run build        # 전체 빌드 검증
```

로그인 데모 계정 (비밀번호 없음, 이메일만 입력):

| 역할 | 이메일 |
| --- | --- |
| 신청자 | `prof.kim@postech.ac.kr`, `prof.lee@postech.ac.kr` |
| 홍보팀 담당자 | `pr.manager@postech.ac.kr` |
| 관리자 | `admin@postech.ac.kr` |

**빠른 시나리오**
1. `prof.kim`으로 로그인 → 새 홍보 신청 → 연구성과 → 초록 입력 후 임시저장
2. 상세 페이지에서 **AI 보도자료 초안 생성** → 보도자료 탭 확인 → 제출
3. `pr.manager`로 로그인 → 대시보드 → 신청 상세 → 상태 변경/배포일 안내/최종본 확정
4. 뉴스 모니터링 → 새로고침 → 중요 표시

## 10. 향후 개선 과제 (TODO)

- 실 인증(SSO/Microsoft Entra ID) 연동
- 이메일/Outlook Graph/Slack/Teams/카카오 알림 어댑터 구현
- Naver/Bing/Google/RSS 뉴스 Provider 구현
- Crossref DOI 메타데이터 자동 확인 (`DoiMetadataProvider`)
- 보도자료 Word/PDF 내보내기 (현재 구조상 확장 지점 마련)
- 기자단 배포 관리, 권한 관리 UI, DB 기반 프롬프트/템플릿 편집
- PostgreSQL 전환 및 파일 스토리지(S3/Azure Blob) 어댑터

자세한 설계는 [`docs/`](./docs) 참고:
[PRD](./docs/PRD.md) · [WORKFLOW](./docs/WORKFLOW.md) · [DATABASE](./docs/DATABASE.md) · [API](./docs/API.md)
