import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Step3_Setting.css";
import { fetchSuburbList } from "../../lib/api/playdate";

const Step3_Setting = ({ onNext, _onBack, data }) => {
  /* local form state */
  const [form, setForm] = useState({
    location: data.location || "",
    place: data.place || "",
    homeType: data.homeType || "",
    timeAvailable: data.timeAvailable || "",
    budget: data.budget || "",
    plannedDate: data.plannedDate || "",
    plannedTime: data.plannedTime || "",
  });

  /* separate input text for autocomplete */
  const [locationInput, setLocationInput] = useState(data.location || "");
  const [showList, setShowList] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  /* autocomplete backend state */
  const [remoteSuburbs, setRemoteSuburbs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* errors only after submit */
  const [errors, setErrors] = useState({});

  /* static options */
  const placeOptions    = useMemo(() => ["Indoor", "Outdoor"], []);
  const homeTypeOptions = useMemo(() => ["Apartment", "House", "Other"], []);
  const timeOptions     = useMemo(() => ["15–30 mins", "30–60 mins", "1–2 hrs"], []);
  const budgetOptions   = useMemo(() => ["Free", "< $15", "< $30", "< $50"], []);

  /* tiny helpers */
  const pad2   = (n) => String(n).padStart(2, "0");
  const isoDate= (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const isoTime= (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  const sameYMD = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  // aus date format
  const formatAusDateTime = (dateStr, timeStr = null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T00:00:00");
    const day = date.getDate();
    const monthNames = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December"
    ];
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

  /* date window: >= now+1h and <= now+7d */
  const now   = new Date();
  const minDT = new Date(now.getTime() + 60 * 60 * 1000);
  const maxDT = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const minDateStr = isoDate(minDT);
  const maxDateStr = isoDate(maxDT);
  const earliestIsToday = sameYMD(minDT, now);

  /* time bounds only on boundary days */
  const minTimeStr = form.plannedDate === minDateStr ? isoTime(minDT) : undefined;
  const maxTimeStr = form.plannedDate === maxDateStr ? isoTime(maxDT) : undefined;

  /* clear homeType if switched to outdoor */
  useEffect(() => {
    if (form.place === "Outdoor" && form.homeType) {
      setForm((p) => ({ ...p, homeType: "" }));
      setErrors((p) => ({ ...p, homeType: "" }));
    }
  }, [form.place, form.homeType]);

  /* field setter + clear its error */
  const setField = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: "" }));
  };

  const selectedDT = (draft) =>
    draft.plannedDate && draft.plannedTime ? new Date(`${draft.plannedDate}T${draft.plannedTime}`) : null;

  /* fetch suburbs from backend with debounce */
  useEffect(() => {
    const q = locationInput.trim();
    if (q.length < 3) {
      setRemoteSuburbs([]);
      setError("");
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetchSuburbList(q);
        setRemoteSuburbs(res.items.map((r) => r.suburb));
      } catch (e) {
        setError("Failed to fetch suburbs");
        setRemoteSuburbs([]);
      } finally {
        setLoading(false);
      }
    }, 300); // debounce

    return () => clearTimeout(timer);
  }, [locationInput]);

  const selectSuburb = (name) => {
    setLocationInput(name);
    setField("location", name); // store canonical name
    setShowList(false);
    setActiveIdx(-1);
  };

  const inputRef = useRef(null);
  const listRef = useRef(null);
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

  /* simple validation */
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
    if (!draft.plannedDate) e.plannedDate = "Pick a date.";
    if (!draft.plannedTime) e.plannedTime = "Pick a start time.";

    const sel = selectedDT(draft);
    if (sel) {
      if (sel < minDT) {
        if (draft.plannedDate === minDateStr) {
          const dayWord = earliestIsToday ? "today" : formatAusDateTime(isoDate(minDT));
          e.plannedTime = `Start time must be after ${formatAusDateTime(isoDate(minDT), isoTime(minDT))} ${dayWord}.`;
        } else {
          e.plannedDate = `Pick ${formatAusDateTime(isoDate(minDT))} or later.`;
        }
      } else if (sel > maxDT) {
        if (draft.plannedDate === maxDateStr) {
          e.plannedTime = `Start time must be before ${formatAusDateTime(isoDate(maxDT), isoTime(maxDT))}.`;
        } else {
          e.plannedDate = `Pick ${formatAusDateTime(isoDate(maxDT))} or earlier.`;
        }
      }
    }
    return e;
  };

  const handleNext = () => {
    const draft = { ...form };
    const current = validate(draft);
    setErrors(current);
    if (Object.keys(current).length === 0) onNext(draft);
  };

  /* small pill group */
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

  return (
    <div className="step-form animate-fade-in">
      <h4 className="mb-4">Lets personalise your activity setting</h4>

      {/* location (autocomplete) */}
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
            setField("location", ""); // clear until selection
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
              const pick =
                activeIdx >= 0 ? remoteSuburbs[activeIdx]
                : remoteSuburbs.length === 1 ? remoteSuburbs[0]
                : null;
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

        {loading && <div className="form-text text-muted">Searching suburbs…</div>}
        {error && !errors.location && <div className="form-text text-danger">{error}</div>}

        {showList && remoteSuburbs.length > 0 && (
          <ul
            className="list-group position-absolute w-100 mt-1 shadow-sm"
            style={{ zIndex: 10, maxHeight: 240, overflow: "auto" }}
            ref={listRef}
            role="listbox"
            aria-label="Suburb suggestions"
          >
            {remoteSuburbs.map((name, idx) => (
              <li
                key={name}
                className={`list-group-item list-group-item-action ${idx === activeIdx ? "active" : ""}`}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseDown={(e) => { e.preventDefault(); selectSuburb(name); }}
                role="option"
                aria-selected={idx === activeIdx}
              >
                {name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* place */}
      <div className="mb-3">
        <label className="form-label">
          Where should the activity happen? <span className="text-danger">*</span>
        </label>
        <PillGroup name="place" value={form.place} options={placeOptions} />
        {errors.place && <div className="text-danger small mt-1">{errors.place}</div>}
      </div>

      {/* home type (only if indoor) */}
      {form.place === "Indoor" && (
        <div className="mb-3">
          <label className="form-label">
            Your home type <span className="text-danger">*</span>
          </label>
          <PillGroup name="homeType" value={form.homeType} options={homeTypeOptions} />
          {errors.homeType && <div className="text-danger small mt-1">{errors.homeType}</div>}
        </div>
      )}

      {/* time available */}
      <div className="mb-3">
        <label className="form-label">
          Time available for activity <span className="text-danger">*</span>
        </label>
        <PillGroup name="timeAvailable" value={form.timeAvailable} options={timeOptions} />
        {errors.timeAvailable && <div className="text-danger small mt-1">{errors.timeAvailable}</div>}
      </div>

      {/* budget */}
      <div className="mb-3">
        <label className="form-label">
          Your activity budget <span className="text-danger">*</span>
        </label>
        <PillGroup name="budget" value={form.budget} options={budgetOptions} />
        {errors.budget && <div className="text-danger small mt-1">{errors.budget}</div>}
      </div>

      {/* planned date & time */}
      <div className="row gx-3 mb-1">
        <div className="col-md-6 mb-3">
          <label htmlFor="pd-date" className="form-label">
            Planned date <span className="text-danger">*</span>
          </label>
          <input
            id="pd-date"
            type="date"
            lang="en-AU"
            className={`form-control ${errors.plannedDate ? "is-invalid" : ""}`}
            value={form.plannedDate}
            onChange={(e) => setField("plannedDate", e.target.value)}
            min={minDateStr}
            max={maxDateStr}
            aria-invalid={!!errors.plannedDate}
          />
          {errors.plannedDate && <div className="invalid-feedback">{errors.plannedDate}</div>}
          <small className="text-muted d-block mt-1">
            Earliest: {formatAusDateTime(isoDate(minDT), isoTime(minDT))} • Latest: {formatAusDateTime(isoDate(maxDT), isoTime(maxDT))}
          </small>
        </div>

        <div className="col-md-6 mb-3">
          <label htmlFor="pd-time" className="form-label">
            Start time <span className="text-danger">*</span>
          </label>
          <input
            id="pd-time"
            type="time"
            lang="en-AU"
            className={`form-control ${errors.plannedTime ? "is-invalid" : ""}`}
            value={form.plannedTime}
            onChange={(e) => setField("plannedTime", e.target.value)}
            step="300"
            min={minTimeStr}
            max={maxTimeStr}
            aria-invalid={!!errors.plannedTime}
          />
          {errors.plannedTime && <div className="invalid-feedback">{errors.plannedTime}</div>}
        </div>
      </div>

      {/* footer */}
      <div className="d-flex justify-content-end mt-4">
        <button className="btn btn-next" type="button" onClick={handleNext} title="Next">
          Next →
        </button>
      </div>
    </div>
  );
};

export default Step3_Setting;
