// suburbs api functions for fetching suburb data
import { apiFetch } from './client'

// types for suburb api responses - matching component expectations
export interface SuburbItem {
  id: number
  suburb: string
}

export interface SuburbsResponse {
  items: SuburbItem[]
}

// fetch suburbs based on search query
export async function fetchSuburbs(query: string): Promise<SuburbsResponse> {
  if (query.length < 3) {
    return { items: [] }
  }
  
  try {
    const data = await apiFetch('/suburb-list', { 
      method: 'GET', 
      params: { q: query } 
    })
    return data as SuburbsResponse
  } catch (error) {
    console.error('Failed to fetch suburbs:', error)
    return { items: [] }
  }
}