// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";

import { useAppStore } from "./use-app-store";

describe("prototype store workflows", () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.getState().resetPrototype();
  });

  it("accepts the configured role accounts and rejects an incorrect password", () => {
    const accounts = [
      ["joshkane@edu.ph", "user-school-head"],
      ["diane@edu.ph", "user-admin-officer"],
      ["joshua@edu.ph", "user-teacher"],
    ] as const;

    accounts.forEach(([email, userId]) => {
      expect(useAppStore.getState().login(email, "12345678")).toBe(true);
      expect(useAppStore.getState().currentUserId).toBe(userId);
      useAppStore.getState().logout();
    });

    expect(useAppStore.getState().login("joshua@edu.ph", "wrong-password")).toBe(false);
  });

  it("refreshes fixed credentials when browser data is restored", async () => {
    localStorage.setItem("edunexus-prototype-v3", JSON.stringify({
      state: {
        users: useAppStore.getState().users.map((user) => ({ ...user, email: `old-${user.id}@example.test` })),
      },
      version: 0,
    }));

    await useAppStore.persist.rehydrate();

    expect(useAppStore.getState().users.map((user) => user.email)).toEqual([
      "joshkane@edu.ph",
      "diane@edu.ph",
      "joshua@edu.ph",
    ]);
  });

  it("creates a present-by-default attendance sheet for a new date", () => {
    useAppStore.getState().login("joshua@edu.ph", "12345678");
    useAppStore.getState().ensureAttendanceDay("2026-07-13", "grade-4-narra");
    const day = useAppStore.getState().attendanceDays.find(
      (item) => item.date === "2026-07-13" && item.sectionId === "grade-4-narra",
    );
    expect(day).toBeDefined();
    expect(Object.values(day!.entries).every((entry) => entry.am === "P" && entry.pm === "P")).toBe(true);
  });

  it("keeps attendance recording read only for the administrative officer", () => {
    useAppStore.getState().login("diane@edu.ph", "12345678");
    useAppStore.getState().ensureAttendanceDay("2026-07-14", "grade-4-narra");
    expect(useAppStore.getState().attendanceDays.some(
      (item) => item.date === "2026-07-14" && item.sectionId === "grade-4-narra",
    )).toBe(false);

    const existingDay = useAppStore.getState().attendanceDays[0];
    const learnerId = Object.keys(existingDay.entries)[0];
    const originalMark = existingDay.entries[learnerId].am;
    useAppStore.getState().setAttendanceMark(
      existingDay.date,
      existingDay.sectionId,
      learnerId,
      "am",
      originalMark === "A" ? "P" : "A",
    );
    const unchangedDay = useAppStore.getState().attendanceDays.find((item) => item.id === existingDay.id)!;
    expect(unchangedDay.entries[learnerId].am).toBe(originalMark);
  });
});
