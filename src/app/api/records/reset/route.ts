import { NextResponse } from "next/server";
import { resetRecords } from "@/src/backend/lib/recordStore";

export async function POST() {
  const records = await resetRecords();
  return NextResponse.json({ count: records.length });
}
