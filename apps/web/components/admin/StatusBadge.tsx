import type { OrderStatus } from '@repo/database'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Ausstehend',
  CONFIRMED: 'Bestätigt',
  CANCELLED: 'Storniert',
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: 'bg-warning/10 text-warning-foreground',
  CONFIRMED: 'bg-success/10 text-success',
  CANCELLED: 'bg-muted text-muted-foreground',
}

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn('border-transparent font-bold', STATUS_STYLES[status], className)}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}
