'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resetShopDataAction, type ShopResetActionResult } from '@/app/actions/admin'
import { SHOP_RESET_CONFIRMATION_PHRASE } from '@/lib/shopReset'
import type { ShopResetCounts } from '@repo/database'

export function DangerZone({ counts }: { counts: ShopResetCounts }) {
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<ShopResetActionResult | null>(null)

  const nothingToDelete =
    counts.categories === 0 && counts.slots === 0 && counts.products === 0 && counts.orders === 0
  const canConfirm = confirmation === SHOP_RESET_CONFIRMATION_PHRASE && !isPending

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setConfirmation('')
      setResult(null)
    }
  }

  function handleConfirm() {
    startTransition(async () => {
      const res = await resetShopDataAction(confirmation)
      setResult(res)
      if (res.success) {
        setTimeout(() => handleOpenChange(false), 1500)
      }
    })
  }

  return (
    <div className="border border-destructive/40 p-4 space-y-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-destructive">Gefahrenzone</p>
        <p className="text-sm text-muted-foreground mt-1">
          Löscht unwiderruflich alle Kategorien, Zeitslots, Produkte und Bestellungen — z. B. um
          den Setup-Import an einer leeren Katalog-Datenbank zu testen. Admin-Zugänge und
          Vereinseinstellungen bleiben erhalten.
        </p>
      </div>
      <Button
        type="button"
        variant="destructive"
        disabled={nothingToDelete}
        onClick={() => setOpen(true)}
      >
        Kategorien, Zeitslots, Produkte &amp; Bestellungen löschen
      </Button>
      {nothingToDelete && (
        <p className="text-xs text-muted-foreground">Aktuell nichts zu löschen.</p>
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Katalog- und Bestelldaten unwiderruflich löschen?</DialogTitle>
            <DialogDescription>
              Folgendes wird gelöscht und kann nicht wiederhergestellt werden:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <ul className="list-disc pl-5 space-y-0.5">
              <li>{counts.categories} Kategorien</li>
              <li>{counts.slots} Zeitslots</li>
              <li>{counts.products} Produkte (inkl. hochgeladener Bilder)</li>
              <li>{counts.orders} Bestellungen</li>
            </ul>
            <p>
              Admin-Zugänge und Vereinseinstellungen (Name, Farben, Kontakt) bleiben
              unverändert.
            </p>
            <div>
              <Label htmlFor="reset-confirm" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Zum Bestätigen &bdquo;{SHOP_RESET_CONFIRMATION_PHRASE}&rdquo; eingeben
              </Label>
              <Input
                id="reset-confirm"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder={SHOP_RESET_CONFIRMATION_PHRASE}
                autoComplete="off"
                className="mt-1"
              />
            </div>
            {result && !result.success && (
              <p className="text-destructive">{result.error}</p>
            )}
            {result?.success && (
              <p className="text-primary">
                Gelöscht: {result.summary.categories} Kategorien, {result.summary.slots} Zeitslots,{' '}
                {result.summary.products} Produkte, {result.summary.orders} Bestellungen.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
              Abbrechen
            </Button>
            <Button type="button" variant="destructive" disabled={!canConfirm} onClick={handleConfirm}>
              {isPending ? 'Lösche…' : 'Endgültig löschen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
