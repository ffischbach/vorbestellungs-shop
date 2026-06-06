import { getClubConfig } from '@/club.config'
import { SettingsForm } from './SettingsForm'
import { LogoUpload } from './LogoUpload'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const clubConfig = await getClubConfig()

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vereinseinstellungen</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Name, Event-Daten und Farben des Shops konfigurieren
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Logo</h2>
        <LogoUpload currentLogoUrl={clubConfig.logoUrl} />
      </section>

      <SettingsForm current={clubConfig} />
    </div>
  )
}
