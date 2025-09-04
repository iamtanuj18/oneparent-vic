import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Step3_Setting.css";
import { apiFetch } from "../../lib/api/client";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// step 3 for setting up playdate activity
const Step3_Setting = ({ onNext, data }) => {
  // form state for all fields
  const [form, setForm] = useState({
    location: data.location || "",
    place: data.place || "",
    homeType: data.homeType || "",
    timeAvailable: data.timeAvailable || "",
    budget: data.budget || "",
    plannedDate: data.plannedDate || "",
    plannedTime: data.plannedTime || "",
  });

  // input state for location search
  const [locationInput, setLocationInput] = useState(data.location || "");
  const [showList, setShowList] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  // state for all suburbs and filtered list
  const [allSuburbs, setAllSuburbs] = useState([]);
  const [remoteSuburbs, setRemoteSuburbs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // error state for form validation
  const [errors, setErrors] = useState({});

  // options for pills
  const placeOptions    = useMemo(() => ["Indoor", "Outdoor"], []);
  const homeTypeOptions = useMemo(() => ["Apartment", "House", "Other"], []);
  const timeOptions     = useMemo(() => ["15–30 mins", "30–60 mins", "1–2 hrs"], []);
  const budgetOptions   = useMemo(() => ["Free", "< $15", "< $30", "< $50"], []);

  // helper to format date as yyyy-mm-dd
  // const isoDate = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; // removed, unused
  // helper to format date and time for australia
  const formatAusDateTime = (dateStr, timeStr = null) => { // eslint-disable-line no-unused-vars
    if (!dateStr) return "";
    const date = new Date(dateStr + "T00:00:00");
    const day = date.getDate();
    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    let result = `${day} ${month} ${year}`;
    if (timeStr) {
      const [hour24, minute] = timeStr.split(":").map(Number);
      const hour12 = hour24 % 12 || 12;
      const ampm = hour24 >= 12 ? "PM" : "AM";
      result += ` at ${hour12}:${String(minute).padStart(2,"0")} ${ampm}`;
    }
    return result;
  };

  // set min and max date for planning
  // removed min/max date limit

  // reset home type if outdoor is selected
  useEffect(() => {
    if (form.place === "Outdoor" && form.homeType) {
      setForm((p) => ({ ...p, homeType: "" }));
      setErrors((p) => ({ ...p, homeType: "" }));
    }
  }, [form.place, form.homeType]);

  // update field and clear error
  const setField = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: "" }));
  };

  // get selected date and time as date object
  // const selectedDT = (draft) => draft.plannedDate && draft.plannedTime ? new Date(`${draft.plannedDate}T${draft.plannedTime}`) : null; // removed, unused

  // fetch all suburbs once on mount
  useEffect(() => {
    async function fetchAllSuburbs() {
      setLoading(true);
      setError("");
      try {
        const res = await apiFetch("/suburb-list-all", { method: "GET" });
        setAllSuburbs(Array.isArray(res.items) ? res.items.map((r) => r.suburb) : []);
      } catch {
        setError("Failed to fetch suburbs");
        setAllSuburbs([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAllSuburbs();
  }, []);

  // filter suburbs locally as user types
  useEffect(() => {
    const q = locationInput.trim().toLowerCase();
    if (q.length < 3) {
      setRemoteSuburbs([]);
      return;
    }
    setRemoteSuburbs(
      allSuburbs.filter((sub) => sub.toLowerCase().includes(q)).slice(0, 8)
    );
  }, [locationInput, allSuburbs]);

  // select a suburb from the list
  const selectSuburb = (name) => {
    setLocationInput(name);
    setField("location", name);
    setShowList(false);
    setActiveIdx(-1);
  };

  // refs for input and list
  const inputRef = useRef(null);
  const listRef = useRef(null);
  // close list when clicking away
  useEffect(() => {
    const onClickAway = (e) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target) &&
        listRef.current &&
        !listRef.current.contains(e.target)
      ) {
        setShowList(false);
      }
    };
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  // validate all fields
  const validate = (draft = form) => {
    const e = {};
    if (!locationInput.trim()) {
      e.location = "Please enter your suburb or town.";
    } else if (!form.location) {
      e.location = "Please select a suburb from the list.";
    }

    if (!draft.place) e.place = "Select indoor or outdoor.";
    if (draft.place === "Indoor" && !draft.homeType) e.homeType = "Select home type.";
    if (!draft.timeAvailable) e.timeAvailable = "Select time available.";
    if (!draft.budget) e.budget = "Select your budget.";
  if (!draft.plannedDate) e.plannedDate = "please pick a date for your activity. this field is required.";
  if (!draft.plannedTime) e.plannedTime = "please pick a start time for your activity. this field is required.";

  // removed date range validation
    return e;
  };

  // handle next button click
  const handleNext = () => {
    const draft = { ...form };
    const current = validate(draft);
    setErrors(current);
    if (Object.keys(current).length === 0) onNext(draft);
  };

  // pill group for options
  const PillGroup = ({ name, value, options }) => (
    <div className="option-row" role="group" aria-label={name}>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`btn energy-btn ${value === opt ? "active" : ""}`}
          onClick={() => setField(name, opt)}
          aria-pressed={value === opt}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  // main form ui
  return (
    <div className="step-form animate-fade-in">
      <h4 className="mb-4">Lets personalise your activity setting</h4>

      {/* location input and suburb search */}
      <div className="mb-3 position-relative">
        <label htmlFor="pd-location" className="form-label">
          Your suburb or town <span className="text-danger">*</span>
        </label>

        <input
          id="pd-location"
          type="text"
          className={`form-control ${errors.location ? "is-invalid" : ""}`}
          value={locationInput}
          onChange={(e) => {
            setLocationInput(e.target.value);
            setField("location", "");
            setShowList(true);
            setActiveIdx(-1);
          }}
          onFocus={() => setShowList(true)}
          onKeyDown={(e) => {
            if (!showList || remoteSuburbs.length === 0) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIdx((i) => Math.min(remoteSuburbs.length - 1, i + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIdx((i) => Math.max(0, i - 1));
            } else if (e.key === "Enter") {
              e.preventDefault();
              const pick = activeIdx >= 0 ? remoteSuburbs[activeIdx] : remoteSuburbs.length === 1 ? remoteSuburbs[0] : null;
              if (pick) selectSuburb(pick);
            } else if (e.key === "Escape") {
              setShowList(false);
            }
          }}
          placeholder="e.g., Brunswick, VIC"
          aria-invalid={!!errors.location}
          autoComplete="off"
          ref={inputRef}
        />
        {errors.location && <div className="invalid-feedback">{errors.location}</div>}

        {showList && loading && !form.location && (
          <div className="form-text text-muted">Searching suburbs…</div>
        )}
        {error && !errors.location && <div className="form-text text-danger">{error}</div>}

        {showList && remoteSuburbs.length > 0 && (
          <ul
            className="list-group position-absolute w-100 mt-1 shadow-sm"
            style={{ zIndex: 10, maxHeight: 240, overflow: "auto" }}
            ref={listRef}
            role="listbox"
          >
            {remoteSuburbs.map((suburb, idx) => (
              <li
                key={suburb}
                className={`list-group-item list-group-item-action${activeIdx === idx ? " active" : ""}`}
                style={{
                  cursor: "pointer",
                  background: activeIdx === idx ? "#1769ff" : "#fff",
                  color: activeIdx === idx ? "#fff" : "#222",
                  fontWeight: activeIdx === idx ? 500 : 400,
                  transition: "background 0.2s, color 0.2s"
                }}
                onMouseDown={() => selectSuburb(suburb)}
                onMouseEnter={() => setActiveIdx(idx)}
                role="option"
                aria-selected={activeIdx === idx}
              >
                {suburb}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* place selection pills */}
      <div className="mb-3">
        <label className="form-label">
          Where should the activity happen? <span className="text-danger">*</span>
        </label>
        <PillGroup name="place" value={form.place} options={placeOptions} />
        {errors.place && <div className="text-danger small mt-1">{errors.place}</div>}
      </div>

      {/* home type pills if indoor is selected */}
      {form.place === "Indoor" && (
        <div className="mb-3">
          <label className="form-label">
            Your home type <span className="text-danger">*</span>
          </label>
          <PillGroup name="homeType" value={form.homeType} options={homeTypeOptions} />
          {errors.homeType && <div className="text-danger small mt-1">{errors.homeType}</div>}
        </div>
      )}

      {/* time available pills */}
      <div className="mb-3">
        <label className="form-label">
          Time available for activity <span className="text-danger">*</span>
        </label>
        <PillGroup name="timeAvailable" value={form.timeAvailable} options={timeOptions} />
        {errors.timeAvailable && <div className="text-danger small mt-1">{errors.timeAvailable}</div>}
      </div>

      {/* budget pills */}
      <div className="mb-3">
        <label className="form-label">
          Your activity budget <span className="text-danger">*</span>
        </label>
        <PillGroup name="budget" value={form.budget} options={budgetOptions} />
        {errors.budget && <div className="text-danger small mt-1">{errors.budget}</div>}
      </div>

      {/* planned date and time inputs */}
      <div className="row gx-3 mb-1">
        <div className="col-md-6 mb-3">
          <label htmlFor="pd-date" className="form-label">
            Planned date <span className="text-danger">*</span>
          </label>
          <ReactDatePicker
            id="pd-date"
            selected={form.plannedDate ? new Date(form.plannedDate) : null}
            onChange={date => setField("plannedDate", date ? date.toISOString().slice(0, 10) : "")}
            dateFormat="yyyy-MM-dd"
            className={`form-control ${errors.plannedDate ? "is-invalid" : ""}`}
            placeholderText="Select date"
            aria-invalid={!!errors.plannedDate}
            style={{ cursor: 'pointer' }}
          />
          {errors.plannedDate && <div className="invalid-feedback">{errors.plannedDate}</div>}
        </div>

        <div className="col-md-6 mb-3">
          <label htmlFor="pd-time" className="form-label">
            Start time <span className="text-danger">*</span>
          </label>
          <ReactDatePicker
            id="pd-time"
            selected={form.plannedTime ? new Date(`1970-01-01T${form.plannedTime}`) : null}
            onChange={date => setField("plannedTime", date ? date.toTimeString().slice(0,5) : "")}
            showTimeSelect
            showTimeSelectOnly
            timeIntervals={5}
            timeCaption="Time"
            dateFormat="HH:mm"
            className={`form-control ${errors.plannedTime ? "is-invalid" : ""}`}
            placeholderText="Select time"
            aria-invalid={!!errors.plannedTime}
            style={{ cursor: 'pointer' }}
          />
          {errors.plannedTime && <div className="invalid-feedback">{errors.plannedTime}</div>}
        </div>
      </div>

      {/* next button */}
      <div className="d-flex justify-content-end mt-4">
        <button className="btn btn-next" type="button" onClick={handleNext} title="Next">
          Next →
        </button>
      </div>
    </div>
  );
};

export default Step3_Setting;
