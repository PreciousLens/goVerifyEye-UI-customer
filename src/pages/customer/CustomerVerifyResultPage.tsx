import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  CONCERN_REASONS,
  toUserMessage,
  verifyApi,
  type ConcernReason,
  type VerifyFailure,
  type VerifySuccess,
} from '../../api'
import { CustomerVerifyShell } from './CustomerVerifyShell'

function invalidCopy(status: string): { title: string; body: string } {
  switch (status) {
    case 'not_found':
      return {
        title: 'Code not recognized',
        body: 'This code was not found in the goVerifEye registry. Check the digits and try again, or report a suspected counterfeit.',
      }
    case 'inactive':
      return {
        title: 'Code not active',
        body: 'This code exists but has not been activated for sale yet. Ask the seller for an activated pack.',
      }
    case 'suspended':
      return {
        title: 'Code suspended',
        body: 'This verification code has been suspended. Do not purchase this item and report the issue.',
      }
    case 'product_unavailable':
      return {
        title: 'Product unavailable',
        body: 'The linked product is not available for public verification right now.',
      }
    default:
      return {
        title: 'Unable to verify',
        body: 'We could not verify this product. Try again or report suspicious activity.',
      }
  }
}

/**
 * Customer — verification outcome (valid / suspicious / invalid).
 * Reports go to POST /customer/concerns when a check receipt is available.
 */
export function CustomerVerifyResultPage() {
  const stashed = useMemo(() => verifyApi.readStashed(), [])
  const [reason, setReason] = useState<ConcernReason>(CONCERN_REASONS[0])
  const [note, setNote] = useState('')
  const [reportStatus, setReportStatus] = useState('')
  const [reporting, setReporting] = useState(false)

  if (!stashed) {
    return <Navigate to="/verify" replace />
  }

  const { result, code, receipt } = stashed

  async function submitConcern() {
    if (reporting) return
    setReporting(true)
    setReportStatus('')
    try {
      if (!receipt) {
        throw new Error(
          'Verify the product again, then submit your concern from the result screen.',
        )
      }
      const submitted = await verifyApi.reportConcern({
        receipt,
        reason,
        note: note.trim() || undefined,
      })
      setReportStatus(
        `Thanks — your report was submitted (${new Date(submitted.submittedAt).toLocaleString()}).`,
      )
      setNote('')
    } catch (err) {
      setReportStatus(toUserMessage(err))
    } finally {
      setReporting(false)
    }
  }

  if (!result.valid) {
    const fail = result as VerifyFailure
    const copy = invalidCopy(fail.status)
    return (
      <CustomerVerifyShell title="Result" backTo="/verify">
        <div className="customer-verify__card">
          <span className="customer-verify__status-pill customer-verify__status-pill--invalid">
            Not verified
          </span>
          <h1 className="customer-verify__heading">{copy.title}</h1>
          <p className="customer-verify__copy">{copy.body}</p>
          <p className="customer-verify__hint">Code checked: {code || '—'}</p>
          <div className="customer-verify__actions">
            <Link
              to="/verify/manual"
              className="customer-verify__btn customer-verify__btn--primary"
            >
              Try another code
            </Link>
            <Link
              to="/verify/scan"
              className="customer-verify__btn customer-verify__btn--secondary"
            >
              Scan again
            </Link>
          </div>
          <ConcernForm
            reason={reason}
            note={note}
            reporting={reporting}
            reportStatus={reportStatus}
            canReport={Boolean(receipt)}
            onReason={setReason}
            onNote={setNote}
            onSubmit={() => {
              void submitConcern()
            }}
          />
        </div>
      </CustomerVerifyShell>
    )
  }

  const success = result as VerifySuccess
  const suspicious = success.outcome === 'suspicious'

  return (
    <CustomerVerifyShell title="Result" backTo="/verify">
      <div className="customer-verify__card">
        <span
          className={`customer-verify__status-pill customer-verify__status-pill--${
            suspicious ? 'suspicious' : 'valid'
          }`}
        >
          {suspicious ? 'Review recommended' : 'Genuine product'}
        </span>
        <h1 className="customer-verify__heading">
          {suspicious
            ? 'This scan looks unusual'
            : 'Product verified successfully'}
        </h1>
        <p className="customer-verify__copy">
          {suspicious
            ? 'The code is registered, but repeated or high-frequency scanning raised a risk flag. Buy with caution and consider reporting.'
            : 'This code matched an active product in the goVerifEye registry.'}
        </p>

        <div className="customer-verify__product">
          {success.product.imageUrl ? (
            <img
              className="customer-verify__product-image"
              src={success.product.imageUrl}
              alt=""
            />
          ) : null}
          <p className="customer-verify__product-name">{success.product.name}</p>
          <p className="customer-verify__product-meta">
            {[success.product.form, success.product.manufacturer]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {success.product.description ? (
            <p className="customer-verify__product-meta">
              {success.product.description}
            </p>
          ) : null}
        </div>

        <div className="customer-verify__stats">
          <div className="customer-verify__stat">
            <p className="customer-verify__stat-label">Scans</p>
            <p className="customer-verify__stat-value">
              {success.verificationCount}
            </p>
          </div>
          <div className="customer-verify__stat">
            <p className="customer-verify__stat-label">First check</p>
            <p className="customer-verify__stat-value">
              {success.firstVerification ? 'Yes' : 'No'}
            </p>
          </div>
        </div>

        <ConcernForm
          reason={reason}
          note={note}
          reporting={reporting}
          reportStatus={reportStatus}
          canReport={Boolean(receipt)}
          onReason={setReason}
          onNote={setNote}
          onSubmit={() => {
            void submitConcern()
          }}
        />

        <div className="customer-verify__actions">
          <Link
            to="/verify"
            className="customer-verify__btn customer-verify__btn--primary"
            onClick={() => verifyApi.clearStashed()}
          >
            Done
          </Link>
          <Link
            to="/verify/manual"
            className="customer-verify__btn customer-verify__btn--ghost"
          >
            Verify another product
          </Link>
        </div>
      </div>
    </CustomerVerifyShell>
  )
}

function ConcernForm({
  reason,
  note,
  reporting,
  reportStatus,
  canReport,
  onReason,
  onNote,
  onSubmit,
}: {
  reason: ConcernReason
  note: string
  reporting: boolean
  reportStatus: string
  canReport: boolean
  onReason: (value: ConcernReason) => void
  onNote: (value: string) => void
  onSubmit: () => void
}) {
  return (
    <>
      <label className="customer-verify__label" id="report-fraud">
        Report an issue
        <select
          className="customer-verify__input customer-verify__input--text"
          value={reason}
          onChange={(event) => onReason(event.target.value as ConcernReason)}
          disabled={!canReport || reporting}
        >
          {CONCERN_REASONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label className="customer-verify__label">
        Details (optional)
        <textarea
          className="customer-verify__input"
          style={{
            height: 96,
            padding: '12px 14px',
            letterSpacing: 'normal',
            fontSize: 14,
            fontWeight: 500,
            resize: 'vertical',
          }}
          value={note}
          onChange={(event) => onNote(event.target.value)}
          maxLength={500}
          placeholder="Describe seal damage, packaging issues, or other concerns"
          disabled={!canReport || reporting}
        />
      </label>
      {!canReport ? (
        <p className="customer-verify__hint">
          Concern reporting needs a live check receipt. Verify again if this
          option stays unavailable.
        </p>
      ) : null}
      {reportStatus ? (
        <p className="customer-verify__hint" role="status">
          {reportStatus}
        </p>
      ) : null}
      <button
        type="button"
        className="customer-verify__btn customer-verify__btn--secondary"
        disabled={!canReport || reporting}
        onClick={onSubmit}
      >
        {reporting ? 'Sending…' : 'Submit report'}
      </button>
    </>
  )
}
