'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'

import { ShopLayout } from './ShopLayout'
import { TimeSlotPicker, TimeSlot } from './TimeSlotPicker'
import { CategoryFilter } from './CategoryFilter'
import { ProductCard } from './ProductCard'
import { CartBottomBar } from './CartBottomBar'
import { useCart } from './CartContext'

interface Category {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  category: Category
  allowedSlotIds: string[]
}

interface ShopPageClientProps {
  eventName: string
  eventDate: string
  logoUrl?: string
  slots: TimeSlot[]
  categories: Category[]
  products: Product[]
}

export function ShopPageClient({
  eventName,
  eventDate,
  logoUrl,
  slots,
  categories,
  products,
}: ShopPageClientProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>()
  const { addItem, totalItems, totalAmount, selectedSlotId, setSelectedSlotId } = useCart()

  const slotFilteredProducts = selectedSlotId
    ? products.filter(
        (p) =>
          p.allowedSlotIds.length === 0 ||
          p.allowedSlotIds.includes(selectedSlotId)
      )
    : products

  const hiddenBySlotCount = selectedSlotId
    ? products.length - slotFilteredProducts.length
    : 0

  const hiddenBySlotInCategoryCount =
    selectedSlotId && selectedCategoryId
      ? products.filter(
          (p) =>
            p.category.id === selectedCategoryId &&
            p.allowedSlotIds.length > 0 &&
            !p.allowedSlotIds.includes(selectedSlotId)
        ).length
      : 0

  const displayedHiddenCount = selectedCategoryId
    ? hiddenBySlotInCategoryCount
    : hiddenBySlotCount

  const filteredProducts = selectedCategoryId
    ? slotFilteredProducts.filter((p) => p.category.id === selectedCategoryId)
    : slotFilteredProducts

  const handleAddToCart = (
    productId: string,
    variantId?: string,
    quantity?: number
  ) => {
    const product = products.find((p) => p.id === productId)
    if (!product || !quantity) return

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      imageUrl: product.imageUrl ?? undefined,
      variantName: variantId,
      allowedSlotIds: product.allowedSlotIds,
    })
  }

  return (
    <ShopLayout
      eventName={eventName}
      eventDate={eventDate}
      logoUrl={logoUrl}
      cartItemCount={totalItems}
    >
      <div className="space-y-10">
        {/* Hero Section */}
        <div className="animate-fade-in-up">
          <h1 className="text-3xl md:text-4xl text-foreground tracking-tight">
            Bestelle für
            <br />
            <span className="text-muted-foreground">{eventName}</span>
          </h1>
          <p className="mt-3 text-muted-foreground text-sm max-w-sm leading-relaxed">
            Wähle deine Produkte und lege eine Abholzeit fest.
          </p>
        </div>

        {/* Time Slot Selection */}
        <section className="animate-fade-in-up stagger-1">
          <TimeSlotPicker
            slots={slots}
            selectedSlotId={selectedSlotId}
            onSelectSlot={setSelectedSlotId}
          />
        </section>

        {/* Category Filter */}
        {categories.length > 0 && (
          <section className="animate-fade-in-up stagger-2">
            <CategoryFilter
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
            />
          </section>
        )}

        {/* Products Grid */}
        <section className="space-y-5 animate-fade-in-up stagger-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground tracking-tight">
              {selectedCategoryId
                ? categories.find((c) => c.id === selectedCategoryId)?.name
                : 'Unser Angebot'}
            </h2>
            <span className="text-xs text-muted-foreground font-medium">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'Produkt' : 'Produkte'}
            </span>
          </div>

          {selectedSlotId && displayedHiddenCount > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200 -mt-1">
              <Info className="mt-0.5 size-4 shrink-0" />
              <span>
                {displayedHiddenCount}{' '}
                {displayedHiddenCount === 1 ? 'Produkt ist' : 'Produkte sind'} nur zu anderen Abholzeiten verfügbar und werden nicht angezeigt.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                description={product.description ?? undefined}
                price={product.price}
                imageUrl={product.imageUrl ?? undefined}
                onAddToCart={handleAddToCart}
                index={index}
              />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground bg-card rounded-2xl border border-border">
              <p className="text-sm">
                {selectedSlotId && selectedCategoryId
                  ? 'Keine Produkte in dieser Kategorie für die gewählte Abholzeit.'
                  : selectedSlotId
                  ? 'Für diese Abholzeit sind keine Produkte verfügbar.'
                  : 'Keine Produkte in dieser Kategorie verfügbar.'}
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Sticky Bottom Bar */}
      <CartBottomBar totalAmount={totalAmount} itemCount={totalItems} />
    </ShopLayout>
  )
}
