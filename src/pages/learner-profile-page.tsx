import { useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Edit3, FileText, Phone, UserRound } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { Badge, Button, Field, Input, MetricStrip, Modal, PageHeader, Panel, Progress, Segmented, Select, TableFrame } from "../components/ui";
import { gradeTone, numericDescriptor } from "../lib/grade-engine";
import { learnerAcademicSummary, learnerAttendanceSummary, sectionLabel, visibleLearners } from "../lib/selectors";
import { formatDate, learnerName } from "../lib/utils";
import { useAppStore } from "../store/use-app-store";

type Tab = "overview" | "attendance" | "academics" | "history";

export function LearnerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [editAddress, setEditAddress] = useState("");
  const [editGuardian, setEditGuardian] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editSectionId, setEditSectionId] = useState("");
  const currentUserId = useAppStore((state) => state.currentUserId);
  const users = useAppStore((state) => state.users);
  const learners = useAppStore((state) => state.learners);
  const sections = useAppStore((state) => state.sections);
  const subjects = useAppStore((state) => state.subjects);
  const gradeSheets = useAppStore((state) => state.gradeSheets);
  const attendanceDays = useAppStore((state) => state.attendanceDays);
  const updateLearner = useAppStore((state) => state.updateLearner);
  const user = users.find((candidate) => candidate.id === currentUserId)!;
  const learner = visibleLearners(user, learners).find((candidate) => candidate.id === id);
  const section = sections.find((candidate) => candidate.id === learner?.sectionId);
  const academic = useMemo(() => learner ? learnerAcademicSummary(learner, subjects, gradeSheets) : null, [learner, subjects, gradeSheets]);
  const attendance = useMemo(() => learner ? learnerAttendanceSummary(learner.id, attendanceDays) : null, [learner, attendanceDays]);

  if (!learner || !academic || !attendance) {
    return <div className="page-stack"><Button variant="secondary" onClick={() => navigate("/learners")}><ArrowLeft size={17} /> Back to learners</Button><Panel><p>This learner record is not available within your assigned access.</p></Panel></div>;
  }

  const recentAttendance = attendanceDays
    .filter((day) => day.entries[learner.id])
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);
  return (
    <div className="page-stack">
      <Button className="back-button" variant="quiet" size="sm" onClick={() => navigate("/learners")}><ArrowLeft size={17} /> Learner records</Button>
      <PageHeader
        eyebrow={`LRN ${learner.lrn}`}
        title={`${learner.firstName} ${learner.middleName[0]}. ${learner.lastName}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate(`/forms?form=sf9&learner=${learner.id}`)}><FileText size={17} /> SF9</Button>
            <Button variant="secondary" onClick={() => navigate(`/forms?form=sf10&learner=${learner.id}`)}><FileText size={17} /> SF10</Button>
            {user.role !== "teacher" ? <Button onClick={() => { setEditAddress(learner.address); setEditGuardian(learner.guardianName); setEditContact(learner.guardianContact); setEditSectionId(learner.sectionId); setEditOpen(true); }}><Edit3 size={17} /> Edit record</Button> : null}
          </>
        }
      />

      <div className="learner-record-banner">
        <div className="learner-record-banner__identity"><span>{learner.firstName[0]}{learner.lastName[0]}</span><div><strong>{sectionLabel(section)}</strong><small>{learner.sex} - Born {formatDate(learner.birthDate)}</small></div></div>
        <Badge tone={learner.enrollmentStatus === "Enrolled" ? "success" : "info"} dot>{learner.enrollmentStatus}</Badge>
        <div className="learner-record-banner__contact"><UserRound size={17} /><span><small>Guardian</small><strong>{learner.guardianName}</strong></span></div>
        <div className="learner-record-banner__contact"><Phone size={17} /><span><small>Contact</small><strong>{learner.guardianContact}</strong></span></div>
      </div>

      <MetricStrip items={[
        { label: "General average", value: academic.generalAverage, detail: numericDescriptor(academic.generalAverage).label, tone: gradeTone(academic.generalAverage) },
        { label: "Attendance rate", value: `${attendance.rate.toFixed(1)}%`, detail: `${attendance.classDays} recorded days`, tone: attendance.atRisk ? "danger" : "success" },
        { label: "Learning areas below 75", value: academic.failingSubjects.length, detail: academic.failingSubjects.length ? "Needs remediation" : "All learning areas passed", tone: academic.failingSubjects.length ? "danger" : "success" },
        { label: "Promotion status", value: learner.promotionStatus, detail: "Current review decision", tone: learner.promotionStatus === "Promoted" ? "success" : "info" },
      ]} />

      <Segmented value={tab} onChange={setTab} label="Learner record view" options={[
        { value: "overview", label: "Overview" },
        { value: "attendance", label: "Attendance" },
        { value: "academics", label: "Academic record" },
        { value: "history", label: "Enrollment history" },
      ]} />

      {tab === "overview" ? (
        <div className="record-grid">
          <Panel title="Learner information" meta="Active identity record">
            <dl className="definition-grid">
              <div><dt>Full name</dt><dd>{learnerName(learner)}</dd></div>
              <div><dt>LRN</dt><dd className="mono-cell">{learner.lrn}</dd></div>
              <div><dt>Sex</dt><dd>{learner.sex}</dd></div>
              <div><dt>Date of birth</dt><dd>{formatDate(learner.birthDate)}</dd></div>
              <div className="definition-grid__wide"><dt>Address</dt><dd>{learner.address}</dd></div>
              <div><dt>Enrollment date</dt><dd>{formatDate(learner.enrolledOn)}</dd></div>
              <div><dt>Class adviser</dt><dd>{section?.adviserName}</dd></div>
            </dl>
          </Panel>
          <Panel title="Current indicators" meta="Computed from connected records">
            <div className="indicator-list">
              <div><span>Academic standing</span><strong>{numericDescriptor(academic.generalAverage).label}</strong><Progress value={academic.generalAverage} tone={gradeTone(academic.generalAverage)} /></div>
              <div><span>Attendance participation</span><strong>{attendance.rate.toFixed(1)}%</strong><Progress value={attendance.rate} tone={attendance.atRisk ? "danger" : "success"} /></div>
              <div><span>Recorded absences</span><strong>{attendance.absentEquivalent.toFixed(1)} days</strong><small>{attendance.atRisk ? "Above the monitoring threshold" : "Within the current monitoring threshold"}</small></div>
              <div><span>Late arrivals</span><strong>{attendance.lateCount}</strong><small>Across AM and PM sessions</small></div>
            </div>
          </Panel>
        </div>
      ) : null}

      {tab === "attendance" ? (
        <Panel title="Attendance history" meta="Most recent recorded school days" flush>
          <TableFrame className="table-frame--borderless"><table className="data-table"><thead><tr><th>Date</th><th>AM</th><th>PM</th><th>Remarks</th></tr></thead><tbody>{recentAttendance.map((day) => { const entry = day.entries[learner.id]; return <tr key={day.id}><td><strong>{formatDate(day.date)}</strong></td><td><Badge tone={entry.am === "A" ? "danger" : entry.am === "L" ? "warning" : "success"}>{entry.am}</Badge></td><td><Badge tone={entry.pm === "A" ? "danger" : entry.pm === "L" ? "warning" : "success"}>{entry.pm}</Badge></td><td>{entry.remarks || "-"}</td></tr>; })}</tbody></table></TableFrame>
        </Panel>
      ) : null}

      {tab === "academics" ? (
        <Panel title="Learning progress and achievement" meta="Three-term academic record" flush>
          <TableFrame className="table-frame--borderless"><table className="data-table academic-record-table"><thead><tr><th>Learning area</th><th>Term 1</th><th>Term 2</th><th>Term 3</th><th>Final grade</th><th>Descriptor</th></tr></thead><tbody>{academic.subjectGrades.map((item) => <tr className={item.finalGrade < 75 ? "row-danger" : undefined} key={item.subject.id}><td><strong>{item.subject.name}</strong></td>{item.terms.map((grade, index) => <td key={index}>{grade}</td>)}<td><Badge tone={gradeTone(item.finalGrade)}>{item.finalGrade}</Badge></td><td>{numericDescriptor(item.finalGrade).label}</td></tr>)}</tbody><tfoot><tr><td colSpan={4}>General Average</td><td><strong>{academic.generalAverage}</strong></td><td>{numericDescriptor(academic.generalAverage).label}</td></tr></tfoot></table></TableFrame>
        </Panel>
      ) : null}

      {tab === "history" ? (
        <Panel title="Enrollment continuity" meta="School-year record trail">
          <div className="timeline-list">
            {[...learner.enrollmentHistory, { schoolYear: "2026-2027", gradeLevel: learner.gradeLevel, section: section?.name ?? "Unassigned", school: "Balili Elementary School", status: learner.enrollmentStatus }].reverse().map((item) => (
              <div className="timeline-list__item" key={`${item.schoolYear}-${item.gradeLevel}`}><span><CalendarDays size={17} /></span><div><strong>{item.schoolYear} - {item.gradeLevel} {item.section}</strong><small>{item.school}</small></div><Badge tone={item.status === "Completed" || item.status === "Enrolled" ? "success" : "info"}>{item.status}</Badge></div>
            ))}
          </div>
        </Panel>
      ) : null}

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit learner record"
        description="Update current contact and class assignment information."
        size="md"
        footer={<><Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button><Button onClick={() => { updateLearner(learner.id, { address: editAddress, guardianName: editGuardian, guardianContact: editContact, sectionId: editSectionId, gradeLevel: sections.find((item) => item.id === editSectionId)?.gradeLevel ?? learner.gradeLevel }); setEditOpen(false); }}>Save changes</Button></>}
      >
        <div className="form-grid">
          <Field className="form-grid__wide" label="Complete address"><Input value={editAddress} onChange={(event) => setEditAddress(event.target.value)} /></Field>
          <Field label="Guardian name"><Input value={editGuardian} onChange={(event) => setEditGuardian(event.target.value)} /></Field>
          <Field label="Guardian contact"><Input value={editContact} onChange={(event) => setEditContact(event.target.value)} /></Field>
          <Field className="form-grid__wide" label="Active class"><Select value={editSectionId} onChange={(event) => setEditSectionId(event.target.value)}>{sections.map((item) => <option value={item.id} key={item.id}>{sectionLabel(item)}</option>)}</Select></Field>
        </div>
      </Modal>
    </div>
  );
}
