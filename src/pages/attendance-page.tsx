import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, FileText, Search, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Badge, Button, Field, Input, MetricStrip, PageHeader, Panel, Segmented, Select, TableFrame } from "../components/ui";
import { learnerAttendanceSummary, sectionLabel, visibleSections } from "../lib/selectors";
import { formatDate, learnerName } from "../lib/utils";
import { useAppStore } from "../store/use-app-store";
import type { AttendanceMark } from "../types/domain";

const marks: Array<{ value: AttendanceMark; label: string; title: string }> = [
  { value: "P", label: "P", title: "Present" },
  { value: "A", label: "A", title: "Absent" },
  { value: "L", label: "L", title: "Late" },
  { value: "E", label: "E", title: "Excused" },
];

function AttendancePicker({ value, onChange, label }: { value: AttendanceMark; onChange: (mark: AttendanceMark) => void; label: string }) {
  return (
    <div className="attendance-picker" role="group" aria-label={label}>
      {marks.map((mark) => (
        <button className={value === mark.value ? `is-active mark-${mark.value.toLowerCase()}` : undefined} type="button" title={mark.title} key={mark.value} onClick={() => onChange(mark.value)}>{mark.label}</button>
      ))}
    </div>
  );
}

function shiftDate(value: string, days: number) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function AttendancePage() {
  const navigate = useNavigate();
  const currentUserId = useAppStore((state) => state.currentUserId);
  const users = useAppStore((state) => state.users);
  const sections = useAppStore((state) => state.sections);
  const learners = useAppStore((state) => state.learners);
  const attendanceDays = useAppStore((state) => state.attendanceDays);
  const ensureAttendanceDay = useAppStore((state) => state.ensureAttendanceDay);
  const setAttendanceMark = useAppStore((state) => state.setAttendanceMark);
  const setAttendanceRemarks = useAppStore((state) => state.setAttendanceRemarks);
  const markAllPresent = useAppStore((state) => state.markAllPresent);
  const appendAudit = useAppStore((state) => state.appendAudit);
  const user = users.find((candidate) => candidate.id === currentUserId)!;
  const canRecord = user.role !== "admin_officer";
  const scopedSections = visibleSections(user, sections);
  const [sectionId, setSectionId] = useState(scopedSections[0]?.id ?? "grade-4-narra");
  const [date, setDate] = useState("2026-07-10");
  const [mode, setMode] = useState<"daily" | "monthly">(canRecord ? "daily" : "monthly");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (canRecord) ensureAttendanceDay(date, sectionId);
  }, [date, sectionId, ensureAttendanceDay, canRecord]);

  const section = sections.find((candidate) => candidate.id === sectionId);
  const sectionLearners = useMemo(
    () => learners
      .filter((learner) => learner.sectionId === sectionId)
      .filter((learner) => `${learner.firstName} ${learner.middleName} ${learner.lastName} ${learner.lrn}`.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.lastName.localeCompare(b.lastName)),
    [learners, sectionId, search],
  );
  const day = attendanceDays.find((item) => item.date === date && item.sectionId === sectionId);
  const entries = day ? Object.values(day.entries) : [];
  const sessionMarks = entries.flatMap((entry) => [entry.am, entry.pm]);
  const presentSessions = sessionMarks.filter((mark) => mark === "P").length;
  const absentSessions = sessionMarks.filter((mark) => mark === "A").length;
  const lateSessions = sessionMarks.filter((mark) => mark === "L").length;
  const excusedSessions = sessionMarks.filter((mark) => mark === "E").length;
  const rate = sessionMarks.length ? ((presentSessions + lateSessions + excusedSessions * 0.5) / sessionMarks.length) * 100 : 0;

  const monthPrefix = date.slice(0, 7);
  const monthDays = attendanceDays
    .filter((item) => item.sectionId === sectionId && item.date.startsWith(monthPrefix))
    .sort((a, b) => a.date.localeCompare(b.date));

  function saveSheet() {
    if (!canRecord) return;
    appendAudit({ userName: user.fullName, action: "Completed daily attendance", module: "Attendance", detail: `${sectionLabel(section)} - ${formatDate(date)}` });
    toast.success("Attendance saved", { description: `${sectionLabel(section)} for ${formatDate(date)} is ready for consolidation.` });
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={user.role === "teacher" ? "Assigned class" : canRecord ? "School attendance workspace" : "School attendance consolidation"}
        title={canRecord ? "Attendance" : "Attendance reports"}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate(`/portal/forms?form=sf2&section=${sectionId}&month=${monthPrefix}`)}><FileText size={17} /> Generate SF2</Button>
            {user.role !== "teacher" ? <Button variant="secondary" onClick={() => navigate(`/portal/forms?form=sf4&month=${monthPrefix}`)}><FileText size={17} /> Generate SF4</Button> : null}
            {canRecord ? <Button onClick={saveSheet}><Save size={17} /> Save attendance</Button> : null}
          </>
        }
      />

      <section className="context-bar">
        <Field label="Class section"><Select value={sectionId} onChange={(event) => setSectionId(event.target.value)}>{scopedSections.map((item) => <option value={item.id} key={item.id}>{sectionLabel(item)}</option>)}</Select></Field>
        <Field label="Attendance date">
          <div className="date-stepper"><Button variant="quiet" size="sm" onClick={() => setDate(shiftDate(date, -1))}><ChevronLeft size={17} /></Button><Input type="date" value={date} onChange={(event) => setDate(event.target.value)} /><Button variant="quiet" size="sm" onClick={() => setDate(shiftDate(date, 1))}><ChevronRight size={17} /></Button></div>
        </Field>
        <div className="context-bar__end"><Segmented value={mode} onChange={setMode} label="Attendance view" options={[{ value: "daily", label: canRecord ? "Daily sheet" : "Daily register" }, { value: "monthly", label: "Monthly summary" }]} /></div>
      </section>

      <MetricStrip items={[
        { label: "Class size", value: sectionLearners.length, detail: sectionLabel(section) },
        { label: "Attendance rate", value: `${rate.toFixed(1)}%`, detail: formatDate(date), tone: rate < 90 ? "warning" : "success" },
        { label: "Absent sessions", value: absentSessions, detail: `${(absentSessions / 2).toFixed(1)} day equivalent`, tone: absentSessions ? "danger" : "success" },
        { label: "Late / excused", value: `${lateSessions} / ${excusedSessions}`, detail: "AM and PM records", tone: lateSessions || excusedSessions ? "warning" : "neutral" },
      ]} />

      {mode === "daily" ? (
        <Panel
          title={`${sectionLabel(section)} - ${formatDate(date)}`}
          meta={`${canRecord ? "Recorded" : "Read only"} - ${day?.recordedBy ?? "No submitted record"}`}
          action={<div className="attendance-actions"><div className="search-field search-field--compact"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find learner" /></div>{canRecord ? <Button variant="secondary" size="sm" onClick={() => { markAllPresent(date, sectionId); toast.success("All learners marked present"); }}>Mark all present</Button> : null}</div>}
          flush
        >
          <TableFrame className="table-frame--borderless">
            <table className="data-table attendance-table">
              <thead><tr><th className="number-column">No.</th><th>Learner</th><th className="session-column">AM</th><th className="session-column">PM</th><th>Remarks</th><th>Indicator</th></tr></thead>
              <tbody>
                {sectionLearners.map((learner, index) => {
                  const entry = day?.entries[learner.id];
                  const displayEntry = entry ?? { am: "P" as const, pm: "P" as const, remarks: "" };
                  const summary = learnerAttendanceSummary(learner.id, attendanceDays);
                  return (
                    <tr className={summary.atRisk ? "row-danger" : undefined} key={learner.id}>
                      <td>{index + 1}</td>
                      <td><strong>{learnerName(learner)}</strong><small>LRN {learner.lrn}</small></td>
                      <td>{canRecord ? <AttendancePicker value={displayEntry.am} label={`${learner.firstName} AM attendance`} onChange={(mark) => setAttendanceMark(date, sectionId, learner.id, "am", mark)} /> : entry ? <Badge tone={entry.am === "A" ? "danger" : entry.am === "L" ? "warning" : "success"}>{entry.am}</Badge> : "-"}</td>
                      <td>{canRecord ? <AttendancePicker value={displayEntry.pm} label={`${learner.firstName} PM attendance`} onChange={(mark) => setAttendanceMark(date, sectionId, learner.id, "pm", mark)} /> : entry ? <Badge tone={entry.pm === "A" ? "danger" : entry.pm === "L" ? "warning" : "success"}>{entry.pm}</Badge> : "-"}</td>
                      <td>{canRecord ? <input className="table-input table-input--remarks" value={displayEntry.remarks} placeholder="Optional note" onChange={(event) => setAttendanceRemarks(date, sectionId, learner.id, event.target.value)} /> : entry?.remarks || "-"}</td>
                      <td>{summary.atRisk ? <Badge tone="danger">20% warning</Badge> : <Badge tone="success">On track</Badge>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableFrame>
          <div className="attendance-legend"><span><i className="mark-p" />P Present</span><span><i className="mark-a" />A Absent</span><span><i className="mark-l" />L Late</span><span><i className="mark-e" />E Excused</span></div>
        </Panel>
      ) : (
        <Panel title={`${new Intl.DateTimeFormat("en-PH", { month: "long", year: "numeric" }).format(new Date(`${monthPrefix}-01T00:00:00`))} summary`} meta={sectionLabel(section)} flush>
          <TableFrame className="table-frame--borderless monthly-attendance-frame">
            <table className="data-table monthly-attendance-table">
              <thead><tr><th className="sticky-name">Learner</th>{monthDays.map((item) => <th key={item.id}>{new Date(`${item.date}T00:00:00`).getDate()}</th>)}<th>Absent</th><th>Rate</th></tr></thead>
              <tbody>{sectionLearners.map((learner) => { const summary = learnerAttendanceSummary(learner.id, monthDays); return <tr className={summary.atRisk ? "row-danger" : undefined} key={learner.id}><td className="sticky-name"><strong>{learnerName(learner)}</strong></td>{monthDays.map((item) => { const entry = item.entries[learner.id]; const mark = entry?.am === "A" && entry?.pm === "A" ? "A" : entry?.am === "L" || entry?.pm === "L" ? "L" : entry?.am === "E" || entry?.pm === "E" ? "E" : ""; return <td className={mark ? `monthly-mark monthly-mark--${mark.toLowerCase()}` : undefined} key={item.id}>{mark}</td>; })}<td><strong>{summary.absentEquivalent.toFixed(1)}</strong></td><td><Badge tone={summary.atRisk ? "danger" : "success"}>{summary.rate.toFixed(1)}%</Badge></td></tr>; })}</tbody>
            </table>
          </TableFrame>
        </Panel>
      )}
    </div>
  );
}
