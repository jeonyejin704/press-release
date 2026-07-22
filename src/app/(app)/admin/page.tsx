import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui";
import { ROLE_LABELS, REQUEST_TYPE_LABELS, REQUEST_TYPES, type Role } from "@/lib/enums";
import { TEMPLATE_FILES } from "@/lib/formConfig";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const [users, keywords] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.newsKeyword.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">시스템 설정</h1>
        <p className="text-sm text-slate-500">
          관리자 전용. MVP에서는 조회 위주이며, 편집 기능은 향후 확장 예정입니다.
        </p>
      </div>

      <Card className="p-5">
        <div className="mb-3 text-sm font-semibold text-slate-700">사용자 · 권한</div>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-400">
            <tr>
              <th className="py-2">이름</th>
              <th className="py-2">이메일</th>
              <th className="py-2">소속</th>
              <th className="py-2">권한</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="py-2 font-medium text-slate-700">{u.name}</td>
                <td className="py-2 text-slate-500">{u.email}</td>
                <td className="py-2 text-slate-500">{u.department ?? "-"}</td>
                <td className="py-2">
                  <Badge>{ROLE_LABELS[u.role as Role]}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-slate-400">
          TODO: 권한 변경 UI. 현재는 시드/DB에서 직접 관리합니다.
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 text-sm font-semibold text-slate-700">뉴스 키워드</div>
          <div className="flex flex-wrap gap-2">
            {keywords.map((k) => (
              <Badge key={k.id} color="bg-brand-50 text-brand-700">
                {k.keyword}
              </Badge>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">TODO: 키워드 추가/삭제 UI.</p>
        </Card>

        <Card className="p-5">
          <div className="mb-3 text-sm font-semibold text-slate-700">홍보 유형</div>
          <div className="flex flex-wrap gap-2">
            {Object.values(REQUEST_TYPE_LABELS).map((l) => (
              <Badge key={l}>{l}</Badge>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-3 text-sm font-semibold text-slate-700">보도자료 초안 양식 관리</div>
        <p className="mb-3 text-xs text-slate-400">
          신청자가 새 홍보 신청 시 내려받는 유형별 양식입니다. 파일은 <code>public/templates/</code>에서 관리합니다.
        </p>
        <ul className="space-y-1.5 text-sm">
          {REQUEST_TYPES.map((t) => (
            <li key={t} className="flex items-center justify-between">
              <span className="text-slate-700">{REQUEST_TYPE_LABELS[t]}</span>
              <a href={TEMPLATE_FILES[t]} download className="text-brand-600 hover:underline">
                양식 다운로드
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-slate-400">TODO: 양식 파일 업로드/교체 UI.</p>
      </Card>
    </div>
  );
}
