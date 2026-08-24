import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BulkActionToolbarProps {
  count: number
  onClear: () => void
  children: ReactNode
}

export function BulkActionToolbar({ count, onClear, children }: BulkActionToolbarProps) {
  if (count === 0) return null

  return (
    <div className="flex items-center justify-between gap-4 border border-border bg-muted/30 px-4 py-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Button variant="ghost" size="icon-sm" onClick={onClear} aria-label="Auswahl aufheben">
          <X className="size-4" />
        </Button>
        {count} ausgewählt
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}
