// src/pages/notfound/NotFoundPage.jsx
import "./NotFoundPage.css";
import { Helmet } from "react-helmet-async";

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
        <h2>404 – Page Not Found</h2>
        <p>Sorry, the page you are looking for doesn’t exist.</p>
      </div>
    </>
  );
}
