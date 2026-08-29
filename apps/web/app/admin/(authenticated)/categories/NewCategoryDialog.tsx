'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CreateCategoryForm } from './CategoryForm'

export function NewCategoryDialog() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Neue Kategorie
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Kategorie</DialogTitle>
          </DialogHeader>
          <CreateCategoryForm onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
