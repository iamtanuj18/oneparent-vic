import React, { useState, useMemo } from "react";
import "./Step1_Family.css";

// options for energy, kids, and age
const ENERGY_OPTIONS = [
  { label: "Exhausted", value: "exhausted" },
  { label: "Low", value: "low" },
  { label: "Balanced", value: "balanced" },
  { label: "Energised", value: "high" },
];
const KIDS_OPTIONS = [1, 2, 3, 4];
const AGE_OPTIONS = Array.from({ length: 11 }, (_, i) => 30 + i);

const Step1_Family = ({ onNext, data }) => {
  // form state for parent info
  const [form, setForm] = useState({
    parentType: data.parentType || "",
    parentAge: data.parentAge || "",
    energy: data.energy || "",
    numberOfKids: data.numberOfKids ?? 1,
  });
  // error state for validation
  const [errors, setErrors] = useState({});

  // validation logic for form fields
  const validate = useMemo(() => {
    return (draft = form) => {
      const e = {};
      if (!draft.parentType) e.parentType = "Please select your role.";

      const ageNum = Number(draft.parentAge);
      if (!draft.parentAge) e.parentAge = "Choose your age.";
      else if (Number.isNaN(ageNum) || ageNum < 30 || ageNum > 40)
        e.parentAge = "Age must be between 30 and 40.";

      if (!draft.energy) e.energy = "Please select your energy level.";

      const kidsNum = Number(draft.numberOfKids);
      if (!draft.numberOfKids) e.numberOfKids = "Pick a value.";
      else if (Number.isNaN(kidsNum) || kidsNum < 1 || kidsNum > 4)
        e.numberOfKids = "Pick a value between 1 and 4.";

      return e;
    };
  }, [form]);

  // handle input changes for select fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // handle energy pill click
  const handleEnergyClick = (value) => {
    setForm((prev) => ({ ...prev, energy: value }));
    setErrors((prev) => ({ ...prev, energy: "" }));
  };

  // handle form submit and validate
  const handleSubmit = (e) => {
    e.preventDefault();
    const currentErrors = validate(form);
    setErrors(currentErrors);
    if (Object.keys(currentErrors).length === 0) {
      onNext({
        ...form,
        parentAge: Number(form.parentAge),
        numberOfKids: Number(form.numberOfKids),
      });
    }
  };

  // main render for parent info form
  return (
    <form className="step-form" onSubmit={handleSubmit} noValidate>
      <div className="mb-4">
        <label className="form-label">
          You are a... <span className="text-danger">*</span>
        </label>
        <select
          name="parentType"
          value={form.parentType}
          onChange={handleChange}
          className={`form-select ${errors.parentType ? "is-invalid" : ""}`}
          required
          aria-invalid={!!errors.parentType}
          autoComplete="off"
        >
          <option value="">Select…</option>
          <option value="Single Mother">Single Mother</option>
          <option value="Single Father">Single Father</option>
        </select>
        {errors.parentType && <div className="invalid-feedback">{errors.parentType}</div>}
      </div>

      <div className="mb-4">
        <label className="form-label">
          Your age <span className="text-danger">*</span>
        </label>
        <select
          name="parentAge"
          value={form.parentAge}
          onChange={handleChange}
          className={`form-select ${errors.parentAge ? "is-invalid" : ""}`}
          required
          aria-invalid={!!errors.parentAge}
          autoComplete="off"
        >
          <option value="">Select age…</option>
          {AGE_OPTIONS.map((age) => (
            <option key={age} value={age}>{age}</option>
          ))}
        </select>
        {errors.parentAge && <div className="invalid-feedback">{errors.parentAge}</div>}
      </div>

      <div className="mb-4">
        <label className="form-label">
          What kind of energy do you want the activity to match? <span className="text-danger">*</span>
        </label>
        <div className="energy-options" role="group" aria-label="Energy level">
          {ENERGY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`btn energy-btn ${form.energy === opt.value ? "active" : ""}`}
              onClick={() => handleEnergyClick(opt.value)}
              aria-pressed={form.energy === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {errors.energy && <div className="text-danger small mt-1">{errors.energy}</div>}
      </div>

      <div className="mb-4">
        <label className="form-label">
          How many children will be joining this activity? <span className="text-danger">*</span>
        </label>
        <select
          name="numberOfKids"
          value={form.numberOfKids}
          onChange={handleChange}
          className={`form-select ${errors.numberOfKids ? "is-invalid" : ""}`}
          required
          aria-invalid={!!errors.numberOfKids}
          autoComplete="off"
        >
          <option value="">Select…</option>
          {KIDS_OPTIONS.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        {errors.numberOfKids && <div className="invalid-feedback">{errors.numberOfKids}</div>}
      </div>

      <div className="d-flex justify-content-end">
        {/* next button is always clickable, errors are shown if fields are missing */}
        <button type="submit" className="btn btn-next" title="Next">
          Next →
        </button>
      </div>
    </form>
  );
};

export default Step1_Family;
