import { Link } from 'react-router-dom'
import { BrandMark } from '../../components/BrandMark'
import { SUPPORT_EMAIL } from '../../lib/support'
import './CustomerPrivacyPage.css'

/**
 * Public privacy summary for the customer verify surface.
 */
export function CustomerPrivacyPage() {
  return (
    <div className="customer-privacy">
      <header className="customer-privacy__header">
        <Link to="/verify" className="customer-privacy__brand" aria-label="goVerifEye home">
          <BrandMark className="customer-privacy__logo" tone="onLight" />
        </Link>
        <Link to="/verify" className="customer-privacy__back">
          Back to verify
        </Link>
      </header>

      <main className="customer-privacy__main">
        <h1>Privacy Policy</h1>
        <p className="customer-privacy__updated">Last updated: 14 September 2026</p>

        <p>
          goVerifEye helps shoppers check whether a product code is registered
          and active. This page explains what we collect during public
          verification and how that information is used.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>The verification code you scan or enter</li>
          <li>Optional location text you choose to provide</li>
          <li>
            Technical signals used to protect the service (for example IP and
            browser metadata, stored as hashes where applicable)
          </li>
          <li>
            Optional concern reports you submit after a check, including the
            reason and any notes you add
          </li>
          <li>
            Shopper account details only if you sign in (email, display name,
            and authentication data)
          </li>
        </ul>

        <h2>How we use it</h2>
        <ul>
          <li>To return a verification result for the code you submitted</li>
          <li>To detect suspicious or repeated scanning patterns</li>
          <li>To route consumer concerns to the platform team</li>
          <li>To operate and secure the goVerifEye service</li>
        </ul>

        <h2>What we do not do</h2>
        <ul>
          <li>We do not sell shopper verification data</li>
          <li>
            Region-level reporting for vendors does not identify individual
            shoppers
          </li>
          <li>
            A successful code check confirms registry status — it does not
            certify product quality or safety by itself
          </li>
        </ul>

        <h2>Contact</h2>
        <p>
          Questions about privacy or data requests:{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </p>
      </main>
    </div>
  )
}
