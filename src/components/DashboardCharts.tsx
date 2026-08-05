"use client";

import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// POSTECH palette
const RED = "#a61955";
const ORANGE = "#f6a700";
const GRAY = "#7a7772";
const COLORS = [RED, ORANGE, GRAY, "#cd527d", "#fcc74c", "#b7b4b0"];

// 연도 라벨 (올해 = 현재 연도, 전년 = 그 이전)
const THIS_YEAR = `${new Date().getFullYear()}년`;
const LAST_YEAR = `${new Date().getFullYear() - 1}년`;

// ── 월별 신청 추이 (올해 vs 전년 동월) ─────────────────────────────
export function MonthlyTrend({
  data,
}: {
  data: { month: string; count: number; prevCount: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee7ea" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: number, n: string) => [`${v}건`, n]} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="prevCount" name={LAST_YEAR} stroke={ORANGE} strokeWidth={2} strokeDasharray="5 4" dot={{ r: 2 }} isAnimationActive={false} />
        <Line type="monotone" dataKey="count" name={THIS_YEAR} stroke={RED} strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── 홍보 유형별 비율 (라벨 정리 + 클릭 이동) ────────────────────────
const RAD = Math.PI / 180;
function makeLabel() {
  return function renderTypeLabel(props: any) {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, name } = props;
    if (!percent) return null;
    const rIn = innerRadius + (outerRadius - innerRadius) * 0.5;
    const xIn = cx + rIn * Math.cos(-midAngle * RAD);
    const yIn = cy + rIn * Math.sin(-midAngle * RAD);
    const rOut = outerRadius + 12;
    const xOut = cx + rOut * Math.cos(-midAngle * RAD);
    const yOut = cy + rOut * Math.sin(-midAngle * RAD);
    const anchor = xOut >= cx ? "start" : "end";
    return (
      <g>
        <text x={xIn} y={yIn} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
          {(percent * 100).toFixed(0)}%
        </text>
        <text x={xOut} y={yOut} fill="#2a2827" textAnchor={anchor} dominantBaseline="central" fontSize={11} fontWeight={700}>
          {name}
        </text>
      </g>
    );
  };
}

export function TypePie({
  data,
  linkMap,
}: {
  data: { key: string; label: string; count: number }[];
  linkMap?: Record<string, string>;
}) {
  const router = useRouter();
  const clickable = (key: string) => linkMap && linkMap[key];
  return (
    <ResponsiveContainer width="100%" aspect={1.35} maxHeight={400}>
      <PieChart margin={{ top: 12, right: 44, bottom: 12, left: 44 }}>
        <Pie
          data={data}
          dataKey="count"
          nameKey="label"
          cx="50%"
          cy="50%"
          innerRadius="42%"
          outerRadius="72%"
          paddingAngle={2}
          label={makeLabel()}
          labelLine={false}
          isAnimationActive={false}
          onClick={(entry: any) => {
            const href = clickable(entry?.key);
            if (href) router.push(href);
          }}
        >
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={COLORS[i % COLORS.length]}
              cursor={clickable(d.key) ? "pointer" : "default"}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(v: number, _n: string, p: any) => [
            `${v}건${clickable(p?.payload?.key) ? " · 클릭하여 상세" : ""}`,
            p?.payload?.label,
          ]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── 학과별 신청 건수 (올해 vs 전년) ────────────────────────────────
export function DepartmentBar({
  data,
}: {
  data: { label: string; thisYear: number; lastYear: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 18, left: 22, bottom: 5 }} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee7ea" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="label" width={78} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: number, n: string) => [`${v}건`, n]} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="thisYear" name={THIS_YEAR} fill={RED} radius={[0, 3, 3, 0]} />
        <Bar dataKey="lastYear" name={LAST_YEAR} fill={ORANGE} radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── 광고비 집행액 추이 (올해 vs 전년, 월별) ────────────────────────
export function AdSpendTrend({
  data,
}: {
  data: { month: string; thisYear: number; lastYear: number; ymThis: string; ymLast: string }[];
}) {
  const router = useRouter();
  const won = (v: number) => `${(v / 10000).toLocaleString()}만원`;
  const go = (ym?: string) => { if (ym) router.push(`/ads?month=${ym}`); };
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 10, right: 12, left: 6, bottom: 0 }} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee7ea" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={(v: number) => `${Math.round(v / 10000)}만`} tick={{ fontSize: 10 }} width={44} />
        <Tooltip formatter={(v: number, n: string) => [won(v), n]} cursor={{ fill: "rgba(166,25,85,0.06)" }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="lastYear" name={LAST_YEAR} fill={ORANGE} radius={[3, 3, 0, 0]} cursor="pointer" onClick={(d: any) => go(d?.ymLast)} />
        <Bar dataKey="thisYear" name={THIS_YEAR} fill={RED} radius={[3, 3, 0, 0]} cursor="pointer" onClick={(d: any) => go(d?.ymThis)} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── 저널별 게재 건수 (연구성과 저널 상세 페이지) ──────────────────
export function JournalBar({
  data,
  topTier,
}: {
  data: { name: string; count: number }[];
  topTier: string[];
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(240, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 24, left: 40, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee7ea" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: number) => [`${v}건`, "게재"]} />
        <Bar dataKey="count" name="게재 건수" radius={[0, 4, 4, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={topTier.includes(d.name) ? RED : ORANGE} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
