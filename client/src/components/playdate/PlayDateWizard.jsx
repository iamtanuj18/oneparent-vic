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

export default function PlayDateWizard() {
  const [step, setStep] = useState(1);

  const [serviceStatus, setServiceStatus] = useState("checking");
  const checkHealth = async () => {
    try {
      setServiceStatus("checking");
      await getHealth();
      setServiceStatus("ok");
      setStep(1);
    } catch {
      setServiceStatus("error");
    }
  };
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await getHealth();
        if (active) {
          setServiceStatus("ok");
          setStep(1);
        }
      } catch {
        if (active) setServiceStatus("error");
      }
    })();
    return () => { active = false; };
  }, []);

  const [formData, setFormData] = useState(initialForm);

  const [safetyChecking, setSafetyChecking] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [safetyIssues, setSafetyIssues] = useState(null);

  const [plan, setPlan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeIdea, setActiveIdea] = useState(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  const mainRef = useRef(null);

  const handleNext = (delta = {}) => {
    setFormData((prev) => ({ ...prev, ...delta }));
    setStep((prev) => Math.min(TOTAL_STEPS, prev + 1));
  };
  const handleBack = () => setStep((prev) => Math.max(1, prev - 1));

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

  const hasExistingPlan = !!plan?.ideas?.length;
  const planMode = step === 5;

  if (serviceStatus !== "ok") {
    return (
      <section className="playdate-wizard-section" id="playdate-wizard">
        {serviceStatus === "checking" && (
          <div className="pw-healthgate d-flex flex-column align-items-center justify-content-center py-5">
            <div className="spinner-border text-primary mb-3" role="status" aria-label="checking service status" />
            <div className="fw-semibold">checking playdate services…</div>
            <div className="text-muted small mt-1">this usually takes a moment.</div>
          </div>
        )}
        {serviceStatus === "error" && (
          <div className="pw-healthgate d-flex flex-column align-items-center justify-content-center py-5">
            <div className="alert alert-danger text-center" role="alert">
                We couldn&apos;t connect to the playdate service.
              <br />
              Please try again.
            </div>
            <button className="btn btn-primary rounded-pill mt-2" onClick={checkHealth}>
              Retry
            </button>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="playdate-wizard-section" id="playdate-wizard">
      <div className={`pw-wrapper ${planMode ? "plan-only" : ""}`}>
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

          {step === 1 && (
            <div className="pw-card">
              <Step1_Family onNext={handleNext} data={formData} />
            </div>
          )}

          {step === 2 && (
            <div className="pw-card">
              <Step2_Kids onNext={handleNext} onBack={handleBack} data={formData} />
            </div>
          )}

          {step === 3 && (
            <div className="pw-card">
              <Step3_Setting onNext={handleNext} onBack={handleBack} data={formData} />
            </div>
          )}

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

          {step >= 2 && step <= 4 && (
            <div className="pw-bottom-nav">
              <button className="btn btn-outline-secondary rounded-pill" onClick={handleBack}>
                ← previous step
              </button>
            </div>
          )}

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
