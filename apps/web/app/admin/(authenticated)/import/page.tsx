import { ImportForm } from './ImportForm'

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Setup-Import</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Kategorien, Zeitslots und Produkte in einem Schritt per JSON einspielen — z. B.
          generiert mit dem Claude-Skill <code>shop-setup</code>.
        </p>
      </div>
      <ImportForm />
    </div>
  )
}
