import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toUserMessage, verifyApi } from '../../api'
import { CustomerVerifyShell } from './CustomerVerifyShell'

/**
 * Customer — enter 16-digit verification code manually.
 */
export function CustomerManualVerifyPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const prefill = verifyApi.normalizeCode(searchParams.get('code') ?? '')
  const [code, setCode] = useState(prefill)
  const [location, setLocation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const normalized = verifyApi.normalizeCode(code)
  const canSubmit = verifyApi.isCompleteCode(normalized) && !submitting

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError('')
    try {
      await verifyApi.verify({
        verificationCode: normalized,
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
      <form className="customer-verify__card" onSubmit={handleSubmit} noValidate>
        <h1 className="customer-verify__heading">Enter verification code</h1>
        <p className="customer-verify__copy">
          Type the 16-digit code printed under the QR on your product package.
        </p>

        <label className="customer-verify__label">
          Verification code
          <input
            className="customer-verify__input"
            inputMode="numeric"
            autoComplete="one-time-code"
            name="verificationCode"
            placeholder="•••• •••• •••• ••••"
            value={normalized}
            onChange={(event) => setCode(event.target.value)}
            maxLength={16}
            required
            autoFocus
          />
        </label>
        <p className="customer-verify__hint">{normalized.length}/16 digits</p>

        <label className="customer-verify__label">
          Location (optional)
          <input
            className="customer-verify__input"
            style={{ letterSpacing: 'normal', fontSize: 15, fontWeight: 500 }}
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
