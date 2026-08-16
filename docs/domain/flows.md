# Kern-Flows

> Zielgruppe: Entwickler, AI Agents. Beschreibt Abläufe End-to-End über mehrere Dateien
> hinweg — Details zu einzelnen Komponenten stehen im Code, nicht hier.

## Bestellflow (Kunde)

```
Produktübersicht (/)
  → Produkt zum Warenkorb hinzufügen
      → CartReservation in DB anlegen (sessionId + productId, TTL via expiresAt)
      → Reserviert Bestand testweise, verhindert Überbuchung durch parallele Nutzer
  → Warenkorb (/cart) — Mengen anpassen, Artikel entfernen
  → Checkout (/checkout)
      1. Abholzeit wählen (PickupSlot)
      2. Kontaktdaten: Name + E-Mail (Pflicht), Marketing-Opt-in (optional, default aus)
      3. Bestellung absenden → submitOrder() Server Action
  → submitOrder() (apps/web/app/actions/order.ts):
      a. Rate-Limit-Check per Client-IP (x-real-ip Header, von Caddy gesetzt)
      b. Input-Validierung (Zod)
      c. Validierungsregeln auswerten (evaluateRules, siehe ADR-003) — aktuell mit
         hartcodierter leerer Regelliste, siehe Backlog BL-002
      d. createOrder() — SERIALIZABLE-Transaktion:
         - Slot-Kapazität prüfen (aktive, nicht stornierte Bestellungen zählen)
         - Produkt-Stock prüfen (verkaufte Menge über alle nicht-stornierten Bestellungen)
         - Order + OrderItems anlegen, orderNumber (VB-XXXXXX) generieren und persistieren
      e. Bestätigungs-E-Mail versenden (order-confirmation Template, inkl. QR-Code-Link)
      f. CartReservations der Session löschen
  → Bestellbestätigung (/order-success) mit Bestellnummer
```

**Wichtig:** Slot-Kapazität und Produkt-Stock werden **serialisierbar** innerhalb einer
Transaktion geprüft — das verhindert Überbuchung bei gleichzeitigen Bestellungen kurz vor
Ausverkauf. Kein Client-seitiges "ist noch verfügbar"-Caching darf für die endgültige
Entscheidung herangezogen werden.

**Cart-Reservierungen sind kein Lagerbestand-Lock**, sondern nur eine UX-Krücke (Warenkorb
bleibt über Browser-Sessions/Reloads erhalten) — die eigentliche Bestandsprüfung passiert
erst bei `createOrder()`. Abgelaufene Reservierungen werden vom Cron-Endpoint
`/api/cron/cleanup-reservations` aufgeräumt.

## Admin-Flow: Event einrichten

Ablauf, den ein Vereins-Admin für ein neues Event durchläuft (siehe auch
[Setup-Anleitung](../operations/setup.md#schritt-7--shop-einrichten)):

```
1. Kategorien anlegen        (/admin/categories)
2. Zeitslots anlegen          (/admin/slots) — Label, Start-/Endzeit, optionale Kapazität
3. Produkte anlegen           (/admin/products) — Preis, Bild (S3-Upload), Kategorie,
                                 erlaubte Zeitslots, optionaler Stock, optionale Max-Menge
4. Club-Einstellungen prüfen  (/admin/settings) — überschreibt Env-Var-Defaults
                                 (ClubConfig Singleton-Tabelle)
5. Shop ist live sobald Produkte `available: true` sind — kein expliziter "Go-Live"-Schalter
```

Während des Events:

```
Bestellübersicht (/admin/orders)
  → Nach Status filtern (PENDING/CONFIRMED/CANCELLED)
  → Bestellstatus ändern (updateOrderStatusAction)
  → CSV-Export für Kasse herunterladen (siehe unten)
  → Marketing-Consent-CSV herunterladen (nur zustimmende Kunden)
```

## E-Mail- & Reminder-Flow

```
Checkout abgeschlossen → sofort: Bestätigungsmail (order-confirmation)

Täglicher Cron (POST /api/cron/reminder, x-cron-secret Header)
  → getOrdersPendingReminder(eventDate): alle PENDING-Bestellungen für den Eventtag
    mit reminderSent = false
  → Für jede: Erinnerungsmail (order-reminder) senden, reminderSent = true setzen
```

**Bekannte Lücke:** Bei Stornierung (`status → CANCELLED`) wird aktuell **keine**
Benachrichtigung an den Kunden verschickt — siehe [Backlog BL-004](../backlog.md).

## CSV-Export für die Kasse

Die Kasse (`vorbestellungs-kasse`, FastAPI/Python, läuft lokal auf einem Raspberry Pi am
Eventtag) importiert Bestellungen per manuellem CSV-Download — es gibt **keine** Live-API
zwischen den beiden Projekten.

**Endpoint:** `GET /api/export/orders` (Admin-Session erforderlich)

**Format** (eine Zeile pro Artikel, nicht pro Bestellung):

```
Bestellnummer,Name,E-Mail,Zeitslot,Produkt,Menge,Preis,Status
VB-A1B2C3,Max Mustermann,max@example.com,11:00 – 12:00 Uhr,Räucherfisch,2,8.50,CONFIRMED
```

Nur Bestellungen mit `status: CONFIRMED` werden exportiert. `Bestellnummer` ist die
öffentliche `VB-XXXXXX`-Nummer (nicht die interne Prisma-`id`) — **dieses Feld ist der
Schlüssel, den die Kasse zum Abgleich mit dem gescannten QR-Code/Bestellnummer-Eintrag
nutzt.** Änderungen an diesem Format sind ein Breaking Change für die Kasse und müssen
mit dem Companion-Projekt abgestimmt werden.

> Historie: Das Format wurde einmal versuchsweise auf ein anderes Spaltenlayout
> (getrennter Vor-/Nachname, numerische Bestell-ID, Netto-Summe pro Bestellung)
> umgestellt und wieder zurückgerollt (siehe Commits `9afe5d1` → `a166d89` → `02d8ade`).
> Der einzige tatsächlich übernommene Fix war: `orderNumber` statt interner `id`.
> **Vor jeder erneuten Formatänderung: mit der Kassen-Seite klären, nicht annehmen.**

**Marketing-Consent-Export:** `GET /api/export/marketing-consent` (Admin-Session
erforderlich) liefert nur Kunden mit `marketingConsent: true` und nicht-stornierten
Bestellungen — separat vom Bestell-Export, da unterschiedlicher Zweck (Newsletter-Versand
vs. Kassenabgleich) und unterschiedliche Rechtsgrundlage.

## Auth-Flow

Siehe [Architektur → Authentifizierung](../architecture/overview.md#authentifizierung)
für den technischen Ablauf. Fachlich relevant: Kunden haben **nie** einen Account, nur
Vereins-Admins loggen sich ein (Better Auth + Pflicht-TOTP in Production).
