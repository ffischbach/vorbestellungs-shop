import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumb?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ title, description, breadcrumb, actions }: PageHeaderProps) {
  return (
    <div className="space-y-1">
      {breadcrumb && <div className="text-sm text-muted-foreground">{breadcrumb}</div>}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground text-sm mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-4">{actions}</div>}
      </div>
    </div>
  )
}
