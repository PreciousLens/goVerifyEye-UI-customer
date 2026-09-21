import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  verifyApi,
  type CustomerActivity,
  type VerifyFailure,
  type VerifySuccess,
} from '../../api'
import { ArrowLeftIcon } from '../../components/icons'
import { CustomerReportConcernModal } from './CustomerReportConcernModal'
import { CustomerShareCheckModal } from './CustomerShareCheckModal'
import { CustomerShopperHistoryModal } from './CustomerShopperHistoryModal'
import './CustomerVerifyShell.css'
import './CustomerVerificationDetailsPage.css'

function relativeDayLabel(isoDate: string, index: number): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${isoDate}T00:00:00`)
  const diffDays = Math.round(
    (today.getTime() - target.getTime()) / (24 * 60 * 60 * 1000),
  )
  if (diffDays <= 0 || index === 0) return 'Now'
  if (diffDays === 1) return '1 day ago'
  return `${diffDays} days ago`
}

function cityLabel(area: string): string {
  if (!area || area === 'Location not shared') return 'Location not shared'
  return area
}

function formatEffectiveDate(iso: string | undefined): string | null {
  if (!iso) return null
  const date = new Date(iso.includes('T') ? iso : `${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function CheckOkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="9.25" stroke="#12B76A" strokeWidth="1.75" />
      <path
        d="m7 11.2 2.6 2.6 5.4-5.6"
        stroke="#12B76A"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CheckWarnIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="9.25" stroke="#F04438" strokeWidth="1.75" />
      <path
        d="M11 6.8v5.4"
        stroke="#F04438"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <circle cx="11" cy="15.2" r="1.05" fill="#F04438" />
    </svg>
  )
}

function PeopleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3.5 18.5c.9-2.8 2.8-4.2 5.5-4.2s4.6 1.4 5.5 4.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="17" cy="9" r="2.6" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M14.2 18.5c.6-2 1.9-3.1 3.8-3.1 1.9 0 3.2 1.1 3.8 3.1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function PauseBannerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="#B54708" />
      <rect x="6.5" y="5.5" width="2.4" height="9" rx="0.8" fill="#fff" />
      <rect x="11.1" y="5.5" width="2.4" height="9" rx="0.8" fill="#fff" />
    </svg>
  )
}

function WarningBannerIcon({ color = '#F79009' }: { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function timelineWhatLabel(index: number, caution: boolean): string {
  if (index === 0) return 'This check'
  if (!caution) return 'Previous shopper check'
  if (index === 1) return 'Recent shopper check'
  return 'Earlier shopper check'
}

/**
 * Verification details modal (Figma matched + caution activity views).
 * Opened from result “Verification details”.
 */
export function CustomerVerificationDetailsPage() {
  const navigate = useNavigate()
  const stashed = useMemo(() => verifyApi.readStashed(), [])
  const [activity, setActivity] = useState<CustomerActivity | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [reportStatus, setReportStatus] = useState('')

  useEffect(() => {
    if (!stashed?.receipt) return
    let cancelled = false
    void verifyApi
      .activity(stashed.receipt)
      .then((data) => {
        if (!cancelled) setActivity(data)
      })
      .catch(() => {
        if (!cancelled) setActivity(null)
      })
    return () => {
      cancelled = true
    }
  }, [stashed?.receipt])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      if (shareOpen) {
        setShareOpen(false)
        return
      }
      if (reportOpen) {
        setReportOpen(false)
        return
      }
      if (historyOpen) {
        setHistoryOpen(false)
        return
      }
      navigate(-1)
    }
    window.addEventListener('keydown', onKeyDown)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previous
    }
  }, [navigate, historyOpen, reportOpen, shareOpen])

  if (!stashed) {
    return <Navigate to="/verify" replace />
  }

  const { result, code, receipt, checkedAt } = stashed
  const success = result.valid ? (result as VerifySuccess) : null
  const failure = !result.valid ? (result as VerifyFailure) : null
  const product = success?.product ?? failure?.product
  const batchReference =
    success?.batchReference || failure?.batchReference || '—'
  const count =
    success?.verificationCount ??
    failure?.verificationCount ??
    activity?.totalChecks ??
    0
  const suspicious = success?.outcome === 'suspicious'
  const flagged =
    success?.outcome === 'flagged' || failure?.status === 'flagged'
  const underReview = failure?.status === 'under_review'
  const recalled = failure?.status === 'recalled'
  const matched =
    Boolean(success) && !suspicious && !flagged && result.valid
  const caution = suspicious || flagged
  const underReviewCopy =
    'Under review: goVerifEye cannot provide a current verification result while unusual verification activity is being reviewed.'
  const recallCopy =
    'The batch linked to this code is marked as recalled in goVerifEye.'
  const alertCopy =
    success?.explanation?.trim() ||
    failure?.explanation?.trim() ||
    (suspicious
      ? 'This code was checked in far-apart locations within a short period. That pattern needs a closer look.'
      : flagged
        ? 'goVerifEye found serious conflicting use of this code. Review the recent shopper checks carefully.'
        : '')
  const effectiveDateLabel = formatEffectiveDate(failure?.recallEffectiveAt)

  const productSection = (
    <section className="customer-details__section">
      <h2>Registered product information</h2>
      <dl
        className={`customer-details__product${
          underReview || recalled ? ' customer-details__product--panel' : ''
        }`}
      >
        <div>
          <dt>Product</dt>
          <dd>{product?.name || 'Unavailable'}</dd>
        </div>
        <div>
          <dt>Registered vendor</dt>
          <dd>{product?.manufacturer || 'Unavailable'}</dd>
        </div>
        <div>
          <dt>Batch reference</dt>
          <dd>{batchReference}</dd>
        </div>
        {recalled && effectiveDateLabel ? (
          <div>
            <dt>Effective date</dt>
            <dd>{effectiveDateLabel}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  )

  const summary = matched
    ? 'The code record, registered product record and market activation matched. No unusual shopper pattern is currently detected.'
    : underReview
      ? 'This code is under review. goVerifEye cannot confirm a normal matched verification right now.'
      : flagged
        ? 'Serious conflicting verification activity was detected for this code. Review the checklist and recent checks carefully.'
        : suspicious
          ? 'The code is registered, but unusual shopper activity was detected. Review the checklist before you decide.'
          : 'goVerifEye could not complete a successful matched verification for this code.'

  const checks = [
    {
      label: 'Code record',
      value:
        matched || suspicious || flagged || underReview
          ? 'Matched'
          : 'Not matched',
      ok: matched || suspicious || flagged || underReview,
    },
    {
      label: 'Registered product record',
      value: product ? 'Matched' : 'Unavailable',
      ok: Boolean(product),
    },
    {
      label: 'Market activation',
      value: matched || suspicious
        ? 'Active'
        : underReview
          ? 'Under review'
          : failure?.status === 'recalled'
            ? 'Recalled'
            : 'Unavailable',
      ok: matched || suspicious,
    },
    {
      label: 'Shopper pattern',
      value: matched
        ? 'Normal'
        : suspicious
          ? 'Unusual'
          : flagged
            ? 'Flagged'
            : underReview
              ? 'Under review'
              : 'Unknown',
      ok: matched,
    },
  ]

  const groups = activity?.groups ?? []
  const previewLimit = 3
  const visibleGroups = groups.slice(0, previewLimit)
  const cities = activity?.locations ?? 0
  const totalChecks = activity?.totalChecks || count || 0
  const canShowHistory = groups.length > 0
  const pillText = [
    `${totalChecks} qualified shopper check${totalChecks === 1 ? '' : 's'}`,
    cities > 0 ? `${cities} cit${cities === 1 ? 'y' : 'ies'}` : null,
    caution ? 'unusual location pattern detected' : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const compactFooter = (
    <section className="customer-details__actions">
      <p className="customer-details__status-note">
        This status may change after our review.
      </p>
      <Link
        to="/verify"
        className="customer-verify__btn customer-verify__btn--primary customer-details__done"
        onClick={() => verifyApi.clearStashed()}
      >
        Check another product
      </Link>
      <button
        type="button"
        className="customer-details__report"
        onClick={() => setReportOpen(true)}
      >
        Report concern
      </button>
      {reportStatus ? (
        <p className="customer-details__hint" role="status">
          {reportStatus}
        </p>
      ) : null}
    </section>
  )


  return (
    <div className="customer-details">
      <button
        type="button"
        className="customer-details__backdrop"
        aria-label="Close verification details"
        onClick={() => navigate(-1)}
      />
      <div
        className="customer-details__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-details-title"
      >
        <header className="customer-details__header">
          <button
            type="button"
            className="customer-details__back"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftIcon size={18} />
            Back
          </button>
          <h1 id="customer-details-title" className="customer-details__title">
            Verification details
          </h1>
          <button
            type="button"
            className="customer-details__share"
            aria-label="Share"
            onClick={() => setShareOpen(true)}
          >
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
          </button>
        </header>

        <div className="customer-details__body">
          {recalled ? (
            <>
              <div
                className="customer-details__alert customer-details__alert--danger"
                role="alert"
              >
                <span className="customer-details__alert-icon" aria-hidden="true">
                  <WarningBannerIcon color="#F04438" />
                </span>
                <p>{recallCopy}</p>
              </div>
              {productSection}
              {compactFooter}
            </>
          ) : underReview ? (
            <>
              <div className="customer-details__alert" role="status">
                <span className="customer-details__alert-icon" aria-hidden="true">
                  <PauseBannerIcon />
                </span>
                <p>
                  <strong>Under review:</strong>{' '}
                  {underReviewCopy.replace(/^Under review:\s*/i, '')}
                </p>
              </div>

              {productSection}
              {compactFooter}
            </>
          ) : (
            <>
              {caution ? (
                <div className="customer-details__alert" role="status">
                  <span className="customer-details__alert-icon" aria-hidden="true">
                    <WarningBannerIcon />
                  </span>
                  <p>{alertCopy}</p>
                </div>
              ) : (
                <>
                  <p className="customer-details__summary">{summary}</p>
                  <ul className="customer-details__checklist">
                    {checks.map((row) => (
                      <li key={row.label}>
                        <span
                          className="customer-details__check-icon"
                          data-ok={row.ok}
                        >
                          {row.ok ? <CheckOkIcon /> : <CheckWarnIcon />}
                        </span>
                        <span className="customer-details__check-label">
                          {row.label}
                        </span>
                        <span
                          className="customer-details__check-value"
                          data-ok={row.ok}
                        >
                          {row.value}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <section className="customer-details__section">
                <h2>Recent shopper checks</h2>
                <p className="customer-details__pill">
                  <PeopleIcon />
                  {pillText}
                </p>

                {visibleGroups.length > 0 ? (
                  <ol className="customer-details__timeline">
                    {visibleGroups.map((group, index) => (
                      <li key={`${group.date}-${group.area}-${index}`}>
                        <span
                          className={
                            index === 0
                              ? 'customer-details__dot'
                              : 'customer-details__dot customer-details__dot--ring'
                          }
                          aria-hidden="true"
                        />
                        <div>
                          <p className="customer-details__when">
                            {relativeDayLabel(group.date, index)} ·{' '}
                            {cityLabel(group.area)}
                          </p>
                          <p className="customer-details__what">
                            {timelineWhatLabel(index, caution)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="customer-details__empty">
                    Recent shopper checks are not available for this result yet.
                  </p>
                )}

                {canShowHistory ? (
                  <button
                    type="button"
                    className="customer-details__link"
                    onClick={() => setHistoryOpen(true)}
                  >
                    Show history
                  </button>
                ) : null}
              </section>

              {productSection}

              {caution ? (
                <section className="customer-details__actions">
                  <button
                    type="button"
                    className="customer-verify__btn customer-verify__btn--danger customer-details__report-primary"
                    onClick={() => setReportOpen(true)}
                  >
                    Report concern
                  </button>
                  <Link
                    to="/verify"
                    className="customer-verify__btn customer-verify__btn--ghost customer-details__done"
                    onClick={() => verifyApi.clearStashed()}
                  >
                    Check another product
                  </Link>
                  {reportStatus ? (
                    <p className="customer-details__hint" role="status">
                      {reportStatus}
                    </p>
                  ) : null}
                </section>
              ) : (
                <section className="customer-details__section">
                  <h2>Does this match what you are holding?</h2>
                  <p className="customer-details__copy">
                    If the displayed product or label details do not match the
                    item in front of you, report the mismatch. goVerifEye does
                    not infer the physical product from the camera view.
                  </p>
                  <Link
                    to="/verify"
                    className="customer-verify__btn customer-verify__btn--primary customer-details__done"
                    onClick={() => verifyApi.clearStashed()}
                  >
                    Done
                  </Link>
                  <button
                    type="button"
                    className="customer-details__report"
                    onClick={() => setReportOpen(true)}
                  >
                    Report concern
                  </button>
                  {reportStatus ? (
                    <p className="customer-details__hint" role="status">
                      {reportStatus}
                    </p>
                  ) : null}
                </section>
              )}
            </>
          )}
        </div>
      </div>

      {historyOpen ? (
        <CustomerShopperHistoryModal
          groups={groups}
          totalChecks={totalChecks}
          cities={cities}
          onClose={() => setHistoryOpen(false)}
        />
      ) : null}

      {reportOpen ? (
        <CustomerReportConcernModal
          receipt={receipt}
          onClose={() => setReportOpen(false)}
          onSubmitted={(message) => setReportStatus(message)}
        />
      ) : null}

      {shareOpen ? (
        <CustomerShareCheckModal
          receipt={receipt}
          checkedAt={checkedAt}
          productName={product?.name}
          code={code}
          onClose={() => setShareOpen(false)}
        />
      ) : null}
    </div>
  )
}
