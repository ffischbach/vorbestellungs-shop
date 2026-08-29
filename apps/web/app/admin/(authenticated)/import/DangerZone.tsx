'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resetShopDataAction } from '@/app/actions/admin'
import { SHOP_RESET_CONFIRMATION_PHRASE } from '@/lib/shopReset'
import type { ShopResetCounts } from '@repo/database'

export function DangerZone({ counts }: { counts: ShopResetCounts }) {
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')

  const nothingToDelete =
    counts.categories === 0 && counts.slots === 0 && counts.products === 0 && counts.orders === 0

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setConfirmation('')
  }

  async function handleConfirm() {
    const result = await resetShopDataAction(confirmation)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success('Katalog- und Bestelldaten gelöscht.', {
      description:
        `Gelöscht: ${result.summary.categories} Kategorien, ${result.summary.slots} Zeitslots, ` +
        `${result.summary.products} Produkte, ${result.summary.orders} Bestellungen.`,
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

      <ConfirmDialog
        open={open}
        onOpenChange={handleOpenChange}
        title="Katalog- und Bestelldaten unwiderruflich löschen?"
        description="Folgendes wird gelöscht und kann nicht wiederhergestellt werden:"
        confirmLabel="Endgültig löschen"
        variant="destructive"
        confirmDisabled={confirmation !== SHOP_RESET_CONFIRMATION_PHRASE}
        onConfirm={handleConfirm}
      >
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
        </div>
      </ConfirmDialog>
    </div>
  )
}
