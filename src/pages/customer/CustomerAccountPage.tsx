import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { customerAccountApi, type CustomerShopper } from '../../api/customerAccount'
import { toUserMessage, verifyApi } from '../../api'
import { CustomerVerifyShell } from './CustomerVerifyShell'
import { CustomerContactSupportModal } from './CustomerContactSupportModal'

export function CustomerAccountPage() {
  const [shopper, setShopper] = useState<CustomerShopper | null>(customerAccountApi.session()?.shopper ?? null)
  const [loading, setLoading] = useState(Boolean(shopper))
  const [busy, setBusy] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [error, setError] = useState('')
  const [deleted, setDeleted] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)

  useEffect(() => {
    if (!shopper) return
    let alive = true
    void customerAccountApi.me()
      .then((value) => { if (alive) setShopper(value) })
      .catch(() => { if (alive) setShopper(null) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
    // Validate the restored session once when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function signIn(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError('')
    try { setShopper(await customerAccountApi.signIn(email, password)); setPassword('') }
    catch (cause) { setError(toUserMessage(cause)) }
    finally { setBusy(false) }
  }

  async function signOut() {
    setBusy(true); setError('')
    try { await customerAccountApi.signOut(); setShopper(null) }
    catch (cause) { setError(toUserMessage(cause)) }
    finally { setBusy(false) }
  }

  async function deleteAccount(event: FormEvent) {
    event.preventDefault()
    if (busy || confirmation !== 'DELETE') return
    setBusy(true); setError('')
    try {
      await customerAccountApi.deleteAccount(deletePassword)
      verifyApi.clearStashed()
      setShopper(null); setDeleteOpen(false); setDeletePassword(''); setConfirmation(''); setDeleted(true)
    } catch (cause) { setError(toUserMessage(cause)) }
    finally { setBusy(false) }
  }

  if (loading) return <CustomerVerifyShell title="Account"><div className="customer-verify__card"><p className="customer-verify__copy" role="status">Loading your account...</p></div></CustomerVerifyShell>

  return <CustomerVerifyShell title="Account">
    <div className="customer-verify__card">
      <h1 className="customer-verify__heading">Your shopper account</h1>
      {deleted ? <p className="customer-verify__success" role="status">Your account was permanently deleted. You can continue verifying products as a guest.</p> : null}
      {error ? <p className="customer-verify__error" role="alert">{error}</p> : null}
      {shopper ? <>
        <div className="customer-verify__account-summary"><strong>{shopper.displayName?.trim() || 'Shopper'}</strong><span>{shopper.email}</span></div>
        <button type="button" className="customer-verify__btn customer-verify__btn--secondary" disabled={busy} onClick={() => void signOut()}>{busy ? 'Signing out...' : 'Sign out'}</button>
        <section className="customer-verify__danger" aria-labelledby="delete-account-heading">
          <h2 id="delete-account-heading">Danger zone</h2>
          <p>Deleting your account permanently removes your profile and concern reports. Saved checks are anonymized and cannot be recovered.</p>
          <button type="button" className="customer-verify__btn customer-verify__btn--danger" disabled={busy} onClick={() => { setError(''); setDeleteOpen(true) }}>Delete account</button>
        </section>
      </> : <form className="customer-verify__actions" onSubmit={(event) => void signIn(event)}>
        <p className="customer-verify__copy">Sign in to manage or permanently delete your shopper account.</p>
        <label className="customer-verify__label">Email<input className="customer-verify__input customer-verify__input--text" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label className="customer-verify__label">Password<input className="customer-verify__input customer-verify__input--text" type="password" autoComplete="current-password" minLength={8} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        <button className="customer-verify__btn customer-verify__btn--primary" disabled={busy || !email.trim() || password.length < 8}>{busy ? 'Signing in...' : 'Sign in'}</button>
        <Link className="customer-verify__btn customer-verify__btn--secondary" to="/verify">Continue as guest</Link>
      </form>}
      <button type="button" className="customer-verify__btn customer-verify__btn--secondary" onClick={() => setSupportOpen(true)}>Contact support</button>
    </div>
    <CustomerContactSupportModal open={supportOpen} initialEmail={shopper?.email || email} onClose={() => setSupportOpen(false)} />
    {deleteOpen ? <div className="customer-verify__modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setDeleteOpen(false) }}>
      <form className="customer-verify__modal" role="dialog" aria-modal="true" aria-labelledby="confirm-delete-heading" onSubmit={(event) => void deleteAccount(event)}>
        <h2 id="confirm-delete-heading" className="customer-verify__heading">Delete account?</h2>
        <p className="customer-verify__copy">This is permanent. Your profile and concern reports will be deleted, all sessions will be signed out, and saved checks will be anonymized.</p>
        <label className="customer-verify__label">Current password<input autoFocus className="customer-verify__input customer-verify__input--text" type="password" autoComplete="current-password" minLength={8} maxLength={72} value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} required /></label>
        <label className="customer-verify__label">Type DELETE to confirm<input className="customer-verify__input customer-verify__input--text" value={confirmation} maxLength={6} onChange={(event) => setConfirmation(event.target.value.toUpperCase())} required /></label>
        {error ? <p className="customer-verify__error" role="alert">{error}</p> : null}
        <button className="customer-verify__btn customer-verify__btn--danger" disabled={busy || deletePassword.length < 8 || confirmation !== 'DELETE'}>{busy ? 'Deleting account...' : 'Permanently delete account'}</button>
        <button type="button" className="customer-verify__btn customer-verify__btn--secondary" disabled={busy} onClick={() => { setDeleteOpen(false); setDeletePassword(''); setConfirmation(''); setError('') }}>Cancel</button>
      </form>
    </div> : null}
  </CustomerVerifyShell>
}
