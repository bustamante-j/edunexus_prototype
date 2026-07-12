import { describe, expect, it } from "vitest";

import { computeGrade, isAttendanceRisk, transmuteGrade } from "./grade-engine";
import type { Subject } from "../types/domain";

const coreSubject: Subject = {
  id: "science",
  code: "SCI",
  name: "Science",
  category: "core",
};

describe("SY 2026-2027 adjusted transmutation", () => {
  it("maps the passing initial-grade threshold to 75", () => {
    expect(transmuteGrade(70)).toBe(75);
    expect(transmuteGrade(69.99)).toBe(74);
  });

  it("preserves the published upper and lower bounds", () => {
    expect(transmuteGrade(100)).toBe(100);
    expect(transmuteGrade(99.49)).toBe(99);
    expect(transmuteGrade(0)).toBe(60);
  });
});

describe("weighted grade computation", () => {
  it("applies 20% WW, 50% PT, and 30% EX for core learning areas", () => {
    const result = computeGrade(
      {
        ww: [20, 25, 20],
        pt: [25, 25, 25],
        exams: [20, 20, 40],
      },
      coreSubject,
    );

    expect(result.wwWeighted).toBe(20);
    expect(result.ptWeighted).toBe(50);
    expect(result.examWeighted).toBe(30);
    expect(result.initialGrade).toBe(100);
    expect(result.transmutedGrade).toBe(100);
  });

  it("weights ST1, ST2, and the term exam at 30/30/40 inside EX", () => {
    const result = computeGrade(
      {
        ww: [14, 18, 14],
        pt: [18, 18, 18],
        exams: [20, 0, 40],
      },
      coreSubject,
    );
    expect(result.examPercent).toBe(70);
  });
});

describe("attendance monitoring threshold", () => {
  it("flags absences only when they exceed 20 percent", () => {
    expect(isAttendanceRisk(2, 10)).toBe(false);
    expect(isAttendanceRisk(2.5, 10)).toBe(true);
  });
});

