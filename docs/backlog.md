# Backlog

Verbesserungspunkte aus Code-Review vom 2026-06-07.
Status: `[ ]` offen · `[~]` in Arbeit · `[x]` erledigt

---

## Priorität 1 — Sicherheit

### BL-001 · Rate Limiting für `submitOrder`

**Problem:** `CLAUDE.md` dokumentiert Rate Limiting auf `/api/checkout`, das aber nie
existiert hat. Die Server Action `submitOrder` (`app/actions/order.ts`) hat keinerlei
Drosselung. Angreifer können beliebig viele Bestellungen abschicken und so Slots und
Produktstock erschöpfen.

**Lösung:** `lib/rate-limit.ts` existiert bereits — den bestehenden Limiter in `submitOrder`
einbinden. Schlüssel: IP-Adresse aus dem Request-Header (z. B. `x-forwarded-for`), da
Server Actions keinen direkten `NextRequest`-Zugriff bieten (→ `headers()` aus
`next/headers`).

**Aufwand:** Klein (~1h)
**Risiko ohne Fix:** Mittel (DoS auf Slots/Stock möglich, kein Zahlungsschaden da kein Payment)

`[x]` erledigt (`849253885`) — Limiter liest `x-real-ip` (von Caddy gesetzt, siehe
[Sicherheitsregeln](../CLAUDE.md#sicherheitsregeln)), 5 Versuche/10min.

### BL-011 · CSV-Export nutzt live Produktpreis statt Preis-Snapshot

**Problem:** `apps/web/app/api/export/orders/route.ts` befüllt die CSV-Spalte "Preis"
mit `item.product.price` (aktueller, live Preis) statt `item.price`
(`OrderItem.price`, der zum Bestellzeitpunkt gespeicherte Snapshot — siehe
[INV-02](domain/invariants.md#inv-02--orderitemprice-ist-ein-preis-snapshot-nicht-productprice)).
`createOrder()` speichert den Snapshot korrekt, der Export ignoriert ihn nur.

**Auswirkung:** Ändert sich ein Produktpreis während oder nach dem Event, zeigt der
Kassen-Export für ältere Bestellungen den falschen (aktuellen statt historischen) Preis
— Kassenpersonal gleicht dann gegen einen falschen Betrag ab.

**Lösung:** `item.product.price.toString()` → `item.price.toString()` in
`route.ts`.

**Aufwand:** Trivial (~5min)

`[x]` erledigt — `item.price` statt `item.product.price` in `route.ts`.

---

## Priorität 2 — Halbfertige Features

### BL-002 · ValidationRules aus der Datenbank laden

**Problem:** Das gesamte Validierungssystem (`lib/validation/evaluate.ts`, alle drei
Rule-Types) ist implementiert, wird aber nie genutzt. `submitOrder` übergibt hartcodiert
`[]` als Regelliste (`order.ts:63`, TODO-Kommentar).

**Was fehlt:**
1. Prisma-Modell `ValidationRule` (Migration)
2. Query-Funktion `getValidationRules()` in `packages/database/src/queries/`
3. Admin-UI unter `app/admin/(authenticated)/rules/` (gemäß CLAUDE.md-Konvention)
4. `submitOrder` anpassen: Rules aus DB laden und an `evaluateRules()` übergeben
5. `ADR-003` ergänzen

**Aufwand:** Mittel (halber Tag)

`[x]` erledigt — Prisma-Modell `ValidationRule` (Migration
`20260829142422_add_validation_rule`), `getEnabledValidationRules()`/`getValidationRules()`
in `packages/database`, Admin-UI unter `/admin/rules`, `submitOrder` lädt aktive Regeln
statt hartcodiertem `[]`. Siehe [INV-09](domain/invariants.md#inv-09--validationrulerule-ist-ein-ungetyptes-json-feld).

### BL-003 · Produktvarianten fertig implementieren oder entfernen

**Problem:** `ProductCard` akzeptiert `variants?: { id: string; name: string; price: number }[]`
und `CartItem` hat ein `variantName`-Feld — es gibt aber keine UI dafür. Das Interface
deutet auf ein geplantes, nie fertiggestelltes Feature hin.

**Entscheidung nötig:**
- **Implementieren:** Varianten-Auswahl in `ProductCard`, Prisma-Modell anpassen,
  Preis pro Variante im Warenkorb speichern.
- **Entfernen:** Props und Feld löschen, damit kein Dead Code verbleibt.

**Aufwand:** Klein (entfernen: ~30min) · Mittel (implementieren: ~halber Tag)

`[x]` erledigt — entfernt. Kein dokumentierter fachlicher Bedarf (nur spekulatives
Beispiel in `domain/requirements.md`), keine Admin-UI, kein Prisma-Modell. Ein Verein
kann unterschiedliche Größen einfach als separate Produkte anlegen; eine
Schema-Migration für ein rein spekulatives Feature war nicht gerechtfertigt.
`variants`-Prop aus `ProductCard`, `variantName` aus `CartItem`/`CartContext`/
`CartPageClient`/`CheckoutPageClient` entfernt.

---

## Priorität 3 — UX Kunden

### BL-004 · Stornierungsmail an Kunden

**Problem:** Der Admin kann Bestellungen stornieren (`admin/orders/page.tsx`), der Kunde
bekommt aber keine Benachrichtigung. Es gibt bereits `order-confirmation` und
`order-reminder` — ein drittes Template fehlt.

**Lösung:**
1. Template `order-cancellation` in `packages/email/src/templates/` erstellen
2. `updateOrderStatusAction` in `app/actions/admin.ts` erweitern: bei Statuswechsel
   auf `CANCELLED` Mail versenden
3. Vorschau via `pnpm email:dev` prüfen

**Aufwand:** Klein (~2h)

`[x]` erledigt — Template `order-cancellation` in `packages/email/`,
`updateOrderStatusAction` versendet die Mail beim Übergang in `CANCELLED` (nicht bei
erneutem Speichern eines bereits stornierten Status).

### BL-005 · E-Mail-Validierung im Checkout verbessern

**Problem:** Im Checkout (Schritt 2) gibt es nur `type="email"` im Browser. Tippfehler
in der E-Mail-Adresse werden erst bemerkt, wenn die Bestätigungsmail nicht ankommt.

**Lösung:** Live-Validierung beim `onBlur`-Event: einfachen Regex-Check oder
`z.string().email()` client-seitig. Fehlermeldung direkt unter dem Eingabefeld anzeigen,
bevor man auf „Weiter" klicken kann.

**Aufwand:** Klein (~30min)

`[x]` erledigt — `onBlur`-Validierung mit `z.string().email()`, Fehlermeldung unter dem
Feld, „Weiter"-Button blockiert bis zur Korrektur.

---

## Priorität 4 — UX Admin

### BL-006 · Gesamtbetrag pro Bestellung in der Admin-Übersicht

**Problem:** `admin/orders/page.tsx` zeigt Artikel ohne Gesamtbetrag. Der Admin muss
manuell addieren.

**Lösung:** Spalte „Betrag" ergänzen. Der Betrag ist als `price * quantity` pro
`OrderItem` berechenbar — keine neue Query nötig, `getOrders()` liefert `item.price`
bereits.

**Aufwand:** Klein (~30min)

`[x]` erledigt — Spalte „Betrag" in `OrderTable.tsx`, berechnet aus `item.price *
item.quantity` (Preis-Snapshot, siehe INV-02).

### BL-007 · Gesamtumsatz auf dem Dashboard

**Problem:** Das Admin-Dashboard (`admin/(authenticated)/page.tsx`) zeigt nur Stückzahlen
(Gesamt, Ausstehend, Bestätigt, Storniert) — kein Umsatz.

**Lösung:** `getOrderStats()` in `packages/database` um `totalRevenue` erweitern
(Prisma `aggregate` auf `confirmed` Orders). Fünftes Stat-Tile auf dem Dashboard.

**Aufwand:** Klein (~1h)

`[x]` erledigt — `getOrderStats()` liefert `totalRevenue` (Summe aus `item.price *
item.quantity` über alle `CONFIRMED`-Bestellungen, Preis-Snapshot siehe INV-02), fünftes
Stat-Tile „Umsatz" auf dem Dashboard.

### BL-008 · Suche / Freitextfilter in der Bestellübersicht

**Problem:** Bei Events mit >50 Bestellungen gibt es keine Möglichkeit, nach einem
bestimmten Namen oder einer E-Mail-Adresse zu suchen. Nur der Statusfilter ist vorhanden.

**Lösung:** URL-Suchparam `q` ergänzen, `getOrders()` um optionalen `search`-Parameter
erweitern (Prisma `contains`, case-insensitive). Einfaches Texteingabefeld im
Admin-Header.

**Aufwand:** Klein (~1h)

`[ ]`

### BL-009 · Bestelldetailseite im Admin

**Problem:** Es gibt keine dedizierte Detailseite für eine einzelne Bestellung. Nützlich
für den Druck-/Ausgabe-Use-Case am Event-Tag (alternativ zum QR-Code).

**Lösung:** Route `admin/orders/[id]/page.tsx`, zeigt alle Bestelldaten inkl. QR-Code.
Optional: Druckansicht per `@media print`.

**Aufwand:** Mittel (~2h)

`[ ]`

### BL-013 · Deaktivierte Produkte verschwinden aus der Admin-Produktliste

**Problem:** `getProducts()` (`packages/database/src/queries/products.ts`) filtert
`where: { available: true }`. Diese Query wird sowohl im Shop als auch in
`admin/products/page.tsx` verwendet — sobald ein Admin ein Produkt über den
Verfügbarkeits-Toggle deaktiviert, verschwindet es beim nächsten Laden komplett aus der
Admin-Tabelle. Es gibt keinen Weg mehr, es dort wiederzufinden oder zu reaktivieren,
außer über die Datenbank.

**Auswirkung:** Reaktivieren eines Produkts ist über die UI nicht mehr möglich, sobald
es einmal deaktiviert wurde.

**Lösung:** Für den Admin-Bereich eine eigene Query (z. B. `getAllProducts()`) ohne den
`available`-Filter einführen, `getProducts()` bleibt für den Shop wie bisher.

**Aufwand:** Klein (~30min)
**Entdeckt bei:** Admin-UI-Konsistenz-Umbau (Migration auf `DataTable`/`ConfirmDialog`),
nicht Teil dieser Aufgabe.

`[ ]`

---

## Priorität 5 — Code-Qualität

### BL-010 · Test-Runner einrichten

**Problem:** `evaluate.test.ts` existiert, `pnpm test` ist aber ein No-Op — kein
Test-Runner ist konfiguriert (dokumentierte Einschränkung in `CLAUDE.md`).

**Lösung:** Vitest in `apps/web` einrichten (empfohlen in CLAUDE.md). Einstiegspunkt:
`lib/validation/evaluate.test.ts` als erster echter Testfall.

**Aufwand:** Klein (~1h für Setup, Tests laufen dann sofort)

`[x]` erledigt — Vitest + Playwright konfiguriert, siehe
[Entwicklung](operations/development.md) und CLAUDE.md-Abschnitt "Tests".

---

## Priorität 6 — Wiederkehrend

### BL-012 · Quartalsweises Doku-Audit

**Problem:** Ohne regelmäßigen Abgleich verrotten `domain/requirements.md`,
`domain/flows.md`, `domain/invariants.md` und `architecture/overview.md` unbemerkt gegen
den tatsächlichen Code — genau das ist bereits einmal passiert (veraltetes Prisma-Schema
in der Architektur-Doku, tote interne Links nach einer Umstrukturierung).

**Ablauf (quartalsweise, unabhängig von einzelnen Vereins-Events):**
1. `packages/database/prisma/schema.prisma` gegen `architecture/overview.md` diffen —
   neue Felder/Modelle dokumentiert?
2. Neue Server Actions / API-Routen seit letztem Audit: haben sie einen Eintrag in
   `domain/flows.md` bzw. `domain/invariants.md`, falls sie ein nicht-offensichtliches
   Detail enthalten?
3. `docs/backlog.md` durchgehen: erledigte Punkte markiert, neue Erkenntnisse ergänzt?
4. Repo-weit nach `TODO`/`FIXME` grep'en — landen relevante in `backlog.md`?
5. Stichprobenartig 2–3 interne Doku-Links anklicken (der CI-Link-Check fängt tote Links
   automatisch ab, aber nicht inhaltlich veraltete Ziel-Abschnitte).

**Aufwand:** Klein (~1h pro Quartal)

`[ ]`

---

## Diskussion / Offene Fragen

- **BL-009:** Überschneidung mit `vorbestellungs-kasse` (Raspberry Pi Kasse). Klären ob
  eine Admin-Detailseite überhaupt gebraucht wird oder ob die Kasse das abdeckt.
- **BL-002:** Rules-Admin-UI: Komplexität hängt davon ab wie viele Rule-Types aktiv
  genutzt werden. Erst mal einfache CRUD-Liste, keine Drag-and-Drop-Priorierung.
