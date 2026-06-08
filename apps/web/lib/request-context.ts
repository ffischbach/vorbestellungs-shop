import { AsyncLocalStorage } from 'async_hooks'
import type { NextRequest } from 'next/server'

export interface RequestContext {
  requestId: string
  sessionId?: string
  method?: string
  path?: string
}

export const requestContextStorage = new AsyncLocalStorage<RequestContext>()

export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore()
}

export function withRequestContext<T>(
  req: NextRequest,
  fn: () => Promise<T>,
): Promise<T> {
  const context: RequestContext = {
    requestId: req.headers.get('x-request-id') ?? crypto.randomUUID(),
    method: req.method,
    path: req.nextUrl.pathname,
  }
  return requestContextStorage.run(context, fn)
}

export function runWithSessionId<T>(sessionId: string, fn: () => Promise<T>): Promise<T> {
  if (!sessionId) return fn()
  const existing = requestContextStorage.getStore()
  const context: RequestContext = existing
    ? { ...existing, sessionId }
    : { requestId: crypto.randomUUID(), sessionId }
  return requestContextStorage.run(context, fn)
}
