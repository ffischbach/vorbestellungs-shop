import clubConfig from '@/club.config'
import CartPageClient from '@/components/shop/CartPageClient'

export default async function CartPage() {
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
