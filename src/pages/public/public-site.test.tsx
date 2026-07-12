// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";

import App from "../../App";
import { PUBLIC_ANNOUNCEMENTS, PUBLIC_EVENTS, PUBLIC_PROGRAMS } from "../../data/public-seed";
import { useAppStore } from "../../store/use-app-store";

describe("public school website", () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.getState().resetPrototype();
  });

  afterEach(() => cleanup());

  it.each([
    ["/", "Balili Elementary School"],
    ["/about", "Rooted in community"],
    ["/announcements", "News and announcements"],
    ["/events", "Events"],
    ["/programs", "Learning beyond lessons"],
    ["/contact", "School office"],
  ])("renders the %s route", async (route, heading) => {
    render(<MemoryRouter initialEntries={[route]}><App /></MemoryRouter>);
    expect(await screen.findByRole("heading", { level: 1, name: heading }, { timeout: 2500 })).toBeTruthy();
  });

  it("keeps the records workspace protected under the portal route", async () => {
    render(<MemoryRouter initialEntries={["/portal"]}><App /></MemoryRouter>);
    expect(await screen.findByRole("heading", { level: 2, name: "Sign in to EduNexus" }, { timeout: 2500 })).toBeTruthy();
  });

  it("keeps public content ordered and linked to local visual assets", () => {
    const announcementTimes = PUBLIC_ANNOUNCEMENTS.map((item) => new Date(item.publishedAt).getTime());
    const eventTimes = PUBLIC_EVENTS.map((item) => new Date(item.startsAt).getTime());
    expect(announcementTimes).toEqual([...announcementTimes].sort((a, b) => b - a));
    expect(eventTimes).toEqual([...eventTimes].sort((a, b) => a - b));
    expect(PUBLIC_PROGRAMS).toHaveLength(6);
    expect(PUBLIC_PROGRAMS.every((program) => program.image.startsWith("/assets/"))).toBe(true);
  });
});
