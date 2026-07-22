# PressFlow — 워크플로우

## 신청 상태 (14단계)

| 코드 | 라벨 |
| --- | --- |
| `DRAFT` | 초안 작성 중 |
| `SUBMITTED` | 신청 완료 |
| `PR_REVIEW` | 홍보팀 검토 중 |
| `MATERIAL_REQUESTED` | 자료 보완 요청 |
| `APPLICANT_REVIEW` | 연구진 검토 요청 |
| `KOREAN_FINAL_CONFIRMED` | 국문 최종본 확정 |
| `ENGLISH_DRAFTING` | 영문본 작성 중 |
| `ENGLISH_REVIEW_REQUESTED` | 영문본 검토 요청 |
| `REVISION_REQUESTED` | 연구진 수정 요청 |
| `FINAL_COMPLETED` | 최종 완료 |
| `SCHEDULED` | 배포 예정 |
| `DISTRIBUTED` | 배포 완료 |
| `ON_HOLD` | 보류 |
| `REJECTED` | 반려 |

## 표준 프로세스

```
신청자                          홍보팀 담당자
──────                          ────────────
1. 로그인
2. 홍보 유형 선택 (유형별 안내문 확인)
3. 기본 정보 입력
4. 초안 양식 다운로드 → 작성
5. 초안 파일 업로드 (+사진·이미지)
6. (선택) 참고자료 추가
7. 홍보 신청 제출 ───────────▶  8. 신청 내역 확인 (SUBMITTED→PR_REVIEW)
                                9. 자료 누락 확인 (자동 감지 + 체크리스트)
       ◀─── 자료 보완 요청 ────  10. MATERIAL_REQUESTED (신청자 알림)
11. 자료 업로드 ────────────▶   12. 초안 파일 다운로드→보완본 재업로드 (또는 in-app 편집)
                                13. 예상 배포일 입력 → 신청자 자동 안내
                                14. 국문 최종본 확정 (KOREAN_FINAL_CONFIRMED)
                                15. 영문본 작성/업로드 (ENGLISH_DRAFTING)
       ◀─ 국문/영문 검토 요청 ─  16. APPLICANT_REVIEW / ENGLISH_REVIEW_REQUESTED
17. 수정 요청 or 완료 ───────▶   18. 최종 완료 처리 (FINAL_COMPLETED)
                                19. 배포 예정/완료 (SCHEDULED / DISTRIBUTED)
```

## 상태 전이 권한

- **신청자**가 직접 설정 가능: `SUBMITTED`, `REVISION_REQUESTED`
  (검토 화면의 "검토 완료" 버튼은 `FINAL_COMPLETED`로 진행)
- **담당자/관리자**: 모든 상태 전이 가능(상태 드롭다운).

## 알림 트리거 (인앱)

| 전이/이벤트 | 수신자 | 알림 |
| --- | --- | --- |
| 제출(`SUBMITTED`) | 담당자 전원 | 새 홍보 신청 |
| `MATERIAL_REQUESTED` | 신청자 | 자료 보완 요청 |
| `APPLICANT_REVIEW` | 신청자 | 검토 요청 |
| 예상 배포일 저장 | 신청자 | 예상 배포일 안내 |
| `KOREAN_FINAL_CONFIRMED` | 신청자 | 국문 최종본 확정 |
| `ENGLISH_REVIEW_REQUESTED` | 신청자 | 영문본 검토 요청 |
| `FINAL_COMPLETED` / 확정 | 신청자 | 최종 완료 |
| `DISTRIBUTED` | 신청자 | 배포 완료 |

> 이메일/Graph/Slack 연동은 `NotificationService` 추상화로 확장. 미구현 시 인앱만 동작.

## 버전 관리

- 보도자료 저장 시, **직전 내용을 `PressReleaseVersion`으로 스냅샷**한 뒤 `version`을 1 증가.
- 버전 이력은 변경자·시간·변경사유(코멘트)와 함께 조회.

## 자료 누락 자동 감지 (담당자)

| 유형 | 필수 자료 | 경고 |
| --- | --- | --- |
| 연구성과 | 연구진 사진, 대표 이미지 | "연구성과인데 … 없습니다." |
| 수상성과 | 수상자 사진/자료 | "수상성과인데 …" |
| 행사 | 행사 포스터 | "행사 홍보인데 …" |
