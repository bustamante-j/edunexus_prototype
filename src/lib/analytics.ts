import { attendanceEquivalent } from "./grade-engine";
import {
  learnerAcademicSummary,
  learnerAttendanceSummary,
} from "./selectors";
import type {
  AttendanceDay,
  GradeSheet,
  Learner,
  Section,
  Subject,
} from "../types/domain";

export interface AnalyticsThresholds {
  grade: number;
  attendance: number;
}

export type LearnerPriority =
  | "critical"
  | "academic"
  | "attendance"
  | "monitor"
  | "data_gap"
  | "on_track";

export interface PriorityMetrics {
  generalAverage: number;
  failingSubjects: number;
  attendanceRate: number;
  classDays: number;
}

export interface LearnerInsight {
  learner: Learner;
  section?: Section;
  academic: ReturnType<typeof learnerAcademicSummary>;
  attendance: ReturnType<typeof learnerAttendanceSummary>;
  priority: LearnerPriority;
  priorityScore: number;
  concerns: string[];
  recommendedAction: string;
}

export const DEFAULT_ANALYTICS_THRESHOLDS: AnalyticsThresholds = {
  grade: 80,
  attendance: 90,
};

export const PRIORITY_LABELS: Record<LearnerPriority, string> = {
  critical: "Immediate action",
  academic: "Academic support",
  attendance: "Attendance follow-up",
  monitor: "Monitor",
  data_gap: "Complete records",
  on_track: "On track",
};

export function classifyPriority(
  metrics: PriorityMetrics,
  thresholds: AnalyticsThresholds = DEFAULT_ANALYTICS_THRESHOLDS,
): LearnerPriority {
  const academicConcern = metrics.generalAverage < thresholds.grade;
  const attendanceConcern =
    metrics.classDays > 0 && metrics.attendanceRate < thresholds.attendance;
  const severeAcademic = metrics.generalAverage < 75;
  const severeAttendance =
    metrics.classDays > 0 && metrics.attendanceRate < 80;

  if (
    severeAcademic ||
    severeAttendance ||
    (academicConcern && attendanceConcern)
  ) {
    return "critical";
  }
  if (academicConcern) return "academic";
  if (attendanceConcern) return "attendance";
  if (!metrics.classDays) return "data_gap";
  if (
    metrics.generalAverage < thresholds.grade + 3 ||
    metrics.attendanceRate < thresholds.attendance + 3
  ) {
    return "monitor";
  }
  return "on_track";
}

export function computePriorityScore(
  metrics: PriorityMetrics,
  priority: LearnerPriority,
  thresholds: AnalyticsThresholds = DEFAULT_ANALYTICS_THRESHOLDS,
) {
  const base: Record<LearnerPriority, number> = {
    critical: 100,
    academic: 70,
    attendance: 65,
    monitor: 35,
    data_gap: 25,
    on_track: 0,
  };
  const gradeGap = Math.max(0, thresholds.grade - metrics.generalAverage);
  const attendanceGap = metrics.classDays
    ? Math.max(0, thresholds.attendance - metrics.attendanceRate)
    : 0;
  return Number(
    (
      base[priority] +
      gradeGap * 2 +
      attendanceGap +
      metrics.failingSubjects * 6
    ).toFixed(1),
  );
}

function concernsFor(
  metrics: PriorityMetrics,
  thresholds: AnalyticsThresholds,
) {
  const concerns: string[] = [];
  if (metrics.generalAverage < 75) concerns.push("Below passing standard");
  else if (metrics.generalAverage < thresholds.grade) concerns.push("Below academic target");
  if (metrics.failingSubjects) {
    concerns.push(
      `${metrics.failingSubjects} failing learning area${metrics.failingSubjects === 1 ? "" : "s"}`,
    );
  }
  if (!metrics.classDays) concerns.push("No attendance entries");
  else if (metrics.attendanceRate < thresholds.attendance) {
    concerns.push("Below attendance target");
  }
  return concerns;
}

function recommendedAction(priority: LearnerPriority) {
  switch (priority) {
    case "critical":
      return "Contact the guardian, validate causes, and agree on a documented support plan.";
    case "academic":
      return "Schedule focused remediation and review progress at the next assessment cycle.";
    case "attendance":
      return "Validate absences with the guardian and set a weekly attendance follow-up.";
    case "monitor":
      return "Review the next attendance and grading update before escalating support.";
    case "data_gap":
      return "Complete the missing attendance record before making a learner decision.";
    default:
      return "Continue regular classroom monitoring.";
  }
}

export function buildLearnerInsights(
  learners: Learner[],
  sections: Section[],
  subjects: Subject[],
  gradeSheets: GradeSheet[],
  attendanceDays: AttendanceDay[],
  thresholds: AnalyticsThresholds = DEFAULT_ANALYTICS_THRESHOLDS,
): LearnerInsight[] {
  return learners.map((learner) => {
    const academic = learnerAcademicSummary(learner, subjects, gradeSheets);
    const attendance = learnerAttendanceSummary(learner.id, attendanceDays);
    const metrics: PriorityMetrics = {
      generalAverage: academic.generalAverage,
      failingSubjects: academic.failingSubjects.length,
      attendanceRate: attendance.rate,
      classDays: attendance.classDays,
    };
    const priority = classifyPriority(metrics, thresholds);
    return {
      learner,
      section: sections.find((section) => section.id === learner.sectionId),
      academic,
      attendance,
      priority,
      priorityScore: computePriorityScore(metrics, priority, thresholds),
      concerns: concernsFor(metrics, thresholds),
      recommendedAction: recommendedAction(priority),
    };
  });
}

export interface SectionBenchmark {
  section: Section;
  learners: number;
  averageGrade: number;
  attendanceRate: number;
  critical: number;
  support: number;
  onTrack: number;
  priorityRate: number;
}

export function buildSectionBenchmarks(
  insights: LearnerInsight[],
  sections: Section[],
): SectionBenchmark[] {
  return sections
    .map((section) => {
      const records = insights.filter(
        (insight) => insight.learner.sectionId === section.id,
      );
      const learners = records.length;
      const critical = records.filter(
        (record) => record.priority === "critical",
      ).length;
      const support = records.filter((record) =>
        ["critical", "academic", "attendance"].includes(record.priority),
      ).length;
      const onTrack = records.filter(
        (record) => record.priority === "on_track",
      ).length;
      return {
        section,
        learners,
        averageGrade: learners
          ? records.reduce(
              (total, record) => total + record.academic.generalAverage,
              0,
            ) / learners
          : 0,
        attendanceRate: learners
          ? records.reduce(
              (total, record) => total + record.attendance.rate,
              0,
            ) / learners
          : 0,
        critical,
        support,
        onTrack,
        priorityRate: learners ? (support / learners) * 100 : 0,
      };
    })
    .filter((benchmark) => benchmark.learners)
    .sort(
      (a, b) =>
        b.priorityRate - a.priorityRate ||
        a.averageGrade - b.averageGrade ||
        a.section.name.localeCompare(b.section.name),
    );
}

export interface SubjectBenchmark {
  subject: Subject;
  average: number;
  passRate: number;
  belowTarget: number;
  termAverages: [number, number, number];
  change: number;
  gapToStrongest: number;
}

export function buildSubjectBenchmarks(
  insights: LearnerInsight[],
  subjects: Subject[],
  gradeThreshold: number,
): SubjectBenchmark[] {
  const rows = subjects.map((subject) => {
    const grades = insights
      .map((insight) =>
        insight.academic.subjectGrades.find(
          (item) => item.subject.id === subject.id,
        ),
      )
      .filter((item) => item !== undefined);
    const average = grades.length
      ? grades.reduce((total, item) => total + item.finalGrade, 0) / grades.length
      : 0;
    const termAverages = ([0, 1, 2] as const).map((termIndex) =>
      grades.length
        ? grades.reduce((total, item) => total + item.terms[termIndex], 0) /
          grades.length
        : 0,
    ) as [number, number, number];
    return {
      subject,
      average,
      passRate: grades.length
        ? (grades.filter((item) => item.finalGrade >= 75).length / grades.length) *
          100
        : 0,
      belowTarget: grades.filter((item) => item.finalGrade < gradeThreshold).length,
      termAverages,
      change: termAverages[2] - termAverages[0],
      gapToStrongest: 0,
    };
  });
  const strongest = Math.max(0, ...rows.map((row) => row.average));
  return rows
    .map((row) => ({ ...row, gapToStrongest: strongest - row.average }))
    .sort((a, b) => a.average - b.average);
}

export interface AttendanceTrendPoint {
  date: string;
  rate: number;
  absentEquivalent: number;
  entries: number;
}

export function buildAttendanceTrend(
  attendanceDays: AttendanceDay[],
  sectionIds: string[],
  limit = 12,
): AttendanceTrendPoint[] {
  const allowedSections = new Set(sectionIds);
  const dates = [
    ...new Set(
      attendanceDays
        .filter((day) => allowedSections.has(day.sectionId))
        .map((day) => day.date),
    ),
  ]
    .sort()
    .slice(-limit);

  return dates.map((date) => {
    const entries = attendanceDays
      .filter(
        (day) => day.date === date && allowedSections.has(day.sectionId),
      )
      .flatMap((day) => Object.values(day.entries));
    const presentEquivalent = entries.reduce(
      (total, entry) => total + attendanceEquivalent(entry),
      0,
    );
    return {
      date,
      rate: entries.length ? (presentEquivalent / entries.length) * 100 : 0,
      absentEquivalent: Math.max(0, entries.length - presentEquivalent),
      entries: entries.length,
    };
  });
}
