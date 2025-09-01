import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import PageHero from "../../components/pagehero/PageHero";
import { getEvents } from "../../lib/api/event";
import "./EventsPage.css";

const CATEGORIES = [
  "Family Activities & Fun",
  "Shows & Theatre",
  "Music & Concert",
  "Exhibitions & Workshops",
];

const PER_PAGE = 9;

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

/** Convert "DD/MM/YYYY" (server format) OR ISO into "Month DD, YYYY" */
const toHumanDate = (input) => {
  if (!input) return "TBA";
  // dd/mm/yyyy?
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

export default function EventsPage() {
  // defaults: start = today+1, end = today+10
  const [category, setCategory] = useState("Family Activities & Fun");
  const [startDate, setStartDate] = useState(() => ymd(addDays(new Date(), 1)));
  const [endDate, setEndDate] = useState(() => ymd(addDays(new Date(), 10)));

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true); // show loader on first paint
  const [err, setErr] = useState("");

  // keep end >= start
  useEffect(() => {
    if (endDate < startDate) setEndDate(startDate);
  }, [startDate, endDate]);

  const payload = useMemo(
    () => ({
      category,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      ticketmasterPage: page,
      perPage: PER_PAGE,
    }),
    [category, startDate, endDate, page]
  );

  async function fetchPage(append = false, overridePage = page) {
    try {
      setLoading(true);
      setErr("");
      const data = await getEvents({ ...payload, ticketmasterPage: overridePage });
      const newItems = Array.isArray(data?.events) ? data.events : [];
      setItems((prev) => (append ? [...prev, ...newItems] : newItems));
      setHasMore(Boolean(data?.pagination?.ticketmasterHasMore));
    } catch (e) {
      setErr("Could not load events. Please try again.");
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }

  // initial load
  useEffect(() => {
    fetchPage(false, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyFilters(e) {
    e?.preventDefault?.();
    setPage(0);
    fetchPage(false, 0);
  }

  async function loadMore() {
    const next = page + 1;
    setPage(next);
    await fetchPage(true, next);
  }

  const todayMin = ymd(new Date());

  return (
    <>
      <Helmet>
        <title>Events Directory — OneParent VIC</title>
        <meta
          name="description"
          content="Curated events for family and kids in one place."
        />
      </Helmet>

      <PageHero
        title="Events Directory"
        subtitle="Curated events for family and kids in one place."
      />

      {/* FILTERS */}
      <section className="events-filter">
        <div className="container">
          <form className="row g-3 align-items-end" onSubmit={applyFilters}>
            <div className="col-12 col-md-4">
              <label className="form-label text-light">Category</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="col-6 col-md-3">
              <label className="form-label text-light">Start date</label>
              <input
                type="date"
                className="form-control"
                min={todayMin}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="col-6 col-md-3">
              <label className="form-label text-light">End date</label>
              <input
                type="date"
                className="form-control"
                min={startDate || todayMin}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-2 d-grid">
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Loading…" : "Apply"}
              </button>
            </div>
          </form>
          <p className="click-hint">Tip: Click any card to view the event on Ticketmaster.</p>
        </div>
      </section>

      {/* GRID */}
      <section className="events-wrap">
        <div className="container">
          {loading && items.length === 0 && (
            <div className="loading-wrap">
              <div className="spinner-border text-primary spinner-xl" role="status" />
              <p className="mt-3 text-light-50">Fetching events…</p>
            </div>
          )}

          {err && !loading && (
            <div className="alert alert-danger mb-4" role="alert">
              {err}
            </div>
          )}

          {!loading && items.length === 0 && !err && (
            <div className="empty-wrap text-center text-muted py-5">
              <p className="mb-1">No events found for your selection.</p>
              <small>Try another category or extend the date range.</small>
            </div>
          )}

            <div className="row g-4">
              {items.map((ev, i) => (
                <div key={`${ev.url}-${i}`} className="col-12 col-md-6 col-lg-4">
                  <article className="event-card">
                    {/* overlay link that makes the whole card clickable */}
                    <a
                      className="card-link-ghost"
                      href={ev.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open event ${ev.title} on Ticketmaster`}
                    />

                    <div className="event-thumb">
                      <img
                        src={ev.image || "/placeholder.jpg"}
                        alt={ev.title}
                        loading="lazy"
                      />
                      {ev.category && <span className="event-chip">{ev.category}</span>}
                    </div>

                    <div className="event-body">
                      <div className="event-meta">
                        <span className="event-date">{toHumanDate(ev.date)}</span>
                        <span className="dot">•</span>
                        <span className="event-loc">{ev.location || "Victoria"}</span>
                      </div>
                      <h3 className="event-title">{ev.title}</h3>
                    </div>
                  </article>
                </div>
              ))}
            </div>
          {hasMore && (
            <div className="d-flex justify-content-center mt-4">
              <button
                className="btn btn-secondary px-4"
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
