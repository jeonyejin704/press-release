"use client";

import { useState } from "react";
import { Card, Button, Badge, inputClass } from "@/components/ui";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function ReleaseEditor({
  release,
  language,
  pressRequestId,
  isManager,
  onChange,
}: {
  release: any | undefined;
  language: "KO" | "EN";
  pressRequestId: string;
  isManager: boolean;
  onChange: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState(true);
  const [versions, setVersions] = useState<any[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: release?.title ?? "",
    subtitle: release?.subtitle ?? "",
    body: release?.body ?? "",
    summary: release?.summary ?? "",
    easyExplanation: release?.easyExplanation ?? "",
    imageCaption: release?.imageCaption ?? "",
    changeComment: "",
  });

  const label = language === "KO" ? "국문 보도자료" : "영문 보도자료";

  async function startEnglish() {
    setBusy(true);
    try {
      const res = await fetch(`/api/press-requests/${pressRequestId}/releases`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ language: "EN" }),
      });
      if (res.ok) onChange();
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    try {
      const res = await fetch(`/api/releases/${release.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? "저장 실패");
        return;
      }
      setEditing(false);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  async function finalize() {
    if (!confirm(`${label} 최종본으로 확정할까요?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/releases/${release.id}/finalize`, { method: "POST" });
      if (res.ok) onChange();
      else alert("확정 실패");
    } finally {
      setBusy(false);
    }
  }

  async function loadVersions() {
    if (versions) {
      setVersions(null);
      return;
    }
    const res = await fetch(`/api/releases/${release.id}/versions`);
    if (res.ok) {
      const d = await res.json();
      setVersions(d.versions);
    }
  }

  if (!release) {
    return (
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-700">{label}</div>
          {language === "EN" ? (
            <Button variant="secondary" disabled={busy} onClick={startEnglish}>
              영문본 작성 시작
            </Button>
          ) : (
            <span className="text-sm text-slate-400">
              연구성과는 AI 초안 생성 시 자동 생성됩니다.
            </span>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold text-slate-700">{label}</div>
          <Badge>v{release.version}</Badge>
          {release.isFinal && <Badge color="bg-green-100 text-green-700">최종본</Badge>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => setPreview((p) => !p)}>
            {preview ? "본문만 보기" : "미리보기"}
          </Button>
          <Button variant="ghost" onClick={loadVersions}>
            버전 이력 {versions ? "닫기" : "보기"}
          </Button>
          <Button variant="secondary" onClick={() => setEditing((e) => !e)}>
            {editing ? "편집 취소" : "수정"}
          </Button>
          {isManager && !release.isFinal && (
            <Button disabled={busy} onClick={finalize}>
              최종본 확정
            </Button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-3">
          <input
            className={inputClass}
            placeholder="제목"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder="부제목"
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
          />
          <textarea
            className={inputClass}
            rows={10}
            placeholder="본문"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
          />
          <textarea
            className={inputClass}
            rows={3}
            placeholder="핵심 요약"
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
          />
          <textarea
            className={inputClass}
            rows={3}
            placeholder="쉬운 설명"
            value={form.easyExplanation}
            onChange={(e) => setForm({ ...form, easyExplanation: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder="이미지 캡션"
            value={form.imageCaption}
            onChange={(e) => setForm({ ...form, imageCaption: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder="변경 사유 (버전 이력에 기록)"
            value={form.changeComment}
            onChange={(e) => setForm({ ...form, changeComment: e.target.value })}
          />
          <Button disabled={busy} onClick={save}>
            {busy ? "저장 중…" : "저장 (새 버전)"}
          </Button>
        </div>
      ) : (
        <div>
          <h3 className="text-lg font-bold text-slate-800">{release.title || "(제목 없음)"}</h3>
          {release.subtitle && <p className="mt-0.5 text-slate-500">{release.subtitle}</p>}
          {preview && (
            <>
              <div className="prose-release mt-3 text-sm text-slate-700">{release.body}</div>
              {release.summary && (
                <Section title="핵심 요약" content={release.summary} />
              )}
              {release.easyExplanation && (
                <Section title="쉬운 설명" content={release.easyExplanation} />
              )}
              {release.imageCaption && (
                <Section title="이미지 캡션" content={release.imageCaption} />
              )}
            </>
          )}
        </div>
      )}

      {versions && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <div className="mb-2 text-sm font-semibold text-slate-600">버전 이력</div>
          {versions.length === 0 ? (
            <p className="text-sm text-slate-400">저장된 이전 버전이 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {versions.map((v) => (
                <li key={v.id} className="rounded-lg bg-slate-50 p-2 text-sm">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Badge>v{v.version}</Badge>
                    <span>{v.changedBy?.name ?? "-"}</span>
                    <span>{new Date(v.createdAt).toLocaleString("ko-KR")}</span>
                    {v.changeComment && <span>· {v.changeComment}</span>}
                  </div>
                  <div className="mt-1 font-medium text-slate-600">{v.title}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <div className="mt-4">
      <div className="text-xs font-semibold uppercase text-slate-400">{title}</div>
      <div className="prose-release mt-1 text-sm text-slate-700">{content}</div>
    </div>
  );
}
