// src/pages/wellbeing/WellbeingPage.jsx
import "./WellbeingPage.css";
import { Helmet } from "react-helmet-async";

export default function WellbeingPage() {
  return (
    <>
      <Helmet>
        <title>Wellbeing & Support — OneParent VIC</title>
        <meta 
          name="description" 
          content="Check your wellbeing and explore support options tailored to your needs with OneParent VIC." 
        />
      </Helmet>

      <div className="wellbeing-page">
        <h2>Wellbeing & Support Navigator</h2>
        <p>Check how you’re doing and get support options tailored for you.</p>
      </div>
    </>
  );
}
