# Dokumentation

Index aller Projektdokumente, gruppiert nach Zweck. Neue Dokumente werden hier
verlinkt, nicht nur in der jeweiligen Kategorie.

## Domain — fachliche Anforderungen

Was das System tun soll und warum, unabhängig von der technischen Umsetzung.

- [Fachliche Anforderungen](domain/requirements.md) — Zielgruppen, Kernanforderungen (REQ-IDs), DSGVO-Prinzipien, Nicht-Ziele, offene Fragen
- [Kern-Flows](domain/flows.md) — Bestellflow, Admin-Event-Setup, E-Mail/Reminder, Kassen-Export-Contract
- [Implementierungs-Invarianten](domain/invariants.md) — nicht-offensichtliche Implementierungsdetails (INV-IDs), die andere Features stillschweigend brechen könnten

## Architecture — technische Umsetzung

Wie das System gebaut ist.

- [Architektur-Überblick](architecture/overview.md) — Systemübersicht, Datenmodell, Auth, Deployment-Pipeline
- [ADR-001: Framework-Wahl](architecture/adr/001-framework.md) — Next.js statt Kotlin-Backend
- [ADR-002: Single-Tenant](architecture/adr/002-tenancy.md) — eine Instanz pro Verein statt Multi-Tenant
- [ADR-003: Validierung](architecture/adr/003-validation.md) — domain-spezifische Rule-Types statt generischer Engine
- [ADR-Vorlage](architecture/adr/template.md) — Struktur für neue ADRs

## Guidelines — Konventionen für UI/UX

- [UI/UX Guidelines: Shop](guidelines/ui-ux-shop.md) — Kundenbereich (Next.js)
- [UI/UX Guidelines: Kasse](guidelines/ui-ux-kasse.md) — Companion-Projekt `vorbestellungs-kasse` (eigenständig lesbar)

## Operations — Betrieb

- [Lokale Entwicklung](operations/development.md) — Setup, Scripts, häufige Probleme
- [Setup & Deployment](operations/setup.md) — neuen Verein einrichten, Infrastruktur, Go-Live-Checkliste

## Sonstiges

- [Backlog](backlog.md) — offene Verbesserungspunkte, lebendes Dokument (Status wird gepflegt, nicht archiviert)

## Wo trägt man was ein?

| Neue Information über... | ...gehört nach |
|---|---|
| Was ein Feature fachlich leisten soll, für wen, warum | `domain/requirements.md` |
| Wie ein Ablauf über mehrere Dateien/Systeme hinweg funktioniert | `domain/flows.md` |
| Ein Implementierungsdetail, das andere Features stillschweigend brechen könnte | `domain/invariants.md` — plus 1-Zeilen-Kommentar im Code mit der `INV-XX`-ID |
| Eine unumkehrbare oder teure Strukturentscheidung | neue Datei `architecture/adr/00X-thema.md` |
| Technische Details zu Datenmodell, Auth, Deployment | `architecture/overview.md` |
| Design-Regeln, Farben, Komponenten-Verhalten | `guidelines/` |
| Befehle, lokales Setup, Server-Setup | `operations/` |
| Ein bekannter Mangel mit konkretem Fix-Vorschlag | `backlog.md` |
| Eine Next.js-/TypeScript-/Repo-Konvention für den täglichen Code | Root [`CLAUDE.md`](../CLAUDE.md) |

**Faustregel:** `CLAUDE.md` bleibt kurz und listet nur Konventionen, die bei praktisch
jeder Änderung relevant sind. Alles, was Kontext statt Konvention ist — Begründungen,
Abläufe, Domänenwissen — gehört in dieses `docs/`-Verzeichnis, verlinkt aus `CLAUDE.md`.

## Skills: `new-feature` & `spec-review`

Zwei Skills halten den REQ-/INV-/ADR-Abgleich an den Punkten aktuell, wo Doku und Code
sonst auseinanderlaufen — beide werden von Claude Code automatisch herangezogen, wenn
die Aufgabe dazu passt, können aber auch explizit aufgerufen werden:

- [`.claude/skills/new-feature/SKILL.md`](../.claude/skills/new-feature/SKILL.md) —
  vor und während der Implementierung: REQ-/INV-Check, ADR-Test, `flows.md` aktuell halten.
- [`.claude/skills/spec-review/SKILL.md`](../.claude/skills/spec-review/SKILL.md) —
  vor dem Commit oder bei Code-Review: prüft den fertigen Diff gegen `invariants.md`,
  `requirements.md` und ADRs. Ergänzt `/code-review`, ersetzt es nicht.
