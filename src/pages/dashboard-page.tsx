import { useMemo } from "react";
import { ArrowRight, CalendarDays, FileOutput, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge, Button, MetricStrip, PageHeader, Panel, Progress, TableFrame } from "../components/ui";
import { attendanceEquivalent } from "../lib/grade-engine";
import {
  GRADE_LEVELS,
  learnerAcademicSummary,
  learnerAttendanceSummary,
  sectionLabel,
  visibleLearners,
  visibleSections,
} from "../lib/selectors";
import { formatDate, formatDateTime, learnerName } from "../lib/utils";
import { useAppStore } from "../store/use-app-store";

const roleIntro = {
  school_head: "School-wide records and reporting",
  admin_officer: "Attendance consolidation and learner records",
  teacher: "Grade 4 Narra class workspace",
};

const chartColors = ["#0b3b70", "#1d6fa5", "#5b94bc", "#93b9d0", "#d7e6ef"];

export function DashboardPage() {
  const navigate = useNavigate();
  const currentUserId = useAppStore((state) => state.currentUserId);
  const users = useAppStore((state) => state.users);
  const school = useAppStore((state) => state.school);
  const sections = useAppStore((state) => state.sections);
  const subjects = useAppStore((state) => state.subjects);
  const learners = useAppStore((state) => state.learners);
  const attendanceDays = useAppStore((state) => state.attendanceDays);
  const gradeSheets = useAppStore((state) => state.gradeSheets);
  const auditLog = useAppStore((state) => state.auditLog);
  const user = users.find((candidate) => candidate.id === currentUserId)!;
  const scopedLearners = useMemo(() => visibleLearners(user, learners), [user, learners]);
  const scopedSections = useMemo(() => visibleSections(user, sections), [user, sections]);

  const summaries = useMemo(
    () => scopedLearners.map((learner) => ({
      learner,
      academic: learnerAcademicSummary(learner, subjects, gradeSheets),
      attendance: learnerAttendanceSummary(learner.id, attendanceDays),
    })),
    [scopedLearners, subjects, gradeSheets, attendanceDays],
  );
  const overallAttendance = summaries.length
    ? summaries.reduce((total, item) => total + item.attendance.rate, 0) / summaries.length
    : 0;
  const schoolAverage = summaries.length
    ? summaries.reduce((total, item) => total + item.academic.generalAverage, 0) / summaries.length
    : 0;
  const supportCases = summaries.filter(
    (item) => item.academic.failingSubjects.length || item.attendance.atRisk,
  );

  const enrollmentData = GRADE_LEVELS.map((grade) => ({
    grade: grade === "Kindergarten" ? "Kinder" : grade.replace("Grade ", "G"),
    learners: scopedLearners.filter((learner) => learner.gradeLevel === grade).length,
  })).filter((item) => item.learners > 0);

  const attendanceTrend = useMemo(() => {
    const dates = [...new Set(attendanceDays.map((day) => day.date))].sort().slice(-8);
    return dates.map((date) => {
      const days = attendanceDays.filter(
        (day) => date === day.date && scopedSections.some((section) => section.id === day.sectionId),
      );
      const entries = days.flatMap((day) => Object.values(day.entries));
      const rate = entries.length
        ? (entries.reduce((total, entry) => total + attendanceEquivalent(entry), 0) / entries.length) * 100
        : 0;
      return { date: formatDate(date, { month: "short", day: "numeric" }), rate: Number(rate.toFixed(1)) };
    });
  }, [attendanceDays, scopedSections]);

  const gradeDistribution = [
    { name: "Advancing", value: summaries.filter((item) => item.academic.generalAverage >= 90).length },
    { name: "Benchmarking", value: summaries.filter((item) => item.academic.generalAverage >= 80 && item.academic.generalAverage < 90).length },
    { name: "Connecting", value: summaries.filter((item) => item.academic.generalAverage >= 75 && item.academic.generalAverage < 80).length },
    { name: "Needs support", value: summaries.filter((item) => item.academic.generalAverage < 75).length },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={roleIntro[user.role]}
        title={`Good morning, ${user.fullName.split(" ")[0]}`}
        actions={
          <>
            {user.role !== "teacher" ? (
              <Button variant="secondary" onClick={() => navigate("/portal/learners?new=1")}><UserPlus size={17} /> Add learner</Button>
            ) : null}
            <Button onClick={() => navigate("/portal/attendance")}><CalendarDays size={17} /> Record attendance</Button>
          </>
        }
      />

      <MetricStrip items={[
        {
          label: user.role === "teacher" ? "Class learners" : "Enrolled learners",
          value: user.role === "teacher" ? scopedLearners.length : school.officialEnrollment.toLocaleString(),
          detail: user.role === "teacher" ? sectionLabel(scopedSections[0]) : `${scopedSections.length} active sections`,
        },
        { label: "Attendance rate", value: `${overallAttendance.toFixed(1)}%`, detail: "Recorded class days", tone: overallAttendance < 90 ? "warning" : "success" },
        { label: "General average", value: schoolAverage.toFixed(1), detail: "Across visible records", tone: schoolAverage < 80 ? "warning" : "info" },
        { label: "Needs review", value: supportCases.length, detail: "Academic or attendance", tone: supportCases.length ? "danger" : "success" },
      ]} />

      <div className="dashboard-grid">
        <Panel title="Attendance trend" meta="Last recorded school days" action={<Badge tone="success" dot>{overallAttendance.toFixed(1)}% average</Badge>}>
          <div className="chart chart--line">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceTrend} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#e5ebf0" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis domain={[80, 100]} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 4, borderColor: "#dbe3ea", fontSize: 12 }} formatter={(value) => [`${value}%`, "Attendance"]} />
                <Line type="monotone" dataKey="rate" stroke="#146da3" strokeWidth={2.5} dot={{ r: 3, fill: "#fff", strokeWidth: 2 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Academic standing" meta="Current computed records">
          <div className="standing-chart">
            <div className="chart chart--donut">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={gradeDistribution} dataKey="value" innerRadius={48} outerRadius={72} paddingAngle={2} strokeWidth={0}>
                    {gradeDistribution.map((entry, index) => <Cell fill={chartColors[index]} key={entry.name} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 4, borderColor: "#dbe3ea", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center"><strong>{Math.round(schoolAverage)}</strong><span>average</span></div>
            </div>
            <div className="chart-legend">
              {gradeDistribution.map((item, index) => (
                <div key={item.name}><span style={{ background: chartColors[index] }} /><strong>{item.value}</strong><small>{item.name}</small></div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      {user.role !== "teacher" ? (
        <Panel title="Enrollment by grade" meta={`${school.activeSchoolYear} official roster`}>
          <div className="chart chart--bar">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enrollmentData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#e5ebf0" vertical={false} />
                <XAxis dataKey="grade" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                <Tooltip cursor={{ fill: "#f4f7f9" }} contentStyle={{ borderRadius: 4, borderColor: "#dbe3ea", fontSize: 12 }} />
                <Bar dataKey="learners" fill="#0b3b70" radius={[2, 2, 0, 0]} maxBarSize={58} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      ) : null}

      <Panel
        title="Records requiring attention"
        meta="Prioritized by academic and attendance indicators"
        action={<Button size="sm" variant="quiet" onClick={() => navigate("/portal/analytics")}>View analytics <ArrowRight size={16} /></Button>}
        flush
      >
        <TableFrame className="table-frame--borderless">
          <table className="data-table">
            <thead><tr><th>Learner</th><th>Class</th><th>General average</th><th>Attendance</th><th>Priority</th><th /></tr></thead>
            <tbody>
              {supportCases.slice(0, 7).map((item) => {
                const section = sections.find((candidate) => candidate.id === item.learner.sectionId);
                const priority = item.academic.failingSubjects.length && item.attendance.atRisk ? "Critical" : item.academic.failingSubjects.length ? "Academic" : "Attendance";
                return (
                  <tr key={item.learner.id}>
                    <td><strong>{learnerName(item.learner)}</strong><small>LRN {item.learner.lrn}</small></td>
                    <td>{sectionLabel(section)}</td>
                    <td><div className="table-progress"><strong>{item.academic.generalAverage}</strong><Progress value={item.academic.generalAverage} tone={item.academic.generalAverage < 75 ? "danger" : "warning"} /></div></td>
                    <td>{item.attendance.rate.toFixed(1)}%</td>
                    <td><Badge tone={priority === "Critical" ? "danger" : "warning"}>{priority}</Badge></td>
                    <td><Button size="sm" variant="quiet" onClick={() => navigate(`/portal/learners/${item.learner.id}`)}>Review</Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableFrame>
      </Panel>

      <div className="dashboard-grid dashboard-grid--lower">
        <Panel title="Recent activity" meta="Recorded changes">
          <div className="activity-list">
            {auditLog.slice(0, 5).map((entry) => (
              <div className="activity-list__item" key={entry.id}>
                <span />
                <div><strong>{entry.action}</strong><small>{entry.detail}</small></div>
                <time>{formatDateTime(entry.timestamp)}</time>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Quick outputs" meta="Ready-to-generate records">
          <div className="quick-output-list">
            <button onClick={() => navigate("/portal/forms?form=sf2")}><FileOutput size={18} /><span><strong>SF2</strong><small>Daily attendance report</small></span><ArrowRight size={16} /></button>
            <button onClick={() => navigate("/portal/forms?form=sf4")}><FileOutput size={18} /><span><strong>SF4</strong><small>Monthly attendance consolidation</small></span><ArrowRight size={16} /></button>
            <button onClick={() => navigate("/portal/forms?form=sf9")}><FileOutput size={18} /><span><strong>SF9</strong><small>Learner performance report</small></span><ArrowRight size={16} /></button>
            <button onClick={() => navigate("/portal/forms?form=sf10")}><FileOutput size={18} /><span><strong>SF10</strong><small>Permanent academic record</small></span><ArrowRight size={16} /></button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
