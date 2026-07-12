import { Link } from "react-router-dom";

import { PublicHero } from "../../components/public/public-hero";
import { SCHOOL_PROFILE } from "../../data/seed";

const commitments = [
  ["Strong foundations", "Reading, numeracy, values, and regular attendance remain central to daily learning."],
  ["Safe learning", "Clear routines and respectful relationships help children participate with confidence."],
  ["Family partnership", "Parents and guardians receive practical updates about progress, needs, and school life."],
  ["Responsive support", "Teachers use learner records to identify concerns early and plan appropriate follow-up."],
];

export function PublicAboutPage() {
  return (
    <>
      <PublicHero
        eyebrow="About the school"
        title="Rooted in community"
        description="Balili Elementary School serves young learners and families through public education shaped by care, discipline, and shared responsibility."
        image="/assets/section-about.webp"
      />

      <section className="public-section public-about-profile">
        <div className="public-container public-about-profile__grid">
          <div>
            <p className="public-eyebrow">School profile</p>
            <h2>Focused on children and the foundations they carry forward.</h2>
            <p className="public-section-lead">
              The school provides Kindergarten through Grade 6 instruction while coordinating attendance, academic progress, learner support, and family communication across every class section.
            </p>
            <dl className="public-profile-list public-profile-list--wide">
              <div><dt>School ID</dt><dd>{SCHOOL_PROFILE.schoolId}</dd></div>
              <div><dt>Region</dt><dd>{SCHOOL_PROFILE.region}</dd></div>
              <div><dt>Division</dt><dd>{SCHOOL_PROFILE.division}</dd></div>
              <div><dt>District</dt><dd>{SCHOOL_PROFILE.district}</dd></div>
              <div><dt>School Head</dt><dd>{SCHOOL_PROFILE.schoolHead}</dd></div>
              <div><dt>School Year</dt><dd>{SCHOOL_PROFILE.activeSchoolYear}</dd></div>
            </dl>
          </div>
          <figure>
            <img src="/assets/about-history.webp" alt="A learner and family meeting with a teacher" />
            <figcaption>Families and teachers working from the same understanding of learner progress.</figcaption>
          </figure>
        </div>
      </section>

      <section className="public-commitments">
        <div className="public-container public-commitments__grid">
          <div><p className="public-eyebrow">What guides us</p><h2>Clear priorities, practiced every day.</h2></div>
          <div className="public-commitments__list">
            {commitments.map(([title, description], index) => (
              <article key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="public-contact-strip">
        <div className="public-container">
          <div><p className="public-eyebrow">Stay informed</p><h2>Follow current school updates and important dates.</h2></div>
          <Link className="public-button public-button--dark" to="/announcements">View Announcements</Link>
        </div>
      </section>
    </>
  );
}
