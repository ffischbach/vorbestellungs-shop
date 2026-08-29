// INV-10: Alle Zeitslot-Anzeigen/-Eingaben laufen über die feste Vereins-Zeitzone,
// nicht über Server- oder Browser-Zeitzone — siehe docs/domain/invariants.md

/** Differenz (in Minuten) zwischen UTC und `timeZone` zum Zeitpunkt `date`. */
function getTimeZoneOffsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0'
  const asIfUtc = Date.UTC(
    Number(get('year')),
    Number(get('month')) - 1,
    Number(get('day')),
    Number(get('hour')),
    Number(get('minute')),
    Number(get('second')),
  )
  return (asIfUtc - date.getTime()) / 60_000
}

/**
 * Interpretiert einen `datetime-local`-Wert (z. B. "2027-03-26T11:00", ohne Offset) als
 * Wanduhrzeit in `timeZone` und gibt den entsprechenden UTC-Zeitpunkt zurück.
 */
export function zonedDateTimeLocalToUtc(value: string, timeZone: string): Date {
  const naiveUtc = new Date(`${value}:00.000Z`)
  if (isNaN(naiveUtc.getTime())) return naiveUtc
  const offsetMinutes = getTimeZoneOffsetMinutes(naiveUtc, timeZone)
  return new Date(naiveUtc.getTime() - offsetMinutes * 60_000)
}

/**
 * Formatiert einen UTC-Zeitpunkt als `datetime-local`-Wert ("YYYY-MM-DDTHH:mm") in der
 * Wanduhrzeit von `timeZone` — Gegenstück zu `zonedDateTimeLocalToUtc`, für die
 * Vorbefüllung von `<input type="datetime-local">`.
 */
export function utcToZonedDateTimeLocal(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(date)

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00'
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

/** Formatiert einen UTC-Zeitpunkt in `timeZone`, z. B. für Uhrzeit-/Datumsanzeigen. */
export function formatInTimeZone(
  date: Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
  locale = 'de-DE',
): string {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(date)
}
