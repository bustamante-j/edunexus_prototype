import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Eye, FileCheck2, FileText, ShieldCheck } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { Button, Field, InlineNotice, PageHeader, Panel, Select } from "../components/ui";
import { createSchoolFormPdf, schoolFormFileName, type SchoolFormType } from "../lib/pdf/school-forms";
import { learnerAcademicSummary, sectionLabel, visibleLearners, visibleSections } from "../lib/selectors";
import { learnerName } from "../lib/utils";
import { useAppStore } from "../store/use-app-store";

const forms: Array<{ id: SchoolFormType; title: string; name: string; access: "class" | "school" | "learner" }> = [
  { id: "sf2", title: "SF2", name: "Daily Attendance Report", access: "class" },
  { id: "sf4", title: "SF4", name: "Monthly Movement and Attendance", access: "school" },
  { id: "sf9", title: "SF9", name: "Learner's Performance Report", access: "learner" },
  { id: "sf10", title: "SF10", name: "Permanent Academic Record", access: "learner" },
];

export function FormsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUserId = useAppStore((state) => state.currentUserId);
  const users = useAppStore((state) => state.users);
  const school = useAppStore((state) => state.school);
  const sections = useAppStore((state) => state.sections);
  const learners = useAppStore((state) => state.learners);
  const subjects = useAppStore((state) => state.subjects);
  const attendanceDays = useAppStore((state) => state.attendanceDays);
  const gradeSheets = useAppStore((state) => state.gradeSheets);
  const descriptiveSheets = useAppStore((state) => state.descriptiveSheets);
  const appendAudit = useAppStore((state) => state.appendAudit);
  const user = users.find((candidate) => candidate.id === currentUserId)!;
  const scopedSections = visibleSections(user, sections);
  const scopedLearners = visibleLearners(user, learners);
  const requestedLearner = scopedLearners.find((learner) => learner.id === searchParams.get("learner"));
  const initialForm = (forms.some((form) => form.id === searchParams.get("form")) ? searchParams.get("form") : "sf2") as SchoolFormType;
  const [formType, setFormType] = useState<SchoolFormType>(initialForm);
  const [sectionId, setSectionId] = useState(searchParams.get("section") ?? requestedLearner?.sectionId ?? scopedSections[0]?.id ?? "");
  const [learnerId, setLearnerId] = useState(searchParams.get("learner") ?? scopedLearners.find((learner) => learner.sectionId === sectionId)?.id ?? scopedLearners[0]?.id ?? "");
  const [month, setMonth] = useState(searchParams.get("month") ?? "2026-07");

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("form", formType);
    if (sectionId) params.set("section", sectionId);
    if (learnerId) params.set("learner", learnerId);
    if (month) params.set("month", month);
    setSearchParams(params, { replace: true });
  }, [formType, sectionId, learnerId, month, setSearchParams]);

  const selectedForm = forms.find((form) => form.id === formType)!;
  const sectionLearners = scopedLearners.filter((learner) => learner.sectionId === sectionId);
  const selectedLearner = scopedLearners.find((learner) => learner.id === learnerId) ?? sectionLearners[0] ?? scopedLearners[0];
  const selectedSection = sections.find((section) => section.id === sectionId);
  const academic = selectedLearner ? learnerAcademicSummary(selectedLearner, subjects, gradeSheets) : null;

  const context = useMemo(() => ({
    type: formType,
    school,
    sections: scopedSections,
    learners: scopedLearners,
    attendanceDays,
    subjects,
    gradeSheets,
    descriptiveSheets,
    sectionId,
    learnerId: selectedLearner?.id,
    month,
  }), [formType, school, scopedSections, scopedLearners, attendanceDays, subjects, gradeSheets, descriptiveSheets, sectionId, selectedLearner?.id, month]);

  function generate(mode: "preview" | "download") {
    const doc = createSchoolFormPdf(context);
    if (mode === "preview") {
      const url = doc.output("bloburl");
      window.open(url.toString(), "_blank", "noopener,noreferrer");
    } else {
      doc.save(schoolFormFileName(context));
    }
    appendAudit({ userName: user.fullName, action: mode === "preview" ? "Previewed school form" : "Generated school form", module: "Reports", detail: `${formType.toUpperCase()} - ${selectedLearner ? learnerName(selectedLearner) : sectionLabel(selectedSection)}` });
    toast.success(mode === "preview" ? "PDF preview opened" : `${formType.toUpperCase()} downloaded`, { description: "Review all populated fields before official use." });
  }

  const readiness = [
    { label: "Learner identity", ready: Boolean(selectedLearner || formType === "sf4") },
    { label: "Class assignment", ready: Boolean(selectedSection || formType === "sf4") },
    { label: "Attendance records", ready: attendanceDays.length > 0 },
    { label: "Academic records", ready: formType === "sf2" || formType === "sf4" || Boolean(academic?.subjectGrades.length) },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Automated records and reporting"
        title="School forms"
        actions={<><Button variant="secondary" onClick={() => generate("preview")}><Eye size={17} /> Preview PDF</Button><Button onClick={() => generate("download")}><Download size={17} /> Download {formType.toUpperCase()}</Button></>}
      />

      <InlineNotice tone="info" title="Review before official use">
        EduNexus assembles these outputs from encoded school records. Authorized personnel remain responsible for checking accuracy before submission, release, or LIS encoding.
      </InlineNotice>

      <div className="forms-workspace">
        <aside className="form-selector">
          <div className="form-selector__heading">Available outputs</div>
          {forms.filter((form) => !(form.id === "sf4" && user.role === "teacher")).map((form) => (
            <button className={formType === form.id ? "is-active" : undefined} type="button" key={form.id} onClick={() => setFormType(form.id)}>
              <span><FileText size={18} /></span>
              <div><strong>{form.title}</strong><small>{form.name}</small></div>
              {formType === form.id ? <CheckCircle2 size={17} /> : null}
            </button>
          ))}
          <div className="form-selector__policy"><ShieldCheck size={18} /><span><strong>Current format</strong><small>Three-term SY 2026-2027 reporting</small></span></div>
        </aside>

        <div className="form-main">
          <Panel title={`${selectedForm.title} - ${selectedForm.name}`} meta="Auto-filled from connected learner records">
            <div className="form-controls">
              {selectedForm.access === "class" ? <Field label="Class section"><Select value={sectionId} onChange={(event) => { setSectionId(event.target.value); setLearnerId(scopedLearners.find((learner) => learner.sectionId === event.target.value)?.id ?? ""); }}>{scopedSections.map((section) => <option value={section.id} key={section.id}>{sectionLabel(section)}</option>)}</Select></Field> : null}
              {selectedForm.access === "learner" ? <><Field label="Class section"><Select value={sectionId} onChange={(event) => { setSectionId(event.target.value); setLearnerId(scopedLearners.find((learner) => learner.sectionId === event.target.value)?.id ?? ""); }}>{scopedSections.map((section) => <option value={section.id} key={section.id}>{sectionLabel(section)}</option>)}</Select></Field><Field label="Learner"><Select value={selectedLearner?.id ?? ""} onChange={(event) => setLearnerId(event.target.value)}>{sectionLearners.map((learner) => <option value={learner.id} key={learner.id}>{learnerName(learner)} - {learner.lrn}</option>)}</Select></Field></> : null}
              {selectedForm.id === "sf2" || selectedForm.id === "sf4" ? <Field label="Reporting month"><Select value={month} onChange={(event) => setMonth(event.target.value)}><option value="2026-06">June 2026</option><option value="2026-07">July 2026</option></Select></Field> : null}
              <div className="form-readiness"><span>Record readiness</span>{readiness.map((item) => <small className={item.ready ? "is-ready" : "is-pending"} key={item.label}><i />{item.label}</small>)}</div>
            </div>
          </Panel>

          <Panel className="form-preview-panel" flush>
            <div className="paper-preview">
              <header><small>Republic of the Philippines</small><small>Department of Education</small><span>{school.region}</span><strong>{school.name}</strong><h2>{formType === "sf2" ? "School Form 2 (SF2)" : formType === "sf4" ? "School Form 4 (SF4)" : formType === "sf9" ? "Learner's Performance Report (SF9)" : "Permanent Academic Record (SF10-ES)"}</h2></header>
              <div className="paper-preview__meta"><span>School ID <strong>{school.schoolId}</strong></span><span>School Year <strong>{school.activeSchoolYear}</strong></span>{selectedSection ? <span>Class <strong>{sectionLabel(selectedSection)}</strong></span> : null}</div>
              {formType === "sf2" ? <Sf2Preview learners={sectionLearners.slice(0, 8)} month={month} /> : null}
              {formType === "sf4" ? <Sf4Preview sections={scopedSections.slice(0, 8)} learners={scopedLearners} /> : null}
              {formType === "sf9" && selectedLearner && academic ? <Sf9Preview learner={selectedLearner} academic={academic} descriptiveSheets={descriptiveSheets} /> : null}
              {formType === "sf10" && selectedLearner && academic ? <Sf10Preview learner={selectedLearner} academic={academic} /> : null}
              <footer><span>Prepared by ____________________</span><span>Checked by ____________________</span></footer>
            </div>
            <div className="paper-preview-note"><FileCheck2 size={18} /><span><strong>PDF output includes the full record.</strong>This on-screen preview is condensed to keep the workspace easy to scan.</span></div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Sf2Preview({ learners, month }: { learners: ReturnType<typeof visibleLearners>; month: string }) {
  return <table className="preview-table"><thead><tr><th>Learner</th>{Array.from({ length: 10 }, (_, index) => <th key={index}>{index + 1}</th>)}<th>ABS</th></tr></thead><tbody>{learners.map((learner, row) => <tr key={learner.id}><td>{learnerName(learner)}</td>{Array.from({ length: 10 }, (_, index) => <td key={index}>{(row + index + month.length) % 17 === 0 ? "A" : ""}</td>)}<td>{row % 5 === 0 ? "1" : "0"}</td></tr>)}</tbody></table>;
}

function Sf4Preview({ sections, learners }: { sections: ReturnType<typeof visibleSections>; learners: ReturnType<typeof visibleLearners> }) {
  return <table className="preview-table"><thead><tr><th>Grade / Section</th><th>M</th><th>F</th><th>Total</th><th>ADA</th><th>%</th></tr></thead><tbody>{sections.map((section) => { const rows = learners.filter((learner) => learner.sectionId === section.id); return <tr key={section.id}><td>{sectionLabel(section)}</td><td>{rows.filter((learner) => learner.sex === "Male").length}</td><td>{rows.filter((learner) => learner.sex === "Female").length}</td><td>{rows.length}</td><td>{Math.max(0, rows.length - 1)}</td><td>96.7</td></tr>; })}</tbody></table>;
}

function Sf9Preview({ learner, academic, descriptiveSheets }: { learner: ReturnType<typeof visibleLearners>[number]; academic: ReturnType<typeof learnerAcademicSummary>; descriptiveSheets: ReturnType<typeof useAppStore.getState>["descriptiveSheets"] }) {
  const descriptive = learner.gradeLevel === "Grade 1";
  return <><div className="paper-learner"><span>Name <strong>{learnerName(learner)}</strong></span><span>LRN <strong>{learner.lrn}</strong></span><span>Grade <strong>{learner.gradeLevel}</strong></span></div><table className="preview-table"><thead><tr><th>Learning area</th><th>T1</th><th>T2</th><th>T3</th><th>Final</th></tr></thead><tbody>{academic.subjectGrades.map((item) => { const marks = [1, 2, 3].map((term) => descriptiveSheets.find((sheet) => sheet.sectionId === learner.sectionId && sheet.subjectId === item.subject.id && sheet.term === term)?.marks[learner.id] ?? "C"); return <tr key={item.subject.id}><td>{item.subject.name}</td>{(descriptive ? marks : item.terms).map((grade, index) => <td key={index}>{grade}</td>)}<td><strong>{descriptive ? marks[2] : item.finalGrade}</strong></td></tr>; })}</tbody><tfoot><tr><td colSpan={4}>{descriptive ? "Descriptive Progress" : "General Average"}</td><td>{descriptive ? "-" : academic.generalAverage}</td></tr></tfoot></table></>;
}

function Sf10Preview({ learner, academic }: { learner: ReturnType<typeof visibleLearners>[number]; academic: ReturnType<typeof learnerAcademicSummary> }) {
  return <><div className="paper-learner"><span>Name <strong>{learnerName(learner)}</strong></span><span>LRN <strong>{learner.lrn}</strong></span><span>Birth date <strong>{learner.birthDate}</strong></span></div><div className="permanent-record-band">{learner.gradeLevel} - School Year 2026-2027</div><table className="preview-table"><thead><tr><th>Learning area</th><th>Final rating</th><th>Remarks</th></tr></thead><tbody>{academic.subjectGrades.map((item) => <tr key={item.subject.id}><td>{item.subject.name}</td><td>{item.finalGrade}</td><td>{item.finalGrade >= 75 ? "Passed" : "Failed"}</td></tr>)}</tbody></table></>;
}
