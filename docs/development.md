# Lokale Entwicklung

## Voraussetzungen

- Node.js 20+
- pnpm 9+
- Docker + Docker Compose Plugin
- Git

## Setup

### 1. Repository klonen

```bash
git clone https://github.com/ffischbach/vorbestellungsshop
cd vorbestellungsshop
```

### 2. Dependencies installieren

```bash
pnpm install
```

### 3. Umgebungsvariablen

```bash
cp .env.example .env
```

Alle Werte in `.env.example` sind für lokale Entwicklung vorausgefüllt. Die `CLUB_*`-Variablen sind optional — ohne sie greift `club.config.ts` auf eingebaute Fallbacks zurück.

### 4. Lokale Infrastruktur starten

```bash
docker compose -f infra/docker/docker-compose.dev.yml up -d
```

Startet:
- PostgreSQL 16 auf Port `5432`
- Mailpit (lokaler SMTP-Server + Web-UI) auf Port `1025` (SMTP) / `8025` (Web)

### 5. Datenbank migrieren und befüllen

```bash
pnpm db:migrate
pnpm db:seed
```

### 6. Entwicklungsserver starten

```bash
pnpm dev
```

| URL | Beschreibung |
|---|---|
| http://localhost:3000 | Shop (Kundenansicht) |
| http://localhost:3000/admin | Admin-Panel |
| http://localhost:8025 | Mailpit (gesendete E-Mails ansehen) |

---

## Admin-Zugang anlegen (lokal)

`pnpm db:seed` legt **keinen** Admin-Account an — nur Produkte, Kategorien und Beispielbestellungen.

Admin-Account erstellen:

```bash
ADMIN_EMAIL=admin@localhost ADMIN_PASSWORD=admin123 pnpm admin:create
```

TOTP ist in der Entwicklungsumgebung deaktiviert (`NODE_ENV=development`).

---

## Projektstruktur: `apps/web`

```
apps/web/
├── app/
│   ├── (shop)/          # Kundenansicht (Route Group)
│   │   ├── page.tsx     # Produktübersicht
│   │   ├── cart/        # Warenkorb
│   │   └── checkout/    # Checkout
│   ├── admin/           # Admin-Panel (via Middleware geschützt)
│   │   ├── (authenticated)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx         # Dashboard
│   │   │   ├── products/
│   │   │   ├── categories/
│   │   │   ├── slots/
│   │   │   └── orders/
│   │   └── login/
│   ├── actions/         # Server Actions
│   └── api/
│       ├── auth/        # Better Auth Handler
│       ├── health/      # GET /api/health
│       ├── cron/
│       │   └── reminder/ # POST /api/cron/reminder
│       └── export/
│           └── orders/  # GET /api/export/orders
├── components/
│   └── ui/              # shadcn/ui Komponenten
├── lib/
│   ├── auth.ts          # Better Auth Konfiguration
│   ├── email.ts         # Nodemailer-Wrapper
│   ├── logger.ts        # Pino Logger
│   ├── utils.ts         # cn() Helper
│   └── validation/      # Validierungsregel-Auswertung
├── scripts/
│   └── create-admin.ts  # Admin-Account anlegen
├── club.config.ts       # Vereinskonfiguration (Runtime)
└── middleware.ts        # Auth-Schutz für /admin
```

---

## Nützliche Scripts

```bash
# Entwicklung
pnpm dev               # Alle Apps im Watch-Mode starten
pnpm build             # Production Build
pnpm typecheck         # TypeScript prüfen
pnpm lint              # ESLint
pnpm test              # Unit Tests

# Datenbank
pnpm db:migrate        # Migrations ausführen
pnpm db:migrate:dev    # Migration erstellen + ausführen (Entwicklung)
pnpm db:seed           # Seed-Daten einspielen
pnpm db:studio         # Prisma Studio öffnen (DB-Browser)
pnpm db:reset          # DB zurücksetzen + neu seeden

# E-Mail
pnpm email:dev         # React Email Dev Server (Template-Vorschau auf Port 3001)
```

---

## E-Mails lokal testen

Alle ausgehenden E-Mails landen in Mailpit und werden **nicht** wirklich verschickt:

http://localhost:8025

---

## Häufige Probleme

**Port 5432 bereits belegt:**
```bash
lsof -i :5432
# Oder anderen Port in .env und docker-compose.dev.yml setzen
```

**Prisma Client veraltet nach Schema-Änderung:**
```bash
pnpm db:migrate:dev
```

**Turborepo Cache-Probleme:**
```bash
pnpm turbo daemon clean
pnpm dev
```
