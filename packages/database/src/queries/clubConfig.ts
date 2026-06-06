import { db } from '../index'

const SINGLETON_ID = 'singleton'

export async function getClubConfigFromDb() {
  return db.clubConfig.findUnique({ where: { id: SINGLETON_ID } })
}

export async function upsertClubConfig(data: {
  clubName?: string
  logoUrl?: string
  primaryColor?: string
  accentColor?: string
  eventName?: string
  eventDate?: string
  contactEmail?: string
}) {
  return db.clubConfig.upsert({
    where: { id: SINGLETON_ID },
    update: data,
    create: { id: SINGLETON_ID, ...data },
  })
}
