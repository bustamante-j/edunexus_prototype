import { buildSeedScores } from "../data/seed";
import { attendanceEquivalent, computeGrade, isAttendanceRisk } from "./grade-engine";
import type {
  AppUser,
  AttendanceDay,
  GradeLevel,
  GradeSheet,
  Learner,
  NotificationItem,
  Section,
  Subject,
  Term,
} from "../types/domain";

export const GRADE_LEVELS: GradeLevel[] = [
  "Kindergarten",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
];

export function sectionLabel(section: Section | undefined) {
  return section ? `${section.gradeLevel} - ${section.name}` : "Unassigned section";
}

export function visibleSections(user: AppUser, sections: Section[]) {
  if (user.role !== "teacher") return sections;
  return sections.filter((section) => user.assignedSectionIds.includes(section.id));
}

export function visibleLearners(user: AppUser, learners: Learner[]) {
  if (user.role !== "teacher") return learners;
  return learners.filter((learner) => user.assignedSectionIds.includes(learner.sectionId));
}

export function getScores(
  learnerId: string,
  sectionId: string,
  subjectId: string,
  term: Term,
  gradeSheets: GradeSheet[],
) {
  const sheet = gradeSheets.find(
    (item) =>
      item.sectionId === sectionId &&
      item.subjectId === subjectId &&
      item.term === term,
  );
  return (
    sheet?.rows.find((row) => row.learnerId === learnerId)?.scores ??
    buildSeedScores(learnerId, subjectId, term)
  );
}

export function learnerSubjectGrades(
  learner: Learner,
  subject: Subject,
  gradeSheets: GradeSheet[],
) {
  const terms = ([1, 2, 3] as Term[]).map((term) =>
    computeGrade(
      getScores(learner.id, learner.sectionId, subject.id, term, gradeSheets),
      subject,
    ).transmutedGrade,
  );
  const finalGrade = Math.round(terms.reduce((total, grade) => total + grade, 0) / terms.length);
  return { terms, finalGrade };
}

export function learnerAcademicSummary(
  learner: Learner,
  subjects: Subject[],
  gradeSheets: GradeSheet[],
) {
  const subjectGrades = subjects.map((subject) => ({
    subject,
    ...learnerSubjectGrades(learner, subject, gradeSheets),
  }));
  const generalAverage = Math.round(
    subjectGrades.reduce((total, item) => total + item.finalGrade, 0) /
      Math.max(1, subjectGrades.length),
  );
  const failingSubjects = subjectGrades.filter((item) => item.finalGrade < 75);
  return { subjectGrades, generalAverage, failingSubjects };
}

export function learnerAttendanceSummary(
  learnerId: string,
  attendanceDays: AttendanceDay[],
) {
  const entries = attendanceDays
    .filter((day) => day.entries[learnerId])
    .map((day) => day.entries[learnerId]);
  const presentEquivalent = entries.reduce(
    (total, entry) => total + attendanceEquivalent(entry),
    0,
  );
  const absentEquivalent = Math.max(0, entries.length - presentEquivalent);
  const lateCount = entries.filter((entry) => entry.am === "L" || entry.pm === "L").length;
  const excusedCount = entries.filter((entry) => entry.am === "E" || entry.pm === "E").length;
  const rate = entries.length ? (presentEquivalent / entries.length) * 100 : 0;
  return {
    classDays: entries.length,
    presentEquivalent,
    absentEquivalent,
    lateCount,
    excusedCount,
    rate,
    atRisk: isAttendanceRisk(absentEquivalent, entries.length),
  };
}

export function sectionAttendanceSummary(
  sectionId: string,
  learners: Learner[],
  attendanceDays: AttendanceDay[],
) {
  const sectionLearners = learners.filter((learner) => learner.sectionId === sectionId);
  const summaries = sectionLearners.map((learner) =>
    learnerAttendanceSummary(learner.id, attendanceDays),
  );
  const rate = summaries.length
    ? summaries.reduce((total, summary) => total + summary.rate, 0) / summaries.length
    : 0;
  return {
    rate,
    atRisk: summaries.filter((summary) => summary.atRisk).length,
    learners: sectionLearners.length,
  };
}

export function nextGradeLevel(grade: GradeLevel): GradeLevel {
  const index = GRADE_LEVELS.indexOf(grade);
  return GRADE_LEVELS[Math.min(GRADE_LEVELS.length - 1, index + 1)];
}

export function buildNotifications(
  user: AppUser,
  learners: Learner[],
  subjects: Subject[],
  gradeSheets: GradeSheet[],
  attendanceDays: AttendanceDay[],
): NotificationItem[] {
  const scopedLearners = visibleLearners(user, learners);
  const lowGrades = scopedLearners.filter(
    (learner) => learnerAcademicSummary(learner, subjects, gradeSheets).failingSubjects.length > 0,
  );
  const attendanceRisk = scopedLearners.filter(
    (learner) => learnerAttendanceSummary(learner.id, attendanceDays).atRisk,
  );
  const pendingPromotions = scopedLearners.filter(
    (learner) => learner.promotionStatus === "Pending review",
  );
  const items: NotificationItem[] = [];

  if (lowGrades.length) {
    items.push({
      id: "low-grades",
      title: `${lowGrades.length} academic records need review`,
      detail: "One or more final learning-area grades are below 75.",
      tone: "danger",
      href: "/grades",
    });
  }
  if (attendanceRisk.length) {
    items.push({
      id: "attendance-risk",
      title: `${attendanceRisk.length} attendance warning${attendanceRisk.length === 1 ? "" : "s"}`,
      detail: "Recorded absences exceed the 20% monitoring threshold.",
      tone: "warning",
      href: "/attendance",
    });
  }
  if (user.role !== "teacher" && pendingPromotions.length) {
    items.push({
      id: "promotion-review",
      title: "Promotion review is open",
      detail: `${pendingPromotions.length} learner records remain pending.`,
      tone: "info",
      href: "/promotion",
    });
  }
  return items;
}

