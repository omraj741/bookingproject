const API_URL = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '')

export async function apiRequest(path, options) {
  const requestUrl = `${API_URL}${path}`

  let response
  try {
    response = await fetch(requestUrl, options)
  } catch {
    throw new Error('Could not connect to the API server.')
  }

  const result = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(result?.message || `API request failed (${response.status}).`)
  }

  return result
}