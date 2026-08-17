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
  requestTypeLabel,
  attachmentTypeLabel,
  REQUEST_STATUSES,
  REQUEST_STATUS_LABELS,
  ATTACHMENT_TYPES,
  ROLE_LABELS,
  type RequestType,
  type AttachmentType,
  type Role,
} from "@/lib/enums";
import { TEMPLATE_FILES } from "@/lib/formConfig";
import { makeT, type Lang } from "@/lib/i18n";
import { ReleaseEditor } from "./ReleaseEditor";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Data = any;
type Tr = (key: string) => string;

// 탭은 key(고정)로 관리하고 라벨만 언어별로 표시한다.
const TAB_KEYS = ["info", "release", "files", "checklist", "comments", "history"] as const;
type TabKey = (typeof TAB_KEYS)[number];
const TAB_LABEL_KEY: Record<TabKey, string> = {
  info: "d.tab.info", release: "d.tab.release", files: "d.tab.files",
  checklist: "d.tab.checklist", comments: "d.tab.comments", history: "d.tab.history",
};

export function RequestDetail({
  data,
  isManager,
  currentUserId,
  lang = "ko",
}: {
  data: Data;
  isManager: boolean;
  currentUserId: string;
  lang?: Lang;
}) {
  const router = useRouter();
  const tr = makeT(lang);
  const [tab, setTab] = useState<TabKey>("info");
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
        alert(d.error ?? tr("d.req.failed"));
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

  const visibleTabs = TAB_KEYS.filter((t) => t !== "checklist" || isManager);

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <button
          onClick={() => router.push("/requests")}
          className="mb-2 text-sm text-slate-400 hover:text-slate-600"
        >
          {tr("d.back")}
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl text-pgray-900">{data.title}</h1>
          {data.isUrgent && <Badge color="bg-brand-100 text-brand-700">{tr("d.urgent")}</Badge>}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <StatusBadge status={data.status} detailed />
          <span>·</span>
          <span>{requestTypeLabel(type, lang)}</span>
          <span>·</span>
          <span>{data.department ?? "-"}</span>
          <span>·</span>
          <span>{tr("d.applicant")} {data.applicant.name}</span>
        </div>
      </div>

      {/* Missing materials warning (manager) */}
      {isManager && data.missing?.length > 0 && (
        <Card className="mb-4 border-accent-200 bg-accent-50 p-3">
          <div className="text-sm font-semibold text-accent-800">{tr("d.missing.title")}</div>
          <ul className="mt-1 list-inside list-disc text-sm text-accent-700">
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
              {tr("d.submit")}
            </Button>
          )}
          {/* Applicant review actions */}
          {!isManager &&
            ["APPLICANT_REVIEW", "ENGLISH_REVIEW_REQUESTED"].includes(data.status) && (
              <>
                <Button disabled={busy} onClick={() => changeStatus("REVISION_REQUESTED")} variant="secondary">
                  {tr("d.reviseReq")}
                </Button>
                <Button disabled={busy} onClick={() => changeStatus("FINAL_COMPLETED")}>
                  {tr("d.reviewOk")}
                </Button>
              </>
            )}

          {/* Manager status control */}
          {isManager && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">{tr("d.status.change")}</span>
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

        {isManager && <ManagerScheduling data={data} api={api} tr={tr} onDone={() => router.refresh()} />}
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
            {tr(TAB_LABEL_KEY[t])}
            {t === "files" && data.attachments.length > 0 && ` (${data.attachments.length})`}
            {t === "comments" && data.comments.length > 0 && ` (${data.comments.length})`}
          </button>
        ))}
      </div>

      {tab === "info" && <InfoTab data={data} tr={tr} lang={lang} />}
      {tab === "release" && (
        <div className="space-y-6">
          <DraftPanel data={data} isManager={isManager} tr={tr} onChange={() => router.refresh()} />
          <details className="rounded-xl border border-pgray-200 bg-white">
            <summary className="cursor-pointer px-5 py-3 text-sm font-semibold text-pgray-600">
              {lang === "en" ? "(Optional) In-system press release editor · Korean/English final drafts" : "(선택) 시스템 내 보도자료 편집기 · 국문/영문 최종본 작성"}
            </summary>
            <div className="space-y-6 p-5 pt-0">
              <ReleaseEditor release={ko} language="KO" pressRequestId={data.id} isManager={isManager} onChange={() => router.refresh()} />
              <ReleaseEditor release={en} language="EN" pressRequestId={data.id} isManager={isManager} onChange={() => router.refresh()} />
            </div>
          </details>
        </div>
      )}
      {tab === "files" && (
        <AttachmentsTab data={data} isManager={isManager} currentUserId={currentUserId} tr={tr} lang={lang} onChange={() => router.refresh()} />
      )}
      {tab === "checklist" && isManager && (
        <ChecklistTab data={data} api={api} tr={tr} onChange={() => router.refresh()} />
      )}
      {tab === "comments" && <CommentsTab data={data} tr={tr} onChange={() => router.refresh()} />}
      {tab === "history" && <AuditTab data={data} tr={tr} lang={lang} />}
    </div>
  );
}

function ManagerScheduling({ data, api, tr, onDone }: { data: Data; api: any; tr: Tr; onDone: () => void }) {
  const [date, setDate] = useState(
    data.expectedPublishDate ? String(data.expectedPublishDate).slice(0, 10) : "",
  );
  return (
    <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
      <Field label={tr("d.sched.label")}>
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
        {tr("d.sched.save")}
      </Button>
    </div>
  );
}

function DraftPanel({
  data,
  isManager,
  tr,
  onChange,
}: {
  data: Data;
  isManager: boolean;
  tr: Tr;
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
        alert(d.error ?? tr("d.upload.failed"));
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
        <div className="text-lg font-bold text-pgray-900">{tr("d.draft.title")}</div>
        <a
          href={TEMPLATE_FILES[type]}
          download
          className="inline-flex items-center rounded-lg border border-accent-300 bg-accent-50 px-3 py-1.5 text-sm font-semibold text-accent-800 hover:bg-accent-100"
        >
          {tr("d.draft.tpl")}
        </a>
      </div>
      <p className="mt-1 text-sm text-pgray-500">
        {isManager ? tr("d.draft.desc.manager") : tr("d.draft.desc.applicant")}
      </p>

      <div className="mt-3 space-y-2">
        {drafts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-pgray-300 py-6 text-center text-sm text-pgray-400">
            {tr("d.draft.none")}
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
                {tr("d.draft.download")}
              </a>
            </div>
          ))
        )}
      </div>

      <label className="mt-3 inline-flex cursor-pointer items-center rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700">
        {uploading ? tr("d.uploading") : isManager ? tr("d.draft.upload.manager") : tr("d.draft.upload.applicant")}
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

function InfoTab({ data, tr, lang }: { data: Data; tr: Tr; lang: Lang }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <div className="mb-3 text-sm font-semibold text-slate-700">{tr("d.common")}</div>
        <dl className="space-y-2 text-sm">
          <Row label={tr("d.f.applicant")} value={`${data.applicant.name} (${data.applicant.email})`} />
          <Row label={tr("d.f.dept")} value={data.department ?? "-"} />
          <Row label={tr("d.f.submittedAt")} value={data.submittedAt ? fmtDateTime(data.submittedAt, lang) : tr("d.f.notSubmitted")} />
          <Row label={tr("d.f.phone")} value={data.contactPhone ?? "-"} />
          <Row label={tr("d.f.desiredDate")} value={fmt(data.desiredPublishDate, lang)} />
          <Row label={tr("d.f.expectedDate")} value={fmt(data.expectedPublishDate, lang)} />
          <Row label={tr("d.f.note")} value={data.note ?? "-"} />
        </dl>
      </Card>
      <Card className="p-5">
        <div className="mb-3 text-sm font-semibold text-slate-700">
          {requestTypeLabel(data.type as RequestType, lang)} {tr("d.detail.suffix")}
        </div>
        <dl className="space-y-2 text-sm">
          {data.detailFields.filter((f: any) => f.value).length === 0 ? (
            <p className="text-slate-400">{tr("d.detail.none")}</p>
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
  tr,
  lang,
  onChange,
}: {
  data: Data;
  isManager: boolean;
  currentUserId: string;
  tr: Tr;
  lang: Lang;
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
    if (!confirm(tr("d.att.confirmDelete"))) return;
    const res = await fetch(`/api/attachments/${id}`, { method: "DELETE" });
    if (res.ok) onChange();
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="mb-2 text-sm font-semibold text-slate-700">{tr("d.att.upload")}</div>
        <div className="flex flex-wrap items-end gap-2">
          <Field label={tr("d.att.kind")}>
            <select
              className={inputClass}
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
            >
              {ATTACHMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {attachmentTypeLabel(t, lang)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={tr("d.att.desc")}>
            <input className={inputClass} value={desc} onChange={(e) => setDesc(e.target.value)} />
          </Field>
          <label className="inline-flex cursor-pointer items-center rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700">
            {uploading ? tr("d.uploading") : tr("d.att.pick")}
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
          {tr("d.att.allow")}
        </p>
      </Card>

      {data.attachments.length === 0 ? (
        <EmptyState title={tr("d.att.none")} />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {data.attachments.map((a: any) => (
            <Card key={a.id} className="flex items-center justify-between gap-2 p-3">
              <div className="min-w-0">
                <a href={a.fileUrl} target="_blank" className="truncate font-medium text-brand-700 hover:underline">
                  {a.fileName}
                </a>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                  <Badge>{attachmentTypeLabel(a.fileType as AttachmentType, lang) ?? a.fileType}</Badge>
                  <span>{(a.size / 1024).toFixed(0)} KB</span>
                  {a.description && <span>· {a.description}</span>}
                </div>
              </div>
              {(isManager || a.uploadedById === currentUserId) && (
                <button onClick={() => remove(a.id)} className="shrink-0 text-xs text-brand-600 hover:underline">
                  {tr("d.remove")}
                </button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ChecklistTab({ data, api, tr, onChange }: { data: Data; api: any; tr: Tr; onChange: () => void }) {
  return (
    <Card className="p-5">
      <div className="mb-3 text-sm font-semibold text-slate-700">{tr("d.chk.title")}</div>
      {data.checklist.length === 0 ? (
        <p className="text-sm text-slate-400">{tr("d.chk.none")}</p>
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

function CommentsTab({ data, tr, onChange }: { data: Data; tr: Tr; onChange: () => void }) {
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
          <p className="text-sm text-slate-400">{tr("d.cmt.none")}</p>
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
          placeholder={tr("d.cmt.ph")}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button disabled={busy} onClick={submit}>
          {tr("d.cmt.add")}
        </Button>
      </div>
    </Card>
  );
}

function AuditTab({ data, tr, lang }: { data: Data; tr: Tr; lang: Lang }) {
  if (data.auditLogs.length === 0) return <EmptyState title={tr("d.hist.none")} />;
  const locale = lang === "en" ? "en-US" : "ko-KR";
  return (
    <Card className="p-5">
      <ul className="space-y-2 text-sm">
        {data.auditLogs.map((l: any) => (
          <li key={l.id} className="flex items-start gap-3 border-b border-slate-100 pb-2">
            <span className="w-36 shrink-0 text-xs text-slate-400">
              {new Date(l.createdAt).toLocaleString(locale)}
            </span>
            <span className="font-medium text-slate-600">{l.action}</span>
            <span className="text-slate-400">
              {l.user?.name ?? tr("d.hist.system")}
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

function fmt(d: string | null, lang: Lang = "ko") {
  return d ? new Date(d).toLocaleDateString(lang === "en" ? "en-US" : "ko-KR") : "-";
}

// 날짜 + 시간 (예: 2026. 8. 8. 14:32)
function fmtDateTime(d: string | null, lang: Lang = "ko") {
  if (!d) return "-";
  return new Date(d).toLocaleString(lang === "en" ? "en-US" : "ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}
