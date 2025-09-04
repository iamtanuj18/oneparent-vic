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
    { id: "a1", value: 0,  type: "k",  context: "families",           label: "raising children on their own in Victoria" },
    { id: "a2", value: 0,  type: "pct", context: "of all families",    label: "are single-parent households in Victoria" },
    { id: "a3", value: 0,  type: "pct", context: "long-term change",   label: "growth in one-parent families since the earliest records" },
    { id: "a4", value: 0,  type: "pct", context: "working while caring", label: "of one-parent families have an employed parent" }
  ]);
  const [loading, setLoading] = useState(true);

  // fetch hero stats for victoria
  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchHeroStats({ state: "VIC" })
      .then((d) => {
        if (!alive || !d) return;
        const next = [
          { id: "a1", value: Math.round(d.total_k || 0), type: "k",  context: "families",           label: "raising children on their own in victoria" },
          { id: "a2", value: Math.round(d.pct_single_parents || 0), type: "pct", context: "of all families", label: "are single-parent households in victoria" },
          { id: "a3", value: Math.round(d.pct_growth_since_start || 0), type: "pct", context: "long-term change", label: "growth in one-parent families since the earliest records" },
          { id: "a4", value: Math.round(d.pct_working_parent || 0), type: "pct", context: "working while caring", label: "of one-parent families have an employed parent" }
        ];
        setStats(next);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  return (
    <>
      <Helmet>
        <title>OneParent VIC — You are not alone</title>
        <meta name="description" content="Victorian single-parent community: scale, work and care reality, and support signals." />
      </Helmet>

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
    </>
  );
}
