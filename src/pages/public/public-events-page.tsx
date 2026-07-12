import { EventCalendar } from "../../components/public/event-calendar";
import { PublicHero } from "../../components/public/public-hero";
import { PUBLIC_EVENTS } from "../../data/public-seed";

function eventDate(value: string) {
  const date = new Date(value);
  return {
    month: new Intl.DateTimeFormat("en-PH", { month: "short", timeZone: "Asia/Manila" }).format(date),
    day: new Intl.DateTimeFormat("en-PH", { day: "2-digit", timeZone: "Asia/Manila" }).format(date),
    full: new Intl.DateTimeFormat("en-PH", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "Asia/Manila",
    }).format(date),
    time: new Intl.DateTimeFormat("en-PH", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Asia/Manila",
    }).format(date),
  };
}

export function PublicEventsPage() {
  return (
    <>
      <PublicHero
        eyebrow="School calendar"
        title="Events"
        description="Upcoming school activities, family meetings, assessment schedules, and community programs."
        image="/assets/section-events.webp"
      />

      <section className="public-section public-events-calendar-page">
        <div className="public-container">
          <div className="public-section-heading">
            <div><p className="public-eyebrow">Interactive calendar</p><h2>Select a date to view details.</h2></div>
          </div>
          <EventCalendar events={PUBLIC_EVENTS} />
        </div>
      </section>

      <section className="public-section public-events-page">
        <div className="public-container public-events-page__grid">
          <div>
            <p className="public-eyebrow">Complete schedule</p>
            <h2>Plan ahead for the active school term.</h2>
            <p className="public-section-lead">Schedules may be adjusted when necessary. Class advisers will communicate any section-specific changes directly to families.</p>
          </div>
          <div className="public-event-list">
            {PUBLIC_EVENTS.map((event) => {
              const date = eventDate(event.startsAt);
              return (
                <article key={event.id}>
                  <time dateTime={event.startsAt}><span>{date.month}</span><strong>{date.day}</strong></time>
                  <div>
                    <p className="public-meta">{event.category}</p>
                    <h3>{event.title}</h3>
                    <p>{event.description}</p>
                    <dl><div><dt>Date</dt><dd>{date.full}</dd></div><div><dt>Time</dt><dd>{date.time}</dd></div><div><dt>Venue</dt><dd>{event.location}</dd></div></dl>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
