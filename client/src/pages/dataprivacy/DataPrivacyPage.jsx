// src/pages/dataprivacy/DataPrivacyPage.jsx
import { useEffect, useState } from "react";
import "./DataPrivacyPage.css";
import { Helmet } from "react-helmet-async";

export default function DataPrivacyPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <>
      <Helmet>
        <title>Privacy & Data Use — OneParent VIC</title>
        <meta 
          name="description" 
          content="Learn how OneParent VIC handles your data — no PII stored, all calculations run locally on your device." 
        />
      </Helmet>

      <div className={`privacy-page ${isLoaded ? 'loaded' : ''}`}>
        <div className="container">
          {/* this is the hero section for privacy page */}
          <section className="privacy-hero">
            <h1 className="privacy-title">Privacy & Data Use</h1>
            <p className="privacy-subtitle">Your privacy is our priority. We believe in providing helpful solutions without compromising your personal information.</p>
          </section>

          {/* this section states our privacy promise */}
          <section className="privacy-section">
            <h2 className="section-title">Our Privacy Promise</h2>
            <div className="privacy-highlight">
              <p><strong>we do not collect, store, or process any personal identification information from our users.</strong></p>
            </div>
          </section>

          {/* this section explains how we work */}
          <section className="privacy-section">
            <h2 className="section-title">How OneParent VIC Works</h2>
            <div className="privacy-points">
              <div className="privacy-point">
                <h4>no data collection</h4>
                <p>we do not ask for your name, address, phone number, email, or any personal details to use our platform.</p>
              </div>
              <div className="privacy-point">
                <h4>open datasets only</h4>
                <p>we use publicly available government and research datasets to provide insights and solutions.</p>
              </div>
              <div className="privacy-point">
                <h4>ai without your data</h4>
                <p>when we use ai features, we never use any personal identification data for any usage. we do not take any user input for it.</p>
              </div>
            </div>
          </section>

          {/* this section explains what data we use */}
          <section className="privacy-section">
            <h2 className="section-title">What Data We Use</h2>
            <p className="section-text">
              OneParent VIC relies entirely on <strong>public datasets</strong> from trusted sources like:
            </p>
            <ul className="privacy-list">
              <li>Australian Bureau of Statistics (ABS)</li>
              <li>Department of Social Services (DSS)</li>
              <li>Services Australia</li>
              <li>Victorian Government agencies</li>
              <li>Academic research institutions</li>
            </ul>
            <p className="section-text">
              These datasets contain aggregated, anonymized information about family demographics, employment patterns, and support services - but never individual personal data.
            </p>
          </section>

          {/* this section explains our ai and technology use */}
          <section className="privacy-section">
            <h2 className="section-title">AI & Technology Use</h2>
            <p className="section-text">
              Some features may use artificial intelligence to provide personalized suggestions:
            </p>
            <div className="privacy-points">
              <div className="privacy-point">
                <h4>activity planning</h4>
                <p>ai helps suggest family activities based on general preferences like age group and budget range. no personal details are ever shared.</p>
              </div>
              <div className="privacy-point">
                <h4>smart recommendations</h4>
                <p>we do not use or share your personal identification information for recommendations.</p>
              </div>
            </div>
          </section>

          {/* this section explains why your data is safe */}
          <section className="privacy-section">
            <h2 className="section-title">Your Data is Safe Because</h2>
            <div className="safety-grid">
              <div className="safety-item">
                <p><strong>no storage:</strong> we do not have databases storing your information</p>
              </div>
              <div className="safety-item">
                <p><strong>no accounts:</strong> no registration or login required</p>
              </div>
              <div className="safety-item">
                <p><strong>device-only:</strong> everything stays on your device</p>
              </div>
              <div className="safety-item">
                <p><strong>purpose-built:</strong> designed specifically to avoid collecting personal identification information</p>
              </div>
            </div>
          </section>


          {/* this section explains how to contact us */}
          {/* <section className="privacy-section">
            <h2 className="section-title">Questions?</h2>
            <p className="section-text">
              If you have any questions about our privacy practices or how OneParent VIC works, our approach is transparent and straightforward: we simply don't collect your personal data.
            </p>
          </section> */}
        </div>
      </div>
    </>
  );
}
