import TicketDashboard from "@/src/frontend/components/TicketDashboard";
import { readRecords } from "@/src/backend/lib/recordStore";

export default async function Home() {
  const records = await readRecords();

  return <TicketDashboard initialRecords={records} />;
}
