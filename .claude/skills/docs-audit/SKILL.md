---
name: docs-audit
description: Runs the quarterly documentation audit (Backlog BL-012) — diffs the Prisma schema against docs/architecture/overview.md, checks new Server Actions/API routes for missing entries in docs/domain/flows.md or docs/domain/invariants.md, greps for undocumented TODO/FIXME, and reviews docs/backlog.md status. Use when the user asks for a docs audit/review, when BL-012 is due, or when picking up this project after a long gap.
---

# Docs Audit

Führt den in [`docs/backlog.md`](../../../docs/backlog.md) (BL-012) beschriebenen
Quartals-Abgleich aus — macht ihn aufrufbar statt darauf zu hoffen, dass ihn jemand
manuell anstößt. Ziel: `domain/requirements.md`, `domain/flows.md`,
`domain/invariants.md` und `architecture/overview.md` wieder auf den tatsächlichen
Codestand bringen, ohne dabei ungefragt Verhalten zu ändern — dieser Skill schreibt
Doku, keinen Produktcode.

## Ablauf

1. **Schema-Diff:** [`packages/database/prisma/schema.prisma`](../../../packages/database/prisma/schema.prisma)
   gegen den Datenmodell-Abschnitt in
   [`docs/architecture/overview.md`](../../../docs/architecture/overview.md) lesen.
   Neue Felder, Modelle oder Indizes, die im Doku-Auszug fehlen? Auszug nachziehen
   (Auszug bleibt bewusst gekürzt/kommentiert, keine 1:1-Kopie der ganzen Datei nötig).

2. **Neue Routen/Actions seit letztem Audit:** `git log --since="3 months ago" --diff-filter=A -- apps/web/app/actions apps/web/app/api`
   (Zeitraum anpassen, falls das letzte Audit-Datum bekannt ist — siehe Backlog-Historie)
   gegen `domain/flows.md` und `domain/invariants.md` prüfen: hat jede neue
   Server Action / Route, die einen Kern-Flow ändert oder ein nicht-offensichtliches
   Detail enthält, einen Eintrag?

3. **Backlog-Abgleich:** [`docs/backlog.md`](../../../docs/backlog.md) durchgehen —
   erledigte Punkte tatsächlich `[x]` markiert? Neue Erkenntnisse aus diesem Audit als
   neue `BL-XXX`-Einträge ergänzen (nächste freie Nummer).

4. **TODO/FIXME-Scan:** Repo-weit grep (`grep -rn "TODO\|FIXME" apps/ packages/ --include="*.ts" --include="*.tsx"`,
   `node_modules` ausschließen). Jeder Treffer: entweder schon im Backlog dokumentiert,
   oder neuer `BL-XXX`-Eintrag, oder offensichtlich trivial/veraltet (dann ignorieren,
   nicht neu dokumentieren).

5. **Stichproben-Linkcheck:** 2–3 interne Doku-Links in den geprüften Dateien anklicken
   bzw. Zielabschnitt lesen — der CI-Job `docs-links` fängt *tote* Links automatisch ab,
   aber nicht *inhaltlich veraltete* Zielabschnitte (Link geht ins Leere thematisch,
   nicht technisch).

6. **REQ-/INV-ID-Konsistenz:** Kurz prüfen, ob referenzierte IDs (`REQ-XX` in
   `requirements.md`, `INV-XX` in `invariants.md` und den zugehörigen Code-Kommentaren)
   noch übereinstimmen — keine ID im Code, die in der Doku nicht mehr existiert, und
   umgekehrt.

## Output

Kompakte Zusammenfassung: was geprüft wurde, was aktualisiert wurde, was als neuer
Backlog-Eintrag festgehalten wurde. Änderungen selbst vornehmen (Docs sind der Zweck
dieses Skills), aber vor dem Commit kurz zusammenfassen statt dem Nutzer die Diffs
kommentarlos vorzusetzen.
