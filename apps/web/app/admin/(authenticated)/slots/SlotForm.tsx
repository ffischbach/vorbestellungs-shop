'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSlotAction, updateSlotAction, type ActionState } from '@/app/actions/admin'

function SlotFields({ defaults }: { defaults?: { label: string; startTime: string; endTime: string; capacity: string } }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Label</Label>
        <Input name="label" placeholder="z.B. Mittag 12–14 Uhr" defaultValue={defaults?.label} className="mt-1" required />
      </div>
      <div>
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kapazität (leer = unbegrenzt)</Label>
        <Input name="capacity" type="number" min="1" placeholder="z.B. 50" defaultValue={defaults?.capacity} className="mt-1" />
      </div>
      <div>
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Startzeit</Label>
        <Input name="startTime" type="datetime-local" defaultValue={defaults?.startTime} className="mt-1" required />
      </div>
      <div>
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Endzeit</Label>
        <Input name="endTime" type="datetime-local" defaultValue={defaults?.endTime} className="mt-1" required />
      </div>
    </div>
  )
}

export function CreateSlotForm() {
  const [state, action, isPending] = useActionState(createSlotAction, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state && 'success' in state) formRef.current?.reset()
  }, [state])

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <SlotFields />
      {state && 'error' in state && (
        <p className="text-destructive text-sm">{state.error}</p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Erstelle…' : 'Zeitslot erstellen'}
      </Button>
    </form>
  )
}

export function EditSlotForm({
  id,
  defaults,
  onDone,
}: {
  id: string
  defaults: { label: string; startTime: string; endTime: string; capacity: string }
  onDone: () => void
}) {
  const [state, action, isPending] = useActionState(updateSlotAction, null)

  useEffect(() => {
    if (state && 'success' in state) onDone()
  }, [state, onDone])

  return (
    <form action={action} className="space-y-4 p-4 border border-border bg-muted/20">
      <input type="hidden" name="id" value={id} />
      <SlotFields defaults={defaults} />
      {state && 'error' in state && (
        <p className="text-destructive text-sm">{state.error}</p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>{isPending ? 'Speichere…' : 'Speichern'}</Button>
        <Button type="button" variant="ghost" onClick={onDone}>Abbrechen</Button>
      </div>
    </form>
  )
}
