'use client'

import { ShoppingCart, ArrowRight, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { ShopLayout } from '@/components/shop/ShopLayout'
import { CartItem } from '@/components/shop/CartItem'
import { EmptyState } from '@/components/shop/EmptyState'
import { useCart } from '@/components/shop/CartContext'

interface CartPageClientProps {
  eventName: string
  eventDate: string
  logoUrl?: string
}

export default function CartPageClient({
  eventName,
  eventDate,
  logoUrl,
}: CartPageClientProps) {
  const { items, updateQuantity, removeItem, totalAmount, totalItems, isLoading } =
    useCart()

  return (
    <ShopLayout
      eventName={eventName}
      eventDate={eventDate}
      logoUrl={logoUrl}
      cartItemCount={totalItems}
    >
      <div className="space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Warenkorb</h1>
          <p className="text-sm text-muted-foreground">
            Überprüfe deine Auswahl vor der Bestellung
          </p>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-sm py-8 text-center">Warenkorb wird geladen…</p>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart className="w-7 h-7" />}
            title="Dein Warenkorb ist leer"
            description="Schau dir unsere leckeren Angebote an und füge etwas hinzu!"
            action={
              <Link
                href="/"
                className="inline-flex items-center justify-center h-12 px-6 bg-foreground text-background font-bold hover:bg-foreground/90 active:scale-[0.98] transition-colors"
              >
                Produkte entdecken
              </Link>
            }
          />
        ) : (
          <>
            {/* Cart Items */}
            <div className="space-y-3">
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  variantName={item.variantName}
                  price={item.price}
                  quantity={item.quantity}
                  imageUrl={item.imageUrl}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>

            {/* Clear Cart */}
            <button
              onClick={() => {
                if (confirm('Möchtest du wirklich alle Artikel entfernen?')) {
                  items.forEach((item) => removeItem(item.id))
                }
              }}
              className="flex items-center gap-2 text-sm text-destructive hover:text-destructive/80 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Warenkorb leeren
            </button>

            {/* Order Summary */}
            <div className="bg-card border border-border p-5 space-y-4">
              <h2 className="text-base font-bold text-foreground tracking-tight">
                Zusammenfassung
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Zwischensumme</span>
                  <span className="text-foreground font-medium">
                    {totalAmount.toFixed(2).replace('.', ',')} €
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {totalItems} {totalItems === 1 ? 'Artikel' : 'Artikel'}
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-foreground">
                    Gesamtbetrag
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {totalAmount.toFixed(2).replace('.', ',')} €
                  </span>
                </div>
              </div>

              <div className="bg-muted p-3">
                <p className="text-xs text-foreground leading-relaxed">
                  Du zahlst bequem vor Ort an der Abholstation. Es fallen keine zusätzlichen Gebühren an.
                </p>
              </div>
            </div>

            {/* Checkout Button */}
            <Link
              href="/checkout"
              className="flex items-center justify-center w-full h-14 bg-foreground text-background font-bold text-base hover:bg-foreground/90 active:scale-[0.98] transition-colors"
            >
              Weiter zur Bestellung
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </>
        )}
      </div>
    </ShopLayout>
  )
}
