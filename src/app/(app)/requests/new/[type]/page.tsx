import { notFound } from "next/navigation";
import { RequestForm } from "./RequestForm";
import { isRequestType, type RequestType } from "@/lib/enums";
import { getCurrentUser } from "@/lib/session";
import { getLang } from "@/lib/i18n-server";

export default async function NewTypedRequestPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const upper = type.toUpperCase();
  if (!isRequestType(upper)) notFound();
  const user = await getCurrentUser();
  const lang = await getLang();
  return (
    <RequestForm
      type={upper as RequestType}
      me={{ name: user?.name ?? "", email: user?.email ?? "", department: user?.department ?? "" }}
      lang={lang}
    />
  );
}
