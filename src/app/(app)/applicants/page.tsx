import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, isManager } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ApplicantsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isManager(user)) redirect("/requests");

  // 홍보를 신청한 적 있는 신청자 목록 + 최근 연락처
  const applicants = await prisma.user.findMany({
    where: { role: "APPLICANT", pressRequests: { some: {} } },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      phone: true,
      _count: { select: { pressRequests: true } },
      pressRequests: {
        select: { contactPhone: true, department: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { pressRequests: { _count: "desc" } },
  });

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-2xl text-pgray-900">신청자</h1>
        <p className="text-sm text-pgray-500">
          홍보를 신청한 신청자 정보입니다. 총 <span className="font-semibold text-brand-600">{applicants.length}</span>명
        </p>
      </div>

      {applicants.length === 0 ? (
        <EmptyState title="신청자가 없습니다." hint="홍보 신청이 접수되면 여기에 표시됩니다." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">이름</th>
                  <th className="whitespace-nowrap px-4 py-2.5">이메일</th>
                  <th className="whitespace-nowrap px-4 py-2.5">학과/부서</th>
                  <th className="whitespace-nowrap px-4 py-2.5">연락처</th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-right">신청 건수</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applicants.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-pgray-800">{a.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{a.email}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{a.department ?? a.pressRequests[0]?.department ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{a.phone ?? a.pressRequests[0]?.contactPhone ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link href={`/requests?q=&applicant=${a.id}`} className="font-semibold text-brand-700 hover:underline">
                        {a._count.pressRequests}건
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
