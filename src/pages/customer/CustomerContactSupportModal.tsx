import { useEffect, useRef, useState, type FormEvent } from 'react'
import { customerAccountApi } from '../../api/customerAccount'
import { toUserMessage } from '../../api'
import './CustomerContactSupportModal.css'

type Props = { open: boolean; initialEmail?: string; onClose: () => void }

const supportedTypes = new Set(['image/jpeg', 'image/png', 'application/pdf'])

async function attachmentPayload(file: File) {
  if (!supportedTypes.has(file.type) || file.size > 3_000_000) throw new Error('Choose a JPEG, PNG, or PDF attachment smaller than 3 MB.')
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read the attachment.'))
    reader.onerror = () => reject(new Error('Could not read the attachment.'))
    reader.readAsDataURL(file)
  })
  const safeName = file.name.replace(/[^A-Za-z0-9._ ()-]/g, '_').slice(0, 120) || 'support-attachment'
  return { attachmentName: safeName, attachmentMimeType: file.type as 'image/jpeg' | 'image/png' | 'application/pdf', attachmentBase64: dataUrl.split(',')[1] ?? '' }
}

export function CustomerContactSupportModal({ open, initialEmail = '', onClose }: Props) {
  const signedInEmail = customerAccountApi.session()?.shopper.email ?? ''
  const [email, setEmail] = useState(initialEmail || signedInEmail)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState<{ reference: string; submittedAt: string } | null>(null)
  const requestId = useRef(crypto.randomUUID())

  useEffect(() => { if (open) setEmail(initialEmail || signedInEmail) }, [initialEmail, open, signedInEmail])

  function close() { if (!busy) { if (receipt) done(); else { setError(''); onClose() } } }
  function done() { setSubject(''); setMessage(''); setFile(null); setReceipt(null); setError(''); requestId.current = crypto.randomUUID(); onClose() }
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError('')
    try {
      const attachment = file ? await attachmentPayload(file) : {}
      setReceipt(await customerAccountApi.contactSupport({ requestId: requestId.current, email: (signedInEmail || email).trim().toLowerCase(), subject: subject.trim(), message: message.trim(), ...attachment }))
    } catch (cause) {
      // /customer/support is not on all API builds yet — fall back to mail.
      const body = [
        `From: ${(signedInEmail || email).trim().toLowerCase()}`,
        `Subject: ${subject.trim()}`,
        '',
        message.trim(),
        file ? `\nAttachment selected: ${file.name} (please attach manually in your mail app)` : '',
      ].join('\n')
      window.location.href = `mailto:support@goverifeye.com?subject=${encodeURIComponent(subject.trim())}&body=${encodeURIComponent(body)}`
      setError(toUserMessage(cause) + ' Opening your email app as a fallback…')
    }
    finally { setBusy(false) }
  }

  if (!open) return null
  return <div className="customer-support__backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close() }}>
    <form className="customer-support__modal" role="dialog" aria-modal="true" aria-labelledby="customer-support-title" onSubmit={(event) => void submit(event)}>
      {receipt ? <>
        <h2 id="customer-support-title">Request received</h2>
        <p className="customer-support__success">Your request was sent to the platform team. A receipt was emailed to {signedInEmail || email}.</p>
        <p><strong>Reference:</strong> {receipt.reference}</p><p>Submitted {new Date(receipt.submittedAt).toLocaleString()}</p>
        <button type="button" className="customer-support__primary" onClick={done}>Done</button>
      </> : <>
        <h2 id="customer-support-title">Contact support</h2>
        <p>Describe what you need help with. Platform administrators will receive the request and you will receive an email receipt.</p>
        {signedInEmail ? <p><strong>Reply email:</strong> {signedInEmail}</p> : <label>Email<input type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} required /></label>}
        <label>Subject<input maxLength={120} minLength={3} value={subject} onChange={(event) => setSubject(event.target.value)} required /></label>
        <label>Request<textarea maxLength={5000} minLength={10} rows={6} value={message} onChange={(event) => setMessage(event.target.value)} required /></label>
        <label>Attachment <span>(optional)</span><input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(event) => { const next = event.target.files?.[0] ?? null; if (next && (!supportedTypes.has(next.type) || next.size > 3_000_000)) { setError('Choose a JPEG, PNG, or PDF attachment smaller than 3 MB.'); event.target.value = ''; setFile(null); } else { setError(''); setFile(next) } }} /></label>
        {file ? <small>{file.name}</small> : null}{error ? <p className="customer-support__error" role="alert">{error}</p> : null}
        <button className="customer-support__primary" disabled={busy}>{busy ? 'Sending request...' : 'Send request'}</button>
        <button type="button" className="customer-support__secondary" disabled={busy} onClick={close}>Cancel</button>
      </>}
    </form>
  </div>
}
