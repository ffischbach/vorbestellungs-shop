'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CreateRuleForm } from './RuleForm'

interface Category { id: string; name: string }
interface Slot { id: string; label: string }
interface Product { id: string; name: string }

export function NewRuleDialog({
  categories,
  slots,
  products,
}: {
  categories: Category[]
  slots: Slot[]
  products: Product[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Neue Regel
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Validierungsregel</DialogTitle>
          </DialogHeader>
          <CreateRuleForm
            categories={categories}
            slots={slots}
            products={products}
            onDone={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
