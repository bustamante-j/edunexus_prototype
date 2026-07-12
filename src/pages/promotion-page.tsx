import { useMemo, useState } from "react";
import { CheckCheck, GraduationCap, Search, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Badge, Button, Field, MetricStrip, Modal, PageHeader, Panel, Select, TableFrame } from "../components/ui";
import { GRADE_LEVELS, learnerAcademicSummary, learnerAttendanceSummary, nextGradeLevel, sectionLabel } from "../lib/selectors";
import { learnerName } from "../lib/utils";
import { useAppStore } from "../store/use-app-store";
import type { GradeLevel, PromotionStatus } from "../types/domain";

export function PromotionPage() {
  const learners = useAppStore((state) => state.learners);
  const sections = useAppStore((state) => state.sections);
  const subjects = useAppStore((state) => state.subjects);
  const gradeSheets = useAppStore((state) => state.gradeSheets);
  const attendanceDays = useAppStore((state) => state.attendanceDays);
  const promoteLearners = useAppStore((state) => state.promoteLearners);
  const [gradeFilter, setGradeFilter] = useState<GradeLevel>("Grade 4");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [decision, setDecision] = useState<PromotionStatus>("Promoted");
  const targetGrade = nextGradeLevel(gradeFilter);
  const targetSections = sections.filter((section) => section.gradeLevel === targetGrade);
  const [targetSectionId, setTargetSectionId] = useState(targetSections[0]?.id ?? "");

  const records = useMemo(() => learners
    .filter((learner) => learner.gradeLevel === gradeFilter)
    .filter((learner) => sectionFilter === "all" || learner.sectionId === sectionFilter)
    .filter((learner) => `${learner.firstName} ${learner.middleName} ${learner.lastName} ${learner.lrn}`.toLowerCase().includes(search.toLowerCase()))
    .map((learner) => {
      const academic = learnerAcademicSummary(learner, subjects, gradeSheets);
      const attendance = learnerAttendanceSummary(learner.id, attendanceDays);
      const eligible = !academic.failingSubjects.length && !attendance.atRisk;
      const reason = academic.failingSubjects.length
        ? `${academic.failingSubjects.length} learning area${academic.failingSubjects.length === 1 ? "" : "s"} below 75`
        : attendance.atRisk
          ? "Attendance exceeds 20% threshold"
          : "Meets academic and attendance standards";
      return { learner, academic, attendance, eligible, reason };
    })
    .sort((a, b) => a.learner.lastName.localeCompare(b.learner.lastName)), [learners, gradeFilter, sectionFilter, search, subjects, gradeSheets, attendanceDays]);

  const eligibleCount = records.filter((record) => record.eligible).length;
  const academicHold = records.filter((record) => record.academic.failingSubjects.length).length;
  const attendanceHold = records.filter((record) => record.attendance.atRisk).length;
  const pending = records.filter((record) => record.learner.promotionStatus === "Pending review").length;
  const gradeSections = sections.filter((section) => section.gradeLevel === gradeFilter);

  function toggleAllEligible() {
    const eligibleIds = records.filter((record) => record.eligible).map((record) => record.learner.id);
    setSelected(selected.length === eligibleIds.length ? [] : eligibleIds);
  }

  function applyDecision() {
    const destination = targetSections.some((section) => section.id === targetSectionId) ? targetSectionId : targetSections[0]?.id ?? "";
    promoteLearners(selected, targetGrade, destination, decision);
    toast.success("Promotion records updated", { description: `${selected.length} learner decision${selected.length === 1 ? "" : "s"} saved as ${decision.toLowerCase()}.` });
    setSelected([]);
    setConfirmOpen(false);
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="End-of-school-year record review"
        title="Promotion"
        actions={<Button disabled={!selected.length} onClick={() => setConfirmOpen(true)}><GraduationCap size={17} /> Review {selected.length || ""} selected</Button>}
      />

      <section className="context-bar">
        <Field label="Source grade"><Select value={gradeFilter} onChange={(event) => { const grade = event.target.value as GradeLevel; setGradeFilter(grade); setSectionFilter("all"); setSelected([]); const next = nextGradeLevel(grade); setTargetSectionId(sections.find((section) => section.gradeLevel === next)?.id ?? ""); }}>{GRADE_LEVELS.filter((grade) => grade !== "Kindergarten").map((grade) => <option key={grade}>{grade}</option>)}</Select></Field>
        <Field label="Source section"><Select value={sectionFilter} onChange={(event) => { setSectionFilter(event.target.value); setSelected([]); }}><option value="all">All {gradeFilter} sections</option>{gradeSections.map((section) => <option value={section.id} key={section.id}>{sectionLabel(section)}</option>)}</Select></Field>
        <div className="context-bar__end"><div className="search-field search-field--compact"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find learner" /></div></div>
      </section>

      <MetricStrip items={[
        { label: "Ready for promotion", value: eligibleCount, detail: "Meets grade and attendance standards", tone: "success" },
        { label: "Academic remediation", value: academicHold, detail: "One or more final grades below 75", tone: academicHold ? "danger" : "success" },
        { label: "Attendance review", value: attendanceHold, detail: "Absences above 20% threshold", tone: attendanceHold ? "warning" : "success" },
        { label: "Pending decisions", value: pending, detail: `${gradeFilter} records`, tone: pending ? "info" : "success" },
      ]} />

      <Panel
        title={`${gradeFilter} promotion readiness`}
        meta="Computed from final learning-area grades and recorded attendance"
        action={<Button variant="secondary" size="sm" onClick={toggleAllEligible}><CheckCheck size={16} /> {selected.length === eligibleCount && eligibleCount ? "Clear selection" : "Select eligible"}</Button>}
        flush
      >
        <TableFrame className="table-frame--borderless">
          <table className="data-table promotion-table">
            <thead><tr><th className="check-column"><input type="checkbox" aria-label="Select all eligible learners" checked={Boolean(eligibleCount) && selected.length === eligibleCount} onChange={toggleAllEligible} /></th><th>Learner</th><th>Class</th><th>General average</th><th>Failed areas</th><th>Attendance</th><th>Recommendation</th><th>Decision</th></tr></thead>
            <tbody>{records.map((record) => { const section = sections.find((candidate) => candidate.id === record.learner.sectionId); return <tr className={!record.eligible ? "row-warning" : undefined} key={record.learner.id}><td><input type="checkbox" aria-label={`Select ${record.learner.firstName} ${record.learner.lastName}`} checked={selected.includes(record.learner.id)} onChange={() => setSelected((current) => current.includes(record.learner.id) ? current.filter((id) => id !== record.learner.id) : [...current, record.learner.id])} /></td><td><strong>{learnerName(record.learner)}</strong><small>LRN {record.learner.lrn}</small></td><td>{sectionLabel(section)}</td><td><Badge tone={record.academic.generalAverage < 75 ? "danger" : record.academic.generalAverage < 80 ? "warning" : "success"}>{record.academic.generalAverage}</Badge></td><td>{record.academic.failingSubjects.length ? <span className="danger-text">{record.academic.failingSubjects.map((item) => item.subject.code).join(", ")}</span> : "None"}</td><td><strong>{record.attendance.rate.toFixed(1)}%</strong><small>{record.attendance.absentEquivalent.toFixed(1)} absence days</small></td><td><Badge tone={record.eligible ? "success" : "warning"}>{record.eligible ? "Promote" : "Review"}</Badge><small>{record.reason}</small></td><td><Badge tone={record.learner.promotionStatus === "Promoted" ? "success" : record.learner.promotionStatus === "For remediation" ? "warning" : "info"}>{record.learner.promotionStatus}</Badge></td></tr>; })}</tbody>
          </table>
        </TableFrame>
      </Panel>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm promotion decision"
        description={`${selected.length} learner record${selected.length === 1 ? "" : "s"} selected from ${gradeFilter}.`}
        size="md"
        footer={<><Button variant="secondary" onClick={() => setConfirmOpen(false)}>Cancel</Button><Button onClick={applyDecision}>Save decisions</Button></>}
      >
        <div className="promotion-dialog">
          <div className="promotion-flow"><span>{gradeFilter}</span><GraduationCap size={20} /><span>{targetGrade}</span></div>
          <Field label="Decision"><Select value={decision} onChange={(event) => setDecision(event.target.value as PromotionStatus)}><option>Promoted</option><option>For remediation</option><option>Retained</option></Select></Field>
          {decision === "Promoted" && gradeFilter !== "Grade 6" ? <Field label="Target section"><Select value={targetSectionId} onChange={(event) => setTargetSectionId(event.target.value)}>{targetSections.map((section) => <option value={section.id} key={section.id}>{sectionLabel(section)}</option>)}</Select></Field> : null}
          {selected.some((id) => !records.find((record) => record.learner.id === id)?.eligible) ? <div className="promotion-warning"><ShieldAlert size={19} /><span><strong>Manual review included</strong>One or more selected learners has an academic or attendance hold. Confirm supporting documentation before finalizing.</span></div> : null}
        </div>
      </Modal>
    </div>
  );
}

