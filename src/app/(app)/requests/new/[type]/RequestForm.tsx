"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Field, inputClass } from "@/components/ui";
import { DETAIL_FORM, REQUEST_GUIDE, TEMPLATE_FILES } from "@/lib/formConfig";
import {
  REQUEST_TYPE_LABELS,
  ATTACHMENT_TYPES,
  ATTACHMENT_TYPE_LABELS,
  type RequestType,
} from "@/lib/enums";

type PickedFile = { file: File; fileType: string };

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
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [nextType, setNextType] = useState("PRESS_RELEASE_DRAFT");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function setDetail(name: string, value: string) {
    setForm((f) => ({ ...f, [name]: value }));
  }
  function addFile(f: File) {
    setFiles((prev) => [...prev, { file: f, fileType: nextType }]);
  }
  function removeFile(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
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

      // 생성된 신청에 선택한 파일들을 업로드
      for (const pf of files) {
        const fd = new FormData();
        fd.append("file", pf.file);
        fd.append("fileType", pf.fileType);
        await fetch(`/api/press-requests/${data.id}/attachments`, { method: "POST", body: fd });
      }

      router.push(`/requests/${data.id}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold tracking-tight text-pgray-900">
        새 홍보 신청 · <span className="text-brand-700">{REQUEST_TYPE_LABELS[type]}</span>
      </h1>

      {/* 안내문(줄글) */}
      <Card className="mt-3 border-l-4 border-l-accent-500 bg-accent-50 p-4">
        <p className="text-sm leading-relaxed text-pgray-700">{REQUEST_GUIDE[type]}</p>
      </Card>

      {/* 보도자료 초안 양식 다운로드 */}
      <Card className="mt-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="font-bold text-pgray-900">📄 보도자료 초안 양식</div>
            <div className="text-sm text-pgray-500">
              양식을 내려받아 작성하신 뒤, 아래 ‘파일 업로드’에서 <b>보도자료 초안</b>으로 첨부해 주세요.
            </div>
          </div>
          <a
            href={TEMPLATE_FILES[type]}
            download
            className="inline-flex items-center justify-center rounded-lg bg-accent-500 px-3.5 py-2 text-sm font-bold text-pgray-900 hover:bg-accent-400"
          >
            양식 다운로드
          </a>
        </div>
      </Card>

      {/* 공통 정보 */}
      <Card className="mt-3 p-5">
        <div className="mb-3 text-base font-bold text-pgray-900">기본 정보</div>
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
            <input className={inputClass} value={common.department} onChange={(e) => setCommon({ ...common, department: e.target.value })} />
          </Field>
          <Field label="연락처">
            <input className={inputClass} value={common.contactPhone} onChange={(e) => setCommon({ ...common, contactPhone: e.target.value })} />
          </Field>
          <Field label="홍보 희망일">
            <input type="date" className={inputClass} value={common.desiredPublishDate} onChange={(e) => setCommon({ ...common, desiredPublishDate: e.target.value })} />
          </Field>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 text-sm text-pgray-600">
              <input type="checkbox" checked={common.isUrgent} onChange={(e) => setCommon({ ...common, isUrgent: e.target.checked })} />
              긴급
            </label>
            <label className="flex items-center gap-2 text-sm text-pgray-600">
              <input type="checkbox" checked={common.publicDisclosureAllowed} onChange={(e) => setCommon({ ...common, publicDisclosureAllowed: e.target.checked })} />
              대외 공개 가능
            </label>
          </div>
          <div className="sm:col-span-2">
            <Field label="참고 메모">
              <textarea className={inputClass} rows={2} value={common.note} onChange={(e) => setCommon({ ...common, note: e.target.value })} />
            </Field>
          </div>
        </div>
      </Card>

      {/* 유형별 상세 (기본 정보만) */}
      {fields.length > 0 && (
        <Card className="mt-3 p-5">
          <div className="mb-3 text-base font-bold text-pgray-900">{REQUEST_TYPE_LABELS[type]} 정보</div>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.name} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                <Field label={f.label} required={f.required} hint={f.hint}>
                  {f.type === "textarea" ? (
                    <textarea className={inputClass} rows={3} value={form[f.name] ?? ""} onChange={(e) => setDetail(f.name, e.target.value)} />
                  ) : (
                    <input type={f.type === "date" ? "date" : "text"} className={inputClass} value={form[f.name] ?? ""} onChange={(e) => setDetail(f.name, e.target.value)} />
                  )}
                </Field>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 파일 업로드 */}
      <Card className="mt-3 p-5">
        <div className="mb-1 text-base font-bold text-pgray-900">파일 업로드</div>
        <p className="mb-3 text-sm text-pgray-500">
          작성한 <b>보도자료 초안</b>과 사진·이미지·참고자료를 첨부해 주세요. (이미지/PDF/문서/한글/zip, 최대 20MB)
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <Field label="자료 유형">
            <select className={inputClass} value={nextType} onChange={(e) => setNextType(e.target.value)}>
              {ATTACHMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ATTACHMENT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </Field>
          <label className="inline-flex cursor-pointer items-center rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            파일 선택
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) addFile(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>

        {files.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {files.map((pf, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg bg-pgray-50 px-3 py-2 text-sm">
                <span className="truncate text-pgray-700">
                  <span className="mr-2 rounded bg-brand-100 px-1.5 py-0.5 text-xs font-medium text-brand-700">
                    {ATTACHMENT_TYPE_LABELS[pf.fileType as keyof typeof ATTACHMENT_TYPE_LABELS]}
                  </span>
                  {pf.file.name}
                </span>
                <button onClick={() => removeFile(i)} className="shrink-0 text-xs text-brand-600 hover:underline">
                  제거
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {error && <p className="mt-3 text-sm font-medium text-brand-600">{error}</p>}

      <div className="mt-4 flex gap-2">
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
