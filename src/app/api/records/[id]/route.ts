import { NextResponse } from "next/server";
import { readRecords, writeRecords } from "@/src/backend/lib/recordStore";
import type { SeatType, TravelRecord } from "@/src/backend/types/travel";
import { seatOptions } from "@/src/frontend/utils/travel";

type UpdateRecordBody = Omit<TravelRecord, "id">;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as Partial<UpdateRecordBody>;
  const records = await readRecords();
  const index = records.findIndex((record) => record.id === id);

  if (index < 0) {
    return new Response("Record not found", { status: 404 });
  }

  const updatedRecord = normalizeUpdateBody(id, body);
  const nextRecords = records.map((record) => (record.id === id ? updatedRecord : record));
  await writeRecords(nextRecords);
  return NextResponse.json(updatedRecord);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const records = await readRecords();
  const nextRecords = records.filter((record) => record.id !== id);
  await writeRecords(nextRecords);
  return NextResponse.json({ deleted: records.length - nextRecords.length });
}

function normalizeUpdateBody(id: string, body: Partial<UpdateRecordBody>): TravelRecord {
  if (!body.date || !body.train || !body.from || !body.to || typeof body.fare !== "number") {
    throw new Response("Invalid travel record", { status: 400 });
  }

  return {
    id,
    date: body.date,
    train: body.train.trim().toUpperCase(),
    from: body.from.trim(),
    to: body.to.trim(),
    seat: normalizeSeat(body.seat),
    seatNo: body.seatNo?.trim() || "",
    fare: Number(body.fare.toFixed(1)),
    duration: body.duration?.trim() || undefined,
    remark: body.remark?.trim() || "",
  };
}

function normalizeSeat(value: SeatType | undefined): SeatType {
  return value && seatOptions.includes(value) ? value : "二等座";
}
