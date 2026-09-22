import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { customerAccountApi, type CustomerShopper } from '../../api/customerAccount'
import { toUserMessage } from '../../api'
import { BrandMark } from '../../components/BrandMark'
import {
  ArrowLeftIcon,
  EyeIcon,
  LockIcon,
  MailIcon,
} from '../../components/icons'
import { CustomerVerifyShell } from './CustomerVerifyShell'
import { CustomerContactSupportModal } from './CustomerContactSupportModal'
import { CustomerShopperDashboard } from './CustomerShopperDashboard'
import './CustomerAccountPage.css'

type AuthTab = 'login' | 'signup'
type SignupStep = 'form' | 'verify'

function AppleMark() {
  return (
    <svg width="18" height="22" viewBox="0 0 19.5 24" aria-hidden="true">
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.93 6.91c.95 0 2.73-1.29 4.6-1.1.78.03 2.97.32 4.39 2.38-.11.07-2.62 1.53-2.59 4.56.03 3.62 3.17 4.83 3.22 4.85-.03.09-.51 1.72-1.66 3.42-.99 1.46-2.04 2.92-3.67 2.95-1.61.03-2.13-.96-3.96-.96s-2.41.93-3.93.99c-1.58.06-2.78-1.58-3.79-3.04C.46 17.98-1.11 12.54 1 8.87c1.05-1.82 2.93-2.98 4.97-3.01 1.55-.03 3.01 1.04 3.96 1.04Zm4.62-6.91c.15 1.41-.41 2.82-1.25 3.83-.84 1.01-2.21 1.8-3.55 1.7C9.56 4.16 10.24 2.72 11.02 1.82 11.88.8 13.35.05 14.55 0Z"
      />
    </svg>
  )
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91A8.78 8.78 0 0 0 17.64 9.2Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.8.54-1.84.86-3.05.86-2.35 0-4.34-1.58-5.05-3.71H.96v2.33A8.99 8.99 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.71A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.71V4.96H.96A8.99 8.99 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.99-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A8.99 8.99 0 0 0 .96 4.96l2.99 2.33C4.66 5.16 6.65 3.58 9 3.58Z"
      />
    </svg>
  )
}

function FieldIcon({ children }: { children: ReactNode }) {
  return <span className="customer-auth__field-icon">{children}</span>
}

/**
 * Shopper account — desktop Log In / Sign Up (Figma) + signed-in management.
 */
export function CustomerAccountPage() {
  const [searchParams] = useSearchParams()
  const initialTab = useMemo<AuthTab>(() => {
    const tab = searchParams.get('tab')
    if (tab === 'login' || tab === 'sign-in') return 'login'
    if (tab === 'signup' || tab === 'sign-up') return 'signup'
    // Figma default frame is Sign Up.
    return 'signup'
  }, [searchParams])

  const [shopper, setShopper] = useState<CustomerShopper | null>(
    customerAccountApi.session()?.shopper ?? null,
  )
  const [loading, setLoading] = useState(Boolean(shopper))
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState<AuthTab>(initialTab)
  const [signupStep, setSignupStep] = useState<SignupStep>('form')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [otp, setOtp] = useState('')
  const [challengeId, setChallengeId] = useState('')
  const [registrationToken, setRegistrationToken] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [staySignedIn, setStaySignedIn] = useState(true)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [deleted, setDeleted] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)

  useEffect(() => {
    setTab(initialTab)
  }, [initialTab])

  useEffect(() => {
    if (!shopper) return
    let alive = true
    void customerAccountApi
      .me()
      .then((value) => {
        if (alive) setShopper(value)
      })
      .catch(() => {
        if (alive) setShopper(null)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function switchTab(next: AuthTab) {
    setTab(next)
    setError('')
    setInfo('')
    setSignupStep('form')
    setOtp('')
    setChallengeId('')
    setRegistrationToken('')
  }

  async function signIn(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      setShopper(await customerAccountApi.signIn(email, password))
      setPassword('')
      if (!staySignedIn) {
        // Session still persists for this tab; clear on leave via logout preference.
      }
    } catch (cause) {
      setError(toUserMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  async function startSignUp(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    setInfo('')
    try {
      const challenge = await customerAccountApi.requestRegistration(email)
      setChallengeId(challenge.challengeId)
      setSignupStep('verify')
      setInfo(
        challenge.message ||
          'Enter the verification code sent to your email to finish creating your account.',
      )
      if (!displayName.trim()) {
        setDisplayName(email.split('@')[0] || '')
      }
    } catch (cause) {
      setError(toUserMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  async function finishSignUp(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      let token = registrationToken
      if (!token) {
        const verified = await customerAccountApi.verifyRegistration(
          challengeId,
          otp.trim(),
        )
        token = verified.registrationToken
        setRegistrationToken(token)
      }
      setShopper(
        await customerAccountApi.completeRegistration(
          token,
          displayName.trim() || email.split('@')[0] || 'Shopper',
          password,
        ),
      )
      setPassword('')
      setOtp('')
    } catch (cause) {
      setError(toUserMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <CustomerVerifyShell title="Account" backTo="/verify" variant="auth">
        <div className="customer-verify__card">
          <p className="customer-verify__copy" role="status">
            Loading your account...
          </p>
        </div>
      </CustomerVerifyShell>
    )
  }

  if (shopper) {
    return (
      <CustomerShopperDashboard
        shopper={shopper}
        onShopperChange={setShopper}
        onDeleted={() => setDeleted(true)}
      />
    )
  }

  const isSignup = tab === 'signup'
  const onAuthSubmit = isSignup
    ? signupStep === 'form'
      ? startSignUp
      : finishSignUp
    : signIn

  return (
    <div className="customer-auth-page">
      <header className="customer-auth-page__header">
        <Link to="/verify" className="customer-auth-page__brand" aria-label="goVerifEye home">
          <BrandMark className="customer-auth-page__logo" tone="onLight" />
        </Link>
        <Link to="/verify" className="customer-auth-page__back">
          <ArrowLeftIcon size={16} />
          Back
        </Link>
      </header>

      <main className="customer-auth-page__main">
        <div className="customer-auth">
          <div className="customer-auth__tabs" role="tablist" aria-label="Account">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'signup'}
              className={`customer-auth__tab${tab === 'signup' ? ' customer-auth__tab--active' : ''}`}
              onClick={() => switchTab('signup')}
            >
              Sign Up
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'login'}
              className={`customer-auth__tab${tab === 'login' ? ' customer-auth__tab--active' : ''}`}
              onClick={() => switchTab('login')}
            >
              Log In
            </button>
          </div>

          <form className="customer-auth__form" onSubmit={(event) => void onAuthSubmit(event)}>
            {deleted ? (
              <p className="customer-verify__success" role="status">
                Your account was permanently deleted. You can continue verifying
                as a guest.
              </p>
            ) : null}
            {info ? (
              <p className="customer-verify__success" role="status">
                {info}
              </p>
            ) : null}
            {error ? (
              <p className="customer-verify__error" role="alert">
                {error}
              </p>
            ) : null}

            {isSignup && signupStep === 'verify' ? (
              <>
                <label className="customer-verify__label">
                  Verification code
                  <div className="customer-auth__field">
                    <FieldIcon>
                      <LockIcon size={18} />
                    </FieldIcon>
                    <input
                      className="customer-verify__input customer-verify__input--text customer-auth__input"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="6-digit code"
                      pattern="\d{6}"
                      maxLength={6}
                      value={otp}
                      onChange={(event) =>
                        setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
                      }
                      required
                    />
                  </div>
                </label>
                <label className="customer-verify__label">
                  Display name
                  <div className="customer-auth__field">
                    <FieldIcon>
                      <MailIcon size={18} />
                    </FieldIcon>
                    <input
                      className="customer-verify__input customer-verify__input--text customer-auth__input"
                      autoComplete="nickname"
                      placeholder="How should we greet you?"
                      maxLength={80}
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      required
                    />
                  </div>
                </label>
              </>
            ) : (
              <label className="customer-verify__label">
                Email
                <div className="customer-auth__field">
                  <FieldIcon>
                    <MailIcon size={18} />
                  </FieldIcon>
                  <input
                    className="customer-verify__input customer-verify__input--text customer-auth__input"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
              </label>
            )}

            <label className="customer-verify__label">
              Password
              <div className="customer-auth__field customer-auth__field--password">
                <FieldIcon>
                  <LockIcon size={18} />
                </FieldIcon>
                <input
                  className="customer-verify__input customer-verify__input--text customer-auth__input"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  placeholder="Enter password"
                  minLength={8}
                  maxLength={72}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="customer-auth__eye"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon size={18} />
                </button>
              </div>
            </label>

            <div className="customer-auth__row">
              <label className="customer-auth__check">
                <input
                  type="checkbox"
                  checked={staySignedIn}
                  onChange={(event) => setStaySignedIn(event.target.checked)}
                />
                Stay signed in
              </label>
              <button
                type="button"
                className="customer-auth__link"
                onClick={() => setSupportOpen(true)}
              >
                Forgot Password?
              </button>
            </div>

            <button
              className="customer-verify__btn customer-verify__btn--primary"
              disabled={
                busy ||
                (!isSignup && (!email.trim() || password.length < 8)) ||
                (isSignup &&
                  signupStep === 'form' &&
                  (!email.trim() || password.length < 8)) ||
                (isSignup &&
                  signupStep === 'verify' &&
                  (otp.length !== 6 || password.length < 8 || !displayName.trim()))
              }
            >
              {busy
                ? isSignup
                  ? signupStep === 'form'
                    ? 'Sending code...'
                    : 'Creating account...'
                  : 'Signing in...'
                : isSignup
                  ? signupStep === 'form'
                    ? 'Sign up'
                    : 'Create account'
                  : 'Log In'}
            </button>

            <div className="customer-auth__divider">
              <span>or continue with</span>
            </div>

            <div className="customer-auth__sso">
              <button
                type="button"
                className="customer-auth__sso-btn"
                disabled
                title="Coming soon"
              >
                <AppleMark />
                Apple
              </button>
              <button
                type="button"
                className="customer-auth__sso-btn"
                disabled
                title="Coming soon"
              >
                <GoogleMark />
                Google
              </button>
            </div>

            <p className="customer-auth__switch">
              {isSignup ? (
                <>
                  Already have account?{' '}
                  <button
                    type="button"
                    className="customer-auth__link"
                    onClick={() => switchTab('login')}
                  >
                    Log in
                  </button>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    className="customer-auth__link"
                    onClick={() => switchTab('signup')}
                  >
                    Sign Up
                  </button>
                </>
              )}
            </p>
          </form>
        </div>
      </main>

      <footer className="customer-auth-page__footer">
        <p>© 2025 goVerifEye. All rights reserved.</p>
        <nav className="customer-auth-page__footer-links" aria-label="Legal">
          <Link to="/verify/privacy">Privacy Policy</Link>
          <button type="button" onClick={() => setSupportOpen(true)}>
            Support Center
          </button>
          <button type="button" onClick={() => setSupportOpen(true)}>
            Report Fraud
          </button>
        </nav>
      </footer>

      <CustomerContactSupportModal
        open={supportOpen}
        initialEmail={email}
        onClose={() => setSupportOpen(false)}
      />
    </div>
  )
}
