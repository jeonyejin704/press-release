import { redirect } from "next/navigation";
import { getCurrentUser, isManager } from "@/lib/session";
import { ImportClient } from "./ImportClient";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isManager(user)) redirect("/requests");
  return <ImportClient />;
}
