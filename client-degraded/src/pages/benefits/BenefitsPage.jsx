// src/pages/benefits/BenefitsPage.jsx
import "./BenefitsPage.css";
import { Helmet } from "react-helmet-async";

export default function BenefitsPage() {
  return (
    <>
      <Helmet>
        <title>Benefits & Entitlements — OneParent VIC</title>
        <meta 
          name="description" 
          content="Simplify financial entitlements and benefits — see what support you may qualify for." 
        />
      </Helmet>

      <div className="benefits-page">
        <h2>Benefits & Entitlements</h2>
        <p>Simplify financial entitlements and discover support options available for you.</p>
      </div>
    </>
  );
}
