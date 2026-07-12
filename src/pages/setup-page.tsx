import { useState } from "react";
import { DatabaseBackup, RotateCcw, Save, School, ShieldCheck, UsersRound } from "lucide-react";
import { toast } from "sonner";

import { Badge, Button, Field, Input, Modal, PageHeader, Panel, Segmented, Select, TableFrame } from "../components/ui";
import { sectionLabel } from "../lib/selectors";
import { useAppStore } from "../store/use-app-store";
import type { SchoolProfile } from "../types/domain";

type Tab = "school" | "sections" | "access" | "data";

const roleLabels = { school_head: "School Head", admin_officer: "Administrative Officer", teacher: "Class Adviser / Teacher" };

export function SetupPage() {
  const school = useAppStore((state) => state.school);
  const sections = useAppStore((state) => state.sections);
  const learners = useAppStore((state) => state.learners);
  const users = useAppStore((state) => state.users);
  const updateSchool = useAppStore((state) => state.updateSchool);
  const resetPrototype = useAppStore((state) => state.resetPrototype);
  const [tab, setTab] = useState<Tab>("school");
  const [draft, setDraft] = useState<SchoolProfile>(school);
  const [resetOpen, setResetOpen] = useState(false);

  function saveSchool() {
    updateSchool(draft);
    toast.success("School settings saved", { description: "Updated values are now used across forms and reports." });
  }

  return (
    <div className="page-stack">
      <PageHeader eyebrow="System administration" title="School setup" actions={tab === "school" ? <Button onClick={saveSchool}><Save size={17} /> Save settings</Button> : undefined} />
      <Segmented value={tab} onChange={setTab} label="School setup view" options={[{ value: "school", label: "School profile" }, { value: "sections", label: "Sections & staff" }, { value: "access", label: "Access roles" }, { value: "data", label: "Prototype data" }]} />

      {tab === "school" ? (
        <div className="setup-layout">
          <Panel title="Institutional information" meta="Used in generated school forms">
            <div className="form-grid">
              <Field label="School name"><Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></Field>
              <Field label="School ID"><Input value={draft.schoolId} onChange={(event) => setDraft({ ...draft, schoolId: event.target.value })} /></Field>
              <Field label="Region"><Input value={draft.region} onChange={(event) => setDraft({ ...draft, region: event.target.value })} /></Field>
              <Field label="Schools division"><Input value={draft.division} onChange={(event) => setDraft({ ...draft, division: event.target.value })} /></Field>
              <Field label="District"><Input value={draft.district} onChange={(event) => setDraft({ ...draft, district: event.target.value })} /></Field>
              <Field label="School head"><Input value={draft.schoolHead} onChange={(event) => setDraft({ ...draft, schoolHead: event.target.value })} /></Field>
              <Field className="form-grid__wide" label="School address"><Input value={draft.address} onChange={(event) => setDraft({ ...draft, address: event.target.value })} /></Field>
              <Field label="Official email"><Input type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} /></Field>
              <Field label="Telephone"><Input value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} /></Field>
            </div>
          </Panel>
          <Panel title="Academic cycle" meta="Current reporting configuration">
            <div className="form-grid">
              <Field label="Active school year"><Input value={draft.activeSchoolYear} onChange={(event) => setDraft({ ...draft, activeSchoolYear: event.target.value })} /></Field>
              <Field label="Assessment policy"><Select defaultValue="do15-2026"><option value="do15-2026">DO 15, s. 2026</option></Select></Field>
              <Field label="School year starts"><Input type="date" value={draft.schoolYearStart} onChange={(event) => setDraft({ ...draft, schoolYearStart: event.target.value })} /></Field>
              <Field label="School year ends"><Input type="date" value={draft.schoolYearEnd} onChange={(event) => setDraft({ ...draft, schoolYearEnd: event.target.value })} /></Field>
              <Field label="Academic terms"><Select defaultValue="3"><option value="3">Three terms</option></Select></Field>
              <Field label="Passing grade"><Input value="75" readOnly /></Field>
            </div>
            <div className="setup-policy-line"><ShieldCheck size={18} /><span><strong>Adjusted transmutation enabled</strong><small>SY 2026-2027 transition policy - initial grade 70 maps to term grade 75</small></span></div>
          </Panel>
        </div>
      ) : null}

      {tab === "sections" ? (
        <Panel title="Class organization" meta={`${sections.length} sections - ${learners.length} active learner records`} flush>
          <TableFrame className="table-frame--borderless"><table className="data-table"><thead><tr><th>Grade & section</th><th>Class adviser</th><th>Room</th><th>Enrollment</th><th>School year</th><th>Status</th></tr></thead><tbody>{sections.map((section) => <tr key={section.id}><td><strong>{sectionLabel(section)}</strong><small>{section.id}</small></td><td>{section.adviserName}</td><td>{section.room}</td><td>{learners.filter((learner) => learner.sectionId === section.id).length}</td><td>{section.schoolYear}</td><td><Badge tone="success" dot>Active</Badge></td></tr>)}</tbody></table></TableFrame>
        </Panel>
      ) : null}

      {tab === "access" ? (
        <div className="setup-layout">
          <Panel title="Authorized accounts" meta="Presentation access profiles" flush>
            <TableFrame className="table-frame--borderless"><table className="data-table"><thead><tr><th>Account</th><th>Role</th><th>Record boundary</th><th>Status</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><strong>{user.fullName}</strong><small>{user.email}</small></td><td>{roleLabels[user.role]}</td><td>{user.role === "teacher" ? `${user.assignedSectionIds.length} assigned class` : "School-wide"}</td><td><Badge tone="success" dot>Active</Badge></td></tr>)}</tbody></table></TableFrame>
          </Panel>
          <Panel title="Role boundaries" meta="Prototype permissions">
            <div className="role-matrix"><div><span><School size={18} /><strong>School Head</strong></span><p>School-wide learner, attendance, grade, promotion, analytics, reports, setup, and audit access.</p></div><div><span><DatabaseBackup size={18} /><strong>Administrative Officer</strong></span><p>Learner records, attendance consolidation, SF4, promotion review, analytics, and activity history.</p></div><div><span><UsersRound size={18} /><strong>Class Adviser</strong></span><p>Assigned learner roster, daily attendance, class records, individual SF9/SF10, and class analytics.</p></div></div>
          </Panel>
        </div>
      ) : null}

      {tab === "data" ? (
        <Panel title="Prototype dataset" meta="Browser-local presentation records">
          <div className="data-management"><div><DatabaseBackup size={28} /><span><strong>{learners.length} learner records</strong><small>Stored in this browser with attendance, grading, and audit history</small></span></div><div className="data-management__stats"><span><strong>{sections.length}</strong> sections</span><span><strong>10</strong> attendance days</span><span><strong>24</strong> seeded class records</span></div><Button variant="danger" onClick={() => setResetOpen(true)}><RotateCcw size={17} /> Reset all prototype data</Button></div>
        </Panel>
      ) : null}

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset prototype data?" description="This removes all changes made in this browser and restores the original presentation records." size="sm" footer={<><Button variant="secondary" onClick={() => setResetOpen(false)}>Cancel</Button><Button variant="danger" onClick={() => { resetPrototype(); setResetOpen(false); toast.success("Prototype data restored"); }}>Reset data</Button></>}>
        <p className="modal-copy">Learners added during this session, attendance changes, grade edits, promotion decisions, and activity entries will be discarded.</p>
      </Modal>
    </div>
  );
}
