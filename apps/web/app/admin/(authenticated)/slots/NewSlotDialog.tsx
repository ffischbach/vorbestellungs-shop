'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CreateSlotForm } from './SlotForm'

export function NewSlotDialog() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Neuer Zeitslot
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuer Zeitslot</DialogTitle>
          </DialogHeader>
          <CreateSlotForm onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
