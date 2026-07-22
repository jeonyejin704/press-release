import { redirect } from "next/navigation";
import { getCurrentUser, isManager } from "@/lib/session";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (isManager(user)) redirect("/dashboard");
  redirect("/requests");
}
