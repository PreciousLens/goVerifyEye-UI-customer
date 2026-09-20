import { USE_MOCK_API } from './config'
import { delay, http } from './http'

export type VerifyOutcome = 'valid' | 'suspicious'
export type VerifyChannel = 'qr' | 'ocr' | 'manual'

export type VerifyProductInfo = {
  id: string
  name: string
  description: string
  form: string
  manufacturer: string
  imageUrl?: string | null
}

export type VerifySuccess = {
  valid: true
  status: string
  firstVerification: boolean
  verificationCount: number
  outcome: VerifyOutcome
  risk: 'low' | 'review_recommended' | string
  product: VerifyProductInfo
}

export type VerifyFailure = {
  valid: false
  status:
    | 'not_found'
    | 'inactive'
    | 'suspended'
    | 'product_unavailable'
    | string
}

export type VerifyResult = VerifySuccess | VerifyFailure

export type VerifyInput = {
  verificationCode: string
  location?: string
  channel?: VerifyChannel
}

export type ConcernReason =
  | 'Product details do not match the item'
  | 'Label looks damaged or reused'
  | 'Seller concern'
  | 'Product looks suspicious'
  | 'Other'

export const CONCERN_REASONS: ConcernReason[] = [
  'Product details do not match the item',
  'Label looks damaged or reused',
  'Seller concern',
  'Product looks suspicious',
  'Other',
]

export type ConcernInput = {
  receipt: string
  reason: ConcernReason
  note?: string
}

export type ConcernReceipt = {
  id: string
  submittedAt: string
}

type CustomerCheckDto = {
  receipt: string
  code: string
  channel: string
  checkedAt: string
  result: VerifyResult & {
    product?: Partial<VerifyProductInfo> & { name?: string }
  }
}

const RESULT_KEY = 'goverifyeye.verifyResult'
const CODE_KEY = 'goverifyeye.verifyCode'
const RECEIPT_KEY = 'goverifyeye.verifyReceipt'

function normalizeCode(value: string): string {
  return value.replace(/\D/g, '').slice(0, 16)
}

function mapResult(raw: CustomerCheckDto['result']): VerifyResult {
  if (!raw?.valid) {
    return {
      valid: false,
      status: raw?.status || 'not_found',
    }
  }
  const product = raw.product
  return {
    valid: true,
    status: raw.status || 'active',
    firstVerification: Boolean(raw.firstVerification),
    verificationCount: Number(raw.verificationCount ?? 0),
    outcome: raw.outcome === 'suspicious' ? 'suspicious' : 'valid',
    risk: raw.risk || 'low',
    product: {
      id: product?.id || '',
      name: product?.name || 'Product',
      description: product?.description || '',
      form: product?.form || '',
      manufacturer: product?.manufacturer || '',
      imageUrl: product?.imageUrl ?? null,
    },
  }
}

function mockVerify(code: string): {
  result: VerifyResult
  receipt: string
} {
  const receipt = `mock${code}${'0'.repeat(48)}`.slice(0, 64)
  if (code === '0000000000000000') {
    return {
      receipt,
      result: { valid: false, status: 'not_found' },
    }
  }
  if (code.endsWith('9')) {
    return {
      receipt,
      result: {
        valid: true,
        status: 'active',
        firstVerification: false,
        verificationCount: 6,
        outcome: 'suspicious',
        risk: 'review_recommended',
        product: {
          id: 'mock-product',
          name: 'Demo Product 500ml',
          description: 'Mock product used when VITE_API_BASE_URL is empty.',
          form: 'Gel',
          manufacturer: 'goVerifEye Demo Vendor Ltd',
          imageUrl: null,
        },
      },
    }
  }
  return {
    receipt,
    result: {
      valid: true,
      status: 'active',
      firstVerification: true,
      verificationCount: 1,
      outcome: 'valid',
      risk: 'low',
      product: {
        id: 'mock-product',
        name: 'Demo Product 500ml',
        description: 'Mock product used when VITE_API_BASE_URL is empty.',
        form: 'Liquid',
        manufacturer: 'goVerifEye Demo Vendor Ltd',
        imageUrl: null,
      },
    },
  }
}

export const verifyApi = {
  normalizeCode,

  isCompleteCode(value: string): boolean {
    return /^\d{16}$/.test(normalizeCode(value))
  },

  /** Extract a 16-digit code from typed input or QR payload text. */
  extractCode(raw: string): string | null {
    const digits = normalizeCode(raw)
    if (digits.length === 16) return digits
    const match = raw.match(/\d{16}/)
    return match ? match[0] : null
  },

  /**
   * Live shopper check via POST /customer/checks (returns receipt for concerns).
   * Falls back to legacy /code-batches/codes/verify if checks is unavailable.
   */
  async verify(input: VerifyInput): Promise<VerifyResult> {
    const verificationCode = normalizeCode(input.verificationCode)
    if (!/^\d{16}$/.test(verificationCode)) {
      throw new Error('Enter a valid 16-digit verification code.')
    }

    const channel = input.channel ?? 'manual'

    if (USE_MOCK_API) {
      await delay(450)
      const mocked = mockVerify(verificationCode)
      this.stashResult(mocked.result, verificationCode, mocked.receipt)
      return mocked.result
    }

    try {
      const check = await http<CustomerCheckDto>('/customer/checks', {
        method: 'POST',
        auth: false,
        body: {
          requestId: crypto.randomUUID(),
          verificationCode,
          channel,
          ...(input.location?.trim()
            ? { location: input.location.trim().slice(0, 100) }
            : {}),
        },
      })
      const result = mapResult(check.result)
      this.stashResult(result, check.code || verificationCode, check.receipt)
      return result
    } catch (primaryError) {
      // Compatibility fallback for hosts that only expose the public verify route.
      try {
        const legacy = await http<VerifyResult>('/code-batches/codes/verify', {
          method: 'POST',
          auth: false,
          body: {
            verificationCode,
            channel,
            ...(input.location?.trim()
              ? { location: input.location.trim().slice(0, 100) }
              : {}),
          },
        })
        this.stashResult(legacy, verificationCode)
        return legacy
      } catch {
        throw primaryError
      }
    }
  },

  async reportConcern(input: ConcernInput): Promise<ConcernReceipt> {
    if (USE_MOCK_API) {
      await delay(350)
      return {
        id: crypto.randomUUID(),
        submittedAt: new Date().toISOString(),
      }
    }
    if (!/^[a-f0-9]{64}$/i.test(input.receipt)) {
      throw new Error(
        'Verify the product again before submitting a concern report.',
      )
    }
    return http<ConcernReceipt>('/customer/concerns', {
      method: 'POST',
      auth: false,
      body: {
        requestId: crypto.randomUUID(),
        receipt: input.receipt,
        reason: input.reason,
        ...(input.note?.trim()
          ? { note: input.note.trim().slice(0, 500) }
          : {}),
      },
    })
  },

  stashResult(result: VerifyResult, code: string, receipt?: string | null) {
    sessionStorage.setItem(RESULT_KEY, JSON.stringify(result))
    sessionStorage.setItem(CODE_KEY, code)
    if (receipt) {
      sessionStorage.setItem(RECEIPT_KEY, receipt)
    } else if (receipt === null) {
      sessionStorage.removeItem(RECEIPT_KEY)
    }
    // undefined receipt → keep any existing receipt from /customer/checks
  },

  readStashed(): {
    result: VerifyResult
    code: string
    receipt: string | null
  } | null {
    try {
      const raw = sessionStorage.getItem(RESULT_KEY)
      const code = sessionStorage.getItem(CODE_KEY) ?? ''
      const receipt = sessionStorage.getItem(RECEIPT_KEY)
      if (!raw) return null
      return {
        result: JSON.parse(raw) as VerifyResult,
        code,
        receipt,
      }
    } catch {
      return null
    }
  },

  clearStashed() {
    sessionStorage.removeItem(RESULT_KEY)
    sessionStorage.removeItem(CODE_KEY)
    sessionStorage.removeItem(RECEIPT_KEY)
  },
}
