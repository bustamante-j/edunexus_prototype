import { useMemo, useState } from "react";
import { Download, Eye, EyeOff, Search } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import {
  Badge,
  Button,
  MetricStrip,
  PageHeader,
  Panel,
  Segmented,
  Select,
  TableFrame,
} from "../components/ui";
import {
  buildAttendanceTrend,
  buildLearnerInsights,
  buildSectionBenchmarks,
  buildSubjectBenchmarks,
  PRIORITY_LABELS,
  type AnalyticsThresholds,
  type LearnerPriority,
} from "../lib/analytics";
import { gradeTone } from "../lib/grade-engine";
import {
  GRADE_LEVELS,
  sectionLabel,
  visibleLearners,
  visibleSections,
} from "../lib/selectors";
import { downloadTextFile, formatDate, learnerName } from "../lib/utils";
import { useAppStore } from "../store/use-app-store";

type AnalyticsView = "actions" | "sections" | "subjects";
type PriorityFilter = "all" | Exclude<LearnerPriority, "on_track">;

const priorityOrder: LearnerPriority[] = [
  "critical",
  "academic",
  "attendance",
  "monitor",
  "data_gap",
  "on_track",
];
const priorityColors: Record<LearnerPriority, string> = {
  critical: "#b42318",
  academic: "#b7791f",
  attendance: "#176b87",
  monitor: "#64748b",
  data_gap: "#7c6f64",
  on_track: "#2f7a55",
};

function priorityTone(priority: LearnerPriority) {
  if (priority === "critical") return "danger" as const;
  if (priority === "academic" || priority === "attendance") return "warning" as const;
  if (priority === "on_track") return "success" as const;
  return "info" as const;
}

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function AnalyticsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentUserId = useAppStore((state) => state.currentUserId);
  const users = useAppStore((state) => state.users);
  const learners = useAppStore((state) => state.learners);
  const sections = useAppStore((state) => state.sections);
  const subjects = useAppStore((state) => state.subjects);
  const gradeSheets = useAppStore((state) => state.gradeSheets);
  const attendanceDays = useAppStore((state) => state.attendanceDays);
  const user = users.find((candidate) => candidate.id === currentUserId)!;
  const scopedSections = visibleSections(user, sections);
  const scopedLearners = visibleLearners(user, learners);
  const requestedGrade = searchParams.get("grade");
  const requestedSection = searchParams.get("section");
  const [gradeFilter, setGradeFilter] = useState(
    requestedGrade && (requestedGrade === "all" || GRADE_LEVELS.includes(requestedGrade as (typeof GRADE_LEVELS)[number]))
      ? requestedGrade
      : "all",
  );
  const [sectionFilter, setSectionFilter] = useState(
    requestedSection && (requestedSection === "all" || scopedSections.some((section) => section.id === requestedSection))
      ? requestedSection
      : "all",
  );
  const [thresholds, setThresholds] = useState<AnalyticsThresholds>({ grade: 80, attendance: 90 });
  const [view, setView] = useState<AnalyticsView>("actions");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [search, setSearch] = useState("");
  const [showCharts, setShowCharts] = useState(true);

  const filteredSections = useMemo(
    () => scopedSections
      .filter((section) => gradeFilter === "all" || section.gradeLevel === gradeFilter)
      .filter((section) => sectionFilter === "all" || section.id === sectionFilter),
    [scopedSections, gradeFilter, sectionFilter],
  );
  const filteredLearners = useMemo(
    () => scopedLearners
      .filter((learner) => gradeFilter === "all" || learner.gradeLevel === gradeFilter)
      .filter((learner) => sectionFilter === "all" || learner.sectionId === sectionFilter),
    [scopedLearners, gradeFilter, sectionFilter],
  );
  const insights = useMemo(
    () => buildLearnerInsights(filteredLearners, sections, subjects, gradeSheets, attendanceDays, thresholds),
    [filteredLearners, sections, subjects, gradeSheets, attendanceDays, thresholds],
  );
  const sectionBenchmarks = useMemo(
    () => buildSectionBenchmarks(insights, filteredSections),
    [insights, filteredSections],
  );
  const subjectBenchmarks = useMemo(
    () => buildSubjectBenchmarks(insights, subjects, thresholds.grade),
    [insights, subjects, thresholds.grade],
  );
  const attendanceTrend = useMemo(
    () => buildAttendanceTrend(attendanceDays, filteredSections.map((section) => section.id)).map((point) => ({
      ...point,
      label: formatDate(point.date, { month: "short", day: "numeric" }),
    })),
    [attendanceDays, filteredSections],
  );

  const actionRecords = insights
    .filter((record) => record.priority !== "on_track")
    .filter((record) => priorityFilter === "all" || record.priority === priorityFilter)
    .filter((record) => learnerName(record.learner).toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => b.priorityScore - a.priorityScore || learnerName(a.learner).localeCompare(learnerName(b.learner)));
  const overallAverage = insights.length
    ? insights.reduce((total, record) => total + record.academic.generalAverage, 0) / insights.length
    : 0;
  const attendanceWithData = insights.filter((record) => record.attendance.classDays > 0);
  const overallAttendance = attendanceWithData.length
    ? attendanceWithData.reduce((total, record) => total + record.attendance.rate, 0) / attendanceWithData.length
    : 0;
  const criticalCount = insights.filter((record) => record.priority === "critical").length;
  const supportCount = insights.filter((record) => ["critical", "academic", "attendance"].includes(record.priority)).length;
  const riskDistribution = priorityOrder.map((priority) => ({
    priority,
    name: PRIORITY_LABELS[priority],
    learners: insights.filter((record) => record.priority === priority).length,
  }));

  function setScopeGrade(grade: string) {
    setGradeFilter(grade);
    setSectionFilter("all");
  }

  function exportAnalysis() {
    if (view === "sections") {
      const rows = sectionBenchmarks.map((row) => [
        sectionLabel(row.section),
        row.learners,
        row.averageGrade.toFixed(1),
        row.attendanceRate.toFixed(1),
        row.critical,
        row.support,
        row.priorityRate.toFixed(1),
      ].map(csvCell).join(","));
      downloadTextFile("edunexus-section-benchmarks.csv", ["Section,Learners,Average Grade,Attendance Rate,Critical,Support Cases,Priority Rate", ...rows].join("\n"));
    } else if (view === "subjects") {
      const rows = subjectBenchmarks.map((row) => [
        row.subject.name,
        row.average.toFixed(1),
        row.termAverages[0].toFixed(1),
        row.termAverages[1].toFixed(1),
        row.termAverages[2].toFixed(1),
        row.change.toFixed(1),
        row.passRate.toFixed(1),
        row.belowTarget,
      ].map(csvCell).join(","));
      downloadTextFile("edunexus-subject-gap-analysis.csv", ["Learning Area,Final Average,Term 1,Term 2,Term 3,Change,Pass Rate,Below Target", ...rows].join("\n"));
    } else {
      const rows = actionRecords.map((record) => [
        record.learner.lrn,
        learnerName(record.learner),
        sectionLabel(record.section),
        PRIORITY_LABELS[record.priority],
        record.academic.generalAverage,
        record.attendance.classDays ? record.attendance.rate.toFixed(1) : "No data",
        record.concerns.join("; "),
        record.recommendedAction,
      ].map(csvCell).join(","));
      downloadTextFile("edunexus-learner-action-plan.csv", ["LRN,Learner,Class,Priority,General Average,Attendance Rate,Concerns,Recommended Action", ...rows].join("\n"));
    }
    toast.success("Analysis downloaded", { description: "The current filtered view was exported to CSV." });
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Decision support"
        title="Analytics"
        actions={<><Button variant="secondary" onClick={() => setShowCharts((value) => !value)}>{showCharts ? <EyeOff size={17} /> : <Eye size={17} />}{showCharts ? "Hide charts" : "Show charts"}</Button><Button onClick={exportAnalysis}><Download size={17} /> Export analysis</Button></>}
      />

      <section className="workspace-toolbar analytics-toolbar analytics-toolbar--deep">
        <Select value={gradeFilter} onChange={(event) => setScopeGrade(event.target.value)} aria-label="Filter analytics by grade"><option value="all">All grade levels</option>{GRADE_LEVELS.map((grade) => <option key={grade}>{grade}</option>)}</Select>
        <Select value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)} aria-label="Filter analytics by section"><option value="all">All visible sections</option>{scopedSections.filter((section) => gradeFilter === "all" || section.gradeLevel === gradeFilter).map((section) => <option value={section.id} key={section.id}>{sectionLabel(section)}</option>)}</Select>
        <Select value={thresholds.grade} onChange={(event) => setThresholds((current) => ({ ...current, grade: Number(event.target.value) }))} aria-label="Academic support threshold"><option value={75}>Grade target: 75</option><option value={80}>Grade target: 80</option><option value={85}>Grade target: 85</option></Select>
        <Select value={thresholds.attendance} onChange={(event) => setThresholds((current) => ({ ...current, attendance: Number(event.target.value) }))} aria-label="Attendance target"><option value={80}>Attendance target: 80%</option><option value={85}>Attendance target: 85%</option><option value={90}>Attendance target: 90%</option><option value={95}>Attendance target: 95%</option></Select>
        <Segmented value={view} onChange={setView} label="Analytics view" options={[{ value: "actions", label: "Actions" }, { value: "sections", label: "Sections" }, { value: "subjects", label: "Subjects" }]} />
      </section>

      <MetricStrip items={[
        { label: "Learners analyzed", value: insights.length.toLocaleString(), detail: `${filteredSections.length} visible sections` },
        { label: "General average", value: overallAverage.toFixed(1), detail: `Target ${thresholds.grade}`, tone: overallAverage < thresholds.grade ? "warning" : "success" },
        { label: "Attendance rate", value: `${overallAttendance.toFixed(1)}%`, detail: `Target ${thresholds.attendance}%`, tone: overallAttendance < thresholds.attendance ? "warning" : "success" },
        { label: "Immediate action", value: criticalCount, detail: `${supportCount} total support cases`, tone: criticalCount ? "danger" : "success" },
      ]} />

      {view === "actions" ? (
        <>
          <Panel title="Action center" meta="Click a category to filter the learner queue">
            <div className="analytics-action-strip">
              {(["critical", "academic", "attendance", "monitor"] as LearnerPriority[]).map((priority) => {
                const count = insights.filter((record) => record.priority === priority).length;
                return <button type="button" className={priorityFilter === priority ? "is-active" : undefined} key={priority} onClick={() => setPriorityFilter((current) => current === priority ? "all" : priority as PriorityFilter)}><strong>{count}</strong><span>{PRIORITY_LABELS[priority]}</span><small>{priority === "critical" ? "Guardian and support plan" : priority === "academic" ? "Focused remediation" : priority === "attendance" ? "Absence validation" : "Next-cycle review"}</small></button>;
              })}
            </div>
          </Panel>

          {showCharts ? <div className="analytics-grid">
            <Panel title="Support distribution" meta="Learners grouped by the active thresholds">
              <div className="chart chart--analytics"><ResponsiveContainer width="100%" height="100%"><BarChart data={riskDistribution} margin={{ top: 12, right: 8, left: -18, bottom: 24 }}><CartesianGrid stroke="#e5ebf0" vertical={false} /><XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#64748b" }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} /><Tooltip cursor={{ fill: "#f5f7f9" }} /><Bar dataKey="learners" maxBarSize={48}>{riskDistribution.map((item) => <Cell fill={priorityColors[item.priority]} key={item.priority} />)}</Bar></BarChart></ResponsiveContainer></div>
            </Panel>
            <Panel title="Attendance trend" meta={`Target line at ${thresholds.attendance}%`}>
              <div className="chart chart--analytics"><ResponsiveContainer width="100%" height="100%"><LineChart data={attendanceTrend} margin={{ top: 12, right: 16, left: -12, bottom: 0 }}><CartesianGrid stroke="#e5ebf0" vertical={false} /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} /><YAxis domain={[70, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} /><Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, "Attendance"]} /><ReferenceLine y={thresholds.attendance} stroke="#b7791f" strokeDasharray="5 4" /><Line type="monotone" dataKey="rate" stroke="#0b3b70" strokeWidth={2.5} dot={{ r: 3, fill: "#fff", strokeWidth: 2 }} /></LineChart></ResponsiveContainer></div>
            </Panel>
          </div> : null}

          <Panel title="Learner action queue" meta={`${actionRecords.length} records ordered by urgency`} action={<div className="analytics-queue-actions"><Select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as PriorityFilter)} aria-label="Filter by priority"><option value="all">All support records</option><option value="critical">Immediate action</option><option value="academic">Academic support</option><option value="attendance">Attendance follow-up</option><option value="monitor">Monitor</option><option value="data_gap">Complete records</option></Select><div className="search-field search-field--compact"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find learner" /></div></div>} flush>
            <TableFrame className="table-frame--borderless"><table className="data-table analytics-action-table"><thead><tr><th>Priority</th><th>Learner</th><th>Class</th><th>Average</th><th>Attendance</th><th>Concern</th><th>Recommended response</th><th /></tr></thead><tbody>{actionRecords.slice(0, 100).map((record) => <tr className={record.priority === "critical" ? "row-danger" : record.priority === "academic" || record.priority === "attendance" ? "row-warning" : undefined} key={record.learner.id}><td><Badge tone={priorityTone(record.priority)}>{PRIORITY_LABELS[record.priority]}</Badge><small>Score {record.priorityScore}</small></td><td><strong>{learnerName(record.learner)}</strong><small>{record.learner.lrn}</small></td><td>{sectionLabel(record.section)}</td><td><Badge tone={gradeTone(record.academic.generalAverage)}>{record.academic.generalAverage}</Badge></td><td><strong>{record.attendance.classDays ? `${record.attendance.rate.toFixed(1)}%` : "No data"}</strong><small>{record.attendance.classDays ? `${record.attendance.absentEquivalent.toFixed(1)} absent days` : "Attendance missing"}</small></td><td>{record.concerns.join("; ")}</td><td>{record.recommendedAction}</td><td><Button size="sm" variant="quiet" onClick={() => navigate(`/portal/learners/${record.learner.id}`)}>Open</Button></td></tr>)}</tbody></table></TableFrame>
          </Panel>
        </>
      ) : null}

      {view === "sections" ? (
        <>
          {showCharts ? <Panel title="Section support workload" meta="Share of learners needing academic or attendance action">
            <div className="chart chart--wide"><ResponsiveContainer width="100%" height="100%"><BarChart data={sectionBenchmarks.slice(0, 16).map((row) => ({ section: `${row.section.gradeLevel.replace("Grade ", "G")} ${row.section.name}`, rate: Number(row.priorityRate.toFixed(1)) }))} margin={{ top: 8, right: 8, left: -16, bottom: 20 }}><CartesianGrid stroke="#e5ebf0" vertical={false} /><XAxis dataKey="section" angle={-20} textAnchor="end" interval={0} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#64748b" }} /><YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} /><Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, "Support workload"]} /><Bar dataKey="rate" fill="#0b3b70" maxBarSize={42} /></BarChart></ResponsiveContainer></div>
          </Panel> : null}
          <Panel title="Section benchmark" meta="Highest support workload appears first" flush>
            <TableFrame className="table-frame--borderless"><table className="data-table"><thead><tr><th>Section</th><th>Learners</th><th>Average</th><th>Attendance</th><th>Immediate</th><th>Support cases</th><th>Workload</th><th>Recommended focus</th></tr></thead><tbody>{sectionBenchmarks.map((row) => <tr className={row.critical ? "row-warning" : undefined} key={row.section.id}><td><strong>{sectionLabel(row.section)}</strong><small>{row.section.adviserName}</small></td><td>{row.learners}</td><td><Badge tone={gradeTone(row.averageGrade)}>{row.averageGrade.toFixed(1)}</Badge></td><td><strong>{row.attendanceRate.toFixed(1)}%</strong></td><td>{row.critical ? <Badge tone="danger">{row.critical}</Badge> : "0"}</td><td>{row.support}</td><td><strong>{row.priorityRate.toFixed(1)}%</strong><small>{row.onTrack} on track</small></td><td>{row.averageGrade < thresholds.grade && row.attendanceRate < thresholds.attendance ? "Joint academic and attendance plan" : row.averageGrade < thresholds.grade ? "Learning-area remediation" : row.attendanceRate < thresholds.attendance ? "Attendance follow-up" : "Maintain current supports"}</td></tr>)}</tbody></table></TableFrame>
          </Panel>
        </>
      ) : null}

      {view === "subjects" ? (
        <>
          {showCharts ? <Panel title="Learning-area progression" meta="Average by grading term">
            <div className="chart chart--wide"><ResponsiveContainer width="100%" height="100%"><BarChart data={subjectBenchmarks.map((row) => ({ subject: row.subject.code, term1: Number(row.termAverages[0].toFixed(1)), term2: Number(row.termAverages[1].toFixed(1)), term3: Number(row.termAverages[2].toFixed(1)) }))} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}><CartesianGrid stroke="#e5ebf0" vertical={false} /><XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b", fontWeight: 700 }} /><YAxis domain={[60, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} /><Tooltip /><Legend iconType="square" wrapperStyle={{ fontSize: 10 }} /><ReferenceLine y={thresholds.grade} stroke="#b7791f" strokeDasharray="5 4" /><Bar name="Term 1" dataKey="term1" fill="#93b9d0" /><Bar name="Term 2" dataKey="term2" fill="#367eaa" /><Bar name="Term 3" dataKey="term3" fill="#0b3b70" /></BarChart></ResponsiveContainer></div>
          </Panel> : null}
          <Panel title="Subject gap analysis" meta="Lowest final average appears first" flush>
            <TableFrame className="table-frame--borderless"><table className="data-table"><thead><tr><th>Learning area</th><th>Final average</th><th>Term 1</th><th>Term 2</th><th>Term 3</th><th>Change</th><th>Pass rate</th><th>Below target</th><th>Recommended focus</th></tr></thead><tbody>{subjectBenchmarks.map((row) => <tr className={row.average < thresholds.grade ? "row-warning" : undefined} key={row.subject.id}><td><strong>{row.subject.name}</strong><small>{row.subject.code}</small></td><td><Badge tone={gradeTone(row.average)}>{row.average.toFixed(1)}</Badge><small>{row.gapToStrongest.toFixed(1)} points from strongest</small></td><td>{row.termAverages[0].toFixed(1)}</td><td>{row.termAverages[1].toFixed(1)}</td><td>{row.termAverages[2].toFixed(1)}</td><td><Badge tone={row.change < 0 ? "danger" : row.change > 0 ? "success" : "neutral"}>{row.change > 0 ? "+" : ""}{row.change.toFixed(1)}</Badge></td><td>{row.passRate.toFixed(1)}%</td><td>{row.belowTarget.toLocaleString()}</td><td>{row.average < thresholds.grade ? "Review item results and plan targeted remediation" : row.change < 0 ? "Check the term decline before the next assessment" : "Maintain current instruction and enrichment"}</td></tr>)}</tbody></table></TableFrame>
          </Panel>
        </>
      ) : null}

      <details className="analytics-methodology"><summary>How these indicators are calculated</summary><p>Priorities combine each learner's computed general average, failing learning areas, attendance rate, and record completeness. The controls above change the academic and attendance targets immediately; exported files always match the visible filters and thresholds.</p></details>
    </div>
  );
}
