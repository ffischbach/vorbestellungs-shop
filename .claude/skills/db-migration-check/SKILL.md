---
name: db-migration-check
description: Runs before creating or applying a Prisma migration (`pnpm db:migrate:dev`) — checks whether the schema change touches a model or field listed in docs/domain/invariants.md, whether docs/architecture/overview.md's schema excerpt needs updating, and whether the change needs a new INV-XX entry or an ADR. Use whenever packages/database/prisma/schema.prisma is modified, not just when the migrate command actually runs.
---

# DB Migration Check

Schema-Änderungen sind der Bereich mit der höchsten Invarianten-Dichte in diesem Projekt
— `CartReservation`, `OrderItem.price`, `Order.orderNumber` sind alle im Schema verankerte
Invarianten (siehe [`docs/domain/invariants.md`](../../../docs/domain/invariants.md)).
Migrationen werden laut [`CLAUDE.md`](../../../CLAUDE.md) nie manuell bearbeitet, nur via
`pnpm db:migrate:dev` — dieser Skill läuft *vor* diesem Befehl, nicht danach.

## Ablauf

1. `git diff packages/database/prisma/schema.prisma` ansehen (auch gegen ungestagte
   Änderungen). Welche Modelle/Felder sind betroffen?

2. **Invarianten-Abgleich:** Jedes betroffene Modell/Feld gegen
   [`docs/domain/invariants.md`](../../../docs/domain/invariants.md) prüfen (Abschnitt
   "Durchgesetzt in"). Trifft eine bestehende `INV-XX` zu?
   - Wird die Invariante absichtlich geändert (z. B. `CartReservation` soll doch ein
     echter Lock werden)? → Eintrag in `invariants.md` aktualisieren, nicht nur Code.
   - Wird sie versehentlich verletzt? → Vor der Migration klären, nicht nach dem Merge.

3. **Neue nicht-offensichtliche Details:** Führt die Änderung ein neues Detail ein, das
   ein anderes Feature betreffen könnte (z. B. ein neues `@@unique`, ein neues
   Cascade-Verhalten, ein neues Snapshot- vs. Live-Feld-Muster wie bei `OrderItem.price`)?
   → neue `INV-XX` in `invariants.md` **plus** Anker-Kommentar direkt im Schema
   (Format: `// INV-XX: <kurzer Grund> — siehe docs/domain/invariants.md`).

4. **ADR-Test:** Ist die Änderung ein neues Datenmodell-*Paradigma* (nicht nur ein neues
   Feld) — z. B. Soft-Delete statt Hard-Delete, ein neues Multi-Tenancy-Muster, ein
   generisches statt spezifisches Modell? Den ADR-Test aus der Skill
   [`new-feature`](../new-feature/SKILL.md) anwenden. Zutreffend? ADR vor der Migration
   entwerfen.

5. **`architecture/overview.md` nachziehen:** Der Datenmodell-Abschnitt dort ist ein
   *Auszug*, keine 1:1-Kopie — trotzdem: neue Modelle/Felder, die für das Verständnis der
   Architektur relevant sind, dort ergänzen (mit demselben kommentierten Stil wie die
   bestehenden Einträge).

6. Erst danach `pnpm db:migrate:dev --name beschreibung_der_aenderung` ausführen.

## Output

Kurz: welche Invarianten betroffen sind (falls welche), ob ein ADR nötig ist, was in
`overview.md`/`invariants.md` aktualisiert wurde. Kein Fund? Kurz bestätigen und die
Migration ausführen.
