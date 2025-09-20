"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useLanguages, useTop3, type Top3Item } from "@/lib/api/community-match";

// Render the map only in the browser
const MapView = dynamic(
  () => import("@/components/community-match/community-match-page"),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: 520, display: "grid", placeItems: "center" }}>
        Loading map…
      </div>
    ),
  }
);

export default function CommunityMatchPage() {
  // Language & Top 3
  const { data: langs } = useLanguages();
  const [language, setLanguage] = useState<string>("");
  const { data: top3, isLoading: top3Loading } = useTop3(language || undefined);

  // Currently selected LGA (initially null — do not select anything by default)
  const [activeCouncil, setActiveCouncil] = useState<string | null>(null);

  // Clicking a suburb (the map component itself handles tooltip & school pins)
  const handlePickSuburb = useCallback((name: string) => {
    console.log("[page] pick suburb:", name);
  }, []);

  // After languages load, set only the default language; do not touch activeCouncil
  useEffect(() => {
    if (!language && langs && langs.length) setLanguage(langs[0]);
  }, [langs, language]);

  // Top 3 options
  const councilOptions = useMemo<Top3Item[]>(
    () => (top3 || []).map((t) => ({ ...t })),
    [top3]
  );

  const card: React.CSSProperties = {
    padding: 18,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
  };
  const sectionTitle: React.CSSProperties = {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: 0.2,
  };

  return (
    <>
      <header style={{ width: "100%", background: "#050505", color: "#fff", padding: "56px 16px", marginBottom: 18 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <h1 style={{ fontSize: 44, margin: 0, fontWeight: 800 }}>
            Find your <span style={{ background: "linear-gradient(90deg,#6aa6ff,#ff6ad6)", WebkitBackgroundClip: "text", color: "transparent" }}>Community</span>
          </h1>
          <p style={{ color: "#d1d5db", marginTop: 10, fontSize: 16, maxWidth: 920, marginLeft: "auto", marginRight: "auto" }}>
            Life can feel a little less hard with people who truly understand you. Find your language community in Greater Melbourne and connect with families who share your cultural journey.
          </p>
          <div style={{ marginTop: 18 }}>
            <button
              onClick={() => { const el = document.querySelector('section'); if (el) (el as HTMLElement).scrollIntoView({ behavior: 'smooth' }); }}
              style={{ background: "linear-gradient(90deg,#6aa6ff,#7b61ff)", color: "#fff", padding: "12px 18px", borderRadius: 8, border: "none", fontSize: 16, cursor: "pointer" }}
            >
              Start by choosing a language
            </button>
          </div>
        </div>
      </header>

      <main style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 34, margin: "6px 0 16px" }}>
        Find My Local Community
      </h1>

      {/* Language */}
      <section style={{ ...card, marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Select by Language</div>
        <select
          value={language}
          onChange={(e) => {
            const nextLang = e.target.value;
            setLanguage(nextLang);
            // When switching language, clear the selected LGA; do not auto-select anything
            setActiveCouncil(null);
            console.log("[page] change language:", nextLang);
          }}
          style={{
            width: "100%",
            maxWidth: 680,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            background: "#fff",
            fontSize: 16,
          }}
        >
          {(langs || []).map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </section>

      {/* Top Councils (no top-right selector) */}
      <section style={{ ...card, marginBottom: 16 }}>
        <div style={{ marginBottom: 10 }}>
          <h2 style={sectionTitle}>Find Largest Communities</h2>
        </div>

        <div>
          {top3Loading ? (
            <p>Loading…</p>
          ) : (top3 || []).length === 0 ? (
            <p>No results.</p>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: 0,
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <thead>
                <tr style={{ background: "#fafafa", textAlign: "left" }}>
                  <th style={{ padding: "12px 14px", width: 70 }}>#</th>
                  <th style={{ padding: "12px 14px" }}>council</th>
                  <th style={{ padding: "12px 14px", textAlign: "right" }}>
                    Population
                  </th>
                </tr>
              </thead>
              <tbody>
                {(top3 || []).map((t) => {
                  const active =
                    activeCouncil &&
                    activeCouncil.toLowerCase() === t.council.toLowerCase();
                  return (
                    <tr
                      key={t.council}
                      onClick={() => {
                        setActiveCouncil(t.council);
                        console.log("[page] click row LGA:", t.council);
                      }}
                      style={{
                        cursor: "pointer",
                        background: active
                          ? "rgba(255,106,0,0.06)"
                          : "transparent",
                        borderTop: "1px solid #f1f5f9",
                      }}
                    >
                      <td style={{ padding: "12px 14px" }}>{t.rank}</td>
                      <td style={{ padding: "12px 14px" }}>{t.council}</td>
                      <td style={{ padding: "12px 14px", textAlign: "right" }}>
                        {t.population.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Map • Top 3 Councils */}
      <section style={{ ...card, marginBottom: 24 }}>
        <h2 style={{ ...sectionTitle, fontSize: 26, marginBottom: 10 }}>
          Map • Top 3 Councils
        </h2>

        <MapView
          top3={top3 || []}
          activeCouncil={activeCouncil}
          onPickCouncil={(c) => {
            console.log("[page] pick LGA from map:", c);
            setActiveCouncil(c);
          }}
          onPickSuburb={handlePickSuburb}
        />
      </section>
    </main>
    </>
  );
}

