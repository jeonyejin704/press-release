"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Button,
  StatusBadge,
  Badge,
  Field,
  inputClass,
  EmptyState,
} from "@/components/ui";
import {
  REQUEST_TYPE_LABELS,
  REQUEST_STATUSES,
  REQUEST_STATUS_LABELS,
  ATTACHMENT_TYPES,
  ATTACHMENT_TYPE_LABELS,
  ROLE_LABELS,
  type RequestType,
  type RequestStatus,
  type Role,
} from "@/lib/enums";
import { TEMPLATE_FILES } from "@/lib/formConfig";
import { ReleaseEditor } from "./ReleaseEditor";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Data = any;

const TABS = ["신청 정보", "보도자료", "첨부파일", "체크리스트", "코멘트", "이력"] as const;

export function RequestDetail({
  data,
  isManager,
  currentUserId,
}: {
  data: Data;
  isManager: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]>("신청 정보");
  const [busy, setBusy] = useState(false);

  const type = data.type as RequestType;
  const ko = data.releases.find((r: any) => r.language === "KO");
  const en = data.releases.find((r: any) => r.language === "EN");

  async function api(url: string, method: string, body?: unknown) {
    setBusy(true);
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? "요청에 실패했습니다.");
        return null;
      }
      return res.json().catch(() => ({}));
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(status: string) {
    const r = await api(`/api/press-requests/${data.id}/status`, "PATCH", { status });
    if (r) router.refresh();
  }

  const visibleTabs = TABS.filter((t) => t !== "체크리스트" || isManager);

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <button
          onClick={() => router.push("/requests")}
          className="mb-2 text-sm text-slate-400 hover:text-slate-600"
        >
          ← 목록으로
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-pgray-900">{data.title}</h1>
          {data.isUrgent && <Badge color="bg-brand-100 text-brand-700">긴급</Badge>}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <StatusBadge status={data.status} />
          <span>·</span>
          <span>{REQUEST_TYPE_LABELS[type]}</span>
          <span>·</span>
          <span>{data.department ?? "-"}</span>
          <span>·</span>
          <span>신청자 {data.applicant.name}</span>
        </div>
      </div>

      {/* Missing materials warning (manager) */}
      {isManager && data.missing?.length > 0 && (
        <Card className="mb-4 border-amber-200 bg-amber-50 p-3">
          <div className="text-sm font-medium text-amber-800">⚠️ 자료 누락 감지</div>
          <ul className="mt-1 list-inside list-disc text-sm text-amber-700">
            {data.missing.map((m: string) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Action bar */}
      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Applicant submit */}
          {!isManager && data.status === "DRAFT" && (
            <Button disabled={busy} onClick={() => changeStatus("SUBMITTED")}>
              홍보 신청 제출
            </Button>
          )}
          {/* Applicant review actions */}
          {!isManager &&
            ["APPLICANT_REVIEW", "ENGLISH_REVIEW_REQUESTED"].includes(data.status) && (
              <>
                <Button disabled={busy} onClick={() => changeStatus("REVISION_REQUESTED")} variant="secondary">
                  수정 요청
                </Button>
                <Button disabled={busy} onClick={() => changeStatus("FINAL_COMPLETED")}>
                  검토 완료 (이상 없음)
                </Button>
              </>
            )}

          {/* Manager status control */}
          {isManager && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">상태 변경:</span>
              <select
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                value={data.status}
                onChange={(e) => changeStatus(e.target.value)}
                disabled={busy}
              >
                {REQUEST_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {REQUEST_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {isManager && <ManagerScheduling data={data} api={api} onDone={() => router.refresh()} />}
      </Card>

      {/* Tabs */}
      <div className="mb-3 flex gap-1 border-b border-slate-200">
        {visibleTabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
              tab === t
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t}
            {t === "첨부파일" && data.attachments.length > 0 && ` (${data.attachments.length})`}
            {t === "코멘트" && data.comments.length > 0 && ` (${data.comments.length})`}
          </button>
        ))}
      </div>

      {tab === "신청 정보" && <InfoTab data={data} />}
      {tab === "보도자료" && (
        <div className="space-y-6">
          <DraftPanel data={data} isManager={isManager} onChange={() => router.refresh()} />
          <details className="rounded-xl border border-pgray-200 bg-white">
            <summary className="cursor-pointer px-5 py-3 text-sm font-semibold text-pgray-600">
              (선택) 시스템 내 보도자료 편집기 · 국문/영문 최종본 작성
            </summary>
            <div className="space-y-6 p-5 pt-0">
              <ReleaseEditor release={ko} language="KO" pressRequestId={data.id} isManager={isManager} onChange={() => router.refresh()} />
              <ReleaseEditor release={en} language="EN" pressRequestId={data.id} isManager={isManager} onChange={() => router.refresh()} />
            </div>
          </details>
        </div>
      )}
      {tab === "첨부파일" && (
        <AttachmentsTab data={data} isManager={isManager} currentUserId={currentUserId} onChange={() => router.refresh()} />
      )}
      {tab === "체크리스트" && isManager && (
        <ChecklistTab data={data} api={api} onChange={() => router.refresh()} />
      )}
      {tab === "코멘트" && <CommentsTab data={data} onChange={() => router.refresh()} />}
      {tab === "이력" && <AuditTab data={data} />}
    </div>
  );
}

function ManagerScheduling({ data, api, onDone }: { data: Data; api: any; onDone: () => void }) {
  const [date, setDate] = useState(
    data.expectedPublishDate ? String(data.expectedPublishDate).slice(0, 10) : "",
  );
  return (
    <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
      <Field label="예상 배포일 (저장 시 신청자에게 안내 알림 발송)">
        <input
          type="date"
          className={inputClass}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </Field>
      <Button
        variant="secondary"
        onClick={async () => {
          const r = await api(`/api/press-requests/${data.id}`, "PATCH", {
            expectedPublishDate: date || null,
          });
          if (r) onDone();
        }}
      >
        배포일 저장·안내
      </Button>
    </div>
  );
}

function DraftPanel({
  data,
  isManager,
  onChange,
}: {
  data: Data;
  isManager: boolean;
  onChange: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const type = data.type as RequestType;
  const drafts = data.attachments.filter((a: any) => a.fileType === "PRESS_RELEASE_DRAFT");

  async function upload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("fileType", "PRESS_RELEASE_DRAFT");
      fd.append("description", isManager ? "홍보팀 보완본" : "신청자 초안");
      const res = await fetch(`/api/press-requests/${data.id}/attachments`, { method: "POST", body: fd });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? "업로드 실패");
        return;
      }
      onChange();
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-lg font-bold text-pgray-900">보도자료 초안</div>
        <a
          href={TEMPLATE_FILES[type]}
          download
          className="inline-flex items-center rounded-lg border border-accent-300 bg-accent-50 px-3 py-1.5 text-sm font-semibold text-accent-800 hover:bg-accent-100"
        >
          📄 초안 양식 다운로드
        </a>
      </div>
      <p className="mt-1 text-sm text-pgray-500">
        {isManager
          ? "신청자가 올린 초안을 내려받아 보완한 뒤, 보완본을 다시 업로드하세요."
          : "양식을 내려받아 작성한 보도자료 초안을 업로드하세요. 홍보팀이 검토·보완합니다."}
      </p>

      <div className="mt-3 space-y-2">
        {drafts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-pgray-300 py-6 text-center text-sm text-pgray-400">
            아직 업로드된 초안이 없습니다.
          </div>
        ) : (
          drafts.map((a: any) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg bg-pgray-50 px-3 py-2">
              <div className="min-w-0">
                <a href={a.fileUrl} target="_blank" download className="truncate font-semibold text-brand-700 hover:underline">
                  {a.fileName}
                </a>
                <div className="text-xs text-pgray-400">
                  {a.description ?? ""} · {new Date(a.createdAt).toLocaleString("ko-KR")}
                </div>
              </div>
              <a href={a.fileUrl} download className="shrink-0 text-xs font-medium text-brand-600 hover:underline">
                다운로드
              </a>
            </div>
          ))
        )}
      </div>

      <label className="mt-3 inline-flex cursor-pointer items-center rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700">
        {uploading ? "업로드 중…" : isManager ? "보완본 업로드" : "초안 업로드"}
        <input
          type="file"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
      </label>
    </Card>
  );
}

function InfoTab({ data }: { data: Data }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <div className="mb-3 text-sm font-semibold text-slate-700">공통 정보</div>
        <dl className="space-y-2 text-sm">
          <Row label="신청자" value={`${data.applicant.name} (${data.applicant.email})`} />
          <Row label="소속" value={data.department ?? "-"} />
          <Row label="연락처" value={data.contactPhone ?? "-"} />
          <Row label="홍보 희망일" value={fmt(data.desiredPublishDate)} />
          <Row label="예상 배포일" value={fmt(data.expectedPublishDate)} />
          <Row label="대외 공개" value={data.publicDisclosureAllowed ? "가능" : "불가"} />
          <Row label="참고 메모" value={data.note ?? "-"} />
        </dl>
      </Card>
      <Card className="p-5">
        <div className="mb-3 text-sm font-semibold text-slate-700">
          {REQUEST_TYPE_LABELS[data.type as RequestType]} 상세
        </div>
        <dl className="space-y-2 text-sm">
          {data.detailFields.filter((f: any) => f.value).length === 0 ? (
            <p className="text-slate-400">입력된 상세 정보가 없습니다.</p>
          ) : (
            data.detailFields
              .filter((f: any) => f.value)
              .map((f: any) => <Row key={f.label} label={f.label} value={f.value} />)
          )}
        </dl>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-28 shrink-0 text-slate-400">{label}</dt>
      <dd className="whitespace-pre-wrap text-slate-700">{value}</dd>
    </div>
  );
}

function AttachmentsTab({
  data,
  isManager,
  currentUserId,
  onChange,
}: {
  data: Data;
  isManager: boolean;
  currentUserId: string;
  onChange: () => void;
}) {
  const [fileType, setFileType] = useState("REPRESENTATIVE_IMAGE");
  const [uploading, setUploading] = useState(false);
  const [desc, setDesc] = useState("");

  async function upload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("fileType", fileType);
      fd.append("description", desc);
      const res = await fetch(`/api/press-requests/${data.id}/attachments`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? "업로드 실패");
        return;
      }
      setDesc("");
      onChange();
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("이 파일을 삭제할까요?")) return;
    const res = await fetch(`/api/attachments/${id}`, { method: "DELETE" });
    if (res.ok) onChange();
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="mb-2 text-sm font-semibold text-slate-700">파일 업로드</div>
        <div className="flex flex-wrap items-end gap-2">
          <Field label="자료 유형">
            <select
              className={inputClass}
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
            >
              {ATTACHMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ATTACHMENT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="설명">
            <input className={inputClass} value={desc} onChange={(e) => setDesc(e.target.value)} />
          </Field>
          <label className="inline-flex cursor-pointer items-center rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700">
            {uploading ? "업로드 중…" : "파일 선택"}
            <input
              type="file"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          허용: 이미지/PDF/문서/한글/zip, 최대 20MB
        </p>
      </Card>

      {data.attachments.length === 0 ? (
        <EmptyState title="첨부된 파일이 없습니다." />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {data.attachments.map((a: any) => (
            <Card key={a.id} className="flex items-center justify-between gap-2 p-3">
              <div className="min-w-0">
                <a href={a.fileUrl} target="_blank" className="truncate font-medium text-brand-700 hover:underline">
                  {a.fileName}
                </a>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                  <Badge>{ATTACHMENT_TYPE_LABELS[a.fileType as keyof typeof ATTACHMENT_TYPE_LABELS] ?? a.fileType}</Badge>
                  <span>{(a.size / 1024).toFixed(0)} KB</span>
                  {a.description && <span>· {a.description}</span>}
                </div>
              </div>
              {(isManager || a.uploadedById === currentUserId) && (
                <button onClick={() => remove(a.id)} className="shrink-0 text-xs text-red-500 hover:underline">
                  삭제
                </button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ChecklistTab({ data, api, onChange }: { data: Data; api: any; onChange: () => void }) {
  return (
    <Card className="p-5">
      <div className="mb-3 text-sm font-semibold text-slate-700">자료 확인 체크리스트</div>
      {data.checklist.length === 0 ? (
        <p className="text-sm text-slate-400">체크리스트가 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {data.checklist.map((c: any) => (
            <li key={c.id}>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  defaultChecked={c.checked}
                  onChange={async (e) => {
                    await api(`/api/press-requests/${data.id}/checklist`, "PATCH", {
                      key: c.key,
                      checked: e.target.checked,
                    });
                    onChange();
                  }}
                />
                {c.label}
              </label>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function CommentsTab({ data, onChange }: { data: Data; onChange: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/press-requests/${data.id}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (res.ok) {
        setText("");
        onChange();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-3 space-y-3">
        {data.comments.length === 0 ? (
          <p className="text-sm text-slate-400">아직 코멘트가 없습니다.</p>
        ) : (
          data.comments.map((c: any) => (
            <div key={c.id} className="rounded-lg bg-slate-50 p-3">
              <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
                <span className="font-medium text-slate-600">{c.author.name}</span>
                <Badge>{ROLE_LABELS[c.author.role as Role]}</Badge>
                <span>{new Date(c.createdAt).toLocaleString("ko-KR")}</span>
              </div>
              <div className="whitespace-pre-wrap text-sm text-slate-700">{c.body}</div>
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <textarea
          className={inputClass}
          rows={2}
          placeholder="코멘트 입력…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button disabled={busy} onClick={submit}>
          등록
        </Button>
      </div>
    </Card>
  );
}

function AuditTab({ data }: { data: Data }) {
  if (data.auditLogs.length === 0) return <EmptyState title="이력이 없습니다." />;
  return (
    <Card className="p-5">
      <ul className="space-y-2 text-sm">
        {data.auditLogs.map((l: any) => (
          <li key={l.id} className="flex items-start gap-3 border-b border-slate-100 pb-2">
            <span className="w-36 shrink-0 text-xs text-slate-400">
              {new Date(l.createdAt).toLocaleString("ko-KR")}
            </span>
            <span className="font-medium text-slate-600">{l.action}</span>
            <span className="text-slate-400">
              {l.user?.name ?? "시스템"}
              {l.beforeValue || l.afterValue
                ? ` · ${l.beforeValue ?? ""}${l.beforeValue && l.afterValue ? " → " : ""}${l.afterValue ?? ""}`
                : ""}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function fmt(d: string | null) {
  return d ? new Date(d).toLocaleDateString("ko-KR") : "-";
}
