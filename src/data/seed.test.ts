import { describe, expect, it } from "vitest";

import {
  SCHOOL_PROFILE,
  SECTIONS,
  SEED_ATTENDANCE,
  SEED_AUDIT_LOG,
  SEED_LEARNERS,
  USERS,
} from "./seed";

const laTrinidadBarangays = [
  "Alapang", "Alno", "Ambiong", "Bahong", "Balili", "Beckel", "Betag", "Bineng",
  "Cruz", "Lubas", "Pico", "Poblacion", "Puguis", "Shilan", "Tawang", "Wangal",
];

describe("presentation dataset", () => {
  it("matches the expanded prototype school profile", () => {
    expect(SEED_LEARNERS).toHaveLength(1077);
    expect(SECTIONS).toHaveLength(36);
    expect(SCHOOL_PROFILE.teachingPersonnel).toBe(SECTIONS.length);
    expect(new Set(SECTIONS.map((section) => section.adviserName)).size).toBe(SECTIONS.length);
  });

  it("uses unique learner reference numbers and valid class assignments", () => {
    const lrns = new Set(SEED_LEARNERS.map((learner) => learner.lrn));
    const fullNames = new Set(
      SEED_LEARNERS.map((learner) => `${learner.firstName} ${learner.middleName} ${learner.lastName}`),
    );
    const sectionIds = new Set(SECTIONS.map((section) => section.id));
    expect(lrns.size).toBe(SEED_LEARNERS.length);
    expect(fullNames.size).toBe(SEED_LEARNERS.length);
    expect(SEED_LEARNERS.every((learner) => /^\d{12}$/.test(learner.lrn))).toBe(true);
    expect(SEED_LEARNERS.every((learner) => sectionIds.has(learner.sectionId))).toBe(true);
  });

  it("uses a coherent Philippine school context", () => {
    const kindergartenNames = SECTIONS
      .filter((section) => section.gradeLevel === "Kindergarten")
      .map((section) => section.name);
    const staffNames = new Set(USERS.map((user) => user.fullName));

    expect(SCHOOL_PROFILE.region).toBe("Cordillera Administrative Region");
    expect(SCHOOL_PROFILE.division).toBe("Schools Division of Benguet");
    expect(kindergartenNames).toEqual([
      "Sampaguita", "Rosal", "Gumamela", "Ilang-Ilang", "Waling-Waling", "Camia",
    ]);
    expect(SEED_LEARNERS.every((learner) => /^09\d{9}$/.test(learner.guardianContact))).toBe(true);
    expect(SEED_LEARNERS.every((learner) =>
      laTrinidadBarangays.some((barangay) =>
        learner.address.endsWith(`Barangay ${barangay}, La Trinidad, Benguet`),
      ),
    )).toBe(true);
    expect(SEED_AUDIT_LOG.every((entry) => staffNames.has(entry.userName))).toBe(true);
  });

  it("models consistent fictional households and balanced class rosters", () => {
    const households = new Map<string, { address: string; guardianName: string }>();

    SEED_LEARNERS.forEach((learner) => {
      const household = households.get(learner.guardianContact);
      if (household) {
        expect(learner.address).toBe(household.address);
        expect(learner.guardianName).toBe(household.guardianName);
      } else {
        households.set(learner.guardianContact, {
          address: learner.address,
          guardianName: learner.guardianName,
        });
      }
    });

    expect(households.size).toBe(539);
    SECTIONS.forEach((section) => {
      const roster = SEED_LEARNERS.filter((learner) => learner.sectionId === section.id);
      const maleCount = roster.filter((learner) => learner.sex === "Male").length;
      const femaleCount = roster.length - maleCount;
      expect(roster.length).toBeGreaterThanOrEqual(29);
      expect(roster.length).toBeLessThanOrEqual(30);
      expect(Math.abs(maleCount - femaleCount)).toBeLessThanOrEqual(1);
    });
  });

  it("keeps attendance entries aligned with each Filipino class roster", () => {
    expect(SEED_ATTENDANCE).toHaveLength(SECTIONS.length * 10);
    SEED_ATTENDANCE.forEach((day) => {
      const section = SECTIONS.find((item) => item.id === day.sectionId)!;
      const learnerIds = SEED_LEARNERS
        .filter((learner) => learner.sectionId === day.sectionId)
        .map((learner) => learner.id);
      expect(day.recordedBy).toBe(section.adviserName);
      expect(Object.keys(day.entries).sort()).toEqual(learnerIds.sort());
    });
  });
});
