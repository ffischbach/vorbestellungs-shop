# CLAUDE.md

Dieses Dokument gibt Claude Code den nötigen Kontext über das Projekt. Lies es vollständig bevor du Änderungen vornimmst.

## Projektüberblick

Selbstgehosteter, DSGVO-konformer Online-Vorbestellungsshop für Vereine — ohne Zahlungsabwicklung. Kunden bestellen Produkte vor und wählen eine Abholzeit. Jeder Verein betreibt seine eigene Instanz (Single-Tenant, ADR-002).

Companion-Projekt: [vorbestellungs-kasse](https://github.com/ffischbach/vorbestellungs-kasse) (FastAPI + Python + SQLite, läuft auf Raspberry Pi am Event-Tag).

Dokumentation: [`docs/README.md`](docs/README.md) ist der Einstiegspunkt (Index mit Kategorien).
Fachliche Anforderungen und Kern-Flows stehen in `docs/domain/` — dort nachschauen, bevor
du eine Verhaltensänderung an Bestell-, Admin- oder E-Mail-Flows vornimmst, die dieses
Dokument nicht abdeckt. **Vor Refactoring ohne fachlichen Auftrag zusätzlich
[`docs/domain/invariants.md`](docs/domain/invariants.md) prüfen** — Implementierungsdetails,
die andere Features stillschweigend brechen könnten, sind dort mit `INV-XX`-IDs
dokumentiert und im Code an der jeweiligen Stelle verlinkt. Bei neuen Features greift die
Skill [`new-feature`](.claude/skills/new-feature/SKILL.md), vor Commits mit fachlicher
Relevanz und bei Code-Reviews [`spec-review`](.claude/skills/spec-review/SKILL.md), vor
Prisma-Migrationen [`db-migration-check`](.claude/skills/db-migration-check/SKILL.md) —
alle halten REQ-/INV-IDs und ADRs aktuell. [`docs-audit`](.claude/skills/docs-audit/SKILL.md)
führt den quartalsweisen Abgleich (Backlog BL-012) aus.

## Architektur auf einen Blick

```
Monorepo (Turborepo + pnpm workspaces)
├── apps/web          → Next.js 15 App (Shop + Admin, ein Deployment)
├── packages/database → Prisma Schema + Client
├── packages/email    → React Email Templates
├── packages/config   → Geteilte Typen + Club-Config-Schema (Zod)
└── infra/            → Terraform, Ansible, Docker Compose
```

**Keine** separaten Backend-Services. Alles läuft in `apps/web` via Server Actions und API Routes.

## Tech Stack

| Was | Womit |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript strict) |
| Datenbank | PostgreSQL 16 via Prisma |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Better Auth + TOTP |
| E-Mail | React Email + Nodemailer |
| Reverse Proxy | Caddy (automatisches HTTPS) |
| Deployment | Docker Compose auf Hetzner CPX21 |
| CI/CD | GitHub Actions → Webhook-Receiver auf Server |

## Entwicklungs-Commands

```bash
pnpm dev              # Alle Apps starten (watch mode)
pnpm build            # Production Build
pnpm typecheck        # TypeScript über alle Packages
pnpm lint             # ESLint über alle Packages
pnpm test             # Unit Tests
pnpm test:e2e         # Playwright E2E Tests

# Datenbank
pnpm db:migrate       # Prisma Migrations ausführen
pnpm db:migrate:dev   # Migration erstellen (Entwicklung)
pnpm db:seed          # Seed-Daten einspielen
pnpm db:studio        # Prisma Studio öffnen
pnpm db:reset         # DB zurücksetzen + seeden
pnpm db:reset:empty   # DB zurücksetzen ohne Seed-Daten (z. B. für den Setup-Import von Grund auf)

# E-Mail
pnpm email:dev        # React Email Dev Server (Port 3001)
```

Lokale Services (via `docker compose -f infra/docker/docker-compose.dev.yml up -d`):
- PostgreSQL: `localhost:5432`
- Mailpit SMTP: `localhost:1025`
- Mailpit UI: `localhost:8025`

## Wichtige Konventionen

### TypeScript
- `strict: true` überall, keine `any`-Typen ohne expliziten Kommentar
- Imports aus Packages immer über Package-Namen: `import { db } from '@repo/database'`
- Zod-Schemas für alle externen Inputs (API Routes, Server Actions, Config)

### Next.js
- Server Actions für alle Mutations (kein separates REST-Layer für interne Operationen)
- API Routes nur für: `/api/health`, `/api/cron/*`, `/api/export/*`
- `(shop)`-Route-Group für Kundenbereich, `admin/`-Ordner für Admin (via Middleware geschützt)
- Fehlerbehandlung: Server Actions geben `{ success: true, data }` oder `{ success: false, error }` zurück

### Datenbankzugriff
- Prisma Client **nur** aus `packages/database` importieren — niemals direkte DB-Verbindungen in `apps/web`
- Queries gehören in `packages/database/src/queries/` als typsichere Funktionen
- Migrations niemals manuell bearbeiten — nur via `pnpm db:migrate:dev`

### Styling
- Tailwind-Klassen direkt, kein `@apply` außer in globalen Basis-Styles
- Vereins-Farben ausschließlich über CSS Custom Properties (`--color-primary`, `--color-accent`)
- shadcn/ui-Komponenten liegen in `apps/web/src/components/ui/` — können angepasst werden

### E-Mail
- Templates immer in `packages/email/` — niemals Inline-HTML in der App
- `pnpm email:dev` nutzen um Templates vor dem Commit zu prüfen

### Authentifizierung & Session-Validierung

**Jede neue oder geänderte Server Action und API Route muss explizit entscheiden, ob sie authentifiziert oder öffentlich ist — und das umsetzen.**

Die Middleware prüft nur das Vorhandensein des Session-Cookies (Edge Runtime, kein DB-Zugriff möglich). Das reicht nicht als Sicherheitsgrenze — ein gefälschtes oder abgelaufenes Cookie käme durch.

**Für Admin-Operationen:** `requireAdmin()` aus `app/actions/admin.ts` als erste Zeile jeder Funktion aufrufen. Das Muster:
```typescript
async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  return session
}
// Jede Admin-Action:
export async function myAdminAction() {
  await requireAdmin()
  // ...
}
```

**Für Admin-API-Routes:** `auth.api.getSession({ headers: request.headers })` direkt am Anfang des Handlers prüfen und bei `null` mit `401` abbrechen.

**Für Cron-Routes:** `x-cron-secret`-Header gegen `process.env.CRON_SECRET` prüfen (bestehende Routen als Vorlage).

**Öffentliche Endpunkte** (Shop, Warenkorb, Bestellung) brauchen keine Session-Prüfung — aber das muss eine bewusste Entscheidung sein, nicht ein Versehen.

## Club-Konfiguration

`apps/web/club.config.ts` liest zur **Laufzeit** aus Umgebungsvariablen (`CLUB_NAME`, `CLUB_LOGO_URL`, `CLUB_PRIMARY_COLOR`, `CLUB_ACCENT_COLOR`, `CLUB_EVENT_NAME`, `CLUB_EVENT_DATE`, `CLUB_CONTACT_EMAIL`, `CLUB_TIMEZONE`). Schema und Zod-Validierung in `packages/config/src/club.ts`. `CLUB_TIMEZONE` (IANA-Zeitzone, Default `Europe/Berlin`) ist bewusst nur env, nicht über die Admin-UI/DB editierbar — siehe [ADR-004](docs/architecture/adr/004-timezone.md) und [INV-10](docs/domain/invariants.md).

- Nur in Server Components verwenden — niemals in Client Components importieren
- Farben über CSS Custom Properties an Client Components weitergeben
- Fallback-Werte in `club.config.ts` ermöglichen lokale Entwicklung ohne Env Vars

## Validierungsregeln

Regeln werden als JSON in der DB gespeichert und server-seitig ausgewertet. Neue Rule-Types nur in `packages/config/src/validation.ts` hinzufügen. Kein Client-seitiges Auswerten.

```typescript
// Erlaubte Rule-Types — niemals generisch erweitern ohne ADR
type ValidationRule =
  | { type: 'pickup_slot_match' }
  | { type: 'max_quantity_per_product'; productId: string; max: number }
  | { type: 'category_requires_slot'; categoryId: string; allowedSlotIds: string[] }
```

## Sicherheitsregeln

- Secrets **niemals** in Git committen — immer in `.env` (lokal) oder Ansible Vault (Produktion)
- `/admin`-Routen sind via `middleware.ts` geschützt — keine einzelnen Page-Level-Checks
- Rate Limiting auf `submitOrder` Server Action in `apps/web/lib/rate-limit.ts` (nicht in Caddy)
- TOTP-Pflicht für Admin-Logins in Production (`NODE_ENV === 'production'`)

## Infrastruktur

```
infra/
├── terraform/    → Server provisionieren (hcloud + hetznerdns Provider)
├── ansible/      → OS härten, Docker installieren, App deployen (Vault für Secrets)
└── docker/       → docker-compose.yml, Caddyfile, webhook/
```

Deployment-Flow: GitHub Actions → Docker-Image → GHCR → HMAC-Webhook → `deploy.sh` auf Server.

## Entscheidungen (ADRs)

Vor größeren strukturellen Änderungen lesen:
- `docs/architecture/adr/001-framework.md` — Warum Next.js statt Kotlin-Backend
- `docs/architecture/adr/002-tenancy.md` — Warum Single-Instance statt Multi-Tenant
- `docs/architecture/adr/003-validation.md` — Warum domain-spezifische Validierung

## Häufige Aufgaben

**Neue Prisma Migration:**
```bash
pnpm db:migrate:dev --name beschreibung_der_aenderung
```

**Neue shadcn/ui Komponente:**
```bash
cd apps/web && pnpm dlx shadcn@latest add <komponente>
```

**Neuen Validation Rule-Type:**
1. Type in `packages/config/src/validation.ts`
2. Evaluierungslogik in `apps/web/lib/validation/evaluate.ts`
3. Admin-UI in `apps/web/app/admin/rules/`
4. ADR-003 updaten

**E-Mail Template anpassen:**
```bash
pnpm email:dev  # Vorschau auf localhost:3001
```

## Tests

Vitest (Unit) und Playwright (E2E) sind in `apps/web` konfiguriert (`vitest.config.ts`,
`playwright.config.ts`). Testdateien liegen neben dem Code (`*.test.ts`), E2E-Specs in
`apps/web/e2e/` (`*.spec.ts`).

```bash
pnpm test                                          # alle Unit-Tests (via Turborepo)
pnpm --filter @repo/web exec vitest run <pfad>      # einzelne Testdatei
pnpm --filter @repo/web exec vitest <pfad>          # einzelne Testdatei im Watch-Mode
pnpm test:e2e                                       # Playwright E2E-Tests
```

`evaluateRules()` in `apps/web/lib/validation/evaluate.ts` ist der Referenzfall für pure,
gut testbare Funktionen — neue Validation-Rule-Types brauchen dort einen Testfall.

### Server Action Rückgabetypen — Ausnahme für `useActionState`
Die Konvention `{ success: true/false, ... }` gilt für alle Server Actions **außer** solchen, die
direkt mit `useActionState` verwendet werden (z. B. `loginAction`). Diese geben den State-Typ
zurück, den der Hook erwartet — typischerweise `{ error: string } | null`.

### API-Routen: Header-Namenskonvention
Alle geschützten API-Routen (`/api/cron/*`, `/api/export/*`) verwenden `x-cron-secret` als
Header-Namen und prüfen gegen `process.env.CRON_SECRET`.

### `getPickupSlots()` gibt `_count.orders` zurück
Die Queries liefern die Anzahl der Bestellungen pro Slot (`_count: { orders }`) statt der
vollständigen Order-Objekte. Für Capacity-Checks existiert `getSlotOrderCount(slotId)`.

### Seed nutzt eigenen PrismaClient
`packages/database/prisma/seed.ts` instanziiert einen eigenen `PrismaClient` statt den
Singleton aus `src/index.ts` zu nutzen. Das ist für Seed-Skripte akzeptabel.
