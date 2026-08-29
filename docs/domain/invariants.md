# Implementierungs-Invarianten

> Zielgruppe: Entwickler, AI Agents. Registry von Implementierungsdetails, die für ein
> Feature entscheidend sind, aber nicht aus dem Code selbst offensichtlich sind — Dinge,
> die jemand beim "Aufräumen" versehentlich brechen könnte, ohne den Grund zu kennen.
> Jede Invariante hat eine stabile ID (`INV-XX`), auf die Code-Kommentare verweisen
> (siehe unten bei jedem Eintrag "Durchgesetzt in").

**Regel:** Bevor du eine der unten verlinkten Dateien änderst — insbesondere bei
Refactoring oder "Cleanup" ohne fachlichen Auftrag — lies den zugehörigen Eintrag.
Neue Invarianten werden hier ergänzt, sobald ein nicht-offensichtliches Implementierungsdetail
entdeckt wird (z. B. während Code-Review oder Doku-Audit, siehe [Backlog BL-012](../backlog.md)).

---

### INV-01 · `CartReservation` ist kein Bestands-Lock

**Was:** `CartReservation` reserviert Bestand nicht wirklich — sie ist nur eine
UX-Krücke, damit der Warenkorb über Browser-Sessions/Reloads erhalten bleibt.

**Warum:** Ein echter Lock würde eine Reservierungs-Timeout-Logik mit Race-Conditions
zwischen mehreren Nutzern erfordern, die für die Event-Größenordnung dieses Projekts
nicht nötig ist. Die eigentliche Bestandsprüfung passiert serialisierbar in
`createOrder()`.

**Durchgesetzt in:** `packages/database/prisma/schema.prisma` (`CartReservation`-Modell)

**Was bricht, wenn ignoriert:** Wer `CartReservation` als verlässlichen Bestandsschutz
behandelt (z. B. Kapazitätsanzeige im Frontend darauf stützt), erzeugt eine Diskrepanz
zur tatsächlichen, erst bei Checkout serialisierbar geprüften Verfügbarkeit.

Details: [Kern-Flows → Bestellflow](flows.md#bestellflow-kunde)

---

### INV-02 · `OrderItem.price` ist ein Preis-Snapshot, nicht `Product.price`

**Was:** `OrderItem.price` speichert den Produktpreis zum Bestellzeitpunkt. Er darf
**nicht** durch den aktuellen (live) `Product.price` ersetzt werden.

**Warum:** Produktpreise können sich zwischen Bestellungen ändern (z. B. Preisanpassung
während des Events). Historische Bestellungen müssen den tatsächlich gezahlten Preis
zeigen, nicht den aktuellen.

**Durchgesetzt in:** `packages/database/src/queries/orders.ts` (`createOrder()` speichert
`price: item.price` korrekt als Snapshot) und `packages/database/prisma/schema.prisma`
(`OrderItem.price`-Feld).

**⚠️ Bekannte Verletzung dieser Invariante:** `apps/web/app/api/export/orders/route.ts`
nutzt in der CSV-Export-Spalte "Preis" aktuell `item.product.price` (live) statt
`item.price` (Snapshot) — bestätigter Bug, siehe [Backlog BL-011](../backlog.md). Bis
zum Fix zeigt der Kassen-Export bei nachträglichen Preisänderungen falsche historische
Preise.

---

### INV-03 · CSV-Exportformat ist mit `vorbestellungs-kasse` eingefroren

**Was:** Das Spaltenlayout des Bestellungs-CSV-Exports (`Bestellnummer,Name,E-Mail,
Zeitslot,Produkt,Menge,Preis,Status`) und die Nutzung von `orderNumber` (nicht der
internen `id`) als Join-Key sind ein Vertrag mit dem separaten Companion-Projekt
`vorbestellungs-kasse`.

**Warum:** Beide Projekte werden unabhängig deployed; es gibt keine versionierte API
zwischen ihnen, nur den CSV-Dateiaustausch. Formatänderungen sind Breaking Changes für
die Kasse, die still am Event-Tag fehlschlagen, nicht beim Build.

**Durchgesetzt in:** `apps/web/app/api/export/orders/route.ts`

**Was bricht, wenn ignoriert:** Das Format wurde bereits einmal geändert und wieder
zurückgerollt (Commits `9afe5d1` → `a166d89` → `02d8ade`). Details:
[Kern-Flows → CSV-Export](flows.md#csv-export-für-die-kasse).
**Vor jeder erneuten Formatänderung: mit der Kassen-Seite klären, nicht annehmen.**

---

### INV-04 · Rate-Limiting liest `x-real-ip`, nicht `x-forwarded-for`

**Was:** `checkRateLimit()` erwartet die Client-IP über den `x-real-ip`-Header.

**Warum:** Caddy (Reverse Proxy) setzt `x-real-ip`, nicht `x-forwarded-for`. Ein Wechsel
auf `x-forwarded-for` ohne Anpassung der Caddy-Konfiguration würde den Rate-Limiter mit
`unknown` als Key laufen lassen (siehe Fallback in `submitOrder()`) — alle Requests
teilen sich dann ein Kontingent.

**Durchgesetzt in:** `apps/web/lib/rate-limit.ts`, `apps/web/app/actions/order.ts`

Details: [Sicherheitsregeln](../../CLAUDE.md#sicherheitsregeln)

---

### INV-05 · `x-cron-secret`-Header-Konvention

**Was:** Alle `/api/cron/*`- und `/api/export/*`-Routen, die keine Admin-Session nutzen
(reine Server-zu-Server-Aufrufe), prüfen den `x-cron-secret`-Header gegen
`process.env.CRON_SECRET` — kein anderer Header-Name, kein Query-Parameter.

**Warum:** Konsistenz über alle Cron-Routen hinweg, damit nicht jede Route ihre eigene
Auth-Konvention erfindet (siehe [CLAUDE.md → Authentifizierung](../../CLAUDE.md#authentifizierung--session-validierung)).

**Durchgesetzt in:** `apps/web/app/api/cron/*/route.ts`

---

### INV-06 · Marketing-Consent-Kopplungsverbot

**Was:** Der Marketing-Opt-in im Checkout darf **niemals** Voraussetzung für eine
Bestellung sein — auch nicht indirekt (z. B. vorausgewählte Checkbox, die man aktiv
abwählen muss).

**Warum:** Art. 7(4) DSGVO (Kopplungsverbot). Ein Verstoß ist keine UX-Frage, sondern
ein rechtliches Risiko für den Verein als Betreiber.

**Durchgesetzt in:** Checkout-Formular (`marketingConsent`-Feld, Default `false`),
`Order.marketingConsent`/`marketingConsentAt`.

Details: [Fachliche Anforderungen → DSGVO-Prinzipien](requirements.md#dsgvo-prinzipien)

---

### INV-07 · `evaluateRules()` wird mit hartcodierter leerer Regelliste aufgerufen *(aufgelöst)*

**Status:** Aufgelöst — `submitOrder()` lädt Regeln jetzt über `getEnabledValidationRules()`
aus dem `ValidationRule`-Modell (siehe [BL-002](../backlog.md), abgeschlossen). Eintrag
bleibt zur Historie stehen, ID wird nicht wiederverwendet. Nachfolge-Invariante: [INV-09](#inv-09--validationrulerule-ist-ein-ungetyptes-json-feld).

---

### INV-08 · JSON-Setup-Import matcht per Name/Label, nicht per Unique-Constraint

**Was:** `importShopData()` erkennt "bereits vorhanden" für Category/PickupSlot/Product
per exaktem String-Vergleich (`name`, `label`, bzw. `(categoryId, name)` für Produkte)
via `findFirst` — es gibt **keine** `@@unique`-Constraint auf diesen Feldern in
`schema.prisma`.

**Warum:** Bewusst keine Migration für dieses additive Tooling-Feature (siehe
[REQ-08](requirements.md)). Ein `slug`-Feld + echter `prisma.upsert()` wäre robuster,
aber für eine kleine, admin-only Bootstrap-Operation nicht nötig.

**Durchgesetzt in:** `packages/database/src/queries/shopImport.ts`

**Was bricht, wenn ignoriert:** Wer manuell eine Kategorie/ein Produkt mit exakt
gleichem Namen wie im Import-JSON anlegt (z. B. mit abweichender Groß-/Kleinschreibung
oder Leerzeichen), erzeugt beim nächsten Import ein Duplikat statt eines Updates — der
Matching-Vergleich ist exakt, nicht fuzzy.

---

### INV-09 · `ValidationRule.rule` ist ein ungetyptes Json-Feld

**Was:** `ValidationRule.rule` (Prisma `Json`) hat keine Compile-Zeit-Typsicherheit. Die
Struktur wird **nur** an den Schreibgrenzen (Admin-Actions in `app/actions/admin.ts`) über
`validationRuleSchema` (`packages/config/src/validation.ts`) erzwungen — nicht beim
Lesen.

**Warum:** Ein direkter DB-Zugriff (z. B. manuelles Backfill-Skript, Prisma Studio) kann
ein Objekt speichern, das nicht zu `ValidationRule` aus `@repo/config` passt.
`getEnabledValidationRules()`/`getValidationRules()` casten `row.rule as ValidationRule`
ungeprüft.

**Was bricht, wenn ignoriert:** Wer Regeln außerhalb der Admin-Actions einspielt (Seed,
Migration, manuelles SQL) ohne gegen `validationRuleSchema` zu validieren, kann
`evaluateRules()` zur Laufzeit mit einem Objekt füttern, dessen `type`-Feld nicht zum
`switch` in `apps/web/lib/validation/evaluate.ts` passt.

**Durchgesetzt in:** `packages/database/prisma/schema.prisma` (`ValidationRule.rule`),
`packages/database/src/queries/validationRules.ts`, `packages/config/src/validation.ts`
(`validationRuleSchema`)

---

### INV-10 · Zeitslot-Zeiten laufen immer über die feste Vereins-Timezone, nie über Server- oder Browser-Zeitzone

**Was:** `PickupSlot.startTime`/`endTime` sind `DateTime` (UTC-Instant) in der DB.
Umrechnung zwischen der Wanduhrzeit des Abholorts und diesem UTC-Instant läuft
ausschließlich über `zonedDateTimeLocalToUtc()`/`utcToZonedDateTimeLocal()`/
`formatInTimeZone()` aus `packages/config/src/timezone.ts`, mit `ClubConfig.timezone`
(IANA-Zeitzone, `CLUB_TIMEZONE`-Env-Var, Default `Europe/Berlin`) als fixem Bezugspunkt —
siehe [ADR-004](../architecture/adr/004-timezone.md).

**Warum:** Der Abholtermin ist an einen physischen Ort gebunden (REQ-04). Weder die
Server-Prozess-Zeitzone (abhängig vom Hosting, meist UTC) noch die Browser-Zeitzone des
Betrachters (Admin oder Kunde, kann z. B. auf Reisen abweichen) dürfen die angezeigte
oder gespeicherte Uhrzeit beeinflussen — sonst zeigt der Shop eine andere Abholzeit an,
als am Ort tatsächlich gilt.

**Was bricht, wenn ignoriert:** Wer `new Date(rawString)` oder `toLocaleTimeString()`
ohne explizite `timeZone`-Option direkt auf `PickupSlot.startTime`/`endTime` anwendet
(z. B. in einer neuen Server Action oder einem neuen Anzeige-Ort), koppelt das Ergebnis
stillschweigend an die Zeitzone des ausführenden Prozesses — bei Server Actions die
Server-Zeitzone, bei `<input type="datetime-local">` implizit die Browser-Zeitzone.
Das führte genau zu diesem Bug: `createSlotAction`/`updateSlotAction` interpretierten den
Formular-Wert in Server-Zeit, während `SlotTable.tsx` ihn beim Vorbefüllen in
Browser-Zeit zurückrechnete — zwei verschiedene Zeitzonen für denselben Wert.

**Durchgesetzt in:** `packages/config/src/timezone.ts`, `apps/web/app/actions/admin.ts`
(`createSlotAction`, `updateSlotAction`), `apps/web/app/admin/(authenticated)/slots/SlotTable.tsx`,
`apps/web/lib/slots.ts` (`buildTimeSlots`), `apps/web/app/actions/order.ts`
(E-Mail-Bestätigung), `packages/config/src/club.ts` (`ClubConfig.timezone`)

## Neue Invarianten ergänzen

Wenn du beim Ändern von Code auf ein nicht-offensichtliches Implementierungsdetail
stößt, das andere Features/Annahmen betrifft: Eintrag hier ergänzen (`INV-XX`, nächste
freie Nummer, nie wiederverwenden) **und** einen einzeiligen Kommentar an der Stelle im
Code setzen, der auf die ID verweist, z. B.:

```ts
// INV-04: x-real-ip, nicht x-forwarded-for — siehe docs/domain/invariants.md
```
