import { clubConfigSchema, type ClubConfig } from '@repo/config'
import { getClubConfigFromDb } from '@repo/database'

// Env-Var-Defaults — gelten wenn kein DB-Eintrag vorhanden
const envDefaults = {
  name:           process.env.CLUB_NAME           ?? 'Musterverein e.V.',
  logoUrl:        process.env.CLUB_LOGO_URL        ?? '/logo.png',
  primaryColor:   process.env.CLUB_PRIMARY_COLOR   ?? '#1a56db',
  accentColor:    process.env.CLUB_ACCENT_COLOR    ?? '#f59e0b',
  eventName:      process.env.CLUB_EVENT_NAME      ?? 'Sommerfest 2025',
  eventDate:      process.env.CLUB_EVENT_DATE      ?? '2025-07-12',
  contactEmail:   process.env.CLUB_CONTACT_EMAIL   ?? 'info@musterverein.de',
  paymentMethods: ['Bargeld', 'EC-Karte', 'Kreditkarte'],
  // Infra-Setting des Abholorts, kein Event-Detail — daher nur env, nicht in der DB/Admin-UI editierbar.
  timezone:       process.env.CLUB_TIMEZONE        ?? 'Europe/Berlin',
}

export async function getClubConfig(): Promise<ClubConfig> {
  // DB may be unavailable at build time — fall back to env defaults silently
  let db: Awaited<ReturnType<typeof getClubConfigFromDb>> = null
  try {
    db = await getClubConfigFromDb()
  } catch {
    // no-op: use env defaults below
  }
  return clubConfigSchema.parse({
    name:           db?.clubName       ?? envDefaults.name,
    logoUrl:        db?.logoUrl        ?? envDefaults.logoUrl,
    primaryColor:   db?.primaryColor   ?? envDefaults.primaryColor,
    accentColor:    db?.accentColor    ?? envDefaults.accentColor,
    eventName:      db?.eventName      ?? envDefaults.eventName,
    eventDate:      db?.eventDate      ?? envDefaults.eventDate,
    contactEmail:   db?.contactEmail   ?? envDefaults.contactEmail,
    paymentMethods: db?.paymentMethods?.length ? db.paymentMethods : envDefaults.paymentMethods,
    timezone:       envDefaults.timezone,
  })
}
