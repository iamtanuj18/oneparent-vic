// src/pages/dataprivacy/DataPrivacyPage.jsx
import "./DataPrivacyPage.css";
import { Helmet } from "react-helmet-async";

export default function DataPrivacyPage() {
  return (
    <>
      <Helmet>
        <title>Privacy & Data Use — OneParent VIC</title>
        <meta 
          name="description" 
          content="Learn how OneParent VIC handles your data — no PII stored, all calculations run locally on your device." 
        />
      </Helmet>

      <div className="privacy-page">
        <h2>Privacy & Data Use</h2>
        <p>We do not store personal data. All calculations run on your device.</p>
      </div>
    </>
  );
}
