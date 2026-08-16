---
name: new-feature
description: Workflow for starting a new feature or behavior change on order/admin/email flows, auth, or the Prisma schema — checks docs/domain/requirements.md and docs/domain/invariants.md before touching code, runs an explicit ADR-worthiness test, and keeps REQ-/INV-IDs and docs/domain/flows.md current while implementing. Use when beginning implementation work, not for pure bugfixes.
---

# New Feature

Bevor Code für ein neues Feature oder eine Verhaltensänderung entsteht: prüfen, was
dieses Projekt darüber schon weiß, und während der Arbeit aktuell halten. Docs verrotten
nicht durch böse Absicht, sondern weil das Nachtragen an keinem konkreten Moment im
Workflow hängt — dieser hier ist der Moment.

## 1. Vor der Implementierung

1. [`docs/domain/requirements.md`](../../../docs/domain/requirements.md) lesen —
   betrifft die Aufgabe ein bestehendes `REQ-XX`? Notieren, welches.
2. [`docs/domain/invariants.md`](../../../docs/domain/invariants.md) lesen — steht eine
   der Dateien, die geändert werden sollen, dort als "Durchgesetzt in" gelistet? Wenn ja:
   Invariante verstehen, bevor Code angefasst wird — nicht danach.
3. Den **ADR-Test** anwenden (siehe unten). Falls er zuschlägt: ADR *vor* der
   Implementierung entwerfen, nicht als Nachtrag am Ende — sonst passiert genau das, was
   diesem Projekt schon passiert ist (3 ADRs seit Projektstart, obwohl seitdem mehrere
   strukturelle Entscheidungen getroffen wurden, die nie festgehalten wurden).

## 2. Der ADR-Test

Explizit prüfen, nicht "nach Gefühl" entscheiden. Bei **zwei oder mehr Ja**: ADR nötig.

- Ist die Entscheidung teuer/unumkehrbar rückgängig zu machen (Datenmodell-Paradigma,
  Framework, Auth-Mechanismus, Tenancy-Modell, Payment-Strategie)?
- Betrifft sie mehr als eine Komponente oder mehr als ein Package?
- Wurden mindestens zwei echte Optionen erwogen (nicht nur "die eine Lösung, die
  offensichtlich war")?
- Würde ein neuer Entwickler oder ein zukünftiger LLM-Agent in einigen Monaten fragen
  "warum ist das so gelöst?", ohne die Antwort direkt im Code zu finden?

Falls ADR nötig: neue Datei `docs/architecture/adr/00X-thema.md`, Vorlage
[`docs/architecture/adr/template.md`](../../../docs/architecture/adr/template.md).
Nummer = höchste bestehende Nummer + 1, nie wiederverwenden — auch nicht wenn ein ADR
später verworfen wird (Status auf "Verworfen" setzen, Datei bleibt bestehen).

## 3. Während der Implementierung

- Neue fachliche Anforderung entdeckt oder umgesetzt? Nächste freie `REQ-XX`-ID in
  `domain/requirements.md` vergeben.
- Ein nicht-offensichtliches Implementierungsdetail geschaffen, das ein anderes Feature
  brechen könnte, wenn es jemand unwissentlich ändert? Eintrag in `domain/invariants.md`
  (nächste freie `INV-XX`-ID) **plus** einzeiligen Kommentar an der Stelle im Code, der
  auf die ID verweist (Format: `// INV-XX: <kurzer Grund> — siehe docs/domain/invariants.md`).
- Verhaltensänderung an einem in `domain/flows.md` beschriebenen Ablauf? `flows.md`
  aktualisieren — nicht nur den Code, sonst ist der Flow-Doc beim nächsten Lesen falsch.

## 4. Vor dem Commit

Für den eigentlichen Commit/Review-Abgleich siehe die Skill
[`spec-review`](../spec-review/SKILL.md) — die läuft eigenständig, wenn die Änderung
committet oder reviewed wird.
