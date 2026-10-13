const API_URL = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '')

export async function apiRequest(path, options) {
  if (import.meta.env.PROD && !API_URL) {
    throw new Error('VITE_API_URL is not configured for this deployment.')
  }

  let response
  try {
    response = await fetch(`${API_URL}${path}`, options)
  } catch {
    throw new Error('Could not connect to the API server.')
  }

  const result = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(result?.message || `API request failed (${response.status}).`)
  }

  return result
}