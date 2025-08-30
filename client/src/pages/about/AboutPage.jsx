// src/pages/about/AboutPage.jsx

import "./AboutPage.css";
import { Helmet } from "react-helmet-async";

export default function AboutPage() {
  return (
    <>
      <Helmet>
        <title>About — OneParent VIC</title>
        <meta name="description" content="Learn more about the OneParent VIC project." />
      </Helmet>

      <div className="about-page">
        <h2>About OneParent VIC</h2>
        <p>This project supports single parents with practical tools and insights.</p>
      </div>
    </>
  );
}
