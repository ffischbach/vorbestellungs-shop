import { clubConfigSchema } from '@repo/config'

// Gelesen zur Laufzeit — kein NEXT_PUBLIC_, damit dasselbe Docker-Image
// für beliebige Vereine genutzt werden kann (config via Env Vars pro Instanz).
// In Client Components: Farben via CSS Custom Properties, Text via Props aus Server Components.
export default clubConfigSchema.parse({
  name:         process.env.CLUB_NAME          ?? 'Musterverein e.V.',
  logoUrl:      process.env.CLUB_LOGO_URL       ?? '/logo.png',
  primaryColor: process.env.CLUB_PRIMARY_COLOR  ?? '#1a56db',
  accentColor:  process.env.CLUB_ACCENT_COLOR   ?? '#f59e0b',
  eventName:    process.env.CLUB_EVENT_NAME     ?? 'Sommerfest 2025',
  eventDate:    process.env.CLUB_EVENT_DATE     ?? '2025-07-12',
  contactEmail: process.env.CLUB_CONTACT_EMAIL  ?? 'info@musterverein.de',
})
