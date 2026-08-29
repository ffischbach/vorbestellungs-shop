# ADR-004: Feste Vereins-Timezone statt Server- oder Browser-Zeitzone für Zeitslots

**Status:** Akzeptiert
**Datum:** 2026

---

## Kontext

`PickupSlot.startTime`/`endTime` werden als UTC-Instant in der DB gespeichert. Es gab
keine dokumentierte Umrechnungsregel zwischen dieser UTC-Zeit und der Wanduhrzeit, die
Admin und Kunden sehen/eingeben — mit der Folge, dass Schreib- und Lesepfad
unterschiedliche, undokumentierte Annahmen trafen: `createSlotAction`/`updateSlotAction`
interpretierten den `<input type="datetime-local">`-Wert des Admin-Formulars implizit in
der **Server**-Zeitzone (`new Date(rawString)` läuft im Node-Prozess), während
`SlotTable.tsx` denselben Wert beim Vorbefüllen des Bearbeiten-Formulars in
**Browser**-Zeitzone zurückrechnete. Die Shop- und Admin-Anzeige (`lib/slots.ts`,
`order.ts`-E-Mail) formatierte wiederum ohne explizite `timeZone`-Option, also ebenfalls
in Server-Prozess-Zeit.

Optionen:
- **Browser-Zeitzone des Betrachters.** Admin-Eingabe wird als Browser-lokale Zeit
  interpretiert und nach UTC konvertiert; Anzeige erfolgt wieder in Browser-lokaler Zeit
  (client-seitige Neuformatierung nötig, da Shop-Seiten Server Components sind).
- **Feste, konfigurierte Vereins-Zeitzone.** Eine IANA-Zeitzone pro Instanz
  (`ClubConfig.timezone`, Default `Europe/Berlin`) ist der einzige Bezugspunkt für
  Umrechnung und Anzeige — unabhängig davon, wo Admin oder Kunde sich gerade befinden.

---

## Entscheidung

**Feste, konfigurierte Vereins-Zeitzone** (`ClubConfig.timezone`, `CLUB_TIMEZONE`-Env-Var,
Default `Europe/Berlin`) als einziger Bezugspunkt für alle Zeitslot-Umrechnungen und
-Anzeigen, umgesetzt in einer gemeinsamen Utility (`packages/config/src/timezone.ts`).

---

## Begründung

Der Abholtermin ist an einen physischen Ort gebunden (REQ-04) — die Vereins-Veranstaltung
findet zu einer festen Uhrzeit an einem festen Ort statt, unabhängig davon, aus welcher
Zeitzone ein Kunde gerade den Shop öffnet oder wo der Hosting-Server steht.
Browser-Zeitzone als Bezugspunkt würde bedeuten: Ein Kunde mit falsch eingestelltem oder
auf Reisen befindlichem Gerät sähe eine Abholzeit, die nicht der tatsächlichen Zeit vor
Ort entspricht — das ist bei einem Termin an einem physischen Ort ein Fehler, keine
Komfortfunktion.

Eine feste Vereins-Zeitzone ist außerdem konsistent mit ADR-002 (Single-Tenant): Eine
Instanz bedient genau einen Verein an genau einem Ort, es gibt keine Notwendigkeit für
Multi-Timezone-Unterstützung.

---

## Konsequenzen

- Neue Server Actions/Anzeige-Orte, die `PickupSlot.startTime`/`endTime` verarbeiten,
  müssen `zonedDateTimeLocalToUtc()`/`utcToZonedDateTimeLocal()`/`formatInTimeZone()`
  aus `packages/config/src/timezone.ts` verwenden — nie `new Date(rawString)` oder
  `toLocaleTimeString()` ohne `timeZone`-Option (siehe [INV-10](../../domain/invariants.md#inv-10--zeitslot-zeiten-laufen-immer-über-die-feste-vereins-timezone-nie-über-server--oder-browser-zeitzone)).
- `ClubConfig.timezone` ist bewusst **nicht** über die Admin-Settings-UI/DB editierbar,
  sondern nur über `CLUB_TIMEZONE` env — es ist ein Infra-/Deployment-Setting wie der
  Serverstandort, kein Event-Detail, das sich pro Saison ändert.
- Der Import-Flow (`shopImport.ts`) erwartet weiterhin `startTime`/`endTime` als
  UTC-ISO-Strings mit `Z`-Suffix (Zod `.datetime()`) — wer diese von Hand befüllt, muss
  selbst von der Vereins-Zeitzone nach UTC umrechnen (dokumentiert in der
  `shop-setup`-Skill).
- Sommer-/Winterzeit-Umstellungen werden korrekt behandelt (`Intl.DateTimeFormat` löst
  den Offset pro Zeitpunkt auf), aber ein Zeitslot, dessen Zeitraum genau in eine
  Umstellungsnacht fällt, bleibt ein von der Zeitzonendatenbank abhängiger Sonderfall
  (nicht speziell behandelt, da für einen Vereins-Abholtermin tagsüber irrelevant).

---

## Revisited wenn...

Das Projekt gibt ADR-002 (Single-Tenant) auf und unterstützt mehrere Vereine/Orte in
unterschiedlichen Zeitzonen in derselben Instanz — dann müsste `timezone` von einer
globalen Konstante zu einem pro-Event-Feld werden.
