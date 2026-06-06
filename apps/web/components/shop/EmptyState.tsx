'use client'

import { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      {icon && (
        <div className="mb-5 p-5 rounded-2xl bg-card shadow-soft text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-semibold text-foreground mb-2 font-heading">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-xs mb-8 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}
