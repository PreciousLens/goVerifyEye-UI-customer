import { useState } from 'react'
import { verifyApi } from '../../api'
import './CustomerVerifyShell.css'
import './CustomerShareCheckModal.css'

function ShareBadgeIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="18" cy="5" r="2.4" stroke="#0B66C3" strokeWidth="1.7" />
      <circle cx="6" cy="12" r="2.4" stroke="#0B66C3" strokeWidth="1.7" />
      <circle cx="18" cy="19" r="2.4" stroke="#0B66C3" strokeWidth="1.7" />
      <path
        d="m8.2 10.8 7.6-4.6M8.2 13.2l7.6 4.6"
        stroke="#0B66C3"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function formatCheckedAt(iso: string | null): string {
  const date = iso ? new Date(iso) : new Date()
  if (Number.isNaN(date.getTime())) {
    return 'Checked just now'
  }
  const day = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const time = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return `Checked ${day} · ${time}`
}

type CustomerShareCheckModalProps = {
  receipt: string | null
  checkedAt: string | null
  productName?: string
  code: string
  onClose: () => void
}

/**
 * Share this check modal (Figma) — native share + copy link.
 */
export function CustomerShareCheckModal({
  receipt,
  checkedAt,
  productName,
  code,
  onClose,
}: CustomerShareCheckModalProps) {
  const [status, setStatus] = useState('')
  const shareUrl = receipt ? verifyApi.shareUrl(receipt) : ''
  const shareText = productName
    ? `goVerifEye check: ${productName} — ${shareUrl}`
    : `goVerifEye check for code ${code} — ${shareUrl}`

  async function shareNative() {
    if (!receipt || !shareUrl) {
      setStatus('Verify again to get a shareable link for this check.')
      return
    }
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'goVerifEye check',
          text: shareText,
          url: shareUrl,
        })
        return
      }
      await navigator.clipboard.writeText(shareUrl)
      setStatus('Link copied — sharing is unavailable on this device.')
    } catch {
      // cancelled or failed
    }
  }

  async function copyLink() {
    if (!receipt || !shareUrl) {
      setStatus('Verify again to get a shareable link for this check.')
      return
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      setStatus('Link copied.')
    } catch {
      setStatus('Could not copy the link. Try again.')
    }
  }

  return (
    <div className="customer-share">
      <button
        type="button"
        className="customer-share__backdrop"
        aria-label="Close share"
        onClick={onClose}
      />
      <div
        className="customer-share__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-share-title"
      >
        <div className="customer-share__badge">
          <ShareBadgeIcon />
        </div>
        <h1 id="customer-share-title" className="customer-share__title">
          Share this check
        </h1>
        <p className="customer-share__copy">
          The shared link shows the result at the time of this check and offers
          the recipient a fresh live check for current status.
        </p>
        <div className="customer-share__meta">
          <p>{formatCheckedAt(checkedAt)}</p>
          <p>Current status may change after sharing.</p>
        </div>
        {status ? (
          <p className="customer-share__status" role="status">
            {status}
          </p>
        ) : null}
        <button
          type="button"
          className="customer-verify__btn customer-verify__btn--primary customer-share__btn"
          onClick={() => {
            void shareNative()
          }}
        >
          Share
        </button>
        <button
          type="button"
          className="customer-verify__btn customer-verify__btn--ghost customer-share__btn"
          onClick={() => {
            void copyLink()
          }}
        >
          Copy link
        </button>
      </div>
    </div>
  )
}
