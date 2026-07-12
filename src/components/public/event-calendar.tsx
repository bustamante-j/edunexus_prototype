import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { PublicEvent } from "../../data/public-seed";
import { cn } from "../../lib/utils";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function eventDateKey(event: PublicEvent) {
  return event.startsAt.slice(0, 10);
}

function dateFromKey(value: string) {
  return new Date(`${value}T00:00:00`);
}

function timeRange(event: PublicEvent) {
  const formatter = new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  });
  const start = formatter.format(new Date(event.startsAt));
  const end = event.endsAt ? formatter.format(new Date(event.endsAt)) : null;
  return end ? `${start} - ${end}` : start;
}

export function EventCalendar({ events, compact = false }: { events: PublicEvent[]; compact?: boolean }) {
  const firstEventDate = events.length ? dateFromKey(eventDateKey(events[0])) : new Date();
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(firstEventDate));
  const [selectedDate, setSelectedDate] = useState(firstEventDate);
  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, PublicEvent[]>();
    events.forEach((event) => {
      const key = eventDateKey(event);
      grouped.set(key, [...(grouped.get(key) ?? []), event]);
    });
    return grouped;
  }, [events]);
  const calendarDays = useMemo(() => eachDayOfInterval({
    start: startOfWeek(startOfMonth(visibleMonth), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(visibleMonth), { weekStartsOn: 0 }),
  }), [visibleMonth]);
  const selectedEvents = eventsByDate.get(format(selectedDate, "yyyy-MM-dd")) ?? [];

  function changeMonth(direction: "previous" | "next") {
    const month = direction === "previous" ? subMonths(visibleMonth, 1) : addMonths(visibleMonth, 1);
    const firstEvent = events.find((event) => eventDateKey(event).startsWith(format(month, "yyyy-MM")));
    setVisibleMonth(month);
    setSelectedDate(firstEvent ? dateFromKey(eventDateKey(firstEvent)) : startOfMonth(month));
  }

  return (
    <section className={cn("event-calendar", compact && "event-calendar--compact")} aria-label="Interactive school events calendar">
      <div className="event-calendar__month">
        <header className="event-calendar__toolbar">
          <div><span>School calendar</span><h3>{format(visibleMonth, "MMMM yyyy")}</h3></div>
          <div>
            <button type="button" aria-label="Previous month" title="Previous month" onClick={() => changeMonth("previous")}><ChevronLeft size={19} /></button>
            <button type="button" aria-label="Next month" title="Next month" onClick={() => changeMonth("next")}><ChevronRight size={19} /></button>
          </div>
        </header>

        <div className="event-calendar__weekdays" aria-hidden="true">
          {weekDays.map((day) => <span key={day}>{day}</span>)}
        </div>
        <div className="event-calendar__grid">
          {calendarDays.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDate.get(key) ?? [];
            const selected = isSameDay(day, selectedDate);
            const label = `${format(day, "EEEE, MMMM d, yyyy")}${dayEvents.length ? `, ${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}` : ""}`;
            return (
              <button
                type="button"
                aria-label={label}
                aria-pressed={selected}
                className={cn(
                  "event-calendar__day",
                  !isSameMonth(day, visibleMonth) && "is-outside",
                  selected && "is-selected",
                  dayEvents.length > 0 && "has-events",
                  isToday(day) && "is-today",
                )}
                key={key}
                onClick={() => setSelectedDate(day)}
              >
                <span>{format(day, "d")}</span>
                {dayEvents.length ? <small>{dayEvents.length}</small> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="event-calendar__details" aria-live="polite">
        <header><span>Selected date</span><strong>{format(selectedDate, "EEEE, MMMM d, yyyy")}</strong></header>
        {selectedEvents.length ? (
          <div className="event-calendar__event-list">
            {selectedEvents.map((event) => (
              <article key={event.id}>
                <p>{event.category}</p>
                <h3>{event.title}</h3>
                <dl><div><dt>Time</dt><dd>{timeRange(event)}</dd></div><div><dt>Venue</dt><dd>{event.location}</dd></div></dl>
                <p>{event.description}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="event-calendar__empty"><strong>No scheduled events</strong><p>Select a marked date to view activity details.</p></div>
        )}
      </div>
    </section>
  );
}
