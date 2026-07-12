import { describe, expect, it } from "vitest";

import { SECTIONS, SEED_LEARNERS } from "./seed";

describe("presentation dataset", () => {
  it("matches the revised paper's school profile", () => {
    expect(SEED_LEARNERS).toHaveLength(897);
    expect(SECTIONS).toHaveLength(30);
  });

  it("uses unique learner reference numbers and valid class assignments", () => {
    const lrns = new Set(SEED_LEARNERS.map((learner) => learner.lrn));
    const sectionIds = new Set(SECTIONS.map((section) => section.id));
    expect(lrns.size).toBe(SEED_LEARNERS.length);
    expect(SEED_LEARNERS.every((learner) => /^\d{12}$/.test(learner.lrn))).toBe(true);
    expect(SEED_LEARNERS.every((learner) => sectionIds.has(learner.sectionId))).toBe(true);
  });
});

