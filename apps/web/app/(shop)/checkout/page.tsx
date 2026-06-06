import { getPickupSlots } from '@repo/database'
import { getClubConfig } from '@/club.config'
import { CheckoutPageClient } from '@/components/shop/CheckoutPageClient'
import { buildTimeSlots } from '@/lib/slots'

export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
  const [clubConfig, slots] = await Promise.all([getClubConfig(), getPickupSlots()])
  const timeSlots = buildTimeSlots(slots)

  return (
    <CheckoutPageClient
      eventName={clubConfig.eventName}
      eventDate={new Date(clubConfig.eventDate).toLocaleDateString('de-DE')}
      logoUrl={clubConfig.logoUrl}
      slots={timeSlots}
    />
  )
}
