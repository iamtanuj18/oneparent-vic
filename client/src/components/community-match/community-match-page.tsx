"use client";

import {
  MapContainer, TileLayer, Pane,
  Tooltip as LeafletTooltip, GeoJSON, useMap, Marker
} from "react-leaflet";
import L, { GeoJSON as LGeoJSON, LeafletEvent, LeafletMouseEvent } from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";

import type { Top3Item, SuburbSummary, SchoolRow } from "@/lib/api/community-match";
import { getSuburbSummary, useCouncilSuburbRows, getSuburbSchools } from "@/lib/api/community-match";

import type { GCollection, GFeature } from "@/lib/api/suburb";
import { getLgaGeo, getSuburbsGeo, filterBySuburbRows, getSuburbName } from "@/lib/api/suburb";

/* ========= Utils & Constants ========= */

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

/** School marker icon (📍 style; adjust size/color as needed) */
const SCHOOL_ICON = L.divIcon({
  className: "",
  html: `<div style="
      width:18px;height:24px;
      background:#e74c3c;color:#fff;font-weight:700;
      display:flex;align-items:center;justify-content:center;
      border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;
      box-shadow:0 1px 3px rgba(0,0,0,0.3); font-size:12px;">📍</div>`,
  iconSize: [18, 24],
  iconAnchor: [9, 24],
});

/* ========= Subcomponents ========= */

function AutoFit({ features }: { features: GFeature[] }) {
  const map = useMap();
  useEffect(() => {
    if (!features?.length) return; // ⭐ Do not auto-zoom if there’s no target (prevents jumping on first load)
    const b = new L.LatLngBounds([]);
    features.forEach((f) => { try { b.extend(L.geoJSON(f).getBounds()); } catch {} });
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
      try { center = (L.geoJSON(f) as LGeoJSON).getBounds().getCenter(); } catch { return; }
      markers.push(L.marker(center, {
        icon: rankIcon(rank),
        interactive: false,
        pane: "markerPane",
        zIndexOffset: 1000,
      }).addTo(map));
    });
    return () => markers.forEach((m) => m.remove());
  }, [map, features, top3]);
  return null;
}

/* ========= Main component ========= */

export default function MapView({
  top3,
  activeCouncil,
  onPickCouncil,
  onPickSuburb,
}: {
  top3: Top3Item[];
  activeCouncil: string | null;
  onPickCouncil: (c: string) => void;
  onPickSuburb: (s: string) => void;
}) {
  const [lgaGeo, setLgaGeo] = useState<GCollection | null>(null);
  const [subGeo, setSubGeo] = useState<GCollection | null>(null);

  const summaryCacheRef = useRef<Map<string, SuburbSummary>>(new Map());
  const [schoolPins, setSchoolPins] = useState<SchoolRow[] | null>(null);

  useEffect(() => {
    getLgaGeo().then(setLgaGeo);
    getSuburbsGeo().then(setSubGeo);
  }, []);

  //  When switching LGA or language (i.e., top3 changes), clear school pins to avoid leftovers
  useEffect(() => {
    setSchoolPins(null);
  }, [activeCouncil, top3]);

  // Geo features for Top 3 LGAs (for outlines/rank badges)
  const top3Features = useMemo(() => {
    if (!lgaGeo || !top3?.length) return [];
    const want = new Set(top3.map((t) => normName(t.council)));
    return lgaGeo.features.filter((f) =>
      want.has(normName(getProp(f.properties, LGA_KEYS)))
    );
  }, [lgaGeo, top3]);

  // Selected LGA -> suburb list from DB
  const { data: councilSuburbs } = useCouncilSuburbRows(activeCouncil || undefined);

  // Suburb polygons for current LGA
  const suburbsInCouncil = useMemo(() => {
    if (!subGeo || !activeCouncil) return [];
    if (councilSuburbs && councilSuburbs.length) {
      return filterBySuburbRows(subGeo, councilSuburbs);
    }
    return [];
  }, [subGeo, councilSuburbs, activeCouncil]);

  //  Only zoom when activeCouncil is set; otherwise keep default viewport
  const fitTargets = useMemo(() => {
    if (!activeCouncil) return [];
    return suburbsInCouncil.length ? suburbsInCouncil : top3Features;
  }, [activeCouncil, suburbsInCouncil, top3Features]);

  /** On suburb click: show housing price + school pins (keep original info visible) */
  async function handleSuburbClick(name: string, layer: any) {
    // 1) Housing tooltip
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
      sum && !sum.notFound && sum.medianHousing != null
        ? `$${Number(sum.medianHousing).toLocaleString()}`
        : "N/A";
    const html = `<div><strong>${name}</strong><br/>Median price: ${price}</div>`;
    const tip = layer.getTooltip?.();
    if (tip) tip.setContent(html);
    else layer.bindTooltip(html, { sticky: true });
    layer.openTooltip();

    // 2) School pins (if your source data already has correct lat/lon, remove the two swap lines)
    try {
      const rows = await getSuburbSchools(name);
      const fixedRows = (rows || [])
        .filter((s) => typeof s.lat === "number" && typeof s.lon === "number")
        .map((s) => ({
          ...s,
          lat: s.lon, // If your source data has correct lat/lon, delete these two lines
          lon: s.lat, // ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
        }));
      setSchoolPins(fixedRows);
    } catch (e) {
      console.error("getSuburbSchools failed:", e);
      setSchoolPins([]);
    }
  }

  return (
    <MapContainer
      center={[-37.81, 144.96]}
      zoom={11}
      style={{ height: "clamp(420px, 60vh, 520px)", width: "100%", borderRadius: 12 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap"
      />

      {/* Only auto-fit after an LGA is selected */}
      <AutoFit features={fitTargets} />

      {/* LGA layer (lower pane so it doesn’t block suburb clicks) */}
      <Pane name="lga" style={{ zIndex: 300, pointerEvents: activeCouncil ? "none" : "auto" }}>
        {top3Features.length > 0 && (
          <>
            <GeoJSON
              pane="lga"
              data={{ type: "FeatureCollection", features: top3Features } as any}
              style={() => ({ color: "#ff6a00", weight: 2.5, fillOpacity: 0.18 })}
              interactive={!activeCouncil}
              onEachFeature={(f, layer) => {
                const lgaName = String(getProp(f.properties, LGA_KEYS));
                layer.on("click", () => onPickCouncil(lgaName));
                layer.bindTooltip(lgaName, { sticky: true });
              }}
            />
            <RankMarkers features={top3Features} top3={top3} />
          </>
        )}
      </Pane>

      {/* Suburbs layer (higher pane to ensure it’s clickable) */}
      <Pane name="suburbs" style={{ zIndex: 400 }}>
        {suburbsInCouncil.length > 0 && (
          <GeoJSON
            pane="suburbs"
            key={`subs-${normName(activeCouncil || "")}`}
            data={{ type: "FeatureCollection", features: suburbsInCouncil } as any}
            style={() => ({ color: "#3388ff", weight: 1.5, fillOpacity: 0.15 })}
            onEachFeature={(f, layer) => {
              const name = getSuburbName(f.properties);
              layer.bindTooltip(name, { sticky: true });
              layer.on("click", () => onPickSuburb(name));
              layer.on("click", () => handleSuburbClick(name, layer));
            }}
          />
        )}
      </Pane>

      {/* Schools layer (highest pane, keep all info visible) */}
      <Pane
        name="schools"
        style={{ zIndex: 650, pointerEvents: schoolPins && schoolPins.length ? "auto" : "none" }}
      >
        {schoolPins && schoolPins.length > 0 &&
          schoolPins.map((s) => (
            <Marker
              pane="schools"
              key={`${s.school_no ?? s.school_name}-${s.lat}-${s.lon}`}
              position={[s.lat as number, s.lon as number]}
              icon={SCHOOL_ICON}
              eventHandlers={{
                click: (e: LeafletMouseEvent) => { (e.target as L.Marker).openTooltip(); },
                add: (e: LeafletEvent) => (e.target as any).bringToFront?.(),
              }}
            >
              <LeafletTooltip sticky>
                <div style={{ minWidth: 220 }}>
                  <strong>{s.school_name}</strong><br />
                  {[s.school_type, s.education_sector].filter(Boolean).join(" · ") || "School"}
                  {s.address_postcode ? ` · ${s.address_postcode}` : ""}

                  {(s.address_line_1 || s.address_line_2 || s.address_town) && (
                    <div style={{ marginTop: 4 }}>
                      {s.address_line_1 ? `${s.address_line_1}` : ""}
                      {s.address_line_2 ? `, ${s.address_line_2}` : ""}
                      {s.address_town ? `, ${s.address_town}` : ""}
                      {s.address_postcode ? ` ${s.address_postcode}` : ""}
                    </div>
                  )}

                  {s.phone ? <div> {s.phone}</div> : null}
                </div>
              </LeafletTooltip>
            </Marker>
          ))}
      </Pane>
    </MapContainer>
  );
}
