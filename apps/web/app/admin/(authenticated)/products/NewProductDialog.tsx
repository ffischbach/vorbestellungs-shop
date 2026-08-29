'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CreateProductForm } from './ProductForm'

interface Category { id: string; name: string }
interface Slot { id: string; label: string }

export function NewProductDialog({ categories, slots }: { categories: Category[]; slots: Slot[] }) {
  const [open, setOpen] = useState(false)

  if (categories.length === 0) {
    return null
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Neues Produkt
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neues Produkt</DialogTitle>
          </DialogHeader>
          <CreateProductForm categories={categories} slots={slots} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
