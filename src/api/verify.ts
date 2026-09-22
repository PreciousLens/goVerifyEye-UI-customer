import { API_BASE_URL, API_PREFIX, USE_MOCK_API } from './config'
import { delay, http } from './http'
import { customerAccountApi } from './customerAccount'

export type VerifyOutcome = 'valid' | 'suspicious' | 'flagged'
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
  explanation?: string
  batchReference?: string
  product: VerifyProductInfo
}

export type VerifyFailure = {
  valid: false
  status:
    | 'not_found'
    | 'not_recognised'
    | 'invalid'
    | 'inactive'
    | 'suspended'
    | 'under_review'
    | 'recalled'
    | 'flagged'
    | 'product_unavailable'
    | string
  verificationCount?: number
  explanation?: string
  guidance?: string
  batchReference?: string
  /** ISO date from recall.effectiveAt when status is recalled. */
  recallEffectiveAt?: string
  product?: VerifyProductInfo
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

export type CustomerActivityGroup = {
  date: string
  area: string
  checks: number
}

export type CustomerActivity = {
  totalChecks: number
  locations: number
  groups: CustomerActivityGroup[]
  capped: true
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
const CHECKED_AT_KEY = 'goverifyeye.verifyCheckedAt'

function normalizeCode(value: string): string {
  return value.replace(/\D/g, '').slice(0, 16)
}

function mapResult(raw: CustomerCheckDto['result']): VerifyResult {
  const productRaw = raw.product
  const product: VerifyProductInfo | undefined = productRaw
    ? {
        id: productRaw.id || '',
        name: productRaw.name || 'Product',
        description: productRaw.description || '',
        form: productRaw.form || '',
        manufacturer: productRaw.manufacturer || '',
        imageUrl: productRaw.imageUrl ?? null,
      }
    : undefined

  if (!raw?.valid) {
    const recall = (
      raw as {
        recall?: {
          guidance?: string
          reason?: string
          effectiveAt?: string
        }
      }
    ).recall
    const batchRef = (raw as { batch?: { reference?: string } }).batch
      ?.reference
    return {
      valid: false,
      status: raw?.status || 'not_found',
      verificationCount: Number(
        (raw as { verificationCount?: number }).verificationCount ?? 0,
      ),
      explanation:
        typeof (raw as { explanation?: unknown }).explanation === 'string'
          ? (raw as { explanation: string }).explanation
          : recall?.reason,
      guidance: recall?.guidance,
      ...(recall?.effectiveAt ? { recallEffectiveAt: recall.effectiveAt } : {}),
      ...(batchRef ? { batchReference: batchRef } : {}),
      ...(product ? { product } : {}),
    }
  }

  const batchRef = (raw as { batch?: { reference?: string } }).batch?.reference
  return {
    valid: true,
    status: raw.status || 'active',
    firstVerification:
      Boolean(raw.firstVerification) || Number(raw.verificationCount ?? 0) === 1,
    verificationCount: Number(raw.verificationCount ?? 0),
    outcome:
      raw.outcome === 'flagged'
        ? 'flagged'
        : raw.outcome === 'suspicious'
          ? 'suspicious'
          : 'valid',
    risk: raw.risk || 'low',
    explanation:
      typeof (raw as { explanation?: unknown }).explanation === 'string'
        ? (raw as { explanation: string }).explanation
        : undefined,
    ...(batchRef ? { batchReference: batchRef } : {}),
    product: product ?? {
      id: '',
      name: 'Product',
      description: '',
      form: '',
      manufacturer: '',
      imageUrl: null,
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
  if (code.endsWith('5')) {
    return {
      receipt,
      result: { valid: false, status: 'invalid' },
    }
  }
  if (code.endsWith('4')) {
    return {
      receipt,
      result: {
        valid: false,
        status: 'recalled',
        verificationCount: 9,
        guidance: 'Contact the seller or manufacturer for return guidance.',
        recallEffectiveAt: '2026-08-18',
        product: {
          id: 'mock-product',
          name: 'Demo Product 500ml',
          description: 'Mock product used when VITE_API_BASE_URL is empty.',
          form: 'Liquid',
          manufacturer: 'goVerifEye Demo Vendor Ltd',
          imageUrl: null,
        },
        batchReference: 'BC-123464',
      },
    }
  }
  if (code.endsWith('7')) {
    return {
      receipt,
      result: {
        valid: false,
        status: 'under_review',
        verificationCount: 11,
        explanation:
          'unusual verification activity requires review. Ask the seller for another verifiable item or check again later.',
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
  if (code.endsWith('6')) {
    return {
      receipt,
      result: {
        valid: false,
        status: 'flagged',
        verificationCount: 11,
        explanation:
          'goVerifEye found serious conflicting use of this code. Review the verification details for the evidence available to shoppers.',
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
  if (code.endsWith('9')) {
    return {
      receipt,
      result: {
        valid: true,
        status: 'active',
        firstVerification: false,
        verificationCount: 28,
        outcome: 'suspicious',
        risk: 'review_recommended',
        explanation:
          'This code was checked in far-apart locations within a short period.',
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
  if (code.endsWith('8')) {
    return {
      receipt,
      result: {
        valid: true,
        status: 'active',
        firstVerification: false,
        verificationCount: 12,
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
  return {
    receipt,
    result: {
      valid: true,
      status: 'active',
      firstVerification: true,
      verificationCount: 1,
      outcome: 'valid',
      risk: 'low',
      batchReference: 'BC-123464',
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
      this.stashResult(
        mocked.result,
        verificationCode,
        mocked.receipt,
        new Date().toISOString(),
      )
      return mocked.result
    }

    try {
      const shopperToken = customerAccountApi.session()?.accessToken
      const check = await http<CustomerCheckDto>('/customer/checks', {
        method: 'POST',
        auth: false,
        headers: shopperToken
          ? { Authorization: `Bearer ${shopperToken}` }
          : undefined,
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
      this.stashResult(
        result,
        check.code || verificationCode,
        check.receipt,
        check.checkedAt,
      )
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
        this.stashResult(legacy, verificationCode, null, new Date().toISOString())
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

  async activity(receipt: string): Promise<CustomerActivity> {
    if (USE_MOCK_API) {
      await delay(200)
      const today = new Date()
      const d1 = new Date(today)
      d1.setDate(today.getDate() - 1)
      const d2 = new Date(today)
      d2.setDate(today.getDate() - 2)
      const d5 = new Date(today)
      d5.setDate(today.getDate() - 5)
      return {
        totalChecks: 24,
        locations: 2,
        capped: true,
        groups: [
          {
            date: today.toISOString().slice(0, 10),
            area: 'Lagos',
            checks: 4,
          },
          {
            date: today.toISOString().slice(0, 10),
            area: 'Kano',
            checks: 2,
          },
          {
            date: d1.toISOString().slice(0, 10),
            area: 'Abuja',
            checks: 8,
          },
          {
            date: d2.toISOString().slice(0, 10),
            area: 'Lagos',
            checks: 6,
          },
          {
            date: d5.toISOString().slice(0, 10),
            area: 'Lagos',
            checks: 4,
          },
        ],
      }
    }
    if (!/^[a-f0-9]{64}$/i.test(receipt)) {
      return { totalChecks: 0, locations: 0, groups: [], capped: true }
    }
    return http<CustomerActivity>(
      `/customer/checks/${encodeURIComponent(receipt)}/activity`,
      { method: 'GET', auth: false },
    )
  },

  shareUrl(receipt: string): string {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : ''
    const base = API_BASE_URL || origin
    return `${base}${API_PREFIX}/customer/shared/${encodeURIComponent(receipt)}`
  },

  stashResult(
    result: VerifyResult,
    code: string,
    receipt?: string | null,
    checkedAt?: string | null,
  ) {
    sessionStorage.setItem(RESULT_KEY, JSON.stringify(result))
    sessionStorage.setItem(CODE_KEY, code)
    if (receipt) {
      sessionStorage.setItem(RECEIPT_KEY, receipt)
    } else if (receipt === null) {
      sessionStorage.removeItem(RECEIPT_KEY)
    }
    if (checkedAt) {
      sessionStorage.setItem(CHECKED_AT_KEY, checkedAt)
    } else if (checkedAt === null) {
      sessionStorage.removeItem(CHECKED_AT_KEY)
    }
  },

  readStashed(): {
    result: VerifyResult
    code: string
    receipt: string | null
    checkedAt: string | null
  } | null {
    try {
      const raw = sessionStorage.getItem(RESULT_KEY)
      const code = sessionStorage.getItem(CODE_KEY) ?? ''
      const receipt = sessionStorage.getItem(RECEIPT_KEY)
      const checkedAt = sessionStorage.getItem(CHECKED_AT_KEY)
      if (!raw) return null
      return {
        result: JSON.parse(raw) as VerifyResult,
        code,
        receipt,
        checkedAt,
      }
    } catch {
      return null
    }
  },

  clearStashed() {
    sessionStorage.removeItem(RESULT_KEY)
    sessionStorage.removeItem(CODE_KEY)
    sessionStorage.removeItem(RECEIPT_KEY)
    sessionStorage.removeItem(CHECKED_AT_KEY)
  },
}
