// split hero with animated metrics and clean light theme
import { useEffect, useRef } from "react";
import "./SplitHero.css";

export default function SplitHero({ theme = "light", title, stats = [], loading = false }) {
  // this ref is used for animating numbers
  const rootRef = useRef(null);

  useEffect(() => {
    // animate stat numbers unless loading or reduced motion
    if (loading || !rootRef.current) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const format = (n, t) => {
      if (t === "pct") return `${Math.round(n)}%`;
      if (t === "k") return `${Math.round(n)}k`;
      return Math.round(n).toLocaleString();
    };

    const els = rootRef.current.querySelectorAll("[data-animate]");
    els.forEach((el) => {
      const end = Number(el.getAttribute("data-final") || 0);
      const type = el.getAttribute("data-type") || "int";
      if (prefersReduced) { el.textContent = format(end, type); return; }

      let cur = 0;
      const dur = 1800;
      const step = Math.max(1, end / (dur / 16));
      const tick = () => {
        cur += step;
        if (cur < end) { el.textContent = format(cur, type); requestAnimationFrame(tick); }
        else { el.textContent = format(end, type); }
      };
      requestAnimationFrame(tick);
    });
  }, [stats, loading]);

  return (
    <section className={`split-hero split-hero--${theme}`}>
      <div className="split-hero__inner" ref={rootRef}>
        {/* heading for the hero section */}
        <h1 className="split-hero__title">
          {title || <>you are not alone.<br />know your community.</>}
        </h1>

        {/* show skeletons if loading, otherwise show stats */}
        <div className="split-hero__stats" aria-live="polite" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: 'auto auto',
          gap: '32px 48px',
          maxWidth: 700,
          margin: '0 auto',
        }}>
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="stat-item skeleton" />)
            : (
                <>
                  <div className="stat-item" style={{gridColumn:1, gridRow:1}}>
                    {stats[0]?.context && <div className="stat-context">{stats[0].context}</div>}
                    <div className="stat-value" data-animate data-final={stats[0]?.value} data-type={stats[0]?.type ?? "int"}>…</div>
                    {stats[0]?.label && <div className="stat-label">{stats[0].label}</div>}
                  </div>
                  <div className="stat-item" style={{gridColumn:2, gridRow:1}}>
                    {stats[1]?.context && <div className="stat-context">{stats[1].context}</div>}
                    <div className="stat-value" data-animate data-final={stats[1]?.value} data-type={stats[1]?.type ?? "int"}>…</div>
                    {stats[1]?.label && <div className="stat-label">{stats[1].label}</div>}
                  </div>
                  <div className="stat-item" style={{gridColumn:1, gridRow:2}}>
                    {stats[2]?.context && <div className="stat-context">{stats[2].context}</div>}
                    <div className="stat-value" data-animate data-final={stats[2]?.value} data-type={stats[2]?.type ?? "int"}>…</div>
                    {stats[2]?.label && <div className="stat-label">{stats[2].label}</div>}
                  </div>
                </>
              )
          }
        </div>
      </div>
    </section>
  );
}
