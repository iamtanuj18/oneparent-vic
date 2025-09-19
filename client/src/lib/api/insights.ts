// insights api functions for fetching community data
import { apiFetch } from './client'

// types for insights data responses 
export interface TimelineMilestone {
  year: number
  total_families_k: number
  dependants_k: number
}

export interface FamiliesLatest {
  year: number
  total_families_k: number
}

// types for new insightsExtra endpoints
export interface PpsLatest {
  date: string
  vic_recipients: number
}

export interface PpsTrendData {
  date: string
  vic_total: number
}

export interface PpsHotspot {
  suburb: string
  recipients: number
}

export interface PpsHotspotDetail {
  suburb: string
  longitude: number
  latitude: number
  recipients: number
}

export interface LabourLatest {
  year: number
  labour_pct: number
}

export interface LabourBreakdown {
  year: number
  family_type: string
  status: string
  families_k: number
  with_children_k: number
}

// api calls for endpoints
export function fetchTimeline(): Promise<TimelineMilestone[]> {
  return apiFetch('/insights/timeline', { method: 'GET' })
}

export function fetchFamiliesLatest(): Promise<FamiliesLatest> {
  return apiFetch('/insights/families-latest', { method: 'GET' })
}

// new insightsExtra API functions - SUMMARY endpoints
export function fetchPpsLatest(): Promise<PpsLatest> {
  return apiFetch('/insights/pps-latest', { method: 'GET' })
}

export function fetchPpsHotspot(): Promise<PpsHotspot> {
  return apiFetch('/insights/pps-hotspot', { method: 'GET' })
}

export function fetchLabourLatest(): Promise<LabourLatest> {
  return apiFetch('/insights/labour-latest', { method: 'GET' })
}

// new insightsExtra API functions - DETAIL endpoints (for modals)
export function fetchPpsTrend(): Promise<PpsTrendData[]> {
  return apiFetch('/insights/pps-trend', { method: 'GET' })
}

export function fetchPpsHotspotDetail(): Promise<PpsHotspotDetail[]> {
  return apiFetch('/insights/pps-hotspot-detail', { method: 'GET' })
}

export function fetchLabourBreakdown(): Promise<LabourBreakdown[]> {
  return apiFetch('/insights/labour-breakdown', { method: 'GET' })
}