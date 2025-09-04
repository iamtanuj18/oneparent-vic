import React, { useEffect, useMemo, useState } from "react";
import "./Step2_Kids.css";

const Step2_Kids = ({ onNext, data }) => {
  // state for children info and errors
  const [children, setChildren] = useState([]);
  const [errors, setErrors] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);

  // calculate child age range from parent age
  const parentAgeNum = Number(data.parentAge);
  const maxFromParent = Number.isFinite(parentAgeNum) ? Math.max(1, parentAgeNum - 20) : 15;
  const minChildAge = 1;
  const maxChildAge = Math.min(20, maxFromParent);

  // options for child age select
  const ageOptions = useMemo(
    () => Array.from({ length: Math.max(0, maxChildAge - minChildAge + 1) }, (_, i) => minChildAge + i),
    [maxChildAge]
  );

  // initialize children state from parent data
  useEffect(() => {
    const count = Number(data.numberOfKids) || 1;
    const next = Array.from({ length: count }, (_, i) => ({
      gender: data.children?.[i]?.gender || "",
      age: data.children?.[i]?.age || "",
      energy_level: data.children?.[i]?.energy_level || "",
      learning_style: data.children?.[i]?.learning_style || "",
    }));
    setChildren(next);
    setErrors(next.map(() => ({})));
    setActiveIdx(0);
  }, [data.numberOfKids, data.children]);

  // validate one child's info
  const validateOne = (c) => {
    const out = {};
    if (!c.gender) out.gender = "Required";
    const ageNum = Number(c.age);
    if (!c.age) out.age = `Choose an age (${minChildAge}–${maxChildAge})`;
    else if (Number.isNaN(ageNum) || ageNum < minChildAge || ageNum > maxChildAge)
      out.age = `Age ${minChildAge}–${maxChildAge}`;
    if (!c.energy_level) out.energy_level = "Required";
    if (!c.learning_style) out.learning_style = "Required";
    return out;
  };

  // check if a child is valid
  const isChildValid = (idx) => Object.keys(validateOne(children[idx] || {})).length === 0;

  // handle field change for a child
  const handleField = (idx, field, value) => {
    setChildren((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
    setErrors((prev) => {
      const copy = [...prev];
      const bag = { ...(copy[idx] || {}) };
      delete bag[field];
      copy[idx] = bag;
      return copy;
    });
  };

  // toast for error summary
  const [showToast, setShowToast] = useState(false);
  // handle form submit and validate all children
  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = children.map((c) => validateOne(c));
    setErrors(nextErrors);
    if (!children.every((_, i) => Object.keys(nextErrors[i]).length === 0)) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
      return;
    }
    const normalized = children.map((c) => ({ ...c, age: Number(c.age) }));
    onNext({ children: normalized });
  };

  // current child info
  const c = children[activeIdx] || {};

  // main render for children info form
  return (
    <form className="step-form" onSubmit={handleSubmit} noValidate>
      <div className="child-tabs" role="tablist" aria-label="Children">
        {children.map((_, i) => {
          const hasError = Object.keys(errors[i] || {}).length > 0;
          return (
            <button
              key={i}
              type="button"
              className={`child-tab ${activeIdx === i ? "active" : ""} ${isChildValid(i) ? "ok" : ""}`}
              onClick={() => setActiveIdx(i)}
              role="tab"
              aria-selected={activeIdx === i}
              aria-controls={`child-panel-${i}`}
              style={{ position: "relative" }}
            >
              Child {i + 1}
              {hasError && (
                <span
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 10,
                    width: 10,
                    height: 10,
                    background: "#e53935",
                    borderRadius: "50%",
                    display: "inline-block",
                  }}
                  title="Missing info"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* toast for error summary at top center of form */}
      {showToast && (
        <div style={{
          position: "absolute",
          top: -48,
          left: "50%",
          transform: "translateX(-50%)",
          background: "#fff",
          color: "#e53935",
          border: "1px solid #e53935",
          borderRadius: 8,
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          padding: "12px 24px",
          zIndex: 9999,
          fontWeight: 500,
          minWidth: "260px",
        }}>
          please fill all required info for children marked in red
        </div>
      )}

      <div id={`child-panel-${activeIdx}`} className="child-panel">
        <h5 className="mb-3">Child {activeIdx + 1}</h5>

        <div className="mb-3">
          <label className="form-label">
            Gender <span className="text-danger">*</span>
          </label>
          <select
            className={`form-select ${errors[activeIdx]?.gender ? "is-invalid" : ""}`}
            value={c.gender}
            onChange={(e) => handleField(activeIdx, "gender", e.target.value)}
            aria-invalid={!!errors[activeIdx]?.gender}
          >
            <option value="">Select…</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          {errors[activeIdx]?.gender && <div className="invalid-feedback">{errors[activeIdx].gender}</div>}
        </div>

        <div className="mb-3">
          <label className="form-label">
            Age <span className="text-danger">*</span>
          </label>
          <small className="text-muted d-block mb-1">Must be between {minChildAge} and {maxChildAge}.</small>
          <select
            className={`form-select ${errors[activeIdx]?.age ? "is-invalid" : ""}`}
            value={c.age}
            onChange={(e) => handleField(activeIdx, "age", e.target.value)}
            aria-invalid={!!errors[activeIdx]?.age}
            disabled={ageOptions.length === 0}
          >
            <option value="">Select age…</option>
            {ageOptions.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          {errors[activeIdx]?.age && <div className="invalid-feedback">{errors[activeIdx].age}</div>}
        </div>

        <div className="mb-3">
          <label className="form-label">
            Energy Level <span className="text-danger">*</span>
          </label>
          <div className="energy-options" role="group" aria-label="Energy level">
            {["Low", "Medium", "High"].map((level) => (
              <button
                type="button"
                key={level}
                className={`btn energy-btn ${c.energy_level === level ? "active" : ""}`}
                onClick={() => handleField(activeIdx, "energy_level", level)}
                aria-pressed={c.energy_level === level}
              >
                {level}
              </button>
            ))}
          </div>
          {errors[activeIdx]?.energy_level && <div className="text-danger small mt-1">{errors[activeIdx].energy_level}</div>}
        </div>

        <div className="mb-1">
          <label className="form-label">
            Learning Style <span className="text-danger">*</span>
          </label>
          <div className="learning-style-options" role="group" aria-label="Learning style">
            {["Visual", "Active", "Calm", "Social"].map((style) => (
              <button
                type="button"
                key={style}
                className={`btn energy-btn ${c.learning_style === style ? "active" : ""}`}
                onClick={() => handleField(activeIdx, "learning_style", style)}
                aria-pressed={c.learning_style === style}
              >
                {style}
              </button>
            ))}
          </div>
          {errors[activeIdx]?.learning_style && (
            <div className="text-danger small mt-1">{errors[activeIdx].learning_style}</div>
          )}
        </div>
      </div>

      <div className="d-flex justify-content-between mt-4">
        {/* show next child/prev only if more than 1 child */}
        {children.length > 1 && (
          <div className="child-pager">
            <button
              type="button"
              className="btn btn-outline-secondary rounded-pill me-2"
              onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
              disabled={activeIdx === 0}
            >
              ← previous child
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary rounded-pill"
              onClick={() => setActiveIdx((i) => Math.min(children.length - 1, i + 1))}
              disabled={activeIdx === children.length - 1}
            >
              next child →
            </button>
          </div>
        )}

        {/* next step button is always on right */}
        <button type="submit" className="btn btn-next" title="Next step">
          Next step →
        </button>
      </div>

    </form>
  );
};

export default Step2_Kids;
