import Link from "next/link";
import { Card } from "@/components/ui";
import { REQUEST_TYPES, REQUEST_TYPE_LABELS } from "@/lib/enums";
import { REQUEST_GUIDE } from "@/lib/formConfig";

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
      <h1 className="font-display text-2xl text-pgray-900">새 홍보 신청</h1>
      <p className="mt-1 text-sm text-pgray-500">홍보 유형을 선택하세요. 각 유형의 안내를 먼저 확인해 주세요.</p>

      {/* 공통 안내 배너 */}
      <Card className="mt-4 border-accent-200 bg-accent-50 p-4">
        <p className="text-sm leading-relaxed text-pgray-700">
          각 유형 화면에서 <span className="font-semibold">‘보도자료 초안 양식’</span>을 내려받아 작성하신 뒤,
          파일로 업로드해 주세요. 대외협력팀이 이를 검토·보완하여 최종본을 완성합니다.
          <br />
          <span className="text-pgray-500">문의사항이 있을 경우 대외협력팀(054-279-2416)으로 연락 부탁드립니다.</span>
        </p>
      </Card>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {REQUEST_TYPES.map((t) => (
          <Link key={t} href={`/requests/new/${t.toLowerCase()}`} className="group">
            <Card className="flex h-full flex-col p-5 transition group-hover:-translate-y-0.5 group-hover:border-brand-300 group-hover:shadow-md">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{TYPE_ICON[t]}</span>
                <span className="text-lg font-bold text-pgray-900">{REQUEST_TYPE_LABELS[t]}</span>
              </div>
              <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-pgray-500">
                {REQUEST_GUIDE[t]}
              </p>
              <span className="mt-3 text-sm font-semibold text-brand-600 group-hover:text-brand-700">
                신청하기 →
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
