import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";

type SeatType = "二等座" | "一等座" | "商务座" | "硬座" | "硬卧" | "软卧";

type TravelRecord = {
  id: string;
  date: string;
  train: string;
  from: string;
  to: string;
  seat: SeatType;
  fare: number;
  duration: string;
};

type DraftRecord = {
  date: string;
  train: string;
  from: string;
  to: string;
  seat: SeatType;
  fare: string;
  duration: string;
};

const storageKey = "personal-train-records";
const seatOptions: SeatType[] = ["二等座", "一等座", "商务座", "硬座", "硬卧", "软卧"];

const seedRecords: TravelRecord[] = [
  {
    id: "2022-03-18-G114",
    date: "2022-03-18",
    train: "G114",
    from: "上海虹桥",
    to: "北京南",
    seat: "二等座",
    fare: 553.5,
    duration: "4小时52分",
  },
  {
    id: "2022-09-04-D3221",
    date: "2022-09-04",
    train: "D3221",
    from: "杭州东",
    to: "福州南",
    seat: "一等座",
    fare: 336,
    duration: "4小时06分",
  },
  {
    id: "2023-01-27-G1372",
    date: "2023-01-27",
    train: "G1372",
    from: "成都东",
    to: "西安北",
    seat: "商务座",
    fare: 783,
    duration: "3小时10分",
  },
  {
    id: "2023-05-02-D3298",
    date: "2023-05-02",
    train: "D3298",
    from: "广州南",
    to: "深圳北",
    seat: "二等座",
    fare: 74.5,
    duration: "0小时37分",
  },
  {
    id: "2024-02-14-G318",
    date: "2024-02-14",
    train: "G318",
    from: "武汉",
    to: "上海虹桥",
    seat: "二等座",
    fare: 461,
    duration: "5小时28分",
  },
  {
    id: "2024-08-23-G219",
    date: "2024-08-23",
    train: "G219",
    from: "北京南",
    to: "青岛北",
    seat: "一等座",
    fare: 421,
    duration: "3小时56分",
  },
  {
    id: "2025-04-11-G1305",
    date: "2025-04-11",
    train: "G1305",
    from: "深圳北",
    to: "长沙南",
    seat: "二等座",
    fare: 318.5,
    duration: "2小时36分",
  },
  {
    id: "2025-11-02-G987",
    date: "2025-11-02",
    train: "G987",
    from: "南京南",
    to: "重庆西",
    seat: "商务座",
    fare: 1048,
    duration: "6小时45分",
  },
];

function App() {
  const [records, setRecords] = React.useState<TravelRecord[]>(loadRecords);
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

  React.useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(records));
  }, [records]);

  React.useEffect(() => {
    if (selectedYear !== "全部" && !years.includes(selectedYear)) {
      setSelectedYear("全部");
    }
  }, [selectedYear, years]);

  function updateDraft<K extends keyof DraftRecord>(key: K, value: DraftRecord[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function addRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextRecord: TravelRecord = {
      id: crypto.randomUUID(),
      date: draft.date,
      train: draft.train.trim().toUpperCase(),
      from: draft.from.trim(),
      to: draft.to.trim(),
      seat: draft.seat,
      fare: Number(draft.fare),
      duration: draft.duration.trim() || "未填写",
    };

    setRecords((current) => [...current, nextRecord]);
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

  function resetRecords() {
    setSelectedYear("全部");
    setRecords(seedRecords);
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

          <StatsGrid stats={stats} />
          <YearBars counts={yearlyCounts} years={years} />
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

          <RecordList
            records={filteredRecords}
            onDelete={(id) => setRecords((current) => current.filter((record) => record.id !== id))}
          />
        </section>

        <section className="panel ticket-panel">
          <div className="panel-head">
            <div>
              <p className="section-label">车票预览</p>
              <h2>逐条生成票面</h2>
            </div>
            <div className="chip">自动编号</div>
          </div>
          <TicketGrid records={filteredRecords} />
        </section>
      </main>
    </div>
  );
}

function StatsGrid({ stats }: { stats: ReturnType<typeof getStats> }) {
  const items = [
    { label: "当前筛选行程", value: String(stats.totalTrips), desc: "条乘车记录" },
    { label: "累计票价", value: fmtMoney(stats.totalFare), desc: "本页统计总额" },
    { label: "不同线路", value: String(stats.uniqueRoutes), desc: "条独立线路" },
    {
      label: "高频年份",
      value: stats.peakYear?.year ?? "-",
      desc: stats.peakYear ? `${stats.peakYear.count} 次记录` : "暂无数据",
    },
  ];

  return (
    <div className="stats-grid">
      {items.map((item) => (
        <article className="stat" key={item.label}>
          <div className="desc">{item.label}</div>
          <div className="value">{item.value}</div>
          <div className="desc">{item.desc}</div>
        </article>
      ))}
    </div>
  );
}

function YearBars({ counts, years }: { counts: Record<string, number>; years: string[] }) {
  const max = Math.max(1, ...Object.values(counts));

  return (
    <div className="chart-card">
      <div className="chart-head">
        <h3>年度分布</h3>
        <span>{years.length ? `${years[0]} - ${years[years.length - 1]}` : "暂无记录"}</span>
      </div>
      <div className="bars">
        {Object.entries(counts).map(([year, count]) => (
          <div className="bar-row" key={year}>
            <strong>{year}</strong>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${Math.max(10, (count / max) * 100)}%` }} />
            </div>
            <span>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecordList({ records, onDelete }: { records: TravelRecord[]; onDelete: (id: string) => void }) {
  return (
    <div className="record-list">
      {records.map((record) => (
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
            onClick={() => onDelete(record.id)}
          >
            ×
          </button>
        </article>
      ))}
    </div>
  );
}

function TicketGrid({ records }: { records: TravelRecord[] }) {
  return (
    <div className="ticket-grid">
      {records.map((record, index) => (
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

function getStats(records: TravelRecord[]) {
  const totalTrips = records.length;
  const totalFare = records.reduce((sum, record) => sum + record.fare, 0);
  const uniqueRoutes = new Set(records.map((record) => `${record.from}-${record.to}`)).size;
  const peakYearEntry = Object.entries(getYearlyCounts(records)).sort((a, b) => b[1] - a[1])[0];

  return {
    totalTrips,
    totalFare,
    uniqueRoutes,
    peakYear: peakYearEntry ? { year: peakYearEntry[0], count: peakYearEntry[1] } : null,
  };
}

function getYearlyCounts(records: TravelRecord[]) {
  return records.reduce<Record<string, number>>((acc, record) => {
    const year = record.date.slice(0, 4);
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {});
}

function loadRecords() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null") as unknown;
    if (!Array.isArray(saved) || saved.length === 0) return seedRecords;
    return saved.map((item, index) => normalizeRecord(item, index)).filter(Boolean) as TravelRecord[];
  } catch {
    return seedRecords;
  }
}

function normalizeRecord(item: unknown, index: number): TravelRecord | null {
  if (!item || typeof item !== "object") return null;
  const record = item as Partial<TravelRecord>;
  if (
    !record.date ||
    !record.train ||
    !record.from ||
    !record.to ||
    !record.seat ||
    typeof record.fare !== "number"
  ) {
    return null;
  }

  return {
    id: record.id || `${record.date}-${record.train}-${index}`,
    date: record.date,
    train: record.train,
    from: record.from,
    to: record.to,
    seat: seatOptions.includes(record.seat) ? record.seat : "二等座",
    fare: record.fare,
    duration: record.duration || "未填写",
  };
}

function fmtMoney(value: number) {
  return `¥${value.toFixed(1).replace(/\.0$/, "")}`;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
