import Link from "next/link";
import { Card } from "@/components/ui";
import { REQUEST_TYPES, requestTypeLabel } from "@/lib/enums";
import { requestGuide } from "@/lib/formConfig";
import { getLang } from "@/lib/i18n-server";
import { makeT } from "@/lib/i18n";

const TYPE_ICON: Record<string, string> = {
  RESEARCH: "🔬",
  AWARD: "🏆",
  APPOINTMENT: "📋",
  PERSONAL_NEWS: "👤",
  EVENT: "🎪",
  OTHER: "📰",
};

export default async function NewRequestPage() {
  const lang = await getLang();
  const tr = makeT(lang);
  return (
    <div>
      <h1 className="font-display text-2xl text-pgray-900">{tr("new.title")}</h1>
      <p className="mt-1 text-sm text-pgray-500">{tr("new.subtitle")}</p>

      {/* 공통 안내 배너 */}
      <Card className="mt-4 border-accent-200 bg-accent-50 p-4">
        <p className="text-sm leading-relaxed text-pgray-700">
          {tr("new.banner")}
          <br />
          <span className="text-pgray-500">{tr("new.banner.contact")}</span>
        </p>
      </Card>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {REQUEST_TYPES.map((t) => (
          <Link key={t} href={`/requests/new/${t.toLowerCase()}`} className="group">
            <Card className="flex h-full flex-col p-5 transition group-hover:-translate-y-0.5 group-hover:border-brand-300 group-hover:shadow-md">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{TYPE_ICON[t]}</span>
                <span className="text-lg font-bold text-pgray-900">{requestTypeLabel(t, lang)}</span>
              </div>
              <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-pgray-500">
                {requestGuide(t, lang)}
              </p>
              <span className="mt-3 text-sm font-semibold text-brand-600 group-hover:text-brand-700">
                {tr("new.apply")}
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
