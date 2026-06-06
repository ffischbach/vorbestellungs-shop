'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateClubConfigAction, type ActionState } from '@/app/actions/admin'
import type { ClubConfig } from '@repo/config'

export function SettingsForm({ current }: { current: ClubConfig }) {
  const [state, action, isPending] = useActionState(updateClubConfigAction, null)

  return (
    <form action={action} className="space-y-8">
      {state && 'error' in state && (
        <p className="text-sm text-destructive bg-destructive/10 px-4 py-3 border border-destructive/20">
          {state.error}
        </p>
      )}
      {state && 'success' in state && (
        <p className="text-sm text-green-700 bg-green-50 px-4 py-3 border border-green-200">
          Einstellungen gespeichert.
        </p>
      )}

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
                id="primaryColorPicker"
                defaultValue={current.primaryColor}
                className="h-9 w-14 cursor-pointer rounded border border-input bg-background p-0.5"
                onChange={(e) => {
                  const input = document.getElementById('primaryColor') as HTMLInputElement
                  if (input) input.value = e.target.value
                }}
              />
              <Input
                id="primaryColor"
                name="primaryColor"
                defaultValue={current.primaryColor}
                pattern="^#[0-9a-fA-F]{6}$"
                placeholder="#1a56db"
                className="font-mono"
                required
                onChange={(e) => {
                  const picker = document.getElementById('primaryColorPicker') as HTMLInputElement
                  if (picker && /^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                    picker.value = e.target.value
                  }
                }}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="accentColor">Akzentfarbe</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="accentColorPicker"
                defaultValue={current.accentColor}
                className="h-9 w-14 cursor-pointer rounded border border-input bg-background p-0.5"
                onChange={(e) => {
                  const input = document.getElementById('accentColor') as HTMLInputElement
                  if (input) input.value = e.target.value
                }}
              />
              <Input
                id="accentColor"
                name="accentColor"
                defaultValue={current.accentColor}
                pattern="^#[0-9a-fA-F]{6}$"
                placeholder="#f59e0b"
                className="font-mono"
                required
                onChange={(e) => {
                  const picker = document.getElementById('accentColorPicker') as HTMLInputElement
                  if (picker && /^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                    picker.value = e.target.value
                  }
                }}
              />
            </div>
          </div>
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
