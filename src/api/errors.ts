export type ApiErrorBody = {
  code: string
  message: string
  details?: unknown
}

/** Nest Problem Details + legacy `{ code, message }` shapes. */
export type ProblemDetailsLike = {
  code?: string
  message?: string
  title?: string
  detail?: string | string[]
  details?: unknown
  status?: number
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown

  constructor(status: number, body: ApiErrorBody) {
    super(body.message || 'Request failed')
    this.name = 'ApiError'
    this.status = status
    this.code = body.code || 'INTERNAL_ERROR'
    this.details = body.details
  }
}

export function normalizeApiErrorBody(
  data: unknown,
  fallbackStatusText: string,
): ApiErrorBody {
  const body = (data ?? {}) as ProblemDetailsLike
  const detail = body.detail
  const detailText = Array.isArray(detail)
    ? detail.filter(Boolean).join('. ')
    : typeof detail === 'string'
      ? detail
      : ''

  return {
    code: body.code ?? 'INTERNAL_ERROR',
    message:
      body.message?.trim() ||
      detailText.trim() ||
      body.title?.trim() ||
      fallbackStatusText ||
      'Request failed',
    details: body.details ?? (Array.isArray(detail) ? detail : undefined),
  }
}

export function toUserMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Something went wrong. Please try again.'
}
