// src/pages/HomePage.jsx
import "./HomePage.css";
import { Helmet } from "react-helmet-async";

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>OneParent VIC — Home</title>
        <meta 
          name="description" 
          content="Welcome to OneParent VIC — turning pressure into clarity for single-parent families." 
        />
      </Helmet>

      <div className="home-page">
        <h2>Welcome to OneParent VIC</h2>
        <p>Turning pressure into clarity for single-parent families.</p>
      </div>
    </>
  );
}
