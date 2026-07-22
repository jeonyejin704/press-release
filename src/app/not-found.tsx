import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f6f8fb] text-center">
      <div className="text-5xl font-bold text-brand-700">404</div>
      <p className="text-slate-500">요청하신 페이지를 찾을 수 없거나 접근 권한이 없습니다.</p>
      <Link href="/" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">
        홈으로
      </Link>
    </main>
  );
}
