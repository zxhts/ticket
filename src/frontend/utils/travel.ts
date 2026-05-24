import type { ImportParseResult, SeatType, TravelRecord } from "@/src/backend/types/travel";

export const seatOptions: SeatType[] = [
  "二等座",
  "一等座",
  "商务座",
  "硬座",
  "硬卧",
  "软卧",
  "动卧",
  "硬卧代硬座",
];

export function fmtMoney(value: number) {
  return `¥${value.toFixed(1)}`;
}

export function getStats(records: TravelRecord[]) {
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

export function getYearlyCounts(records: TravelRecord[]) {
  return records.reduce<Record<string, number>>((acc, record) => {
    const year = record.date.slice(0, 4);
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {});
}

export function parseImportedRecords(text: string): ImportParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^\|?\s*:?-{3,}/.test(line));
  const firstCells = splitImportLine(lines[0] || "");
  const headerMap = getHeaderMap(firstCells);
  const dataLines = headerMap ? lines.slice(1) : lines;
  const records: TravelRecord[] = [];
  let skipped = 0;

  dataLines.forEach((line, index) => {
    const parsed = parseImportCells(splitImportLine(line), headerMap, index);
    if (parsed) {
      records.push(parsed);
    } else {
      skipped += 1;
    }
  });

  return { records, added: records.length, skipped };
}

export function normalizeRecord(item: unknown, index: number): TravelRecord | null {
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
    seat: normalizeSeat(record.seat),
    seatNo: record.seatNo || "",
    fare: Number(record.fare.toFixed(1)),
    remark: record.remark || "",
  };
}

function splitImportLine(line: string) {
  const trimmed = line.replace(/^\||\|$/g, "").trim();
  if (trimmed.includes("|")) return trimmed.split("|").map(cleanCell);
  if (trimmed.includes("\t")) return trimmed.split("\t").map(cleanCell);
  if (trimmed.includes(",")) return trimmed.split(",").map(cleanCell);
  if (trimmed.includes("，")) return trimmed.split("，").map(cleanCell);
  return trimmed.split(/\s+/).map(cleanCell);
}

function cleanCell(value: string) {
  return value.replace(/<[^>]+>/g, "").trim();
}

function getHeaderMap(cells: string[]) {
  const map: Partial<Record<keyof Omit<TravelRecord, "id">, number>> = {};
  cells.forEach((cell, index) => {
    const key = cell.toLowerCase().replace(/\s/g, "");
    if (/日期|时间|date/.test(key)) map.date = index;
    if (/车次|train/.test(key)) map.train = index;
    if (/出发|起点|from/.test(key)) map.from = index;
    if (/到达|终点|目的|to/.test(key)) map.to = index;
    if (/席别|座位|坐席|seat/.test(key)) map.seat = index;
    if (/座位号|座号|座位编号|seatno|seatnumber/.test(key)) map.seatNo = index;
    if (/票价|价格|金额|fare|price/.test(key)) map.fare = index;
    if (/备注|说明|note|remark/.test(key)) map.remark = index;
  });
  return hasColumn(map.date) && hasColumn(map.train) && hasColumn(map.from) && hasColumn(map.to) ? map : null;
}

function parseImportCells(
  cells: string[],
  headerMap: Partial<Record<keyof Omit<TravelRecord, "id">, number>> | null,
  index: number,
): TravelRecord | null {
  const values = headerMap
    ? {
        date: getMappedCell(cells, headerMap.date),
        train: getMappedCell(cells, headerMap.train),
        from: getMappedCell(cells, headerMap.from),
        to: getMappedCell(cells, headerMap.to),
        seat: getMappedCell(cells, headerMap.seat),
        seatNo: getMappedCell(cells, headerMap.seatNo),
        fare: getMappedCell(cells, headerMap.fare),
        remark: getMappedCell(cells, headerMap.remark),
      }
    : guessImportValues(cells);
  const date = normalizeDate(values.date);
  const train = values.train.trim().toUpperCase();
  const fareText = values.fare.replace(/[^\d.]/g, "");
  const fare = Number(fareText);
  const seat = normalizeSeat(values.seat);

  if (!date || !train || !values.from || !values.to || !fareText || Number.isNaN(fare)) return null;

  return {
    id: `import-${date}-${train}-${index}-${crypto.randomUUID()}`,
    date,
    train,
    from: values.from.trim(),
    to: values.to.trim(),
    seat,
    seatNo: values.seatNo.trim(),
    fare: Number(fare.toFixed(1)),
    remark: values.remark.trim(),
  };
}

function getMappedCell(cells: string[], index: number | undefined) {
  return typeof index === "number" ? cells[index] || "" : "";
}

function guessImportValues(cells: string[]) {
  const dateIndex = cells.findIndex((cell) => Boolean(normalizeDate(cell)));
  const trainIndex = cells.findIndex((cell) => /^[A-Z]?\d{1,5}[A-Z]?$/i.test(cell));
  const seatIndex = cells.findIndex((cell) => seatOptions.some((seat) => cell.includes(seat)));
  const fareIndex = cells.findIndex((cell) => /[¥￥元]|\d+\.\d+/.test(cell));
  const seatNoIndex = cells.findIndex((cell) => /^[A-Z]?\d{1,2}[A-Z号]?$|^\d{1,2}[车-]\d{1,3}[A-Z号]?$/.test(cell));
  const used = new Set([dateIndex, trainIndex, seatIndex, seatNoIndex, fareIndex].filter((item) => item >= 0));
  const stationCells = cells.filter((_, index) => !used.has(index));
  const routeMatch = stationCells.join(" ").match(/(.+?)(?:->|→|-|至|到)(.+)/);

  return {
    date: cells[dateIndex] || cells[0] || "",
    train: cells[trainIndex] || cells[1] || "",
    from: routeMatch ? routeMatch[1].trim() : stationCells[0] || cells[2] || "",
    to: routeMatch ? routeMatch[2].trim() : stationCells[1] || cells[3] || "",
    seat: cells[seatIndex] || "二等座",
    seatNo: cells[seatNoIndex] || "",
    fare: cells[fareIndex] || "",
    remark: "",
  };
}

function hasColumn(index: number | undefined) {
  return typeof index === "number";
}

function normalizeDate(value: string) {
  const match = value.match(/(\d{4})[./年-](\d{1,2})[./月-](\d{1,2})(?:\D+(\d{1,2}):(\d{1,2}))?/);
  if (!match) return "";
  const [, year, month, day, hour, minute] = match;
  const date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  return hour && minute ? `${date} ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}` : date;
}

function normalizeSeat(value: string | undefined): SeatType {
  if (!value) return "二等座";
  return seatOptions.find((seat) => value.includes(seat)) || "二等座";
}
