import { NextResponse } from "next/server";
import { readRecords, writeRecords } from "@/src/backend/lib/recordStore";
import { parseImportedRecords } from "@/src/frontend/utils/travel";

export async function POST(request: Request) {
  const body = (await request.json()) as { text?: string };
  const result = parseImportedRecords(body.text || "");
  if (result.records.length > 0) {
    const records = await readRecords();
    await writeRecords([...records, ...result.records]);
  }

  return NextResponse.json({ added: result.added, skipped: result.skipped });
}
