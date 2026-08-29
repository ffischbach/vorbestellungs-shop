'use client'

import { useActionState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createCategoryAction, updateCategoryAction } from '@/app/actions/admin'

export function CreateCategoryForm({ onDone }: { onDone?: () => void }) {
  const [state, action, isPending] = useActionState(createCategoryAction, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!state) return
    if ('success' in state) {
      formRef.current?.reset()
      toast.success('Kategorie erstellt.')
      onDone?.()
    } else {
      toast.error(state.error)
    }
  }, [state, onDone])

  return (
    <form ref={formRef} action={action} className="flex items-end gap-3">
      <div className="flex-1">
        <Label htmlFor="cat-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Name
        </Label>
        <Input id="cat-name" name="name" placeholder="z.B. Getränke" className="mt-1" required />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Erstelle…' : 'Erstellen'}
      </Button>
    </form>
  )
}

export function EditCategoryForm({ id, currentName, onDone }: { id: string; currentName: string; onDone: () => void }) {
  const [state, action, isPending] = useActionState(updateCategoryAction, null)

  useEffect(() => {
    if (!state) return
    if ('success' in state) {
      toast.success('Kategorie aktualisiert.')
      onDone()
    } else {
      toast.error(state.error)
    }
  }, [state, onDone])

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <Input name="name" defaultValue={currentName} className="h-8 text-sm" required autoFocus />
      <Button type="submit" size="sm" disabled={isPending}>Speichern</Button>
      <Button type="button" variant="ghost" size="sm" onClick={onDone}>Abbrechen</Button>
    </form>
  )
}
