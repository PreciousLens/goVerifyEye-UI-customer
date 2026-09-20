/** API config — base URL from Vite env. Mock when empty or VITE_USE_MOCK_API=true. */
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL as string | undefined
)
  ?.trim()
  .replace(/\/$/, '')

/** Mock wins over VITE_API_BASE_URL when VITE_USE_MOCK_API=true. */
export const USE_MOCK_API =
  import.meta.env.VITE_USE_MOCK_API === 'true' || !API_BASE_URL

export const API_PREFIX = '/api/v1'

/** Optional public storefront links for the customer landing download CTAs. */
export const APP_STORE_URL = (
  import.meta.env.VITE_APP_STORE_URL as string | undefined
)?.trim()

export const PLAY_STORE_URL = (
  import.meta.env.VITE_PLAY_STORE_URL as string | undefined
)?.trim()
