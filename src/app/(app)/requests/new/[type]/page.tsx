import { notFound } from "next/navigation";
import { RequestForm } from "./RequestForm";
import { isRequestType, type RequestType } from "@/lib/enums";

export default async function NewTypedRequestPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const upper = type.toUpperCase();
  if (!isRequestType(upper)) notFound();
  return <RequestForm type={upper as RequestType} />;
}
