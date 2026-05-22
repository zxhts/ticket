import { NextResponse } from "next/server";
import { readRecords, writeRecords } from "@/src/backend/lib/recordStore";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const records = await readRecords();
  const nextRecords = records.filter((record) => record.id !== id);
  await writeRecords(nextRecords);
  return NextResponse.json({ deleted: records.length - nextRecords.length });
}
