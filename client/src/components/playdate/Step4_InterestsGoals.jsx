// src/components/playdate/Step4_InterestsGoals.jsx
import React, { useState, useEffect } from "react";
import "./Step4_InterestsGoals.css";

// limits
const MAX_ITEMS = 8;
const MAX_CHARS = 24;

const Step4_InterestsGoals = ({
  onNext,
  // onBack,
  data,
  submitError,
  safetyIssues,
  hasExistingPlan,
  triggerValidate = false,
}) => {
  // local state
  const [interests, setInterests] = useState(data.interests || []);
  const [goals, setGoals] = useState(data.goals || []);
  const [interestInput, setInterestInput] = useState("");
  const [goalInput, setGoalInput] = useState("");
  const [errors, setErrors] = useState({ interests: "", goals: "" });
  // eslint-disable-next-line
  const [touched, setTouched] = useState({ interests: false, goals: false });
  const [attemptedSubmit, setAttemptedSubmit] = useState(triggerValidate || false);

  // keep attemptedSubmit in sync if parent toggles triggerValidate while mounted (rare, safe)
  useEffect(() => {
    if (triggerValidate) setAttemptedSubmit(true);
  }, [triggerValidate]);

  // helpers
  const normalize = (s) => s.trim().replace(/\s+/g, " ");
  const existsInsensitive = (arr, v) => arr.some((x) => x.toLowerCase() === v.toLowerCase());
  const validateItem = (value) => {
    const v = normalize(value);
    if (!v) return "can't be empty";
    if (v.length > MAX_CHARS) return `max ${MAX_CHARS} characters`;
    return "";
  };

  // derived
  const interestsAtMax = interests.length >= MAX_ITEMS;
  const goalsAtMax = goals.length >= MAX_ITEMS;
  const canSubmit =
    interests.length >= 3 && goals.length >= 3 && !errors.interests && !errors.goals;

  // actions
  const addItem = (type, value) => {
    const v = normalize(value);
    if (!v) return;

    const isInterests = type === "interests";
    const list = isInterests ? interests : goals;
    const atMax = isInterests ? interestsAtMax : goalsAtMax;
    const key = isInterests ? "interests" : "goals";

    if (atMax) return;

    setTouched((t) => ({ ...t, [key]: true }));

    const err = validateItem(v);
    if (err) return setErrors((e) => ({ ...e, [key]: err }));
    if (existsInsensitive(list, v))
      return setErrors((e) => ({ ...e, [key]: "already added" }));

    const setList = isInterests ? setInterests : setGoals;
    setList((prev) => [...prev, v]);
    isInterests ? setInterestInput("") : setGoalInput("");
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const removeItem = (type, value) => {
    const isInterests = type === "interests";
    const setList = isInterests ? setInterests : setGoals;
    const key = isInterests ? "interests" : "goals";
    const currentInput = isInterests ? interestInput : goalInput;

    setList((prev) => {
      const next = prev.filter((x) => x !== value);
      const norm = normalize(currentInput);
      const dup = norm && existsInsensitive(next, norm);
      setErrors((e) => ({ ...e, [key]: dup ? "already added" : "" }));
      return next;
    });
    setTouched((t) => ({ ...t, [key]: true }));
  };

  const handleKeyDown = (type, e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if ((type === "interests" && interestsAtMax) || (type === "goals" && goalsAtMax)) return;
      const val = type === "interests" ? interestInput : goalInput;
      addItem(type, val);
    }
  };

  const handleInputChange = (type, e) => {
    let v = e.target.value;
    if (v.length > MAX_CHARS) v = v.slice(0, MAX_CHARS);

    const list = type === "interests" ? interests : goals;
    const norm = normalize(v);

    let nextErr = "";
    if (v.length === MAX_CHARS) {
      nextErr = `max ${MAX_CHARS} characters reached`;
    }
    if (!nextErr) {
      if (!norm) {
        nextErr = "";
      } else if (existsInsensitive(list, norm)) {
        nextErr = "already added";
      }
    }

    setErrors((prev) => ({ ...prev, [type]: nextErr }));
    setTouched((t) => ({ ...t, [type]: true }));
    type === "interests" ? setInterestInput(v) : setGoalInput(v);
  };

  const handleSubmit = () => {
    setAttemptedSubmit(true);
    if (canSubmit) onNext({ interests, goals });
  };

  // small inline red list for flagged items
  const InlineRedList = ({ issues }) => {
    const vals = Array.from(
      new Set((issues || []).map((i) => normalize(i.value || "")).filter(Boolean))
    );
    if (!vals.length) return null;
    return (
      <>
        {vals.map((v, idx) => (
          <React.Fragment key={v}>
            {idx > 0 && (idx === vals.length - 1 ? " and " : ", ")}
            <span className="text-danger">&quot;{v}&quot;</span>
          </React.Fragment>
        ))}
      </>
    );
  };

  // render
  return (
    <div className="step-form animate-fade-in interests-goals-step">
      {((Array.isArray(safetyIssues) && safetyIssues.length > 0) || submitError) && (
        <div className="alert alert-warning">
          <div className="mb-1">
            {Array.isArray(safetyIssues) && safetyIssues.length > 0 ? (
              <>
                we found unsafe or gibberish items. please replace <InlineRedList issues={safetyIssues} /> and similar.
              </>
            ) : (
              (() => {
                const text = String(submitError || "some items need attention.");
                const parts = text.split(/('.*?')/g);
                return parts.map((p, i) =>
                  /^'.*'$/.test(p) ? (
                    <span key={i} className="text-danger">
                      {p}
                    </span>
                  ) : (
                    <React.Fragment key={i}>{p}</React.Fragment>
                  )
                );
              })()
            )}
          </div>
        </div>
      )}

      {/* interests */}
      <div className="mb-4">
        <label className="form-label d-flex align-items-center gap-2">
          what are your and your child’s interests?
          <span className="text-muted small">
            {interests.length}/{MAX_ITEMS}
          </span>
        </label>

        <div className="chip-row">
          {interests.map((item) => (
            <span key={item} className="chip energy-btn active">
              {item}
              <button
                className="chip-x"
                type="button"
                aria-label={`remove ${item}`}
                onClick={() => removeItem("interests", item)}
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <div className="chip-input">
          <input
            type="text"
            className={`form-control ${errors.interests ? "is-invalid" : ""}`}
            placeholder="type and press enter"
            value={interestInput}
            onChange={(e) => handleInputChange("interests", e)}
            onKeyDown={(e) => handleKeyDown("interests", e)}
            maxLength={MAX_CHARS}
            aria-invalid={!!errors.interests}
            disabled={interestsAtMax}
          />
          <button
            type="button"
            className="btn btn-outline-secondary add-btn"
            onClick={() => addItem("interests", interestInput)}
            disabled={!interestInput.trim() || interestsAtMax}
          >
            add
          </button>
        </div>

        {interestsAtMax && <div className="form-text">max {MAX_ITEMS} items reached.</div>}
        {errors.interests && (
          <div className="error-text" aria-live="polite">
            {errors.interests}
          </div>
        )}
        {attemptedSubmit && interests.length < 3 && (
          <div className="error-text" aria-live="polite">
            please add at least three interests.
          </div>
        )}
      </div>

      {/* goals */}
      <div className="mb-4">
        <label className="form-label d-flex align-items-center gap-2">
          what’s your goal for this activity?
          <span className="text-muted small">
            {goals.length}/{MAX_ITEMS}
          </span>
        </label>

        <div className="chip-row">
          {goals.map((item) => (
            <span key={item} className="chip energy-btn active">
              {item}
              <button
                className="chip-x"
                type="button"
                aria-label={`remove ${item}`}
                onClick={() => removeItem("goals", item)}
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <div className="chip-input">
          <input
            type="text"
            className={`form-control ${errors.goals ? "is-invalid" : ""}`}
            placeholder="type and press enter"
            value={goalInput}
            onChange={(e) => handleInputChange("goals", e)}
            onKeyDown={(e) => handleKeyDown("goals", e)}
            maxLength={MAX_CHARS}
            aria-invalid={!!errors.goals}
            disabled={goalsAtMax}
          />
          <button
            type="button"
            className="btn btn-outline-secondary add-btn"
            onClick={() => addItem("goals", goalInput)}
            disabled={!goalInput.trim() || goalsAtMax}
          >
            add
          </button>
        </div>

        {goalsAtMax && <div className="form-text">max {MAX_ITEMS} items reached.</div>}
        {errors.goals && (
          <div className="error-text" aria-live="polite">
            {errors.goals}
          </div>
        )}
        {attemptedSubmit && goals.length < 3 && (
          <div className="error-text" aria-live="polite">
            please add at least three goals.
          </div>
        )}
      </div>

      <div className="d-flex justify-content-between">
        <span></span>
        <button type="button" className="btn btn-next" onClick={handleSubmit}>
          {hasExistingPlan ? "Regenerate activity plan →" : "Generate activity plan →"}
        </button>
      </div>
    </div>
  );
};

export default Step4_InterestsGoals;
