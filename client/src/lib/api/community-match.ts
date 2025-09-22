// community match api functions and types
import useSWR from 'swr'
import { apiFetch } from './client'

// types for community match api responses
export interface Top3Item {
  rank: number
  council: string
  population: number
}

export interface SuburbSummary {
  suburb: string
  notFound?: boolean
  medianHousing?: number | null
  rent_allprop?: number | null
  buy_flat?: number | null
  buy_house?: number | null
}

export interface SchoolRow {
  school_no?: string | number
  school_name: string
  school_type?: string
  education_sector?: string
  lat: number
  lon: number
  address_line_1?: string
  address_line_2?: string
  address_town?: string
  address_postcode?: string
  phone?: string
}

export type SchoolType = 'Government' | 'Independent' | 'Catholic'
export type SchoolLevel = 'Primary' | 'Secondary' | 'Pri/Sec' | 'Language' | 'Special'

// swr fetcher function
const fetcher = (url: string) => apiFetch(url, { method: 'GET' })

// get list of available languages
export function useLanguages() {
  return useSWR<string[]>('/community-match/languages', fetcher, {
    revalidateOnFocus: false,
  })
}

// get top 3 councils by language
export function useTop3(language?: string) {
  const endpoint = '/community-match/top3'
  // create unique key that includes language to trigger revalidation
  const swrKey = language ? [endpoint, language] : null
  
  return useSWR<Top3Item[]>(
    swrKey,
    async () => {
      const result = await apiFetch(endpoint, { 
        method: 'GET', 
        params: { language: language! } 
      })
      return result
    },
    { 
      revalidateOnFocus: false,
      keepPreviousData: false, // ensure fresh data on language change
      onError: (error) => {
        console.error('❌ Top3 API error:', error)
      }
    }
  )
}

// get suburb list for a council
export function useCouncilSuburbRows(lga?: string) {
  const endpoint = lga ? `/community-match/council/${lga}/suburbs` : null
  return useSWR<{ suburb: string; postcode?: string }[]>(
    endpoint,
    fetcher,
    { revalidateOnFocus: false }
  )
}

// get suburb summary data
export async function getSuburbSummary(name: string): Promise<SuburbSummary> {
  return apiFetch(`/community-match/suburb/${name}/summary`, { method: 'GET' })
}

export function useSuburbSummary(name?: string | null) {
  const endpoint = name ? `/community-match/suburb/${name}/summary` : null
  return useSWR<SuburbSummary>(endpoint, fetcher, {
    revalidateOnFocus: false,
  })
}

// get schools for a suburb
export async function getSuburbSchools(
  name: string,
  types?: SchoolType[],
  levels?: SchoolLevel[]
): Promise<SchoolRow[]> {
  const params: Record<string, any> = {}
  if (types && types.length) params.types = types.join(',')
  if (levels && levels.length) params.levels = levels.join(',')
  
  return apiFetch(`/community-match/suburb/${name}/schools`, { 
    method: 'GET', 
    params 
  })
}

export function useSuburbSchools(name?: string | null, enabled = false) {
  const endpoint = enabled && name ? `/community-match/suburb/${name}/schools` : null
  return useSWR<SchoolRow[]>(endpoint, fetcher, {
    revalidateOnFocus: false,
  })
}

// get school counts by council
export function useSchoolCounts(
  lga?: string,
  types: SchoolType[] = [],
  levels: SchoolLevel[] = []
) {
  const params: Record<string, any> = {}
  if (types.length) params.types = types.join(',')
  if (levels.length) params.levels = levels.join(',')
  
  const endpoint = lga ? `/community-match/council/${lga}/schools/agg` : null
  return useSWR<{ suburb: string; n: number }[]>(
    endpoint,
    () => apiFetch(endpoint!, { method: 'GET', params }),
    { 
      revalidateOnFocus: false,
      errorRetryCount: 1, // Limit retries to prevent infinite loop
      errorRetryInterval: 5000, // Wait 5 seconds between retries
      dedupingInterval: 10000, // Cache for 10 seconds to prevent rapid calls
    }
  )
}

// get housing median prices
export function useHousingMedians(params: null | {
  lga: string
  tenure: 'buy' | 'rent'
  dwelling: 'House' | 'Flat'
  beds: number
}) {
  const endpoint = params ? `/community-match/council/${params.lga}/housing/medians` : null
  
  return useSWR<{ suburb: string; median: number }[]>(
    endpoint,
    () => {
      if (!params) return Promise.resolve([])
      return apiFetch(endpoint!, { 
        method: 'GET', 
        params: {
          tenure: params.tenure,
          dwelling: params.dwelling,
          beds: params.beds.toString(),
        }
      })
    },
    { 
      revalidateOnFocus: false,
      errorRetryCount: 1, // Limit retries to prevent infinite loop
      errorRetryInterval: 5000, // Wait 5 seconds between retries  
      dedupingInterval: 10000, // Cache for 10 seconds to prevent rapid calls
    }
  )
}

// get housing price extremes
export async function getHousingExtremes(
  lga: string,
  tenure: 'buy' | 'rent',
  dwelling: 'House' | 'Flat',
  beds: number
): Promise<{ cheap?: { suburb: string; price: number }; costly?: { suburb: string; price: number } }> {
  const params = {
    tenure, 
    dwelling, 
    beds: beds.toString(),
  }
  return apiFetch(`/community-match/council/${lga}/housing/minmax`, { 
    method: 'GET', 
    params 
  })
}