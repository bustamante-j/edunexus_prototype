import { PublicHero } from "../../components/public/public-hero";
import { PUBLIC_ANNOUNCEMENTS } from "../../data/public-seed";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function monthDay(value: string) {
  const date = new Date(value);
  return {
    month: new Intl.DateTimeFormat("en-PH", { month: "short", timeZone: "Asia/Manila" }).format(date),
    day: new Intl.DateTimeFormat("en-PH", { day: "2-digit", timeZone: "Asia/Manila" }).format(date),
  };
}

export function PublicAnnouncementsPage() {
  const lead = PUBLIC_ANNOUNCEMENTS[0];

  return (
    <>
      <PublicHero
        eyebrow="School bulletin"
        title="News and announcements"
        description="Official reminders and school updates for learners, parents, guardians, and community partners."
        image="/assets/section-news.webp"
      />

      <section className="public-section public-announcements-page">
        <div className="public-container public-announcements-page__grid">
          <article className="public-announcement-feature">
            <img src="/assets/news-feature.webp" alt="Learners joining a school reading activity" />
            <div>
              <p className="public-meta">Latest bulletin / {formatDate(lead.publishedAt)}</p>
              <h2>{lead.title}</h2>
              <p>{lead.summary}</p>
              <span>{lead.category}</span>
            </div>
          </article>

          <aside className="public-announcement-archive">
            <div className="public-section-heading public-section-heading--compact">
              <div><p className="public-eyebrow">Archive</p><h2>More updates</h2></div>
            </div>
            <div>
              {PUBLIC_ANNOUNCEMENTS.slice(1).map((announcement) => {
                const date = monthDay(announcement.publishedAt);
                return (
                  <article key={announcement.id}>
                    <time dateTime={announcement.publishedAt}><span>{date.month}</span><strong>{date.day}</strong></time>
                    <div><p className="public-meta">{announcement.category}</p><h3>{announcement.title}</h3><p>{announcement.summary}</p></div>
                  </article>
                );
              })}
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
