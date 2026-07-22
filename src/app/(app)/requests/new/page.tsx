import Link from "next/link";
import { Card } from "@/components/ui";
import { REQUEST_TYPES, REQUEST_TYPE_LABELS } from "@/lib/enums";

const TYPE_DESC: Record<string, string> = {
  RESEARCH: "논문 초록을 입력하면 AI가 보도자료 초안을 생성합니다.",
  AWARD: "교원·연구자의 수상 소식을 알립니다.",
  APPOINTMENT: "위원회·자문기구 위원 선임 소식을 알립니다.",
  PERSONAL_NEWS: "구성원의 동정(강연, 방문 등) 소식을 알립니다.",
  EVENT: "행사 및 이벤트를 육하원칙으로 홍보합니다.",
  OTHER: "기타 대학 소식을 자유롭게 신청합니다.",
};

const TYPE_ICON: Record<string, string> = {
  RESEARCH: "🔬",
  AWARD: "🏆",
  APPOINTMENT: "📋",
  PERSONAL_NEWS: "👤",
  EVENT: "🎪",
  OTHER: "📰",
};

export default function NewRequestPage() {
  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-slate-800">새 홍보 신청</h1>
      <p className="mb-5 text-sm text-slate-500">홍보 유형을 선택하세요.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {REQUEST_TYPES.map((t) => (
          <Link key={t} href={`/requests/new/${t.toLowerCase()}`}>
            <Card className="h-full p-5 transition hover:border-brand-300 hover:shadow-md">
              <div className="text-3xl">{TYPE_ICON[t]}</div>
              <div className="mt-2 font-semibold text-slate-800">
                {REQUEST_TYPE_LABELS[t]}
              </div>
              <div className="mt-1 text-sm text-slate-500">{TYPE_DESC[t]}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
