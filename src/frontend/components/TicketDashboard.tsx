"use client";

import React from "react";
import type { DraftRecord, ImportResult, SeatType, TravelRecord } from "@/src/backend/types/travel";
import { fmtMoney, getStats, getYearlyCounts, seatOptions } from "@/src/frontend/utils/travel";

type Props = {
  initialRecords: TravelRecord[];
};

export default function TicketDashboard({ initialRecords }: Props) {
  const [records, setRecords] = React.useState(initialRecords);
  const [selectedYear, setSelectedYear] = React.useState("全部");
  const [draft, setDraft] = React.useState<DraftRecord>({
    date: "",
    train: "",
    from: "",
    to: "",
    seat: "二等座",
    fare: "",
    duration: "",
  });
  const [importText, setImportText] = React.useState("");
  const [importResult, setImportResult] = React.useState<ImportResult | null>(null);

  const sortedRecords = React.useMemo(
    () => [...records].sort((a, b) => a.date.localeCompare(b.date)),
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

  React.useEffect(() => {
    if (selectedYear !== "全部" && !years.includes(selectedYear)) {
      setSelectedYear("全部");
    }
  }, [selectedYear, years]);

  function updateDraft<K extends keyof DraftRecord>(key: K, value: DraftRecord[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function refreshRecords() {
    const nextRecords = await fetchJson<TravelRecord[]>("/api/records");
    setRecords(nextRecords);
  }

  async function addRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await fetchJson<TravelRecord>("/api/records", {
      method: "POST",
      body: JSON.stringify({
        date: draft.date,
        train: draft.train.trim().toUpperCase(),
        from: draft.from.trim(),
        to: draft.to.trim(),
        seat: draft.seat,
        fare: Number(draft.fare),
        duration: draft.duration.trim() || "未填写",
      }),
    });
    resetDraft();
    await refreshRecords();
  }

  async function deleteRecord(id: string) {
    await fetchJson<{ deleted: number }>(`/api/records/${id}`, { method: "DELETE" });
    await refreshRecords();
  }

  async function resetRecords() {
    await fetchJson<{ count: number }>("/api/records/reset", { method: "POST" });
    setSelectedYear("全部");
    await refreshRecords();
  }

  async function importRecords() {
    const result = await fetchJson<ImportResult>("/api/records/import", {
      method: "POST",
      body: JSON.stringify({ text: importText }),
    });
    setImportResult(result);
    if (result.added > 0) {
      setImportText("");
      await refreshRecords();
    }
  }

  function resetDraft() {
    setDraft({
      date: "",
      train: "",
      from: "",
      to: "",
      seat: "二等座",
      fare: "",
      duration: "",
    });
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">个人出行档案</p>
          <h1>火车乘坐记录统计与车票生成</h1>
        </div>
        <div className="toolbar">
          <button className="ghost-btn" type="button" onClick={resetRecords}>
            恢复全部记录
          </button>
          <button className="primary-btn" type="button" onClick={() => window.print()}>
            打印车票
          </button>
        </div>
      </header>

      <main className="layout">
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

          <div className="chart-card">
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
          </div>
        </section>

        <section className="panel records-panel">
          <div className="panel-head">
            <div>
              <p className="section-label">行程列表</p>
              <h2>每次出行记录</h2>
            </div>
            <div className="chip">{filteredRecords.length} 条可见</div>
          </div>

          <form className="entry-form" onSubmit={addRecord}>
            <input
              aria-label="乘车日期"
              type="date"
              required
              value={draft.date}
              onChange={(event) => updateDraft("date", event.target.value)}
            />
            <input
              aria-label="车次"
              type="text"
              required
              placeholder="车次"
              value={draft.train}
              onChange={(event) => updateDraft("train", event.target.value)}
            />
            <input
              aria-label="出发站"
              type="text"
              required
              placeholder="出发站"
              value={draft.from}
              onChange={(event) => updateDraft("from", event.target.value)}
            />
            <input
              aria-label="到达站"
              type="text"
              required
              placeholder="到达站"
              value={draft.to}
              onChange={(event) => updateDraft("to", event.target.value)}
            />
            <select
              aria-label="席别"
              value={draft.seat}
              onChange={(event) => updateDraft("seat", event.target.value as SeatType)}
            >
              {seatOptions.map((seat) => (
                <option key={seat}>{seat}</option>
              ))}
            </select>
            <input
              aria-label="票价"
              type="number"
              min="0"
              step="0.5"
              required
              placeholder="票价"
              value={draft.fare}
              onChange={(event) => updateDraft("fare", event.target.value)}
            />
            <input
              aria-label="用时"
              type="text"
              placeholder="用时"
              value={draft.duration}
              onChange={(event) => updateDraft("duration", event.target.value)}
            />
            <button className="primary-btn" type="submit">
              添加记录
            </button>
          </form>

          <section className="import-box">
            <div className="import-head">
              <div>
                <h3>批量导入</h3>
                <p>从语雀复制表格或多行文本粘贴到这里</p>
              </div>
              <button className="ghost-btn" type="button" onClick={importRecords} disabled={!importText.trim()}>
                导入
              </button>
            </div>
            <textarea
              aria-label="批量导入行程"
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              placeholder="支持：日期 车次 出发站 到达站 席别 票价 用时"
            />
            {importResult && (
              <p className="import-result">
                已导入 {importResult.added} 条，跳过 {importResult.skipped} 行
              </p>
            )}
          </section>

          <div className="record-list">
            {filteredRecords.map((record) => (
              <article className="record" key={record.id}>
                <div>
                  <strong>
                    {record.from} → {record.to}
                  </strong>
                  <div className="meta">
                    {record.date} · {record.train} · {record.seat} · {record.duration}
                  </div>
                </div>
                <div className="price">{fmtMoney(record.fare)}</div>
                <button
                  className="delete-btn"
                  type="button"
                  aria-label={`删除 ${record.train}`}
                  onClick={() => deleteRecord(record.id)}
                >
                  ×
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="panel ticket-panel">
          <div className="panel-head">
            <div>
              <p className="section-label">车票预览</p>
              <h2>逐条生成票面</h2>
            </div>
            <div className="chip">自动编号</div>
          </div>

          <div className="ticket-grid">
            {filteredRecords.map((record, index) => (
              <article className="ticket" key={record.id}>
                <div className="ticket-top">
                  <div>
                    <p className="ticket-label">铁路电子客票</p>
                    <h3 className="ticket-route">
                      {record.from} - {record.to}
                    </h3>
                  </div>
                  <div className="ticket-no">NO. {String(index + 1).padStart(2, "0")}</div>
                </div>
                <div className="ticket-body">
                  <TicketMeta label="乘车日期" value={record.date} />
                  <TicketMeta label="车次" value={record.train} />
                  <TicketMeta label="席别" value={record.seat} />
                  <TicketMeta label="票价" value={fmtMoney(record.fare)} />
                </div>
                <div className="ticket-footer">
                  <div>
                    <span className="label">出发</span>
                    <strong>{record.from}</strong>
                  </div>
                  <div className="arrow">→</div>
                  <div>
                    <span className="label">到达</span>
                    <strong>{record.to}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
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

function TicketMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="ticket-meta">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

async function fetchJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return (await response.json()) as T;
}
