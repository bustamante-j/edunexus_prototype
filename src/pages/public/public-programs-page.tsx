import { Link } from "react-router-dom";

import { PublicHero } from "../../components/public/public-hero";
import { PUBLIC_PROGRAMS } from "../../data/public-seed";

export function PublicProgramsPage() {
  return (
    <>
      <PublicHero
        eyebrow="Programs and services"
        title="Learning beyond lessons"
        description="School programs that support literacy, health, creativity, values, and meaningful family partnership."
        image="/assets/programs-hero.webp"
      />

      <section className="public-section public-programs-page">
        <div className="public-container public-programs-page__grid">
          <div>
            <p className="public-eyebrow">Whole-child support</p>
            <h2>Practical programs for learning and wellbeing.</h2>
            <p className="public-section-lead">Programs complement classroom instruction and help teachers respond to the academic, physical, social, and creative needs of elementary learners.</p>
          </div>
          <div className="public-program-list">
            {PUBLIC_PROGRAMS.map((program, index) => (
              <article key={program.id}>
                <img src={program.image} alt={`${program.title} at Balili Elementary School`} />
                <div><span>{String(index + 1).padStart(2, "0")}</span><h3>{program.title}</h3><p>{program.summary}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="public-contact-strip public-contact-strip--navy">
        <div className="public-container">
          <div><p className="public-eyebrow public-eyebrow--light">Learner support</p><h2>Coordinate with the school about a learner’s needs.</h2></div>
          <Link className="public-button public-button--light" to="/contact">Contact the School</Link>
        </div>
      </section>
    </>
  );
}
