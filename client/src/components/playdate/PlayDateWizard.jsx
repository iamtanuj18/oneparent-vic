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

// total number of steps in the wizard
const TOTAL_STEPS = 4;

// step titles for sidebar and header
const STEP_TITLES = {
  1: "About you",
  2: "About your kid(s)",
  3: "Setting & time",
  4: "Interests & goals",
};

// initial form state
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

export default function PlayDateWizard() {
  // wizard step state
  const [step, setStep] = useState(1);

  // service status for backend health
  const [serviceStatus, setServiceStatus] = useState("idle");
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setServiceStatus("warming");
        await getHealth();
        if (active) setServiceStatus("ok");
      } catch {
        if (active) setServiceStatus("error");
      }
    })();
    return () => { active = false; };
  }, []);

  // main form data state
  const [formData, setFormData] = useState(initialForm);

  // status for safety and plan generation
  const [safetyChecking, setSafetyChecking] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [safetyIssues, setSafetyIssues] = useState(null);

  // generated plan and modal state
  const [plan, setPlan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeIdea, setActiveIdea] = useState(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  // ref for main content
  const mainRef = useRef(null);

  // go to next step and update form
  const handleNext = (delta = {}) => {
    setFormData((prev) => ({ ...prev, ...delta }));
    setStep((prev) => Math.min(TOTAL_STEPS, prev + 1));
  };
  // go to previous step
  const handleBack = () => setStep((prev) => Math.max(1, prev - 1));

  // generate plan after validating inputs
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
        setSubmitError(verdict.message || "some items need attention.");
        setSafetyChecking(false);
        return;
      }
    } catch (e) {
      setSubmitError(e?.message || "validation failed.");
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
      setSubmitError(e?.message || "failed to generate plan.");
    } finally {
      setGenerating(false);
    }
  };

  // regenerate plan with current answers
  const handleRegenerate = async () => {
    setSubmitError("");
    setGenerating(true);
    try {
      const res = await generatePlaydatePlans(formData);
      const ideas = Array.isArray(res?.ideas) ? res.ideas : [];
      setPlan({ ideas });
      setStep(5);
    } catch (e) {
      setSubmitError(e?.message || "failed to regenerate plan.");
    } finally {
      setGenerating(false);
    }
  };

  // go back to edit answers
  const handleEditAnswers = () => {
    setSubmitError("");
    setSafetyIssues(null);
    setStep(4);
  };

  // reset wizard and start over
  const handleStartOver = () => {
    setSubmitError("");
    setSafetyIssues(null);
    setPlan(null);
    setActiveIdea(null);
    setShowModal(false);
    setFormData(initialForm);
    setStep(1);
  };

  // open modal for idea details
  const openIdea = (idea) => {
    setActiveIdea(idea);
    setShowModal(true);
  };

  // export modal content to pdf
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

      const headings = clone.querySelectorAll("h1, h2, h3, h4, h5, h6");
      headings.forEach((h) => h.classList.add("no-page-break"));
      const steps = clone.querySelectorAll("ol li, ul li, .step, .section");
      steps.forEach((s) => s.classList.add("no-page-break"));

      wrapper.appendChild(clone);

      await html2pdf()
        .from(wrapper)
        .set({
          margin: [15, 15, 15, 15],
          filename: `${safeName}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff", letterRendering: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"], avoid: [".no-page-break", "h1", "h2", "h3", "table", "ul", "ol"] },
        })
        .save();
    } catch (err) {
      console.error("pdf export failed:", err);
    } finally {
      setExportingPdf(false);
    }
  };

  // check if plan exists
  const hasExistingPlan = !!plan?.ideas?.length;
  // check if in plan mode
  const planMode = step === 5;

  // main render
  return (
    <section className="playdate-wizard-section" id="playdate-wizard">
      {/* show service status messages */}
      {serviceStatus === "warming" && (
        <div className="pw-status pw-status-warming" role="status" aria-live="polite">
          warming up playdate services…
        </div>
      )}
      {serviceStatus === "error" && (
        <div className="pw-status pw-status-error" role="alert">
          having trouble connecting. you can still fill the form and try again later.
        </div>
      )}

      <div className={`pw-wrapper ${planMode ? "plan-only" : ""}`}>
        {/* sidebar with progress and steps */}
        {!planMode && (
          <aside className="pw-sidebar">
            <div className="pw-sidebar-inner">
              <div className="pw-progress-rail">
                <div
                  className="pw-progress-thumb"
                  style={{ height: `${(Math.min(step, TOTAL_STEPS) / TOTAL_STEPS) * 100}%` }}
                />
              </div>

              <ol className="pw-steps">
                {[1, 2, 3, 4].map((num) => {
                  const state = step === num ? "active" : step > num ? "done" : "pending";
                  return (
                    <li key={num} className={`pw-step-item ${state}`}>
                      <span className="pw-step-index">{num}</span>
                      <span className="pw-step-title">{STEP_TITLES[num]}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </aside>
        )}

        <main className="pw-main" ref={mainRef}>
          {/* show header for mobile */}
          {!planMode && (
            <div className="pw-header-sm">
              <div className="pw-header-title">{STEP_TITLES[Math.min(step, TOTAL_STEPS)]}</div>
              <div className="pw-header-count">step {Math.min(step, TOTAL_STEPS)} of {TOTAL_STEPS}</div>
              <div className="pw-bar">
                <div
                  className="pw-bar-fill"
                  style={{ width: `${(Math.min(step, TOTAL_STEPS) / TOTAL_STEPS) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* step 1: family info */}
          {step === 1 && (
            <div className="pw-card">
              <Step1_Family onNext={handleNext} data={formData} />
            </div>
          )}

          {/* step 2: kids info */}
          {step === 2 && (
            <div className="pw-card">
              <Step2_Kids onNext={handleNext} onBack={handleBack} data={formData} />
            </div>
          )}

          {/* step 3: setting and time */}
          {step === 3 && (
            <div className="pw-card">
              <Step3_Setting onNext={handleNext} onBack={handleBack} data={formData} />
            </div>
          )}

          {/* step 4: interests and goals */}
          {step === 4 && (
            <div className="pw-card">
              <div className="d-flex justify-content-end mb-2">
                {hasExistingPlan && (
                  <button
                    className="btn btn-outline-primary rounded-pill"
                    onClick={() => setStep(5)}
                    title="View your current generated plan"
                  >
                    View already generated activities
                  </button>
                )}
              </div>
              <Step4_InterestsGoals
                onNext={handleGenerate}
                data={formData}
                submitError={submitError}
                safetyIssues={safetyIssues}
                hasExistingPlan={hasExistingPlan}
              />
            </div>
          )}

          {/* plan mode: show generated ideas */}
          {planMode && (
            <div className="pw-plan fade-in">
              <div className="pw-plan-actions center">
                <button className="btn btn-outline-secondary rounded-pill" onClick={handleEditAnswers}>
                  edit answers
                </button>
                <button className="btn btn-outline-primary rounded-pill" onClick={handleRegenerate}>
                  regenerate
                </button>
                <button className="btn btn-outline-danger rounded-pill" onClick={handleStartOver}>
                  start over
                </button>
              </div>

              <h2 className="pw-plan-title text-center mt-3 mb-3">your activity plan</h2>

              {/* always clean gemini html before showing it for safety */}
              {plan?.geminiHtml && (
                <div
                  className="gemini-html-response"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(plan.geminiHtml) }}
                />
              )}

              {(!plan || !plan.ideas || plan.ideas.length === 0) && (
                <div className="alert alert-info">no ideas returned. try regenerate or edit answers with more details</div>
              )}

              <div className="pw-ideas">
                {plan?.ideas?.slice(0, 3).map((idea, idx) => (
                  <article className="idea-card" key={idx}>
                    <img
                      src={PlaydateImage}
                      className="idea-media"
                      alt={idea.cardTitle || idea.title || `activity ${idx + 1}`}
                    />
                    <div className="idea-body">
                      <div className="idea-badges">
                        <span className="badge bg-secondary">family activity</span>
                        <span className="badge bg-info text-dark">curated idea</span>
                      </div>
                      <h5 className="idea-title">{idea.cardTitle || idea.title || `idea ${idx + 1}`}</h5>
                      <p className="idea-text">{idea.cardExcerpt || idea.summary || "tap for full details."}</p>
                      <div className="idea-actions">
                        <button className="btn btn-outline-primary rounded-pill" onClick={() => openIdea(idea)}>
                          view details
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* bottom nav for steps 2-4 */}
          {step >= 2 && step <= 4 && (
            <div className="pw-bottom-nav">
              <button className="btn btn-outline-secondary rounded-pill" onClick={handleBack}>
                ← previous step
              </button>
            </div>
          )}

          {/* overlay for loading and safety check */}
          {(safetyChecking || generating) && (
            <div className="pw-overlay" role="status" aria-live="polite">
              <div className="spinner-border text-primary" role="status" />
              <div className="mt-3 fw-semibold">
                {safetyChecking ? "checking your inputs for safety…" : "generating activity plans - sit tight…"}
              </div>
              <div className="text-muted small mt-1">this can take upto 2 minutes, thank you for your patience.</div>
            </div>
          )}
        </main>
      </div>

      {/* modal for viewing idea details */}
      {showModal &&
        createPortal(
          <>
            <div
              className="modal fade show"
              style={{ display: "block", position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 1050 }}
              role="dialog"
              aria-modal="true"
            >
              <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content">
                  {/* <div className="modal-header">
                    <h5 className="modal-title">{activeIdea?.title || "details"}</h5>
                    <button type="button" className="btn-close" aria-label="close" onClick={() => setShowModal(false)} />
                  </div> */}
                  <div className="modal-body">
                    <div
                      id="plan-modal-content"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(activeIdea?.html || "<p>no content.</p>", {
                          ADD_TAGS: ["style"],
                          ADD_ATTR: ["style"],
                        }),
                      }}
                    />
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-danger" onClick={() => setShowModal(false)}>
                      close
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
                          generating pdf…
                        </>
                      ) : (
                        "export as pdf"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-backdrop fade show" style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,.5)", zIndex: 1040 }} />
          </>,
          document.body
        )}
    </section>
  );
}
