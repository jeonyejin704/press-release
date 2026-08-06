"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Button, Badge } from "@/components/ui";

type Result = { imported: number; skipped: number; errors: string[] };
type Preview = { willImport: number; skipped: number; errors: string[]; sample: any[] };

export function ImportClient() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fileName, setFileName] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  // 1단계: 업로드 → 미리보기(저장하지 않음)
  async function upload(file: File) {
    setError("");
    setResult(null);
    setPreview(null);
    setPendingFile(file);
    setBusy(true);
    setFileName(file.name);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/import?mode=preview", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "파일을 읽지 못했습니다.");
        setPendingFile(null);
        return;
      }
      setPreview(data);
    } finally {
      setBusy(false);
    }
  }

  // 2단계: '저장' → 실제 등록(기존 내역 유지, 추가만)
  async function save() {
    if (!pendingFile) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("file", pendingFile);
      const res = await fetch("/api/import?mode=commit", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "저장에 실패했습니다.");
        return;
      }
      setResult(data);
      setPreview(null);
      setPendingFile(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setPreview(null);
    setPendingFile(null);
    setFileName("");
    setError("");
  }

  async function clearDummy() {
    const ans = prompt('시연용 더미 데이터를 포함해 현재 등록된 모든 신청·배포일정을 삭제합니다.\n계속하려면 "삭제"를 입력하세요. (되돌릴 수 없습니다)');
    if (ans !== "삭제") return;
    const res = await fetch("/api/requests/clear", { method: "DELETE" });
    const d = await res.json().catch(() => ({}));
    alert(`${d.deleted ?? 0}건을 삭제했습니다.`);
    router.refresh();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl text-pgray-900">데이터 가져오기 (일괄 등록)</h1>
      <p className="mt-1 text-sm text-pgray-500">
        보도자료 <b>배포일정</b>을 엑셀로 한 번에 등록합니다. <b>유형 · 대상자 · 배포예정일 · 내용</b>만 채우면 되며, 등록한 내용은 배포일정 달력에 표시됩니다.
      </p>
      <p className="mt-2 rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-800">
        ※ <b>광고비 내역</b>은 여기가 아니라 왼쪽 <b>‘광고비 집행’</b> 메뉴의 엑셀 업로드로 올려주세요.
      </p>

      <Card className="mt-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="font-bold text-pgray-900">1) 엑셀 양식 내려받기</div>
            <div className="text-sm text-pgray-500">양식의 ‘작성안내’ 시트를 참고해 과거 내역을 채워주세요.</div>
          </div>
          <a
            href="/templates/홍보신청_일괄등록_양식.xlsx"
            download
            className="inline-flex items-center rounded-lg bg-accent-500 px-3.5 py-2 text-sm font-bold text-pgray-900 hover:bg-accent-400"
          >
            📥 엑셀 양식 다운로드
          </a>
        </div>
      </Card>

      <Card className="mt-3 p-5">
        <div className="mb-1 font-bold text-pgray-900">2) 작성한 파일 업로드</div>
        <p className="mb-3 text-sm text-pgray-500">
          열 구성: <b>유형 · 대상자 · 배포예정일 · 내용</b> (유형·배포예정일 필수). (엑셀 .xlsx 또는 .csv)
        </p>
        <label className="inline-flex cursor-pointer items-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          {busy ? "파일 확인 중…" : "① 파일 선택"}
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            disabled={busy || saving}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = "";
            }}
          />
        </label>
        {fileName && <span className="ml-3 text-sm text-pgray-500">{fileName}</span>}
        {error && <p className="mt-3 text-sm font-medium text-brand-600">{error}</p>}

        {/* 미리보기 → 저장 */}
        {preview && (
          <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm text-pgray-700">
                <b className="text-brand-700">{preview.willImport}건</b>이 추가될 예정입니다.
                {preview.skipped > 0 && <span className="ml-2 text-accent-700">{preview.skipped}건은 오류로 제외</span>}
                <div className="mt-0.5 text-xs text-pgray-500">저장 전까지는 반영되지 않으며, <b>기존 내역은 삭제되지 않고 추가만</b> 됩니다.</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={cancel} className="rounded-lg border border-pgray-200 bg-white px-3 py-2 text-sm text-pgray-600 hover:bg-pgray-50">취소</button>
                <button onClick={save} disabled={saving || preview.willImport === 0}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-40">
                  {saving ? "저장 중…" : `② 저장 (${preview.willImport}건 추가)`}
                </button>
              </div>
            </div>
            {preview.sample.length > 0 && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-left text-pgray-400">
                    <tr><th className="py-1 pr-3">유형</th><th className="py-1 pr-3">대상자</th><th className="py-1 pr-3">배포예정일</th><th className="py-1">내용</th></tr>
                  </thead>
                  <tbody className="text-pgray-700">
                    {preview.sample.map((s, i) => (
                      <tr key={i} className="border-t border-brand-100">
                        <td className="py-1 pr-3 whitespace-nowrap">{s.type}</td>
                        <td className="py-1 pr-3 whitespace-nowrap">{s.subject}</td>
                        <td className="py-1 pr-3 whitespace-nowrap">{s.date}</td>
                        <td className="py-1 max-w-[16rem] truncate">{s.content}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.willImport > preview.sample.length && (
                  <div className="mt-1 text-xs text-pgray-400">…외 {preview.willImport - preview.sample.length}건 (저장 시 모두 추가)</div>
                )}
              </div>
            )}
            {preview.errors.length > 0 && (
              <ul className="mt-2 max-h-40 overflow-auto text-xs text-accent-700">{preview.errors.map((e, i) => <li key={i}>• {e}</li>)}</ul>
            )}
          </div>
        )}
      </Card>

      {result && (
        <Card className="mt-3 border-t-4 border-t-brand-600 p-5">
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold text-pgray-900">✅ 저장 완료</span>
            <Badge color="bg-brand-100 text-brand-700">{result.imported}건 추가</Badge>
            {result.skipped > 0 && <Badge color="bg-accent-100 text-accent-800">{result.skipped}건 건너뜀</Badge>}
          </div>
          {result.imported === 0 && result.skipped === 0 && (
            <p className="mt-2 rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-800">
              인식된 행이 없습니다. <b>홍보 신청 양식</b>이 맞는지 확인해 주세요. (광고비 파일은 ‘광고비 집행’ 메뉴에서 업로드)
            </p>
          )}
          {result.errors.length > 0 && (
            <div className="mt-3">
              <div className="text-sm font-semibold text-pgray-700">확인이 필요한 행</div>
              <ul className="mt-1 max-h-52 overflow-auto rounded-lg bg-pgray-50 p-3 text-sm text-pgray-600">
                {result.errors.map((e, i) => (
                  <li key={i}>• {e}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <Link href="/dashboard" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              대시보드에서 분석 보기 →
            </Link>
            <Link href="/requests" className="rounded-lg border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">
              신청 목록 보기
            </Link>
          </div>
        </Card>
      )}

      {/* 초기화(더미 데이터 삭제) */}
      <Card className="mt-6 border border-pgray-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm font-bold text-pgray-700">시연용 더미 데이터 삭제</div>
            <div className="text-xs text-pgray-400">
              샘플로 들어있던 신청·배포일정을 모두 지우고, 실제 업로드 데이터로 시작할 수 있어요. (되돌릴 수 없음)
            </div>
          </div>
          <button onClick={clearDummy} className="rounded-lg border border-pgray-200 px-3 py-2 text-sm font-medium text-pgray-500 hover:bg-pgray-50 hover:text-brand-600">
            더미 데이터 삭제
          </button>
        </div>
      </Card>
    </div>
  );
}
