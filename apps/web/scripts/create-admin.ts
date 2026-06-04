/**
 * Einmalig ausführen um den ersten Admin-Account anzulegen:
 *   pnpm admin:create
 *
 * E-Mail und Passwort über Umgebungsvariablen oder Argumente:
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... pnpm admin:create
 */
import { auth } from '../lib/auth'

async function main() {
  const email = process.env.ADMIN_EMAIL ?? process.argv[2] ?? 'admin@example.com'
  const password = process.env.ADMIN_PASSWORD ?? process.argv[3] ?? 'change-me-immediately'
  const name = process.env.ADMIN_NAME ?? 'Admin'

  const result = await auth.api.signUpEmail({
    body: { email, password, name },
  })

  if (!result || !('user' in result) || !result.user) {
    console.error('Fehler beim Erstellen des Admin-Accounts.')
    process.exit(1)
  }

  console.log(`Admin-Account erstellt: ${email}`)
  console.log('Passwort unbedingt nach dem ersten Login ändern!')
}

main().catch((e: unknown) => {
  console.error(e)
  process.exit(1)
})
