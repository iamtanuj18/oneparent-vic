// src/pages/PlaydatePage.jsx
import "./PlaydatePage.css";
import { Helmet } from "react-helmet-async";
import { useState } from "react";
import PlayDateWizard from "../../components/playdate/PlayDateWizard";
import playdastescg from "../../assets/playdate.svg";

// playdate planner main page
export default function PlaydatePage() {
  // state for showing wizard and transition
  const [showWizard, setShowWizard] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // start wizard with transition
  const handleStartWizard = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowWizard(true);
      setIsTransitioning(false);
    }, 450);
  };

  // main ui for playdate page
  return (
    <>
      <Helmet>
        <title>PlayDate Planner — OneParent VIC</title>
        <meta
          name="description"
          content="get personalised activity suggestions for your kids. no more endless searching or “i don’t know what to do” moments. ready to begin?"
        />
      </Helmet>

      {/* hero section before wizard starts */}
      {!showWizard && (
        <section className={`hero-section ${isTransitioning ? "fade-out" : "fade-in"}`}>
          <div className="container" style={{ paddingTop: 0 }}>
            <div className="row g-5 align-items-center" style={{ minHeight: "calc(100vh - 80px)" }}>
              {/* left column with heading and button */}
              <div className="col-12 col-lg-6 col-xl-7">
                <div className="hero-content animate-slide-up">
                  <h1 className="display-3 fw-bold text-dark mb-4 animate-slide-up animate-delay-100">
                    struggling to plan meaningful activities
                    <span className="text-primary"> with your kids?</span>
                  </h1>
                  <p className="lead text-muted mb-4 animate-slide-up animate-delay-200">
                    get personalised activity suggestions created using our playdate planner.
                    no more endless searching or “i don’t know what to do” moments. ready to begin?
                  </p>
                  <div className="animate-slide-up animate-delay-300">
                    <button
                      className="btn btn-primary btn-lg px-4 py-3"
                      onClick={handleStartWizard}
                      disabled={isTransitioning}
                    >
                      try now
                      <svg className="ms-2" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path d="m7.5 15 5-5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* right column with svg image */}
              <div className="col-12 col-lg-6 col-xl-5">
                <div className="hero-art animate-slide-up animate-delay-400">
                  <img
                    src={playdastescg}
                    alt="how it works: quick inputs, ideas, plan ready"
                    className="hero-art-img"
                    loading="eager"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* wizard section after button click */}
      {showWizard && (
        <section id="playdate-wizard" className={`wizard-section ${isTransitioning ? "fade-out" : "fade-in"}`}>
            <PlayDateWizard />
        </section>
      )}
    </>
  );
}
