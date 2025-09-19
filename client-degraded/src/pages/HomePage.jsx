// this is the homepage for oneparent vic
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import SplitHero from "../components/home/SplitHero";
import InsightsStrip from "../components/home/InsightsStrip";
import HowWeHelpSection from "../components/home/HowWeHelpSection";
import { fetchHeroStats } from "../lib/api/insights";
import "./HomePage.css";

export default function HomePage() {
  const [stats, setStats] = useState([
    { id: "a1", value: 0,  type: "k",  context: "families",           label: "raising children on their own in victoria" },
    { id: "a2", value: 0,  type: "pct", context: "of all families",    label: "are single-parent households in victoria" },
    { id: "a3", value: 0,  type: "pct", context: "growth since 1994",   label: "growth in one-parent families since 1994" }
  ]);
  const [loading, setLoading] = useState(true);

  // fetch hero stats for victoria
  // Only show HomePage loading if no cached stats
  useEffect(() => {
    let alive = true;
    // Try to load cached stats from localStorage
    const cacheKey = "oneparent_vic_stats";
    const cache = localStorage.getItem(cacheKey);
    let usedCache = false;
    if (cache) {
      try {
        const { stats: cachedStats, ts } = JSON.parse(cache);
        if (cachedStats && ts && Date.now() - ts < 30 * 60 * 1000) {
          setStats(cachedStats);
          setLoading(false);
          usedCache = true;
        }
  } catch { /* ignore cache parse errors */ }
    }
  if (!usedCache) { // Only fetch if not cached
      setLoading(true);
      fetchHeroStats({ state: "VIC" })
        .then((d) => {
          if (!alive || !d) return;
          const next = [
            { id: "a1", value: Math.round(d.total_k || 0), type: "k",  context: "families",           label: "raising children on their own in victoria" },
            { id: "a2", value: Math.round(d.pct_single_parents || 0), type: "pct", context: "of all families", label: "are single-parent households in victoria" },
            { id: "a3", value: Math.round(d.pct_growth_since_start || 0), type: "pct", context: "growth since 1994", label: "growth in one-parent families since 1994" }
          ];
          setStats(next);
          // Store in localStorage with timestamp
          localStorage.setItem(cacheKey, JSON.stringify({ stats: next, ts: Date.now() }));
        })
        .catch(() => {})
        .finally(() => alive && setLoading(false));
    }
  return () => { alive = false; }; // Cleanup
  }, []);

  return (
    <>
      <Helmet>
        <title>OneParent VIC — You are not alone</title>
        <meta name="description" content="Victorian single-parent community: scale, work and care reality, and support signals." />
      </Helmet>

      {loading ? (
        <div style={{
          minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 48, height: 48, border: '5px solid #eee', borderTop: '5px solid #3b82f6', borderRadius: '50%',
            animation: 'spin 1s linear infinite', marginBottom: 16
          }} />
          <span style={{ color: '#888', fontSize: 18 }}>Loading...</span>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`}</style>
        </div>
      ) : (
        <main className="home-page loaded">
          {/* show the hero section with stats */}
          <SplitHero
            theme="light"
            title="You are not alone, know your community."
            stats={stats}
            loading={loading}
          />

          {/* show insights strip between hero and how-it-works */}
          <InsightsStrip state="VIC" />

          {/* show how we help section */}
          <HowWeHelpSection />
        </main>
      )}
    </>
  );
}
