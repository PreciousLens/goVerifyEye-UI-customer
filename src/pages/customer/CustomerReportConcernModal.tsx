import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CONCERN_REASONS,
  toUserMessage,
  verifyApi,
  type ConcernReason,
} from '../../api'
import './CustomerVerifyShell.css'
import './CustomerReportConcernModal.css'

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5.2v-5.5h-3.6V21H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SubmittedCheckIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="#0F8A3C" />
      <path
        d="m9.5 16.2 4.2 4.2 8.8-9"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type CustomerReportConcernModalProps = {
  receipt: string | null
  onClose: () => void
  onSubmitted?: (message: string) => void
}

/**
 * Report concern + report submitted success (Figma).
 */
export function CustomerReportConcernModal({
  receipt,
  onClose,
  onSubmitted,
}: CustomerReportConcernModalProps) {
  const [reason, setReason] = useState<ConcernReason>(CONCERN_REASONS[0])
  const [note, setNote] = useState('')
  const [reporting, setReporting] = useState(false)
  const [status, setStatus] = useState('')
  const [submitted, setSubmitted] = useState(false)

  async function submit() {
    if (reporting) return
    setReporting(true)
    setStatus('')
    try {
      if (!receipt) {
        throw new Error(
          'Verify the product again, then submit your concern from the result screen.',
        )
      }
      const result = await verifyApi.reportConcern({
        receipt,
        reason,
        note: note.trim() || undefined,
      })
      const message = `Thanks — your report was submitted (${new Date(result.submittedAt).toLocaleString()}).`
      setNote('')
      setSubmitted(true)
      onSubmitted?.(message)
    } catch (err) {
      setStatus(toUserMessage(err))
    } finally {
      setReporting(false)
    }
  }

  if (submitted) {
    return (
      <div className="customer-report">
        <button
          type="button"
          className="customer-report__backdrop"
          aria-label="Close"
          onClick={onClose}
        />
        <div
          className="customer-report__modal customer-report__modal--submitted"
          role="dialog"
          aria-modal="true"
          aria-labelledby="customer-report-submitted-title"
        >
          <div className="customer-report__success">
            <div className="customer-report__success-badge">
              <SubmittedCheckIcon />
            </div>
            <h1
              id="customer-report-submitted-title"
              className="customer-report__title customer-report__title--center"
            >
              Report submitted
            </h1>
            <p className="customer-report__copy customer-report__copy--center">
              Thanks. We&apos;ve recorded your report. This helps protect other
              shoppers.
            </p>
            <button
              type="button"
              className="customer-verify__btn customer-verify__btn--primary customer-report__submit"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="customer-report">
      <button
        type="button"
        className="customer-report__backdrop"
        aria-label="Cancel report"
        onClick={onClose}
      />
      <div
        className="customer-report__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-report-title"
      >
        <header className="customer-report__header">
          <button
            type="button"
            className="customer-report__cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <Link
            to="/verify"
            className="customer-report__home"
            aria-label="Home"
            onClick={() => verifyApi.clearStashed()}
          >
            <HomeIcon />
          </Link>
        </header>

        <div className="customer-report__body">
          <h1 id="customer-report-title" className="customer-report__title">
            Report concern
          </h1>
          <p className="customer-report__copy">
            Choose the closest reason. Reporting does not require an account.
          </p>

          <div
            className="customer-report__reasons"
            role="radiogroup"
            aria-label="Concern reason"
          >
            {CONCERN_REASONS.map((option) => {
              const selected = reason === option
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`customer-report__reason${
                    selected ? ' customer-report__reason--selected' : ''
                  }`}
                  onClick={() => setReason(option)}
                >
                  <span className="customer-report__radio" aria-hidden="true" />
                  <span>{option}</span>
                </button>
              )
            })}
          </div>

          <textarea
            className="customer-report__note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={500}
            placeholder="Add a note (optional)"
            disabled={reporting}
          />

          {!receipt ? (
            <p className="customer-report__hint">
              Concern reporting needs a live check receipt. Verify again if this
              option stays unavailable.
            </p>
          ) : null}
          {status ? (
            <p className="customer-report__hint" role="status">
              {status}
            </p>
          ) : null}
        </div>

        <footer className="customer-report__footer">
          <button
            type="button"
            className="customer-verify__btn customer-verify__btn--primary customer-report__submit"
            disabled={!receipt || reporting}
            onClick={() => {
              void submit()
            }}
          >
            {reporting ? 'Sending…' : 'Submit report'}
          </button>
        </footer>
      </div>
    </div>
  )
}
