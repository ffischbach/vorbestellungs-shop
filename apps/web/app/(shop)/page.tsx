import { getProducts, getPickupSlots, getCategories } from '@repo/database'
import { getClubConfig } from '@/club.config'
import { ShopPageClient } from '@/components/shop/ShopPageClient'
import { buildTimeSlots } from '@/lib/slots'

export const dynamic = 'force-dynamic'

export default async function ShopPage() {
  const [clubConfig, products, slots, categories] = await Promise.all([
    getClubConfig(),
    getProducts(),
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
      }))}
    />
  )
}
