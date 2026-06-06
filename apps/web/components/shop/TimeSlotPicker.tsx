'use client'

export type SlotStatus = 'available' | 'limited' | 'full'

export interface TimeSlot {
  id: string
  label: string
  startTime: string
  endTime: string
  status: SlotStatus
  remainingCapacity?: number
}

interface TimeSlotPickerProps {
  slots: TimeSlot[]
  selectedSlotId?: string
  onSelectSlot: (slotId: string) => void
}

export function TimeSlotPicker({
  slots,
  selectedSlotId,
  onSelectSlot,
}: TimeSlotPickerProps) {
  const getSlotStyles = (slot: TimeSlot, isSelected: boolean) => {
    if (isSelected) {
      return 'bg-foreground text-background border-foreground'
    }

    switch (slot.status) {
      case 'full':
        return 'bg-muted/50 text-muted-foreground border-border cursor-not-allowed opacity-40'
      case 'limited':
        return 'bg-warning/10 text-warning-foreground border-warning/30 hover:bg-warning/20 hover:border-warning/50'
      case 'available':
      default:
        return 'bg-card text-foreground border-border hover:border-foreground/40'
    }
  }

  const getStatusText = (slot: TimeSlot) => {
    switch (slot.status) {
      case 'full':
        return 'Ausgebucht'
      case 'limited':
        return slot.remainingCapacity
          ? `Noch ${slot.remainingCapacity}`
          : 'Fast voll'
      case 'available':
      default:
        return slot.remainingCapacity
          ? `${slot.remainingCapacity} frei`
          : 'Verfügbar'
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold tracking-tight">Abholzeit wählen</h2>
        <p className="text-xs text-muted-foreground">Wann möchtest du vorbeikommen?</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
        {slots.map((slot) => {
          const isSelected = selectedSlotId === slot.id
          const isDisabled = slot.status === 'full'

          return (
            <button
              key={slot.id}
              onClick={() => !isDisabled && onSelectSlot(slot.id)}
              disabled={isDisabled}
              className={`flex-shrink-0 flex flex-col items-center p-3 border min-w-[120px] transition-colors ${getSlotStyles(
                slot,
                isSelected
              )}`}
              aria-pressed={isSelected}
              aria-disabled={isDisabled}
            >
              <span className="text-base font-bold leading-none">
                {slot.startTime}
              </span>
              <span className="text-xs opacity-70 mt-1">bis {slot.endTime}</span>
              <span
                className={`mt-2 text-[11px] font-bold px-2 py-0.5 ${
                  isSelected
                    ? 'bg-background text-foreground'
                    : slot.status === 'limited'
                    ? 'bg-warning/20 text-warning-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {getStatusText(slot)}
              </span>
            </button>
          )
        })}
      </div>

      {selectedSlotId ? (
        <p className="text-xs text-muted-foreground">
          Es werden nur Produkte angezeigt, die zu dieser Abholzeit verfügbar sind.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Manche Produkte sind nur zu bestimmten Abholzeiten erhältlich.
        </p>
      )}
    </div>
  )
}
