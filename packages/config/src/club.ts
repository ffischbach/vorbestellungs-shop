import { z } from 'zod'

export const clubConfigSchema = z.object({
  name: z.string().min(1),
  logoUrl: z.string().url().or(z.string().startsWith('/')),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  eventName: z.string().min(1),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  contactEmail: z.string().email(),
  paymentMethods: z.array(z.string().min(1)).min(1),
  // IANA-Zeitzone des Abholorts — nicht Server- oder Browser-Zeitzone (INV-10).
  timezone: z.string().min(1).default('Europe/Berlin'),
})

export type ClubConfig = z.infer<typeof clubConfigSchema>
