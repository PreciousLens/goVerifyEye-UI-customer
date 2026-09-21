import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toUserMessage, verifyApi } from '../../api'
import { CustomerVerifyShell } from './CustomerVerifyShell'
import { CustomerVerifyingOverlay } from './CustomerVerifyingOverlay'

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>
}

/**
 * Customer — camera QR scan with desktop dual-panel layout (Figma 1251:37460).
 */
export function CustomerScanVerifyPage() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const verifyingRef = useRef(false)

  const [cameraError, setCameraError] = useState('')
  const [status, setStatus] = useState('Starting camera…')
  const [searching, setSearching] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function runVerify(raw: string, channel: 'qr' | 'ocr' | 'manual' = 'qr') {
    const code = verifyApi.extractCode(raw)
    if (!code || verifyingRef.current) return
    verifyingRef.current = true
    setBusy(true)
    setError('')
    setStatus('Code found — verifying…')
    try {
      await verifyApi.verify({
        verificationCode: code,
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
          'Live QR scanning is not supported in this browser. Use Manual Entry or Browse Gallery.',
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
        setStatus('Align QR code within the frame to scan')
        setSearching(true)

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
          'Camera permission was denied or unavailable. Use Manual Entry or Browse Gallery.',
        )
        setStatus('Manual entry ready')
        setSearching(false)
      }
    }

    void start()
    return () => {
      cancelled = true
      stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate])

  async function handleGallery(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || busy) return

    const Detector = (
      window as unknown as {
        BarcodeDetector?: new (options?: {
          formats?: string[]
        }) => BarcodeDetectorLike
      }
    ).BarcodeDetector

    if (!Detector) {
      setError('This browser cannot read QR codes from photos. Enter the code manually.')
      return
    }

    setBusy(true)
    setError('')
    setStatus('Reading photo…')
    try {
      const bitmap = await createImageBitmap(file)
      const detector = new Detector({ formats: ['qr_code', 'code_128', 'ean_13'] })
      const codes = await detector.detect(bitmap)
      bitmap.close()
      const raw = codes[0]?.rawValue
      if (!raw) {
        setError('No QR code found in that photo. Try another image or enter the code manually.')
        setBusy(false)
        setStatus('Scan again or enter the code manually')
        return
      }
      verifyingRef.current = false
      await runVerify(raw, 'ocr')
    } catch (err) {
      setError(toUserMessage(err))
      setBusy(false)
      setStatus('Scan again or enter the code manually')
    }
  }

  return (
    <CustomerVerifyShell title="Scan QR Code" backTo="/verify" variant="scan">
      <CustomerVerifyingOverlay open={busy} />

      <div className="customer-scan">
        <section className="customer-scan__panel customer-scan__panel--guide">
          <span className="customer-scan__pill">Secured Product Verification</span>
          <h1 className="customer-scan__heading">Scan Authenticity Code</h1>
          <p className="customer-scan__copy">
            Align the product&apos;s official QR code within the camera frame on
            the right. Our secure cryptographic system will instantly verify its
            authenticity.
          </p>

          <div className="customer-scan__divider" aria-hidden="true" />

          <p className="customer-scan__alt-label">Alternative Verification Methods</p>
          <div className="customer-scan__alts">
            <Link to="/verify/manual" className="customer-scan__alt">
              <span className="customer-scan__alt-icon" aria-hidden="true">
                ⌨
              </span>
              <span>
                <strong>Manual Entry</strong>
                <small>Type serial code</small>
              </span>
            </Link>
            <button
              type="button"
              className="customer-scan__alt"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
            >
              <span className="customer-scan__alt-icon" aria-hidden="true">
                ▤
              </span>
              <span>
                <strong>Browse Gallery</strong>
                <small>Upload code photo</small>
              </span>
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="customer-scan__file"
            onChange={(event) => {
              void handleGallery(event)
            }}
          />

          {error ? (
            <p className="customer-verify__error" role="alert">
              {error}
            </p>
          ) : null}
          {cameraError ? (
            <p className="customer-verify__error" role="status">
              {cameraError}
            </p>
          ) : null}
        </section>

        <section className="customer-scan__panel customer-scan__panel--viewfinder">
          <div className="customer-scan__viewfinder">
            {!cameraError ? (
              <video
                ref={videoRef}
                className="customer-scan__video"
                playsInline
                muted
              />
            ) : (
              <div className="customer-scan__fallback">Camera unavailable</div>
            )}
            <div className="customer-scan__brackets" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="customer-scan__laser" aria-hidden="true" />
          </div>
          <p className="customer-scan__status">{status}</p>
          {searching && !busy && !cameraError ? (
            <p className="customer-scan__searching">Searching for code...</p>
          ) : null}
        </section>
      </div>
    </CustomerVerifyShell>
  )
}
