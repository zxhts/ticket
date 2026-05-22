import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { TravelRecord } from "@/src/backend/types/travel";
import { seedRecords } from "@/src/backend/lib/seedRecords";
import { normalizeRecord } from "@/src/frontend/utils/travel";

const dataFile = resolve(process.cwd(), "public/data/travel-records.json");

export async function readRecords() {
  await ensureDataFile();
  const raw = await readFile(dataFile, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed.map((item, index) => normalizeRecord(item, index)).filter(Boolean) as TravelRecord[];
}

export async function writeRecords(records: TravelRecord[]) {
  await mkdir(dirname(dataFile), { recursive: true });
  await writeFile(dataFile, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

export async function resetRecords() {
  await writeRecords(seedRecords);
  return seedRecords;
}

async function ensureDataFile() {
  try {
    await readFile(dataFile, "utf8");
  } catch {
    await writeRecords(seedRecords);
  }
}
