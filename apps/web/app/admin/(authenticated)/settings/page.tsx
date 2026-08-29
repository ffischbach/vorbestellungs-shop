import { getClubConfig } from '@/club.config'
import { PageHeader } from '@/components/admin/PageHeader'
import { SettingsForm } from './SettingsForm'
import { LogoUpload } from './LogoUpload'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const clubConfig = await getClubConfig()

  return (
    <div className="space-y-8 max-w-2xl">
      <PageHeader
        title="Vereinseinstellungen"
        description="Name, Event-Daten und Farben des Shops konfigurieren"
      />

      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Logo</h2>
        <LogoUpload currentLogoUrl={clubConfig.logoUrl} />
      </section>

      <SettingsForm current={clubConfig} />
    </div>
  )
}
