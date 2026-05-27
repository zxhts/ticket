"use client";

import React from "react";
import { Modal } from "antd";
import * as echarts from "echarts/core";
import type { EChartsCoreOption } from "echarts/core";
import { BarChart, EffectScatterChart, LineChart, MapChart, PieChart, ScatterChart } from "echarts/charts";
import {
  GeoComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  TransformComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { TravelRecord } from "@/src/backend/types/travel";
import { fmtMoney, getStats } from "@/src/frontend/utils/travel";

echarts.use([
  BarChart,
  EffectScatterChart,
  LineChart,
  MapChart,
  PieChart,
  ScatterChart,
  GeoComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  TransformComponent,
  CanvasRenderer,
]);

type Props = {
  records: TravelRecord[];
};

type ChartPoint = {
  label: string;
  value: number;
};

type SummaryPoint = ChartPoint & {
  records: TravelRecord[];
};

type CityPoint = {
  name: string;
  value: [number, number, number];
  records: TravelRecord[];
};

type CityArea = {
  name: string;
  adcode: string;
  records: TravelRecord[];
  value: number;
};

type RecentCityVisit = {
  city: string;
  date: string;
};

type ChartClickParams = {
  name?: string;
  seriesName?: string;
  dataIndex?: number;
  data?: {
    name?: string;
    value?: number;
    records?: TravelRecord[];
  };
};

type DetailState = {
  title: string;
  records: TravelRecord[];
  summary?: SummaryPoint[];
} | null;

const chartColors = ["#38bdf8", "#2563eb", "#14b8a6", "#6366f1", "#0ea5e9", "#1d4ed8", "#0891b2"];
const stationCityMap: Record<string, string> = {
  北京: "北京",
  北京北: "北京",
  北京朝阳: "北京",
  北京东: "北京",
  北京丰台: "北京",
  北京南: "北京",
  北京通州: "北京",
  北京西: "北京",
  清河: "北京",
  大兴机场: "北京",
  通州西: "北京",
  燕郊: "廊坊",
  天津: "天津",
  天津南: "天津",
  天津西: "天津",
  塘沽: "天津",
  武清: "天津",
  秦皇岛: "秦皇岛",
  北戴河: "秦皇岛",
  承德: "承德",
  承德南: "承德",
  石家庄: "石家庄",
  正定机场: "石家庄",
  保定东: "保定",
  高碑店东: "保定",
  下花园北: "张家口",
  张家口: "张家口",
  西安: "西安",
  临潼: "西安",
  郑州东: "郑州",
  商丘: "商丘",
  永城北: "商丘",
  亳州南: "亳州",
  徐州东: "徐州",
  南京南: "南京",
  杭州东: "杭州",
  上海虹桥: "上海",
  成都东: "成都",
  犀浦: "成都",
  离堆公园: "成都",
  绵阳: "绵阳",
  重庆北: "重庆",
  沙坪坝: "重庆",
  奉节: "重庆",
  哈尔滨: "哈尔滨",
  哈尔滨西: "哈尔滨",
  呼和浩特东: "呼和浩特",
  昆明: "昆明",
  大理: "大理",
  青岛: "青岛",
  泰安: "泰安",
  菏泽: "菏泽",
  长沙南: "长沙",
};
const axisStyle = {
  axisLine: { lineStyle: { color: "rgba(97,163,255,0.28)" } },
  axisLabel: { color: "#667085" },
  axisTick: { show: false },
};
const splitLineStyle = { lineStyle: { color: "rgba(97,163,255,0.16)", type: "dashed" } };
const cityCoordinates: Record<string, [number, number]> = {
  北京: [116.4074, 39.9042],
  天津: [117.2000, 39.1333],
  上海: [121.4737, 31.2304],
  南京: [118.7969, 32.0603],
  杭州: [120.1551, 30.2741],
  成都: [104.0665, 30.5728],
  重庆: [106.5516, 29.5630],
  西安: [108.9398, 34.3416],
  郑州: [113.6254, 34.7466],
  廊坊: [116.6838, 39.5383],
  张家口: [114.8841, 40.8119],
  石家庄: [114.5149, 38.0428],
  保定: [115.4646, 38.8744],
  秦皇岛: [119.6005, 39.9354],
  承德: [117.9392, 40.9739],
  商丘: [115.6564, 34.4142],
  徐州: [117.2841, 34.2058],
  哈尔滨: [126.6424, 45.7560],
  呼和浩特: [111.7492, 40.8426],
  昆明: [102.8332, 24.8797],
  大理: [100.2676, 25.6065],
  青岛: [120.3826, 36.0671],
  泰安: [117.0876, 36.2009],
  菏泽: [115.4807, 35.2336],
  长沙: [112.9388, 28.2282],
  绵阳: [104.6796, 31.4675],
};
const cityAreaCodeMap: Record<string, { code: string; name: string; province: string }> = {
  北京: { code: "110000", name: "北京市", province: "北京" },
  天津: { code: "120000", name: "天津市", province: "天津" },
  石家庄: { code: "130100", name: "石家庄市", province: "河北" },
  唐山: { code: "130200", name: "唐山市", province: "河北" },
  秦皇岛: { code: "130300", name: "秦皇岛市", province: "河北" },
  保定: { code: "130600", name: "保定市", province: "河北" },
  廊坊: { code: "131000", name: "廊坊市", province: "河北" },
  张家口: { code: "130700", name: "张家口市", province: "河北" },
  承德: { code: "130800", name: "承德市", province: "河北" },
  上海: { code: "310000", name: "上海市", province: "上海" },
  南京: { code: "320100", name: "南京市", province: "江苏" },
  徐州: { code: "320300", name: "徐州市", province: "江苏" },
  杭州: { code: "330100", name: "杭州市", province: "浙江" },
  青岛: { code: "370200", name: "青岛市", province: "山东" },
  泰安: { code: "370900", name: "泰安市", province: "山东" },
  菏泽: { code: "371700", name: "菏泽市", province: "山东" },
  济南: { code: "370100", name: "济南市", province: "山东" },
  郑州: { code: "410100", name: "郑州市", province: "河南" },
  商丘: { code: "411400", name: "商丘市", province: "河南" },
  成都: { code: "510100", name: "成都市", province: "四川" },
  绵阳: { code: "510700", name: "绵阳市", province: "四川" },
  重庆: { code: "500000", name: "重庆市", province: "重庆" },
  昆明: { code: "530100", name: "昆明市", province: "云南" },
  大理: { code: "532900", name: "大理白族自治州", province: "云南" },
  西安: { code: "610100", name: "西安市", province: "陕西" },
  哈尔滨: { code: "230100", name: "哈尔滨市", province: "黑龙江" },
  呼和浩特: { code: "150100", name: "呼和浩特市", province: "内蒙古" },
  长沙: { code: "430100", name: "长沙市", province: "湖南" },
  亳州: { code: "341600", name: "亳州市", province: "安徽" },
};

export default function StatisticsDashboard({ records }: Props) {
  const [selectedYear, setSelectedYear] = React.useState("全部");
  const [detailStack, setDetailStack] = React.useState<DetailState[]>([]);
  const detailScrollRef = React.useRef<number[]>([]);
  const detailBodyRef = React.useRef<HTMLDivElement | null>(null);
  const [mapReady, setMapReady] = React.useState(false);
  const sortedRecords = React.useMemo(
    () => [...records].sort((a, b) => b.date.localeCompare(a.date)),
    [records],
  );
  const detailState = detailStack[detailStack.length - 1] ?? null;
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
  const trainNumbers = React.useMemo(() => getCountSeries(filteredRecords, (record) => record.train).slice(0, 10), [filteredRecords]);
  const arrivalStations = React.useMemo(() => getCountSeries(filteredRecords, (record) => record.to).slice(0, 10), [filteredRecords]);
  const departureStations = React.useMemo(() => getCountSeries(filteredRecords, (record) => record.from).slice(0, 10), [filteredRecords]);
  const cities = React.useMemo(
    () => getCountSeries(filteredRecords, (record) => normalizeCity(record.to)).slice(0, 10),
    [filteredRecords],
  );
  const departureCities = React.useMemo(
    () => getCountSeries(filteredRecords, (record) => normalizeCity(record.from)).slice(0, 10),
    [filteredRecords],
  );
  const topRoutes = React.useMemo(
    () => getCountSeries(filteredRecords, (record) => `${record.from} → ${record.to}`).slice(0, 10),
    [filteredRecords],
  );
  const topFareRecords = React.useMemo(
    () => [...filteredRecords].sort((a, b) => b.fare - a.fare).slice(0, 10),
    [filteredRecords],
  );
  const topFareChartRecords = React.useMemo(() => [...topFareRecords].reverse(), [topFareRecords]);
  const lowFareRecords = React.useMemo(
    () => [...filteredRecords].sort((a, b) => a.fare - b.fare).slice(0, 10),
    [filteredRecords],
  );
  const lowFareChartRecords = React.useMemo(() => [...lowFareRecords].reverse(), [lowFareRecords]);
  const yearlyCountOption = React.useMemo(() => getYearlyCountOption(yearlySeries), [yearlySeries]);
  const yearlyFareBarOption = React.useMemo(() => getYearlyFareBarOption(yearlySeries), [yearlySeries]);
  const fareTrendOption = React.useMemo(() => getFareTrendOption(yearlyFareTrend), [yearlyFareTrend]);
  const seatOption = React.useMemo(() => getPieOption(seatDistribution, "席别"), [seatDistribution]);
  const trainTypeOption = React.useMemo(() => getPieOption(trainTypeDistribution, "车次类型"), [trainTypeDistribution]);
  const trainNumberOption = React.useMemo(() => getRankOption(trainNumbers, "#2563eb"), [trainNumbers]);
  const arrivalStationOption = React.useMemo(() => getRankOption(arrivalStations, "#1f6feb"), [arrivalStations]);
  const departureStationOption = React.useMemo(() => getRankOption(departureStations, "#0ea5e9"), [departureStations]);
  const cityOption = React.useMemo(() => getRankOption(cities, "#0f9d74"), [cities]);
  const departureCityOption = React.useMemo(() => getRankOption(departureCities, "#14b8a6"), [departureCities]);
  const routeOption = React.useMemo(() => getRankOption(topRoutes, "#1f6feb", 120), [topRoutes]);
  const topFareOption = React.useMemo(() => getTopFareOption(topFareChartRecords), [topFareChartRecords]);
  const lowFareOption = React.useMemo(() => getTopFareOption(lowFareChartRecords), [lowFareChartRecords]);
  const visitedCitySummary = React.useMemo(() => getVisitedCitySummary(filteredRecords), [filteredRecords]);
  const cityAreas = React.useMemo(() => getVisitedCityAreas(visitedCitySummary), [visitedCitySummary]);
  const mapOption = React.useMemo(() => getTravelMapOption(cityAreas), [cityAreas]);
  const mapStats = React.useMemo(() => getTravelMapStats(filteredRecords), [filteredRecords]);

  React.useEffect(() => {
    let active = true;
    const provinceCodes = Array.from(
      new Set(cityAreas.map((item) => getProvinceBoundaryCode(item.adcode))),
    );
    setMapReady(false);

    Promise.all(
      [
        fetch("/maps/china-mainland.json").then((response) => {
          if (!response.ok) throw new Error("Failed to load china map");
          return response.json();
        }),
        fetch("/maps/south-china-sea.json").then((response) => {
          if (!response.ok) throw new Error("Failed to load south china sea map");
          return response.json();
        }),
        ...provinceCodes.map((code) =>
          fetch(`/maps/admin/${code}_full.json`).then((response) => {
            if (!response.ok) throw new Error(`Failed to load province map ${code}`);
            return response.json();
          }),
        ),
      ],
    )
      .then(([chinaGeoJson, southChinaSeaGeoJson, ...provinceMaps]) => {
        const provinceFeatureMap = new Map<string, Record<string, unknown>>();
        provinceMaps.forEach((geoJson, index) => {
          provinceFeatureMap.set(provinceCodes[index], geoJson as Record<string, unknown>);
        });

        const featureCollection = buildTravelCityFeatureCollection(
          cityAreas,
          provinceFeatureMap,
          chinaGeoJson as Record<string, unknown>,
        );
        echarts.registerMap("travel-mainland-city-map", featureCollection as never);
        echarts.registerMap("south-china-sea-inset-map", southChinaSeaGeoJson as never);
        if (active) setMapReady(true);
      })
      .catch(() => {
        if (active) setMapReady(false);
      });

    return () => {
      active = false;
    };
  }, [cityAreas]);

  React.useLayoutEffect(() => {
    if (!detailState || !detailBodyRef.current) return;
    detailBodyRef.current.scrollTop = detailScrollRef.current[detailStack.length - 1] ?? 0;
  }, [detailState, detailStack.length]);

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
          <StatCard
            label="当前筛选行程"
            value={String(stats.totalTrips)}
            desc="条乘车记录"
            onClick={() => openDetails("当前筛选行程明细", filteredRecords)}
          />
          <StatCard
            label="累计票价"
            value={fmtMoney(stats.totalFare)}
            desc="筛选范围总额"
            onClick={() => openDetails("累计票价明细", filteredRecords)}
          />
          <StatCard
            label="不同线路"
            value={String(stats.uniqueRoutes)}
            desc="条独立线路"
            onClick={() => openSummary("不同线路统计", getGroupedSummary(filteredRecords, (record) => `${record.from} → ${record.to}`))}
          />
          <StatCard
            label="到达城市"
            value={String(new Set(filteredRecords.map((record) => normalizeCity(record.to))).size)}
            desc="个城市维度"
            onClick={() => openSummary("到达城市统计", getGroupedSummary(filteredRecords, (record) => normalizeCity(record.to)))}
          />
          <StatCard
            label="出发城市"
            value={String(new Set(filteredRecords.map((record) => normalizeCity(record.from))).size)}
            desc="个城市维度"
            onClick={() => openSummary("出发城市统计", getGroupedSummary(filteredRecords, (record) => normalizeCity(record.from)))}
          />
          <StatCard
            label="出发车站"
            value={String(new Set(filteredRecords.map((record) => record.from)).size)}
            desc="个车站"
            onClick={() => openSummary("出发车站统计", getGroupedSummary(filteredRecords, (record) => record.from))}
          />
          <StatCard
            label="到达车站"
            value={String(new Set(filteredRecords.map((record) => record.to)).size)}
            desc="个车站"
            onClick={() => openSummary("到达车站统计", getGroupedSummary(filteredRecords, (record) => record.to))}
          />
          <StatCard
            label="乘坐车次"
            value={String(new Set(filteredRecords.map((record) => record.train)).size)}
            desc="个不同车次"
            onClick={() => openSummary("乘坐车次统计", getGroupedSummary(filteredRecords, (record) => record.train))}
          />
        </div>
      </section>

      <section className="panel chart-panel">
        <ChartHead title="年度出行次数" desc={years.length ? `${years[0]} - ${years[years.length - 1]}` : "暂无记录"} />
        <EChart
          option={yearlyCountOption}
          onChartClick={(params) => {
            const year = String(params.name || "");
            openDetails(`${year} 年出行明细`, sortedRecords.filter((record) => record.date.startsWith(year)));
          }}
        />
      </section>

      <section className="panel chart-panel">
        <ChartHead title="年度票价柱状图" desc="按单年合计" />
        <EChart
          option={yearlyFareBarOption}
          onChartClick={(params) => {
            const year = String(params.name || "");
            openDetails(`${year} 年票价明细`, sortedRecords.filter((record) => record.date.startsWith(year)));
          }}
        />
      </section>

      <section className="panel chart-panel">
        <ChartHead title="年度票价趋势" desc="按单年合计" />
        <EChart
          option={fareTrendOption}
          onChartClick={(params) => {
            const year = String(params.name || "");
            openDetails(`${year} 年票价明细`, sortedRecords.filter((record) => record.date.startsWith(year)));
          }}
        />
      </section>

      <section className="panel chart-panel">
        <ChartHead title="席别占比" desc={`${filteredRecords.length} 条`} />
        <EChart
          option={seatOption}
          compact
          onChartClick={(params) =>
            openDetails(`${params.name || "席别"}明细`, filteredRecords.filter((record) => record.seat === params.name))
          }
        />
      </section>

      <section className="panel chart-panel dashboard-wide travel-map-panel">
        <ChartHead title="到过的城市地图" desc="高亮显示" />
        <div className="travel-map-stage">
          {mapReady ? (
            <EChart
              option={mapOption}
            mapChart
            onChartClick={(params) => {
              const city = String(params.name || "");
              const pointRecords = params.data?.records;
              if (!pointRecords?.length) return;
              openDetails(`城市 ${city} 明细`, pointRecords);
            }}
          />
          ) : (
            <div className="map-loading">地图加载中...</div>
          )}

          <div className="travel-map-badge">城市模式</div>

          <div className="travel-map-summary">
            <p className="travel-map-caption">已点亮中国</p>
            <div className="travel-map-value">
              {mapStats.cityCount}
              <span>个城市</span>
            </div>
            <div className="travel-map-meta">
              <span>{filteredRecords.length} 条行程</span>
              <span>{selectedYear === "全部" ? "全部年份" : `${selectedYear} 年`}</span>
            </div>
            <div className="travel-map-recent">
              {mapStats.recentCities.map((item) => (
                <div className="travel-map-recent-item" key={`${item.city}-${item.date}`}>
                  <strong>{item.city}</strong>
                  <span>{item.date.replaceAll("-", ".")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {mapReady ? <EChart option={getSouthChinaSeaOption()} miniMap /> : null}
      </section>

      <section className="panel chart-panel">
        <ChartHead title="车次类型占比" desc="G/D/C/Z/T/K/其他" />
        <EChart
          option={trainTypeOption}
          compact
          onChartClick={(params) =>
            openDetails(`${params.name || "车次类型"}明细`, filteredRecords.filter((record) => getTrainType(record.train) === params.name))
          }
        />
      </section>

      <section className="panel chart-panel">
        <ChartHead title="单趟车次乘坐" desc="Top 10" />
        <EChart
          option={trainNumberOption}
          compact
          onChartClick={(params) =>
            openDetails(`${params.name || "车次"} 明细`, filteredRecords.filter((record) => record.train === params.name))
          }
        />
      </section>

      <section className="panel chart-panel">
        <ChartHead title="热门到达车站" desc="Top 10" />
        <EChart
          option={arrivalStationOption}
          compact
          onChartClick={(params) =>
            openDetails(`到达 ${params.name || "车站"} 明细`, filteredRecords.filter((record) => record.to === params.name))
          }
        />
      </section>

      <section className="panel chart-panel">
        <ChartHead title="热门出发车站" desc="Top 10" />
        <EChart
          option={departureStationOption}
          compact
          onChartClick={(params) =>
            openDetails(`出发 ${params.name || "车站"} 明细`, filteredRecords.filter((record) => record.from === params.name))
          }
        />
      </section>

      <section className="panel chart-panel">
        <ChartHead title="热门到达城市" desc="Top 10" />
        <EChart
          option={cityOption}
          compact
          onChartClick={(params) =>
            openDetails(`到达 ${params.name || "城市"} 明细`, filteredRecords.filter((record) => normalizeCity(record.to) === params.name))
          }
        />
      </section>

      <section className="panel chart-panel">
        <ChartHead title="热门出发城市" desc="Top 10" />
        <EChart
          option={departureCityOption}
          compact
          onChartClick={(params) =>
            openDetails(`出发 ${params.name || "城市"} 明细`, filteredRecords.filter((record) => normalizeCity(record.from) === params.name))
          }
        />
      </section>

      <section className="panel chart-panel">
        <ChartHead title="高频线路" desc="Top 10" />
        <EChart
          option={routeOption}
          compact
          onChartClick={(params) =>
            openDetails(`${params.name || "线路"}明细`, filteredRecords.filter((record) => `${record.from} → ${record.to}` === params.name))
          }
        />
      </section>

      <section className="panel chart-panel">
        <ChartHead title="单次最贵票价" desc="Top 10" />
        <EChart
          option={topFareOption}
          compact
          onChartClick={(params) => {
            const record = topFareChartRecords[params.dataIndex ?? -1];
            if (record) openDetails(`${record.train} ${record.from} → ${record.to}`, [record]);
          }}
        />
      </section>

      <section className="panel chart-panel">
        <ChartHead title="单次最低票价" desc="Top 10" />
        <EChart
          option={lowFareOption}
          compact
          onChartClick={(params) => {
            const record = lowFareChartRecords[params.dataIndex ?? -1];
            if (record) openDetails(`${record.train} ${record.from} → ${record.to}`, [record]);
          }}
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
          {filteredRecords.map((record, index) => (
            <article className="record" key={`${record.id}-${index}`}>
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
        title={
          detailState ? (
            <div className="modal-head">
              {detailStack.length > 1 ? (
                <button className="modal-back" type="button" onClick={goBack}>
                  返回上一级
                </button>
              ) : null}
              <span>{detailState.title}（{(detailState.summary || detailState.records).length} 条）</span>
            </div>
          ) : "明细"
        }
        open={Boolean(detailState)}
        onCancel={() => {
          detailScrollRef.current = [];
          setDetailStack([]);
        }}
        footer={null}
        width={820}
      >
        {detailState?.summary ? (
          <div className="summary-list" ref={detailBodyRef}>
            {detailState.summary.map((item) => (
              <article className="summary-row" key={item.label}>
                <strong>{item.label}</strong>
                <button
                  className="summary-count"
                  type="button"
                  onClick={() => openDetails(`${item.label} 明细`, item.records)}
                >
                  {item.value} 次
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="detail-list" ref={detailBodyRef}>
            {detailState?.records.map((record, index) => (
              <article className="record" key={`${record.id}-${index}`}>
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
        )}
      </Modal>
    </div>
  );

  function openDetails(title: string, nextRecords: TravelRecord[]) {
    const nextState = {
      title,
      records: [...nextRecords].sort((a, b) => b.date.localeCompare(a.date)),
    };

    setDetailStack((current) => {
      if (current.length) {
        detailScrollRef.current[current.length - 1] = detailBodyRef.current?.scrollTop ?? 0;
      }

      if (current.length && current[current.length - 1]?.summary) {
        detailScrollRef.current[current.length] = 0;
        return [...current, nextState];
      }

      detailScrollRef.current = [0];
      return [nextState];
    });
  }

  function openSummary(title: string, summary: SummaryPoint[]) {
    detailScrollRef.current = [0];
    setDetailStack([{
      title,
      records: [],
      summary,
    }]);
  }

  function goBack() {
    setDetailStack((current) => {
      if (current.length) {
        detailScrollRef.current[current.length - 1] = detailBodyRef.current?.scrollTop ?? 0;
      }
      return current.slice(0, -1);
    });
  }
}

function EChart({
  option,
  compact = false,
  mapChart = false,
  miniMap = false,
  onChartClick,
}: {
  option: EChartsCoreOption;
  compact?: boolean;
  mapChart?: boolean;
  miniMap?: boolean;
  onChartClick?: (params: ChartClickParams) => void;
}) {
  const chartRef = React.useRef<HTMLDivElement | null>(null);
  const instanceRef = React.useRef<echarts.ECharts | null>(null);
  const clickRef = React.useRef(onChartClick);

  clickRef.current = onChartClick;

  React.useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current);
    instanceRef.current = chart;
    chart.on("click", (params) => clickRef.current?.(params as ChartClickParams));

    const resize = () => chart.resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      chart.off("click");
      chart.dispose();
      instanceRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    instanceRef.current?.setOption(option, true);
  }, [option]);

  return <div className={`echart-box${compact ? " compact" : ""}${mapChart ? " map" : ""}${miniMap ? " mini-map" : ""}`} ref={chartRef} />;
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

function getYearlyCountOption(series: ReturnType<typeof getYearlySeries>): EChartsCoreOption {
  return {
    backgroundColor: "rgba(5,18,45,0.03)",
    color: ["#2563eb"],
    tooltip: {
      ...getBaseTooltip(),
      valueFormatter: (value: number | string) => `${value} 次`,
    },
    grid: { top: 24, right: 18, bottom: 28, left: 48 },
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
    ],
  };
}

function getYearlyFareBarOption(series: ReturnType<typeof getYearlySeries>): EChartsCoreOption {
  return {
    backgroundColor: "rgba(5,18,45,0.03)",
    color: ["#10b981"],
    tooltip: {
      ...getBaseTooltip(),
      valueFormatter: (value: number | string) => (typeof value === "number" ? fmtMoney(value) : `${value}`),
    },
    grid: { top: 24, right: 18, bottom: 28, left: 62 },
    xAxis: { type: "category", data: series.map((item) => item.year), ...axisStyle },
    yAxis: {
      type: "value",
      ...axisStyle,
      axisLabel: { formatter: (value: number) => `¥${value}` },
      splitLine: splitLineStyle,
    },
    series: [
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

function getTopFareOption(records: TravelRecord[]): EChartsCoreOption {
  return {
    color: ["#0ea5e9"],
    tooltip: {
      ...getBaseTooltip(),
      valueFormatter: (value: number | string) => (typeof value === "number" ? fmtMoney(value) : `${value}`),
    },
    grid: { top: 8, right: 28, bottom: 18, left: 138 },
    xAxis: {
      type: "value",
      ...axisStyle,
      axisLabel: { formatter: (value: number) => `¥${value}` },
      splitLine: splitLineStyle,
    },
    yAxis: {
      type: "category",
      data: records.map((record) => `${record.train} ${record.from}→${record.to}`),
      ...axisStyle,
      axisLabel: { overflow: "truncate", width: 126 },
    },
    series: [
      {
        name: "票价",
        type: "bar",
        data: records.map((record) => record.fare),
        barMaxWidth: 18,
        itemStyle: {
          borderRadius: [0, 5, 5, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: "rgba(14,165,233,0.35)" },
            { offset: 1, color: "#0ea5e9" },
          ]),
          shadowBlur: 10,
          shadowColor: "rgba(14,165,233,0.25)",
        },
        emphasis: { focus: "series" },
      },
    ],
  };
}

function getTravelMapOption(cityAreas: CityArea[]): EChartsCoreOption {
  return {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(6,18,42,0.94)",
      borderColor: "rgba(56,189,248,0.34)",
      borderWidth: 1,
      textStyle: { color: "#eef6ff" },
      formatter: (params: { name?: string; data?: { records?: TravelRecord[]; value?: number } }) => {
        if (!params.data?.records?.length) return "";
        return `${params.name || ""}<br/>到达/出发记录：${params.data.value || params.data.records.length}`;
      },
    },
    series: [
      {
        name: "到过的城市",
        type: "map",
        map: "travel-mainland-city-map",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        layoutCenter: ["55%", "52%"],
        layoutSize: "94%",
        roam: true,
        selectedMode: false,
        nameProperty: "name",
        data: cityAreas.map((item) => ({
          name: item.name,
          value: item.value,
          records: item.records,
          itemStyle: {
            areaColor: "rgba(56, 189, 248, 0.58)",
            borderColor: "rgba(14, 165, 233, 0.95)",
            borderWidth: 1.2,
            shadowBlur: 18,
            shadowColor: "rgba(14, 165, 233, 0.28)",
          },
          label: {
            show: true,
            color: "#0f172a",
            fontSize: 12,
            fontWeight: 600,
            textBorderColor: "rgba(255, 255, 255, 0.88)",
            textBorderWidth: 3,
          },
          emphasis: {
            itemStyle: {
              areaColor: "rgba(14, 165, 233, 0.72)",
              borderColor: "#0284c7",
              borderWidth: 1.4,
            },
            label: {
              show: true,
              color: "#0f172a",
              fontSize: 12,
              fontWeight: 600,
              textBorderColor: "rgba(255, 255, 255, 0.9)",
              textBorderWidth: 3,
            },
          },
        })),
        label: {
          show: true,
          color: "rgba(71, 85, 105, 0.58)",
          fontSize: 11,
        },
        itemStyle: {
          areaColor: "#eaf2fb",
          borderColor: "rgba(96, 165, 250, 0.48)",
          borderWidth: 1.05,
          shadowColor: "rgba(15, 23, 42, 0.08)",
          shadowBlur: 10,
        },
        emphasis: {
          disabled: true,
          itemStyle: {
            areaColor: "#eaf2fb",
          },
        },
        zlevel: 3,
      },
    ],
  };
}

function getSouthChinaSeaOption(): EChartsCoreOption {
  return {
    backgroundColor: "transparent",
    series: [
      {
        type: "map",
        map: "south-china-sea-inset-map",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        roam: false,
        silent: true,
        label: { show: false },
        itemStyle: {
          areaColor: "rgba(234, 242, 251, 0.65)",
          borderColor: "rgba(96, 165, 250, 0.60)",
          borderWidth: 1.1,
        },
      },
    ],
  };
}

function getTravelMapStats(records: TravelRecord[]) {
  const visitedCities = getVisitedCitySummary(records);
  const seen = new Set<string>();
  const recentCities: RecentCityVisit[] = [];

  for (const record of records) {
    for (const city of [normalizeCity(record.to), normalizeCity(record.from)]) {
      if (seen.has(city)) continue;
      seen.add(city);
      recentCities.push({ city, date: record.date });
      if (recentCities.length >= 4) break;
    }

    if (recentCities.length >= 4) break;
  }

  return {
    cityCount: visitedCities.length,
    recentCities,
  };
}

function getVisitedCityAreas(summary: SummaryPoint[]): CityArea[] {
  return summary
    .map((item) => {
      const meta = cityAreaCodeMap[item.label];
      if (!meta) return null;
      return {
        name: item.label,
        adcode: meta.code,
        value: item.value,
        records: item.records,
      };
    })
    .filter(Boolean) as CityArea[];
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

function getGroupedSummary(records: TravelRecord[], getKey: (record: TravelRecord) => string): SummaryPoint[] {
  const groups = records.reduce<Record<string, TravelRecord[]>>((acc, record) => {
    const key = getKey(record) || "未填写";
    acc[key] = acc[key] || [];
    acc[key].push(record);
    return acc;
  }, {});

  return Object.entries(groups)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([label, groupRecords]) => ({
      label,
      value: groupRecords.length,
      records: groupRecords,
    }));
}

function getVisitedCitySummary(records: TravelRecord[]): SummaryPoint[] {
  const groups = records.reduce<Record<string, Map<string, TravelRecord>>>((acc, record) => {
    for (const city of [normalizeCity(record.from), normalizeCity(record.to)]) {
      acc[city] = acc[city] || new Map<string, TravelRecord>();
      acc[city].set(record.id, record);
    }
    return acc;
  }, {});

  return Object.entries(groups)
    .map(([label, groupRecords]) => ({
      label,
      records: Array.from(groupRecords.values()),
    }))
    .map((item) => ({
      ...item,
      value: item.records.length,
    }))
    .sort((a, b) => b.value - a.value);
}

function getProvinceBoundaryCode(adcode: string) {
  return `${adcode.slice(0, 2)}0000`;
}

function buildTravelCityFeatureCollection(
  cityAreas: CityArea[],
  provinceFeatureMap: Map<string, Record<string, unknown>>,
  chinaGeoJson: Record<string, unknown> | null,
) {
  const chinaFeatures = ((chinaGeoJson as { features?: Array<Record<string, unknown>> } | null)?.features || [])
    .filter((feature) => {
      const props = feature.properties as { name?: string } | undefined;
      return Boolean(String(props?.name || "").trim());
    });

  const cityFeatures = cityAreas.flatMap((cityArea) => {
    const provinceCode = getProvinceBoundaryCode(cityArea.adcode);
    if (cityArea.adcode.endsWith("0000")) {
      const provinceFeature = chinaFeatures.find((feature) => {
        const props = feature.properties as { name?: string } | undefined;
        return normalizeProvinceName(String(props?.name || "")) === cityArea.name;
      });

      if (!provinceFeature) return [];

      return [
        {
          ...provinceFeature,
          geometry: clipMainlandGeometry(provinceFeature.geometry),
          properties: {
            ...(provinceFeature.properties as Record<string, unknown>),
            name: cityArea.name,
          },
        },
      ];
    }

    const provinceGeo = provinceFeatureMap.get(provinceCode);
    const provinceFeatures = (provinceGeo as { features?: Array<Record<string, unknown>> } | undefined)?.features || [];
    const targetFeature = provinceFeatures.find((feature) => {
      const props = feature.properties as { adcode?: number } | undefined;
      return String(props?.adcode || "") === cityArea.adcode;
    });

    if (!targetFeature) return [];

    return [
      {
        ...targetFeature,
        geometry: clipMainlandGeometry(targetFeature.geometry),
        properties: {
          ...(targetFeature.properties as Record<string, unknown>),
          name: cityArea.name,
        },
      },
    ];
  });

  return {
    type: "FeatureCollection",
    features: [...chinaFeatures, ...cityFeatures],
  };
}

function clipMainlandGeometry(geometry: unknown) {
  const typedGeometry = geometry as
    | { type?: string; coordinates?: unknown[] }
    | undefined;
  if (!typedGeometry?.coordinates) return geometry;

  if (typedGeometry.type === "Polygon") {
    const coordinates = (typedGeometry.coordinates as number[][][])
      .filter((ring) => getMaxLatitude(ring) >= 17.5);
    return coordinates.length ? { ...typedGeometry, coordinates } : typedGeometry;
  }

  if (typedGeometry.type === "MultiPolygon") {
    const coordinates = (typedGeometry.coordinates as number[][][][])
      .filter((polygon) => Math.max(...polygon.map(getMaxLatitude)) >= 17.5);
    return coordinates.length ? { ...typedGeometry, coordinates } : typedGeometry;
  }

  return geometry;
}

function getMaxLatitude(ring: number[][]) {
  return ring.reduce((max, point) => Math.max(max, point[1] ?? -Infinity), -Infinity);
}

function normalizeProvinceName(name: string) {
  return name.replace(/(省|市|壮族自治区|回族自治区|维吾尔自治区|自治区|特别行政区)$/g, "");
}

function getTrainType(train: string) {
  const prefix = train.match(/^[A-Z]/i)?.[0]?.toUpperCase();
  if (!prefix) return "普速数字";
  if (["G", "D", "C", "Z", "T", "K"].includes(prefix)) return `${prefix} 字头`;
  return "其他";
}

function normalizeCity(station: string) {
  if (stationCityMap[station]) return stationCityMap[station];
  return station
    .replace(/(东|西|南|北|朝阳|丰台|通州|清河|机场|北站|南站|东站|西站)$/g, "")
    .replace(/站$/g, "") || station;
}

function getRecordMeta(record: TravelRecord) {
  return [record.date, record.train, record.seat, record.seatNo, record.remark].filter(Boolean).join(" · ");
}

function StatCard({
  label,
  value,
  desc,
  onClick,
}: {
  label: string;
  value: string;
  desc: string;
  onClick?: () => void;
}) {
  return (
    <article
      className={`stat${onClick ? " clickable" : ""}`}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <div className="desc">{label}</div>
      <div className="value">{value}</div>
      <div className="desc">{desc}</div>
    </article>
  );
}
