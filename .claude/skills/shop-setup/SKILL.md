---
name: shop-setup
description: Generiert das JSON für den Admin-Setup-Import (Kategorien, Zeitslots, Produkte) aus einer Kurzbeschreibung, einer Speisekarte/Preisliste oder Antworten auf Rückfragen — validiert gegen packages/config/src/shopImport.ts, schreibt eine JSON-Datei, die anschließend unter /admin/import geprüft und importiert wird. Use wenn eine neue Vereins-Instanz aufgesetzt wird oder bestehendes Setup per Klartext erweitert werden soll (REQ-08).
---

# Shop-Setup

Vereins-Admins richten das Event typischerweise ohne technisches Vorwissen ein
(siehe [`docs/domain/requirements.md`](../../../docs/domain/requirements.md) → Zielgruppen).
Dieser Skill übersetzt eine Kurzbeschreibung oder eine bestehende Speisekarte in das
JSON-Format des Setup-Imports (REQ-08) — die KI läuft dabei bewusst außerhalb der
Laufzeit-App, die Schnittstelle ist reines JSON, kein API-Call aus dem Shop heraus.

## 1. Schema-Quelle

Das gültige Format steht **nur** in
[`packages/config/src/shopImport.ts`](../../../packages/config/src/shopImport.ts)
(`shopImportSchema`) — vor der Generierung dort nachlesen, nicht auf das folgende
Kurzbeispiel verlassen, falls sich das Schema seit Erstellung dieses Skills geändert hat.

Kurzbeispiel zur Orientierung:

```json
{
  "categories": [{ "name": "Speisen" }, { "name": "Getränke" }],
  "slots": [
    {
      "label": "11:00 - 12:00",
      "startTime": "2026-07-19T11:00:00Z",
      "endTime": "2026-07-19T12:00:00Z",
      "capacity": 50
    }
  ],
  "products": [
    {
      "name": "Schnitzel",
      "price": 8.5,
      "categoryName": "Speisen",
      "slotLabels": ["11:00 - 12:00"],
      "description": "mit Pommes"
    }
  ]
}
```

Wichtig: `categoryName` muss exakt einem Eintrag in `categories[].name` entsprechen,
jedes `slotLabels[]`-Element exakt einem `slots[].label` — das Schema validiert das per
`superRefine` und meldet sonst einen Fehler mit genauem Pfad. `slotLabels` weglassen,
wenn ein Produkt zu allen Slots passt.

## 2. Input erfragen

Kurz und konkret nachfragen, was noch fehlt:
- Kategorien (z. B. Speisen, Getränke, Kuchen)
- Typische Produkte + Preise — oder: eine vorhandene Speisekarte/Preisliste (Text, PDF,
  Foto) direkt einlesen und daraus ableiten, statt jedes Produkt einzeln zu erfragen
- Abholzeiten/Slots: Uhrzeiten, Kapazität pro Slot, ob Produkte auf bestimmte Slots
  beschränkt sind (REQ-04, z. B. "Räucherfisch nur 11–12 Uhr")

Nicht erfragen bzw. bewusst weglassen: `ClubConfig` (Branding/Farben, läuft über
`CLUB_*`-Env-Vars, siehe [CLAUDE.md](../../../CLAUDE.md#club-konfiguration)) und
Validierungsregeln (`ValidationRule` — aktuell nicht persistierbar, siehe
[INV-07](../../../docs/domain/invariants.md)).

## 3. JSON schreiben

Datei nach Rückfrage beim Nutzer ablegen (z. B. `shop-import.json` im Projekt-Scratch
oder einem vom Nutzer genannten Pfad) — nicht automatisch ins Repo committen, da es sich
um instanzspezifische Bootstrap-Daten handelt, nicht um Code.

## 4. Nächster Schritt

Nutzer auf `/admin/import` verweisen: JSON einfügen oder Datei hochladen, „Prüfen"
klicken (zeigt NEU/AKTUALISIERT je Eintrag sowie Validierungsfehler mit Pfad), Fehler
falls nötig beheben, dann „Importieren". Import ist wiederholbar (Matching per Name/Label,
siehe [INV-08](../../../docs/domain/invariants.md)) — ein zweiter Lauf mit geänderten
Werten aktualisiert bestehende Einträge, statt Duplikate anzulegen.
