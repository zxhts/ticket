"use client";

import React from "react";
import { Modal } from "antd";
import * as echarts from "echarts/core";
import type { EChartsCoreOption } from "echarts/core";
import { BarChart, LineChart, PieChart } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
  TransformComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { TravelRecord } from "@/src/backend/types/travel";
import { fmtMoney, getStats } from "@/src/frontend/utils/travel";

echarts.use([BarChart, LineChart, PieChart, GridComponent, LegendComponent, TooltipComponent, TransformComponent, CanvasRenderer]);

type Props = {
  records: TravelRecord[];
};

type ChartPoint = {
  label: string;
  value: number;
};

type ChartClickParams = {
  name?: string;
  seriesName?: string;
  dataIndex?: number;
};

type DetailState = {
  title: string;
  records: TravelRecord[];
} | null;

const chartColors = ["#38bdf8", "#2563eb", "#14b8a6", "#6366f1", "#0ea5e9", "#1d4ed8", "#0891b2"];
const axisStyle = {
  axisLine: { lineStyle: { color: "rgba(97,163,255,0.28)" } },
  axisLabel: { color: "#667085" },
  axisTick: { show: false },
};
const splitLineStyle = { lineStyle: { color: "rgba(97,163,255,0.16)", type: "dashed" } };

export default function StatisticsDashboard({ records }: Props) {
  const [selectedYear, setSelectedYear] = React.useState("全部");
  const [detailState, setDetailState] = React.useState<DetailState>(null);
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
  const yearlyFareTrend = React.useMemo(() => getYearlyFareTrend(yearlySeries), [yearlySeries]);
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
        <EChart
          option={getYearlyOption(yearlySeries)}
          onChartClick={(params) => {
            const year = String(params.name || "");
            openDetails(`${year} 年${params.seriesName || "出行"}明细`, sortedRecords.filter((record) => record.date.startsWith(year)));
          }}
        />
      </section>

      <section className="panel chart-panel dashboard-wide">
        <ChartHead title="年度票价趋势" desc="按单年合计" />
        <EChart
          option={getFareTrendOption(yearlyFareTrend)}
          onChartClick={(params) => {
            const year = String(params.name || "");
            openDetails(`${year} 年票价明细`, sortedRecords.filter((record) => record.date.startsWith(year)));
          }}
        />
      </section>

      <section className="panel chart-panel">
        <ChartHead title="席别占比" desc={`${filteredRecords.length} 条`} />
        <EChart
          option={getPieOption(seatDistribution, "席别")}
          compact
          onChartClick={(params) =>
            openDetails(`${params.name || "席别"}明细`, filteredRecords.filter((record) => record.seat === params.name))
          }
        />
      </section>

      <section className="panel chart-panel">
        <ChartHead title="车次类型占比" desc="G/D/C/Z/T/K/其他" />
        <EChart
          option={getPieOption(trainTypeDistribution, "车次类型")}
          compact
          onChartClick={(params) =>
            openDetails(`${params.name || "车次类型"}明细`, filteredRecords.filter((record) => getTrainType(record.train) === params.name))
          }
        />
      </section>

      <section className="panel chart-panel">
        <ChartHead title="热门到达车站" desc="Top 8" />
        <EChart
          option={getRankOption(arrivalStations, "#1f6feb")}
          compact
          onChartClick={(params) =>
            openDetails(`到达 ${params.name || "车站"} 明细`, filteredRecords.filter((record) => record.to === params.name))
          }
        />
      </section>

      <section className="panel chart-panel">
        <ChartHead title="热门到达城市" desc="Top 8" />
        <EChart
          option={getRankOption(cities, "#0f9d74")}
          compact
          onChartClick={(params) =>
            openDetails(`到达 ${params.name || "城市"} 明细`, filteredRecords.filter((record) => normalizeCity(record.to) === params.name))
          }
        />
      </section>

      <section className="panel chart-panel dashboard-wide">
        <ChartHead title="高频线路" desc="Top 8" />
        <EChart
          option={getRankOption(topRoutes, "#1f6feb", 120)}
          compact
          onChartClick={(params) =>
            openDetails(`${params.name || "线路"}明细`, filteredRecords.filter((record) => `${record.from} → ${record.to}` === params.name))
          }
        />
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

      <Modal
        title={detailState ? `${detailState.title}（${detailState.records.length} 条）` : "明细"}
        open={Boolean(detailState)}
        onCancel={() => setDetailState(null)}
        footer={null}
        width={820}
      >
        <div className="detail-list">
          {detailState?.records.map((record) => (
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
      </Modal>
    </div>
  );

  function openDetails(title: string, nextRecords: TravelRecord[]) {
    setDetailState({
      title,
      records: [...nextRecords].sort((a, b) => b.date.localeCompare(a.date)),
    });
  }
}

function EChart({
  option,
  compact = false,
  onChartClick,
}: {
  option: EChartsCoreOption;
  compact?: boolean;
  onChartClick?: (params: ChartClickParams) => void;
}) {
  const chartRef = React.useRef<HTMLDivElement | null>(null);
  const clickRef = React.useRef(onChartClick);

  clickRef.current = onChartClick;

  React.useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current);
    chart.setOption(option, true);
    chart.on("click", (params) => clickRef.current?.(params as ChartClickParams));

    const resize = () => chart.resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      chart.off("click");
      chart.dispose();
    };
  }, [option]);

  return <div className={`echart-box${compact ? " compact" : ""}`} ref={chartRef} />;
}

function ChartHead({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="chart-head">
      <h3>{title}</h3>
      <span>{desc}</span>
    </div>
  );
}

function getBaseTooltip() {
  return {
    trigger: "axis",
    backgroundColor: "rgba(6,18,42,0.94)",
    borderColor: "rgba(56,189,248,0.34)",
    borderWidth: 1,
    textStyle: { color: "#eef6ff" },
    extraCssText: "box-shadow:0 16px 36px rgba(0,32,82,0.28);border-radius:10px;backdrop-filter:blur(8px);",
  };
}

function getYearlyOption(series: ReturnType<typeof getYearlySeries>): EChartsCoreOption {
  return {
    backgroundColor: "rgba(5,18,45,0.03)",
    color: ["#2563eb", "#10b981"],
    tooltip: {
      ...getBaseTooltip(),
      valueFormatter: (value: number | string) => (typeof value === "number" && value > 100 ? fmtMoney(value) : `${value}`),
    },
    legend: {
      top: 0,
      icon: "circle",
      itemWidth: 10,
      itemHeight: 10,
      selectedMode: true,
      textStyle: { color: "#667085" },
    },
    grid: { top: 48, right: 18, bottom: 28, left: 48 },
    xAxis: { type: "category", data: series.map((item) => item.year), ...axisStyle },
    yAxis: { type: "value", ...axisStyle, splitLine: splitLineStyle },
    series: [
      {
        name: "出行次数",
        type: "bar",
        data: series.map((item) => item.count),
        barMaxWidth: 34,
        itemStyle: {
          borderRadius: [5, 5, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "#60a5fa" },
            { offset: 1, color: "#1d4ed8" },
          ]),
          shadowBlur: 10,
          shadowColor: "rgba(37,99,235,0.26)",
        },
        emphasis: { focus: "series" },
      },
      {
        name: "年度票价",
        type: "bar",
        data: series.map((item) => item.fare),
        barMaxWidth: 34,
        itemStyle: {
          borderRadius: [5, 5, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "#34d399" },
            { offset: 1, color: "#059669" },
          ]),
          shadowBlur: 10,
          shadowColor: "rgba(16,185,129,0.24)",
        },
        emphasis: { focus: "series" },
      },
    ],
  };
}

function getFareTrendOption(points: ChartPoint[]): EChartsCoreOption {
  return {
    color: ["#38bdf8"],
    tooltip: {
      ...getBaseTooltip(),
      valueFormatter: (value: number | string) => (typeof value === "number" ? fmtMoney(value) : `${value}`),
    },
    grid: { top: 24, right: 18, bottom: 28, left: 62 },
    xAxis: { type: "category", data: points.map((item) => item.label), ...axisStyle },
    yAxis: {
      type: "value",
      ...axisStyle,
      axisLabel: { formatter: (value: number) => `¥${value}` },
      splitLine: splitLineStyle,
    },
    series: [
      {
        name: "年度票价",
        type: "line",
        data: points.map((item) => item.value),
        smooth: true,
        symbolSize: 9,
        lineStyle: { width: 3, shadowBlur: 10, shadowColor: "rgba(56,189,248,0.32)" },
        itemStyle: { color: "#38bdf8", borderColor: "#ffffff", borderWidth: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(56,189,248,0.20)" },
            { offset: 1, color: "rgba(15,23,42,0.02)" },
          ]),
        },
        emphasis: { focus: "series" },
      },
    ],
  };
}

function getPieOption(points: ChartPoint[], name: string): EChartsCoreOption {
  return {
    color: chartColors,
    tooltip: {
      trigger: "item",
      formatter: "{b}<br />{a}: {c} ({d}%)",
      backgroundColor: "rgba(6,18,42,0.94)",
      borderColor: "rgba(56,189,248,0.34)",
      borderWidth: 1,
      textStyle: { color: "#eef6ff" },
      extraCssText: "box-shadow:0 16px 36px rgba(0,32,82,0.28);border-radius:10px;backdrop-filter:blur(8px);",
    },
    legend: {
      bottom: 0,
      type: "scroll",
      icon: "circle",
      itemWidth: 10,
      itemHeight: 10,
      selectedMode: true,
      textStyle: { color: "#667085" },
    },
    series: [
      {
        name,
        type: "pie",
        radius: ["28%", "68%"],
        center: ["50%", "44%"],
        data: points.map((item) => ({ name: item.label, value: item.value })),
        avoidLabelOverlap: true,
        itemStyle: {
          borderColor: "#ffffff",
          borderWidth: 1,
        },
        emphasis: { scale: true, scaleSize: 8 },
      },
    ],
  };
}

function getRankOption(points: ChartPoint[], color: string, labelWidth = 88): EChartsCoreOption {
  const ordered = [...points].reverse();

  return {
    color: [color],
    tooltip: getBaseTooltip(),
    grid: { top: 8, right: 24, bottom: 18, left: labelWidth },
    xAxis: { type: "value", ...axisStyle, splitLine: splitLineStyle },
    yAxis: {
      type: "category",
      data: ordered.map((item) => item.label),
      ...axisStyle,
      axisLabel: { overflow: "truncate", width: labelWidth - 12 },
    },
    series: [
      {
        name: "出行次数",
        type: "bar",
        data: ordered.map((item) => item.value),
        barMaxWidth: 18,
        itemStyle: {
          borderRadius: [0, 5, 5, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: `${color}66` },
            { offset: 1, color },
          ]),
          shadowBlur: 10,
          shadowColor: `${color}44`,
        },
        emphasis: { focus: "series" },
      },
    ],
  };
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

function getYearlyFareTrend(series: ReturnType<typeof getYearlySeries>): ChartPoint[] {
  return series.map((item) => ({ label: item.year, value: item.fare }));
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
