// src/pages/datainsights/DataInsightsPage.jsx

import "./DataInsightsPage.css";
import { Helmet } from "react-helmet-async";

export default function DataInsightsPage() {
  return (
    <>
      <Helmet>
        <title>Data Insights — OneParent VIC</title>
        <meta 
          name="description" 
          content="Explore interactive visuals showing costs, stress, and access gaps for parents." 
        />
      </Helmet>

      <div className="data-insights-page">
        <h2>Data Insights</h2>
        <p>Explore costs, stress, and access gaps through interactive visuals.</p>
      </div>
    </>
  );
}
