// src/pages/childcare/ChildcarePlannerPage.jsx

import "./ChildcarePlannerPage.css";
import { Helmet } from "react-helmet-async";

export default function ChildcarePlannerPage() {
  return (
    <>
      <Helmet>
        <title>Childcare Planner — OneParent VIC</title>
        <meta 
          name="description" 
          content="Estimate childcare costs and explore savings options with OneParent VIC." 
        />
      </Helmet>

      <div className="childcare-page">
        <h2>Childcare Financial Planner</h2>
        <p>Estimate your weekly childcare costs and discover savings options.</p>
      </div>
    </>
  );
}