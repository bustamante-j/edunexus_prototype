import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Download, FileUp, Plus, Search, UploadCloud } from "lucide-react";
import Papa from "papaparse";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import {
  Badge,
  Button,
  Field,
  Input,
  MetricStrip,
  Modal,
  PageHeader,
  Segmented,
  Select,
  TableFrame,
} from "../components/ui";
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

const pageSize = 18;

export function LearnersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUserId = useAppStore((state) => state.currentUserId);
  const users = useAppStore((state) => state.users);
  const learners = useAppStore((state) => state.learners);
  const sections = useAppStore((state) => state.sections);
  const addLearner = useAppStore((state) => state.addLearner);
  const user = users.find((candidate) => candidate.id === currentUserId)!;
  const scopedSections = visibleSections(user, sections);
  const scopedLearners = visibleLearners(user, learners);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState<"table" | "cards">("table");
  const [page, setPage] = useState(1);
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<Array<Record<string, string>>>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addOpen = searchParams.get("new") === "1";

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

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return scopedLearners.filter((learner) => {
      const section = sections.find((candidate) => candidate.id === learner.sectionId);
      const matchesSearch = !query || `${learner.firstName} ${learner.middleName} ${learner.lastName} ${learner.lrn}`.toLowerCase().includes(query);
      const matchesGrade = gradeFilter === "all" || learner.gradeLevel === gradeFilter;
      const matchesSection = sectionFilter === "all" || learner.sectionId === sectionFilter;
      const matchesStatus = statusFilter === "all" || learner.enrollmentStatus === statusFilter;
      return matchesSearch && matchesGrade && matchesSection && matchesStatus && Boolean(section);
    });
  }, [scopedLearners, sections, search, gradeFilter, sectionFilter, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const maleCount = scopedLearners.filter((learner) => learner.sex === "Male").length;
  const femaleCount = scopedLearners.length - maleCount;

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
    const lines = filtered.map((learner) => {
      const section = sections.find((candidate) => candidate.id === learner.sectionId);
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
        { label: "Male learners", value: maleCount.toLocaleString(), detail: `${((maleCount / scopedLearners.length) * 100).toFixed(1)}% of roster` },
        { label: "Female learners", value: femaleCount.toLocaleString(), detail: `${((femaleCount / scopedLearners.length) * 100).toFixed(1)}% of roster` },
        { label: "Movement records", value: scopedLearners.filter((learner) => learner.enrollmentStatus !== "Enrolled").length, detail: "Late or transferred in", tone: "info" },
      ]} />

      <section className="workspace-toolbar">
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
        <Segmented value={view} onChange={setView} label="Learner display" options={[{ value: "table", label: "Table" }, { value: "cards", label: "Cards" }]} />
      </section>

      <div className="result-line"><span>{filtered.length.toLocaleString()} matching records</span><span>Page {page} of {pageCount}</span></div>

      {view === "table" ? (
        <TableFrame>
          <table className="data-table data-table--learners">
            <thead><tr><th>Learner</th><th>LRN</th><th>Sex</th><th>Class</th><th>Guardian</th><th>Status</th><th /></tr></thead>
            <tbody>
              {paginated.map((learner) => {
                const section = sections.find((candidate) => candidate.id === learner.sectionId);
                return (
                  <tr key={learner.id} onDoubleClick={() => navigate(`/portal/learners/${learner.id}`)}>
                    <td><div className="person-cell"><span>{initials(`${learner.firstName} ${learner.lastName}`)}</span><div><strong>{learnerName(learner)}</strong><small>{formatDate(learner.birthDate)} - {learner.address.split(",")[0]}</small></div></div></td>
                    <td className="mono-cell">{learner.lrn}</td>
                    <td>{learner.sex}</td>
                    <td><strong>{section?.gradeLevel}</strong><small>{section?.name}</small></td>
                    <td><strong>{learner.guardianName}</strong><small>{learner.guardianContact}</small></td>
                    <td><Badge tone={learner.enrollmentStatus === "Enrolled" ? "success" : "info"} dot>{learner.enrollmentStatus}</Badge></td>
                    <td><Button size="sm" variant="quiet" onClick={() => navigate(`/portal/learners/${learner.id}`)}>View record</Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableFrame>
      ) : (
        <div className="learner-card-grid">
          {paginated.map((learner) => {
            const section = sections.find((candidate) => candidate.id === learner.sectionId);
            return (
              <article className="learner-card" key={learner.id}>
                <header><span>{initials(`${learner.firstName} ${learner.lastName}`)}</span><Badge tone={learner.enrollmentStatus === "Enrolled" ? "success" : "info"}>{learner.enrollmentStatus}</Badge></header>
                <h3>{learner.firstName} {learner.lastName}</h3>
                <p>LRN {learner.lrn}</p>
                <dl><div><dt>Class</dt><dd>{sectionLabel(section)}</dd></div><div><dt>Guardian</dt><dd>{learner.guardianName}</dd></div></dl>
                <Button variant="secondary" onClick={() => navigate(`/portal/learners/${learner.id}`)}>Open record</Button>
              </article>
            );
          })}
        </div>
      )}

      <div className="pagination">
        <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
        <span>{(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} of {filtered.length}</span>
        <Button variant="secondary" size="sm" disabled={page === pageCount} onClick={() => setPage((value) => value + 1)}>Next</Button>
      </div>

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
