import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { toast } from "sonner";

import { Badge, Button, PageHeader, Panel, Select, TableFrame } from "../components/ui";
import { downloadTextFile, formatDateTime } from "../lib/utils";
import { useAppStore } from "../store/use-app-store";

export function ActivityPage() {
  const auditLog = useAppStore((state) => state.auditLog);
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("all");
  const modules = [...new Set(auditLog.map((entry) => entry.module))].sort();
  const filtered = useMemo(() => auditLog.filter((entry) => {
    const query = search.toLowerCase();
    return (module === "all" || entry.module === module) && `${entry.userName} ${entry.action} ${entry.detail}`.toLowerCase().includes(query);
  }), [auditLog, search, module]);

  function exportLog() {
    const rows = filtered.map((entry) => [entry.timestamp, entry.userName, entry.module, entry.action, entry.detail].map((value) => `"${value.replaceAll('"', '""')}"`).join(","));
    downloadTextFile("edunexus-activity-log.csv", ["Timestamp,User,Module,Action,Detail", ...rows].join("\n"));
    toast.success("Activity log downloaded");
  }

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Accountability and traceability" title="Activity log" actions={<Button onClick={exportLog}><Download size={17} /> Export log</Button>} />
      <Panel title="Recorded system activity" meta={`${filtered.length} matching entries`} action={<div className="activity-filters"><div className="search-field search-field--compact"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search activity" /></div><Select value={module} onChange={(event) => setModule(event.target.value)}><option value="all">All modules</option>{modules.map((item) => <option key={item}>{item}</option>)}</Select></div>} flush>
        <TableFrame className="table-frame--borderless"><table className="data-table"><thead><tr><th>Date and time</th><th>User</th><th>Module</th><th>Action</th><th>Record detail</th></tr></thead><tbody>{filtered.map((entry) => <tr key={entry.id}><td><strong>{formatDateTime(entry.timestamp)}</strong></td><td>{entry.userName}</td><td><Badge tone="info">{entry.module}</Badge></td><td>{entry.action}</td><td>{entry.detail}</td></tr>)}</tbody></table></TableFrame>
      </Panel>
    </div>
  );
}

