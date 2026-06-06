'use client'

import { ShoppingCart, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface CartBottomBarProps {
  totalAmount: number
  itemCount: number
}

export function CartBottomBar({ totalAmount, itemCount }: CartBottomBarProps) {
  if (itemCount === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb border-t border-border bg-background">
      <div className="container mx-auto max-w-2xl px-5 py-4">
        <Link
          href="/cart"
          className="flex items-center justify-between w-full h-14 px-5 bg-foreground text-background hover:bg-foreground/90 active:scale-[0.98] transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <ShoppingCart className="w-4 h-4" />
            <span className="font-bold text-[15px]">
              {itemCount} {itemCount === 1 ? 'Artikel' : 'Artikel'}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-lg font-bold">
              {totalAmount.toFixed(2).replace('.', ',')} €
            </span>
            <ArrowRight className="w-5 h-5" />
          </div>
        </Link>
      </div>
    </div>
  )
}
