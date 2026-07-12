import { describe, expect, it } from "vitest";

import {
  SCHOOL_PROFILE,
  SECTIONS,
  SEED_ATTENDANCE,
  SEED_DESCRIPTIVE_SHEETS,
  SEED_GRADE_SHEETS,
  SEED_LEARNERS,
  SUBJECTS,
} from "../../data/seed";
import { createSchoolFormPdf, type SchoolFormType } from "./school-forms";

describe("school form PDF generation", () => {
  it.each(["sf2", "sf4", "sf9", "sf10"] as SchoolFormType[])(
    "creates a non-empty %s document",
    (type) => {
      const learner = SEED_LEARNERS.find((item) => item.sectionId === "grade-4-narra")!;
      const doc = createSchoolFormPdf({
        type,
        school: SCHOOL_PROFILE,
        sections: SECTIONS,
        learners: SEED_LEARNERS,
        attendanceDays: SEED_ATTENDANCE,
        subjects: SUBJECTS,
        gradeSheets: SEED_GRADE_SHEETS,
        descriptiveSheets: SEED_DESCRIPTIVE_SHEETS,
        sectionId: "grade-4-narra",
        learnerId: learner.id,
        month: "2026-07",
      });

      expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
      expect(doc.output("arraybuffer").byteLength).toBeGreaterThan(5_000);
    },
  );
});
