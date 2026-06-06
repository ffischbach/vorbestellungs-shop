'use client'

import { Minus, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface ProductCardProps {
  id: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  variants?: { id: string; name: string; price: number }[]
  onAddToCart: (productId: string, variantId?: string, quantity?: number) => void
  index?: number
}

export function ProductCard({
  id,
  name,
  description,
  price,
  imageUrl,
  variants,
  onAddToCart,
  index = 0,
}: ProductCardProps) {
  const [selectedVariant, setSelectedVariant] = useState(variants?.[0]?.id)
  const [quantity, setQuantity] = useState(0)

  const currentPrice =
    variants?.find((v) => v.id === selectedVariant)?.price ?? price

  const handleAdd = () => {
    setQuantity(1)
    onAddToCart(id, selectedVariant, 1)
  }

  const handleIncrement = () => {
    const newQty = quantity + 1
    setQuantity(newQty)
    onAddToCart(id, selectedVariant, newQty)
  }

  const handleDecrement = () => {
    if (quantity > 1) {
      const newQty = quantity - 1
      setQuantity(newQty)
      onAddToCart(id, selectedVariant, newQty)
    } else {
      setQuantity(0)
      onAddToCart(id, selectedVariant, 0)
    }
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

        {/* Variants */}
        {variants && variants.length > 1 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariant(variant.id)}
                className={`px-2.5 py-1 text-xs font-medium border transition-colors ${
                  selectedVariant === variant.id
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'
                }`}
              >
                {variant.name}
              </button>
            ))}
          </div>
        )}

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="text-base font-bold text-foreground">
            {currentPrice.toFixed(2).replace('.', ',')} €
          </span>

          {quantity === 0 ? (
            <button
              onClick={handleAdd}
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
                className="flex items-center justify-center w-8 h-8 bg-foreground text-background hover:bg-foreground/80 transition-colors active:scale-95"
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
