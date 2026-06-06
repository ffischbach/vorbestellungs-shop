'use client'

import { useActionState, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createCategoryAction, updateCategoryAction, type ActionState } from '@/app/actions/admin'

export function CreateCategoryForm() {
  const [state, action, isPending] = useActionState(createCategoryAction, null)
  const [key, setKey] = useState(0)

  useEffect(() => {
    if (state && 'success' in state) setKey((k) => k + 1)
  }, [state])

  return (
    <form key={key} action={action} className="flex items-end gap-3">
      <div className="flex-1">
        <Label htmlFor="cat-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Name
        </Label>
        <Input id="cat-name" name="name" placeholder="z.B. Getränke" className="mt-1" required />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Erstelle…' : 'Erstellen'}
      </Button>
      {state && 'error' in state && (
        <p className="text-destructive text-sm self-center">{state.error}</p>
      )}
    </form>
  )
}

export function EditCategoryForm({ id, currentName, onDone }: { id: string; currentName: string; onDone: () => void }) {
  const [state, action, isPending] = useActionState(updateCategoryAction, null)

  useEffect(() => {
    if (state && 'success' in state) onDone()
  }, [state, onDone])

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <Input name="name" defaultValue={currentName} className="h-8 text-sm" required autoFocus />
      <Button type="submit" size="sm" disabled={isPending}>Speichern</Button>
      <Button type="button" variant="ghost" size="sm" onClick={onDone}>Abbrechen</Button>
      {state && 'error' in state && (
        <p className="text-destructive text-xs">{state.error}</p>
      )}
    </form>
  )
}
