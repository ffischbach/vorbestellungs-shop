---
name: commit
description: Bündelt den aktuellen Working-Tree-Diff in saubere, fachlich zusammengehörige Commits und committet sie im Stil dieses Projekts (`type(scope): summary` + Fließtext-Body zur Motivation). Use wenn der Nutzer "committe" oder "/commit" sagt.
---

# Commit

## Stil

```
type(scope): kurze zusammenfassung im imperativ, klein geschrieben, ohne punkt

Fließtext-Body: warum die Änderung passiert, nicht was in welcher Datei geändert
wurde (das steht im Diff). ~78–80 Zeichen breit. Englisch, auch wenn diese
Skill-Datei Deutsch ist.
```

- **type:** `feat`, `fix`, `docs`, `chore`, `security`, `ci`, `test`, `style`, `refactor`, `revert`.
  `security` statt `fix`, wenn eine Schwachstelle behoben oder eine Sicherheitsgrenze gehärtet wird.
- **scope:** ein Wort, der stärkst betroffene Bereich: `auth`, `admin`, `shop`, `email`, `infra`,
  `export`, `cart`, `orders`, `database`, `config`, `logging`, `monitoring`, `validation`, `claude`,
  `web`, `test`. Kein `misc`/`general`.
- Body erklärt die Motivation (Problem, vorheriger Zustand, Auslöser bei Bugfixes), keine Datei-Liste.
  Bei fachlichen Änderungen (Order-/Admin-/E-Mail-Flow, Auth, Schema) `REQ-XX`/`INV-XX` referenzieren,
  falls betroffen. Bullet-Liste nur bei Multi-Teil-Features mit mehreren unabhängigen sichtbaren
  Änderungen — sonst reicht ein Absatz.

## Ablauf

1. `git status` und `git diff` lesen, um den vollständigen Umfang der Änderungen zu erfassen.
2. Diff in **Bundles** aufteilen — jedes Bundle ist eine in sich abgeschlossene, fachlich
   zusammenhängende Änderung, die für sich genommen Sinn ergibt und einen eigenen `type(scope)`
   bekäme. Anhaltspunkte für einen Schnitt: unterschiedlicher Scope, unterschiedlicher Zweck
   (Feature vs. unabhängiger Fix vs. reines Refactoring), unzusammenhängende Dateien.
   Zusammengehörige Änderungen (z. B. Migration + zugehörige Query + UI dafür) bleiben ein Bundle.
3. Pro Bundle, nacheinander:
   - Nur die Dateien dieses Bundles stagen (`git add <pfad> ...`), nie pauschal `-A`/`.`.
   - Subject + Body nach obigem Stil formulieren.
   - Committen:
     ```bash
     git commit -m "$(cat <<'EOF'
     type(scope): summary

     Body-Absatz mit der Motivation.
     EOF
     )"
     ```
4. Am Ende `git status`, um zu bestätigen, dass alles committet ist und kein Bundle vergessen wurde.

Gilt zusätzlich zu den allgemeinen Git-Regeln aus `CLAUDE.md` (keine `--no-verify`, keine
Force-Operationen, neue Commits statt `--amend`, keine Secrets committen).
