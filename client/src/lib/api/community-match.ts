import useSWR from "swr";

/** ===== API base (兼容新旧后端前缀) =====
 *  优先 /api/community-match；若该路径请求失败，会自动回退到 /api/community
 */
const PRIMARY_BASE = "/api/community-match";
const LEGACY_BASE = "/api/community";

/** 把相对路径拼成两个候选 URL */
function makeCandidates(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  // 返回优先候选（primary），随后是 legacy，fetchJSON 会按顺序尝试
  return [`${PRIMARY_BASE}${p}`, `${LEGACY_BASE}${p}`];
}

/** 通用 JSON fetcher（带新旧前缀回退） */
async function fetchJSON<T = any>(pathOrUrl: string): Promise<T> {
  // 支持传完整 URL 或相对 path
  const candidates = pathOrUrl.startsWith("/api/")
    ? // 如果传入的是完整的 /api/... 路径，构造一个两个候选（互换 primary/legacy）
      [pathOrUrl, pathOrUrl.startsWith(PRIMARY_BASE) ? pathOrUrl.replace(PRIMARY_BASE, LEGACY_BASE) : pathOrUrl.replace(LEGACY_BASE, PRIMARY_BASE)]
    : makeCandidates(pathOrUrl);

  let lastErr: any = null;
  for (const url of candidates) {
    try {
      const res = await fetch(url, { credentials: "same-origin" });
      if (res.ok) return res.json() as Promise<T>;
      lastErr = new Error(`${res.status} ${res.statusText} - ${await res.text().catch(() => "")}`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("Network error");
}

/* ================== Types ================== */
export type Top3Item = { rank: number; council: string; population: number };

export type SuburbSummary = {
  suburb: string;
  notFound?: boolean;
  medianHousing?: number | null;
  // 可选：保留后端其他字段以防 UI 需要
  rent_allprop?: number | null;
  buy_flat?: number | null;
  buy_house?: number | null;
};

export type SchoolRow = {
  school_no?: string | number;
  school_name: string;
  school_type?: string;           // Primary / Secondary / Pri/Sec / Language / Special
  education_sector?: string;      // Government / Independent / Catholic
  lat: number;
  lon: number;
  address_line_1?: string;
  address_line_2?: string;
  address_town?: string;
  address_postcode?: string;
  phone?: string;
};

export type SchoolType  = "Government" | "Independent" | "Catholic";
export type SchoolLevel = "Primary" | "Secondary" | "Pri/Sec" | "Language" | "Special";

/* ================== Helpers ================== */
const fetcher = (url: string) => fetchJSON(url);

function qs(params: Record<string, any>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) sp.set(k, v.join(","));
    else sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/* ================== APIs ================== */

/** Language list */
export function useLanguages() {
  // /languages
  return useSWR<string[]>(makeCandidates("/languages")[0], fetcher, {
    revalidateOnFocus: false,
  });
}

/** Top 3 councils by language */
export function useTop3(language?: string) {
  const key = language ? `/top3${qs({ language })}` : null;
  return useSWR<Top3Item[]>(key ? makeCandidates(key)[0] : null, fetcher, {
    revalidateOnFocus: false,
  });
}

/** Suburb list for a specified Council (used for map filtering) */
export function useCouncilSuburbRows(lga?: string) {
  const path = lga ? `/council/${encodeURIComponent(lga)}/suburbs` : null;
  return useSWR<{ suburb: string; postcode?: string }[]>(
    path ? makeCandidates(path)[0] : null,
    fetcher,
    { revalidateOnFocus: false }
  );
}

/** Get suburb summary (for map tooltip / sidebar) */
export async function getSuburbSummary(name: string): Promise<SuburbSummary> {
  return fetchJSON<SuburbSummary>(`/suburb/${encodeURIComponent(name)}/summary`);
}

/** SWR 版本（侧栏用） */
export function useSuburbSummary(name?: string | null) {
  const key = name ? `/suburb/${encodeURIComponent(name)}/summary` : null;
  return useSWR<SuburbSummary>(key ? makeCandidates(key)[0] : null, fetcher, {
    revalidateOnFocus: false,
  });
}

/** Get school's list for a suburb (optional type/level filters) */
export async function getSuburbSchools(
  name: string,
  types?: SchoolType[],
  levels?: SchoolLevel[]
): Promise<SchoolRow[]> {
  const path = `/suburb/${encodeURIComponent(name)}/schools${qs({
    types: types && types.length ? types : undefined,
    levels: levels && levels.length ? levels : undefined,
  })}`;
  return fetchJSON<SchoolRow[]>(path);
}

/** SWR 版本（第二个参数控制是否启用，例如 showSchools=false 时不发请求） */
export function useSuburbSchools(name?: string | null, enabled = false) {
  const key = enabled && name ? `/suburb/${encodeURIComponent(name)}/schools` : null;
  return useSWR<SchoolRow[]>(key ? makeCandidates(key)[0] : null, fetcher, {
    revalidateOnFocus: false,
  });
}

/** School counts aggregation (used for choropleth coloring) */
export function useSchoolCounts(
  lga?: string,
  types: SchoolType[] = [],
  levels: SchoolLevel[] = []
) {
  const key = lga
    ? `/council/${encodeURIComponent(lga)}/schools/agg${qs({
        types: types.length ? types : undefined,
        levels: levels.length ? levels : undefined,
      })}`
    : null;
  return useSWR<{ suburb: string; n: number }[]>(key ? makeCandidates(key)[0] : null, fetcher, {
    revalidateOnFocus: false,
  });
}

/** 住房中位价（用于 choropleth 着色） */
export function useHousingMedians(params: null | {
  lga: string;
  tenure: "buy" | "rent";
  dwelling: "House" | "Flat";
  beds: number;
}) {
  const key = params
    ? `/council/${encodeURIComponent(params.lga)}/housing/medians${qs({
        tenure: params.tenure,
        dwelling: params.dwelling,
        beds: params.beds,
      })}`
    : null;
  return useSWR<{ suburb: string; median: number }[]>(key ? makeCandidates(key)[0] : null, fetcher, {
    revalidateOnFocus: false,
  });
}

/** Cheapest/most expensive suburbs (used for cards and border highlighting) */
export async function getHousingExtremes(
  lga: string,
  tenure: "buy" | "rent",
  dwelling: "House" | "Flat",
  beds: number
): Promise<{ cheap?: { suburb: string; price: number }; costly?: { suburb: string; price: number } }> {
  const path = `/council/${encodeURIComponent(lga)}/housing/minmax${qs({
    tenure, dwelling, beds,
  })}`;
  return fetchJSON(path);
}




