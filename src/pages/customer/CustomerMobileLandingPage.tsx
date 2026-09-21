import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toUserMessage, verifyApi, APP_STORE_URL, PLAY_STORE_URL } from '../../api'
import { BrandMark } from '../../components/BrandMark'
import {
  ArrowRightIcon,
  FlagIcon,
  InfoCircleIcon,
  MenuIcon,
  ScanIcon,
} from '../../components/icons'
import heroScanJpg from '../../assets/customer/hero-scan.jpg'
import heroScanWebp from '../../assets/customer/hero-scan.webp'
import iconApple from '../../assets/customer/icon-apple.svg'
import iconKeyboard1 from '../../assets/customer/icon-keyboard-1.svg'
import iconKeyboard2 from '../../assets/customer/icon-keyboard-2.svg'
import iconScanBtn from '../../assets/customer/icon-scan-btn.svg'
import iconShield1 from '../../assets/customer/icon-shield-1.svg'
import iconShield2 from '../../assets/customer/icon-shield-2.svg'
import playstore from '../../assets/customer/playstore.png'
import './CustomerMobileLandingPage.css'
import { CustomerContactSupportModal } from './CustomerContactSupportModal'
import { CustomerVerifyingOverlay } from './CustomerVerifyingOverlay'

const STEPS = [
  {
    n: '1',
    title: 'Scan',
    body: 'Enter the product code or point your camera at the QR code on your product package.',
    icon: 'scan' as const,
  },
  {
    n: '2',
    title: 'Verify',
    body: 'We instantly match code metadata against our secure blockchain registry database.',
    icon: 'shield' as const,
  },
  {
    n: '3',
    title: 'View Product Info',
    body: 'Know your purchase is genuine and get comprehensive information about product origin.',
    icon: 'info' as const,
  },
  {
    n: '4',
    title: 'Report',
    body: 'Give a review of the product or log any suspicious activity about the product.',
    icon: 'flag' as const,
  },
]

function formatCodeDisplay(digits: string): string {
  const groups = digits.match(/.{1,4}/g) ?? []
  return groups.join('-')
}

/**
 * Customer verify landing — mobile-first with desktop layout
 * matching the goVerifEye desktop marketing frame.
 *
 * Flow: Scan Code → /verify/scan · inline code → /verify/result
 * (incomplete codes → /verify/manual)
 */
export function CustomerMobileLandingPage() {
  const navigate = useNavigate()
  const codeInputRef = useRef<HTMLInputElement>(null)
  const [supportOpen, setSupportOpen] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [codeError, setCodeError] = useState('')

  const digits = verifyApi.normalizeCode(code)
  const displayCode = formatCodeDisplay(digits)
  const canSubmit = digits.length > 0 && !submitting

  useEffect(() => {
    if (!manualOpen) return
    const id = window.setTimeout(() => codeInputRef.current?.focus(), 220)
    return () => window.clearTimeout(id)
  }, [manualOpen])

  async function handleCodeSubmit(event: FormEvent) {
    event.preventDefault()
    if (!digits) return
    setCodeError('')

    if (!verifyApi.isCompleteCode(digits)) {
      navigate(`/verify/manual?code=${encodeURIComponent(digits)}`)
      return
    }

    setSubmitting(true)
    const startedAt = Date.now()
    try {
      await verifyApi.verify({
        verificationCode: digits,
        channel: 'manual',
      })
      // Keep the Figma verifying card visible long enough to read.
      const elapsed = Date.now() - startedAt
      if (elapsed < 900) {
        await new Promise((resolve) => window.setTimeout(resolve, 900 - elapsed))
      }
      navigate('/verify/result', { replace: true })
    } catch (err) {
      setCodeError(toUserMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="customer-landing">
      <CustomerVerifyingOverlay open={submitting} />
      <header className="customer-landing__header">
        <div className="customer-landing__header-inner">
          <Link to="/verify" className="customer-landing__brand" aria-label="goVerifEye home">
            <BrandMark className="customer-landing__logo" tone="onLight" />
          </Link>

          <nav className="customer-landing__nav" aria-label="Primary">
            <a href="#how-it-works" className="customer-landing__nav-link">
              How it Works
            </a>
            <a href="#download" className="customer-landing__nav-cta">
              Download App
            </a>
          </nav>

          <Link
            to="/verify/account"
            className="customer-landing__menu"
            aria-label="Shopper account"
          >
            <MenuIcon size={24} />
          </Link>
        </div>
      </header>

      <main className="customer-landing__main">
        <section className="customer-landing__hero" aria-label="Verify">
          <div className="customer-landing__hero-copy">
            <span className="customer-landing__badge">
              <span className="customer-landing__badge-dot" aria-hidden="true" />
              SECURED VERIFICATION
            </span>
            <h1 className="customer-landing__title">Verify Before You Buy</h1>
            <p className="customer-landing__subtitle">
              Verify the authenticity of your product instantly by scanning the
              QR code or entering the verification code. Protect your purchase
              with enterprise-grade blockchain security.
            </p>

            <div className="customer-landing__actions">
              <Link to="/verify/scan" className="customer-landing__scan-btn">
                <span className="customer-landing__btn-icon" aria-hidden="true">
                  <img src={iconScanBtn} alt="" width={24} height={24} />
                </span>
                Scan Code
              </Link>

              <div
                className={`customer-landing__manual${manualOpen ? ' customer-landing__manual--open' : ''}`}
              >
                <button
                  type="button"
                  className="customer-landing__manual-trigger"
                  aria-expanded={manualOpen}
                  aria-controls="landing-code-panel"
                  tabIndex={manualOpen ? -1 : 0}
                  onClick={() => {
                    setManualOpen(true)
                    setCodeError('')
                  }}
                >
                  <span className="customer-landing__btn-icon" aria-hidden="true">
                    <span className="customer-landing__keyboard">
                      <img src={iconKeyboard2} alt="" width={24} height={24} />
                      <img
                        className="customer-landing__keyboard-keys"
                        src={iconKeyboard1}
                        alt=""
                        width={14}
                        height={5}
                      />
                    </span>
                  </span>
                  Enter Code Manually
                </button>

                <form
                  id="landing-code-panel"
                  className="customer-landing__code-field"
                  onSubmit={handleCodeSubmit}
                  noValidate
                  aria-hidden={!manualOpen}
                >
                  <label className="customer-landing__code-label" htmlFor="landing-code">
                    Verification code
                  </label>
                  <input
                    ref={codeInputRef}
                    id="landing-code"
                    className="customer-landing__code-input"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    name="verificationCode"
                    placeholder="1256-8907-6543"
                    value={displayCode}
                    onChange={(event) => {
                      setCode(event.target.value)
                      if (codeError) setCodeError('')
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') {
                        setManualOpen(false)
                        setCodeError('')
                      }
                    }}
                    maxLength={19}
                    tabIndex={manualOpen ? 0 : -1}
                    aria-invalid={Boolean(codeError)}
                    aria-describedby={codeError ? 'landing-code-error' : undefined}
                  />
                  <button
                    type="submit"
                    className="customer-landing__code-go"
                    disabled={!canSubmit}
                    tabIndex={manualOpen ? 0 : -1}
                    aria-label="Verify code"
                  >
                    <ArrowRightIcon size={18} />
                  </button>
                </form>
              </div>
            </div>
            {codeError ? (
              <p
                id="landing-code-error"
                className="customer-landing__code-error"
                role="alert"
              >
                {codeError}
              </p>
            ) : null}
          </div>

          <div className="customer-landing__hero-media">
            <picture>
              <source srcSet={heroScanWebp} type="image/webp" />
              <img
                src={heroScanJpg}
                alt="Hand holding a phone verifying UltraBoost Pro by scanning the product QR code"
                className="customer-landing__hero-img"
              />
            </picture>
          </div>
        </section>

        <section
          id="how-it-works"
          className="customer-landing__how"
          aria-labelledby="customer-how-title"
        >
          <div className="customer-landing__how-inner">
            <div className="customer-landing__how-header">
              <span className="customer-landing__process">SECURE PROCESS</span>
              <h2 id="customer-how-title" className="customer-landing__how-title">
                How It Works
              </h2>
              <p className="customer-landing__how-sub">
                Follow four simple steps to instantly verify your product&apos;s
                authenticity and get immediate peace of mind.
              </p>
            </div>

            <ol className="customer-landing__steps">
              {STEPS.map((step) => (
                <li key={step.n} className="customer-landing__step">
                  <div className="customer-landing__step-top">
                    <div className="customer-landing__step-label">
                      <span className="customer-landing__step-num">{step.n}</span>
                      <span className="customer-landing__step-name">
                        {step.title}
                      </span>
                    </div>
                    <span
                      className="customer-landing__step-icon"
                      aria-hidden="true"
                    >
                      <StepIcon kind={step.icon} />
                    </span>
                  </div>
                  <p className="customer-landing__step-body">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id="download"
          className="customer-landing__download-wrap"
          aria-labelledby="customer-download-title"
        >
          <div className="customer-landing__download">
            <div className="customer-landing__download-grid" aria-hidden="true" />
            <div className="customer-landing__download-inner">
              <h2
                id="customer-download-title"
                className="customer-landing__download-title"
              >
                Download the goVerifEye App
              </h2>
              <p className="customer-landing__download-sub">
                Check product authenticity on the go, follow supply-chain
                signals, and get real-time verification alerts wherever you shop.
              </p>
              <div className="customer-landing__download-actions">
                {APP_STORE_URL ? (
                  <a
                    href={APP_STORE_URL}
                    className="customer-landing__store-btn"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="customer-landing__btn-icon" aria-hidden="true">
                      <img src={iconApple} alt="" width={24} height={24} />
                    </span>
                    Apple App Store
                  </a>
                ) : (
                  <button
                    type="button"
                    className="customer-landing__store-btn"
                    disabled
                    title="App Store link coming soon"
                  >
                    <span className="customer-landing__btn-icon" aria-hidden="true">
                      <img src={iconApple} alt="" width={24} height={24} />
                    </span>
                    Apple App Store
                  </button>
                )}
                {PLAY_STORE_URL ? (
                  <a
                    href={PLAY_STORE_URL}
                    className="customer-landing__store-btn"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="customer-landing__btn-icon" aria-hidden="true">
                      <img src={playstore} alt="" width={24} height={24} />
                    </span>
                    Google Play Store
                  </a>
                ) : (
                  <button
                    type="button"
                    className="customer-landing__store-btn"
                    disabled
                    title="Play Store link coming soon"
                  >
                    <span className="customer-landing__btn-icon" aria-hidden="true">
                      <img src={playstore} alt="" width={24} height={24} />
                    </span>
                    Google Play Store
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="customer-landing__footer">
        <div className="customer-landing__footer-inner">
          <p className="customer-landing__copyright">
            © 2025 goVerifEye. All rights reserved.
          </p>
          <nav className="customer-landing__footer-links" aria-label="Legal">
            <Link to="/verify/privacy">Privacy Policy</Link>
            <button type="button" onClick={() => setSupportOpen(true)}>
              Support Center
            </button>
            <Link to="/verify/manual">Report Fraud</Link>
          </nav>
        </div>
      </footer>
      <CustomerContactSupportModal
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
      />
    </div>
  )
}

function StepIcon({
  kind,
}: {
  kind: 'scan' | 'shield' | 'info' | 'flag'
}) {
  if (kind === 'scan') return <ScanIcon size={24} />
  if (kind === 'info') return <InfoCircleIcon size={24} />
  if (kind === 'flag') return <FlagIcon size={24} />
  return (
    <span className="customer-landing__shield">
      <img src={iconShield2} alt="" width={24} height={24} />
      <img
        className="customer-landing__shield-check"
        src={iconShield1}
        alt=""
        width={8}
        height={6}
      />
    </span>
  )
}
