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
        <div className="split-hero__stats" aria-live="polite">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="stat-item skeleton" />)
            : stats.slice(0, 4).map((s, i) => (
                <div key={s.id ?? i} className="stat-item">
                  {/* show stat context, value, and label */}
                  {s.context && <div className="stat-context">{s.context}</div>}
                  <div className="stat-value" data-animate data-final={s.value} data-type={s.type ?? "int"}>…</div>
                  {s.label && <div className="stat-label">{s.label}</div>}
                </div>
              ))
          }
        </div>
      </div>
    </section>
  );
}
