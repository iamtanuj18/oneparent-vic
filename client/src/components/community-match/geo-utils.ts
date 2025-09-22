// geojson utilities for community match map
import type { Feature, FeatureCollection } from 'geojson'

export type GFeature = Feature<any, Record<string, any>>
export type GCollection = FeatureCollection<any, Record<string, any>>

// hard paths to geojson files in public/data
const LGA_GEO_PATH = '/data/VMLITE_LGA.json'
const SUBURB_GEO_PATH = '/data/suburbs.geojson'

// load lga boundary data
export async function getLgaGeo(): Promise<GCollection> {
  const res = await fetch(LGA_GEO_PATH, { cache: 'no-store' })
  if (!res.ok) throw new Error(`load lga geo failed: ${res.status} ${res.statusText}`)
  const json = (await res.json()) as GCollection

  // filter to keep only lga features
  json.features = json.features.filter((f) => {
    const code = String(f?.properties?.FTYPE_CODE ?? '').toLowerCase()
    return !code || code === 'lga' || code.includes('local government')
  })

  // keep victoria only
  const getState = (props: Record<string, any>) => {
    const candidates = [
      props?.STATE,
      props?.STATE_NAME,
      props?.STATE_ABBR,
      props?.STE_NAME,
      props?.STATE_CODE,
      props?.STATE_NAME16,
      props?.STATE_NAME20,
    ]
    const v = candidates.find((x) => x != null)
    return String(v ?? '').toUpperCase()
  }
  
  json.features = json.features.filter((f) => {
    const s = getState(f.properties || {})
    return s === 'VIC' || s.includes('VICTORIA')
  })

  return json
}

// load suburb boundary data
export async function getSuburbsGeo(): Promise<GCollection> {
  const res = await fetch(SUBURB_GEO_PATH, { cache: 'no-store' })
  if (!res.ok) throw new Error(`load suburbs geo failed: ${res.status} ${res.statusText}`)
  return res.json()
}

// get suburb name from geojson properties
export function getSuburbName(props: Record<string, any>): string {
  return String(props?.LOC_NAME ?? props?.SUBURB_NAME ?? props?.name ?? '')
}

// normalize name for comparison
export function normName(s: any) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '')
    .trim()
}

// filter geojson features by suburb list from database
export function filterBySuburbRows(
  subGeo: GCollection,
  rows: { suburb: string }[]
): GFeature[] {
  const set = new Set(rows.map((r) => normName(r.suburb)))
  return subGeo.features.filter((f) =>
    set.has(normName(getSuburbName(f.properties)))
  )
}