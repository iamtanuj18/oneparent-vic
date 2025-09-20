"use client";

import { MapContainer, TileLayer, Pane, Tooltip as LeafletTooltip, GeoJSON, useMap, Marker } from "react-leaflet";
import L, { GeoJSON as LGeoJSON, LeafletEvent, LeafletMouseEvent } from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";

import type { Top3Item, SuburbSummary, SchoolRow } from "@/lib/api/community-match";
import {
  getSuburbSummary,
  useCouncilSuburbRows,
  getSuburbSchools,
  // ==== Added: used for choropleth basemap ====
  useSchoolCounts,
  useHousingMedians,
} from "@/lib/api/community-match";

import type { GCollection, GFeature } from "@/lib/api/suburb";
import { getLgaGeo, getSuburbsGeo, filterBySuburbRows, getSuburbName } from "@/lib/api/suburb";

/* ========= Utilities & constants ========= */

const LGA_KEYS = ["LGA_NAME", "lga_name", "Council", "council", "NAME", "name"];

function getProp(o: any, keys: string[]) {
  for (const k of keys) if (o && o[k] != null) return o[k];
  return "";
}
function normName(s: any) {
  return String(s || "")
    .toLowerCase()
    .replace(/city of |shire of | city| shire| council/g, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "")
    .trim();
}
function rankIcon(n: number) {
  return L.divIcon({
    className: "rank-marker",
    html: `<div style="width:26px;height:26px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;font-weight:700;
      background:#ff6a00;color:#fff;box-shadow:0 0 0 2px #fff">${n}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

/** School icon (DivIcon) */
const SCHOOL_ICON = L.divIcon({
  className: "",
  html: `<div style="
      width:18px;height:24px;
      background:#e74c3c; color:#fff; font-weight:700;
      display:flex;align-items:center;justify-content:center;
      border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;
      box-shadow:0 1px 3px rgba(0,0,0,0.3); font-size:12px;
      position:relative;">📍</div>`,
  iconSize: [18, 24],
  iconAnchor: [9, 24],
});

/* ==== continuous color scale & legend control (self-contained; no parent changes) ==== */
// More contrasting lightness scale: lightness ranges from ~90% (low) down to ~30% (high)
const makeScale = (min: number, max: number, hue = 210) => {
  const span = Math.max(1e-6, max - min);
  return (v: number) => {
    const t = Math.min(1, Math.max(0, (v - min) / span));
    // map t in [0,1] to lightness in [90,30] (larger values -> darker)
    const light = Math.round(90 - t * 60);
    return `hsl(${hue},92%,${light}%)`;
  };
};
function Legend({ title, min, max, hue = 210 }: { title: string; min: string; max: string; hue?: number }) {
  const map = useMap();
  useEffect(() => {
    const ctrl = new L.Control({ position: "bottomright" });
    ctrl.onAdd = () => {
      const el = L.DomUtil.create("div", "legend");
      el.style.cssText =
        "background:#fff;padding:8px 10px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.1);font:12px/1.2 Inter,system-ui";
      const grad = `linear-gradient(90deg,hsl(${hue},90%,78%) 0%,hsl(${hue},90%,40%) 100%)`;
      el.innerHTML = `<div style="font-weight:600;margin-bottom:6px">${title}</div>
        <div style="display:flex;align-items:center;gap:8px">
          <span>${min}</span><div style="height:10px;width:140px;border-radius:6px;background:${grad}"></div><span>${max}</span>
        </div>`;
      return el;
    };
    ctrl.addTo(map);
    return () => {
      map.removeControl(ctrl);
    };
  }, [map, title, min, max, hue]);
  return null;
}

/* ========= Subcomponents ========= */

function AutoFit({ features }: { features: GFeature[] }) {
  const map = useMap();
  useEffect(() => {
    if (!features?.length) return;
    const b = new L.LatLngBounds([]);
    features.forEach((f) => {
      try {
        b.extend(L.geoJSON(f).getBounds());
      } catch {}
    });
    if (b.isValid()) map.fitBounds(b, { padding: [16, 16] });
  }, [map, features]);
  return null;
}

function RankMarkers({ features, top3 }: { features: GFeature[]; top3: Top3Item[] }) {
  const map = useMap();
  useEffect(() => {
    const markers: L.Marker[] = [];
    features.forEach((f) => {
      const lgaName = getProp(f.properties, LGA_KEYS);
      const rank = top3.find((t) => normName(t.council) === normName(lgaName))?.rank;
      if (!rank) return;
      let center: L.LatLng;
      try {
        center = (L.geoJSON(f) as LGeoJSON).getBounds().getCenter();
      } catch {
        return;
      }
      const m = L.marker(center, {
        icon: rankIcon(rank),
        interactive: false,
        pane: "markerPane",
        zIndexOffset: 1000,
      }).addTo(map);
      markers.push(m);
    });
    return () => markers.forEach((m) => m.remove());
  }, [map, features, top3]);
  return null;
}

/* ========= 主组件 ========= */

export default function MapView({
  top3,
  activeCouncil,
  onPickCouncil,
  onPickSuburb,
  // Optional: allow parent to control initial metric, showLegend/showMetricToggle and map height
  initialMetric = "schools",
  showLegend = true,
  showMetricToggle = true,
  height = 520,
}: {
  top3: Top3Item[];
  activeCouncil: string | null;
  onPickCouncil: (c: string) => void;
  onPickSuburb: (s: string) => void;
  initialMetric?: "schools" | "housing";
  showLegend?: boolean;
  showMetricToggle?: boolean;
  height?: number;
}) {
  const [lgaGeo, setLgaGeo] = useState<GCollection | null>(null);
  const [subGeo, setSubGeo] = useState<GCollection | null>(null);

  const summaryCacheRef = useRef<Map<string, SuburbSummary>>(new Map());
  const [schoolPins, setSchoolPins] = useState<SchoolRow[] | null>(null);

  // ==== Added: currently selected suburb after click (used to desaturate other areas) ====
  const [selectedSuburb, setSelectedSuburb] = useState<string | null>(null);
  // ==== Added: metric toggle (internal small control; does not affect parent) ====
  const [metric, setMetric] = useState<"schools" | "housing">(initialMetric);

  useEffect(() => {
    getLgaGeo().then(setLgaGeo);
    getSuburbsGeo().then(setSubGeo);
  }, []);

  // Clear previous pins and selected suburb when language or LGA changes
  useEffect(() => {
    setSchoolPins(null);
    setSelectedSuburb(null);
  }, [activeCouncil, top3]);

  // Top3 的 LGA features
  const top3Features = useMemo(() => {
    if (!lgaGeo || !top3?.length) return [];
    const want = new Set(top3.map((t) => normName(t.council)));
    return lgaGeo.features.filter((f) => want.has(normName(getProp(f.properties, LGA_KEYS))));
  }, [lgaGeo, top3]);

  const top3Key = useMemo(
    () => "top3-" + (top3?.length ? top3.map((t) => normName(t.council)).sort().join("|") : "none"),
    [top3]
  );

  // Selected LGA -> fetch its suburbs from DB
  const { data: councilSuburbs } = useCouncilSuburbRows(activeCouncil || undefined);

  // Suburbs for the current LGA
  const suburbsInCouncil = useMemo(() => {
    if (!subGeo || !activeCouncil) return [];
    if (councilSuburbs && councilSuburbs.length) {
      return filterBySuburbRows(subGeo, councilSuburbs);
    }
    return [];
  }, [subGeo, councilSuburbs, activeCouncil]);

  const fitTargets = suburbsInCouncil.length ? suburbsInCouncil : top3Features;

  // ==== Added: school counts & housing medians aggregations (data for choropleth basemap) ====
  const { data: schoolCounts = [] } = useSchoolCounts(activeCouncil || undefined);
  const countMap = useMemo(() => new Map(schoolCounts.map((c) => [String(c.suburb).toLowerCase(), c.n])), [schoolCounts]);
  const maxCount = useMemo(() => Math.max(1, ...schoolCounts.map((c) => c.n)), [schoolCounts]);
  const countColor = useMemo(() => makeScale(0, maxCount, 210), [maxCount]);

  // housing：给出一个合理默认（buy/House/3bed），不动父组件
  const { data: medians = [] } = useHousingMedians(
    activeCouncil ? { lga: activeCouncil, tenure: "buy", dwelling: "House", beds: 3 } : null
  );
  const medMap = useMemo(() => new Map(medians.map((m) => [String(m.suburb).toLowerCase(), m.median])), [medians]);
  const medMin = useMemo(() => (medians.length ? Math.min(...medians.map((m) => m.median)) : 0), [medians]);
  const medMax = useMemo(() => (medians.length ? Math.max(...medians.map((m) => m.median)) : 1), [medians]);
  const medColor = useMemo(() => makeScale(medMin, medMax, 160), [medMin, medMax]);

  /** On suburb click: show housing median + school points (preserve original logic and record selectedSuburb) */
  async function handleSuburbClick(name: string, layer: any) {
  setSelectedSuburb(name); // Added: desaturate other areas after a click

    // 1) 房价 tooltip（原逻辑）
    const key = name.toLowerCase();
    let sum = summaryCacheRef.current.get(key);
    if (!sum) {
      try {
        sum = await getSuburbSummary(name);
        if (sum) summaryCacheRef.current.set(key, sum);
      } catch (e) {
        console.error("getSuburbSummary failed:", e);
      }
    }
    const price =
      sum && !sum.notFound && sum.medianHousing != null ? `$${Number(sum.medianHousing).toLocaleString()}` : "N/A";
    const html = `<div><strong>${name}</strong><br/>Median price: ${price}</div>`;
    const tip = layer.getTooltip?.();
    if (tip) tip.setContent(html);
    else layer.bindTooltip(html, { sticky: true });
    layer.openTooltip();

  // 2) school points (original logic + coordinate fix)
    try {
      const rows = await getSuburbSchools(name);
      const fixedRows = (rows || [])
        .filter((s) => typeof s.lat === "number" && typeof s.lon === "number")
        .map((s) => ({ ...s, lat: s.lon, lon: s.lat })); // 原注释：库中 lat/lon 反了
      setSchoolPins(fixedRows);
    } catch (e) {
      console.error("getSuburbSchools failed:", e);
      setSchoolPins([]);
    }
  }

  // ==== Top3 continuous coloring (based on population range) ====
  const popMinMax = useMemo(() => {
    if (!top3?.length) return { min: 0, max: 1 };
    const vals = top3.map((t) => t.population);
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }, [top3]);
  const popColor = useMemo(() => makeScale(popMinMax.min, popMinMax.max, 24), [popMinMax]);

  // Value / color / tooltip for the current metric
  const valueOf = (nm: string) =>
    metric === "schools" ? (countMap.get(nm.toLowerCase()) ?? 0) : (medMap.get(nm.toLowerCase()) ?? 0);
  const colorOf = (v: number) => (metric === "schools" ? countColor(v) : medColor(v));
  const tipOf = (nm: string) =>
    metric === "schools"
      ? `${nm} · ${(countMap.get(nm.toLowerCase()) ?? 0)} schools`
      : `${nm} · $${(medMap.get(nm.toLowerCase()) ?? 0).toLocaleString()} median`;

  /* ==== Added: top-left info card (Leaflet control) ==== */
  function InfoControl({ title, subtitle }: { title: string; subtitle?: string }) {
    const map = useMap();
    useEffect(() => {
      const ctrl = new L.Control({ position: "topleft" });
      ctrl.onAdd = () => {
        const el = L.DomUtil.create("div", "info-card");
        el.style.cssText =
          "background:#fff;padding:10px;border-radius:10px;box-shadow:0 4px 14px rgba(0,0,0,0.12);font:14px/1.2 Inter,system-ui;min-width:160px";
        el.innerHTML = `<div style='font-weight:700;margin-bottom:6px'>${title}</div>${subtitle ? `<div style='color:#666;font-size:13px'>${subtitle}</div>` : ""}`;
        return el;
      };
      ctrl.addTo(map);
      // cleanup should not return map (avoid returning value)
      return () => { map.removeControl(ctrl); };
    }, [map, title, subtitle]);
    return null;
  }

  return (
    <MapContainer center={[-37.81, 144.96]} zoom={11} style={{ height, width: "100%", borderRadius: 12 }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />

      <AutoFit features={fitTargets} />

      {/* Legend / info / toggle intentionally removed to keep map clean of labels */}

      {/* LGA 层：选中后禁用 pointer；同时用 population 连续填色（加法） */}
      <Pane name="lga" style={{ zIndex: 300, pointerEvents: activeCouncil ? "none" : "auto" }}>
        {top3Features.length > 0 && (
          <>
            <GeoJSON
              pane="lga"
              key={top3Key}
              data={{ type: "FeatureCollection", features: top3Features } as any}
              style={(f: any) => {
                const lgaName = String(getProp(f.properties, LGA_KEYS));
                const pop = top3.find((t) => normName(t.council) === normName(lgaName))?.population ?? popMinMax.min;
                return { color: "#ff6a00", weight: 2.5, fillOpacity: 0.28, fillColor: popColor(pop) };
              }}
              interactive={!activeCouncil}
              onEachFeature={(f, layer) => {
                const lgaName = String(getProp(f.properties, LGA_KEYS));
                layer.on("click", () => onPickCouncil(lgaName));
                const pop = top3.find((t) => normName(t.council) === normName(lgaName))?.population ?? 0;
                layer.bindTooltip(`${lgaName} — ${pop.toLocaleString()} speakers`, { sticky: true });
              }}
            />
            {/* numeric rank markers removed: LGAs are colored continuously by population */}
          </>
        )}
      </Pane>

      {/* Suburbs（按 metric 渐变着色；选中后其它区降饱和） */}
      <Pane name="suburbs" style={{ zIndex: 400 }}>
        {suburbsInCouncil.length > 0 && (
          <GeoJSON
            pane="suburbs"
            key={`subs-${normName(activeCouncil || "")}-${metric}`}
            data={{ type: "FeatureCollection", features: suburbsInCouncil } as any}
            style={(f: any) => {
              const nm = getSuburbName(f.properties);
              const v = valueOf(nm);
              return {
                color: "#3388ff",
                weight: 1.5,
                fillOpacity: selectedSuburb ? 0.12 : 0.6,
                fillColor: selectedSuburb ? "#ffffff00" : colorOf(v),
              };
            }}
            onEachFeature={(f, layer) => {
              const name = getSuburbName(f.properties);
              // Do NOT show hover tooltips when suburbs are shown after an LGA click.
              // Only bind click handlers which will fetch and display median price + schools.
              layer.on("click", () => onPickSuburb(name));
              layer.on("click", () => handleSuburbClick(name, layer));
            }}
          />
        )}
      </Pane>

      {/* Schools（最高 pane，保留原逻辑） */}
      <Pane name="schools" style={{ zIndex: 650, pointerEvents: schoolPins && schoolPins.length ? "auto" : "none" }}>
        {schoolPins &&
          schoolPins.length > 0 &&
          schoolPins.map((s) => (
            <Marker
              pane="schools"
              key={`${s.school_name}-${s.lat}-${s.lon}`}
              position={[s.lat as number, s.lon as number]}
              icon={SCHOOL_ICON}
              eventHandlers={{
                click: (e: LeafletMouseEvent) => {
                  (e.target as L.Marker).openTooltip();
                },
                add: (e: LeafletEvent) => (e.target as any).bringToFront?.(),
              }}
            >
              <LeafletTooltip sticky>
                <div style={{ minWidth: 220 }}>
                  <strong>{s.school_name}</strong>
                  <br />
                  {[s.school_type, s.education_sector].filter(Boolean).join(" · ") || "School"}
                  {(s.address_line_1 || s.address_line_2 || s.address_town || s.address_postcode) && (
                    <div style={{ marginTop: 6, fontSize: "13px", color: "#666" }}>
                      📍
                      {[
                        s.address_line_1,
                        s.address_line_2,
                        s.address_town,
                        s.address_postcode ? `${s.address_postcode}` : null,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  )}
                </div>
              </LeafletTooltip>
            </Marker>
          ))}
      </Pane>
    </MapContainer>
  );
}

/* ==== Added: minimal Metric Toggle control (Leaflet control, does not impact parent) ==== */
function MetricToggle({ metric, onChange }: { metric: "schools" | "housing"; onChange: (m: "schools" | "housing") => void }) {
  const map = useMap();
  useEffect(() => {
    const ctrl = new L.Control({ position: "topright" });
    ctrl.onAdd = () => {
      const el = L.DomUtil.create("div", "metric-toggle");
      el.style.cssText =
        "background:#fff;padding:6px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.12);display:flex;gap:6px;font:12px Inter,system-ui";
      const btn = (txt: string, active: boolean) =>
        `<button data-k="${txt}" style="padding:6px 8px;border-radius:6px;border:1px solid ${active ? '#111' : '#e5e7eb'};background:${active ? '#111' : '#fff'};color:${active ? '#fff' : '#111'};cursor:pointer">${txt}</button>`;
      el.innerHTML = btn("schools", metric === "schools") + btn("housing", metric === "housing");
      el.onclick = (e: any) => {
        const k = e?.target?.getAttribute?.("data-k");
        if (k === "schools" || k === "housing") onChange(k);
      };
      return el;
    };
    ctrl.addTo(map);
    return () => {
      map.removeControl(ctrl);
    };
  }, [map, metric, onChange]);
  return null;
}
