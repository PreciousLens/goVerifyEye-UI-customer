/** Designated goVerifEye support inbox (auth + vendor portal). */
export const SUPPORT_EMAIL = 'support@goverifyeye.com'

export const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}`

/** Opens the in-app contact-support form hosted by the active portal shell. */
export function openSupportEmail(subject?: string) {
  window.dispatchEvent(new CustomEvent('goverifyeye:contact-support', { detail: { subject } }))
}
