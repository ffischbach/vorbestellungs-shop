'use client'

import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { importShopDataAction, type ShopImportActionResult } from '@/app/actions/admin'

const EXAMPLE = `{
  "categories": [{ "name": "Speisen" }],
  "slots": [
    { "label": "11:00 - 12:00", "startTime": "2026-07-19T11:00:00Z", "endTime": "2026-07-19T12:00:00Z", "capacity": 50 }
  ],
  "products": [
    { "name": "Schnitzel", "price": 8.5, "categoryName": "Speisen", "slotLabels": ["11:00 - 12:00"] }
  ]
}`

export function ImportForm() {
  const [json, setJson] = useState('')
  const [result, setResult] = useState<ShopImportActionResult | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    file.text().then(setJson)
  }

  function runAction(dryRun: boolean) {
    startTransition(async () => {
      const res = await importShopDataAction(json, dryRun)
      setResult(res)
      if (!dryRun) {
        if (res.success) {
          toast.success('Import abgeschlossen.')
        } else {
          toast.error(res.error)
        }
      }
    })
  }

  const canImport = result?.success === true && 'preview' in result

  return (
    <div className="space-y-4">
      <div className="border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="import-json" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            JSON
          </Label>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setJson(EXAMPLE)}>
              Beispiel einfügen
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
              Datei wählen
            </Button>
            <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleFile} className="hidden" />
          </div>
        </div>
        <Textarea
          id="import-json"
          value={json}
          onChange={(e) => {
            setJson(e.target.value)
            setResult(null)
          }}
          rows={14}
          placeholder="JSON hier einfügen…"
          className="font-mono text-xs"
        />
        <div className="flex items-center gap-3">
          <Button type="button" disabled={!json.trim() || isPending} onClick={() => runAction(true)}>
            {isPending ? 'Prüfe…' : 'Prüfen'}
          </Button>
          <Button type="button" disabled={!canImport || isPending} onClick={() => runAction(false)}>
            {isPending ? 'Importiere…' : 'Importieren'}
          </Button>
        </div>
      </div>

      {result && !result.success && (
        <pre className="border border-destructive/30 bg-destructive/5 text-destructive text-xs p-4 whitespace-pre-wrap">
          {result.error}
        </pre>
      )}

      {result?.success === true && 'preview' in result && (
        <PreviewTable preview={result.preview} />
      )}

      {result?.success === true && 'summary' in result && (
        <div className="border border-border p-4 text-sm space-y-1">
          <p className="font-bold">Import abgeschlossen.</p>
          <p>Kategorien: {result.summary.categoriesCreated} neu, {result.summary.categoriesUpdated} aktualisiert</p>
          <p>Zeitslots: {result.summary.slotsCreated} neu, {result.summary.slotsUpdated} aktualisiert</p>
          <p>Produkte: {result.summary.productsCreated} neu, {result.summary.productsUpdated} aktualisiert</p>
        </div>
      )}
    </div>
  )
}

function PreviewTable({
  preview,
}: {
  preview: { categories: { key: string; status: string }[]; slots: { key: string; status: string }[]; products: { key: string; status: string }[] }
}) {
  const sections: [string, { key: string; status: string }[]][] = [
    ['Kategorien', preview.categories],
    ['Zeitslots', preview.slots],
    ['Produkte', preview.products],
  ]
  return (
    <div className="border border-border p-4 space-y-4 text-sm">
      {sections.map(([title, entries]) => (
        <div key={title}>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{title}</p>
          <ul className="space-y-1">
            {entries.map((entry) => (
              <li key={entry.key} className="flex items-center justify-between">
                <span>{entry.key}</span>
                <span className={entry.status === 'neu' ? 'text-primary' : 'text-muted-foreground'}>
                  {entry.status === 'neu' ? 'NEU' : 'AKTUALISIERT'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
