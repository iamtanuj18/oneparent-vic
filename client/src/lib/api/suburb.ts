// lib/api/suburbs.ts
// Read local GeoJSON + utilities + filter LOC_NAME using the “suburb list returned by DB”

export type GFeature = GeoJSON.Feature<GeoJSON.Geometry, Record<string, any>>;
export type GCollection = GeoJSON.FeatureCollection<
  GeoJSON.Geometry,
  Record<string, any>
>;

/* ========= Paths / Environment =========
 * By default, read from /public/data:
 *   - /data/VMLITE_LGA.json
 *   - /data/suburbs.geojson
 * Can be overridden via environment variables:
 *   - NEXT_PUBLIC_LGA_GEO_PATH
 *   - NEXT_PUBLIC_SUBURB_GEO_PATH
 *   - NEXT_PUBLIC_DATA_BASE (used as a prefix for both)
 */

function readEnv(...keys: string[]) {
  // Compatible with both Vite and Next
  // @ts-ignore
  const viteEnv = typeof import.meta !== "undefined" ? (import.meta as any).env : undefined;
  const nextEnv = typeof process !== "undefined" ? (process as any).env : undefined;
  for (const k of keys) {
    const v = viteEnv?.[k] ?? nextEnv?.[k];
    if (v) return String(v);
  }
  return undefined;
}

const DATA_BASE =
  readEnv("VITE_DATA_BASE", "NEXT_PUBLIC_DATA_BASE")?.replace(/\/$/, "") || "/data";

const LGA_GEO_PATH =
  readEnv("NEXT_PUBLIC_LGA_GEO_PATH") || `${DATA_BASE}/VMLITE_LGA.json`;

const SUBURB_GEO_PATH =
  readEnv("NEXT_PUBLIC_SUBURB_GEO_PATH") || `${DATA_BASE}/suburbs.geojson`;

/* ========= Read GeoJSON ========= */

export async function getLgaGeo(): Promise<GCollection> {
  const res = await fetch(LGA_GEO_PATH, { cache: "no-store" });
  if (!res.ok) throw new Error(`load LGA geo failed: ${res.status} ${res.statusText}`);
  const json = (await res.json()) as GCollection;

  // (Optional) If the data includes FTYPE_CODE, keep only LGA features; if absent, skip filtering
  json.features = json.features.filter((f) => {
    const code = String(f?.properties?.FTYPE_CODE ?? "").toLowerCase();
    return !code || code === "lga" || code.includes("local government");
  });

  // Keep VIC only (robust field compatibility)
  const getState = (props: Record<string, any>) => {
    const candidates = [
      props?.STATE,
      props?.STATE_NAME,
      props?.STATE_ABBR,
      props?.STE_NAME,
      props?.STATE_CODE,
      props?.STATE_NAME16,
      props?.STATE_NAME20,
    ];
    const v = candidates.find((x) => x != null);
    return String(v ?? "").toUpperCase();
  };
  json.features = json.features.filter((f) => {
    const s = getState(f.properties || {});
    // Support VIC / VICTORIA / state codes like 'VIC'
    return s === "VIC" || s.includes("VICTORIA");
  });

  return json;
}

export async function getSuburbsGeo(): Promise<GCollection> {
  const res = await fetch(SUBURB_GEO_PATH, { cache: "no-store" });
  if (!res.ok) throw new Error(`load suburbs geo failed: ${res.status} ${res.statusText}`);
  return res.json();
}

/* ========= Field / Name Utilities ========= */

/** Your suburbs.geojson uses LOC_NAME as the suburb name field; provide fallbacks here */
export function getSuburbName(props: Record<string, any>): string {
  return String(props?.LOC_NAME ?? props?.SUBURB_NAME ?? props?.name ?? "");
}

/** Name normalization: ignore case and strip symbols (spaces, hyphens, etc.) */
export function normName(s: any) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "")
    .trim();
}

/* ========= Filtering: by DB list (recommended path) ========= */

/**
 * Filter GeoJSON features using a backend-provided list of { suburb }.
 * - Compare with LOC_NAME after normalization to handle case/symbol differences.
 */
export function filterBySuburbRows(
  subGeo: GCollection,
  rows: { suburb: string }[]
): GFeature[] {
  const set = new Set(rows.map((r) => normName(r.suburb)));
  return subGeo.features.filter((f) =>
    set.has(normName(getSuburbName(f.properties)))
  );
}




