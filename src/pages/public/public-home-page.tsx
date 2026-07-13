import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { EventCalendar } from "../../components/public/event-calendar";
import { PUBLIC_ANNOUNCEMENTS, PUBLIC_EVENTS, PUBLIC_PROGRAMS } from "../../data/public-seed";
import { attendanceEquivalent } from "../../lib/grade-engine";
import { useAppStore } from "../../store/use-app-store";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

export function PublicHomePage() {
  const school = useAppStore((state) => state.school);
  const learners = useAppStore((state) => state.learners);
  const sections = useAppStore((state) => state.sections);
  const attendanceDays = useAppStore((state) => state.attendanceDays);
  const attendanceRate = useMemo(() => {
    const entries = attendanceDays.flatMap((day) => Object.values(day.entries));
    if (!entries.length) return 0;
    return entries.reduce((total, entry) => total + attendanceEquivalent(entry), 0) / entries.length * 100;
  }, [attendanceDays]);
  const leadAnnouncement = PUBLIC_ANNOUNCEMENTS[0];

  return (
    <>
      <section className="public-home-hero" style={{ backgroundImage: "url(/assets/balili-campus-hero.webp)" }}>
        <div className="public-home-hero__shade" />
        <div className="public-container public-home-hero__inner">
          <div className="public-home-hero__content">
            <p className="public-eyebrow public-eyebrow--light">Public school community in La Trinidad, Benguet</p>
            <h1>Balili Elementary School</h1>
            <p className="public-home-hero__lead">
              Learning with care, growing together, and helping every child build strong foundations for the future.
            </p>
            <div className="public-home-hero__actions">
              <Link className="public-button public-button--primary" to="/events">School Calendar</Link>
              <Link className="public-button public-button--ghost" to="/about">Explore Our School</Link>
            </div>
          </div>
          <div className="public-home-hero__aside">
            <span>School Year</span>
            <strong>{school.activeSchoolYear}</strong>
            <p>Official updates, programs, and school information for learners and families.</p>
          </div>
        </div>
      </section>

      <section className="public-metrics" aria-label="School profile statistics">
        <div className="public-container public-metrics__grid">
          <div><strong>{learners.length.toLocaleString("en-PH")}</strong><span>Enrolled learners</span></div>
          <div><strong>{sections.length}</strong><span>Class sections</span></div>
          <div><strong>{school.teachingPersonnel}</strong><span>Teaching personnel</span></div>
          <div><strong>{attendanceRate.toFixed(1)}%</strong><span>Recent attendance</span></div>
        </div>
      </section>

      <section className="public-section public-school-intro">
        <div className="public-container public-school-intro__grid">
          <div className="public-school-intro__copy">
            <p className="public-eyebrow">Our school</p>
            <h2>A place to learn, belong, and grow.</h2>
            <p className="public-section-lead">
              Balili Elementary School supports children through strong classroom foundations, close family partnership, and a school culture grounded in care and responsibility.
            </p>
            <dl className="public-profile-list">
              <div><dt>School ID</dt><dd>{school.schoolId}</dd></div>
              <div><dt>School Head</dt><dd>{school.schoolHead}</dd></div>
              <div><dt>District</dt><dd>{school.district}</dd></div>
              <div><dt>Location</dt><dd>{school.address}</dd></div>
            </dl>
            <Link className="public-text-link" to="/about">Learn more about the school <ArrowRight size={17} /></Link>
          </div>
          <figure className="public-school-intro__image">
            <img src="/assets/section-about.webp" alt="Balili Elementary School teachers and learners" />
            <figcaption>Working together for confident, curious, and caring learners.</figcaption>
          </figure>
        </div>
      </section>

      <section className="public-section public-bulletin">
        <div className="public-container">
          <div className="public-section-heading">
            <div><p className="public-eyebrow">Latest bulletin</p><h2>School news</h2></div>
            <Link className="public-text-link" to="/announcements">All announcements <ArrowRight size={17} /></Link>
          </div>

          <div className="public-bulletin__grid">
            <article className="public-bulletin__lead">
              <img src="/assets/news-feature.webp" alt="Learners participating in a school activity" width="1536" height="1024" loading="lazy" />
              <div>
                <p className="public-meta">{leadAnnouncement.category} / {formatDate(leadAnnouncement.publishedAt)}</p>
                <h3>{leadAnnouncement.title}</h3>
                <p>{leadAnnouncement.summary}</p>
              </div>
            </article>
            <div className="public-bulletin__list">
              {PUBLIC_ANNOUNCEMENTS.slice(1, 4).map((announcement) => (
                <article key={announcement.id}>
                  <p className="public-meta">{formatDate(announcement.publishedAt)}</p>
                  <h3>{announcement.title}</h3>
                  <p>{announcement.summary}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="public-events-band">
        <div className="public-container public-events-band__grid">
          <div className="public-events-band__intro">
            <p className="public-eyebrow public-eyebrow--light">School calendar</p>
            <h2>Dates for learners and families.</h2>
            <p>Upcoming school activities, family meetings, and academic schedules for the active term.</p>
            <Link className="public-button public-button--light" to="/events">View Full Calendar</Link>
          </div>
          <EventCalendar compact events={PUBLIC_EVENTS} />
        </div>
      </section>

      <section className="public-section public-program-preview">
        <div className="public-container">
          <div className="public-section-heading">
            <div><p className="public-eyebrow">Learning and wellbeing</p><h2>Programs for the whole child.</h2></div>
            <Link className="public-text-link" to="/programs">Explore all programs <ArrowRight size={17} /></Link>
          </div>
          <div className="public-program-preview__grid">
            {PUBLIC_PROGRAMS.slice(0, 3).map((program) => (
              <article key={program.id}>
                <img src={program.image} alt={`${program.title} at Balili Elementary School`} />
                <div><h3>{program.title}</h3><p>{program.summary}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="public-contact-strip">
        <div className="public-container">
          <div><p className="public-eyebrow">School office</p><h2>Questions about enrollment, records, or school activities?</h2></div>
          <Link className="public-button public-button--dark" to="/contact">Contact the School</Link>
        </div>
      </section>
    </>
  );
}
