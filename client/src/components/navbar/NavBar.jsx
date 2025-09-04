import { useEffect } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import "./NavBar.css";

// Updated NavBar to reflect a professional, industrial-level design with improved hover effects and active states
const NavBar = () => {
  const { pathname } = useLocation();

  const isActivitiesActive = ["/playdate", "/events"].some((p) =>
    pathname.startsWith(p)
  );
  const isMoreActive = ["/about", "/data-privacy"].some((p) =>
    pathname.startsWith(p)
  );

  // Close collapse & any open dropdowns on route change
  useEffect(() => {
    const collapseEl = document.getElementById("mainNavbar");
    const toggler = document.querySelector('[data-bs-target="#mainNavbar"]');
    const BS = window.bootstrap?.Collapse;

    if (collapseEl) {
      if (BS) {
        const inst =
          BS.getInstance(collapseEl) || new BS(collapseEl, { toggle: false });
        inst.hide();
      }
      collapseEl.classList.remove("show");
    }
    if (toggler) toggler.setAttribute("aria-expanded", "false");

    document
      .querySelectorAll(
        ".dropdown-menu.show, .dropdown-toggle[aria-expanded='true']"
      )
      .forEach((el) => {
        el.classList.remove("show");
        el.setAttribute?.("aria-expanded", "false");
      });
  }, [pathname]);

  return (
    <nav
      className="navbar navbar-expand-lg navbar-light sticky-top border-bottom"
      style={{
        minHeight: "82px",
        background: "#ffffff",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div className="container-xl">
        {/* Brand */}
        <Link
          to="/"
          className="navbar-brand d-flex align-items-center gap-3"
          aria-label="OneParent VIC home"
          style={{ marginLeft: "18px" }}
        >
          <span
            style={{
              fontFamily: "Inter, Montserrat, Arial, sans-serif",
              fontWeight: 900,
              fontSize: "1.7rem",
              letterSpacing: "1.5px",
              color: "#22223b",
              textTransform: "uppercase",
              display: "inline-block",
              lineHeight: 1.1,
              position: "relative",
            }}
          >
            <span style={{ color: "#444b5a" }}>OneParent</span>
            <span
              style={{
                position: "absolute",
                right: 0,
                bottom: "-1.1rem",
                fontSize: "0.95rem",
                fontWeight: 700,
                fontFamily: "Montserrat, Inter, Arial, sans-serif",
                color: "#18b6ff",
                background: "rgba(24,182,255,0.07)",
                padding: "2px 12px",
                borderRadius: "8px",
                letterSpacing: "2.5px",
                boxShadow: "0 1px 4px rgba(24,182,255,0.08)",
                fontStyle: "italic",
              }}
            >
              VIC
            </span>
          </span>
        </Link>

        {/* Toggler */}
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

        {/* Collapse */}
        <div className="collapse navbar-collapse" id="mainNavbar">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center">
            <li className="nav-item">
              <NavLink
                to="/"
                end
                className="nav-link"
                style={({ isActive }) =>
                  isActive
                    ? {
                        color: "#18b6ff",
                        fontWeight: 600,
                        borderBottom: "2px solid #18b6ff",
                      }
                    : { color: "#444b5a", fontWeight: 500 }
                }
              >
                Home
              </NavLink>
            </li>

            {/* Events & Activities */}
            <li className="nav-item dropdown">
              <a
                href="#"
                className={`nav-link dropdown-toggle ${
                  isActivitiesActive ? "active" : ""
                }`}
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                data-bs-auto-close="outside"
                style={{ color: "#444b5a", fontWeight: 500 }}
              >
                Events & Activities
              </a>
              <ul className="dropdown-menu dropdown-box">
                <li>
                  <NavLink
                    to="/playdate"
                    className={({ isActive }) =>
                      `dropdown-item${isActive ? " active" : ""}`
                    }
                    style={({ isActive }) =>
                      isActive
                        ? { background: "#e3f3ff", color: "#22223b", fontWeight: 500 }
                        : { fontWeight: 400 }
                    }
                  >
                    <span>Playdate</span>
                    <span className="desc">
                      AI-powered planner to help you plan activities with your kids.
                    </span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/events"
                    className={({ isActive }) =>
                      `dropdown-item${isActive ? " active" : ""}`
                    }
                    style={({ isActive }) =>
                      isActive
                        ? { background: "#e3f3ff", color: "#22223b", fontWeight: 500 }
                        : { fontWeight: 400 }
                    }
                  >
                    <span>Find Events</span>
                    <span className="desc">
                      Discover family-friendly events across Victoria.
                    </span>
                  </NavLink>
                </li>
              </ul>
            </li>

            {/* More */}
            <li className="nav-item dropdown">
              <a
                href="#"
                className={`nav-link dropdown-toggle ${
                  isMoreActive ? "active" : ""
                }`}
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                data-bs-auto-close="outside"
                style={{ color: "#444b5a", fontWeight: 500 }}
              >
                More
              </a>
              <ul className="dropdown-menu dropdown-box dropdown-menu-end">
                <li>
                  <NavLink
                    to="/about"
                    className={({ isActive }) =>
                      `dropdown-item${isActive ? " active" : ""}`
                    }
                    style={({ isActive }) =>
                      isActive
                        ? { background: "#e3f3ff", color: "#22223b", fontWeight: 500 }
                        : { fontWeight: 400 }
                    }
                  >
                    <span>About Us</span>
                    <span className="desc">Learn more about OneParent VIC.</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/data-privacy"
                    className={({ isActive }) =>
                      `dropdown-item${isActive ? " active" : ""}`
                    }
                    style={({ isActive }) =>
                      isActive
                        ? { background: "#e3f3ff", color: "#22223b", fontWeight: 500 }
                        : { fontWeight: 400 }
                    }
                  >
                    <span>Data Privacy</span>
                    <span className="desc">Learn how we process data.</span>
                  </NavLink>
                </li>
              </ul>
            </li>
          </ul>
        </div>
        {/* /collapse */}
      </div>
    </nav>
  );
};

export default NavBar;
