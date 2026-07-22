# PressFlow — API 문서

모든 엔드포인트는 데모 세션 쿠키(`pf_session`)로 인증합니다.
권한 부족 시 `401`(미인증) / `403`(권한없음) / `404`(접근불가·미존재)를 반환합니다.

## Auth

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/api/auth/login` | `{ email }` — 데모 로그인(비밀번호 없음) |
| POST | `/api/auth/logout` | 로그아웃 |
| GET | `/api/auth/me` | 현재 사용자 |

## Press Requests

| Method | Path | 설명 | 권한 |
| --- | --- | --- | --- |
| GET | `/api/press-requests` | 목록(담당자=전체, 신청자=본인) | 로그인 |
| POST | `/api/press-requests` | 신청 생성 `{ type, title, detail, submit, ... }` | 로그인 |
| PATCH | `/api/press-requests/:id` | 필드 수정(예상 배포일 등) | 소유/담당자 |
| PATCH | `/api/press-requests/:id/status` | 상태 변경 `{ status }` | 소유(제한)/담당자 |

### POST body (요약)

```jsonc
{
  "type": "RESEARCH",
  "title": "…",
  "department": "화학공학과",
  "contactPhone": "010-…",
  "desiredPublishDate": "2026-08-01",
  "isUrgent": false,
  "publicDisclosureAllowed": true,
  "note": "…",
  "submit": true,                  // false면 DRAFT 저장
  "detail": { "paperTitleKo": "…", "abstract": "…" }  // 유형별 필드
}
```

## AI

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/api/ai/generate-press-release` | `{ pressRequestId }` — 연구성과 KO 초안 생성 |

응답: `{ releaseId, provider }` (provider = `mock`/`anthropic`)

## Press Releases

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/press-requests/:id/releases` | 릴리스 목록(KO/EN) |
| POST | `/api/press-requests/:id/releases` | `{ language }` — 릴리스 생성/보장 |
| PATCH | `/api/releases/:id` | 내용 수정(직전 버전 스냅샷 후 version++) |
| POST | `/api/releases/:id/finalize` | 최종본 확정(담당자) |
| GET | `/api/releases/:id/versions` | 버전 이력 |

## Attachments

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/api/press-requests/:id/attachments` | multipart `file, fileType, description` |
| GET | `/api/press-requests/:id/attachments` | 목록 |
| DELETE | `/api/attachments/:id` | 삭제(소유/담당자) |

## Comments

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/api/press-requests/:id/comments` | `{ body }` |
| GET | `/api/press-requests/:id/comments` | 목록 |

## Checklist

| Method | Path | 설명 |
| --- | --- | --- |
| PATCH | `/api/press-requests/:id/checklist` | `{ key, checked }` (담당자) |

## Notifications

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/notifications` | 내 알림(최근 50) |
| PATCH | `/api/notifications/:id/read` | 읽음 처리 |

## Dashboard

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/dashboard/summary` | KPI·유형별·학과별·월별·할 일 목록 일괄 (담당자) |

> 세부 슬라이스(by-type/by-department/monthly-trend/pending-tasks)는 summary 응답에 포함되어 있어
> 별도 호출 없이 사용합니다. 필요 시 동일 데이터 소스(`src/lib/dashboard.ts`)로 분리 가능.

## News

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/news?keyword=` | 뉴스 목록 |
| POST | `/api/news/refresh` | Provider에서 수집(중복 url 제거) (담당자) |
| PATCH | `/api/news/:id/important` | `{ isImportant }` 토글 (담당자) |
