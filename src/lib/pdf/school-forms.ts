import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { attendanceEquivalent, descriptiveDescriptor, numericDescriptor } from "../grade-engine";
import { learnerAcademicSummary, learnerAttendanceSummary, learnerSubjectGrades, sectionLabel } from "../selectors";
import { formatDate, learnerName } from "../utils";
import type { AttendanceDay, DescriptiveGradeSheet, DescriptiveMark, GradeSheet, Learner, SchoolProfile, Section, Subject, Term } from "../../types/domain";

export type SchoolFormType = "sf2" | "sf4" | "sf9" | "sf10";

export interface SchoolFormContext {
  type: SchoolFormType;
  school: SchoolProfile;
  sections: Section[];
  learners: Learner[];
  attendanceDays: AttendanceDay[];
  subjects: Subject[];
  gradeSheets: GradeSheet[];
  descriptiveSheets: DescriptiveGradeSheet[];
  sectionId?: string;
  learnerId?: string;
  month?: string;
}

const navy: [number, number, number] = [8, 42, 82];
const slate: [number, number, number] = [71, 85, 105];
const light: [number, number, number] = [239, 244, 247];
const border: [number, number, number] = [164, 178, 191];

function documentHeader(doc: jsPDF, school: SchoolProfile, title: string, subtitle?: string) {
  const width = doc.internal.pageSize.getWidth();
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...slate);
  doc.setFontSize(8);
  doc.text("Republic of the Philippines", width / 2, 10, { align: "center" });
  doc.text("DEPARTMENT OF EDUCATION", width / 2, 14, { align: "center" });
  doc.text(school.region, width / 2, 18, { align: "center" });
  doc.text(school.division, width / 2, 22, { align: "center" });
  doc.setTextColor(...navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(school.name.toUpperCase(), width / 2, 27, { align: "center" });
  doc.setFontSize(13);
  doc.text(title, width / 2, 34, { align: "center" });
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...slate);
    doc.setFontSize(8);
    doc.text(subtitle, width / 2, 39, { align: "center" });
  }
  doc.setDrawColor(...navy);
  doc.setLineWidth(0.5);
  doc.line(12, 42, width - 12, 42);
}

function footer(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    doc.setDrawColor(...border);
    doc.line(12, height - 10, width - 12, height - 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...slate);
    doc.text("Prepared through EduNexus. School personnel must validate all entries before official submission or release.", 12, height - 6);
    doc.text(`Page ${page} of ${pages}`, width - 12, height - 6, { align: "right" });
  }
}

function monthName(month: string) {
  return new Intl.DateTimeFormat("en-PH", { month: "long", year: "numeric" }).format(new Date(`${month}-01T00:00:00`));
}

function markForDay(day: AttendanceDay | undefined, learnerId: string) {
  const entry = day?.entries[learnerId];
  if (!entry) return "";
  if (entry.am === "A" && entry.pm === "A") return "A";
  if (entry.am === "A" || entry.pm === "A") return "1/2";
  if (entry.am === "L" || entry.pm === "L") return "L";
  if (entry.am === "E" || entry.pm === "E") return "E";
  return "";
}

function sf2(context: SchoolFormContext) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const section = context.sections.find((item) => item.id === context.sectionId) ?? context.sections[0];
  const month = context.month ?? "2026-07";
  const learners = context.learners
    .filter((learner) => learner.sectionId === section.id)
    .sort((a, b) => a.lastName.localeCompare(b.lastName));
  const monthDays = context.attendanceDays.filter((day) => day.sectionId === section.id && day.date.startsWith(month));
  const dayByNumber = new Map(monthDays.map((day) => [Number(day.date.slice(-2)), day]));
  const calendarDays = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();

  documentHeader(doc, context.school, "SCHOOL FORM 2 (SF2)", "Daily Attendance Report of Learners");
  doc.setFontSize(7.5);
  doc.setTextColor(...slate);
  doc.text(`School ID: ${context.school.schoolId}`, 12, 48);
  doc.text(`School Year: ${context.school.activeSchoolYear}`, 70, 48);
  doc.text(`Grade & Section: ${sectionLabel(section)}`, 145, 48);
  doc.text(`Month: ${monthName(month)}`, 245, 48, { align: "right" });
  doc.text(`Class Adviser: ${section.adviserName}`, 12, 52);

  const dayHeaders = Array.from({ length: calendarDays }, (_, index) => String(index + 1));
  const rows = learners.map((learner, index) => {
    const summary = learnerAttendanceSummary(learner.id, monthDays);
    return [
      index + 1,
      learnerName(learner),
      learner.sex === "Male" ? "M" : "F",
      ...dayHeaders.map((day) => markForDay(dayByNumber.get(Number(day)), learner.id)),
      summary.absentEquivalent.toFixed(1),
      summary.lateCount,
    ];
  });

  autoTable(doc, {
    startY: 56,
    head: [["No.", "Name of Learner", "Sex", ...dayHeaders, "ABS", "T"], ["", "", "", ...dayHeaders.map((day) => {
      const date = new Date(`${month}-${day.padStart(2, "0")}T00:00:00`);
      return ["S", "M", "T", "W", "T", "F", "S"][date.getDay()];
    }), "", ""]],
    body: rows,
    theme: "grid",
    tableWidth: 258.7,
    margin: { left: 6, right: 6, bottom: 18 },
    styles: { font: "helvetica", fontSize: 5.2, cellPadding: 0.75, minCellWidth: 0, halign: "center", valign: "middle", lineColor: border, lineWidth: 0.12 },
    headStyles: { fillColor: navy, textColor: 255, fontStyle: "bold", fontSize: 5 },
    columnStyles: {
      0: { cellWidth: 7 },
      1: { cellWidth: 52, halign: "left" },
      2: { cellWidth: 7 },
      ...Object.fromEntries(dayHeaders.map((_, index) => [index + 3, { cellWidth: 5.7 }])),
      [calendarDays + 3]: { cellWidth: 9 },
      [calendarDays + 4]: { cellWidth: 7 },
    },
    didParseCell: (data) => {
      if (data.section === "body" && (data.cell.raw === "A" || data.cell.raw === "1/2")) {
        data.cell.styles.textColor = [174, 45, 45];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  const y = Math.min(doc.internal.pageSize.getHeight() - 28, 174);
  doc.setFontSize(6.5);
  doc.setTextColor(...slate);
  doc.text("Codes: blank = present | A = absent | 1/2 = half day | L = late | E = excused", 12, y);
  doc.text(`Total registered learners: ${learners.length}`, 12, y + 4);
  doc.text(`Male: ${learners.filter((learner) => learner.sex === "Male").length}`, 70, y + 4);
  doc.text(`Female: ${learners.filter((learner) => learner.sex === "Female").length}`, 100, y + 4);
  doc.text("Prepared by:", 175, y + 4);
  doc.setFont("helvetica", "bold");
  doc.text(section.adviserName, 198, y + 4);
  footer(doc);
  return doc;
}

function sf4(context: SchoolFormContext) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const month = context.month ?? "2026-07";
  documentHeader(doc, context.school, "SCHOOL FORM 4 (SF4)", "Monthly Learner's Movement and Attendance Report");
  doc.setFontSize(7.5);
  doc.setTextColor(...slate);
  doc.text(`School ID: ${context.school.schoolId}`, 12, 48);
  doc.text(`School Year: ${context.school.activeSchoolYear}`, 70, 48);
  doc.text(`Reporting Month: ${monthName(month)}`, 145, 48);

  const rows = context.sections.map((section) => {
    const sectionLearners = context.learners.filter((learner) => learner.sectionId === section.id);
    const days = context.attendanceDays.filter((day) => day.sectionId === section.id && day.date.startsWith(month));
    const entries = days.flatMap((day) => Object.values(day.entries));
    const present = entries.reduce((total, entry) => total + attendanceEquivalent(entry), 0);
    const ada = days.length ? present / days.length : 0;
    const rate = sectionLearners.length && days.length ? (present / (sectionLearners.length * days.length)) * 100 : 0;
    return [
      section.gradeLevel,
      section.name,
      section.adviserName,
      sectionLearners.filter((learner) => learner.sex === "Male").length,
      sectionLearners.filter((learner) => learner.sex === "Female").length,
      sectionLearners.length,
      sectionLearners.filter((learner) => learner.enrollmentStatus === "Late enrollee").length,
      sectionLearners.filter((learner) => learner.enrollmentStatus === "Transferred in").length,
      sectionLearners.filter((learner) => learner.enrollmentStatus === "Transferred out").length,
      sectionLearners.filter((learner) => learner.enrollmentStatus === "Dropped").length,
      days.length,
      ada.toFixed(1),
      `${rate.toFixed(1)}%`,
    ];
  });

  autoTable(doc, {
    startY: 54,
    head: [["Grade", "Section", "Class Adviser", "Male", "Female", "Registered", "Late Enrol.", "Trans. In", "Trans. Out", "Dropped", "Class Days", "Avg. Daily Att.", "Attendance %"]],
    body: rows,
    foot: [["SCHOOL TOTAL", "", "", rows.reduce((total, row) => total + Number(row[3]), 0), rows.reduce((total, row) => total + Number(row[4]), 0), rows.reduce((total, row) => total + Number(row[5]), 0), rows.reduce((total, row) => total + Number(row[6]), 0), rows.reduce((total, row) => total + Number(row[7]), 0), rows.reduce((total, row) => total + Number(row[8]), 0), rows.reduce((total, row) => total + Number(row[9]), 0), "", "", ""]],
    showFoot: "lastPage",
    theme: "grid",
    margin: { left: 9, right: 9, bottom: 18 },
    styles: { font: "helvetica", fontSize: 6.3, cellPadding: 1.4, valign: "middle", lineColor: border, lineWidth: 0.12 },
    headStyles: { fillColor: navy, textColor: 255, fontStyle: "bold", halign: "center" },
    footStyles: { fillColor: light, textColor: navy, fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 18 }, 2: { cellWidth: 42 }, 3: { halign: "center" }, 4: { halign: "center" }, 5: { halign: "center" }, 6: { halign: "center" }, 7: { halign: "center" }, 8: { halign: "center" }, 9: { halign: "center" }, 10: { halign: "center" }, 11: { halign: "center" }, 12: { halign: "center" } },
  });

  doc.setFontSize(7);
  doc.setTextColor(...slate);
  doc.text("Prepared by:", 22, 178);
  doc.text("Administrative Officer", 22, 190);
  doc.setDrawColor(...border);
  doc.line(22, 185, 82, 185);
  doc.text("Reviewed by:", 116, 178);
  doc.text(context.school.schoolHead, 116, 190);
  doc.line(116, 185, 176, 185);
  doc.text("School Head", 116, 194);
  footer(doc);
  return doc;
}

function sf9(context: SchoolFormContext) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const learner = context.learners.find((item) => item.id === context.learnerId) ?? context.learners[0];
  const section = context.sections.find((item) => item.id === learner.sectionId);
  const academic = learnerAcademicSummary(learner, context.subjects, context.gradeSheets);
  const descriptive = learner.gradeLevel === "Grade 1";
  documentHeader(doc, context.school, "LEARNER'S PERFORMANCE REPORT (SF9)", context.school.activeSchoolYear);

  doc.setFontSize(7.5);
  doc.setTextColor(...slate);
  const info = [
    [`Name: ${learnerName(learner)}`, 12, 49],
    [`LRN: ${learner.lrn}`, 12, 54],
    [`Grade & Section: ${sectionLabel(section)}`, 105, 49],
    [`Age: ${new Date().getFullYear() - new Date(`${learner.birthDate}T00:00:00`).getFullYear()}`, 105, 54],
    [`Sex: ${learner.sex}`, 180, 49],
    [`Class Adviser: ${section?.adviserName ?? ""}`, 180, 54],
  ] as const;
  info.forEach(([text, x, y]) => doc.text(text, x, y));

  const academicRows = descriptive
    ? context.subjects.map((subject) => {
        const marks = ([1, 2, 3] as Term[]).map((term) =>
          context.descriptiveSheets.find(
            (sheet) =>
              sheet.sectionId === learner.sectionId &&
              sheet.subjectId === subject.id &&
              sheet.term === term,
          )?.marks[learner.id] ?? "C",
        ) as DescriptiveMark[];
        const finalMark = marks[2];
        return [
          subject.name,
          ...marks,
          finalMark,
          descriptiveDescriptor(finalMark).label,
          finalMark === "D" || finalMark === "E" ? "Needs support" : "Progressing",
        ];
      })
    : academic.subjectGrades.map((item) => [
        item.subject.name,
        ...item.terms,
        item.finalGrade,
        numericDescriptor(item.finalGrade).label,
        item.finalGrade >= 75 ? "Passed" : "Failed",
      ]);
  const academicFoot = descriptive
    ? [["DESCRIPTIVE PROGRESS REPORT", "", "", "", "", "", ""]]
    : [["GENERAL AVERAGE", "", "", "", academic.generalAverage, numericDescriptor(academic.generalAverage).label, academic.generalAverage >= 75 ? "Passed" : "Failed"]];

  autoTable(doc, {
    startY: 60,
    head: [["Learning Area", "Term 1", "Term 2", "Term 3", "Final Grade", "Descriptor", "Remarks"]],
    body: academicRows,
    foot: academicFoot,
    theme: "grid",
    tableWidth: 165,
    margin: { left: 12 },
    styles: { fontSize: 6.6, cellPadding: 1.5, lineColor: border, lineWidth: 0.12, valign: "middle" },
    headStyles: { fillColor: navy, textColor: 255, fontStyle: "bold", halign: "center" },
    footStyles: { fillColor: light, textColor: navy, fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 54 }, 1: { halign: "center" }, 2: { halign: "center" }, 3: { halign: "center" }, 4: { halign: "center" }, 5: { cellWidth: 28 }, 6: { halign: "center" } },
    didParseCell: (data) => {
      if (!descriptive && data.section === "body" && data.column.index === 4 && Number(data.cell.raw) < 75) {
        data.cell.styles.textColor = [174, 45, 45];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  const monthOrder = ["06", "07", "08", "09", "10", "11", "12", "01", "02", "03"];
  const attendanceRows = monthOrder.map((month) => {
    const year = ["01", "02", "03"].includes(month) ? "2027" : "2026";
    const prefix = `${year}-${month}`;
    const days = context.attendanceDays.filter((day) => day.date.startsWith(prefix) && day.entries[learner.id]);
    const summary = learnerAttendanceSummary(learner.id, days);
    const label = new Intl.DateTimeFormat("en-PH", { month: "short" }).format(new Date(`${prefix}-01T00:00:00`));
    return [label, days.length || "", days.length ? summary.presentEquivalent.toFixed(1) : "", days.length ? summary.absentEquivalent.toFixed(1) : ""];
  });

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...navy);
  doc.setFontSize(8);
  doc.text("ATTENDANCE RECORD", 189, 64);
  autoTable(doc, {
    startY: 67,
    head: [["Month", "Class Days", "Present", "Absent"]],
    body: attendanceRows,
    theme: "grid",
    tableWidth: 95,
    margin: { left: 189 },
    styles: { fontSize: 6.2, cellPadding: 1.1, halign: "center", lineColor: border, lineWidth: 0.12 },
    headStyles: { fillColor: navy, textColor: 255, fontStyle: "bold" },
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("TEACHER'S COMMENTS / REMARKS", 189, 120);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setDrawColor(...border);
  [126, 141, 156].forEach((y, index) => {
    doc.text(`Term ${index + 1}`, 189, y);
    doc.rect(204, y - 4, 80, 12);
  });
  doc.setFontSize(7);
  doc.text("Parent / Guardian signature:", 189, 178);
  doc.line(225, 178, 283, 178);
  doc.text("Class Adviser:", 12, 182);
  doc.line(35, 182, 92, 182);
  doc.text(section?.adviserName ?? "", 35, 186);
  doc.text("School Head:", 106, 182);
  doc.line(130, 182, 176, 182);
  doc.text(context.school.schoolHead, 130, 186);
  footer(doc);
  return doc;
}

function sf10(context: SchoolFormContext) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const learner = context.learners.find((item) => item.id === context.learnerId) ?? context.learners[0];
  const section = context.sections.find((item) => item.id === learner.sectionId);
  documentHeader(doc, context.school, "LEARNER'S PERMANENT ACADEMIC RECORD (SF10-ES)", "Elementary School");
  doc.setFontSize(7.5);
  doc.setTextColor(...slate);
  doc.text(`Learner: ${learnerName(learner)}`, 12, 49);
  doc.text(`LRN: ${learner.lrn}`, 12, 54);
  doc.text(`Sex: ${learner.sex}`, 110, 49);
  doc.text(`Date of Birth: ${formatDate(learner.birthDate)}`, 110, 54);
  doc.text(`Address: ${learner.address}`, 12, 59);
  doc.text(`Guardian: ${learner.guardianName} - ${learner.guardianContact}`, 12, 64);

  const history = learner.enrollmentHistory.length ? learner.enrollmentHistory : [{ schoolYear: "2025-2026", gradeLevel: "Grade 3", section: "Narra", school: context.school.name, status: "Completed" }];
  let startY = 70;
  history.forEach((item) => {
    doc.setFillColor(...light);
    doc.setDrawColor(...border);
    doc.rect(12, startY, 186, 10, "FD");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...navy);
    doc.setFontSize(7.5);
    doc.text(`${item.schoolYear} - ${item.gradeLevel} ${item.section}`, 15, startY + 6);
    doc.setFont("helvetica", "normal");
    doc.text(item.school, 195, startY + 6, { align: "right" });
    autoTable(doc, {
      startY: startY + 10,
      head: [["Learning Area", "Final Rating", "Remarks"]],
      body: context.subjects.map((subject, index) => [subject.name, 82 + ((index * 3 + learner.id.length) % 10), "Passed"]),
      theme: "grid",
      tableWidth: 186,
      margin: { left: 12 },
      styles: { fontSize: 6.2, cellPadding: 1.1, lineColor: border, lineWidth: 0.12 },
      headStyles: { fillColor: navy, textColor: 255, fontStyle: "bold" },
      columnStyles: { 0: { cellWidth: 105 }, 1: { halign: "center" }, 2: { halign: "center" } },
    });
    startY += 56;
  });

  const currentGrades = context.subjects.map((subject) => {
    const result = learnerSubjectGrades(learner, subject, context.gradeSheets);
    return [subject.name, ...result.terms, result.finalGrade, result.finalGrade >= 75 ? "Passed" : "Failed"];
  });
  if (startY > 205) {
    doc.addPage();
    startY = 18;
  }
  doc.setFillColor(...light);
  doc.setDrawColor(...border);
  doc.rect(12, startY, 186, 10, "FD");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...navy);
  doc.setFontSize(7.5);
  doc.text(`${context.school.activeSchoolYear} - ${sectionLabel(section)}`, 15, startY + 6);
  doc.text("CURRENT RECORD", 195, startY + 6, { align: "right" });
  autoTable(doc, {
    startY: startY + 10,
    head: [["Learning Area", "Term 1", "Term 2", "Term 3", "Final", "Remarks"]],
    body: currentGrades,
    theme: "grid",
    tableWidth: 186,
    margin: { left: 12 },
    styles: { fontSize: 6.2, cellPadding: 1.1, lineColor: border, lineWidth: 0.12 },
    headStyles: { fillColor: navy, textColor: 255, fontStyle: "bold", halign: "center" },
    columnStyles: { 0: { cellWidth: 85 }, 1: { halign: "center" }, 2: { halign: "center" }, 3: { halign: "center" }, 4: { halign: "center" }, 5: { halign: "center" } },
  });
  const signatureY = Math.min(doc.internal.pageSize.getHeight() - 30, startY + 68);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...slate);
  doc.setFontSize(7);
  doc.text("Prepared and certified correct:", 18, signatureY);
  doc.line(18, signatureY + 10, 82, signatureY + 10);
  doc.text(section?.adviserName ?? "Class Adviser", 50, signatureY + 14, { align: "center" });
  doc.text("School Head:", 115, signatureY);
  doc.line(115, signatureY + 10, 190, signatureY + 10);
  doc.text(context.school.schoolHead, 152, signatureY + 14, { align: "center" });
  footer(doc);
  return doc;
}

export function createSchoolFormPdf(context: SchoolFormContext) {
  const doc = context.type === "sf2" ? sf2(context) : context.type === "sf4" ? sf4(context) : context.type === "sf9" ? sf9(context) : sf10(context);
  doc.setProperties({
    title: `${context.type.toUpperCase()} - ${context.school.name}`,
    subject: "EduNexus automated school form",
    author: context.school.name,
    creator: "EduNexus",
  });
  return doc;
}

export function schoolFormFileName(context: SchoolFormContext) {
  const learner = context.learners.find((item) => item.id === context.learnerId);
  const section = context.sections.find((item) => item.id === context.sectionId);
  const suffix = learner
    ? `${learner.lastName}-${learner.firstName}`
    : section
      ? `${section.gradeLevel}-${section.name}`
      : context.month ?? context.school.activeSchoolYear;
  return `${context.type.toUpperCase()}-${suffix}`.replaceAll(" ", "-") + ".pdf";
}
