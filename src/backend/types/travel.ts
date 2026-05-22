export type SeatType = "二等座" | "一等座" | "商务座" | "硬座" | "硬卧" | "软卧";

export type TravelRecord = {
  id: string;
  date: string;
  train: string;
  from: string;
  to: string;
  seat: SeatType;
  fare: number;
  duration: string;
};

export type DraftRecord = {
  date: string;
  train: string;
  from: string;
  to: string;
  seat: SeatType;
  fare: string;
  duration: string;
};

export type ImportResult = {
  added: number;
  skipped: number;
};

export type ImportParseResult = ImportResult & {
  records: TravelRecord[];
};
