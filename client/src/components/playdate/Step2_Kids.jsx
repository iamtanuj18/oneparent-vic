// src/components/playdate/Step2_Kids.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./Step2_Kids.css";

const Step2_Kids = ({ onNext, data }) => {
  // local form state 
  const [children, setChildren] = useState([]);
  const [errors, setErrors] = useState([]); // one error bag 

  // dynamic child age bounds from parent age
  const parentAgeNum = Number(data.parentAge);
  const maxFromParent = Number.isFinite(parentAgeNum) ? Math.max(1, parentAgeNum - 20) : 15;
  const minChildAge = 1;
  const maxChildAge = Math.min(20, maxFromParent);

  // dropdown ages
  const ageOptions = useMemo(
    () => Array.from({ length: Math.max(0, maxChildAge - minChildAge + 1) }, (_, i) => minChildAge + i),
    [maxChildAge]
  );

  // init children to match numberOfKids 
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
  }, [data.numberOfKids, data.children]);

  // validate all children on submit
  const validateAll = (kids) =>
    (kids || []).map(() => ({})).map((bag, i) => {
      const c = kids[i];
      const out = { ...bag };

      if (!c.gender) out.gender = "Required";

      const ageNum = Number(c.age);
      if (!c.age) out.age = `Choose an age (${minChildAge}–${maxChildAge})`;
      else if (Number.isNaN(ageNum) || ageNum < minChildAge || ageNum > maxChildAge)
        out.age = `Age ${minChildAge}–${maxChildAge}`;

      if (!c.energy_level) out.energy_level = "Required";
      if (!c.learning_style) out.learning_style = "Required";
      return out;
    });

  // update a single field and clear its error
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validateAll(children);
    setErrors(errs);

    const ok = errs.every((bag) => Object.keys(bag).length === 0);
    if (!ok) return;

    const normalized = children.map((c) => ({ ...c, age: Number(c.age) }));
    onNext({ children: normalized });
  };

  return (
    <form className="step-form" onSubmit={handleSubmit} noValidate>
      {children.map((child, i) => (
        <div key={i} className="child-block mb-5">
          <h5 className="mb-3">Child {i + 1}</h5>

          {/* gender */}
          <div className="mb-3">
            <label className="form-label">
              Gender <span className="text-danger">*</span>
            </label>
            <select
              className={`form-select ${errors[i]?.gender ? "is-invalid" : ""}`}
              value={child.gender}
              onChange={(e) => handleField(i, "gender", e.target.value)}
              aria-invalid={!!errors[i]?.gender}
            >
              <option value="">Select…</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            {errors[i]?.gender && <div className="invalid-feedback">{errors[i].gender}</div>}
          </div>

          {/* age */}
          <div className="mb-3">
            <label className="form-label">
              Age <span className="text-danger">*</span>
            </label>
            <small className="text-muted d-block mb-1">
              Must be between {minChildAge} and {maxChildAge}.
            </small>
            <select
              className={`form-select ${errors[i]?.age ? "is-invalid" : ""}`}
              value={child.age}
              onChange={(e) => handleField(i, "age", e.target.value)}
              aria-invalid={!!errors[i]?.age}
              disabled={ageOptions.length === 0}
            >
              <option value="">Select age…</option>
              {ageOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            {errors[i]?.age && <div className="invalid-feedback">{errors[i].age}</div>}
          </div>

          {/* energy level */}
          <div className="mb-3">
            <label className="form-label">
              Energy Level <span className="text-danger">*</span>
            </label>
            <div className="energy-options" role="group" aria-label="Energy level">
              {[
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  className={`btn energy-btn ${child.energy_level === opt.value ? "active" : ""}`}
                  onClick={() => handleField(i, "energy_level", opt.value)}
                  aria-pressed={child.energy_level === opt.value}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {errors[i]?.energy_level && <div className="text-danger small mt-1">{errors[i].energy_level}</div>}
          </div>

          {/* learning style */}
          <div className="mb-1">
            <label className="form-label">
              Learning Style <span className="text-danger">*</span>
            </label>
            <div className="learning-style-options" role="group" aria-label="Learning style">
              {["Visual", "Active", "Calm", "Social"].map((style) => (
                <button
                  type="button"
                  key={style}
                  className={`btn energy-btn ${child.learning_style === style ? "active" : ""}`}
                  onClick={() => handleField(i, "learning_style", style)}
                  aria-pressed={child.learning_style === style}
                >
                  {style}
                </button>
              ))}
            </div>
            {errors[i]?.learning_style && (
              <div className="text-danger small mt-1">{errors[i].learning_style}</div>
            )}
          </div>
        </div>
      ))}

      {/* footer */}
      <div className="d-flex justify-content-end">
        <button type="submit" className="btn btn-next" title="Next">
          Next →
        </button>
      </div>
    </form>
  );
};

export default Step2_Kids;
