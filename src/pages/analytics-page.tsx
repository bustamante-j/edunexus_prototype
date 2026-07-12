import { useMemo, useState } from "react";
import { Download, Eye, EyeOff, Search } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { Badge, Button, MetricStrip, PageHeader, Panel, Select, TableFrame } from "../components/ui";
import { gradeTone } from "../lib/grade-engine";
import { GRADE_LEVELS, learnerAcademicSummary, learnerAttendanceSummary, sectionAttendanceSummary, sectionLabel, visibleLearners, visibleSections } from "../lib/selectors";
import { downloadTextFile, learnerName } from "../lib/utils";
import { useAppStore } from "../store/use-app-store";

const colors = ["#0b3b70", "#1a6d9f", "#5e98bb", "#b64040"];

export function AnalyticsPage() {
  const currentUserId = useAppStore((state) => state.currentUserId);
  const users = useAppStore((state) => state.users);
  const learners = useAppStore((state) => state.learners);
  const sections = useAppStore((state) => state.sections);
  const subjects = useAppStore((state) => state.subjects);
  const gradeSheets = useAppStore((state) => state.gradeSheets);
  const attendanceDays = useAppStore((state) => state.attendanceDays);
  const user = users.find((candidate) => candidate.id === currentUserId)!;
  const [gradeFilter, setGradeFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showCharts, setShowCharts] = useState(true);
  const scopedSections = visibleSections(user, sections);
  const scopedLearners = visibleLearners(user, learners);

  const records = useMemo(() => scopedLearners
    .filter((learner) => gradeFilter === "all" || learner.gradeLevel === gradeFilter)
    .filter((learner) => sectionFilter === "all" || learner.sectionId === sectionFilter)
    .map((learner) => ({ learner, academic: learnerAcademicSummary(learner, subjects, gradeSheets), attendance: learnerAttendanceSummary(learner.id, attendanceDays) })), [scopedLearners, gradeFilter, sectionFilter, subjects, gradeSheets, attendanceDays]);
  const riskRecords = records
    .filter((record) => record.academic.generalAverage < 80 || record.attendance.atRisk)
    .filter((record) => learnerName(record.learner).toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.academic.generalAverage - b.academic.generalAverage);

  const overallAverage = records.length ? records.reduce((total, record) => total + record.academic.generalAverage, 0) / records.length : 0;
  const overallAttendance = records.length ? records.reduce((total, record) => total + record.attendance.rate, 0) / records.length : 0;
  const critical = records.filter((record) => record.academic.generalAverage < 75 || record.attendance.atRisk).length;

  const enrollmentData = GRADE_LEVELS.map((grade) => ({
    grade: grade === "Kindergarten" ? "Kinder" : grade.replace("Grade ", "G"),
    learners: records.filter((record) => record.learner.gradeLevel === grade).length,
  })).filter((item) => item.learners);
  const standingData = [
    { name: "Advancing", value: records.filter((record) => record.academic.generalAverage >= 90).length },
    { name: "Benchmarking", value: records.filter((record) => record.academic.generalAverage >= 80 && record.academic.generalAverage < 90).length },
    { name: "Connecting", value: records.filter((record) => record.academic.generalAverage >= 75 && record.academic.generalAverage < 80).length },
    { name: "Below standard", value: records.filter((record) => record.academic.generalAverage < 75).length },
  ];
  const sectionData = scopedSections
    .filter((section) => gradeFilter === "all" || section.gradeLevel === gradeFilter)
    .map((section) => ({ section: `${section.gradeLevel.replace("Grade ", "G")} ${section.name}`, ...sectionAttendanceSummary(section.id, learners, attendanceDays) }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 12);
  const subjectData = subjects.map((subject) => ({
    subject: subject.code,
    average: records.length ? Number((records.reduce((total, record) => total + (record.academic.subjectGrades.find((item) => item.subject.id === subject.id)?.finalGrade ?? 0), 0) / records.length).toFixed(1)) : 0,
  }));

  function exportRiskRegister() {
    const rows = riskRecords.map((record) => [record.learner.lrn, learnerName(record.learner), record.learner.gradeLevel, record.academic.generalAverage, record.academic.failingSubjects.map((item) => item.subject.code).join(" / "), record.attendance.rate.toFixed(1), record.attendance.atRisk ? "Attendance review" : "Academic monitoring"].map((value) => `"${value}"`).join(","));
    downloadTextFile("edunexus-learner-monitoring-register.csv", ["LRN,Learner,Grade,General Average,Failed Areas,Attendance Rate,Priority", ...rows].join("\n"));
    toast.success("Monitoring register downloaded");
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Evidence for school decisions"
        title="Analytics"
        actions={<><Button variant="secondary" onClick={() => setShowCharts((value) => !value)}>{showCharts ? <EyeOff size={17} /> : <Eye size={17} />}{showCharts ? "Hide charts" : "Show charts"}</Button><Button onClick={exportRiskRegister}><Download size={17} /> Export register</Button></>}
      />

      <section className="workspace-toolbar analytics-toolbar">
        <Select value={gradeFilter} onChange={(event) => { setGradeFilter(event.target.value); setSectionFilter("all"); }} aria-label="Filter analytics by grade"><option value="all">All grade levels</option>{GRADE_LEVELS.map((grade) => <option key={grade}>{grade}</option>)}</Select>
        <Select value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)} aria-label="Filter analytics by section"><option value="all">All visible sections</option>{scopedSections.filter((section) => gradeFilter === "all" || section.gradeLevel === gradeFilter).map((section) => <option value={section.id} key={section.id}>{sectionLabel(section)}</option>)}</Select>
      </section>

      <MetricStrip items={[
        { label: "Learners analyzed", value: records.length.toLocaleString(), detail: `${gradeFilter === "all" ? "All visible grades" : gradeFilter}` },
        { label: "General average", value: overallAverage.toFixed(1), detail: "All learning areas", tone: overallAverage < 80 ? "warning" : "info" },
        { label: "Attendance rate", value: `${overallAttendance.toFixed(1)}%`, detail: "Recorded class days", tone: overallAttendance < 90 ? "warning" : "success" },
        { label: "Priority records", value: critical, detail: "Below 75 or attendance hold", tone: critical ? "danger" : "success" },
      ]} />

      {showCharts ? (
        <>
          <div className="analytics-grid">
            <Panel title="Learner distribution" meta="Enrollment by grade level">
              <div className="chart chart--analytics"><ResponsiveContainer width="100%" height="100%"><BarChart data={enrollmentData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}><CartesianGrid stroke="#e5ebf0" vertical={false} /><XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} /><Tooltip cursor={{ fill: "#f5f7f9" }} /><Bar dataKey="learners" fill="#0b3b70" radius={[2, 2, 0, 0]} maxBarSize={54} /></BarChart></ResponsiveContainer></div>
            </Panel>
            <Panel title="Academic standing" meta="General-average descriptors">
              <div className="chart chart--analytics"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={standingData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={2} strokeWidth={0}>{standingData.map((item, index) => <Cell fill={colors[index]} key={item.name} />)}</Pie><Tooltip /><Legend iconType="square" wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer></div>
            </Panel>
          </div>
          <Panel title="Learning-area averages" meta="Final-grade comparison">
            <div className="chart chart--wide"><ResponsiveContainer width="100%" height="100%"><BarChart data={subjectData} layout="vertical" margin={{ top: 4, right: 30, left: 14, bottom: 0 }}><CartesianGrid stroke="#e5ebf0" horizontal={false} /><XAxis type="number" domain={[60, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} /><YAxis type="category" dataKey="subject" width={48} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#475569", fontWeight: 700 }} /><Tooltip cursor={{ fill: "#f5f7f9" }} /><Bar dataKey="average" fill="#1d6fa5" radius={[0, 2, 2, 0]} barSize={18} /></BarChart></ResponsiveContainer></div>
          </Panel>
          <Panel title="Section attendance" meta="Recorded participation rate">
            <div className="chart chart--wide"><ResponsiveContainer width="100%" height="100%"><BarChart data={sectionData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}><CartesianGrid stroke="#e5ebf0" vertical={false} /><XAxis dataKey="section" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} /><YAxis domain={[80, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} /><Tooltip cursor={{ fill: "#f5f7f9" }} formatter={(value) => [`${Number(value).toFixed(1)}%`, "Attendance"]} /><Bar dataKey="rate" fill="#0b3b70" radius={[2, 2, 0, 0]} maxBarSize={42} /></BarChart></ResponsiveContainer></div>
          </Panel>
        </>
      ) : null}

      <Panel title="Learner monitoring register" meta="Academic and attendance indicators" action={<div className="search-field search-field--compact"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find learner" /></div>} flush>
        <TableFrame className="table-frame--borderless"><table className="data-table"><thead><tr><th>Learner</th><th>Class</th><th>Average</th><th>Failed areas</th><th>Attendance</th><th>Priority</th><th>Recommended response</th></tr></thead><tbody>{riskRecords.slice(0, 40).map((record) => { const section = sections.find((item) => item.id === record.learner.sectionId); const highRisk = record.academic.generalAverage < 75 || record.attendance.atRisk; return <tr className={highRisk ? "row-danger" : "row-warning"} key={record.learner.id}><td><strong>{learnerName(record.learner)}</strong><small>{record.learner.lrn}</small></td><td>{sectionLabel(section)}</td><td><Badge tone={gradeTone(record.academic.generalAverage)}>{record.academic.generalAverage}</Badge></td><td>{record.academic.failingSubjects.length ? record.academic.failingSubjects.map((item) => item.subject.code).join(", ") : "None"}</td><td><strong>{record.attendance.rate.toFixed(1)}%</strong><small>{record.attendance.absentEquivalent.toFixed(1)} absent days</small></td><td><Badge tone={highRisk ? "danger" : "warning"}>{highRisk ? "Immediate" : "Monitor"}</Badge></td><td>{record.attendance.atRisk ? "Validate absences and contact guardian" : record.academic.failingSubjects.length ? "Plan remediation and review evidence" : "Continue close monitoring"}</td></tr>; })}</tbody></table></TableFrame>
      </Panel>
    </div>
  );
}

