import { Card } from "@/components/ui";
import { getCurrentUser } from "@/lib/session";
import { getLang } from "@/lib/i18n-server";
import { makeT } from "@/lib/i18n";
import { NewRequestPicker } from "./NewRequestPicker";

export const dynamic = "force-dynamic";

export default async function NewRequestPage() {
  const lang = await getLang();
  const tr = makeT(lang);
  const user = await getCurrentUser();
  const me = { name: user?.name ?? "", email: user?.email ?? "", department: user?.department ?? "" };
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

      <NewRequestPicker me={me} lang={lang} />
    </div>
  );
}
