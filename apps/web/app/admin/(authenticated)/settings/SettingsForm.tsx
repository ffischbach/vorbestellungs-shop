'use client'

import { useState, useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateClubConfigAction } from '@/app/actions/admin'
import type { ClubConfig } from '@repo/config'

export function SettingsForm({ current }: { current: ClubConfig }) {
  const [state, action, isPending] = useActionState(updateClubConfigAction, null)
  const [paymentMethods, setPaymentMethods] = useState<string[]>(current.paymentMethods)
  const [newMethod, setNewMethod] = useState('')
  const [primaryColor, setPrimaryColor] = useState(current.primaryColor)
  const [accentColor, setAccentColor] = useState(current.accentColor)

  useEffect(() => {
    if (!state) return
    if ('success' in state) {
      toast.success('Einstellungen gespeichert.')
    } else {
      toast.error(state.error)
    }
  }, [state])

  return (
    <form action={action} className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Verein</h2>
        <div className="grid gap-4 max-w-lg">
          <div className="space-y-1.5">
            <Label htmlFor="clubName">Vereinsname</Label>
            <Input
              id="clubName"
              name="clubName"
              defaultValue={current.name}
              placeholder="ASG-Ettlingen e.V."
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contactEmail">Kontakt-E-Mail</Label>
            <Input
              id="contactEmail"
              name="contactEmail"
              type="email"
              defaultValue={current.contactEmail}
              placeholder="info@verein.de"
              required
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Event</h2>
        <div className="grid gap-4 max-w-lg">
          <div className="space-y-1.5">
            <Label htmlFor="eventName">Event-Name</Label>
            <Input
              id="eventName"
              name="eventName"
              defaultValue={current.eventName}
              placeholder="Sommerfest 2025"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="eventDate">Event-Datum</Label>
            <Input
              id="eventDate"
              name="eventDate"
              type="date"
              defaultValue={current.eventDate}
              required
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Design</h2>
        <div className="grid gap-4 max-w-lg">
          <div className="space-y-1.5">
            <Label htmlFor="primaryColor">Primärfarbe</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                aria-label="Primärfarbe auswählen"
                value={primaryColor}
                className="h-9 w-14 cursor-pointer rounded border border-input bg-background p-0.5"
                onChange={(e) => setPrimaryColor(e.target.value)}
              />
              <Input
                id="primaryColor"
                name="primaryColor"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                pattern="^#[0-9a-fA-F]{6}$"
                placeholder="#1a56db"
                className="font-mono"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="accentColor">Akzentfarbe</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                aria-label="Akzentfarbe auswählen"
                value={accentColor}
                className="h-9 w-14 cursor-pointer rounded border border-input bg-background p-0.5"
                onChange={(e) => setAccentColor(e.target.value)}
              />
              <Input
                id="accentColor"
                name="accentColor"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                pattern="^#[0-9a-fA-F]{6}$"
                placeholder="#f59e0b"
                className="font-mono"
                required
              />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Zahlungsarten vor Ort</h2>
        <div className="max-w-lg space-y-2">
          {paymentMethods.map((method, index) => (
            <div key={index} className="flex items-center gap-2">
              <input type="hidden" name="paymentMethods" value={method} />
              <span className="flex-1 text-sm border border-input bg-background px-3 py-2">{method}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPaymentMethods((prev) => prev.filter((_, i) => i !== index))}
                className="text-destructive hover:text-destructive"
              >
                Entfernen
              </Button>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1">
            <Input
              value={newMethod}
              onChange={(e) => setNewMethod(e.target.value)}
              placeholder="z.B. PayPal"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  const trimmed = newMethod.trim()
                  if (trimmed) {
                    setPaymentMethods((prev) => [...prev, trimmed])
                    setNewMethod('')
                  }
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const trimmed = newMethod.trim()
                if (trimmed) {
                  setPaymentMethods((prev) => [...prev, trimmed])
                  setNewMethod('')
                }
              }}
            >
              Hinzufügen
            </Button>
          </div>
          {paymentMethods.length === 0 && (
            <p className="text-xs text-destructive">Mindestens eine Zahlungsart ist erforderlich.</p>
          )}
        </div>
      </section>

      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Speichere…' : 'Einstellungen speichern'}
        </Button>
      </div>
    </form>
  )
}
