import { getShopResetCounts } from '@repo/database'
import { PageHeader } from '@/components/admin/PageHeader'
import { ImportForm } from './ImportForm'
import { DangerZone } from './DangerZone'

export default async function ImportPage() {
  const counts = await getShopResetCounts()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Setup-Import"
        description="Kategorien, Zeitslots und Produkte in einem Schritt per JSON einspielen — z. B. generiert mit dem Claude-Skill shop-setup."
      />
      <ImportForm />
      <DangerZone counts={counts} />
    </div>
  )
}
