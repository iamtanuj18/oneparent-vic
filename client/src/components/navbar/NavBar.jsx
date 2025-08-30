// src/components/navbar/NavBar.jsx
import "./NavBar.css";
import { Link } from "react-router-dom";
import logoUrl from "../../assets/Logo.svg";

export default function NavBar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <img src={logoUrl} alt="OneParent VIC" className="navbar-logo" />
        <span className="navbar-title">OneParent VIC</span>
      </Link>

      <ul className="navbar-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/insights">Insights</Link></li>
        <li><Link to="/playdate">Playdate</Link></li>
        <li><Link to="/outings">Outings</Link></li>
        <li><Link to="/benefits">Benefits</Link></li>
        <li><Link to="/childcare">Childcare</Link></li>
        <li><Link to="/wellbeing">Wellbeing</Link></li>
        <li><Link to="/transition">Transition</Link></li>
        <li><Link to="/announcements">Announcements</Link></li>
        <li><Link to="/about">About</Link></li>
      </ul>
    </nav>
  );
}
