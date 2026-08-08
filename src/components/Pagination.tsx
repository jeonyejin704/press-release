import Link from "next/link";

// 서버 렌더 페이지네이션 (필터 유지 링크는 hrefFn 으로 전달)
export function Pagination({
  page,
  totalPages,
  hrefFn,
}: {
  page: number;
  totalPages: number;
  hrefFn: (p: number) => string;
}) {
  if (totalPages <= 1) return null;
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  const nums: number[] = [];
  for (let p = start; p <= end; p++) nums.push(p);

  const base = "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm";
  const edge = (disabled: boolean, href: string, label: string) =>
    disabled ? (
      <span className={`${base} text-pgray-300`}>{label}</span>
    ) : (
      <Link href={href} className={`${base} text-pgray-500 hover:bg-pgray-100`}>{label}</Link>
    );

  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-1">
      {edge(page === 1, hrefFn(1), "«")}
      {edge(page === 1, hrefFn(page - 1), "‹")}
      {start > 1 && <span className="px-1 text-pgray-400">…</span>}
      {nums.map((p) => (
        <Link
          key={p}
          href={hrefFn(p)}
          className={`${base} font-semibold ${p === page ? "bg-brand-600 text-white" : "text-pgray-500 hover:bg-pgray-100"}`}
        >
          {p}
        </Link>
      ))}
      {end < totalPages && <span className="px-1 text-pgray-400">…</span>}
      {edge(page === totalPages, hrefFn(page + 1), "›")}
      {edge(page === totalPages, hrefFn(totalPages), "»")}
    </div>
  );
}
