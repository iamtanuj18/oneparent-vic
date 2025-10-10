// API client with JSON body support and error handling
import { CONFIG } from '../config'

const BASE_URL = CONFIG.API_BASE_URL

export interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: any
  params?: Record<string, string>
  responseType?: 'json' | 'text'
}

// thin wrapper around fetch with json body support and error handling
export async function apiFetch(
  endpoint: string,
  { method = 'POST', body, params, responseType = 'json' }: ApiFetchOptions = {}
) {
  let url = `${BASE_URL}${endpoint}`

  if (params) {
    const qs = new URLSearchParams(params).toString()
    if (qs) url += `?${qs}`
  }

  const headers: Record<string, string> = {}
  // only set json header when sending a json body
  if (body !== undefined && body !== null) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  // helper to throw with body-aware message + status
  const throwWithMessage = async () => {
    let msg = `API ${res.status}`
    let errorData = null
    const ct = res.headers.get('content-type') || ''
    try {
      if (ct.includes('application/json')) {
        errorData = await res.json()
        msg = errorData?.error || errorData?.message || msg
      } else {
        const text = await res.text()
        msg = text || msg
      }
    } catch(_e) {
      // ignore json parsing errors
    }
    const err = new Error(msg) as Error & { status: number; data?: any }
    err.status = res.status
    err.data = errorData
    throw err     
  }

  if (!res.ok) {
    // For safety check and validation endpoints, return the error data instead of throwing
    if ((endpoint.includes('safetychecks') || endpoint.includes('validate-schedule')) && res.status === 400) {
      try {
        const errorData = await res.json()
        return errorData // Return the error response body which contains validation details
      } catch(_e) {
        // Fall back to throwing if JSON parsing fails
      }
    }
    await throwWithMessage()
  }

  if (responseType === 'text') {
    return await res.text()
  }

  return await res.json()
}