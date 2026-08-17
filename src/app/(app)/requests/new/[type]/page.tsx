import { notFound } from "next/navigation";
import { RequestForm } from "./RequestForm";
import { isRequestType, type RequestType } from "@/lib/enums";
import { getCurrentUser } from "@/lib/session";

export default async function NewTypedRequestPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const upper = type.toUpperCase();
  if (!isRequestType(upper)) notFound();
  const user = await getCurrentUser();
  return (
    <RequestForm
      type={upper as RequestType}
      me={{ name: user?.name ?? "", email: user?.email ?? "", department: user?.department ?? "" }}
    />
  );
}
