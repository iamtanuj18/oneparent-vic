import { useEffect, useMemo, useState } from "react";
import {
  fetchInsightsLabourBars,
  fetchPpsTrends,
  fetchInsightsOverview,
} from "../../lib/api/insights";
import "./InsightsStrip.css";

// this component shows three cards with insights for vic
export default function InsightsStrip({ state = "VIC" }) {
  const [year, setYear] = useState(2024);
  const [labour, setLabour] = useState(null);
  const [pps12, setPps12] = useState([]);
  const [overview, setOverview] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetchInsightsOverview({ state })
      .then(setOverview)
      .catch((e) => setErr(e.message));
  }, [state]);

  useEffect(() => {
    fetchInsightsLabourBars(state, year)
      .then((d) => {
        setLabour(d);
        if (d?.year) setYear(d.year);
      })
      .catch((e) => setErr(e.message));
  }, [state, year]);

  useEffect(() => {
    fetchPpsTrends(state, "state_total")
      .then((series) => setPps12(series.slice(-12)))
      .catch((e) => setErr(e.message));
  }, [state]);

  // make sparkline data for card 1
  const ppsSpark = useMemo(() => {
    if (!pps12.length) return null;
    const vals = pps12.map((d) => d.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const w = 320, h = 84, pad = 8;
    const toX = (i) => pad + (i / (pps12.length - 1)) * (w - pad * 2);
    const toY = (v) => (max === min ? h / 2 : h - pad - ((v - min) / (max - min)) * (h - pad * 2));
    const points = pps12.map((d, i) => `${toX(i)},${toY(d.value)}`).join(" ");
    const first = pps12[0].value;
    const last = pps12[pps12.length - 1].value;
    const diff = last - first;
    const pct = first ? Math.round((diff / first) * 100) : 0;
    const trendWord = diff === 0 ? "stayed about the same" : diff > 0 ? "increased" : "decreased";
    return { w, h, points, first, last, diff, pct, trendWord };
  }, [pps12]);

  // make work reality bars for card 2
  const singleBars = useMemo(() => {
    if (!labour?.single) return [];
    const total = labour.single.reduce((s, x) => s + (x.value || 0), 0) || 1;
    return labour.single.map((x) => ({
      name: x.name,
      pct: Math.round(((x.value || 0) / total) * 100),
    }));
  }, [labour]);

  // make families snapshot for card 3
  const families = useMemo(() => {
    if (!overview) return null;
    const k = (n) => Math.max(0, Math.round((Number(n) || 0) * 1000)); // table stores in thousands
    return {
      year: overview.year ?? "—",
      total: k(overview.total_families),
      with014: k(overview.with_children_0_14),
      with024: null, // not available in this table; hide
      withoutDeps: null, // not available; hide
    };
  }, [overview]);

  // format numbers for display
  const fmt = (n) => (typeof n === "number" ? n.toLocaleString("en-AU") : "—");

  return (
    <section className="insights-strip container">
      <div className="insights-grid">

  {/* card 1 shows how vic is changing */}
        <article className="insight-card">
          <header className="insight-title">How VIC is changing</header>
          {ppsSpark ? (
            <>
              <svg
                className="spark"
                viewBox={`0 0 ${ppsSpark.w} ${ppsSpark.h}`}
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <polyline fill="none" stroke="currentColor" strokeWidth="3" points={ppsSpark.points} />
              </svg>
              <p className="insight-copy">
                Parenting Payment (Single) recipients in VIC {ppsSpark.trendWord} from{" "}
                <b>{ppsSpark.first.toLocaleString()}</b> to{" "}
                <b>{ppsSpark.last.toLocaleString()}</b> over the last 12 months
                {ppsSpark.diff !== 0 ? (
                  <> (<b>{(ppsSpark.diff > 0 ? "+" : "") + ppsSpark.diff.toLocaleString()}</b>, ~{Math.abs(ppsSpark.pct)}%).</>
                ) : "."}
              </p>
            </>
          ) : (
            <p className="insight-copy">Loading…</p>
          )}
        </article>

  {/* card 2 shows work reality for single-parent families */}
        <article className="insight-card">
          <header className="insight-title">Work reality (single-parent families)</header>
          {singleBars.length ? (
            <>
              <ul className="bars">
                {singleBars.map((b) => (
                  <li key={b.name} className="bar">
                    <span className="bar-label">{b.name}</span>
                    <div className="bar-track" role="img" aria-label={`${b.name} ${b.pct}%`}>
                      <div className="bar-fill" style={{ width: `${b.pct}%` }} />
                    </div>
                    <span className="bar-pct">{b.pct}%</span>
                  </li>
                ))}
              </ul>
              <footer className="insight-foot">Latest year: <b>{year}</b></footer>
            </>
          ) : (
            <p className="insight-copy">Loading…</p>
          )}
        </article>

  {/* card 3 shows single-parent families snapshot */}
        <article className="insight-card">
          <header className="insight-title">Single-parent families in VIC today</header>
          {families ? (
            <div className="kv">
              <div><span className="k">Total:</span> <span className="v">{fmt(families.total)} families</span></div>
              <div><span className="k">With children under 14:</span> <span className="v">{fmt(families.with014)} families</span></div>
            </div>
          ) : (
            <p className="insight-copy">Loading…</p>
          )}
          <footer className="insight-foot">Source year: <b>{families?.year ?? "—"}</b></footer>
        </article>

      </div>
      {err && <p className="insights-error">Error: {err}</p>}
    </section>
  );
}
