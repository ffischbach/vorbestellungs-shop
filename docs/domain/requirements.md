# Fachliche Anforderungen

> Zielgruppe: Entwickler, AI Agents. Beantwortet "was soll das System tun und warum" —
> für "wie ist es gebaut" siehe [Architektur](../architecture/overview.md).

## Zweck

Ein Verein veranstaltet ein zeitlich begrenztes Event (Vereinsfest, Weihnachtsmarktstand,
Grillfest o.ä.) und möchte, dass Besucher Speisen/Getränke **vorab online bestellen und
eine Abholzeit wählen**, statt vor Ort in der Schlange zu stehen. Bezahlt wird **immer
vor Ort** — der Shop wickelt keine Zahlungen ab.

## Zielgruppen

| Rolle | Bedürfnis |
|---|---|
| **Kunde** (Vereinsmitglied, Besucher) | In < 60 Sekunden am Handy bestellen, ohne Account, mit klarer Abholzeit |
| **Vereins-Admin** | Event ohne technisches Vorwissen einrichten (Produkte, Zeitslots, Regeln), Bestellungen am Eventtag im Blick behalten |
| **Kassenpersonal** (separates Projekt `vorbestellungs-kasse`) | Bestellungen am Stand schnell abhaken, ohne Internetverbindung zwingend zu brauchen |
| **Vereinsvorstand / Datenschutzbeauftragter** | DSGVO-Konformität, keine Abhängigkeit von US-Cloud-Diensten |

## Kernanforderungen

1. **Kein Zahlungsanbieter.** Keine Kreditkartendaten, kein Stripe/PayPal. Reduziert
   PCI-Scope, rechtliche Komplexität und Vertrauensbarrieren für kleine Vereine.
2. **Kein Kundenkonto.** Bestellung läuft komplett anonym über Name + E-Mail im
   Checkout. Kein Passwort, keine Registrierung → minimale DSGVO-Angriffsfläche
   (siehe [DSGVO-Prinzipien](#dsgvo-prinzipien)).
3. **Ein Event pro Instanz.** Die Instanz ist auf *ein* Event zugeschnitten
   (`CLUB_EVENT_NAME`, `CLUB_EVENT_DATE`), nicht auf einen Kalender wiederkehrender
   Events. Für ein neues Event wird die Instanz zurückgesetzt oder neu deployed
   (siehe [ADR-002](../architecture/adr/002-tenancy.md)).
4. **Abholzeit ist zentral.** Jede Bestellung hat *genau einen* Zeitslot. Produkte
   können auf bestimmte Slots beschränkt sein (z. B. "Räucherfisch nur 11–12 Uhr,
   solange der Grill an ist").
5. **Vereins-Branding, aber keine visuelle Individualisierung.** Nur Logo, Name,
   Primär-/Akzentfarbe sind konfigurierbar — Layout und Komponentenverhalten sind für
   alle Vereine identisch (siehe [UI/UX Guidelines](../guidelines/ui-ux-shop.md) §1.5).
6. **Bestellung muss stornierbar sein**, ohne dass Kundendaten inkonsistent werden
   (Status `CANCELLED`, Bestellung bleibt für Audit-Zwecke erhalten statt gelöscht).
7. **Integration mit der Kassen-App am Eventtag** — siehe
   [Kassen-Export-Contract](flows.md#csv-export-für-die-kasse).

## DSGVO-Prinzipien

Diese Prinzipien sind harte Randbedingungen, nicht optionale Best Practices — sie
leiten aus dem Fehlen einer Rechtsabteilung im typischen Kleinverein ab:

- **Datenminimierung:** Nur Name, E-Mail und Bestelldaten werden erhoben. Keine Adresse,
  keine Telefonnummer (Ausnahme: siehe [offene Diskussion](#offene-fachliche-fragen)),
  kein Tracking-Cookie, kein Drittanbieter-Analytics.
- **EU-Hosting:** Server stehen bei Hetzner in Deutschland (siehe
  [Architektur](../architecture/overview.md)).
- **Anonymisierte Logs:** IP-Adressen werden vor dem Log-Shipping anonymisiert
  (`1.2.3.x → 1.2.3.0`), Log-Retention 30 Tage.
- **Marketing-Einwilligung nach Art. 6/7 DSGVO:** Der Newsletter-Opt-in beim Checkout
  ist per Default **deaktiviert**, freiwillig und keine Bedingung für die Bestellung
  (Art. 7(4) DSGVO — Kopplungsverbot). Zustimmung wird mit Zeitstempel gespeichert
  (`Order.marketingConsent` / `marketingConsentAt`) als Nachweis (Art. 7(1) DSGVO).
  Stornierte Bestellungen werden aus dem Marketing-Export ausgeschlossen.
- **Löschkonzept auf Instanzebene:** Da jeder Verein eine eigene Datenbank betreibt,
  ist "alle Daten eines Vereins löschen" gleichbedeutend mit `DROP DATABASE` — keine
  anwendungsseitige Filterlogik nötig (siehe [ADR-002](../architecture/adr/002-tenancy.md)).

## Nicht-Ziele (bewusst außerhalb des Scopes)

- **Keine Zahlungsabwicklung** — auch nicht optional. Wer Payment braucht, ist nicht
  die Zielgruppe dieses Projekts.
- **Kein Multi-Tenant-Betrieb** einer Instanz für mehrere Vereine (siehe
  [ADR-002](../architecture/adr/002-tenancy.md)).
- **Keine generische Regel-Engine** für Validierung — nur die in
  [ADR-003](../architecture/adr/003-validation.md) definierten Rule-Types.
- **Keine Lagerverwaltung über das Event hinaus.** `Product.stock` ist ein einfacher
  Zähler pro Event, kein Warenwirtschaftssystem.
- **Kein Kundenaccount/Login/Bestellhistorie** für Kunden.

## Offene fachliche Fragen

Fragen, die noch keine getroffene Entscheidung haben — bei Bedarf mit dem Maintainer
klären, nicht selbstständig entscheiden:

- Braucht der Checkout eine Telefonnummer für Rückfragen vor Ort? (In den
  [UI/UX Guidelines](../guidelines/ui-ux-shop.md) §4.4 als Pflichtfeld skizziert,
  im aktuellen Checkout-Formular aber nicht umgesetzt — Diskrepanz, nicht bestätigt.)
- Produktvarianten (z. B. Pizzagröße) — Interface-Reste vorhanden, nie fertig
  implementiert. Siehe [Backlog](../backlog.md).
- Automatischer Datenaustausch mit der Kasse per Polling statt manuellem CSV-Export
  (siehe [Kassen-Export](flows.md#csv-export-für-die-kasse)) — setzt Netzwerkverbindung
  vom Raspberry Pi zum Shop-Server voraus, aktuell nicht umgesetzt.
