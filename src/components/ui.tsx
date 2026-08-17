import Link from "next/link";
import {
  REQUEST_STATUS_COLORS,
  REQUEST_STATUS_LABELS,
  STATUS_TO_PHASE,
  STATUS_PHASE_LABELS,
  STATUS_PHASE_COLORS,
  type RequestStatus,
} from "@/lib/enums";
import { t, type Lang } from "@/lib/i18n";

// 기본은 4단계 묶음 라벨(접수/검토·작성 중/배포 예정/배포 완료 등)을 보여준다.
// detailed=true 이면 14개 세부 상태 라벨을 그대로 보여준다(상세 페이지용).
// lang이 주어지면 4단계 라벨을 해당 언어로 표시한다(기본 한국어).
export function StatusBadge({ status, detailed = false, lang = "ko" }: { status: string; detailed?: boolean; lang?: Lang }) {
  const s = status as RequestStatus;
  if (detailed) {
    const color = REQUEST_STATUS_COLORS[s] ?? "bg-gray-100 text-gray-700";
    const label = REQUEST_STATUS_LABELS[s] ?? status;
    return (
      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
        {label}
      </span>
    );
  }
  const phase = STATUS_TO_PHASE[s] ?? "DRAFT";
  const color = STATUS_PHASE_COLORS[phase] ?? "bg-gray-100 text-gray-700";
  const label = lang === "en" ? t("en", `phase.${phase}`) : STATUS_PHASE_LABELS[phase] ?? status;
  return (
    <span
      title={REQUEST_STATUS_LABELS[s] ?? status}
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}
    >
      {label}
    </span>
  );
}

export function Badge({
  children,
  color = "bg-gray-100 text-gray-700",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {children}
    </span>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-pgray-100 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent = "text-brand-700",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: string;
}) {
  return (
    <Card className="p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${accent}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </Card>
  );
}

type BtnProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const BTN_STYLES: Record<string, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700",
  secondary: "bg-white text-brand-700 border border-brand-200 hover:bg-brand-50",
  danger: "bg-brand-700 text-white hover:bg-brand-800",
  ghost: "text-slate-600 hover:bg-slate-100",
};

export function Button({ children, variant = "primary", className = "", ...rest }: BtnProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:opacity-50 ${BTN_STYLES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-medium transition ${BTN_STYLES[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-14 text-center">
      <div className="text-slate-500">{title}</div>
      {hint && <div className="mt-1 text-sm text-slate-400">{hint}</div>}
    </div>
  );
}

export function Field({
  label,
  children,
  required,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-brand-600">*</span>}
      </span>
      <div className="mt-1">{children}</div>
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";
