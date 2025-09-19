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
    const cacheKey = "oneparent_vic_insights";
    const cache = localStorage.getItem(cacheKey);
    let usedCache = false;
    if (cache) {
      try {
        const { overview: cachedOverview, labour: cachedLabour, pps12: cachedPps12, year: cachedYear, ts } = JSON.parse(cache);
        if (cachedOverview && cachedLabour && cachedPps12 && ts && Date.now() - ts < 30 * 60 * 1000) {
          setOverview(cachedOverview);
          setLabour(cachedLabour);
          setPps12(cachedPps12);
          if (cachedYear) setYear(cachedYear);
          usedCache = true;
        }
      } catch { /* ignore cache parse errors */ }
    }
    if (!usedCache) {
      let nextOverview = null, nextLabour = null, nextPps12 = null, nextYear = year;
      Promise.all([
        fetchInsightsOverview({ state }).then((d) => { nextOverview = d; setOverview(d); }),
        fetchInsightsLabourBars(state, year).then((d) => { nextLabour = d; setLabour(d); if (d?.year) { setYear(d.year); nextYear = d.year; } }),
        fetchPpsTrends(state, "state_total").then((series) => { nextPps12 = series.slice(-12); setPps12(nextPps12); })
      ]).then(() => {
        localStorage.setItem(cacheKey, JSON.stringify({ overview: nextOverview, labour: nextLabour, pps12: nextPps12, year: nextYear, ts: Date.now() }));
      }).catch((e) => setErr(e.message));
    }
  }, [state, year]);

  // summarize trend for card 1 and prepare a simple bar visual
  const ppsSummary = useMemo(() => {
    if (!pps12.length) return null;
    const first = pps12[0].value;
    const last = pps12[pps12.length - 1].value;
    const diff = last - first;
    const pct = first ? Math.round((diff / first) * 100) : 0;
    const trendWord = diff === 0 ? "stayed about the same" : diff > 0 ? "increased" : "decreased";
    // For bar visual: show start and end as a bar
    const min = Math.min(first, last);
    const max = Math.max(first, last);
    const barW = 180;
    const startPct = Math.round(((first - min) / (max - min || 1)) * 100);
    const endPct = Math.round(((last - min) / (max - min || 1)) * 100);
    return { first, last, diff, pct, trendWord, barW, startPct, endPct };
  }, [pps12]);

  // clarify work reality breakdown for single-parent families
  const singleBars = useMemo(() => {
    if (!labour?.single) return [];
    const total = labour.single.reduce((s, x) => s + (x.value || 0), 0) || 1;
    const employed = labour.single.find((x) => x.name.toLowerCase().includes("employed"))?.value || 0;
    const unemployed = labour.single.find((x) => x.name.toLowerCase().includes("unemployed"))?.value || 0;
    const notInLabour = labour.single.find((x) => x.name.toLowerCase().includes("not in"))?.value || 0;
    const inLabourForce = employed + unemployed;
    return [
      {
        name: `Of all single-parent families in the labour force:`,
        pct: null,
        isHeader: true,
      },
      {
        name: `• ${inLabourForce ? Math.round((employed/inLabourForce)*100) : 0}% are employed`,
        pct: inLabourForce ? Math.round((employed/inLabourForce)*100) : 0,
      },
      {
        name: `• ${inLabourForce ? Math.round((unemployed/inLabourForce)*100) : 0}% are unemployed`,
        pct: inLabourForce ? Math.round((unemployed/inLabourForce)*100) : 0,
      },
      {
        name: `Of all single-parent families:`,
        pct: null,
        isHeader: true,
      },
      {
        name: `${Math.round((notInLabour/total)*100)}% are not in the labour force`,
        pct: Math.round((notInLabour/total)*100),
      },
    ];
  }, [labour]);

  // make families snapshot for card 3, and prepare a bar visual
  const families = useMemo(() => {
    if (!overview) return null;
    const k = (n) => Math.max(0, Math.round((Number(n) || 0) * 1000));
    const total = k(overview.total_families);
    const with014 = k(overview.with_children_0_14);
    const with14plus = total - with014;
    const pct014 = total ? Math.round((with014 / total) * 100) : 0;
    const pct14plus = total ? Math.round((with14plus / total) * 100) : 0;
    return {
      year: overview.year ?? "—",
      total,
      with014,
      with14plus,
      pct014,
      pct14plus,
    };
  }, [overview]);

  // format numbers for display
  const fmt = (n) => (typeof n === "number" ? n.toLocaleString("en-AU") : "—");

  return (
    <section className="insights-strip container">
      <div className="insights-grid">

  {/* card 1 shows how vic is changing */}
        <article className="insight-card">
          <header className="insight-title">Parenting Payment (Single) recipients in VIC</header>
          {ppsSummary ? (
            <p className="insight-copy">
              Over the last 12 months, the number of Parenting Payment (Single) recipients in Victoria increased from <b>{ppsSummary.first.toLocaleString()}</b> to <b>{ppsSummary.last.toLocaleString()}</b>
              {ppsSummary.diff !== 0 ? (
                <> (<b>{(ppsSummary.diff > 0 ? "+" : "") + ppsSummary.diff.toLocaleString()}</b>, ~{Math.abs(ppsSummary.pct)}%).</>
              ) : "."}
            </p>
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
                {singleBars.map((b, i) => b.isHeader ? (
                  <li key={b.name} className="bar" style={{fontWeight:600, color:'#0a1020', marginTop:i>0?12:0}}>{b.name}</li>
                ) : (
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
              <div><span className="k">With children under 14 years old:</span> <span className="v">{fmt(families.with014)} families</span></div>
              <div><span className="k">With children 14 years old and over:</span> <span className="v">{fmt(families.with14plus)} families</span></div>
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
