'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import Link from 'next/link'
import { ShopLayout } from './ShopLayout'
import { useCart } from './CartContext'
import { TimeSlotPicker, TimeSlot } from './TimeSlotPicker'
import { submitOrder } from '@/app/actions/order'

interface CheckoutPageClientProps {
  eventName: string
  eventDate: string
  logoUrl?: string
  slots: TimeSlot[]
  paymentMethods: string[]
}

export function CheckoutPageClient({
  eventName,
  eventDate,
  logoUrl,
  slots,
  paymentMethods,
}: CheckoutPageClientProps) {
  const { items, totalAmount, clearCart, selectedSlotId, setSelectedSlotId, sessionId, isLoading } = useCart()
  const [step, setStep] = useState(1)

  const availableSlots = slots.filter((slot) =>
    items.every(
      (item) => item.allowedSlotIds.length === 0 || item.allowedSlotIds.includes(slot.id)
    )
  )
  const effectiveSlotId = availableSlots.some((s) => s.id === selectedSlotId)
    ? selectedSlotId
    : undefined
  const [formData, setFormData] = useState({ name: '', email: '' })
  const [confirmed, setConfirmed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [capturedTotal, setCapturedTotal] = useState(0)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitError(null)

    const result = await submitOrder(
      {
        customerName: formData.name,
        email: formData.email,
        pickupSlotId: effectiveSlotId,
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      },
      sessionId
    )

    if (!result.success) {
      const messages: Record<string, string> = {
        SLOT_FULL: 'Dieser Zeitslot ist leider ausgebucht. Bitte wähle einen anderen.',
        SLOT_NOT_FOUND: 'Der gewählte Zeitslot existiert nicht mehr. Bitte wähle einen anderen.',
        PRODUCT_NOT_FOUND: 'Ein Produkt in deinem Warenkorb ist nicht mehr verfügbar.',
        PRODUCT_STOCK_EXCEEDED: 'Ein Produkt in deinem Warenkorb ist nicht mehr in ausreichender Menge verfügbar. Bitte passe deine Bestellung an.',
        INVALID_INPUT: 'Bitte überprüfe deine Eingaben.',
      }
      setSubmitError(messages[result.error] ?? result.error)
      setIsSubmitting(false)
      return
    }

    setCapturedTotal(totalAmount)
    clearCart()
    setOrderNumber(result.orderNumber)
    setOrderComplete(true)
    setIsSubmitting(false)
  }

  if (!isLoading && items.length === 0 && !orderComplete) {
    return (
      <ShopLayout
        eventName={eventName}
        eventDate={eventDate}
        logoUrl={logoUrl}
      >
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Warenkorb ist leer
          </h1>
          <p className="text-muted-foreground mb-6">
            Füge zuerst Produkte hinzu, um eine Bestellung aufzugeben.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center h-12 px-6 bg-foreground text-background font-bold hover:bg-foreground/90 transition-colors"
          >
            Zurück zum Shop
          </Link>
        </div>
      </ShopLayout>
    )
  }

  if (orderComplete) {
    return (
      <ShopLayout
        eventName={eventName}
        eventDate={eventDate}
        logoUrl={logoUrl}
      >
        <div className="text-center py-12 space-y-6">
          <div className="mx-auto w-16 h-16 bg-success/10 flex items-center justify-center">
            <Check className="w-8 h-8 text-success" strokeWidth={3} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Bestellung erfolgreich!
            </h1>
            <p className="text-muted-foreground">
              Deine Vorbestellung wurde aufgenommen.
            </p>
          </div>

          <div className="bg-card border border-border p-6 max-w-md mx-auto">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Bestellnummer</p>
                <p className="text-2xl font-bold text-foreground tracking-tight">
                  {orderNumber}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Abholzeit</p>
                <p className="text-lg font-bold text-foreground">
                  {slots.find((s) => s.id === effectiveSlotId)?.label}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Gesamtbetrag</p>
                <p className="text-lg font-bold text-foreground">
                  {capturedTotal.toFixed(2)} €
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted p-4 max-w-md mx-auto">
            <p className="text-sm text-foreground">
              Bitte halte deine Bestellnummer oder deinen Namen an der
              Abholstation bereit.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center h-12 px-6 bg-foreground text-background font-bold hover:bg-foreground/90 transition-colors"
          >
            Weitere Produkte bestellen
          </Link>
        </div>
      </ShopLayout>
    )
  }

  return (
      <ShopLayout
        eventName={eventName}
        eventDate={eventDate}
        logoUrl={logoUrl}
      >
      <div className="max-w-lg mx-auto space-y-6">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 transition-colors ${
                s <= step ? 'bg-foreground' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <h1 className="text-2xl font-bold text-foreground">
          Bestellung abschließen
        </h1>

        {/* Step 1: Pickup Time */}
        {step === 1 && (
          <div className="space-y-6">
            <TimeSlotPicker
              slots={availableSlots}
              selectedSlotId={effectiveSlotId}
              onSelectSlot={setSelectedSlotId}
            />

            <button
              onClick={() => effectiveSlotId && setStep(2)}
              disabled={!effectiveSlotId}
              className="w-full h-14 bg-foreground text-background font-bold text-base hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Weiter zu den Kontaktdaten
            </button>
          </div>
        )}

        {/* Step 2: Contact Info */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-bold text-foreground mb-1.5"
                >
                  Name *
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full h-11 px-3 border border-input bg-background text-foreground focus:outline-none focus:border-foreground transition-colors"
                  placeholder="Max Mustermann"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-bold text-foreground mb-1.5"
                >
                  E-Mail *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full h-11 px-3 border border-input bg-background text-foreground focus:outline-none focus:border-foreground transition-colors"
                  placeholder="max@beispiel.de"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Für die Bestellbestätigung per E-Mail
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 h-12 border border-border text-foreground font-bold hover:bg-muted transition-colors"
              >
                Zurück
              </button>
              <button
                onClick={() =>
                  formData.name && formData.email && setStep(3)
                }
                disabled={!formData.name || !formData.email}
                className="flex-1 h-12 bg-foreground text-background font-bold hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Weiter zur Bestätigung
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment & Confirmation */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-card border border-border p-5 space-y-4">
              <div className="flex items-center gap-3 text-foreground">
                <h2 className="text-base font-bold tracking-tight">Zahlung vor Ort</h2>
              </div>

              <p className="text-muted-foreground">
                Du zahlst bequem an der Abholstation. Wir speichern keine
                Zahlungsdaten.
              </p>

              <div className="bg-muted p-3">
                <p className="text-xs text-foreground font-bold uppercase tracking-wider">
                  Zahlungsmethoden vor Ort:
                </p>
                <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                  {paymentMethods.map((method) => (
                    <li key={method}>• {method}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-card border border-border p-5">
              <h3 className="font-bold text-foreground mb-3 tracking-tight">
                Bestellübersicht
              </h3>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-foreground">
                      {item.quantity}x {item.name}
                      {item.variantName && ` (${item.variantName})`}
                    </span>
                    <span className="text-muted-foreground">
                      {(item.price * item.quantity).toFixed(2)} €
                    </span>
                  </div>
                ))}
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between font-bold text-foreground">
                    <span>Gesamt</span>
                    <span>{totalAmount.toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1 w-4 h-4 border-border text-foreground focus:ring-foreground"
              />
              <span className="text-sm text-foreground">
                Ich bestätige, dass ich meine Bestellung im gewählten Zeitfenster
                abhole und vor Ort bezahle.
              </span>
            </label>

            {submitError && (
              <div className="bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
                {submitError}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setStep(2)}
                className="flex-1 h-12 border border-border text-foreground font-bold hover:bg-muted transition-colors"
              >
                Zurück
              </button>
              <button
                onClick={handleSubmit}
                disabled={!confirmed || isSubmitting}
                className="flex-1 h-12 bg-foreground text-background font-bold hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Wird verarbeitet...' : 'Bestellung aufgeben'}
              </button>
            </div>
          </div>
        )}
      </div>
    </ShopLayout>
  )
}
