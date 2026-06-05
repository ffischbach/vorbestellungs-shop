'use client'

import { useActionState } from 'react'
import { verifyTotpLoginAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function TotpLoginForm() {
  const [state, action, isPending] = useActionState(verifyTotpLoginAction, null)

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="code">Authenticator-Code</Label>
        <Input
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          placeholder="000000"
          autoComplete="one-time-code"
          autoFocus
          required
        />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Wird geprüft…' : 'Anmelden'}
      </Button>
    </form>
  )
}
