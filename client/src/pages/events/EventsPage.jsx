import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { getTicketmasterEvents, getEventfindaEvents } from "../../lib/api/event";
import EventImage from "../../components/EventImage/EventImage";
import "./EventsPage.css";

// categories for dropdown
const CATEGORIES = [
  "Family & Kids Activities",
  "Community & Support",
  "Wellbeing & Parenting",
  "Learning & Development",
  "Arts & Entertainment",
  "Markets & Local Events",
];

// order by dropdown
const ORDER_OPTIONS = [
  { value: "none", label: "no ordering" },
  { value: "date-asc", label: "date: earliest first" },
  { value: "date-desc", label: "date: latest first" },
];

// how many per fetch
const TM_PAGE_SIZE = 6;
const EF_PAGE_SIZE = 6;
const TARGET_TOTAL = TM_PAGE_SIZE + EF_PAGE_SIZE; // 12

// utils
const ymd = (d) => {
  const z = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const toHumanDate = (input) => {
  if (!input) return "TBA";
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(input);
  let d;
  if (m) {
    const [, dd, mm, yyyy] = m;
    d = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
  } else {
    const t = Date.parse(input);
    if (!Number.isNaN(t)) d = new Date(t);
  }
  return d && !Number.isNaN(d.getTime())
    ? d.toLocaleDateString("en-AU", { month: "long", day: "2-digit", year: "numeric" })
    : input;
};
const parseEventDate = (dateStr) => {
  if (!dateStr) return new Date(0);
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dateStr);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}`);
  const parsed = Date.parse(dateStr);
  return Number.isNaN(parsed) ? new Date(0) : new Date(parsed);
};
const sortByOrder = (events, order) => {
  if (order === "none") return events;
  return [...events].sort((a, b) => {
    const da = parseEventDate(a.date);
    const db = parseEventDate(b.date);
    return order === "date-desc" ? db - da : da - db;
  });
};
const dedupe = (events) => {
  const norm = (s) =>
    (s || "")
      .toLowerCase()
      .replace(/&amp;/g, "&")
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  const seen = new Set();
  const out = [];
  for (const ev of events) {
    const key = `${ev.source}|${norm(ev.title)}|${norm(ev.location)}|${(ev.rawDate || "").split("T")[0]}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(ev);
    }
  }
  return out;
};

export default function EventsPage() {
  // filter ui
  const [category, setCategory] = useState("Family & Kids Activities");
  const [startDate, setStartDate] = useState(() => ymd(addDays(new Date(), 1)));
  const [endDate, setEndDate] = useState(() => ymd(addDays(new Date(), 45)));
  const [orderBy, setOrderBy] = useState("none");

  // applied filters
  const [applied, setApplied] = useState({
    category: "Family & Kids Activities",
    startDate: ymd(addDays(new Date(), 1)),
    endDate: ymd(addDays(new Date(), 45)),
  });

  // results + pagination
  const [items, setItems] = useState([]);
  const [tmPage, setTmPage] = useState(0);
  const [efPage, setEfPage] = useState(0);
  const [tmHasMore, setTmHasMore] = useState(true);
  const [efHasMore, setEfHasMore] = useState(true);

  // ui flags
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [err, setErr] = useState("");

  // track requests
  const reqRef = useRef(0);

  // ensure end date is valid
  useEffect(() => {
    if (endDate < startDate) setEndDate(startDate);
  }, [startDate, endDate]);

  // main fetch
  const runFetch = async (isLoadMore = false, filters = applied) => {
    const reqId = ++reqRef.current;
    const payload = { category: filters.category, startDate: filters.startDate, endDate: filters.endDate };

    try {
      if (!isLoadMore) {
        setInitialLoading(true);
        setErr("");
        setItems([]);
        setTmPage(0);
        setEfPage(0);
        setTmHasMore(true);
        setEfHasMore(true);
      } else {
        setLoadingMore(true);
      }

      let tmEvents = [];
      let efEvents = [];

      if (!isLoadMore || tmHasMore) {
        const tmRes = await getTicketmasterEvents({
          ...payload,
          page: isLoadMore ? tmPage : 0,
          perPage: TM_PAGE_SIZE,
        });
        const arr = Array.isArray(tmRes?.events) ? tmRes.events : [];
        tmEvents = arr;
        if (arr.length === TM_PAGE_SIZE) setTmPage((p) => p + 1);
        else setTmHasMore(false);
      }

      let efSize = !isLoadMore ? TARGET_TOTAL - tmEvents.length : tmHasMore ? TARGET_TOTAL - tmEvents.length : TARGET_TOTAL;

      if (efSize > 0 && (!isLoadMore || efHasMore)) {
        const efRes = await getEventfindaEvents({
          ...payload,
          page: isLoadMore ? efPage : 0,
          perPage: efSize,
        });
        const arr = Array.isArray(efRes?.events) ? efRes.events : [];
        efEvents = arr;
        if (arr.length === efSize) setEfPage((p) => p + 1);
        else setEfHasMore(false);
      }

      const combined = dedupe([...tmEvents, ...efEvents]);

      if (reqId !== reqRef.current) return;
      if (isLoadMore) {
        setItems((prev) => dedupe([...prev, ...combined]));
      } else {
        setItems(combined);
      }

      if (isLoadMore && combined.length === 0) {
        setTmHasMore(false);
        setEfHasMore(false);
      }
    } catch (e) {
      if (reqId !== reqRef.current) return;
      setErr("could not load events please try again");
    } finally {
      if (reqId === reqRef.current) {
        setInitialLoading(false);
        setLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    runFetch(false, applied);
    // eslint-disable-next-line
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    const filters = { category, startDate, endDate };
    setApplied(filters);
    await runFetch(false, filters);
  };

  const handleLoadMore = async () => {
    if (loadingMore) return;
    await runFetch(true, applied);
  };

  const handleEventClick = (url) => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const sortedItems = sortByOrder(items, orderBy);
  const todayMin = ymd(new Date());
  const hasMore = tmHasMore || efHasMore;
  const isAnyLoading = initialLoading || loadingMore;

  return (
    <>
      <Helmet>
        <title>Events Directory — OneParent VIC</title>
      </Helmet>

      <div className="bg-light py-5 text-center">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <p className="text-danger fw-bold text-uppercase ls-2 mb-3">see you there!</p>
              <h1 className="display-3 fw-bold text-dark mb-4">Events</h1>
              <p className="lead text-muted">a single hub for curated family wellbeing and education events across victoria</p>
            </div>
          </div>
        </div>
      </div>

      <section className="bg-white py-4 border-bottom">
        <div className="container">
          <form className="row g-3 align-items-end" onSubmit={handleApply}>
            <div className="col-12 col-md-3">
              <label className="form-label fw-semibold">Category</label>
              <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)} disabled={isAnyLoading}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label fw-semibold">Start date</label>
              <input type="date" className="form-control" min={todayMin} value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={isAnyLoading} />
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label fw-semibold">End date</label>
              <input type="date" className="form-control" min={startDate || todayMin} value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={isAnyLoading} />
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label fw-semibold">Order by</label>
              <select className="form-select" value={orderBy} onChange={(e) => setOrderBy(e.target.value)} disabled={isAnyLoading}>
                {ORDER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-2 d-grid">
              <button className="btn btn-primary fw-semibold" type="submit" disabled={isAnyLoading}>
                {initialLoading ? "loading..." : "apply"}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="bg-light py-5">
        <div className="container">
          {initialLoading && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }} role="status" />
              <p className="mt-3 text-muted">loading events...</p>
            </div>
          )}

          {err && !initialLoading && <div className="text-center py-5 text-danger">{err}</div>}

          {!initialLoading && !err && sortedItems.length === 0 && (
            <div className="text-center py-5">
              <div className="bg-white rounded p-5 shadow-sm border border-2 border-dashed">
                <h5 className="text-muted mb-2">no events found</h5>
              </div>
            </div>
          )}

          {!initialLoading && !err && sortedItems.length > 0 && (
            <div className="row g-4">
              {sortedItems.map((ev, i) => (
                <div key={`${ev.source}-${ev.id}-${i}`} className="col-12 col-sm-6 col-lg-4">
                  <div className="card h-100 shadow-sm event-card" onClick={() => handleEventClick(ev.url)}>
                    <div className="position-relative">
                      <EventImage src={ev.image} alt={ev.title} className="card-img-top" />
                      <span className="badge bg-primary position-absolute top-0 start-0 m-2 rounded-pill">{applied.category}</span>
                    </div>
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title">{ev.title}</h5>
                      {ev.description && <p className="card-text text-muted small fst-italic">{ev.description}</p>}
                      <div className="mt-auto">
                        <div className="mb-2">
                          <small className="text-muted fw-semibold">event date:</small>
                          <div>{toHumanDate(ev.date)}</div>
                        </div>
                        <div className="mb-3">
                          <small className="text-muted fw-semibold">event location:</small>
                          <div className="small">{ev.location}</div>
                        </div>
                        <button className="btn btn-outline-dark btn-sm w-100" onClick={(e) => { e.stopPropagation(); handleEventClick(ev.url); }}>
                          view event
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!initialLoading && sortedItems.length > 0 && (
            <div className="text-center mt-5 pt-4 border-top">
              {hasMore ? (
                <button className="btn btn-primary btn-lg px-5 rounded-pill" onClick={handleLoadMore} disabled={loadingMore}>
                  {loadingMore ? "loading more..." : "load more events"}
                </button>
              ) : (
                <div className="bg-white rounded p-4 text-center border border-2 border-dashed">
                  <p className="text-muted mb-2">no more events available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
