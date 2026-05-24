import { NextResponse } from "next/server";
import { readRecords, writeRecords } from "@/src/backend/lib/recordStore";
import type { SeatType, TravelRecord } from "@/src/backend/types/travel";
import { seatOptions } from "@/src/frontend/utils/travel";

type CreateRecordBody = Omit<TravelRecord, "id">;

export async function GET() {
  return NextResponse.json(await readRecords());
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<CreateRecordBody>;
  const record = normalizeCreateBody(body);
  const records = await readRecords();
  await writeRecords([...records, record]);
  return NextResponse.json(record, { status: 201 });
}

function normalizeCreateBody(body: Partial<CreateRecordBody>): TravelRecord {
  if (!body.date || !body.train || !body.from || !body.to || typeof body.fare !== "number") {
    throw new Response("Invalid travel record", { status: 400 });
  }

  return {
    id: crypto.randomUUID(),
    date: body.date,
    train: body.train.trim().toUpperCase(),
    from: body.from.trim(),
    to: body.to.trim(),
    seat: normalizeSeat(body.seat),
    seatNo: body.seatNo?.trim() || "",
    fare: Number(body.fare.toFixed(1)),
    remark: body.remark?.trim() || "",
  };
}

function normalizeSeat(value: SeatType | undefined): SeatType {
  return value && seatOptions.includes(value) ? value : "二等座";
}
