// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { AnalyticsPage } from "./analytics-page";
import { AttendancePage } from "./attendance-page";
import { LearnersPage } from "./learners-page";
import { useAppStore } from "../store/use-app-store";

function renderPortalPage(path: string, element: ReactNode) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes><Route path="/portal/*" element={element} /></Routes>
    </MemoryRouter>,
  );
}

describe("customizable learner workspace", () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.getState().resetPrototype();
    useAppStore.getState().login("joshua@edu.ph", "12345678");
  });

  afterEach(() => cleanup());

  it("switches among table, card, and minimalist displays", () => {
    const { container } = renderPortalPage("/portal/learners", <LearnersPage />);
    fireEvent.click(screen.getByRole("button", { name: /display/i }));
    expect(screen.getByRole("button", { name: "Table" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cards" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Minimal" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Minimal" }));
    expect(container.querySelector(".learner-minimal-list")).toBeTruthy();
    expect(screen.getByText("Rows per page")).toBeTruthy();
  });
});

describe("decision analytics", () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.getState().resetPrototype();
    useAppStore.getState().login("joshua@edu.ph", "12345678");
  });

  afterEach(() => cleanup());

  it("provides action, section, and subject analysis views", () => {
    renderPortalPage("/portal/analytics", <AnalyticsPage />);
    expect(screen.getByRole("heading", { name: "Action center" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Sections" }));
    expect(screen.getByRole("heading", { name: "Section benchmark" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Subjects" }));
    expect(screen.getByRole("heading", { name: "Subject gap analysis" })).toBeTruthy();
  });
});

describe("administrative attendance access", () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.getState().resetPrototype();
    useAppStore.getState().login("diane@edu.ph", "12345678");
  });

  afterEach(() => cleanup());

  it("shows reports without attendance recording controls", () => {
    renderPortalPage("/portal/attendance", <AttendancePage />);
    expect(screen.getByRole("heading", { level: 1, name: "Attendance reports" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /save attendance/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /mark all present/i })).toBeNull();
    expect(screen.getByRole("button", { name: "Monthly summary" }).getAttribute("aria-pressed")).toBe("true");
  });
});
