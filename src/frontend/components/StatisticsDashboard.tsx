"use client";

import React from "react";
import type { TravelRecord } from "@/src/backend/types/travel";
import { fmtMoney, getStats, getYearlyCounts } from "@/src/frontend/utils/travel";

type Props = {
  records: TravelRecord[];
};

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
  const yearlyCounts = React.useMemo(() => getYearlyCounts(sortedRecords), [sortedRecords]);
  const maxYearCount = Math.max(1, ...Object.values(yearlyCounts));
  const seatCounts = React.useMemo(
    () =>
      filteredRecords.reduce<Record<string, number>>((acc, record) => {
        acc[record.seat] = (acc[record.seat] || 0) + 1;
        return acc;
      }, {}),
    [filteredRecords],
  );

  return (
    <div className="statistics-grid">
      <section className="panel summary-panel">
        <div className="panel-head">
          <div>
            <p className="section-label">统计面板</p>
            <h2>最近几年乘坐记录</h2>
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

        <div className="stats-grid">
          <StatCard label="当前筛选行程" value={String(stats.totalTrips)} desc="条乘车记录" />
          <StatCard label="累计票价" value={fmtMoney(stats.totalFare)} desc="本页统计总额" />
          <StatCard label="不同线路" value={String(stats.uniqueRoutes)} desc="条独立线路" />
          <StatCard
            label="高频年份"
            value={stats.peakYear?.year ?? "-"}
            desc={stats.peakYear ? `${stats.peakYear.count} 次记录` : "暂无数据"}
          />
        </div>
      </section>

      <section className="panel chart-panel">
        <div className="chart-head">
          <h3>年度分布</h3>
          <span>{years.length ? `${years[0]} - ${years[years.length - 1]}` : "暂无记录"}</span>
        </div>
        <div className="bars">
          {Object.entries(yearlyCounts).map(([year, count]) => (
            <div className="bar-row" key={year}>
              <strong>{year}</strong>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${Math.max(10, (count / maxYearCount) * 100)}%` }} />
              </div>
              <span>{count}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel chart-panel">
        <div className="chart-head">
          <h3>席别分布</h3>
          <span>{filteredRecords.length} 条</span>
        </div>
        <div className="bars">
          {Object.entries(seatCounts).map(([seat, count]) => (
            <div className="bar-row" key={seat}>
              <strong>{seat}</strong>
              <div className="bar-track">
                <div className="bar-fill green" style={{ width: `${Math.max(10, (count / stats.totalTrips) * 100)}%` }} />
              </div>
              <span>{count}</span>
            </div>
          ))}
        </div>
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
