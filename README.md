# Vorbestellungsshop

Ein selbstgehosteter, DSGVO-konformer Online-Vorbestellungsshop für Vereine. Kunden können Produkte vorbestellen, eine Abholzeit wählen und eine Bestellbestätigung per E-Mail erhalten. Kein Zahlungsanbieter, keine Vendor-Lock-ins, vollständig Open Source.

Dieses Projekt ist als Companion zu [vorbestellungs-kasse](https://github.com/ffischbach/vorbestellungs-kasse) konzipiert.

---

## Features

- Produktübersicht mit Kategorien
- Konfigurierbarer Warenkorb
- Checkout mit Abholzeitslots (ohne Bezahlung)
- Konfigurierbare Validierungsregeln (z.B. Abholzeit muss mit Produkt kompatibel sein)
- E-Mail-Bestätigung bei Bestellung
- Erinnerungs-E-Mail am Tag vor dem Event
- Admin-Panel: Produkte, Kategorien, Zeitslots, Bestellübersicht, CSV-Export
- Vollständiges Theming pro Verein (Farben, Logo, Name)
- Mobile First
- DSGVO-konform (EU-Server, keine Drittanbieter-Tracker)

## Tech Stack

| Bereich | Technologie |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Datenbank | PostgreSQL 16 |
| ORM | Prisma |
| Styling | Tailwind CSS + shadcn/ui |
| E-Mail | React Email + Nodemailer (SMTP) |
| Auth | Better Auth + TOTP |
| Reverse Proxy | Caddy |
| Monorepo | Turborepo |
| IaC | Terraform + Ansible |
| CI/CD | GitHub Actions |
| Monitoring | Grafana + Loki + Prometheus |

## Projektstruktur

```
vorbestellungsshop/
├── apps/
│   └── web/                  # Next.js App (Shop + Admin)
├── packages/
│   ├── database/             # Prisma Schema + Client
│   ├── email/                # React Email Templates
│   └── config/               # Shared Types + Club Config Schema
├── infra/
│   ├── terraform/            # Hetzner Server Provisioning
│   ├── ansible/              # Server Konfiguration & Härtung
│   ├── docker/               # Docker Compose Files
│   └── monitoring/           # Grafana, Loki, Prometheus Configs
├── .github/
│   └── workflows/            # CI/CD Pipelines
└── docs/
    ├── README.md              # Dokumentations-Index
    ├── domain/                # Fachliche Anforderungen & Kern-Flows
    ├── architecture/          # Systemarchitektur, Datenmodell, ADRs
    ├── guidelines/            # UI/UX Guidelines (Shop & Kasse)
    ├── operations/            # Lokale Entwicklung & Deployment
    └── backlog.md             # Offene Verbesserungspunkte
```

## Dokumentation

Vollständiger Index mit Beschreibung: [docs/README.md](docs/README.md)

- [Fachliche Anforderungen](docs/domain/requirements.md) · [Kern-Flows](docs/domain/flows.md)
- [Architektur-Überblick](docs/architecture/overview.md)
- [ADR-001: Framework-Wahl](docs/architecture/adr/001-framework.md) · [ADR-002: Single-Tenant](docs/architecture/adr/002-tenancy.md) · [ADR-003: Validierung](docs/architecture/adr/003-validation.md)
- [Lokale Entwicklung](docs/operations/development.md) · [Setup & Deployment](docs/operations/setup.md)

## Schnellstart (Entwicklung)

```bash
git clone https://github.com/ffischbach/vorbestellungsshop
cd vorbestellungsshop
cp .env.example .env
docker compose -f infra/docker/docker-compose.dev.yml up -d
pnpm install
pnpm db:migrate
pnpm dev
```

Shop läuft auf http://localhost:3000, Admin unter http://localhost:3000/admin.

## Lizenz

MIT
