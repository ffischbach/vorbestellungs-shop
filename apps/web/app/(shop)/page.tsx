import { cookies } from 'next/headers'
import {
  getProducts,
  getPickupSlots,
  getCategories,
  getProductSoldQuantities,
  getReservedQuantitiesByOthers,
} from '@repo/database'
import { getClubConfig } from '@/club.config'
import { ShopPageClient } from '@/components/shop/ShopPageClient'
import { buildTimeSlots } from '@/lib/slots'

export const dynamic = 'force-dynamic'

export default async function ShopPage() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('cart_session')?.value

  const [clubConfig, products, soldQuantities, reservedByOthers, slots, categories] =
    await Promise.all([
      getClubConfig(),
      getProducts(),
      getProductSoldQuantities(),
      getReservedQuantitiesByOthers(sessionId),
      getPickupSlots(),
      getCategories(),
    ])

  const timeSlots = buildTimeSlots(slots)

  return (
    <ShopPageClient
      eventName={clubConfig.eventName}
      eventDate={new Date(clubConfig.eventDate).toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}
      logoUrl={clubConfig.logoUrl}
      slots={timeSlots}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: Number(p.price),
        imageUrl: p.imageUrl,
        category: { id: p.category.id, name: p.category.name },
        allowedSlotIds: p.allowedSlots.map((s) => s.id),
        stock: p.stock,
        maxQuantity: p.maxQuantity,
        soldQuantity: soldQuantities[p.id] ?? 0,
        reservedByOthers: reservedByOthers[p.id] ?? 0,
      }))}
    />
  )
}
