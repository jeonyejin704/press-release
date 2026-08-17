"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Field, inputClass } from "@/components/ui";
import { localizeFields, requestGuide, TEMPLATE_FILES } from "@/lib/formConfig";
import {
  requestTypeLabel,
  attachmentTypeLabel,
  ATTACHMENT_TYPES,
  type RequestType,
  type AttachmentType,
} from "@/lib/enums";
import { makeT, type Lang } from "@/lib/i18n";

type PickedFile = { file: File; fileType: string };
type Corr = { name: string; dept: string; empNo: string };

// 교신저자 입력은 연구성과 폼에서 별도 처리 → 일반 렌더에서 제외
const CORR_KEYS = ["correspondingAuthorName", "correspondingAuthorDepartment", "correspondingAuthorEmployeeNo"];
// 파일 업로드(문서) 드롭다운: 사진·영상 유형은 위 전용 섹션에서 처리하므로 제외
const MEDIA_TYPES = ["RESEARCHER_PHOTO", "REPRESENTATIVE_IMAGE", "VIDEO", "RESEARCH_IMAGE", "EVENT_PHOTO", "POSTER"];
const DOC_TYPES = ATTACHMENT_TYPES.filter((t) => !MEDIA_TYPES.includes(t));
const isDoc = (t: string) => (DOC_TYPES as readonly string[]).includes(t);

export function RequestForm({
  type,
  me,
  lang = "ko",
}: {
  type: RequestType;
  me: { name: string; email: string; department: string };
  lang?: Lang;
}) {
  const router = useRouter();
  const tr = makeT(lang);
  const isResearch = type === "RESEARCH";
  const fields = localizeFields(type, lang).filter((f) => !(isResearch && CORR_KEYS.includes(f.name)));

  const [form, setForm] = useState<Record<string, string>>({});
  const [corr, setCorr] = useState<Corr[]>([{ name: "", dept: "", empNo: "" }]);
  const [common, setCommon] = useState({
    applicantName: me.name,
    applicantEmail: me.email,
    department: me.department,
    contactPhone: "",
    desiredPublishDate: "",
    note: "",
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
  const isJpg = (f: File) => /\.jpe?g$/i.test(f.name) || f.type === "image/jpeg";
  const isVideo = (f: File) => /\.(mp4|mov|m4v|webm)$/i.test(f.name) || f.type.startsWith("video/");
  function addAsset(f: File, fileType: string) {
    const ok = fileType === "VIDEO" ? isVideo(f) : isJpg(f);
    if (!ok) {
      setError(fileType === "VIDEO" ? tr("form.err.video") : tr("form.err.jpg"));
      return;
    }
    setError("");
    setFiles((prev) => [...prev, { file: f, fileType }]);
  }

  // 교신저자 조작
  const setCorrField = (i: number, k: keyof Corr, v: string) =>
    setCorr((prev) => prev.map((c, idx) => (idx === i ? { ...c, [k]: v } : c)));
  const addCorr = () => setCorr((prev) => [...prev, { name: "", dept: "", empNo: "" }]);
  const removeCorr = (i: number) => setCorr((prev) => prev.filter((_, idx) => idx !== i));

  async function save(submit: boolean) {
    setError("");
    if (!common.applicantName.trim() || !common.applicantEmail.trim()) {
      setError(tr("form.err.applicant"));
      return;
    }
    // 연구성과: 교신저자(복수) → 단일 컬럼에 ' / '로 합쳐 저장
    const detail = { ...form };
    if (isResearch) {
      const used = corr.filter((c) => c.name.trim());
      detail.correspondingAuthorName = used.map((c) => c.name.trim()).join(" / ");
      detail.correspondingAuthorDepartment = used.map((c) => c.dept.trim()).join(" / ");
      detail.correspondingAuthorEmployeeNo = used.map((c) => c.empNo.trim()).join(" / ");
    }

    setSaving(true);
    try {
      const res = await fetch("/api/press-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type,
          applicantName: common.applicantName,
          applicantEmail: common.applicantEmail,
          department: common.department || null,
          contactPhone: common.contactPhone || null,
          desiredPublishDate: common.desiredPublishDate || null,
          note: common.note || null,
          submit,
          detail,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? tr("form.err.save"));
        return;
      }
      const data = await res.json();
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
        {tr("form.title")} · <span className="text-brand-700">{requestTypeLabel(type, lang)}</span>
      </h1>

      {/* 안내문(줄글) */}
      <Card className="mt-3 border-l-4 border-l-accent-500 bg-accent-50 p-4">
        <p className="whitespace-pre-line text-sm leading-relaxed text-pgray-700">{requestGuide(type, lang)}</p>
      </Card>

      {/* 보도자료 초안 양식 다운로드 */}
      <Card className="mt-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="font-bold text-pgray-900">{tr("form.tpl.title")}</div>
            <div className="text-sm text-pgray-500">
              {tr("form.tpl.desc")}
            </div>
          </div>
          <a
            href={TEMPLATE_FILES[type]}
            download
            className="inline-flex items-center justify-center rounded-lg bg-accent-500 px-3.5 py-2 text-sm font-bold text-pgray-900 hover:bg-accent-400"
          >
            {tr("form.tpl.download")}
          </a>
        </div>
      </Card>

      {/* 기본 정보 */}
      <Card className="mt-3 p-5">
        <div className="mb-3 text-base font-bold text-pgray-900">{tr("form.basic")}</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={tr("form.applicantName")} required>
            <input className={inputClass} value={common.applicantName} onChange={(e) => setCommon({ ...common, applicantName: e.target.value })} placeholder={tr("form.applicantName.ph")} />
          </Field>
          <Field label={tr("form.applicantEmail")} hint={tr("form.applicantEmail.hint")}>
            <input type="email" className={`${inputClass} bg-pgray-50 text-pgray-500`} value={common.applicantEmail} readOnly />
          </Field>
          <Field label={tr("form.department")}>
            <input className={inputClass} value={common.department} onChange={(e) => setCommon({ ...common, department: e.target.value })} />
          </Field>
          <Field label={tr("form.phone")}>
            <input className={inputClass} value={common.contactPhone} onChange={(e) => setCommon({ ...common, contactPhone: e.target.value })} />
          </Field>
          <Field label={tr("form.desiredDate")}>
            <input type="date" className={inputClass} value={common.desiredPublishDate} onChange={(e) => setCommon({ ...common, desiredPublishDate: e.target.value })} />
          </Field>
          <div className="sm:col-span-2">
            <Field label={tr("form.note")}>
              <textarea className={inputClass} rows={2} value={common.note} onChange={(e) => setCommon({ ...common, note: e.target.value })} />
            </Field>
          </div>
        </div>
      </Card>

      {/* 유형별 상세 */}
      {(fields.length > 0 || isResearch) && (
        <Card className="mt-3 p-5">
          <div className="mb-3 text-base font-bold text-pgray-900">{requestTypeLabel(type, lang)} {tr("form.info.suffix")}</div>

          {/* 연구성과: 교신저자(복수 입력) */}
          {isResearch && (
            <div className="mb-4">
              <div className="mb-2 text-sm font-semibold text-pgray-700">{tr("form.corr")} <span className="text-brand-600">*</span></div>
              <div className="space-y-2">
                {corr.map((c, i) => (
                  <div key={i} className="rounded-xl border border-pgray-200 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-pgray-500">{tr("form.corr.n")} {i + 1}</span>
                      {i > 0 && (
                        <button onClick={() => removeCorr(i)} className="text-xs text-pgray-400 hover:text-brand-600">{tr("form.remove")}</button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field label={tr("form.corr.name")} required={i === 0}>
                        <input className={inputClass} value={c.name} onChange={(e) => setCorrField(i, "name", e.target.value)} />
                      </Field>
                      <Field label={tr("form.corr.dept")}>
                        <input className={inputClass} value={c.dept} onChange={(e) => setCorrField(i, "dept", e.target.value)} />
                      </Field>
                      <Field label={tr("form.corr.empNo")}>
                        <input className={inputClass} value={c.empNo} onChange={(e) => setCorrField(i, "empNo", e.target.value)} />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addCorr} className="mt-2 rounded-lg border border-brand-200 px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-50">
                {tr("form.corr.add")}
              </button>
              <p className="mt-1 text-xs text-pgray-400">{tr("form.corr.hint")}</p>
            </div>
          )}

          {fields.length > 0 && (
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
          )}
        </Card>
      )}

      {/* 사진·영상 첨부 */}
      <Card className="mt-3 p-5">
        <div className="mb-1 text-base font-bold text-pgray-900">{tr("form.media.title")}</div>
        <p className="mb-3 text-sm text-pgray-500">{tr("form.media.desc")}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <AssetUploader label={tr("form.media.researcher")} hint={tr("form.media.researcher.hint")} accept=".jpg,.jpeg,image/jpeg" icon="🖼️" removeLabel={tr("form.remove")}
            files={files.filter((pf) => pf.fileType === "RESEARCHER_PHOTO")}
            onPick={(f) => addAsset(f, "RESEARCHER_PHOTO")}
            onRemove={(file) => setFiles((prev) => prev.filter((pf) => pf.file !== file))} pickLabel={tr("form.pick")} />
          <AssetUploader label={tr("form.media.key")} hint={tr("form.media.key.hint")} accept=".jpg,.jpeg,image/jpeg" icon="🖼️" removeLabel={tr("form.remove")}
            files={files.filter((pf) => pf.fileType === "REPRESENTATIVE_IMAGE")}
            onPick={(f) => addAsset(f, "REPRESENTATIVE_IMAGE")}
            onRemove={(file) => setFiles((prev) => prev.filter((pf) => pf.file !== file))} pickLabel={tr("form.pick")} />
          <AssetUploader label={tr("form.media.video")} hint={tr("form.media.video.hint")} accept="video/*,.mp4,.mov,.m4v" icon="🎬" removeLabel={tr("form.remove")}
            files={files.filter((pf) => pf.fileType === "VIDEO")}
            onPick={(f) => addAsset(f, "VIDEO")}
            onRemove={(file) => setFiles((prev) => prev.filter((pf) => pf.file !== file))} pickLabel={tr("form.pick")} />
        </div>
      </Card>

      {/* 보도자료 초안 업로드 (문서) */}
      <Card className="mt-3 p-5">
        <div className="mb-1 text-base font-bold text-pgray-900">{tr("form.doc.title")}</div>
        <p className="mb-3 text-sm text-pgray-500">{tr("form.doc.desc")}</p>
        <div className="flex flex-wrap items-end gap-2">
          <Field label={tr("form.doc.kind")}>
            <select className={inputClass} value={nextType} onChange={(e) => setNextType(e.target.value)}>
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>{attachmentTypeLabel(t, lang)}</option>
              ))}
            </select>
          </Field>
          <label className="inline-flex cursor-pointer items-center rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            {tr("form.file.pick")}
            <input type="file" accept=".hwp,.hwpx,.doc,.docx,.pdf,.zip,.txt,.ppt,.pptx" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) addFile(f); e.target.value = ""; }} />
          </label>
        </div>
        {files.filter((pf) => isDoc(pf.fileType)).length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {files.map((pf, i) => (isDoc(pf.fileType) ? (
              <li key={i} className="flex items-center justify-between rounded-lg bg-pgray-50 px-3 py-2 text-sm">
                <span className="truncate text-pgray-700">
                  <span className="mr-2 rounded bg-brand-100 px-1.5 py-0.5 text-xs font-medium text-brand-700">
                    {attachmentTypeLabel(pf.fileType as AttachmentType, lang)}
                  </span>
                  📄 {pf.file.name}
                </span>
                <button onClick={() => removeFile(i)} className="shrink-0 text-xs text-brand-600 hover:underline">{tr("form.remove")}</button>
              </li>
            ) : null))}
          </ul>
        )}
      </Card>

      {error && <p className="mt-3 text-sm font-medium text-brand-600">{error}</p>}

      <div className="mt-4 flex gap-2">
        <Button variant="secondary" disabled={saving} onClick={() => save(false)}>{tr("form.save.draft")}</Button>
        <Button disabled={saving} onClick={() => save(true)}>{saving ? tr("form.submitting") : tr("form.submit")}</Button>
      </div>
    </div>
  );
}

function AssetUploader({
  label,
  hint,
  accept,
  icon,
  files,
  onPick,
  onRemove,
  pickLabel = "선택",
  removeLabel = "제거",
}: {
  label: string;
  hint: string;
  accept: string;
  icon: string;
  files: PickedFile[];
  onPick: (f: File) => void;
  onRemove: (f: File) => void;
  pickLabel?: string;
  removeLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-pgray-200 p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-semibold text-pgray-800">{label}</span>
        <label className="inline-flex cursor-pointer items-center rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-700">
          {pickLabel}
          <input type="file" accept={accept} className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ""; }} />
        </label>
      </div>
      <p className="text-xs text-pgray-400">{hint}</p>
      {files.length > 0 && (
        <ul className="mt-2 space-y-1">
          {files.map((pf, i) => (
            <li key={i} className="flex items-center justify-between rounded-lg bg-pgray-50 px-2.5 py-1.5 text-xs">
              <span className="truncate text-pgray-700">{icon} {pf.file.name}</span>
              <button onClick={() => onRemove(pf.file)} className="shrink-0 text-brand-600 hover:underline">{removeLabel}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
