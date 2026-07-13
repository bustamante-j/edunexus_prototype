import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BarChart3,
  Download,
  FileUp,
  Plus,
  Search,
  Settings2,
  UploadCloud,
} from "lucide-react";
import Papa from "papaparse";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  MetricStrip,
  Modal,
  PageHeader,
  Segmented,
  Select,
  TableFrame,
} from "../components/ui";
import {
  buildLearnerInsights,
  PRIORITY_LABELS,
  type LearnerPriority,
} from "../lib/analytics";
import { gradeTone } from "../lib/grade-engine";
import { GRADE_LEVELS, sectionLabel, visibleLearners, visibleSections } from "../lib/selectors";
import { downloadTextFile, formatDate, initials, learnerName } from "../lib/utils";
import { useAppStore } from "../store/use-app-store";
import type { Sex } from "../types/domain";

const learnerSchema = z.object({
  lrn: z.string().regex(/^\d{12}$/, "LRN must contain exactly 12 digits."),
  firstName: z.string().min(2, "First name is required."),
  middleName: z.string().min(1, "Middle name is required."),
  lastName: z.string().min(2, "Last name is required."),
  sex: z.enum(["Male", "Female"]),
  birthDate: z.string().min(1, "Birth date is required."),
  address: z.string().min(5, "Complete address is required."),
  guardianName: z.string().min(3, "Guardian name is required."),
  guardianContact: z.string().min(10, "Guardian contact is required."),
  sectionId: z.string().min(1, "Section is required."),
});

type LearnerForm = z.infer<typeof learnerSchema>;

type LearnerView = "table" | "cards" | "minimal";
type LearnerDensity = "comfortable" | "compact";
type LearnerSort =
  | "name-asc"
  | "name-desc"
  | "class"
  | "academic-risk"
  | "attendance-risk"
  | "newest";
type LearnerFocus = "all" | "support" | "academic" | "attendance" | "movement";
type LearnerColumn =
  | "lrn"
  | "sex"
  | "class"
  | "guardian"
  | "status"
  | "academic"
  | "attendance"
  | "priority";

interface LearnerViewPreferences {
  view: LearnerView;
  density: LearnerDensity;
  sort: LearnerSort;
  pageSize: number;
  columns: LearnerColumn[];
}

const preferenceKey = "edunexus-learner-view-v1";
const defaultPreferences: LearnerViewPreferences = {
  view: "table",
  density: "comfortable",
  sort: "name-asc",
  pageSize: 18,
  columns: ["lrn", "class", "status", "academic", "attendance", "priority"],
};
const learnerColumns: Array<{ value: LearnerColumn; label: string }> = [
  { value: "lrn", label: "LRN" },
  { value: "sex", label: "Sex" },
  { value: "class", label: "Class" },
  { value: "guardian", label: "Guardian" },
  { value: "status", label: "Enrollment status" },
  { value: "academic", label: "General average" },
  { value: "attendance", label: "Attendance rate" },
  { value: "priority", label: "Support priority" },
];

function loadPreferences(): LearnerViewPreferences {
  if (typeof window === "undefined") return defaultPreferences;
  try {
    const stored = JSON.parse(window.localStorage.getItem(preferenceKey) ?? "null") as Partial<LearnerViewPreferences> | null;
    if (!stored) return defaultPreferences;
    return {
      ...defaultPreferences,
      ...stored,
      columns: stored.columns?.filter((column) => learnerColumns.some((item) => item.value === column)) ?? defaultPreferences.columns,
    };
  } catch {
    return defaultPreferences;
  }
}

function priorityTone(priority: LearnerPriority) {
  if (priority === "critical") return "danger" as const;
  if (priority === "academic" || priority === "attendance") return "warning" as const;
  if (priority === "on_track") return "success" as const;
  return "info" as const;
}

export function LearnersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUserId = useAppStore((state) => state.currentUserId);
  const users = useAppStore((state) => state.users);
  const learners = useAppStore((state) => state.learners);
  const sections = useAppStore((state) => state.sections);
  const subjects = useAppStore((state) => state.subjects);
  const gradeSheets = useAppStore((state) => state.gradeSheets);
  const attendanceDays = useAppStore((state) => state.attendanceDays);
  const addLearner = useAppStore((state) => state.addLearner);
  const user = users.find((candidate) => candidate.id === currentUserId)!;
  const scopedSections = visibleSections(user, sections);
  const scopedLearners = visibleLearners(user, learners);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [focusFilter, setFocusFilter] = useState<LearnerFocus>("all");
  const [preferences, setPreferences] = useState(loadPreferences);
  const [displayOpen, setDisplayOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<Array<Record<string, string>>>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addOpen = searchParams.get("new") === "1";

  useEffect(() => {
    window.localStorage.setItem(preferenceKey, JSON.stringify(preferences));
  }, [preferences]);

  const form = useForm<LearnerForm>({
    resolver: zodResolver(learnerSchema),
    defaultValues: {
      lrn: "",
      firstName: "",
      middleName: "",
      lastName: "",
      sex: "Male",
      birthDate: "2016-01-15",
      address: "Balili, La Trinidad, Benguet",
      guardianName: "",
      guardianContact: "",
      sectionId: scopedSections[0]?.id ?? "",
    },
  });

  const insights = useMemo(
    () => buildLearnerInsights(scopedLearners, sections, subjects, gradeSheets, attendanceDays),
    [scopedLearners, sections, subjects, gradeSheets, attendanceDays],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return insights.filter((record) => {
      const { learner, section } = record;
      const matchesSearch = !query || `${learner.firstName} ${learner.middleName} ${learner.lastName} ${learner.lrn}`.toLowerCase().includes(query);
      const matchesGrade = gradeFilter === "all" || learner.gradeLevel === gradeFilter;
      const matchesSection = sectionFilter === "all" || learner.sectionId === sectionFilter;
      const matchesStatus = statusFilter === "all" || learner.enrollmentStatus === statusFilter;
      const matchesFocus = focusFilter === "all"
        || (focusFilter === "support" && ["critical", "academic", "attendance"].includes(record.priority))
        || (focusFilter === "academic" && record.academic.generalAverage < 80)
        || (focusFilter === "attendance" && record.attendance.classDays > 0 && record.attendance.rate < 90)
        || (focusFilter === "movement" && learner.enrollmentStatus !== "Enrolled");
      return matchesSearch && matchesGrade && matchesSection && matchesStatus && matchesFocus && Boolean(section);
    }).sort((a, b) => {
      if (preferences.sort === "name-desc") return learnerName(b.learner).localeCompare(learnerName(a.learner));
      if (preferences.sort === "class") {
        return GRADE_LEVELS.indexOf(a.learner.gradeLevel) - GRADE_LEVELS.indexOf(b.learner.gradeLevel)
          || (a.section?.name ?? "").localeCompare(b.section?.name ?? "")
          || learnerName(a.learner).localeCompare(learnerName(b.learner));
      }
      if (preferences.sort === "academic-risk") return a.academic.generalAverage - b.academic.generalAverage || learnerName(a.learner).localeCompare(learnerName(b.learner));
      if (preferences.sort === "attendance-risk") return a.attendance.rate - b.attendance.rate || learnerName(a.learner).localeCompare(learnerName(b.learner));
      if (preferences.sort === "newest") return b.learner.enrolledOn.localeCompare(a.learner.enrolledOn) || learnerName(a.learner).localeCompare(learnerName(b.learner));
      return learnerName(a.learner).localeCompare(learnerName(b.learner));
    });
  }, [insights, search, gradeFilter, sectionFilter, statusFilter, focusFilter, preferences.sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / preferences.pageSize));
  const paginated = filtered.slice((page - 1) * preferences.pageSize, page * preferences.pageSize);
  const maleCount = scopedLearners.filter((learner) => learner.sex === "Male").length;
  const femaleCount = scopedLearners.length - maleCount;
  const supportCount = insights.filter((record) => ["critical", "academic", "attendance"].includes(record.priority)).length;
  const visibleColumns = new Set(preferences.columns);

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  function updatePreferences(updates: Partial<LearnerViewPreferences>) {
    setPreferences((current) => ({ ...current, ...updates }));
    setPage(1);
  }

  function toggleColumn(column: LearnerColumn) {
    updatePreferences({
      columns: visibleColumns.has(column)
        ? preferences.columns.filter((item) => item !== column)
        : [...preferences.columns, column],
    });
  }

  function clearFilters() {
    setSearch("");
    setGradeFilter("all");
    setSectionFilter("all");
    setStatusFilter("all");
    setFocusFilter("all");
    setPage(1);
  }

  function closeAdd() {
    searchParams.delete("new");
    setSearchParams(searchParams, { replace: true });
    form.reset();
  }

  function onCreate(values: LearnerForm) {
    const learner = addLearner(values);
    toast.success("Learner record created", { description: `${values.firstName} ${values.lastName} was added to the active roster.` });
    closeAdd();
    navigate(`/portal/learners/${learner.id}`);
  }

  function exportRoster() {
    const header = ["LRN", "Last Name", "First Name", "Middle Name", "Sex", "Birth Date", "Grade", "Section", "Enrollment Status"];
    const lines = filtered.map(({ learner, section }) => {
      return [learner.lrn, learner.lastName, learner.firstName, learner.middleName, learner.sex, learner.birthDate, learner.gradeLevel, section?.name ?? "", learner.enrollmentStatus]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(",");
    });
    downloadTextFile("edunexus-learner-roster.csv", [header.join(","), ...lines].join("\n"));
    toast.success("Roster downloaded", { description: `${filtered.length} learner records were exported.` });
  }

  function downloadTemplate() {
    const content = [
      "lrn,first_name,middle_name,last_name,sex,birth_date,address,guardian_name,guardian_contact,section_id",
      `135617269999,Juan,Santos,Dela Cruz,Male,2016-05-14,"Balili, La Trinidad, Benguet",Maria Dela Cruz,09171234567,${scopedSections[0]?.id ?? "grade-4-narra"}`,
    ].join("\n");
    downloadTextFile("edunexus-learner-import-template.csv", content);
  }

  function parseImport(file: File) {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const errors = result.errors.map((error) => `Row ${(error.row ?? 0) + 2}: ${error.message}`);
        result.data.forEach((row, index) => {
          if (!/^\d{12}$/.test(row.lrn ?? "")) errors.push(`Row ${index + 2}: LRN must contain 12 digits.`);
          if (!scopedSections.some((section) => section.id === row.section_id)) errors.push(`Row ${index + 2}: Section ID is not recognized.`);
        });
        setImportRows(result.data);
        setImportErrors(errors);
      },
    });
  }

  function commitImport() {
    if (importErrors.length) return;
    importRows.forEach((row) => addLearner({
      lrn: row.lrn,
      firstName: row.first_name,
      middleName: row.middle_name,
      lastName: row.last_name,
      sex: (row.sex === "Female" ? "Female" : "Male") as Sex,
      birthDate: row.birth_date,
      address: row.address,
      guardianName: row.guardian_name,
      guardianContact: row.guardian_contact,
      sectionId: row.section_id,
    }));
    toast.success("Roster import completed", { description: `${importRows.length} learner records were added.` });
    setImportOpen(false);
    setImportRows([]);
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={user.role === "teacher" ? "Assigned class roster" : "Central learner repository"}
        title="Learner records"
        actions={
          <>
            <Button variant="secondary" onClick={exportRoster}><Download size={17} /> Export</Button>
            <Button variant="secondary" onClick={() => navigate(`/portal/analytics?grade=${encodeURIComponent(gradeFilter)}&section=${encodeURIComponent(sectionFilter)}`)}><BarChart3 size={17} /> Analyze</Button>
            {user.role !== "teacher" ? (
              <>
                <Button variant="secondary" onClick={() => setImportOpen(true)}><FileUp size={17} /> Import roster</Button>
                <Button onClick={() => setSearchParams({ new: "1" })}><Plus size={17} /> Add learner</Button>
              </>
            ) : null}
          </>
        }
      />

      <MetricStrip items={[
        { label: "Visible records", value: scopedLearners.length.toLocaleString(), detail: `${scopedSections.length} section${scopedSections.length === 1 ? "" : "s"}` },
        { label: "Male learners", value: maleCount.toLocaleString(), detail: `${scopedLearners.length ? ((maleCount / scopedLearners.length) * 100).toFixed(1) : "0.0"}% of roster` },
        { label: "Female learners", value: femaleCount.toLocaleString(), detail: `${scopedLearners.length ? ((femaleCount / scopedLearners.length) * 100).toFixed(1) : "0.0"}% of roster` },
        { label: "Needs support", value: supportCount, detail: "Academic or attendance", tone: supportCount ? "warning" : "success" },
      ]} />

      <section className="workspace-toolbar learner-toolbar">
        <div className="search-field">
          <Search size={18} />
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search learner name or LRN" />
        </div>
        <Select value={gradeFilter} onChange={(event) => { setGradeFilter(event.target.value); setPage(1); }} aria-label="Filter by grade level">
          <option value="all">All grade levels</option>
          {GRADE_LEVELS.map((grade) => <option key={grade}>{grade}</option>)}
        </Select>
        <Select value={sectionFilter} onChange={(event) => { setSectionFilter(event.target.value); setPage(1); }} aria-label="Filter by section">
          <option value="all">All sections</option>
          {scopedSections.map((section) => <option value={section.id} key={section.id}>{sectionLabel(section)}</option>)}
        </Select>
        <Select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} aria-label="Filter by enrollment status">
          <option value="all">All enrollment statuses</option>
          <option>Enrolled</option><option>Late enrollee</option><option>Transferred in</option><option>Transferred out</option><option>Dropped</option>
        </Select>
        <Select value={focusFilter} onChange={(event) => { setFocusFilter(event.target.value as LearnerFocus); setPage(1); }} aria-label="Focus learner records">
          <option value="all">All records</option>
          <option value="support">Needs support</option>
          <option value="academic">Academic concern</option>
          <option value="attendance">Attendance concern</option>
          <option value="movement">Enrollment movement</option>
        </Select>
        <Button variant="secondary" className="display-settings-button" aria-expanded={displayOpen} onClick={() => setDisplayOpen((value) => !value)}><Settings2 size={17} /> Display</Button>
      </section>

      {displayOpen ? (
        <section className="learner-display-panel" aria-label="Learner display settings">
          <div className="learner-display-panel__controls">
            <div className="display-control"><span>View</span><Segmented value={preferences.view} onChange={(view) => updatePreferences({ view })} label="Learner display" options={[{ value: "table", label: "Table" }, { value: "cards", label: "Cards" }, { value: "minimal", label: "Minimal" }]} /></div>
            <div className="display-control"><span>Density</span><Segmented value={preferences.density} onChange={(density) => updatePreferences({ density })} label="Learner display density" options={[{ value: "comfortable", label: "Comfortable" }, { value: "compact", label: "Compact" }]} /></div>
            <label className="display-control"><span>Sort by</span><Select value={preferences.sort} onChange={(event) => updatePreferences({ sort: event.target.value as LearnerSort })}><option value="name-asc">Name A-Z</option><option value="name-desc">Name Z-A</option><option value="class">Grade and section</option><option value="academic-risk">Lowest grades first</option><option value="attendance-risk">Lowest attendance first</option><option value="newest">Newest enrollment</option></Select></label>
            <label className="display-control"><span>Rows per page</span><Select value={preferences.pageSize} onChange={(event) => updatePreferences({ pageSize: Number(event.target.value) })}><option value={12}>12</option><option value={18}>18</option><option value={30}>30</option><option value={60}>60</option></Select></label>
          </div>
          {preferences.view !== "minimal" ? (
            <div className="learner-column-picker"><span>Visible details</span><div>{learnerColumns.map((column) => <label key={column.value}><input type="checkbox" checked={visibleColumns.has(column.value)} onChange={() => toggleColumn(column.value)} />{column.label}</label>)}</div></div>
          ) : null}
          <Button size="sm" variant="quiet" onClick={() => updatePreferences(defaultPreferences)}>Reset display</Button>
        </section>
      ) : null}

      <div className="result-line">
        <span>{filtered.length.toLocaleString()} matching records</span>
        <span>{search || gradeFilter !== "all" || sectionFilter !== "all" || statusFilter !== "all" || focusFilter !== "all" ? <Button size="sm" variant="quiet" onClick={clearFilters}>Clear filters</Button> : null} Page {page} of {pageCount}</span>
      </div>

      {!filtered.length ? (
        <EmptyState title="No learner records found" detail="Change the search or filters to return to the active roster." action={<Button variant="secondary" onClick={clearFilters}>Clear filters</Button>} />
      ) : preferences.view === "table" ? (
        <TableFrame>
          <table className={`data-table data-table--learners data-table--${preferences.density}`}>
            <thead><tr><th>Learner</th>{visibleColumns.has("lrn") ? <th>LRN</th> : null}{visibleColumns.has("sex") ? <th>Sex</th> : null}{visibleColumns.has("class") ? <th>Class</th> : null}{visibleColumns.has("guardian") ? <th>Guardian</th> : null}{visibleColumns.has("status") ? <th>Status</th> : null}{visibleColumns.has("academic") ? <th>Average</th> : null}{visibleColumns.has("attendance") ? <th>Attendance</th> : null}{visibleColumns.has("priority") ? <th>Support</th> : null}<th /></tr></thead>
            <tbody>
              {paginated.map((record) => {
                const { learner, section, academic, attendance, priority } = record;
                return (
                  <tr key={learner.id} onDoubleClick={() => navigate(`/portal/learners/${learner.id}`)}>
                    <td><div className="person-cell"><span>{initials(`${learner.firstName} ${learner.lastName}`)}</span><div><strong>{learnerName(learner)}</strong><small>{formatDate(learner.birthDate)} - {learner.address.split(",")[0]}</small></div></div></td>
                    {visibleColumns.has("lrn") ? <td className="mono-cell">{learner.lrn}</td> : null}
                    {visibleColumns.has("sex") ? <td>{learner.sex}</td> : null}
                    {visibleColumns.has("class") ? <td><strong>{section?.gradeLevel}</strong><small>{section?.name}</small></td> : null}
                    {visibleColumns.has("guardian") ? <td><strong>{learner.guardianName}</strong><small>{learner.guardianContact}</small></td> : null}
                    {visibleColumns.has("status") ? <td><Badge tone={learner.enrollmentStatus === "Enrolled" ? "success" : "info"} dot>{learner.enrollmentStatus}</Badge></td> : null}
                    {visibleColumns.has("academic") ? <td><Badge tone={gradeTone(academic.generalAverage)}>{academic.generalAverage}</Badge><small>{academic.failingSubjects.length ? `${academic.failingSubjects.length} below 75` : "Passing"}</small></td> : null}
                    {visibleColumns.has("attendance") ? <td><strong>{attendance.classDays ? `${attendance.rate.toFixed(1)}%` : "No data"}</strong><small>{attendance.classDays ? `${attendance.absentEquivalent.toFixed(1)} absent days` : "Complete entries"}</small></td> : null}
                    {visibleColumns.has("priority") ? <td><Badge tone={priorityTone(priority)}>{PRIORITY_LABELS[priority]}</Badge></td> : null}
                    <td><Button size="sm" variant="quiet" onClick={() => navigate(`/portal/learners/${learner.id}`)}>View record</Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableFrame>
      ) : preferences.view === "cards" ? (
        <div className={`learner-card-grid learner-card-grid--${preferences.density}`}>
          {paginated.map((record) => {
            const { learner, section, academic, attendance, priority } = record;
            return (
              <article className="learner-card" key={learner.id}>
                <header><span>{initials(`${learner.firstName} ${learner.lastName}`)}</span>{visibleColumns.has("status") ? <Badge tone={learner.enrollmentStatus === "Enrolled" ? "success" : "info"}>{learner.enrollmentStatus}</Badge> : null}</header>
                <h3>{learner.firstName} {learner.lastName}</h3>
                {visibleColumns.has("lrn") ? <p>LRN {learner.lrn}</p> : null}
                <dl>
                  {visibleColumns.has("sex") ? <div><dt>Sex</dt><dd>{learner.sex}</dd></div> : null}
                  {visibleColumns.has("class") ? <div><dt>Class</dt><dd>{sectionLabel(section)}</dd></div> : null}
                  {visibleColumns.has("guardian") ? <div><dt>Guardian</dt><dd>{learner.guardianName}</dd></div> : null}
                  {visibleColumns.has("academic") ? <div><dt>Average</dt><dd>{academic.generalAverage}</dd></div> : null}
                  {visibleColumns.has("attendance") ? <div><dt>Attendance</dt><dd>{attendance.classDays ? `${attendance.rate.toFixed(1)}%` : "No data"}</dd></div> : null}
                  {visibleColumns.has("priority") ? <div><dt>Support</dt><dd><Badge tone={priorityTone(priority)}>{PRIORITY_LABELS[priority]}</Badge></dd></div> : null}
                </dl>
                <Button variant="secondary" onClick={() => navigate(`/portal/learners/${learner.id}`)}>Open record</Button>
              </article>
            );
          })}
        </div>
      ) : (
        <div className={`learner-minimal-list learner-minimal-list--${preferences.density}`}>
          {paginated.map(({ learner, section, priority }) => (
            <article key={learner.id}>
              <span className="learner-minimal-list__avatar">{initials(`${learner.firstName} ${learner.lastName}`)}</span>
              <div className="learner-minimal-list__identity"><strong>{learnerName(learner)}</strong><small>LRN {learner.lrn}</small></div>
              <span className="learner-minimal-list__class">{sectionLabel(section)}</span>
              <Badge tone={priorityTone(priority)}>{PRIORITY_LABELS[priority]}</Badge>
              <Button size="sm" variant="quiet" onClick={() => navigate(`/portal/learners/${learner.id}`)}>Open</Button>
            </article>
          ))}
        </div>
      )}

      {filtered.length ? <div className="pagination">
        <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
        <span>{(page - 1) * preferences.pageSize + 1}-{Math.min(page * preferences.pageSize, filtered.length)} of {filtered.length}</span>
        <Button variant="secondary" size="sm" disabled={page === pageCount} onClick={() => setPage((value) => value + 1)}>Next</Button>
      </div> : null}

      <Modal
        open={addOpen}
        onClose={closeAdd}
        title="Add learner"
        description="Create the learner identity once, then assign the active enrollment record."
        size="lg"
        footer={<><Button variant="secondary" onClick={closeAdd}>Cancel</Button><Button onClick={form.handleSubmit(onCreate)}>Create learner</Button></>}
      >
        <form className="form-grid" onSubmit={form.handleSubmit(onCreate)}>
          <Field label="Learner Reference Number" hint={form.formState.errors.lrn?.message}><Input inputMode="numeric" maxLength={12} {...form.register("lrn")} /></Field>
          <Field label="Sex"><Select {...form.register("sex")}><option>Male</option><option>Female</option></Select></Field>
          <Field label="First name" hint={form.formState.errors.firstName?.message}><Input {...form.register("firstName")} /></Field>
          <Field label="Middle name" hint={form.formState.errors.middleName?.message}><Input {...form.register("middleName")} /></Field>
          <Field label="Last name" hint={form.formState.errors.lastName?.message}><Input {...form.register("lastName")} /></Field>
          <Field label="Birth date" hint={form.formState.errors.birthDate?.message}><Input type="date" {...form.register("birthDate")} /></Field>
          <Field className="form-grid__wide" label="Complete address" hint={form.formState.errors.address?.message}><Input {...form.register("address")} /></Field>
          <Field label="Guardian name" hint={form.formState.errors.guardianName?.message}><Input {...form.register("guardianName")} /></Field>
          <Field label="Guardian contact" hint={form.formState.errors.guardianContact?.message}><Input {...form.register("guardianContact")} /></Field>
          <Field className="form-grid__wide" label="Active class" hint={form.formState.errors.sectionId?.message}><Select {...form.register("sectionId")}>{scopedSections.map((section) => <option value={section.id} key={section.id}>{sectionLabel(section)}</option>)}</Select></Field>
        </form>
      </Modal>

      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import learner roster"
        description="Validate a completed CSV roster before records are added."
        size="lg"
        footer={<><Button variant="secondary" onClick={() => setImportOpen(false)}>Cancel</Button><Button disabled={!importRows.length || Boolean(importErrors.length)} onClick={commitImport}>Import {importRows.length || ""} records</Button></>}
      >
        <div className="import-workflow">
          <div className="import-actions">
            <Button variant="secondary" onClick={downloadTemplate}><Download size={17} /> Download template</Button>
            <Button onClick={() => fileInputRef.current?.click()}><UploadCloud size={17} /> Choose CSV file</Button>
            <input ref={fileInputRef} hidden type="file" accept=".csv,text/csv" onChange={(event) => { const file = event.target.files?.[0]; if (file) parseImport(file); }} />
          </div>
          <div className="import-dropzone" onClick={() => fileInputRef.current?.click()}>
            <FileUp size={28} />
            <strong>{importRows.length ? `${importRows.length} rows ready for validation` : "Upload the completed learner template"}</strong>
            <span>CSV format - one learner per row - 12-digit LRN required</span>
          </div>
          {importErrors.length ? <div className="validation-list"><strong>Resolve these issues</strong>{importErrors.slice(0, 8).map((error) => <span key={error}>{error}</span>)}</div> : importRows.length ? <div className="validation-success">All {importRows.length} rows passed structural validation.</div> : null}
        </div>
      </Modal>
    </div>
  );
}
