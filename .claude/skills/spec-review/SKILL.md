---
name: spec-review
description: Checks a diff (before commit, or during code review) against docs/domain/requirements.md, docs/domain/invariants.md, and docs/architecture/adr/ — flags violated invariants without an updated doc entry, structural changes missing an ADR, and stubs/hardcoded placeholders that look finished but aren't. Use before `git commit` on changes touching order/admin/email flows, auth, or the Prisma schema, and as a complement to /code-review (this checks doc traceability, not general code quality — run both).
---

# Spec Review

Prüft, ob ein Diff mit dem hält, was `docs/domain/` und `docs/architecture/adr/` über
das Projekt behaupten — ergänzt die normale Code-Review (Bugs, Style, CLAUDE.md-Konformität),
ersetzt sie nicht.

## Ablauf

1. `git diff` (staged oder gegen den Ziel-Branch) auf betroffene Bereiche prüfen:
   Bestell-/Admin-/E-Mail-Flow, Auth, `packages/database/prisma/schema.prisma`.
   Nichts davon betroffen? Skill hier beenden, nichts weiter zu tun.

2. **Invarianten-Check:** [`docs/domain/invariants.md`](../../../docs/domain/invariants.md)
   gegen den Diff lesen. Verletzt der Diff eine bestehende `INV-XX`, ohne dass der
   Eintrag aktualisiert oder bewusst als "jetzt anders" markiert wurde? → blockierend,
   nicht committen, bis geklärt ist ob die Invariante bewusst geändert wird (dann Eintrag
   anpassen) oder der Diff falsch ist.

3. **ADR-Check:** Enthält der Diff eine strukturelle Entscheidung (neues Datenmodell-Muster,
   neuer Auth-Mechanismus, neue Cross-Package-Abhängigkeit)? Den ADR-Test aus der Skill
   [`new-feature`](../new-feature/SKILL.md) auf den *fertigen* Diff anwenden (nicht nur
   auf die ursprünglich geplante Aufgabe — Scope wandert während der Implementierung).
   Fehlt ein ADR trotz zutreffendem Test? Vor dem Commit nachtragen.

4. **Requirement-Check:** Wird eine neue fachliche Anforderung umgesetzt, ohne dass sie
   eine `REQ-XX`-ID in [`docs/domain/requirements.md`](../../../docs/domain/requirements.md)
   hat? ID ergänzen.

5. **Stub-Check:** Sieht neuer Code fertig aus, ist aber absichtlich unvollständig (Stub,
   hartcodierter Platzhalter wie `evaluateRules([], ...)`)? Braucht einen `INV-XX`-Eintrag
   und/oder einen Backlog-Eintrag — sonst hält die nächste Person (Mensch oder Agent) den
   Code für fertig.

6. **Scope-Check:** Wurde beim Implementieren eine Diskrepanz zwischen Doku und Code
   entdeckt, die nicht zur aktuellen Aufgabe gehört (Beispiel: BL-011, entdeckt beim
   Schreiben von INV-02, aber nicht Teil der eigentlichen Aufgabe)? Nicht stillschweigend
   mitfixen — als eigenen Eintrag in `docs/backlog.md` dokumentieren und den Fund im
   Review erwähnen.

7. PR-Checkliste (`.github/pull_request_template.md`) gegen die obigen Punkte gegenlesen
   — sie muss die tatsächlichen `REQ-`/`INV-IDs` nennen, nicht pauschal abgehakt sein.

## Output

Kurze Liste: was geprüft wurde, was gefunden wurde (mit Datei:Zeile), was vor dem Commit
noch fehlt. Kein Fund? Kurz bestätigen und weitermachen — keine Checkliste ausbreiten,
wenn nichts zu melden ist.
