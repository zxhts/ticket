import AdminShell from "@/src/frontend/components/AdminShell";
import StatisticsDashboard from "@/src/frontend/components/StatisticsDashboard";
import { readRecords } from "@/src/backend/lib/recordStore";

export default async function StatisticsPage() {
  const records = await readRecords();

  return (
    <AdminShell active="statistics" title="统计看板" description="查看年度分布、累计票价、席别和线路概览">
      <StatisticsDashboard records={records} />
    </AdminShell>
  );
}
