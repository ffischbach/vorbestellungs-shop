/**
 * Einfacher In-Memory Rate-Limiter für Auth-Endpunkte.
 *
 * Da die App Single-Instance deployed wird (ein Docker-Container pro Verein),
 * reicht eine prozess-globale Map. Bei horizontaler Skalierung müsste dies
 * durch Redis o.ä. ersetzt werden.
 *
 * INV-04: Aufrufer müssen den x-real-ip-Header verwenden (von Caddy gesetzt),
 * nicht x-forwarded-for — siehe docs/domain/invariants.md
 */

interface RateLimitEntry {
  attempts: number
  firstAttempt: number
}

const store = new Map<string, RateLimitEntry>()

const WINDOW_MS = 15 * 60 * 1000 // 15 Minuten
const MAX_ATTEMPTS = 5

function cleanup() {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now - entry.firstAttempt > WINDOW_MS) {
      store.delete(key)
    }
  }
}

// Alle 5 Minuten aufräumen
setInterval(cleanup, 5 * 60 * 1000)

export function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry) {
    store.set(key, { attempts: 1, firstAttempt: now })
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, resetInSeconds: WINDOW_MS / 1000 }
  }

  if (now - entry.firstAttempt > WINDOW_MS) {
    // Fenster abgelaufen — zurücksetzen
    store.set(key, { attempts: 1, firstAttempt: now })
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, resetInSeconds: WINDOW_MS / 1000 }
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    const resetInSeconds = Math.ceil((WINDOW_MS - (now - entry.firstAttempt)) / 1000)
    return { allowed: false, remaining: 0, resetInSeconds }
  }

  entry.attempts += 1
  return { allowed: true, remaining: MAX_ATTEMPTS - entry.attempts, resetInSeconds: Math.ceil((WINDOW_MS - (now - entry.firstAttempt)) / 1000) }
}
