import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  CONCERN_REASONS,
  toUserMessage,
  verifyApi,
  type ConcernReason,
  type VerifyFailure,
  type VerifyProductInfo,
  type VerifySuccess,
} from '../../api'
import { CustomerVerifyShell } from './CustomerVerifyShell'

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="18" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="6" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="18" cy="19" r="2.2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="m8 11 8-5M8 13l8 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ShopperIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M5 19.5c1.2-3.2 3.5-4.8 7-4.8s5.8 1.6 7 4.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function WarningTriangle({ color = '#B42318' }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.8 21 19.5H3L12 3.8Z"
        fill={color}
        stroke={color}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M12 9.2v5.2" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16.8" r="1.1" fill="#fff" />
    </svg>
  )
}

/** Figma success mark — mint outer ring, solid green disc, white check. */
function SuccessMark() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="32" fill="#D1FADF" />
      <circle cx="32" cy="32" r="24" fill="#0B6F31" />
      <path
        d="m22.5 32.5 6.2 6.2 12.8-13.2"
        stroke="#fff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ResultHeader({
  onShare,
}: {
  onShare: () => void
}) {
  return (
    <header className="customer-result__top">
      <Link
        to="/verify"
        className="customer-result__icon-btn"
        aria-label="Close"
        onClick={() => verifyApi.clearStashed()}
      >
        ×
      </Link>
      <span className="customer-result__handle" aria-hidden="true" />
      <button
        type="button"
        className="customer-result__icon-btn"
        aria-label="Share"
        onClick={onShare}
      >
        <ShareIcon />
      </button>
    </header>
  )
}

function ProductRow({ product }: { product: VerifyProductInfo }) {
  return (
    <div className="customer-result__product">
      {product.imageUrl ? (
        <img className="customer-result__thumb" src={product.imageUrl} alt="" />
      ) : (
        <div className="customer-result__thumb customer-result__thumb--empty" />
      )}
      <div>
        <p className="customer-result__product-name">{product.name}</p>
        <p className="customer-result__product-vendor">
          Registered vendor: {product.manufacturer || 'Unavailable'}
        </p>
      </div>
    </div>
  )
}

function ShopperPill({ label, highlight }: { label: string; highlight?: boolean }) {
  return (
    <p
      className={`customer-result__first${
        highlight ? ' customer-result__first--new' : ''
      }`}
    >
      <ShopperIcon />
      {label}
    </p>
  )
}

/**
 * Customer — verification outcome as desktop result card (Figma success/caution/invalid).
 */
export function CustomerVerifyResultPage() {
  const navigate = useNavigate()
  const stashed = useMemo(() => verifyApi.readStashed(), [])
  const [reason, setReason] = useState<ConcernReason>(CONCERN_REASONS[0])
  const [note, setNote] = useState('')
  const [reportStatus, setReportStatus] = useState('')
  const [reporting, setReporting] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  if (!stashed) {
    return <Navigate to="/verify" replace />
  }

  const { result, code, receipt } = stashed

  function openDetails() {
    navigate('/verify/details')
  }

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

  async function shareResult() {
    const text = result.valid
      ? `goVerifEye check: ${(result as VerifySuccess).product.name} — code ${code}`
      : result.product?.name
        ? `goVerifEye: ${result.product.name} (${result.status}) — code ${code}`
        : `goVerifEye check failed for code ${code}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'goVerifEye', text })
        return
      }
      await navigator.clipboard.writeText(text)
      setReportStatus('Result copied to clipboard.')
    } catch {
      // User cancelled share — ignore.
    }
  }

  const share = () => {
    void shareResult()
  }

  const concernForm = reportOpen ? (
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
  ) : null

  // —— Under review ————————————————————————————————————————————————
  if (!result.valid && result.status === 'under_review') {
    const fail = result as VerifyFailure
    const count = Math.max(fail.verificationCount ?? 0, 1)
    const reasonText =
      fail.explanation?.trim() ||
      'unusual verification activity requires review. Ask the seller for another verifiable item or check again later.'

    return (
      <CustomerVerifyShell title="Result" backTo="/verify" variant="result">
        <article className="customer-result customer-result--review">
          <ResultHeader onShare={share} />

          <div className="customer-result__banner customer-result__banner--review">
            <span className="customer-result__mark" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="7" y="6" width="3.5" height="12" rx="1" fill="#B54708" />
                <rect x="13.5" y="6" width="3.5" height="12" rx="1" fill="#B54708" />
              </svg>
            </span>
            <span className="customer-result__badge customer-result__badge--review">
              Under review
            </span>
            <h1 className="customer-result__title">This code is under review</h1>
            <p className="customer-result__body">
              goVerifEye cannot provide a current verification result for this code.
            </p>
          </div>

          {fail.product ? <ProductRow product={fail.product} /> : null}
          <ShopperPill label={`Checked by ${count} shoppers`} />

          <div className="customer-result__reason-box" role="note">
            <span className="customer-result__reason-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="7" y="6" width="3.5" height="12" rx="1" fill="#B54708" />
                <rect x="13.5" y="6" width="3.5" height="12" rx="1" fill="#B54708" />
              </svg>
            </span>
            <p className="customer-result__reason-text">
              <strong>Reason:</strong> {reasonText}
            </p>
          </div>

          <div className="customer-result__actions customer-result__actions--caution">
            <button
              type="button"
              className="customer-verify__btn customer-verify__btn--primary"
              onClick={openDetails}
            >
              Verification details
            </button>
            <Link
              to="/verify"
              className="customer-verify__btn customer-verify__btn--secondary"
              onClick={() => verifyApi.clearStashed()}
            >
              Check another product
            </Link>
            <button
              type="button"
              className="customer-verify__btn customer-verify__btn--danger customer-result__report-btn"
              onClick={() => setReportOpen((open) => !open)}
            >
              {reportOpen ? 'Hide report form' : 'Report concern'}
            </button>
          </div>

          {concernForm}
        </article>
      </CustomerVerifyShell>
    )
  }

  // —— Flagged —————————————————————————————————————————————————————
  if (
    (!result.valid && result.status === 'flagged') ||
    (result.valid && result.outcome === 'flagged')
  ) {
    const fail = result.valid
      ? null
      : (result as VerifyFailure)
    const success = result.valid ? (result as VerifySuccess) : null
    const product = success?.product ?? fail?.product
    const count = Math.max(
      success?.verificationCount ?? fail?.verificationCount ?? 0,
      1,
    )
    const alertText =
      success?.explanation?.trim() ||
      fail?.explanation?.trim() ||
      'goVerifEye found serious conflicting use of this code. Review the verification details for the evidence available to shoppers.'

    return (
      <CustomerVerifyShell title="Result" backTo="/verify" variant="result">
        <article className="customer-result customer-result--flagged">
          <ResultHeader onShare={share} />

          <div className="customer-result__banner customer-result__banner--flagged">
            <span className="customer-result__mark" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 21V4h.5l1.2.4C9.2 5 10.8 5.2 12 5.2c1.2 0 2.5-.3 4-.7L18 4v11.2l-1.5.5c-1.6.5-3 .8-4.5.8-1.2 0-2.7-.3-4.3-.8L6 15.2"
                  stroke="#B42318"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="customer-result__badge customer-result__badge--flagged">
              Flagged
            </span>
            <h1 className="customer-result__title">Serious verification concern</h1>
            <p className="customer-result__body">
              This code shows serious conflicting verification activity.
            </p>
          </div>

          {product ? <ProductRow product={product} /> : null}
          <ShopperPill label={`Checked by ${count} shoppers`} />

          <div className="customer-result__alert" role="alert">
            <span className="customer-result__alert-icon" aria-hidden="true">
              <WarningTriangle />
            </span>
            <p>{alertText}</p>
          </div>

          <div className="customer-result__actions customer-result__actions--caution">
            <button
              type="button"
              className="customer-verify__btn customer-verify__btn--primary"
              onClick={openDetails}
            >
              Verification details
            </button>
            <Link
              to="/verify"
              className="customer-verify__btn customer-verify__btn--secondary"
              onClick={() => verifyApi.clearStashed()}
            >
              Check another product
            </Link>
            <button
              type="button"
              className="customer-verify__btn customer-verify__btn--danger customer-result__report-btn"
              onClick={() => setReportOpen((open) => !open)}
            >
              {reportOpen ? 'Hide report form' : 'Report concern'}
            </button>
          </div>

          {concernForm}
        </article>
      </CustomerVerifyShell>
    )
  }

  // —— Recalled ————————————————————————————————————————————————————
  if (!result.valid && result.status === 'recalled') {
    const fail = result as VerifyFailure
    const count = Math.max(fail.verificationCount ?? 0, 1)
    const guidance =
      fail.guidance?.trim() ||
      'Contact the seller or manufacturer for return guidance.'

    return (
      <CustomerVerifyShell title="Result" backTo="/verify" variant="result">
        <article className="customer-result customer-result--recall">
          <ResultHeader onShare={share} />

          <div className="customer-result__banner customer-result__banner--invalid-solid">
            <span className="customer-result__mark" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M7 7l10 10M17 7 7 17"
                  stroke="#fff"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="customer-result__badge customer-result__badge--invalid">
              Recall recorded
            </span>
            <h1 className="customer-result__title">Recall recorded for this batch</h1>
            <p className="customer-result__body">
              The batch linked to this code is marked as recalled in goVerifEye.
            </p>
          </div>

          {fail.product ? <ProductRow product={fail.product} /> : null}
          <ShopperPill label={`Checked by ${count} shoppers`} />

          <div className="customer-result__alert" role="note">
            <span className="customer-result__alert-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#B42318" strokeWidth="1.8" />
                <path
                  d="M12 8v5.5"
                  stroke="#B42318"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="16.5" r="1.1" fill="#B42318" />
              </svg>
            </span>
            <p>{guidance}</p>
          </div>

          <div className="customer-result__actions customer-result__actions--caution">
            <button
              type="button"
              className="customer-verify__btn customer-verify__btn--primary"
              onClick={openDetails}
            >
              Verification details
            </button>
            <Link
              to="/verify"
              className="customer-verify__btn customer-verify__btn--secondary"
              onClick={() => verifyApi.clearStashed()}
            >
              Check another product
            </Link>
            <button
              type="button"
              className="customer-verify__btn customer-verify__btn--danger customer-result__report-btn"
              onClick={() => setReportOpen((open) => !open)}
            >
              {reportOpen ? 'Hide report form' : 'Report concern'}
            </button>
          </div>

          {concernForm}
        </article>
      </CustomerVerifyShell>
    )
  }

  // —— Not recognized ——————————————————————————————————————————————
  if (
    !result.valid &&
    (result.status === 'not_found' || result.status === 'not_recognised')
  ) {
    return (
      <CustomerVerifyShell title="Result" backTo="/verify" variant="result">
        <article className="customer-result customer-result--unrecognized">
          <ResultHeader onShare={share} />

          <div className="customer-result__banner customer-result__banner--unrecognized">
            <span className="customer-result__mark" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#042B5C" strokeWidth="1.8" />
                <path
                  d="M12 10.5v5"
                  stroke="#042B5C"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="7.8" r="1.1" fill="#042B5C" />
              </svg>
            </span>
            <span className="customer-result__badge customer-result__badge--unrecognized">
              Code not recognized
            </span>
            <h1 className="customer-result__title">
              We couldn&apos;t find this code in goVerifEye
            </h1>
            <p className="customer-result__body">
              Check all 16 digits or scan the label again.
            </p>
          </div>

          <div className="customer-result__actions customer-result__actions--triple">
            <Link
              to="/verify/manual"
              className="customer-verify__btn customer-verify__btn--primary"
              onClick={() => verifyApi.clearStashed()}
            >
              Re-enter code
            </Link>
            <Link
              to="/verify/scan"
              className="customer-verify__btn customer-verify__btn--secondary"
              onClick={() => verifyApi.clearStashed()}
            >
              Scan again
            </Link>
            <button
              type="button"
              className="customer-verify__btn customer-verify__btn--danger customer-result__report-btn"
              onClick={() => setReportOpen((open) => !open)}
            >
              {reportOpen ? 'Hide report form' : 'Report concern'}
            </button>
          </div>

          {concernForm}
        </article>
      </CustomerVerifyShell>
    )
  }

  // —— Invalid (and other hard failures) ———————————————————————————
  if (!result.valid) {
    const fail = result as VerifyFailure
    const isInvalid =
      fail.status === 'invalid' ||
      fail.status === 'inactive' ||
      fail.status === 'suspended' ||
      fail.status === 'product_unavailable'

    return (
      <CustomerVerifyShell title="Result" backTo="/verify" variant="result">
        <article className="customer-result customer-result--invalid">
          <ResultHeader onShare={share} />

          <div
            className={`customer-result__banner customer-result__banner--${
              isInvalid ? 'invalid-solid' : 'invalid'
            }`}
          >
            <span className="customer-result__mark" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M7 7l10 10M17 7 7 17"
                  stroke={isInvalid ? '#fff' : '#B42318'}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="customer-result__badge customer-result__badge--invalid">
              Invalid
            </span>
            <h1 className="customer-result__title">Code could not be verified</h1>
            <p className="customer-result__body">
              goVerifEye could not verify this code as a valid issued code.
            </p>
          </div>

          <div className="customer-result__alert" role="note">
            <span className="customer-result__alert-icon" aria-hidden="true">
              <WarningTriangle />
            </span>
            <p>
              Re-enter the number or scan again in case of a typing or scan
              error. The internal checks are not shown.
            </p>
          </div>

          <div className="customer-result__actions customer-result__actions--triple">
            <Link
              to="/verify/manual"
              className="customer-verify__btn customer-verify__btn--primary"
              onClick={() => verifyApi.clearStashed()}
            >
              Re-enter code
            </Link>
            <Link
              to="/verify/scan"
              className="customer-verify__btn customer-verify__btn--secondary"
              onClick={() => verifyApi.clearStashed()}
            >
              Scan again
            </Link>
            <button
              type="button"
              className="customer-verify__btn customer-verify__btn--danger customer-result__report-btn"
              onClick={() => setReportOpen((open) => !open)}
            >
              {reportOpen ? 'Hide report form' : 'Report concern'}
            </button>
          </div>

          {concernForm}
        </article>
      </CustomerVerifyShell>
    )
  }

  // —— Success / caution ———————————————————————————————————————————
  const success = result as VerifySuccess
  const suspicious = success.outcome === 'suspicious'
  const isFirstCheck =
    !suspicious &&
    (success.firstVerification || success.verificationCount === 1)
  const shopperCountLabel = isFirstCheck
    ? 'First shopper check recorded'
    : `Checked by ${Math.max(success.verificationCount, 2)} shoppers`
  const cautionCopy =
    success.explanation?.trim() ||
    'This code has an unusual verification pattern. Review the registered product details before deciding what to do.'

  return (
    <CustomerVerifyShell title="Result" backTo="/verify" variant="result">
      <article
        className={`customer-result${
          suspicious
            ? ' customer-result--caution'
            : isFirstCheck
              ? ' customer-result--first'
              : ' customer-result--repeat'
        }`}
      >
        <ResultHeader onShare={share} />

        <div
          className={`customer-result__banner customer-result__banner--${
            suspicious ? 'caution' : 'success'
          }`}
        >
          <span
            className={`customer-result__mark${
              suspicious ? '' : ' customer-result__mark--success'
            }`}
            aria-hidden="true"
          >
            {suspicious ? <WarningTriangle color="#F79009" /> : <SuccessMark />}
          </span>
          <span
            className={`customer-result__badge customer-result__badge--${
              suspicious ? 'caution' : 'success'
            }`}
          >
            {suspicious ? 'Caution' : 'Verified by goVerifEye'}
          </span>
          <h1 className="customer-result__title">
            {suspicious ? 'Unusual verification activity' : 'Code check successful'}
          </h1>
          <p className="customer-result__body">
            {suspicious
              ? 'Review the details before deciding what to do.'
              : 'Code matches the registered product record.'}
          </p>
        </div>

        <ProductRow product={success.product} />
        <ShopperPill label={shopperCountLabel} highlight={isFirstCheck} />

        {suspicious ? (
          <p className="customer-result__reason">{cautionCopy}</p>
        ) : (
          <p className="customer-result__disclaimer">
            This checks the goVerifEye code and its registered record; it does not
            certify product quality or safety.
          </p>
        )}

        <div
          className={`customer-result__actions${
            suspicious ? ' customer-result__actions--caution' : ''
          }`}
        >
          {suspicious ? (
            <>
              <button
                type="button"
                className="customer-verify__btn customer-verify__btn--primary"
                onClick={openDetails}
              >
                Verification details
              </button>
              <Link
                to="/verify"
                className="customer-verify__btn customer-verify__btn--secondary"
                onClick={() => verifyApi.clearStashed()}
              >
                Check another product
              </Link>
              <button
                type="button"
                className="customer-verify__btn customer-verify__btn--danger customer-result__report-btn"
                onClick={() => setReportOpen((open) => !open)}
              >
                {reportOpen ? 'Hide report form' : 'Report concern'}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/verify"
                className="customer-verify__btn customer-verify__btn--primary"
                onClick={() => verifyApi.clearStashed()}
              >
                Check another product
              </Link>
              <button
                type="button"
                className="customer-verify__btn customer-verify__btn--secondary"
                onClick={openDetails}
              >
                Verification details
              </button>
            </>
          )}
        </div>

        {concernForm}
      </article>
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
    <section className="customer-result__report" aria-labelledby="report-fraud">
      <h2 id="report-fraud" className="customer-result__report-title">
        Report a concern
      </h2>
      <label className="customer-verify__label">
        Reason
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
        className="customer-verify__btn customer-verify__btn--ghost"
        disabled={!canReport || reporting}
        onClick={onSubmit}
      >
        {reporting ? 'Sending…' : 'Submit report'}
      </button>
    </section>
  )
}
