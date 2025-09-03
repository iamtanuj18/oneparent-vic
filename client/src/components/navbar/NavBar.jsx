// src/components/navbar/NavBar.jsx
import { useEffect } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import "./NavBar.css";
import logoUrl from "../../assets/Logo.svg";

const NavBar = () => {
  const { pathname } = useLocation();

  const isActivitiesActive = ["/playdate", "/events"].some((p) =>
    pathname.startsWith(p)
  );
  const isMoreActive = ["/about", "/privacy", "/data-privacy"].some((p) =>
    pathname.startsWith(p)
  );

  // auto-close collapse + reset burger + close open dropdowns on route change
  useEffect(() => {
    const collapseEl = document.getElementById("mainNavbar");
    const toggler = document.querySelector('[data-bs-target="#mainNavbar"]');
    const BS = window.bootstrap?.Collapse;

    if (collapseEl) {
      if (BS) {
        const inst = BS.getInstance(collapseEl) || new BS(collapseEl, { toggle: false });
        inst.hide();
      }
      collapseEl.classList.remove("show");
    }
    if (toggler) toggler.setAttribute("aria-expanded", "false");
    document
      .querySelectorAll(".dropdown-menu.show, .dropdown-toggle[aria-expanded='true']")
      .forEach((el) => {
        el.classList.remove("show");
        el.setAttribute?.("aria-expanded", "false");
      });
  }, [pathname]);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white sticky-top border-bottom">
      <div className="container-xl">
        {/* brand */}
        <Link to="/" className="navbar-brand d-flex align-items-center gap-3" aria-label="OneParent VIC home">
          <img src={logoUrl} alt="" width={60} height={60} />
          <span className="brand-title">
            OneParent <span className="brand-accent">VIC</span>
          </span>
        </Link>

        {/* hamburger */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="toggler-icon top-bar"></span>
          <span className="toggler-icon middle-bar"></span>
          <span className="toggler-icon bottom-bar"></span>
        </button>
      </div>

      {/* links (note: outside the container so we can full-bleed on mobile) */}
      <div className="collapse navbar-collapse full-bleed" id="mainNavbar">
        <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center container-xl px-lg-0">
          <li className="nav-item">
            <NavLink to="/" end className="nav-link">Home</NavLink>
          </li>

          {/* Events & Activities */}
          <li className="nav-item dropdown">
            <a
              href="#"
              className={`nav-link dropdown-toggle ${isActivitiesActive ? "active" : ""}`}
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              Events & Activities
            </a>
            <ul className="dropdown-menu dropdown-box">
              <li>
                <NavLink
                  to="/playdate"
                  className={({ isActive }) => `dropdown-item ${isActive ? "is-active" : ""}`}
                >
                  <span className="title">Playdate Planner</span>
                  <span className="desc">Use our AI activity generator to plan fun, age-fit playdates.</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/events"
                  className={({ isActive }) => `dropdown-item ${isActive ? "is-active" : ""}`}
                >
                  <span className="title">Find Events</span>
                  <span className="desc">Family & children-friendly events across Victoria in one place.</span>
                </NavLink>
              </li>
            </ul>
          </li>

          {/* Singles */}
          <li className="nav-item"><NavLink to="/benefits" className="nav-link">Benefits</NavLink></li>
          <li className="nav-item"><NavLink to="/childcare" className="nav-link">Childcare</NavLink></li>
          <li className="nav-item"><NavLink to="/wellbeing" className="nav-link">Wellbeing</NavLink></li>
          <li className="nav-item"><NavLink to="/transition" className="nav-link">Your Journey</NavLink></li>

          {/* More */}
          <li className="nav-item dropdown">
            <a
              href="#"
              className={`nav-link dropdown-toggle ${isMoreActive ? "active" : ""}`}
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              More
            </a>
            <ul className="dropdown-menu dropdown-box dropdown-menu-end">
              <li>
                <NavLink
                  to="/about"
                  className={({ isActive }) => `dropdown-item ${isActive ? "is-active" : ""}`}
                >
                  <span className="title">About Us</span>
                  <span className="desc">Learn more about OneParent VIC.</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/data-privacy"
                  className={({ isActive }) => `dropdown-item ${isActive ? "is-active" : ""}`}
                >
                  <span className="title">Data Privacy</span>
                  <span className="desc">Learn how we process data.</span>
                </NavLink>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default NavBar;
