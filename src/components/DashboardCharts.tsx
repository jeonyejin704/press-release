"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// POSTECH palette: Red, Orange, Gray + tints
const COLORS = ["#a61955", "#f6a700", "#7a7772", "#cd527d", "#fcc74c", "#b7b4b0"];

export function MonthlyTrend({ data }: { data: { month: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Line type="monotone" dataKey="count" stroke="#a61955" strokeWidth={2.5} dot={{ r: 3 }} name="신청 수" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TypePie({ data }: { data: { label: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="label"
          cx="50%"
          cy="50%"
          innerRadius={45}
          outerRadius={80}
          paddingAngle={2}
          label={(e: any) => `${e.label} ${e.count}`}
          labelLine={false}
          fontSize={11}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function DepartmentBar({ data }: { data: { label: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
        <YAxis type="category" dataKey="label" width={80} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="count" fill="#a61955" radius={[0, 4, 4, 0]} name="신청 수" />
      </BarChart>
    </ResponsiveContainer>
  );
}
