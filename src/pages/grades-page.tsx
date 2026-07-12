import { useEffect, useMemo, useState } from "react";
import { Download, FileText, Info, Save, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  Badge,
  Button,
  Field,
  InlineNotice,
  MetricStrip,
  Modal,
  PageHeader,
  Panel,
  Segmented,
  Select,
  TableFrame,
} from "../components/ui";
import {
  computeGrade,
  descriptiveDescriptor,
  gradeTone,
  HIGHEST_POSSIBLE_SCORES,
  SUBJECT_WEIGHTS,
} from "../lib/grade-engine";
import { sectionLabel, visibleSections } from "../lib/selectors";
import { downloadTextFile, learnerName } from "../lib/utils";
import { useAppStore } from "../store/use-app-store";
import type { DescriptiveMark, ScoreSet, Term } from "../types/domain";

const components: Array<{ key: keyof ScoreSet; labels: string[] }> = [
  { key: "ww", labels: ["WW1", "WW2", "WW3"] },
  { key: "pt", labels: ["PT1", "PT2", "PT3"] },
  { key: "exams", labels: ["ST1", "ST2", "TE"] },
];

export function GradesPage() {
  const navigate = useNavigate();
  const currentUserId = useAppStore((state) => state.currentUserId);
  const users = useAppStore((state) => state.users);
  const sections = useAppStore((state) => state.sections);
  const subjects = useAppStore((state) => state.subjects);
  const learners = useAppStore((state) => state.learners);
  const gradeSheets = useAppStore((state) => state.gradeSheets);
  const descriptiveSheets = useAppStore((state) => state.descriptiveSheets);
  const ensureGradeSheet = useAppStore((state) => state.ensureGradeSheet);
  const ensureDescriptiveSheet = useAppStore((state) => state.ensureDescriptiveSheet);
  const updateGradeScore = useAppStore((state) => state.updateGradeScore);
  const updateDescriptiveMark = useAppStore((state) => state.updateDescriptiveMark);
  const appendAudit = useAppStore((state) => state.appendAudit);
  const user = users.find((candidate) => candidate.id === currentUserId)!;
  const scopedSections = visibleSections(user, sections).filter((section) => section.gradeLevel !== "Kindergarten");
  const [sectionId, setSectionId] = useState(scopedSections.find((section) => section.id === "grade-4-narra")?.id ?? scopedSections[0]?.id ?? "");
  const [subjectId, setSubjectId] = useState(subjects[2].id);
  const [term, setTerm] = useState<Term>(1);
  const [view, setView] = useState<"entry" | "results">("entry");
  const [search, setSearch] = useState("");
  const [policyOpen, setPolicyOpen] = useState(false);
  const section = sections.find((candidate) => candidate.id === sectionId);
  const subject = subjects.find((candidate) => candidate.id === subjectId)!;
  const isDescriptive = section?.gradeLevel === "Grade 1";
  const sheetId = `${sectionId}-${subjectId}-term-${term}`;
  const descriptiveSheetId = `${sheetId}-descriptive`;

  useEffect(() => {
    if (!sectionId || !subjectId) return;
    if (isDescriptive) ensureDescriptiveSheet(sectionId, subjectId, term);
    else ensureGradeSheet(sectionId, subjectId, term);
  }, [sectionId, subjectId, term, isDescriptive, ensureGradeSheet, ensureDescriptiveSheet]);

  const sheet = gradeSheets.find((item) => item.id === sheetId);
  const descriptiveSheet = descriptiveSheets.find((item) => item.id === descriptiveSheetId);
  const classLearners = useMemo(
    () => learners
      .filter((learner) => learner.sectionId === sectionId)
      .filter((learner) => `${learner.firstName} ${learner.middleName} ${learner.lastName} ${learner.lrn}`.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.lastName.localeCompare(b.lastName)),
    [learners, sectionId, search],
  );

  const computedRows = useMemo(() => {
    if (!sheet) return [];
    return classLearners.map((learner) => {
      const row = sheet.rows.find((item) => item.learnerId === learner.id);
      return row ? { learner, row, result: computeGrade(row.scores, subject) } : null;
    }).filter(Boolean) as Array<{ learner: (typeof classLearners)[number]; row: NonNullable<typeof sheet>["rows"][number]; result: ReturnType<typeof computeGrade> }>;
  }, [sheet, classLearners, subject]);

  const classAverage = computedRows.length ? computedRows.reduce((total, item) => total + item.result.transmutedGrade, 0) / computedRows.length : 0;
  const passing = computedRows.filter((item) => item.result.transmutedGrade >= 75).length;
  const needsSupport = computedRows.filter((item) => item.result.transmutedGrade < 75);
  const weights = SUBJECT_WEIGHTS[subject.category];

  function saveRecord() {
    appendAudit({ userName: user.fullName, action: "Updated class record", module: "Grades", detail: `${sectionLabel(section)} - ${subject.name} - Term ${term}` });
    toast.success("Class record saved", { description: `${subject.name} Term ${term} computations are ready for reporting.` });
  }

  function exportClassRecord() {
    const lines = computedRows.map((item) => [item.learner.lrn, learnerName(item.learner), item.result.wwPercent.toFixed(2), item.result.ptPercent.toFixed(2), item.result.examPercent.toFixed(2), item.result.initialGrade.toFixed(2), item.result.transmutedGrade, item.result.descriptor.label].map((value) => `"${value}"`).join(","));
    downloadTextFile(`${sectionId}-${subjectId}-term-${term}.csv`, ["LRN,Learner,WW Percentage,PT Percentage,EX Percentage,Initial Grade,Term Grade,Descriptor", ...lines].join("\n"));
    toast.success("Class record downloaded");
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Revised classroom assessment - SY 2026-2027"
        title="Class records"
        actions={
          <>
            <Button variant="secondary" onClick={() => setPolicyOpen(true)}><Info size={17} /> Grading policy</Button>
            <Button variant="secondary" disabled={isDescriptive} onClick={exportClassRecord}><Download size={17} /> Download sheet</Button>
            <Button onClick={saveRecord}><Save size={17} /> Save class record</Button>
          </>
        }
      />

      <section className="context-bar context-bar--grades">
        <Field label="Class section"><Select value={sectionId} onChange={(event) => setSectionId(event.target.value)}>{scopedSections.map((item) => <option value={item.id} key={item.id}>{sectionLabel(item)}</option>)}</Select></Field>
        <Field label="Learning area"><Select value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>{subjects.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</Select></Field>
        <Field label="Academic term"><Select value={term} onChange={(event) => setTerm(Number(event.target.value) as Term)}><option value={1}>Term 1</option><option value={2}>Term 2</option><option value={3}>Term 3</option></Select></Field>
        <div className="context-bar__end"><Segmented value={view} onChange={setView} label="Class record display" options={[{ value: "entry", label: "Score entry" }, { value: "results", label: "Computed results" }]} /></div>
      </section>

      {isDescriptive ? (
        <InlineNotice tone="info" title="Descriptive grading is active">
          Grade 1 uses A-E qualitative descriptors for SY 2026-2027. Numerical grades are not used for parent reporting.
        </InlineNotice>
      ) : (
        <MetricStrip items={[
          { label: "Learners", value: computedRows.length, detail: sectionLabel(section) },
          { label: "Class average", value: classAverage.toFixed(1), detail: subject.name, tone: classAverage < 80 ? "warning" : "info" },
          { label: "Meeting standard", value: passing, detail: `${computedRows.length ? ((passing / computedRows.length) * 100).toFixed(1) : 0}% at 75 or above`, tone: "success" },
          { label: "Needs remediation", value: needsSupport.length, detail: "Term grade below 75", tone: needsSupport.length ? "danger" : "success" },
        ]} />
      )}

      <Panel
        title={`${subject.name} - Term ${term}`}
        meta={`${sectionLabel(section)} - ${isDescriptive ? "Descriptive reporting" : `${weights.ww * 100}% WW - ${weights.pt * 100}% PT - ${weights.exams * 100}% EX`}`}
        action={<div className="search-field search-field--compact"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find learner" /></div>}
        flush
      >
        {isDescriptive ? (
          <TableFrame className="table-frame--borderless">
            <table className="data-table descriptive-table">
              <thead><tr><th>No.</th><th>Learner</th><th>Descriptor</th><th>Meaning</th><th>Reporting note</th></tr></thead>
              <tbody>{classLearners.map((learner, index) => { const mark = descriptiveSheet?.marks[learner.id] ?? "C"; const descriptor = descriptiveDescriptor(mark); return <tr key={learner.id}><td>{index + 1}</td><td><strong>{learnerName(learner)}</strong><small>LRN {learner.lrn}</small></td><td><Select value={mark} onChange={(event) => updateDescriptiveMark(descriptiveSheetId, learner.id, event.target.value as DescriptiveMark)}><option value="A">A - Advancing</option><option value="B">B - Benchmarking</option><option value="C">C - Connecting</option><option value="D">D - Developing</option><option value="E">E - Emerging</option></Select></td><td><strong>{descriptor.label}</strong><small>{descriptor.Filipino}</small></td><td>{mark === "A" || mark === "B" ? "Independent and consistent" : mark === "C" ? "Occasional guidance" : "Targeted learner support"}</td></tr>; })}</tbody>
            </table>
          </TableFrame>
        ) : view === "entry" ? (
          <TableFrame className="table-frame--borderless grade-entry-frame">
            <table className="grade-entry-table">
              <thead>
                <tr><th rowSpan={3} className="sticky-name">Learner</th><th colSpan={3} className="component-head component-head--ww">Written / Oral Works</th><th colSpan={3} className="component-head component-head--pt">Performance Tasks</th><th colSpan={3} className="component-head component-head--ex">Summative Tests & Exam</th><th colSpan={5} className="component-head component-head--result">Computed grade</th></tr>
                <tr>{components.flatMap((component) => component.labels.map((label) => <th key={`${component.key}-${label}`}>{label}</th>))}<th rowSpan={2}>WW</th><th rowSpan={2}>PT</th><th rowSpan={2}>EX</th><th rowSpan={2}>IG</th><th rowSpan={2}>TG</th></tr>
                <tr>{Object.values(HIGHEST_POSSIBLE_SCORES).flatMap((values, componentIndex) => values.map((highest, index) => <th className="hps-cell" key={`${componentIndex}-${index}`}>{highest}</th>))}</tr>
              </thead>
              <tbody>{computedRows.map((item, rowIndex) => <tr className={item.result.transmutedGrade < 75 ? "row-danger" : undefined} key={item.learner.id}><td className="sticky-name"><span>{rowIndex + 1}</span><strong>{learnerName(item.learner)}</strong><small>{item.learner.lrn}</small></td>{components.flatMap((component) => item.row.scores[component.key].map((score, index) => { const max = HIGHEST_POSSIBLE_SCORES[component.key][index]; return <td key={`${component.key}-${index}`}><input aria-label={`${item.learner.firstName} ${component.labels[index]}`} className="score-input" type="number" min={0} max={max} value={score} onChange={(event) => updateGradeScore(sheetId, item.learner.id, component.key, index, Math.min(max, Math.max(0, Number(event.target.value))))} /></td>; }))}<td>{item.result.wwWeighted.toFixed(1)}</td><td>{item.result.ptWeighted.toFixed(1)}</td><td>{item.result.examWeighted.toFixed(1)}</td><td><strong>{item.result.initialGrade.toFixed(1)}</strong></td><td><Badge tone={gradeTone(item.result.transmutedGrade)}>{item.result.transmutedGrade}</Badge></td></tr>)}</tbody>
            </table>
          </TableFrame>
        ) : (
          <TableFrame className="table-frame--borderless">
            <table className="data-table grade-results-table">
              <thead><tr><th>No.</th><th>Learner</th><th>WW weighted</th><th>PT weighted</th><th>EX weighted</th><th>Initial grade</th><th>Term grade</th><th>Descriptor</th><th /></tr></thead>
              <tbody>{computedRows.map((item, index) => <tr className={item.result.transmutedGrade < 75 ? "row-danger" : undefined} key={item.learner.id}><td>{index + 1}</td><td><strong>{learnerName(item.learner)}</strong><small>LRN {item.learner.lrn}</small></td><td>{item.result.wwWeighted.toFixed(2)}</td><td>{item.result.ptWeighted.toFixed(2)}</td><td>{item.result.examWeighted.toFixed(2)}</td><td>{item.result.initialGrade.toFixed(2)}</td><td><Badge tone={gradeTone(item.result.transmutedGrade)}>{item.result.transmutedGrade}</Badge></td><td><strong>{item.result.descriptor.label}</strong><small>{item.result.descriptor.Filipino}</small></td><td><Button size="sm" variant="quiet" onClick={() => navigate(`/portal/forms?form=sf9&learner=${item.learner.id}`)}><FileText size={15} /> SF9</Button></td></tr>)}</tbody>
            </table>
          </TableFrame>
        )}
      </Panel>

      {!isDescriptive && needsSupport.length ? (
        <Panel title="Learners below the term standard" meta="Prioritize remediation and parent communication" flush>
          <TableFrame className="table-frame--borderless"><table className="data-table"><thead><tr><th>Learner</th><th>Initial grade</th><th>Term grade</th><th>Gap to 75</th><th>Recommended action</th></tr></thead><tbody>{needsSupport.map((item) => <tr className="row-danger" key={item.learner.id}><td><strong>{learnerName(item.learner)}</strong><small>{item.learner.lrn}</small></td><td>{item.result.initialGrade.toFixed(2)}</td><td><Badge tone="danger">{item.result.transmutedGrade}</Badge></td><td>{75 - item.result.transmutedGrade} point{75 - item.result.transmutedGrade === 1 ? "" : "s"}</td><td>Targeted remediation and score validation</td></tr>)}</tbody></table></TableFrame>
        </Panel>
      ) : null}

      <Modal open={policyOpen} onClose={() => setPolicyOpen(false)} title="Grading policy used by EduNexus" description="Current prototype calculations for SY 2026-2027" size="lg" footer={<Button onClick={() => setPolicyOpen(false)}>Done</Button>}>
        <div className="policy-summary">
          <InlineNotice tone="info" title="Revised three-term assessment">The prototype follows DepEd Order No. 15, s. 2026 for the current school year and uses the adjusted transmutation table.</InlineNotice>
          <div className="policy-steps"><div><span>1</span><p><strong>Total raw scores</strong>Add all scores under WW, PT, ST1, ST2, and the term examination.</p></div><div><span>2</span><p><strong>Percentage scores</strong>Divide each component total by its highest possible score, then multiply by 100.</p></div><div><span>3</span><p><strong>Weighted scores</strong>Apply 20/50/30 for most learning areas or 20/60/20 for EPP and MAPEH.</p></div><div><span>4</span><p><strong>Initial grade</strong>Add the weighted component scores. EX uses 30% ST1, 30% ST2, and 40% term exam internally.</p></div><div><span>5</span><p><strong>Term grade</strong>Apply the SY 2026-2027 adjusted transmutation table. An initial grade of 70 becomes a passing term grade of 75.</p></div></div>
          <div className="descriptor-grid"><span><strong>90-100</strong>Advancing</span><span><strong>80-89</strong>Benchmarking</span><span><strong>75-79</strong>Connecting</span><span><strong>65-74</strong>Developing</span><span><strong>0-64</strong>Emerging</span></div>
        </div>
      </Modal>
    </div>
  );
}
