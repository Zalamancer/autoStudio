export interface ApiError {
  error: string
  code: string
  details?: unknown
}

export function apiError(res: import('express').Response, status: number, error: string, code: string, details?: unknown) {
  const body: ApiError = { error, code }
  if (details !== undefined) body.details = details
  res.status(status).json(body)
}
