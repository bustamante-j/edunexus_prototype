import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import { SCHOOL_PROFILE } from "../../data/seed";
import { cn } from "../../lib/utils";

const navigation = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/announcements", label: "Announcements" },
  { to: "/events", label: "Events" },
  { to: "/programs", label: "Programs" },
  { to: "/contact", label: "Contact" },
];

const pageTitles: Record<string, string> = {
  "/": "Balili Elementary School",
  "/about": "About | Balili Elementary School",
  "/announcements": "Announcements | Balili Elementary School",
  "/events": "Events | Balili Elementary School",
  "/programs": "Programs | Balili Elementary School",
  "/contact": "Contact | Balili Elementary School",
};

export function PublicShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
    document.title = pageTitles[location.pathname] ?? "Balili Elementary School";
  }, [location.pathname]);

  return (
    <div className="public-site">
      <div className="public-government-bar">
        <div className="public-container">
          <span>Republic of the Philippines</span>
          <span>Department of Education</span>
          <span>Schools Division of Benguet</span>
        </div>
      </div>

      <header className="public-header">
        <div className="public-container public-header__inner">
          <Link className="public-brand" to="/" aria-label="Balili Elementary School home">
            <img src="/assets/edunexus-mark.png" alt="" />
            <span>
              <strong>Balili Elementary School</strong>
              <small>School ID {SCHOOL_PROFILE.schoolId}</small>
            </span>
          </Link>

          <nav className="public-nav" aria-label="School website navigation">
            {navigation.map((item) => (
              <NavLink
                className={({ isActive }) => cn("public-nav__link", isActive && "is-active")}
                end={item.to === "/"}
                key={item.to}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="public-header__actions">
            <Link className="public-portal-link" to="/login">Staff Portal</Link>
            <button
              className="public-menu-button"
              type="button"
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((value) => !value)}
            >
              {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>

        <nav className={cn("public-mobile-nav", menuOpen && "is-open")} aria-label="Mobile school website navigation">
          <div className="public-container">
            {navigation.map((item) => (
              <NavLink
                className={({ isActive }) => cn("public-mobile-nav__link", isActive && "is-active")}
                end={item.to === "/"}
                key={item.to}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
            <Link className="public-mobile-nav__portal" to="/login">Open Staff Portal</Link>
          </div>
        </nav>
      </header>

      <main className="public-main"><Outlet /></main>

      <footer className="public-footer">
        <div className="public-container public-footer__grid">
          <div className="public-footer__identity">
            <img src="/assets/edunexus-mark.png" alt="" />
            <div>
              <strong>{SCHOOL_PROFILE.name}</strong>
              <p>A caring public elementary school community in La Trinidad, Benguet.</p>
            </div>
          </div>
          <div>
            <h2>School</h2>
            <Link to="/about">About</Link>
            <Link to="/announcements">Announcements</Link>
            <Link to="/events">Events</Link>
            <Link to="/programs">Programs</Link>
          </div>
          <div>
            <h2>Contact</h2>
            <p>{SCHOOL_PROFILE.address}</p>
            <p>{SCHOOL_PROFILE.phone}</p>
            <p>{SCHOOL_PROFILE.email}</p>
          </div>
          <div>
            <h2>Official links</h2>
            <a href="https://www.deped.gov.ph/" target="_blank" rel="noreferrer">DepEd Philippines</a>
            <a href="https://car.deped.gov.ph/" target="_blank" rel="noreferrer">DepEd CAR</a>
            <a href="https://depedbenguet.com/" target="_blank" rel="noreferrer">DepEd Benguet</a>
          </div>
        </div>
        <div className="public-container public-footer__bottom">
          <span>© 2026 Balili Elementary School</span>
          <span>Powered by EduNexus</span>
        </div>
      </footer>
    </div>
  );
}
