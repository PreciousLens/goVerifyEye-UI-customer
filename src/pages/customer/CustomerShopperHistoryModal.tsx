import { Link } from 'react-router-dom'
import { verifyApi, type CustomerActivityGroup } from '../../api'
import { ArrowLeftIcon } from '../../components/icons'
import './CustomerVerifyShell.css'
import './CustomerShopperHistoryModal.css'

function historyDayLabel(isoDate: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${isoDate}T00:00:00`)
  const diffDays = Math.round(
    (today.getTime() - target.getTime()) / (24 * 60 * 60 * 1000),
  )
  if (diffDays <= 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays} days ago`
}

function cityLabel(area: string): string {
  if (!area || area === 'Location not shared') return 'Location not shared'
  return area
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

type CustomerShopperHistoryModalProps = {
  groups: CustomerActivityGroup[]
  totalChecks: number
  cities: number
  onClose: () => void
}

/**
 * Full shopper check history modal (Figma “Shopper check history”).
 */
export function CustomerShopperHistoryModal({
  groups,
  totalChecks,
  cities,
  onClose,
}: CustomerShopperHistoryModalProps) {
  const pillText = [
    `${totalChecks} qualified shopper check${totalChecks === 1 ? '' : 's'}`,
    cities > 0 ? `${cities} cit${cities === 1 ? 'y' : 'ies'}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="customer-history">
      <button
        type="button"
        className="customer-history__backdrop"
        aria-label="Close shopper check history"
        onClick={onClose}
      />
      <div
        className="customer-history__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-history-title"
      >
        <header className="customer-history__header">
          <button
            type="button"
            className="customer-history__back"
            onClick={onClose}
          >
            <ArrowLeftIcon size={18} />
            Back
          </button>
          <Link
            to="/verify"
            className="customer-history__home"
            aria-label="Home"
            onClick={() => verifyApi.clearStashed()}
          >
            <HomeIcon />
          </Link>
        </header>

        <div className="customer-history__body">
          <h1 id="customer-history-title" className="customer-history__title">
            Shopper check history
          </h1>
          <p className="customer-history__copy">
            Consumer history is grouped and limited to decision-useful activity.
            Individual raw scans and exact device/location data are not exposed.
          </p>

          <p className="customer-history__pill">
            <PeopleIcon />
            {pillText}
          </p>

          {groups.length > 0 ? (
            <ol className="customer-history__timeline">
              {groups.map((group, index) => (
                <li key={`${group.date}-${group.area}-${index}`}>
                  <span className="customer-history__dot" aria-hidden="true" />
                  <div>
                    <p className="customer-history__when">
                      {historyDayLabel(group.date)} · {cityLabel(group.area)}
                    </p>
                    <p className="customer-history__what">
                      {group.checks} qualified shopper check
                      {group.checks === 1 ? '' : 's'}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="customer-history__empty">
              No grouped shopper history is available for this code yet.
            </p>
          )}
        </div>

        <footer className="customer-history__footer">
          <button
            type="button"
            className="customer-verify__btn customer-verify__btn--primary customer-history__done"
            onClick={onClose}
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  )
}
