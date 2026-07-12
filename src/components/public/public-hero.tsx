interface PublicHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
}

export function PublicHero({ eyebrow, title, description, image }: PublicHeroProps) {
  return (
    <section className="public-page-hero" style={{ backgroundImage: `url(${image})` }}>
      <div className="public-page-hero__shade" />
      <div className="public-container public-page-hero__content">
        <p className="public-eyebrow public-eyebrow--light">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </section>
  );
}
