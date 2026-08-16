# ADR-003: Domain-spezifische Validierungsregeln (kein generischer Rule Builder)

**Status:** Akzeptiert  
**Datum:** 2026

---

## Kontext

Bestellungen müssen vor dem Abschluss validiert werden. Der primäre Use-Case ist die Kompatibilität von Abholzeiten: Ein Räucherfisch ist nur zwischen 11–12 Uhr abholbar, ein Bier jederzeit — die gewählte Abholzeit der Bestellung muss zu allen bestellten Produkten passen.

Optionen:
- **Generischer Rule Builder** (z.B. `react-querybuilder` + `json-rules-engine`)
- **Domain-spezifische, konfigurierbare Rule-Types**

---

## Entscheidung

**Domain-spezifische Rule-Types** mit einer einfachen Konfigurations-UI im Admin-Panel.

---

## Begründung

Ein generischer Rule Builder (z.B. `react-querybuilder`) ist für SQL-ähnliche Filter-Abfragen gebaut. Die Validierungslogik hier ist aber auf die Domain zugeschnitten: Es geht nicht um beliebige Datenfilter, sondern um spezifische Bestellregeln.

**Probleme mit dem generischen Ansatz:**
- Domain-Konzepte (Zeitslots, Produktkategorien) müssen auf generische "Fields" gemappt werden — verliert semantische Klarheit
- UX für nicht-technische Vereins-Admins ist schlechter als eine spezialisierte UI
- Generische JSON-Rules sind schwerer zu verstehen und zu debuggen

**Vorteile des domain-spezifischen Ansatzes:**
- Admin-UI zeigt Klartext: "Räucherfisch ist erlaubt in: [Slot 11–12 Uhr ✓] [Slot 13–14 Uhr ✓]"
- Fehlermeldungen für Kunden können präzise formuliert werden
- Neuer Rule-Type = neuer Code-Beitrag (gut für Open-Source-Contributions)
- Kein zusätzliches Dependency-Gewicht

---

## Implementierung

```typescript
// packages/config/src/validation.ts

export type ValidationRule =
  | { type: 'pickup_slot_match' }
  | { type: 'max_quantity_per_product'; productId: string; max: number }
  | { type: 'category_requires_slot'; categoryId: string; allowedSlotIds: string[] }

export type ValidationResult =
  | { valid: true }
  | { valid: false; message: string }
```

Regeln werden in der Datenbank als JSON gespeichert, zur Checkout-Zeit auf dem Server ausgewertet (nicht im Client).

---

## Konsequenzen

- Anzahl der Rule-Types ist initial bewusst klein gehalten
- Neue Regeln können über Pull Requests ergänzt werden
- Kein Upgrade-Pfad zu einer generischen Engine nötig — Rule-Types decken realistische Vereins-Szenarien ab

---

## Revisited wenn...

Vereins-Admins signalisieren, dass sie Validierungslogik brauchen die sich nicht in vordefinierte Types abbilden lässt. Dann wäre `json-rules-engine` als optionale Erweiterung evaluierbar.
