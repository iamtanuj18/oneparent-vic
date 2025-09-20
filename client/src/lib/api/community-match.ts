import useSWR from "swr";

/** Unified API base path — keep consistent with your backend at /api/community-match */
export const API_BASE = "/api/community-match";

/** Generic JSON fetcher */
async function getJSON<T = any>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} - ${text}`);
  }
  return res.json() as Promise<T>;
}

/* ========= Types ========= */
export type Top3Item = {
  council: string;
  population: number;
  rank: number;
};

export type SuburbSummary = {
  medianHousing: number | null;
  notFound?: boolean;
};

export type CouncilSuburbRow = { suburb: string; postcode?: string };

/** School row (used by SuburbInfoPanel) */
export type SchoolRow = {
  school_no: number;
  education_sector?: string | null;
  school_name: string;
  school_type?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  address_town?: string | null;
  address_postcode?: number | null;
  phone?: string | null;
  lat?: number | null;
  lon?: number | null;
};

/* ========= Hooks & API ========= */

/** Language list */
export function useLanguages() {
  return useSWR<string[]>(`${API_BASE}/languages`, getJSON, {
    revalidateOnFocus: false,
  });
}

/** Top 3 LGAs for a given language */
export function useTop3(language?: string) {
  const key = language
    ? `${API_BASE}/top3?language=${encodeURIComponent(language)}`
    : null;
  return useSWR<Top3Item[]>(key, getJSON, { revalidateOnFocus: false });
}

/** Fetch suburb housing summary (for lazy-loading map tooltip) */
export async function getSuburbSummary(name: string): Promise<SuburbSummary> {
  const url = `${API_BASE}/suburb/${encodeURIComponent(name)}/summary`;
  return getJSON<SuburbSummary>(url);
}

/** ⭐ New: SWR version of suburb summary (for SuburbInfoPanel) */
export function useSuburbSummary(name?: string | null) {
  const key = name
    ? `${API_BASE}/suburb/${encodeURIComponent(name)}/summary`
    : null;
  return useSWR<SuburbSummary>(key, getJSON, { revalidateOnFocus: false });
}

/** Get the list of suburbs for an LGA (from DB table council_suburbs) */
export async function getCouncilSuburbRows(
  council: string
): Promise<CouncilSuburbRow[]> {
  const url = `${API_BASE}/lga/${encodeURIComponent(council)}/suburbs`;
  return getJSON<CouncilSuburbRow[]>(url);
}

/** SWR version (optional) */
export function useCouncilSuburbRows(council?: string) {
  const key = council
    ? `${API_BASE}/lga/${encodeURIComponent(council)}/suburbs`
    : null;
  return useSWR<CouncilSuburbRow[]>(key, getJSON, { revalidateOnFocus: false });
}

/**  New: direct API call to get a suburb’s schools */
export async function getSuburbSchools(name: string): Promise<SchoolRow[]> {
  const url = `${API_BASE}/suburb/${encodeURIComponent(name)}/schools`;
  return getJSON<SchoolRow[]>(url);
}

/**  New: SWR version of the school list
 *  The second parameter `enabled` toggles the request (e.g., don’t fetch when showSchools=false)
 */
export function useSuburbSchools(name?: string | null, enabled = false) {
  const key =
    enabled && name
      ? `${API_BASE}/suburb/${encodeURIComponent(name)}/schools`
      : null;
  return useSWR<SchoolRow[]>(key, getJSON, { revalidateOnFocus: false });
}



