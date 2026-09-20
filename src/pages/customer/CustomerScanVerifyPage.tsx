import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toUserMessage, verifyApi } from '../../api'
import { CustomerVerifyShell } from './CustomerVerifyShell'

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>
}

/**
 * Customer — camera QR/barcode scan with manual fallback.
 * Uses BarcodeDetector when available; otherwise prompts to enter code.
 */
export function CustomerScanVerifyPage() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const verifyingRef = useRef(false)

  const [cameraError, setCameraError] = useState('')
  const [status, setStatus] = useState('Starting camera…')
  const [manualCode, setManualCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function runVerify(raw: string, channel: 'qr' | 'manual' = 'qr') {
    const code = verifyApi.extractCode(raw)
    if (!code || verifyingRef.current) return
    verifyingRef.current = true
    setBusy(true)
    setError('')
    setStatus('Code found — verifying…')
    try {
      await verifyApi.verify({
        verificationCode: code,
        location: undefined,
        channel,
      })
      stopCamera()
      navigate('/verify/result', { replace: true })
    } catch (err) {
      setError(toUserMessage(err))
      setStatus('Scan again or enter the code manually')
      verifyingRef.current = false
      setBusy(false)
    }
  }

  function stopCamera() {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  useEffect(() => {
    let cancelled = false

    async function start() {
      const Detector = (
        window as unknown as {
          BarcodeDetector?: new (options?: {
            formats?: string[]
          }) => BarcodeDetectorLike
        }
      ).BarcodeDetector

      if (!Detector) {
        setCameraError(
          'Live QR scanning is not supported in this browser. Enter the code manually below.',
        )
        setStatus('Manual entry ready')
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()
        setStatus('Align the QR code inside the frame')

        const detector = new Detector({
          formats: ['qr_code', 'code_128', 'ean_13'],
        })

        const tick = async () => {
          if (cancelled || verifyingRef.current) return
          try {
            if (video.readyState >= 2) {
              const codes = await detector.detect(video)
              const raw = codes[0]?.rawValue
              if (raw) await runVerify(raw)
            }
          } catch {
            // Keep scanning on transient detect errors.
          }
          rafRef.current = requestAnimationFrame(() => {
            void tick()
          })
        }
        rafRef.current = requestAnimationFrame(() => {
          void tick()
        })
      } catch {
        setCameraError(
          'Camera permission was denied or unavailable. Enter the code manually below.',
        )
        setStatus('Manual entry ready')
      }
    }

    void start()
    return () => {
      cancelled = true
      stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate])

  async function handleManualSubmit() {
    const code = verifyApi.normalizeCode(manualCode)
    if (!verifyApi.isCompleteCode(code) || busy) return
    await runVerify(code, 'manual')
  }

  return (
    <CustomerVerifyShell title="Scan code" backTo="/verify">
      <div className="customer-verify__card">
        <h1 className="customer-verify__heading">Scan product code</h1>
        <p className="customer-verify__copy">{status}</p>

        {!cameraError ? (
          <div className="customer-verify__scan-frame">
            <video
              ref={videoRef}
              className="customer-verify__video"
              playsInline
              muted
            />
            <div className="customer-verify__scan-overlay" aria-hidden="true" />
          </div>
        ) : (
          <p className="customer-verify__error" role="status">
            {cameraError}
          </p>
        )}

        {error ? (
          <p className="customer-verify__error" role="alert">
            {error}
          </p>
        ) : null}

        <label className="customer-verify__label">
          Or type the 16-digit code
          <input
            className="customer-verify__input"
            inputMode="numeric"
            name="verificationCode"
            placeholder="•••• •••• •••• ••••"
            value={verifyApi.normalizeCode(manualCode)}
            onChange={(event) => setManualCode(event.target.value)}
            maxLength={16}
          />
        </label>

        <button
          type="button"
          className="customer-verify__btn customer-verify__btn--primary"
          disabled={!verifyApi.isCompleteCode(manualCode) || busy}
          onClick={() => {
            void handleManualSubmit()
          }}
        >
          {busy ? 'Verifying…' : 'Verify typed code'}
        </button>

        <Link
          to="/verify/manual"
          className="customer-verify__btn customer-verify__btn--ghost"
        >
          Open full manual entry
        </Link>
      </div>
    </CustomerVerifyShell>
  )
}
