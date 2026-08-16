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

`[ ]`

### BL-003 · Produktvarianten fertig implementieren oder entfernen

**Problem:** `ProductCard` akzeptiert `variants?: { id: string; name: string; price: number }[]`
und `CartItem` hat ein `variantName`-Feld — es gibt aber keine UI dafür. Das Interface
deutet auf ein geplantes, nie fertiggestelltes Feature hin.

**Entscheidung nötig:**
- **Implementieren:** Varianten-Auswahl in `ProductCard`, Prisma-Modell anpassen,
  Preis pro Variante im Warenkorb speichern.
- **Entfernen:** Props und Feld löschen, damit kein Dead Code verbleibt.

**Aufwand:** Klein (entfernen: ~30min) · Mittel (implementieren: ~halber Tag)

`[ ]`

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

`[ ]`

### BL-005 · E-Mail-Validierung im Checkout verbessern

**Problem:** Im Checkout (Schritt 2) gibt es nur `type="email"` im Browser. Tippfehler
in der E-Mail-Adresse werden erst bemerkt, wenn die Bestätigungsmail nicht ankommt.

**Lösung:** Live-Validierung beim `onBlur`-Event: einfachen Regex-Check oder
`z.string().email()` client-seitig. Fehlermeldung direkt unter dem Eingabefeld anzeigen,
bevor man auf „Weiter" klicken kann.

**Aufwand:** Klein (~30min)

`[ ]`

---

## Priorität 4 — UX Admin

### BL-006 · Gesamtbetrag pro Bestellung in der Admin-Übersicht

**Problem:** `admin/orders/page.tsx` zeigt Artikel ohne Gesamtbetrag. Der Admin muss
manuell addieren.

**Lösung:** Spalte „Betrag" ergänzen. Der Betrag ist als `price * quantity` pro
`OrderItem` berechenbar — keine neue Query nötig, `getOrders()` liefert `item.price`
bereits.

**Aufwand:** Klein (~30min)

`[ ]`

### BL-007 · Gesamtumsatz auf dem Dashboard

**Problem:** Das Admin-Dashboard (`admin/(authenticated)/page.tsx`) zeigt nur Stückzahlen
(Gesamt, Ausstehend, Bestätigt, Storniert) — kein Umsatz.

**Lösung:** `getOrderStats()` in `packages/database` um `totalRevenue` erweitern
(Prisma `aggregate` auf `confirmed` Orders). Fünftes Stat-Tile auf dem Dashboard.

**Aufwand:** Klein (~1h)

`[ ]`

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

## Diskussion / Offene Fragen

- **BL-003:** Brauchen wir Varianten wirklich? Falls ja, muss auch das Prisma-Schema
  (`Product` → `ProductVariant`) erweitert werden, was eine Migration erfordert.
- **BL-009:** Überschneidung mit `vorbestellungs-kasse` (Raspberry Pi Kasse). Klären ob
  eine Admin-Detailseite überhaupt gebraucht wird oder ob die Kasse das abdeckt.
- **BL-002:** Rules-Admin-UI: Komplexität hängt davon ab wie viele Rule-Types aktiv
  genutzt werden. Erst mal einfache CRUD-Liste, keine Drag-and-Drop-Priorierung.
