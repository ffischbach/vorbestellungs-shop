import { getClubConfig } from '@/club.config'
import CartPageClient from '@/components/shop/CartPageClient'

export const dynamic = 'force-dynamic'

export default async function CartPage() {
  const clubConfig = await getClubConfig()
  return (
    <CartPageClient
      eventName={clubConfig.eventName}
      eventDate={new Date(clubConfig.eventDate).toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}
      logoUrl={clubConfig.logoUrl}
    />
  )
}
