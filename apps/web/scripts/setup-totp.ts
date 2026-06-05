/**
 * Zweiten Faktor (TOTP) für den Admin-Account einrichten:
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... pnpm admin:setup-totp
 *
 * Voraussetzung: NODE_ENV=production (TOTP-Plugin ist nur in Production aktiv)
 * Der Befehl muss daher auf dem Server ausgeführt werden.
 */
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { auth } from '../lib/auth'

async function main() {
  const email = process.env.ADMIN_EMAIL ?? process.argv[2]
  const password = process.env.ADMIN_PASSWORD ?? process.argv[3]

  if (!email || !password) {
    console.error('Fehler: ADMIN_EMAIL und ADMIN_PASSWORD sind Pflicht.')
    console.error('  ADMIN_EMAIL=... ADMIN_PASSWORD=... pnpm admin:setup-totp')
    process.exit(1)
  }

  const signIn = await auth.api.signInEmail({
    body: { email, password },
  })

  if (!signIn?.token) {
    console.error('Login fehlgeschlagen. E-Mail oder Passwort falsch.')
    process.exit(1)
  }

  const cookieHeader = `better-auth.session_token=${signIn.token}`

  const setup = await auth.api.enableTwoFactor({
    body: { password },
    headers: new Headers({ cookie: cookieHeader }),
  })

  console.log('\n=== TOTP einrichten ===')
  console.log('\nDiese URI in die Authenticator-App scannen (z. B. Google Authenticator, Aegis):')
  console.log(`\n  ${setup.totpURI}\n`)
  console.log('Backup-Codes (einmalig verwendbar, sicher aufbewahren!):')
  for (const code of setup.backupCodes) {
    console.log(`  ${code}`)
  }

  const rl = createInterface({ input: stdin, output: stdout })
  const code = await rl.question('\nCode aus der Authenticator-App eingeben (6 Ziffern): ')
  rl.close()

  await auth.api.verifyTOTP({
    body: { code: code.trim() },
    headers: new Headers({ cookie: cookieHeader }),
  })

  console.log('\n2FA erfolgreich aktiviert. Ab sofort wird beim Login ein TOTP-Code verlangt.')
}

main().catch((e: unknown) => {
  console.error(e)
  process.exit(1)
})
