const ACCESS_KEY = 'goverifyeye.accessToken'
const REFRESH_KEY = 'goverifyeye.refreshToken'

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_KEY)
  } catch {
    return null
  }
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_KEY)
  } catch {
    return null
  }
}

export function setTokens(accessToken: string, refreshToken?: string | null) {
  localStorage.setItem(ACCESS_KEY, accessToken)
  if (refreshToken) {
    localStorage.setItem(REFRESH_KEY, refreshToken)
  }
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

/** Seconds until JWT `exp`, or null if token missing/unreadable. */
export function getAccessTokenExpiresInSeconds(): number | null {
  const token = getAccessToken()
  if (!token) return null
  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return null
    const json = atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/'))
    const payload = JSON.parse(json) as { exp?: number }
    if (typeof payload.exp !== 'number') return null
    return payload.exp - Math.floor(Date.now() / 1000)
  } catch {
    return null
  }
}

export function isAccessTokenExpiredOrNearExpiry(
  skewSeconds = 60,
): boolean {
  const remaining = getAccessTokenExpiresInSeconds()
  if (remaining === null) return true
  return remaining <= skewSeconds
}

