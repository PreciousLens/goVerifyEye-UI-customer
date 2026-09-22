import { API_BASE_URL, API_PREFIX } from './config'
import { ApiError, normalizeApiErrorBody } from './errors'

export type CustomerShopper = {
  id: string
  email: string
  displayName?: string
}

export type CustomerSupportRequest = {
  requestId: string
  email: string
  subject: string
  message: string
  attachmentName?: string
  attachmentMimeType?: 'image/jpeg' | 'image/png' | 'application/pdf'
  attachmentBase64?: string
}

export type CustomerSupportReceipt = { reference: string; submittedAt: string }

type CustomerSession = {
  accessToken: string
  expiresAt: string
  shopper: CustomerShopper
}

const SESSION_KEY = 'goverifyeye.customer.session'

function readSession(): CustomerSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as CustomerSession
    if (!/^[a-f0-9]{64}$/.test(session.accessToken) || !session.shopper?.id) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return session
  } catch {
    return null
  }
}

function saveSession(session: CustomerSession | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  else localStorage.removeItem(SESSION_KEY)
}

function updateLocalShopper(partial: Partial<CustomerShopper>): CustomerShopper | null {
  const session = readSession()
  if (!session) return null
  const shopper = { ...session.shopper, ...partial }
  saveSession({ ...session, shopper })
  return shopper
}

async function request<T>(path: string, options: RequestInit = {}, authenticated = false): Promise<T> {
  if (!API_BASE_URL) throw new Error('The customer account service is unavailable.')
  const session = readSession()
  if (authenticated && !session) throw new ApiError(401, { code: 'SHOPPER_SESSION_EXPIRED', message: 'Sign in again to use your shopper account.' })
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(session ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      ...options.headers,
    },
  })
  const text = await response.text()
  let data: unknown = null
  try { data = text ? JSON.parse(text) : null } catch { data = { message: text } }
  if (!response.ok) {
    const error = new ApiError(response.status, normalizeApiErrorBody(data, response.statusText || 'Request failed'))
    if (error.code === 'SHOPPER_SESSION_EXPIRED') saveSession(null)
    throw error
  }
  return data as T
}

export type CustomerCheckHistoryItem = {
  receipt: string
  code: string
  channel: string
  checkedAt: string
  result: {
    valid: boolean
    status: string
    outcome?: string
    product?: { name?: string; manufacturer?: string; imageUrl?: string | null }
  }
}

export type CustomerCheckHistory = {
  items: CustomerCheckHistoryItem[]
  page: number
  hasMore: boolean
}

export const customerAccountApi = {
  session: readSession,
  async signIn(email: string, password: string) {
    const session = await request<CustomerSession>('/customer/auth/password/login', {
      method: 'POST', body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    })
    if (!/^[a-f0-9]{64}$/.test(session.accessToken) || !session.shopper?.id) throw new Error('The server returned an invalid customer session.')
    saveSession(session)
    return session.shopper
  },
  async requestRegistration(email: string) {
    return request<{ challengeId: string; expiresInSeconds: number; message: string }>(
      '/customer/auth/registration/challenge',
      { method: 'POST', body: JSON.stringify({ email: email.trim().toLowerCase() }) },
    )
  },
  async verifyRegistration(challengeId: string, code: string) {
    return request<{ registrationToken: string; expiresInSeconds: number }>(
      '/customer/auth/registration/verify',
      { method: 'POST', body: JSON.stringify({ challengeId, code }) },
    )
  },
  async completeRegistration(registrationToken: string, displayName: string, password: string) {
    const session = await request<CustomerSession>('/customer/auth/registration/complete', {
      method: 'POST',
      body: JSON.stringify({
        registrationToken,
        displayName: displayName.trim(),
        password,
      }),
    })
    if (!/^[a-f0-9]{64}$/.test(session.accessToken) || !session.shopper?.id) {
      throw new Error('The server returned an invalid customer session.')
    }
    saveSession(session)
    return session.shopper
  },
  me: () => request<CustomerShopper>('/customer/auth/me', {}, true),
  history: (page = 1) =>
    request<CustomerCheckHistory>(`/customer/history?page=${page}`, {}, true),
  /** Local-only until a shopper profile PATCH exists on the API. */
  updateLocalProfile(partial: Partial<CustomerShopper>) {
    return updateLocalShopper(partial)
  },
  async changePassword(currentPassword: string, newPassword: string) {
    // Prefer a dedicated change-password route when the API exposes one.
    return request<{ ok: true }>('/customer/auth/password/change', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }, true)
  },
  async signOut() {
    try { await request('/customer/auth/logout', { method: 'POST' }, true) } finally { saveSession(null) }
  },
  async deleteAccount(password: string) {
    const result = await request<{ deleted: true }>('/customer/auth/account', {
      method: 'DELETE', body: JSON.stringify({ password, confirmation: 'DELETE' }),
    }, true)
    saveSession(null)
    return result
  },
  contactSupport: (input: CustomerSupportRequest) => request<CustomerSupportReceipt>('/customer/support', {
    method: 'POST', body: JSON.stringify(input),
  }),
}
