"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { REQUEST_TYPES, requestTypeLabel, type RequestType } from "@/lib/enums";
import { requestGuide } from "@/lib/formConfig";
import { makeT, type Lang } from "@/lib/i18n";
import { RequestForm } from "./[type]/RequestForm";

const TYPE_ICON: Record<string, string> = {
  RESEARCH: "🔬",
  AWARD: "🏆",
  APPOINTMENT: "📋",
  PERSONAL_NEWS: "👤",
  EVENT: "🎪",
  OTHER: "📰",
};

// 유형 카드를 클릭하면 페이지 이동 대신 같은 페이지 위에 팝업(모달)으로 신청 폼을 띄운다.
export function NewRequestPicker({
  me,
  lang = "ko",
}: {
  me: { name: string; email: string; department: string };
  lang?: Lang;
}) {
  const tr = makeT(lang);
  const [selected, setSelected] = useState<RequestType | null>(null);

  return (
    <>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {REQUEST_TYPES.map((t) => (
          <button key={t} type="button" onClick={() => setSelected(t)} className="group text-left">
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
          </button>
        ))}
      </div>

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? `${tr("form.title")} · ${requestTypeLabel(selected, lang)}` : ""}
      >
        {selected && <RequestForm type={selected} me={me} lang={lang} embedded />}
      </Modal>
    </>
  );
}
