export type SeatType =
  | "二等座"
  | "一等座"
  | "商务座"
  | "硬座"
  | "硬卧"
  | "软卧"
  | "动卧"
  | "硬卧代硬座";

export type TravelRecord = {
  id: string;
  date: string;
  train: string;
  from: string;
  to: string;
  seat: SeatType;
  seatNo?: string;
  fare: number;
  duration?: string;
  remark?: string;
};

export type DraftRecord = {
  date: string;
  train: string;
  from: string;
  to: string;
  seat: SeatType;
  seatNo: string;
  fare: string;
  remark: string;
};

export type ImportResult = {
  added: number;
  skipped: number;
};

export type ImportParseResult = ImportResult & {
  records: TravelRecord[];
};
