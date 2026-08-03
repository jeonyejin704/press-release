"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Button, Badge } from "@/components/ui";

type Result = { imported: number; skipped: number; errors: string[] };

export function ImportClient() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setError("");
    setResult(null);
    setBusy(true);
    setFileName(file.name);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/import", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "가져오기에 실패했습니다.");
        return;
      }
      setResult(data);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl text-pgray-900">데이터 가져오기 (일괄 등록)</h1>
      <p className="mt-1 text-sm text-pgray-500">
        지금까지 접수된 과거 홍보 신청 내역을 엑셀로 한 번에 등록합니다. 앞으로의 신청은 ‘새 홍보 신청’ 폼으로 하나씩 입력하세요.
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
          필수 항목: <b>유형 · 제목 · 학과 · 신청일 · 상태</b>. (엑셀 .xlsx 또는 .csv)
        </p>
        <label className="inline-flex cursor-pointer items-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          {busy ? "가져오는 중…" : "파일 선택해서 가져오기"}
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = "";
            }}
          />
        </label>
        {fileName && <span className="ml-3 text-sm text-pgray-500">{fileName}</span>}
        {error && <p className="mt-3 text-sm font-medium text-brand-600">{error}</p>}
      </Card>

      {result && (
        <Card className="mt-3 border-t-4 border-t-brand-600 p-5">
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold text-pgray-900">가져오기 완료</span>
            <Badge color="bg-brand-100 text-brand-700">{result.imported}건 등록</Badge>
            {result.skipped > 0 && <Badge color="bg-accent-100 text-accent-800">{result.skipped}건 건너뜀</Badge>}
          </div>
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
    </div>
  );
}
