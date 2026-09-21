import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toUserMessage, verifyApi } from '../../api'
import { CustomerVerifyShell } from './CustomerVerifyShell'
import { CustomerVerifyingOverlay } from './CustomerVerifyingOverlay'

function formatCodeDisplay(digits: string): string {
  const groups = digits.match(/.{1,4}/g) ?? []
  return groups.join('-')
}

/**
 * Customer — enter 16-digit verification code (desktop + mobile).
 * Desktop counterpart: Figma “Desktop - Enter code”.
 */
export function CustomerManualVerifyPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const prefill = verifyApi.normalizeCode(searchParams.get('code') ?? '')
  const [code, setCode] = useState(prefill)
  const [location, setLocation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const digits = verifyApi.normalizeCode(code)
  const display = formatCodeDisplay(digits)
  const canSubmit = verifyApi.isCompleteCode(digits) && !submitting

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError('')
    try {
      await verifyApi.verify({
        verificationCode: digits,
        location: location.trim() || undefined,
        channel: 'manual',
      })
      navigate('/verify/result', { replace: true })
    } catch (err) {
      setError(toUserMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CustomerVerifyShell title="Enter code" backTo="/verify">
      <CustomerVerifyingOverlay open={submitting} />
      <form className="customer-verify__card customer-manual" onSubmit={handleSubmit} noValidate>
        <span className="customer-manual__badge">SECURED VERIFICATION</span>
        <h1 className="customer-verify__heading">Enter verification code</h1>
        <p className="customer-verify__copy">
          Type the 16-digit code printed under the QR on your product package.
          Protect your purchase with enterprise-grade blockchain security.
        </p>

        <label className="customer-verify__label">
          Verification code
          <input
            className="customer-verify__input"
            inputMode="numeric"
            autoComplete="one-time-code"
            name="verificationCode"
            placeholder="1256-8907-6543"
            value={display}
            onChange={(event) => setCode(event.target.value)}
            maxLength={19}
            required
            autoFocus
          />
        </label>
        <p className="customer-verify__hint">{digits.length}/16 digits</p>

        <label className="customer-verify__label">
          Location (optional)
          <input
            className="customer-verify__input customer-verify__input--text"
            name="location"
            placeholder="e.g. Lagos, Nigeria"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            maxLength={100}
          />
        </label>

        {error ? (
          <p className="customer-verify__error" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="customer-verify__btn customer-verify__btn--primary"
          disabled={!canSubmit}
        >
          {submitting ? 'Verifying…' : 'Verify product'}
        </button>

        <Link
          to="/verify/scan"
          className="customer-verify__btn customer-verify__btn--ghost"
        >
          Scan QR instead
        </Link>
      </form>
    </CustomerVerifyShell>
  )
}
