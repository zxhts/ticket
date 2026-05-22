import AdminShell from "@/src/frontend/components/AdminShell";
import RecordManager from "@/src/frontend/components/RecordManager";
import { readRecords } from "@/src/backend/lib/recordStore";

export default async function RecordsPage() {
  const records = await readRecords();

  return (
    <AdminShell active="records" title="行程管理" description="新增火车行程、批量导入语雀记录并生成车票">
      <RecordManager initialRecords={records} />
    </AdminShell>
  );
}
