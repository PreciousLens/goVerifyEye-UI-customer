import { API_BASE_URL, API_PREFIX, USE_MOCK_API } from './config'
import { ApiError, normalizeApiErrorBody } from './errors'
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  isAccessTokenExpiredOrNearExpiry,
  setTokens,
} from './tokens'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type RequestOptions = {
  method?: HttpMethod
  body?: unknown
  auth?: boolean
  signal?: AbortSignal
  /** Extra request headers (e.g. Idempotency-Key). */
  headers?: Record<string, string>
  /** Skip 401 → refresh → retry (used by refresh itself). */
  skipRefresh?: boolean
}

type TokenResponse = {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresInSeconds: number
}

let refreshInFlight: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken || !API_BASE_URL) return false

    try {
      const response = await fetch(
        `${API_BASE_URL}${API_PREFIX}/auth/refresh`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        },
      )

      if (!response.ok) {
        clearTokens()
        return false
      }

      const data = (await response.json()) as TokenResponse
      if (!data.accessToken) {
        clearTokens()
        return false
      }
      setTokens(data.accessToken, data.refreshToken)
      return true
    } catch {
      clearTokens()
      return false
    } finally {
      refreshInFlight = null
    }
  })()

  return refreshInFlight
}

/**
 * Ensure a usable access token before protected pages fire API calls.
 * Refreshes when missing/expired; returns false if the session is dead.
 */
export async function ensureAuthSession(): Promise<boolean> {
  if (USE_MOCK_API) return true
  const access = getAccessToken()
  const refresh = getRefreshToken()
  if (!access && !refresh) return false
  if (access && !isAccessTokenExpiredOrNearExpiry()) return true
  if (!refresh) {
    clearTokens()
    return false
  }
  return refreshAccessToken()
}

export async function http<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  if (USE_MOCK_API) {
    throw new ApiError(503, {
      code: 'INTERNAL_ERROR',
      message:
        'Mock mode is enabled — use API module mock paths instead of http().',
    })
  }

  // Refresh before the first attempt when the access token is already stale.
  if (
    options.auth !== false &&
    !options.skipRefresh &&
    isAccessTokenExpiredOrNearExpiry()
  ) {
    const refreshed = await refreshAccessToken()
    if (!refreshed && !getAccessToken()) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('goverifyeye:auth-expired'))
      }
      throw new ApiError(401, {
        code: 'UNAUTHORIZED',
        message: 'Your session expired. Please sign in again.',
      })
    }
  }

  const method = options.method ?? 'GET'
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  }

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (options.auth !== false) {
    const token = getAccessToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  })

  if (
    response.status === 401 &&
    options.auth !== false &&
    !options.skipRefresh &&
    path !== '/auth/refresh' &&
    path !== '/auth/login'
  ) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      return http<T>(path, { ...options, skipRefresh: true })
    }
    // Access + refresh both failed — notify the UI to send the user to login.
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('goverifyeye:auth-expired'))
    }
  }

  return parseResponse<T>(response)
}

/** Unique key for mutating API calls that require Idempotency-Key (8–128 chars). */
export function createIdempotencyKey(prefix = 'req'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`
}

/** Multipart upload (do not set Content-Type — browser adds boundary). */
export async function httpForm<T>(
  path: string,
  formData: FormData,
  options: {
    method?: 'POST' | 'PUT'
    signal?: AbortSignal
    skipRefresh?: boolean
  } = {},
): Promise<T> {
  if (USE_MOCK_API) {
    throw new ApiError(503, {
      code: 'INTERNAL_ERROR',
      message:
        'Mock mode is enabled — use API module mock paths instead of httpForm().',
    })
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  const token = getAccessToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
    method: options.method ?? 'POST',
    headers,
    body: formData,
    signal: options.signal,
  })

  if (response.status === 401 && !options.skipRefresh) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      return httpForm<T>(path, formData, { ...options, skipRefresh: true })
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('goverifyeye:auth-expired'))
    }
  }

  return parseResponse<T>(response)
}

/** Authenticated binary download with the same refresh behavior as JSON calls. */
export async function httpBlob(
  path: string,
  options: { signal?: AbortSignal; skipRefresh?: boolean; accept?: string } = {},
): Promise<Blob> {
  if (USE_MOCK_API) {
    throw new ApiError(503, {
      code: 'INTERNAL_ERROR',
      message: 'Mock mode is enabled — create the mock download in the API module.',
    })
  }

  if (!options.skipRefresh && isAccessTokenExpiredOrNearExpiry()) {
    const refreshed = await refreshAccessToken()
    if (!refreshed && !getAccessToken()) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('goverifyeye:auth-expired'))
      }
      throw new ApiError(401, {
        code: 'UNAUTHORIZED',
        message: 'Your session expired. Please sign in again.',
      })
    }
  }

  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
    headers: {
      Accept: options.accept ?? 'application/octet-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal: options.signal,
  })

  if (response.status === 401 && !options.skipRefresh) {
    const refreshed = await refreshAccessToken()
    if (refreshed) return httpBlob(path, { ...options, skipRefresh: true })
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('goverifyeye:auth-expired'))
    }
  }

  if (!response.ok) {
    const body = await response.text()
    let payload: unknown = body
    try {
      payload = body ? JSON.parse(body) : null
    } catch {
      // Plain-text download errors are normalized below.
    }
    throw new ApiError(
      response.status,
      normalizeApiErrorBody(payload, response.statusText || 'Download failed'),
    )
  }

  return response.blob()
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text) as unknown
    } catch {
      data = { code: 'INTERNAL_ERROR', message: text }
    }
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      normalizeApiErrorBody(data, response.statusText || 'Request failed'),
    )
  }

  return data as T
}

export function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}
