import { describe, expect, it } from "vitest";

import {
  buildAttendanceTrend,
  classifyPriority,
  computePriorityScore,
} from "./analytics";
import type { AttendanceDay } from "../types/domain";

describe("learner priority analytics", () => {
  it("separates immediate, academic, attendance, and monitoring needs", () => {
    expect(classifyPriority({ generalAverage: 74, failingSubjects: 1, attendanceRate: 96, classDays: 10 })).toBe("critical");
    expect(classifyPriority({ generalAverage: 78, failingSubjects: 0, attendanceRate: 96, classDays: 10 })).toBe("academic");
    expect(classifyPriority({ generalAverage: 88, failingSubjects: 0, attendanceRate: 86, classDays: 10 })).toBe("attendance");
    expect(classifyPriority({ generalAverage: 82, failingSubjects: 0, attendanceRate: 94, classDays: 10 })).toBe("monitor");
    expect(classifyPriority({ generalAverage: 88, failingSubjects: 0, attendanceRate: 96, classDays: 10 })).toBe("on_track");
  });

  it("orders more severe records with a higher score", () => {
    const urgent = { generalAverage: 72, failingSubjects: 2, attendanceRate: 76, classDays: 10 };
    const monitor = { generalAverage: 82, failingSubjects: 0, attendanceRate: 92, classDays: 10 };
    expect(computePriorityScore(urgent, classifyPriority(urgent))).toBeGreaterThan(
      computePriorityScore(monitor, classifyPriority(monitor)),
    );
  });
});

describe("attendance trend analytics", () => {
  it("scopes dates to selected sections and computes participation", () => {
    const days: AttendanceDay[] = [
      {
        id: "a-1",
        date: "2026-07-01",
        sectionId: "section-a",
        entries: {
          learner1: { am: "P", pm: "P", remarks: "" },
          learner2: { am: "A", pm: "A", remarks: "" },
        },
        recordedBy: "Teacher",
        updatedAt: "2026-07-01T08:00:00.000Z",
      },
      {
        id: "b-1",
        date: "2026-07-01",
        sectionId: "section-b",
        entries: {
          learner3: { am: "P", pm: "P", remarks: "" },
        },
        recordedBy: "Teacher",
        updatedAt: "2026-07-01T08:00:00.000Z",
      },
    ];

    expect(buildAttendanceTrend(days, ["section-a"])).toEqual([
      { date: "2026-07-01", rate: 50, absentEquivalent: 1, entries: 2 },
    ]);
  });
});
