// src/pages/notfound/NotFoundPage.jsx
import "./NotFoundPage.css";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <>
      <Helmet>
        <title>404 — Page Not Found | OneParent VIC</title>
        <meta 
          name="description" 
          content="The page you requested could not be found on OneParent VIC." 
        />
      </Helmet>

      <div className="notfound-page">
        {/* Logo at top */}
        <div className="notfound-logo">
          <span className="logo-text">ONEPARENT</span>
          <span className="logo-sub">VIC</span>
        </div>

        {/* Error content */}
        <div className="notfound-content">
          <h1 className="notfound-title">Oops! Page Not Found</h1>
          <p className="notfound-subtitle">Whoops, this is embarrassing.</p>
          <p className="notfound-description">
            Looks like the page you were looking for doesn&apos;t exist.
          </p>
          <Link to="/" className="btn btn-primary notfound-btn">
            Back to Home
          </Link>
        </div>
      </div>
    </>
  );
}
