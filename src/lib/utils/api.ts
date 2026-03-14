import { NextResponse } from 'next/server'

import type { ApiError, ApiSuccess } from '@/types'

export function successResponse<T>(data: T, message: string, status = 200) {
  return NextResponse.json<ApiSuccess<T>>({ data, message }, { status })
}

export function errorResponse(error: string, code: string, status = 400) {
  return NextResponse.json<ApiError>({ error, code }, { status })
}

export async function parseJsonResponse<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T | ApiError

  if (!response.ok) {
    const message =
      typeof body === 'object' && body !== null && 'error' in body
        ? (body as ApiError).error
        : 'Request failed'
    throw new Error(message)
  }

  return body as T
}
