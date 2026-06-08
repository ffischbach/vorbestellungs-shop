import { AsyncLocalStorage } from 'async_hooks'
import type { NextRequest } from 'next/server'

export interface RequestContext {
  requestId: string
  method: string
  path: string
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
