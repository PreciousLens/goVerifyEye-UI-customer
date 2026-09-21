import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { customerAccountApi, type CustomerShopper } from '../../api/customerAccount'
import { toUserMessage, verifyApi } from '../../api'
import { BrandMark } from '../../components/BrandMark'
import { CustomerVerifyShell } from './CustomerVerifyShell'
import { CustomerContactSupportModal } from './CustomerContactSupportModal'

type AuthTab = 'login' | 'signup'

/**
 * Shopper account — desktop Log In / Sign Up (Figma 1251:36992) + signed-in management.
 */
export function CustomerAccountPage() {
  const [shopper, setShopper] = useState<CustomerShopper | null>(
    customerAccountApi.session()?.shopper ?? null,
  )
  const [loading, setLoading] = useState(Boolean(shopper))
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState<AuthTab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [staySignedIn, setStaySignedIn] = useState(true)
  const [deletePassword, setDeletePassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [error, setError] = useState('')
  const [deleted, setDeleted] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)

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

  async function signIn(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      setShopper(await customerAccountApi.signIn(email, password))
      setPassword('')
      if (!staySignedIn) {
        // Session still persists in memory for this tab; clear on leave via logout preference.
      }
    } catch (cause) {
      setError(toUserMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  async function signOut() {
    setBusy(true)
    setError('')
    try {
      await customerAccountApi.signOut()
      setShopper(null)
    } catch (cause) {
      setError(toUserMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  async function deleteAccount(event: FormEvent) {
    event.preventDefault()
    if (busy || confirmation !== 'DELETE') return
    setBusy(true)
    setError('')
    try {
      await customerAccountApi.deleteAccount(deletePassword)
      verifyApi.clearStashed()
      setShopper(null)
      setDeleteOpen(false)
      setDeletePassword('')
      setConfirmation('')
      setDeleted(true)
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
      <CustomerVerifyShell title="Account" backTo="/verify" variant="auth">
        <div className="customer-verify__card">
          <h1 className="customer-verify__heading">Your shopper account</h1>
          {deleted ? (
            <p className="customer-verify__success" role="status">
              Your account was permanently deleted. You can continue verifying
              products as a guest.
            </p>
          ) : null}
          {error ? (
            <p className="customer-verify__error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="customer-verify__account-summary">
            <strong>{shopper.displayName?.trim() || 'Shopper'}</strong>
            <span>{shopper.email}</span>
          </div>
          <button
            type="button"
            className="customer-verify__btn customer-verify__btn--secondary"
            disabled={busy}
            onClick={() => void signOut()}
          >
            {busy ? 'Signing out...' : 'Sign out'}
          </button>
          <section
            className="customer-verify__danger"
            aria-labelledby="delete-account-heading"
          >
            <h2 id="delete-account-heading">Danger zone</h2>
            <p>
              Deleting your account permanently removes your profile and concern
              reports. Saved checks are anonymized and cannot be recovered.
            </p>
            <button
              type="button"
              className="customer-verify__btn customer-verify__btn--danger"
              disabled={busy}
              onClick={() => {
                setError('')
                setDeleteOpen(true)
              }}
            >
              Delete account
            </button>
          </section>
          <button
            type="button"
            className="customer-verify__btn customer-verify__btn--secondary"
            onClick={() => setSupportOpen(true)}
          >
            Contact support
          </button>
        </div>
        <CustomerContactSupportModal
          open={supportOpen}
          initialEmail={shopper.email}
          onClose={() => setSupportOpen(false)}
        />
        {deleteOpen ? (
          <div
            className="customer-verify__modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !busy) setDeleteOpen(false)
            }}
          >
            <form
              className="customer-verify__modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-delete-heading"
              onSubmit={(event) => void deleteAccount(event)}
            >
              <h2 id="confirm-delete-heading" className="customer-verify__heading">
                Delete account?
              </h2>
              <p className="customer-verify__copy">
                This is permanent. Your profile and concern reports will be
                deleted, all sessions will be signed out, and saved checks will
                be anonymized.
              </p>
              <label className="customer-verify__label">
                Current password
                <input
                  autoFocus
                  className="customer-verify__input customer-verify__input--text"
                  type="password"
                  autoComplete="current-password"
                  minLength={8}
                  maxLength={72}
                  value={deletePassword}
                  onChange={(event) => setDeletePassword(event.target.value)}
                  required
                />
              </label>
              <label className="customer-verify__label">
                Type DELETE to confirm
                <input
                  className="customer-verify__input customer-verify__input--text"
                  value={confirmation}
                  maxLength={6}
                  onChange={(event) =>
                    setConfirmation(event.target.value.toUpperCase())
                  }
                  required
                />
              </label>
              {error ? (
                <p className="customer-verify__error" role="alert">
                  {error}
                </p>
              ) : null}
              <button
                className="customer-verify__btn customer-verify__btn--danger"
                disabled={
                  busy || deletePassword.length < 8 || confirmation !== 'DELETE'
                }
              >
                {busy ? 'Deleting account...' : 'Permanently delete account'}
              </button>
              <button
                type="button"
                className="customer-verify__btn customer-verify__btn--secondary"
                disabled={busy}
                onClick={() => {
                  setDeleteOpen(false)
                  setDeletePassword('')
                  setConfirmation('')
                  setError('')
                }}
              >
                Cancel
              </button>
            </form>
          </div>
        ) : null}
      </CustomerVerifyShell>
    )
  }

  return (
    <CustomerVerifyShell title="Account" backTo="/verify" variant="auth">
      <div className="customer-auth">
        <div className="customer-auth__brand">
          <BrandMark className="customer-auth__logo" tone="onLight" />
        </div>

        <div className="customer-auth__tabs" role="tablist" aria-label="Account">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'login'}
            className={`customer-auth__tab${tab === 'login' ? ' customer-auth__tab--active' : ''}`}
            onClick={() => {
              setTab('login')
              setError('')
            }}
          >
            Log In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'signup'}
            className={`customer-auth__tab${tab === 'signup' ? ' customer-auth__tab--active' : ''}`}
            onClick={() => {
              setTab('signup')
              setError('')
            }}
          >
            Sign Up
          </button>
        </div>

        {tab === 'login' ? (
          <form className="customer-auth__form" onSubmit={(event) => void signIn(event)}>
            {deleted ? (
              <p className="customer-verify__success" role="status">
                Your account was permanently deleted. You can continue verifying
                as a guest.
              </p>
            ) : null}
            {error ? (
              <p className="customer-verify__error" role="alert">
                {error}
              </p>
            ) : null}

            <label className="customer-verify__label">
              Email
              <input
                className="customer-verify__input customer-verify__input--text"
                type="email"
                autoComplete="email"
                placeholder="Enter email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label className="customer-verify__label">
              Password
              <div className="customer-auth__password">
                <input
                  className="customer-verify__input customer-verify__input--text"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
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
                  {showPassword ? 'Hide' : 'Show'}
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
              disabled={busy || !email.trim() || password.length < 8}
            >
              {busy ? 'Signing in...' : 'Log In'}
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
                Apple
              </button>
              <button
                type="button"
                className="customer-auth__sso-btn"
                disabled
                title="Coming soon"
              >
                Google
              </button>
            </div>

            <p className="customer-auth__switch">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                className="customer-auth__link"
                onClick={() => setTab('signup')}
              >
                Sign Up
              </button>
            </p>

            <Link className="customer-verify__btn customer-verify__btn--ghost" to="/verify">
              Continue as guest
            </Link>
          </form>
        ) : (
          <div className="customer-auth__form">
            <h1 className="customer-verify__heading">Create a shopper account</h1>
            <p className="customer-verify__copy">
              Self-serve sign-up is not enabled on this build yet. Contact support
              to create a shopper account, or continue verifying products as a
              guest.
            </p>
            <button
              type="button"
              className="customer-verify__btn customer-verify__btn--primary"
              onClick={() => setSupportOpen(true)}
            >
              Contact support
            </button>
            <button
              type="button"
              className="customer-verify__btn customer-verify__btn--secondary"
              onClick={() => setTab('login')}
            >
              Back to Log In
            </button>
            <Link className="customer-verify__btn customer-verify__btn--ghost" to="/verify">
              Continue as guest
            </Link>
          </div>
        )}
      </div>

      <CustomerContactSupportModal
        open={supportOpen}
        initialEmail={email}
        onClose={() => setSupportOpen(false)}
      />
    </CustomerVerifyShell>
  )
}
