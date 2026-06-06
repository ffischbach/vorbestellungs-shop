'use client'

import Image from 'next/image'
import { ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { ReactNode } from 'react'

interface ShopLayoutProps {
  children: ReactNode
  cartItemCount?: number
  eventName: string
  eventDate: string
  logoUrl?: string
}

export function ShopLayout({
  children,
  cartItemCount = 0,
  eventName,
  eventDate,
  logoUrl,
}: ShopLayoutProps) {
  return (
    <div className="min-h-full flex flex-col bg-background">
      {/* Header: Briefkopf-Stil, nicht floating */}
      <header className="border-b border-border">
        <div className="container mx-auto max-w-2xl px-5 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            {logoUrl && (
              <div className="relative w-10 h-10 overflow-hidden bg-white border border-border">
                <Image
                  src={logoUrl}
                  alt=""
                  fill
                  unoptimized
                  className="object-contain p-1"
                />
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-tight text-foreground tracking-tight uppercase">
                {eventName}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                {eventDate}
              </span>
            </div>
          </Link>

          <Link
            href="/cart"
            className="relative flex items-center justify-center w-10 h-10 bg-card border border-border hover:bg-muted transition-colors"
            aria-label="Warenkorb"
          >
            <ShoppingCart className="w-[18px] h-[18px] text-foreground" strokeWidth={2} />
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center bg-primary text-primary-foreground text-[11px] font-bold">
                {cartItemCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 container mx-auto max-w-2xl px-5 py-8 ${cartItemCount > 0 ? 'pb-28' : ''}`}>
        {children}
      </main>
    </div>
  )
}
