import './CustomerVerifyingOverlay.css'

type CustomerVerifyingOverlayProps = {
  open: boolean
  title?: string
  subtitle?: string
}

/** Desktop Figma “Verifying Product…” loading card (1251:36398). */
export function CustomerVerifyingOverlay({
  open,
  title = 'Verifying Product...',
  subtitle = 'Checking for product...',
}: CustomerVerifyingOverlayProps) {
  if (!open) return null

  return (
    <div className="customer-verifying" role="status" aria-live="polite" aria-busy="true">
      <div className="customer-verifying__card">
        <div className="customer-verifying__loader" aria-hidden="true">
          <div className="customer-verifying__glow" />
          <div className="customer-verifying__ring" />
          <div className="customer-verifying__shield">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3.5 5.5 6.2v4.6c0 4.2 2.7 7.9 6.5 9.2 3.8-1.3 6.5-5 6.5-9.2V6.2L12 3.5Z"
                stroke="#0B66C3"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="m9.2 12.1 1.9 1.9 3.7-3.8"
                stroke="#0B66C3"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <h2 className="customer-verifying__title">{title}</h2>
        <p className="customer-verifying__subtitle">{subtitle}</p>
        <div className="customer-verifying__track" aria-hidden="true">
          <div className="customer-verifying__fill" />
        </div>
        <p className="customer-verifying__hint">This usually takes a few seconds</p>
      </div>
    </div>
  )
}
