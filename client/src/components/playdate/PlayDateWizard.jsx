// src/components/playdate/PlayDateWizard.jsx
import React, { useEffect, useRef, useState } from "react";
import Step1_Family from "./Step1_Family";
import Step2_Kids from "./Step2_Kids";
import Step3_Setting from "./Step3_Setting";
import Step4_InterestsGoals from "./Step4_InterestsGoals";
import { getHealth } from "../../lib/api/client";
import { validatePlaydateInput, generatePlaydatePlans } from "../../lib/api/playdate";
import DOMPurify from "dompurify";
import "./PlayDateWizard.css";
import PlaydateImage from "../../assets/playdate.png";
import { createPortal } from "react-dom";

// basic nav numbers
const NAV_OFFSET = 96;
const TOTAL_STEPS = 4;

const STEP_TITLES = {
  1: "About you",
  2: "About your kid(s)",
  3: "Setting & time",
  4: "Interests & goals",
};

const initialForm = {
  parentType: "",
  parentAge: "",
  energy: "",
  numberOfKids: 1,
  children: [],
  location: "",
  place: "",
  homeType: "",
  timeAvailable: "",
  budget: "",
  interests: [],
  goals: [],
  plannedDate: "",
  plannedTime: "",
};

const PlayDateWizard = () => {
  const [step, setStep] = useState(0);
  const [checking, setChecking] = useState(false);
  const [healthError, setHealthError] = useState("");

  const [formData, setFormData] = useState(initialForm);

  const [safetyChecking, setSafetyChecking] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [safetyIssues, setSafetyIssues] = useState(null);

  const [plan, setPlan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeIdea, setActiveIdea] = useState(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  const cardRef = useRef(null);

  // start service health then step 1
  const startWizard = async () => {
    try {
      setChecking(true);
      setHealthError("");
      await getHealth();
      setStep(1);
    } catch (err) {
      setHealthError("Service unavailable, Please try again later");
    } finally {
      setChecking(false);
    }
  };

  // collect and move step
  const handleNext = (delta = {}) => {
    setFormData((prev) => ({ ...prev, ...delta }));
    setStep((prev) => prev + 1);
  };
  const handleBack = () => setStep((prev) => Math.max(0, prev - 1));

  // scroll on step change
  useEffect(() => {
    if (step >= 1 && cardRef.current) {
      const y = cardRef.current.getBoundingClientRect().top + window.pageYOffset - NAV_OFFSET;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }, [step]);

  // run safety then generation
  const handleGenerate = async (finalDelta) => {
    const payload = { ...formData, ...finalDelta };
    setFormData(payload);
    setSubmitError("");
    setSafetyIssues(null);

    setSafetyChecking(true);
    try {
      const verdict = await validatePlaydateInput(payload);
      if (verdict && verdict.ok === false) {
        setSafetyIssues(verdict.issues || []);
        setSubmitError(verdict.message || "Some items need attention.");
        setSafetyChecking(false);
        return;
      }
    } catch (e) {
      setSubmitError(e?.message || "Validation failed.");
      setSafetyChecking(false);
      return;
    }
    setSafetyChecking(false);

    setGenerating(true);
    try {
      const res = await generatePlaydatePlans(payload);
      const ideas = Array.isArray(res?.ideas) ? res.ideas : [];
      setPlan({ ideas });
      setStep(5);
    } catch (e) {
      setSubmitError(e?.message || "Failed to generate plan.");
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    setSubmitError("");
    setGenerating(true);
    try {
      const res = await generatePlaydatePlans(formData);
      const ideas = Array.isArray(res?.ideas) ? res.ideas : [];
      setPlan({ ideas });
      setStep(5);
    } catch (e) {
      setSubmitError(e?.message || "Failed to regenerate plan.");
    } finally {
      setGenerating(false);
    }
  };

  const handleEditAnswers = () => {
    setSubmitError("");
    setSafetyIssues(null);
    setStep(4);
  };

  const handleStartOver = () => {
    setSubmitError("");
    setSafetyIssues(null);
    setPlan(null);
    setActiveIdea(null);
    setShowModal(false);
    setFormData(initialForm);
    setStep(1);
  };

  const openIdea = (idea) => {
    setActiveIdea(idea);
    setShowModal(true);
  };

  // export current idea to pdf (client-side)
const exportModalToPdf = async () => {
  if (!activeIdea) return;
  const source = document.getElementById("plan-modal-content");
  if (!source) return;

  const safeName = String(activeIdea.title || "PlayDate Plan").trim().replace(/[^a-z0-9-_]+/gi, "_");

  setExportingPdf(true);
  try {
    const html2pdf = (await import("html2pdf.js")).default;

    const wrapper = document.createElement("div");
    wrapper.style.padding = "20px";
    wrapper.style.margin = "0";
    wrapper.style.fontFamily = "system-ui,-apple-system,Segoe UI,Roboto,Arial,Noto Sans,sans-serif";
    wrapper.style.background = "#ffffff";
    wrapper.style.lineHeight = "1.5";

    const clone = source.cloneNode(true);
    clone.style.width = "100%";
    
    // Add classes to prevent page breaks on important elements
    const headings = clone.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
      heading.classList.add('no-page-break');
    });
    
    const steps = clone.querySelectorAll('ol li, ul li, .step, .section');
    steps.forEach(step => {
      step.classList.add('no-page-break');
    });

    wrapper.appendChild(clone);

    await html2pdf()
      .from(wrapper)
      .set({
        margin: [15, 15, 15, 15],
        filename: `${safeName}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          backgroundColor: "#ffffff", 
          letterRendering: true 
        },
        jsPDF: { 
          unit: "mm", 
          format: "a4", 
          orientation: "portrait" 
        },
        pagebreak: { 
          mode: ["css", "legacy"],
          avoid: ['.no-page-break', 'h1', 'h2', 'h3', 'table', 'ul', 'ol']
        }
      })
      .save();
  } catch (err) {
    console.error('PDF export failed:', err);
  } finally {
    setExportingPdf(false);
  }
};


  // overlay panel
  const Overlay = ({ text, sub }) => (
    <div
      className="pw-overlay d-flex flex-column align-items-center justify-content-center bg-white bg-opacity-75 rounded"
      role="status"
      aria-live="polite"
    >
      <div className="spinner-border text-primary pw-spinner" role="status" />
      <div className="mt-3 fw-semibold">{text}</div>
      {sub && <div className="text-muted small mt-1">{sub}</div>}
    </div>
  );

  // derived flags
  const hasExistingPlan = !!plan?.ideas?.length;

  // render
  return (
    <section className="py-5" id="playdate-wizard">
      <div className="container">
        <div ref={cardRef} className="card shadow-sm border-0 mx-auto" style={{ maxWidth: 820 }}>
          <div className="card-body position-relative">
          {step === 0 && !checking && !healthError && (
            <div className="d-flex flex-column align-items-center justify-content-center text-center p-5 bg-white">
              <h2 
                className="fw-bold mb-3" 
                style={{ fontFamily: 'Fraunces, serif', fontSize: '2.5rem', color: '#0f172a' }}
              >
                PlayDate
              </h2>
              <p 
                className="text-muted mb-4" 
                style={{ fontSize: '1.125rem', lineHeight: '1.6' }}
              >
                A 2-minute start to 3 fun, doable ideas.
              </p>
              <button
                className="btn btn-primary btn-lg rounded-pill px-5"
                style={{ 
                  boxShadow: 'none',
                  fontWeight: 'bold',
                  fontSize: '1.125rem'
                }}
                onClick={startWizard}
                aria-label="Start the PlayDate planner"
              >
                Start
              </button>
            </div>
          )}
            {checking && <Overlay text="Warming up PlayDate AI" sub="This may take up to 30 seconds." />}

            {step === 0 && !checking && !!healthError && (
              <div className="text-center">
                <div className="alert alert-warning" role="alert">{healthError}</div>
                <button className="btn btn-primary rounded-pill px-4" onClick={startWizard}>
                  Retry
                </button>
              </div>
            )}

            {step >= 1 && step <= TOTAL_STEPS && (
              <>
                <div className="mb-2 d-flex align-items-center justify-content-between">
                  <div className="fw-bold h5 mb-0">{STEP_TITLES[step]}</div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge rounded-pill bg-light text-dark">
                      Step {step} of {TOTAL_STEPS}
                    </span>
                    {step === 4 && hasExistingPlan && (
                      <button
                        className="btn btn-outline-primary btn-sm rounded-pill"
                        onClick={() => setStep(5)}
                        title="View your current generated plan"
                      >
                        View generated plan
                      </button>
                    )}
                  </div>
                </div>

                <div className="progress mb-4" style={{ height: 10 }}>
                  <div
                    className="progress-bar bg-primary"
                    role="progressbar"
                    style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                    aria-valuenow={(step / TOTAL_STEPS) * 100}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-label={`Step ${step} of ${TOTAL_STEPS}`}
                  />
                </div>
              </>
            )}

            {step === 1 && <Step1_Family onNext={handleNext} data={formData} />}

            {step === 2 && <Step2_Kids onNext={handleNext} onBack={handleBack} data={formData} />}

            {step === 3 && <Step3_Setting onNext={handleNext} onBack={handleBack} data={formData} />}

            {step === 4 && (
              <Step4_InterestsGoals
                onNext={handleGenerate}
                onBack={handleBack}
                data={formData}
                submitError={submitError}
                safetyIssues={safetyIssues}
                hasExistingPlan={hasExistingPlan}
              />
            )}

            {step === 5 && (
              <>
                <div className="mb-3 d-flex align-items-center justify-content-between">
                  <div className="fw-bold h5 mb-0">Your activity plan</div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-outline-secondary rounded-pill" onClick={handleEditAnswers}>
                      Edit answers
                    </button>
                    <button className="btn btn-outline-primary rounded-pill" onClick={handleRegenerate}>
                      Regenerate
                    </button>
                    <button className="btn btn-outline-danger rounded-pill" onClick={handleStartOver}>
                      Start over
                    </button>
                  </div>
                </div>

                {(!plan || !plan.ideas || plan.ideas.length === 0) && (
                  <div className="alert alert-info">No ideas returned. Try Regenerate or Edit answers.</div>
                )}

                <div className="row g-4">
                  {plan?.ideas?.slice(0, 3).map((idea, idx) => (
                    <div className="col-lg-4" key={idx}>
                      <div className="card h-100 shadow-sm">
                        <img
                          src={PlaydateImage}
                          className="card-img-top"
                          alt={idea.cardTitle || idea.title || `Activity ${idx + 1}`}
                        />
                        <div className="card-body d-flex flex-column">
                          <div className="mb-2">
                            <span className="badge bg-secondary me-2">Family Activity</span>
                            <span className="badge bg-info text-dark me-2">Curated Idea</span>
                          </div>
                          <h5 className="card-title">
                            {idea.cardTitle || idea.title || `Idea ${idx + 1}`}
                          </h5>
                          <p className="card-text text-muted">
                            {idea.cardExcerpt || idea.summary || "Tap for full details."}
                          </p>
                          <div className="mt-auto">
                            <button
                              className="btn btn-outline-primary rounded-pill"
                              onClick={() => openIdea(idea)}
                            >
                              View details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {step >= 1 && step <= TOTAL_STEPS && (
              <div className="mt-4">
                <button className="btn btn-outline-secondary rounded-pill" onClick={handleBack}>
                  ← Back
                </button>
              </div>
            )}

            {safetyChecking && (
              <Overlay text="Checking your inputs for safety…" sub="This may take up to 30 seconds." />
            )}
            {generating && (
              <Overlay text="Generating your activity plan…" sub="This may take up to 2 minutes." />
            )}

            {showModal && createPortal(
  <>
    <div className="modal fade show" style={{ display: "block", position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 1050 }} role="dialog" aria-modal="true">
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{activeIdea?.title || "Details"}</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowModal(false)} />
          </div>
          <div className="modal-body">
            <div
              id="plan-modal-content"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(activeIdea?.html || "<p>No content.</p>", {
                  ADD_TAGS: ["style"],
                  ADD_ATTR: ["style"],
                }),
              }}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={exportModalToPdf}
              disabled={exportingPdf}
              aria-busy={exportingPdf}
            >
              {exportingPdf ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  Generating…
                </>
              ) : (
                "Export as PDF"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div className="modal-backdrop fade show" style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1040 }} />
  </>,
  document.body // This renders the modal at the body level
)}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlayDateWizard;
