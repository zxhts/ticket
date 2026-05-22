"use client";

import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TravelRecord } from "@/src/backend/types/travel";
import { fmtMoney, getStats } from "@/src/frontend/utils/travel";

type Props = {
  records: TravelRecord[];
};

type ChartPoint = {
  label: string;
  value: number;
  extra?: number;
};

const chartColors = ["#1f6feb", "#0f9d74", "#f59e0b", "#ef4444", "#7c3aed", "#0891b2", "#64748b"];

export default function StatisticsDashboard({ records }: Props) {
  const [selectedYear, setSelectedYear] = React.useState("全部");
  const sortedRecords = React.useMemo(
    () => [...records].sort((a, b) => b.date.localeCompare(a.date)),
    [records],
  );
  const years = React.useMemo(
    () => Array.from(new Set(sortedRecords.map((record) => record.date.slice(0, 4)))).sort(),
    [sortedRecords],
  );
  const filteredRecords = React.useMemo(
    () =>
      selectedYear === "全部"
        ? sortedRecords
        : sortedRecords.filter((record) => record.date.startsWith(selectedYear)),
    [selectedYear, sortedRecords],
  );
  const stats = React.useMemo(() => getStats(filteredRecords), [filteredRecords]);
  const yearlySeries = React.useMemo(() => getYearlySeries(sortedRecords), [sortedRecords]);
  const fareTrend = React.useMemo(() => getFareTrend(yearlySeries), [yearlySeries]);
  const seatDistribution = React.useMemo(() => getCountSeries(filteredRecords, (record) => record.seat), [filteredRecords]);
  const trainTypeDistribution = React.useMemo(
    () => getCountSeries(filteredRecords, (record) => getTrainType(record.train)),
    [filteredRecords],
  );
  const arrivalStations = React.useMemo(() => getCountSeries(filteredRecords, (record) => record.to).slice(0, 8), [filteredRecords]);
  const cities = React.useMemo(
    () => getCountSeries(filteredRecords, (record) => normalizeCity(record.to)).slice(0, 8),
    [filteredRecords],
  );
  const topRoutes = React.useMemo(
    () => getCountSeries(filteredRecords, (record) => `${record.from} → ${record.to}`).slice(0, 8),
    [filteredRecords],
  );

  return (
    <div className="dashboard-grid">
      <section className="panel summary-panel dashboard-wide">
        <div className="panel-head">
          <div>
            <p className="section-label">统计看板</p>
            <h2>多维度乘车分析</h2>
          </div>
          <label className="filter">
            <span>年份</span>
            <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)}>
              <option value="全部">全部</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="stats-grid dashboard-stats">
          <StatCard label="当前筛选行程" value={String(stats.totalTrips)} desc="条乘车记录" />
          <StatCard label="累计票价" value={fmtMoney(stats.totalFare)} desc="筛选范围总额" />
          <StatCard label="不同线路" value={String(stats.uniqueRoutes)} desc="条独立线路" />
          <StatCard label="到达城市" value={String(new Set(filteredRecords.map((record) => normalizeCity(record.to))).size)} desc="个城市维度" />
        </div>
      </section>

      <section className="panel chart-panel dashboard-wide">
        <ChartHead title="年度出行柱状图" desc={years.length ? `${years[0]} - ${years[years.length - 1]}` : "暂无记录"} />
        <ChartBox>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearlySeries} margin={{ top: 12, right: 18, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e7eef8" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="year" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<DashboardTooltip moneyKeys={["fare"]} />} />
              <Legend />
              <Bar dataKey="count" name="出行次数" fill="#1f6feb" radius={[8, 8, 0, 0]} />
              <Bar dataKey="fare" name="年度票价" fill="#0f9d74" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </section>

      <section className="panel chart-panel dashboard-wide">
        <ChartHead title="累计票价趋势" desc="按年份累加" />
        <ChartBox>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={fareTrend} margin={{ top: 12, right: 18, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e7eef8" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `¥${value}`} />
              <Tooltip content={<DashboardTooltip moneyKeys={["value"]} />} />
              <Line
                type="monotone"
                dataKey="value"
                name="累计票价"
                stroke="#1f6feb"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartBox>
      </section>

      <section className="panel chart-panel">
        <ChartHead title="席别占比" desc={`${filteredRecords.length} 条`} />
        <PiePanel points={seatDistribution} />
      </section>

      <section className="panel chart-panel">
        <ChartHead title="车次类型占比" desc="G/D/C/Z/T/K/其他" />
        <PiePanel points={trainTypeDistribution} />
      </section>

      <section className="panel chart-panel">
        <ChartHead title="热门到达车站" desc="Top 8" />
        <HorizontalBars points={arrivalStations} />
      </section>

      <section className="panel chart-panel">
        <ChartHead title="热门到达城市" desc="Top 8" />
        <HorizontalBars points={cities} color="#0f9d74" />
      </section>

      <section className="panel chart-panel dashboard-wide">
        <ChartHead title="高频线路" desc="Top 8" />
        <ChartBox compact>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topRoutes} layout="vertical" margin={{ top: 8, right: 24, left: 70, bottom: 0 }}>
              <CartesianGrid stroke="#e7eef8" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={120} />
              <Tooltip content={<DashboardTooltip />} />
              <Bar dataKey="value" name="出行次数" fill="#1f6feb" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </section>

      <section className="panel list-panel recent-panel">
        <div className="panel-head">
          <div>
            <p className="section-label">最近记录</p>
            <h2>行程明细</h2>
          </div>
          <div className="chip">{filteredRecords.length} 条</div>
        </div>
        <div className="record-list compact">
          {filteredRecords.map((record) => (
            <article className="record" key={record.id}>
              <div>
                <strong>
                  {record.from} → {record.to}
                </strong>
                <div className="meta">{getRecordMeta(record)}</div>
              </div>
              <div className="price">{fmtMoney(record.fare)}</div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function ChartHead({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="chart-head">
      <h3>{title}</h3>
      <span>{desc}</span>
    </div>
  );
}

function ChartBox({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    setReady(true);
  }, []);

  return <div className={`rechart-box${compact ? " compact" : ""}`}>{ready ? children : <div className="chart-skeleton" />}</div>;
}

function PiePanel({ points }: { points: ChartPoint[] }) {
  return (
    <div className="rechart-pie-layout">
      <ChartBox compact>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={points} dataKey="value" nameKey="label" innerRadius={54} outerRadius={86} paddingAngle={2}>
              {points.map((point, index) => (
                <Cell key={point.label} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip content={<DashboardTooltip />} />
            <Legend verticalAlign="bottom" height={32} />
          </PieChart>
        </ResponsiveContainer>
      </ChartBox>
    </div>
  );
}

function HorizontalBars({ points, color = "#1f6feb" }: { points: ChartPoint[]; color?: string }) {
  return (
    <ChartBox compact>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} layout="vertical" margin={{ top: 8, right: 24, left: 48, bottom: 0 }}>
          <CartesianGrid stroke="#e7eef8" strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={88} />
          <Tooltip content={<DashboardTooltip />} />
          <Bar dataKey="value" name="出行次数" fill={color} radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartBox>
  );
}

function DashboardTooltip({
  active,
  payload,
  label,
  moneyKeys = [],
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string | number; name?: string; value?: number | string; color?: string }>;
  label?: string;
  moneyKeys?: string[];
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      {payload.map((item) => {
        const dataKey = String(item.dataKey || "");
        const value = typeof item.value === "number" && moneyKeys.includes(dataKey) ? fmtMoney(item.value) : item.value;
        return (
          <p key={`${item.name}-${dataKey}`}>
            <i style={{ background: item.color }} />
            <span>{item.name}</span>
            <em>{value}</em>
          </p>
        );
      })}
    </div>
  );
}

function getYearlySeries(records: TravelRecord[]) {
  const groups = records.reduce<Record<string, { count: number; fare: number }>>((acc, record) => {
    const year = record.date.slice(0, 4);
    acc[year] = acc[year] || { count: 0, fare: 0 };
    acc[year].count += 1;
    acc[year].fare += record.fare;
    return acc;
  }, {});

  return Object.entries(groups)
    .sort(([yearA], [yearB]) => yearA.localeCompare(yearB))
    .map(([year, value]) => ({ year, count: value.count, fare: Number(value.fare.toFixed(1)) }));
}

function getFareTrend(series: ReturnType<typeof getYearlySeries>): ChartPoint[] {
  let total = 0;
  return series.map((item) => {
    total += item.fare;
    return { label: item.year, value: Number(total.toFixed(1)) };
  });
}

function getCountSeries(records: TravelRecord[], getKey: (record: TravelRecord) => string): ChartPoint[] {
  const counts = records.reduce<Record<string, number>>((acc, record) => {
    const key = getKey(record) || "未填写";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));
}

function getTrainType(train: string) {
  const prefix = train.match(/^[A-Z]/i)?.[0]?.toUpperCase();
  if (!prefix) return "普速数字";
  if (["G", "D", "C", "Z", "T", "K"].includes(prefix)) return `${prefix} 字头`;
  return "其他";
}

function normalizeCity(station: string) {
  return station
    .replace(/(东|西|南|北|朝阳|丰台|通州|清河|机场|北站|南站|东站|西站)$/g, "")
    .replace(/站$/g, "") || station;
}

function getRecordMeta(record: TravelRecord) {
  return [record.date, record.train, record.seat, record.seatNo, record.remark].filter(Boolean).join(" · ");
}

function StatCard({ label, value, desc }: { label: string; value: string; desc: string }) {
  return (
    <article className="stat">
      <div className="desc">{label}</div>
      <div className="value">{value}</div>
      <div className="desc">{desc}</div>
    </article>
  );
}
