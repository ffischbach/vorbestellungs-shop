'use client'

import { useActionState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSlotAction, updateSlotAction } from '@/app/actions/admin'

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

export function CreateSlotForm({ onDone }: { onDone?: () => void }) {
  const [state, action, isPending] = useActionState(createSlotAction, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!state) return
    if ('success' in state) {
      formRef.current?.reset()
      toast.success('Zeitslot erstellt.')
      onDone?.()
    } else {
      toast.error(state.error)
    }
  }, [state, onDone])

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <SlotFields />
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
    if (!state) return
    if ('success' in state) {
      toast.success('Zeitslot aktualisiert.')
      onDone()
    } else {
      toast.error(state.error)
    }
  }, [state, onDone])

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <SlotFields defaults={defaults} />
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>{isPending ? 'Speichere…' : 'Speichern'}</Button>
        <Button type="button" variant="ghost" onClick={onDone}>Abbrechen</Button>
      </div>
    </form>
  )
}
