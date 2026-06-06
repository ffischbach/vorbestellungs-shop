'use client'

import Image from 'next/image'
import { Minus, Plus, Trash2 } from 'lucide-react'

interface CartItemProps {
  id: string
  name: string
  variantName?: string
  price: number
  quantity: number
  imageUrl?: string
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemove: (itemId: string) => void
}

export function CartItem({
  id,
  name,
  variantName,
  price,
  quantity,
  imageUrl,
  onUpdateQuantity,
  onRemove,
}: CartItemProps) {
  const totalPrice = price * quantity

  return (
    <div className="flex items-center gap-4 p-4 bg-card border border-border">
      {/* Thumbnail */}
      {imageUrl ? (
        <div className="relative flex-shrink-0 w-14 h-14 overflow-hidden bg-muted">
          <Image
            src={imageUrl}
            alt={name}
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex-shrink-0 w-14 h-14 bg-muted flex items-center justify-center">
          <span className="text-lg font-bold text-muted-foreground/40 uppercase">
            {name.charAt(0)}
          </span>
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-foreground text-sm leading-snug truncate">{name}</h4>
        {variantName && (
          <p className="text-xs text-muted-foreground mt-0.5">{variantName}</p>
        )}
        <p className="text-xs font-medium text-muted-foreground mt-1">
          {price.toFixed(2).replace('.', ',')} €
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5 bg-muted p-0.5">
          <button
            onClick={() =>
              quantity > 1
                ? onUpdateQuantity(id, quantity - 1)
                : onRemove(id)
            }
            className="flex items-center justify-center w-7 h-7 bg-card text-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors active:scale-90"
            aria-label={quantity > 1 ? 'Menge reduzieren' : 'Artikel entfernen'}
          >
            {quantity > 1 ? (
              <Minus className="w-3.5 h-3.5" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
          </button>
          <span className="w-6 text-center font-bold text-sm text-foreground">
            {quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(id, quantity + 1)}
            className="flex items-center justify-center w-7 h-7 bg-foreground text-background hover:bg-foreground/80 transition-colors active:scale-90"
            aria-label="Menge erhöhen"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="text-right min-w-[60px]">
          <p className="font-bold text-foreground text-sm">
            {totalPrice.toFixed(2).replace('.', ',')} €
          </p>
        </div>
      </div>
    </div>
  )
}
