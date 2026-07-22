"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Field, inputClass } from "@/components/ui";
import { DETAIL_FORM } from "@/lib/formConfig";
import { REQUEST_TYPE_LABELS, type RequestType } from "@/lib/enums";

export function RequestForm({ type }: { type: RequestType }) {
  const router = useRouter();
  const fields = DETAIL_FORM[type];
  const [form, setForm] = useState<Record<string, string>>({});
  const [common, setCommon] = useState({
    title: "",
    department: "",
    contactPhone: "",
    desiredPublishDate: "",
    note: "",
    isUrgent: false,
    publicDisclosureAllowed: true,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function setDetail(name: string, value: string) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function save(submit: boolean) {
    setError("");
    if (!common.title.trim()) {
      setError("보도자료 제목을 입력하세요.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/press-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type,
          title: common.title,
          department: common.department || null,
          contactPhone: common.contactPhone || null,
          desiredPublishDate: common.desiredPublishDate || null,
          note: common.note || null,
          isUrgent: common.isUrgent,
          publicDisclosureAllowed: common.publicDisclosureAllowed,
          submit,
          detail: form,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "저장에 실패했습니다.");
        return;
      }
      const data = await res.json();
      router.push(`/requests/${data.id}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-xl font-bold text-slate-800">
        새 홍보 신청 · {REQUEST_TYPE_LABELS[type]}
      </h1>
      <p className="mb-5 text-sm text-slate-500">
        필수 항목(*)을 채운 뒤 임시저장하면 상세 페이지에서 AI 초안 생성·파일 업로드·제출을 진행할 수 있습니다.
      </p>

      <Card className="mb-4 p-5">
        <div className="mb-3 text-sm font-semibold text-slate-700">공통 정보</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="보도자료 제목" required>
              <input
                className={inputClass}
                value={common.title}
                onChange={(e) => setCommon({ ...common, title: e.target.value })}
              />
            </Field>
          </div>
          <Field label="소속 학과/부서">
            <input
              className={inputClass}
              value={common.department}
              onChange={(e) => setCommon({ ...common, department: e.target.value })}
            />
          </Field>
          <Field label="연락처">
            <input
              className={inputClass}
              value={common.contactPhone}
              onChange={(e) => setCommon({ ...common, contactPhone: e.target.value })}
            />
          </Field>
          <Field label="홍보 희망일">
            <input
              type="date"
              className={inputClass}
              value={common.desiredPublishDate}
              onChange={(e) => setCommon({ ...common, desiredPublishDate: e.target.value })}
            />
          </Field>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={common.isUrgent}
                onChange={(e) => setCommon({ ...common, isUrgent: e.target.checked })}
              />
              긴급
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={common.publicDisclosureAllowed}
                onChange={(e) =>
                  setCommon({ ...common, publicDisclosureAllowed: e.target.checked })
                }
              />
              대외 공개 가능
            </label>
          </div>
          <div className="sm:col-span-2">
            <Field label="참고 메모">
              <textarea
                className={inputClass}
                rows={2}
                value={common.note}
                onChange={(e) => setCommon({ ...common, note: e.target.value })}
              />
            </Field>
          </div>
        </div>
      </Card>

      {fields.length > 0 && (
        <Card className="mb-4 p-5">
          <div className="mb-3 text-sm font-semibold text-slate-700">
            {REQUEST_TYPE_LABELS[type]} 상세 정보
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.name} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                <Field label={f.label} required={f.required} hint={f.hint}>
                  {f.type === "textarea" ? (
                    <textarea
                      className={inputClass}
                      rows={3}
                      value={form[f.name] ?? ""}
                      onChange={(e) => setDetail(f.name, e.target.value)}
                    />
                  ) : (
                    <input
                      type={f.type === "date" ? "date" : "text"}
                      className={inputClass}
                      value={form[f.name] ?? ""}
                      onChange={(e) => setDetail(f.name, e.target.value)}
                    />
                  )}
                </Field>
              </div>
            ))}
          </div>
        </Card>
      )}

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button variant="secondary" disabled={saving} onClick={() => save(false)}>
          임시저장
        </Button>
        <Button disabled={saving} onClick={() => save(true)}>
          {saving ? "저장 중…" : "홍보 신청 제출"}
        </Button>
      </div>
    </div>
  );
}
