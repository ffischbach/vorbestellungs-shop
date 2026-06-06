'use client'

import { Minus, Plus, Trash2 } from 'lucide-react'
import { useCart } from './CartContext'

interface ProductCardProps {
  id: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  stock: number | null
  maxQuantity: number | null
  soldQuantity: number
  reservedByOthers: number
  allowedSlotIds: string[]
  variants?: { id: string; name: string; price: number }[]
  index?: number
}

export function ProductCard({
  id,
  name,
  description,
  price,
  imageUrl,
  stock,
  maxQuantity,
  soldQuantity,
  reservedByOthers,
  allowedSlotIds,
  index = 0,
}: ProductCardProps) {
  const { items, setProductQuantity } = useCart()

  const cartItem = items.find((i) => i.productId === id)
  const quantity = cartItem?.quantity ?? 0

  // How many units are available for this session (server already excluded our own reservation)
  const availableForMe =
    stock !== null ? Math.max(0, stock - soldQuantity - reservedByOthers) : null

  const atStockLimit = availableForMe !== null && quantity >= availableForMe
  const atMaxLimit = maxQuantity !== null && quantity >= maxQuantity
  const canIncrement = !atStockLimit && !atMaxLimit

  const isSoldOut = availableForMe !== null && availableForMe === 0 && quantity === 0

  // Remaining units the user can still add
  const remaining = availableForMe !== null ? availableForMe - quantity : null
  const showRemaining = remaining !== null && remaining <= 10 && remaining > 0

  const productData = { productId: id, name, price, imageUrl, allowedSlotIds }

  const handleIncrement = () => {
    if (!canIncrement) return
    setProductQuantity(productData, quantity + 1)
  }

  const handleDecrement = () => {
    setProductQuantity(productData, quantity - 1)
  }

  return (
    <div
      className="group relative bg-card border border-border overflow-hidden animate-fade-in-up opacity-0"
      style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
    >
      {/* Product Image */}
      {imageUrl ? (
        <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="aspect-[4/3] w-full bg-muted flex items-center justify-center">
          <span className="text-2xl font-bold text-muted-foreground/40 uppercase">
            {name.charAt(0)}
          </span>
        </div>
      )}

      <div className="p-4">
        {/* Product Info */}
        <div className="mb-3">
          <h3 className="text-sm font-bold text-card-foreground leading-snug tracking-tight">
            {name}
          </h3>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {description}
            </p>
          )}
        </div>

        {/* Stock indicators */}
        {showRemaining && (
          <p className="mb-2 text-xs font-medium text-amber-600 dark:text-amber-400">
            Noch {remaining} verfügbar
          </p>
        )}
        {atMaxLimit && maxQuantity !== null && (
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Max. {maxQuantity} pro Bestellung
          </p>
        )}

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="text-base font-bold text-foreground">
            {price.toFixed(2).replace('.', ',')} €
          </span>

          {isSoldOut ? (
            <span className="px-3 py-1.5 text-xs font-bold bg-muted text-muted-foreground uppercase tracking-wider">
              Ausverkauft
            </span>
          ) : quantity === 0 ? (
            <button
              onClick={handleIncrement}
              className="flex items-center justify-center w-8 h-8 bg-foreground text-background hover:bg-foreground/80 active:scale-95 transition-colors"
              aria-label={`${name} in den Warenkorb legen`}
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
            </button>
          ) : (
            <div className="flex items-center gap-0.5 bg-muted p-0.5">
              <button
                onClick={handleDecrement}
                className="flex items-center justify-center w-8 h-8 bg-card text-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors active:scale-95"
                aria-label="Menge reduzieren"
              >
                {quantity === 1 ? (
                  <Trash2 className="w-3.5 h-3.5" />
                ) : (
                  <Minus className="w-3.5 h-3.5" />
                )}
              </button>
              <span className="w-7 text-center font-bold text-sm text-foreground">
                {quantity}
              </span>
              <button
                onClick={handleIncrement}
                disabled={!canIncrement}
                className="flex items-center justify-center w-8 h-8 bg-foreground text-background hover:bg-foreground/80 transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Menge erhöhen"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
