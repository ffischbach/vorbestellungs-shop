'use client'

import { useActionState } from 'react'
import { initiateTotpSetupAction, verifyTotpSetupAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function TotpSetupForm() {
  const [initState, initAction, initPending] = useActionState(initiateTotpSetupAction, null)
  const [verifyState, verifyAction, verifyPending] = useActionState(verifyTotpSetupAction, null)

  if (initState && 'step' in initState && initState.step === 'scan') {
    const secret = new URL(initState.totpURI).searchParams.get('secret') ?? ''

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium">1. URI in Authenticator-App kopieren</p>
          <p className="text-xs text-muted-foreground">
            Aegis, Google Authenticator, oder kompatible App öffnen → Konto hinzufügen → URI einfügen
          </p>
          <code className="block break-all rounded bg-muted px-3 py-2 text-xs select-all">
            {initState.totpURI}
          </code>
        </div>

        {secret && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Oder manuell — Secret:</p>
            <code className="block rounded bg-muted px-3 py-2 text-sm font-mono select-all">
              {secret}
            </code>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">2. Backup-Codes sicher aufbewahren</p>
          <div className="rounded bg-muted px-3 py-2 grid grid-cols-2 gap-1">
            {initState.backupCodes.map((code) => (
              <code key={code} className="text-xs font-mono">{code}</code>
            ))}
          </div>
        </div>

        <form action={verifyAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="code">3. Code aus der App eingeben</Label>
            <Input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              autoComplete="one-time-code"
              required
            />
          </div>

          {verifyState && 'error' in verifyState && (
            <p className="text-sm text-destructive">{verifyState.error}</p>
          )}

          <Button type="submit" className="w-full" disabled={verifyPending}>
            {verifyPending ? 'Wird verifiziert…' : '2FA aktivieren'}
          </Button>
        </form>
      </div>
    )
  }

  return (
    <form action={initAction} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Zur Sicherheit muss für den Admin-Account eine Zwei-Faktor-Authentifizierung eingerichtet werden.
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="password">Passwort bestätigen</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      {initState && 'error' in initState && (
        <p className="text-sm text-destructive">{initState.error}</p>
      )}

      <Button type="submit" className="w-full" disabled={initPending}>
        {initPending ? 'Wird vorbereitet…' : '2FA einrichten'}
      </Button>
    </form>
  )
}
