/**
 * Einmalig ausführen um den ersten Admin-Account anzulegen:
 *   pnpm admin:create
 *
 * E-Mail und Passwort über Umgebungsvariablen oder Argumente:
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... pnpm admin:create
 */
import { db } from '@repo/database'
import { auth } from '../lib/auth'

async function main() {
  const email = process.env.ADMIN_EMAIL ?? process.argv[2]
  const password = process.env.ADMIN_PASSWORD ?? process.argv[3]
  const name = process.env.ADMIN_NAME ?? 'Admin'

  if (!email || !password) {
    console.error('Fehler: ADMIN_EMAIL und ADMIN_PASSWORD sind Pflicht.')
    console.error('  ADMIN_EMAIL=... ADMIN_PASSWORD=... pnpm admin:create')
    process.exit(1)
  }

  const existing = await db.user.count()
  if (existing > 0) {
    console.error('Fehler: Es existiert bereits ein Admin-Account. Nur ein Account ist erlaubt.')
    process.exit(1)
  }

  const result = await auth.api.signUpEmail({
    body: { email, password, name },
  })

  if (!result || !('user' in result) || !result.user) {
    console.error('Fehler beim Erstellen des Admin-Accounts.')
    process.exit(1)
  }

  console.log(`Admin-Account erstellt: ${email}`)
  console.log('Zweiten Faktor einrichten: ADMIN_EMAIL=... ADMIN_PASSWORD=... pnpm admin:setup-totp')
}

main().catch((e: unknown) => {
  console.error(e)
  process.exit(1)
})
