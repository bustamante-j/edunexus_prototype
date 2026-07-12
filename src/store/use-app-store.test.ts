// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";

import { useAppStore } from "./use-app-store";

describe("prototype store workflows", () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.getState().resetPrototype();
  });

  it("accepts the configured role accounts and rejects an incorrect password", () => {
    expect(useAppStore.getState().login("joshua@balili.edu.ph", "12345678")).toBe(true);
    expect(useAppStore.getState().currentUserId).toBe("user-teacher");
    useAppStore.getState().logout();
    expect(useAppStore.getState().login("joshua@balili.edu.ph", "wrong-password")).toBe(false);
  });

  it("creates a present-by-default attendance sheet for a new date", () => {
    useAppStore.getState().login("joshua@balili.edu.ph", "12345678");
    useAppStore.getState().ensureAttendanceDay("2026-07-13", "grade-4-narra");
    const day = useAppStore.getState().attendanceDays.find(
      (item) => item.date === "2026-07-13" && item.sectionId === "grade-4-narra",
    );
    expect(day).toBeDefined();
    expect(Object.values(day!.entries).every((entry) => entry.am === "P" && entry.pm === "P")).toBe(true);
  });
});

