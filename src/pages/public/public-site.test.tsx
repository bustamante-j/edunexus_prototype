// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";

import App from "../../App";
import { EventCalendar } from "../../components/public/event-calendar";
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

  it("reserves the correct aspect ratio for the school news image", async () => {
    render(<MemoryRouter initialEntries={["/"]}><App /></MemoryRouter>);
    const image = await screen.findByRole("img", { name: "Learners participating in a school activity" }, { timeout: 2500 });
    expect(image.getAttribute("width")).toBe("1536");
    expect(image.getAttribute("height")).toBe("1024");
    expect(image.getAttribute("loading")).toBe("lazy");
  });

  it("shows event details when calendar dates and months are selected", () => {
    render(<EventCalendar events={PUBLIC_EVENTS} />);

    expect(screen.getByRole("heading", { name: "Family Reading Orientation" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /July 30, 2026, 1 event/ }));
    expect(screen.getByRole("heading", { name: "Nutrition Month Culminating Activity" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByRole("heading", { name: "First Parent-Teacher Conference" })).toBeTruthy();
  });
});
