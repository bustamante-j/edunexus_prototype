import type {
  AttendanceEntry,
  DescriptiveMark,
  ScoreSet,
  Subject,
} from "../types/domain";

export const HIGHEST_POSSIBLE_SCORES = {
  ww: [20, 25, 20] as const,
  pt: [25, 25, 25] as const,
  exams: [20, 20, 40] as const,
};

export const SUBJECT_WEIGHTS = {
  core: { ww: 0.2, pt: 0.5, exams: 0.3 },
  performance: { ww: 0.2, pt: 0.6, exams: 0.2 },
} as const;

const TRANSMUTATION_THRESHOLDS: Array<[number, number]> = [
  [99.5, 100],
  [98.32, 99],
  [97.14, 98],
  [95.96, 97],
  [94.78, 96],
  [93.6, 95],
  [92.42, 94],
  [91.24, 93],
  [90.06, 92],
  [88.88, 91],
  [87.7, 90],
  [86.52, 89],
  [85.34, 88],
  [84.16, 87],
  [82.98, 86],
  [81.8, 85],
  [80.62, 84],
  [79.44, 83],
  [78.26, 82],
  [77.08, 81],
  [75.9, 80],
  [74.72, 79],
  [73.54, 78],
  [72.36, 77],
  [71.18, 76],
  [70, 75],
  [65.34, 74],
  [60.67, 73],
  [56.01, 72],
  [51.34, 71],
  [46.67, 70],
  [42.01, 69],
  [37.34, 68],
  [32.68, 67],
  [28.01, 66],
  [23.35, 65],
  [18.68, 64],
  [14.01, 63],
  [9.35, 62],
  [4.68, 61],
  [0, 60],
];

export interface GradeComputation {
  wwPercent: number;
  ptPercent: number;
  examPercent: number;
  wwWeighted: number;
  ptWeighted: number;
  examWeighted: number;
  initialGrade: number;
  transmutedGrade: number;
  descriptor: ReturnType<typeof numericDescriptor>;
}

function percent(total: number, highest: number) {
  return highest ? Math.min(100, Math.max(0, (total / highest) * 100)) : 0;
}

function sum(values: readonly number[]) {
  return values.reduce((total, value) => total + Number(value || 0), 0);
}

export function transmuteGrade(initialGrade: number) {
  const bounded = Math.min(100, Math.max(0, initialGrade));
  return (
    TRANSMUTATION_THRESHOLDS.find(([minimum]) => bounded >= minimum)?.[1] ?? 60
  );
}

export function numericDescriptor(grade: number) {
  if (grade >= 90) {
    return {
      label: "Advancing",
      Filipino: "Namumukod-tangi",
      status: "Passed",
      tone: "excellent" as const,
    };
  }
  if (grade >= 80) {
    return {
      label: "Benchmarking",
      Filipino: "Napamamalas",
      status: "Passed",
      tone: "good" as const,
    };
  }
  if (grade >= 75) {
    return {
      label: "Connecting",
      Filipino: "Natututong",
      status: "Passed",
      tone: "watch" as const,
    };
  }
  if (grade >= 65) {
    return {
      label: "Developing",
      Filipino: "Napauunlad",
      status: "Failed",
      tone: "danger" as const,
    };
  }
  return {
    label: "Emerging",
    Filipino: "Nagsisimula",
    status: "Failed",
    tone: "danger" as const,
  };
}

export function descriptiveDescriptor(mark: DescriptiveMark) {
  const values = {
    A: ["Advancing", "Namumukod-tangi"],
    B: ["Benchmarking", "Napamamalas"],
    C: ["Connecting", "Natututong"],
    D: ["Developing", "Napauunlad"],
    E: ["Emerging", "Nagsisimula"],
  } as const;
  return { label: values[mark][0], Filipino: values[mark][1] };
}

export function computeGrade(scores: ScoreSet, subject: Subject): GradeComputation {
  const wwPercent = percent(sum(scores.ww), sum(HIGHEST_POSSIBLE_SCORES.ww));
  const ptPercent = percent(sum(scores.pt), sum(HIGHEST_POSSIBLE_SCORES.pt));
  const examParts = scores.exams.map((score, index) =>
    percent(score, HIGHEST_POSSIBLE_SCORES.exams[index]),
  );
  const examPercent =
    examParts[0] * 0.3 + examParts[1] * 0.3 + examParts[2] * 0.4;
  const weights = SUBJECT_WEIGHTS[subject.category];
  const wwWeighted = wwPercent * weights.ww;
  const ptWeighted = ptPercent * weights.pt;
  const examWeighted = examPercent * weights.exams;
  const initialGrade = wwWeighted + ptWeighted + examWeighted;
  const transmutedGrade = transmuteGrade(initialGrade);

  return {
    wwPercent,
    ptPercent,
    examPercent,
    wwWeighted,
    ptWeighted,
    examWeighted,
    initialGrade,
    transmutedGrade,
    descriptor: numericDescriptor(transmutedGrade),
  };
}

export function attendanceEquivalent(entry: AttendanceEntry) {
  const value = (mark: AttendanceEntry["am"]) => {
    if (mark === "P" || mark === "L") return 0.5;
    if (mark === "E") return 0.25;
    return 0;
  };
  return value(entry.am) + value(entry.pm);
}

export function isAttendanceRisk(absentEquivalent: number, classDays: number) {
  return classDays > 0 && absentEquivalent / classDays > 0.2;
}

export function gradeTone(grade: number) {
  if (grade < 75) return "danger" as const;
  if (grade < 80) return "warning" as const;
  if (grade >= 90) return "success" as const;
  return "neutral" as const;
}

