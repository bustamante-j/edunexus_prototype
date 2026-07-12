import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  SCHOOL_PROFILE,
  SECTIONS,
  SEED_ATTENDANCE,
  SEED_DESCRIPTIVE_SHEETS,
  SEED_GRADE_SHEETS,
  SEED_LEARNERS,
  SUBJECTS,
} from "../src/data/seed";
import {
  createSchoolFormPdf,
  type SchoolFormType,
} from "../src/lib/pdf/school-forms";

const outputDirectory = resolve("tmp/pdfs/generated");
mkdirSync(outputDirectory, { recursive: true });

const learner = SEED_LEARNERS.find(
  (item) => item.sectionId === "grade-4-narra",
)!;

for (const type of ["sf2", "sf4", "sf9", "sf10"] as SchoolFormType[]) {
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
  const filePath = resolve(outputDirectory, `${type.toUpperCase()}-sample.pdf`);
  writeFileSync(filePath, Buffer.from(doc.output("arraybuffer")));
  console.log(filePath);
}
