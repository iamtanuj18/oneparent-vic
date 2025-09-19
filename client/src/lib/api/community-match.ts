// community match api functions for cultural suburb matching
import { apiFetch } from './client'

// types for community match api responses
export interface LgaData {
  lga: string
  population: number
}

export interface SuburbData {
  name: string
}

export interface SchoolData {
  id: number
  name: string
  type: string
  lat: number
  lng: number
  address: string
}

export interface LanguagesResponse {
  languages: string[]
}

export interface TopLgasResponse {
  language: string
  topLgas: LgaData[]
}

export interface SuburbsResponse {
  lga: string
  suburbs: SuburbData[]
}

export interface SchoolsResponse {
  location: { lat: number; lng: number }
  radiusKm: number
  lga?: string
  schools: SchoolData[]
}

export interface SchoolsNearRequest {
  lat: number
  lng: number
  radiusKm?: number
  lga?: string
  limit?: number
}

// fetch available languages for community matching
export function fetchLanguages(): Promise<LanguagesResponse> {
  return apiFetch('/community-match/languages', { method: 'GET' })
}

// fetch top LGAs by language population
export function fetchTopLgasByLanguage(language: string): Promise<TopLgasResponse> {
  return apiFetch(`/community-match/top-lgas/${encodeURIComponent(language)}`, { method: 'GET' })
}

// fetch suburbs within an LGA
export function fetchSuburbsByLga(lga: string): Promise<SuburbsResponse> {
  return apiFetch(`/community-match/suburbs/${encodeURIComponent(lga)}`, { method: 'GET' })
}

// fetch schools near a location
export function fetchSchoolsNear(request: SchoolsNearRequest): Promise<SchoolsResponse> {
  return apiFetch('/community-match/schools-near', { method: 'POST', body: request })
}