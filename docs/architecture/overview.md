# Architektur

> Zielgruppe: Entwickler, AI Agents. Beantwortet "wie ist das System gebaut" —
> für "was soll es tun" siehe [Fachliche Anforderungen](../domain/requirements.md)
> und [Kern-Flows](../domain/flows.md).

## Systemübersicht

```
┌──────────────────────────────────────────────────────┐
│               Hetzner CPX21 — App-Server             │
│  (3 vCPU, 4 GB RAM, 20 GB Datenvolume)               │
│                                                      │
│  Next.js :3000 · PostgreSQL :5432 · Caddy :80/:443   │
│  Webhook-Receiver · Node Exporter :9100 · Promtail   │
└──────────────────┬───────────────────────────────────┘
                   │ Logs (Promtail → Loki)
                   │ Metriken (Prometheus scrapes :9100)
┌──────────────────▼───────────────────────────────────┐
│           Hetzner CPX11 — Monitoring-Server          │
│  (2 vCPU, 2 GB RAM)                                  │
│                                                      │
│  Grafana :3000 · Loki :3100 · Prometheus             │
│  Blackbox Exporter (pingt /api/health)               │
│                                                      │
│  Alerts: E-Mail bei App-Down / Disk >80% / 5xx-Spike │
└──────────────────────────────────────────────────────┘
```

**DSGVO:** Alle Daten bleiben auf Hetzner-Servern in Deutschland. Promtail anonymisiert IP-Adressen vor dem Shipping (`1.2.3.x → 1.2.3.0`). Log-Retention: 30 Tage.

## Monorepo Subprojekte

### `apps/web` — Next.js Applikation

Die Kernapplikation. Enthält sowohl den kundenorientierten Shop als auch das Admin-Panel. Kein separates Backend — Next.js Server Actions und API Routes übernehmen die gesamte Geschäftslogik.

**Verantwortlichkeiten:**
- Shop: Produktlisting, Warenkorb, Checkout-Flow
- Admin: Produkt- & Kategorienverwaltung, Zeitslot-Konfiguration, Bestellübersicht, CSV-Export
- API Routes: Cron-Endpoint für Reminder-Mails, Health-Check, Export-Endpoint für vorbestellungs-kasse
- Middleware: Auth-Schutz für `/admin`-Routen, Rate Limiting auf Checkout

**Wichtige Designentscheidung:** Shop und Admin leben in derselben Next.js App unter `/` (Shop) und `/admin` (Admin). Next.js Middleware prüft die Session und schützt alle `/admin`-Routen. Das reduziert Deploymentkomplexität erheblich.

### `packages/database` — Datenbankschicht

Prisma Schema, alle Migrations und der typsichere DB-Client. Alle anderen Packages und Apps importieren den Client von hier — niemals direkte Datenbankverbindungen außerhalb dieses Packages.

**Enthält:**
- `prisma/schema.prisma` — Datenmodell (siehe unten)
- `prisma/migrations/` — Migrationsverlauf
- `prisma/seed.ts` — Seed-Daten für Entwicklung
- `src/index.ts` — exportiert den Prisma Client

### `packages/email` — E-Mail Templates

React Email Templates isoliert vom Rest der Applikation. Können lokal mit dem React Email Dev Server previewed werden (`pnpm email:dev`).

**Templates:**
- `order-confirmation.tsx` — Bestellbestätigung mit Bestelldetails
- `order-reminder.tsx` — Erinnerung am Tag vor dem Event

### `packages/config` — Geteilte Typen & Konfiguration

Das Bindeglied zwischen allen Packages. Enthält:
- Club-Konfigurationsschema (Zod) — validiert `club.config.ts`
- Geteilte TypeScript-Typen
- Validation-Rule-Typen (siehe Validierung)
- Zod-Schemas für API-Inputs

---

## Datenmodell

Vollständiges Schema: `packages/database/prisma/schema.prisma` (Quelle der Wahrheit —
dieser Auszug ist zur Orientierung, bei Abweichungen gewinnt die Datei).

```prisma
model Product {
  id               String             @id @default(cuid())
  name             String
  description      String?
  price            Decimal
  imageUrl         String?            // S3/Hetzner Object Storage, public-read
  available        Boolean            @default(true)
  maxQuantity      Int?               // Max. Menge pro Bestellung
  stock            Int?               // Max. verkaufbare Menge über alle Bestellungen; null = unbegrenzt
  category         Category           @relation(fields: [categoryId], references: [id])
  categoryId       String
  allowedSlots     PickupSlot[]
  orderItems       OrderItem[]
  cartReservations CartReservation[]
}

// Hält Warenkorb-Inhalte über Sessions/Reloads hinweg. Kein Bestand-Lock —
// die eigentliche Kapazitäts-/Stock-Prüfung passiert erst in createOrder().
model CartReservation {
  id        String   @id @default(cuid())
  sessionId String
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  quantity  Int
  expiresAt DateTime // aufgeräumt via Cron /api/cron/cleanup-reservations

  @@unique([sessionId, productId])
  @@index([productId, expiresAt])
}

model Category {
  id       String    @id @default(cuid())
  name     String
  products Product[]
}

model PickupSlot {
  id        String     @id @default(cuid())
  label     String     // z.B. "11:00 – 12:00 Uhr"
  startTime DateTime
  endTime   DateTime
  capacity  Int?       // null = unbegrenzt
  products  Product[]
  orders    Order[]
}

model Order {
  id                 String      @id @default(cuid())
  orderNumber        String      @unique // öffentliches Format: VB-XXXXXX, siehe Kassen-Export
  createdAt          DateTime    @default(now())
  customerName       String
  email              String
  pickupSlot         PickupSlot  @relation(fields: [pickupSlotId], references: [id])
  pickupSlotId       String
  status             OrderStatus @default(PENDING)
  items              OrderItem[]
  reminderSent       Boolean     @default(false)
  marketingConsent   Boolean     @default(false) // Art. 7(4) DSGVO: nie Pflicht
  marketingConsentAt DateTime?                   // Nachweis-Zeitstempel, Art. 7(1) DSGVO

  @@index([status])
  @@index([reminderSent, status])
  @@index([pickupSlotId])
}

model OrderItem {
  id        String  @id @default(cuid())
  quantity  Int
  price     Decimal // Preis zum Bestellzeitpunkt (Snapshot, nicht der aktuelle Product.price)
  order     Order   @relation(fields: [orderId], references: [id])
  orderId   String
  product   Product @relation(fields: [productId], references: [id])
  productId String
}

enum OrderStatus {
  PENDING
  CONFIRMED
  CANCELLED
}

// Singleton (id = "singleton"), überschreibt die Env-Var-Defaults aus club.config.ts
// zur Laufzeit über das Admin-Panel (/admin/settings).
model ClubConfig {
  id             String   @id @default("singleton")
  clubName       String?
  logoUrl        String?
  primaryColor   String?
  accentColor    String?
  eventName      String?
  eventDate      String?
  contactEmail   String?
  paymentMethods String[]
}
```

Better Auth verwaltet zusätzlich `User`, `Session`, `Account`, `Verification`,
`TwoFactor` — Standard-Modelle des Prisma-Adapters, nicht domain-spezifisch angepasst.

---

## Authentifizierung

**Kunden haben keine Accounts.** Der Checkout-Flow fragt Name und E-Mail direkt im Bestellformular ab — keine Registrierung, kein Login. Das reduziert DSGVO-Aufwand und Komplexität erheblich.

**Admins** authentifizieren sich über [Better Auth](https://better-auth.com) mit E-Mail + Passwort. In Production ist TOTP (Zwei-Faktor) Pflicht.

### Wie Auth funktioniert

```
Browser → POST /admin/login (Server Action)
  → auth.api.signInEmail()
  → Session-Token in Cookie setzen (better-auth.session_token, HttpOnly)
  → redirect(/admin)

Middleware (middleware.ts)
  → Alle /admin/* Routen geprüft
  → Kein Cookie → redirect(/admin/login)
  → Cookie vorhanden → weiter (echte Validierung in Server Actions)
```

### Admin-Account anlegen

Sign-up ist in Production standardmäßig deaktiviert (`disableSignUp` in `apps/web/lib/auth.ts`). Account-Erstellung über das mitgelieferte Script:

```bash
ADMIN_EMAIL=admin@meinverein.de ADMIN_PASSWORD=SICHERES_PASSWORT pnpm admin:create
```

Auf dem Server (Production) muss `ADMIN_SIGNUP_ENABLED=true` temporär gesetzt sein — siehe [Setup-Anleitung](../operations/setup.md#schritt-6--ersten-admin-account-anlegen).

### TOTP in Production

`twoFactor()` Plugin ist nur in `NODE_ENV=production` aktiv. Beim ersten Login nach Account-Erstellung TOTP im Admin-Panel einrichten. Ohne aktiviertes TOTP kann sich der Admin zwar einloggen, sollte es aber umgehend aktivieren.

---

## Validierungsregeln

Statt einer generischen Rule-Engine gibt es fest definierte Rule-Types (siehe
[ADR-003](adr/003-validation.md)), ausgewertet server-seitig zur Checkout-Zeit in
`evaluateRules()` (`apps/web/lib/validation/evaluate.ts`).

```typescript
// packages/config/src/validation.ts

type ValidationRule =
  | { type: 'pickup_slot_match' } // Alle Produkte im Warenkorb müssen den gewählten Slot erlauben
  | { type: 'max_quantity_per_product'; productId: string; max: number }
  | { type: 'category_requires_slot'; categoryId: string; allowedSlotIds: string[] }
```

Die Regeln werden sequenziell geprüft. Schlägt eine Regel fehl, bekommt der Nutzer eine
verständliche Fehlermeldung und die Bestellung wird nicht abgeschlossen.

> **Bekannte Lücke:** `evaluateRules()` ist implementiert und getestet
> (`evaluate.test.ts`), wird aber in `submitOrder()` aktuell mit einer **hartcodierten
> leeren Liste** aufgerufen (`evaluateRules([], orderContext)`) — es gibt noch kein
> Prisma-Modell und keine Admin-UI, um Regeln tatsächlich zu speichern und zu laden.
> Siehe [Backlog BL-002](../backlog.md).

---

## E-Mail Flow

Siehe [Kern-Flows → E-Mail- & Reminder-Flow](../domain/flows.md#e-mail--reminder-flow)
für den fachlichen Ablauf. Technisch: Der Cron-Endpoint liegt unter
`/api/cron/reminder`, geschützt durch den `x-cron-secret`-Header, aufgerufen via
Systemd-Timer oder einem einfachen `curl`-Cronjob auf dem Server. Kein externer
Cron-Dienst nötig.

---

## Club-Konfiguration

`apps/web/club.config.ts` liest zur **Laufzeit** primär aus Umgebungsvariablen —
dasselbe Docker-Image läuft für jeden Verein:

```
CLUB_NAME, CLUB_LOGO_URL, CLUB_PRIMARY_COLOR, CLUB_ACCENT_COLOR
CLUB_EVENT_NAME, CLUB_EVENT_DATE, CLUB_CONTACT_EMAIL
```

Die `ClubConfig`-Singleton-Tabelle in der DB überschreibt diese Env-Var-Defaults, sobald
ein Admin sie im Panel unter `/admin/settings` setzt — Env Vars sind also nur der
Fallback für die Erstinstallation, nicht die einzige Quelle.

Farben werden als CSS Custom Properties (`--color-primary`, `--color-accent`) in das Root-Layout injiziert. Client Components greifen ausschließlich über diese CSS-Variablen auf Farben zu, nie direkt auf Env Vars.

---

## Deployment-Pipeline

```
git push origin main
  → GitHub Actions CI (typecheck + lint + test + build + docs-links)
  → Docker-Image bauen → ghcr.io pushen
  → HMAC-signierter POST an /_deploy/deploy
  → Webhook-Receiver auf Server:
      docker compose pull app
      docker compose run --rm app pnpm db:migrate
      docker compose up -d app
      Health-Check (max 60s)
```

Der Webhook-Receiver (`almir/webhook`) läuft als Container im selben Compose-Stack und ist über Caddy erreichbar — kein separater offener Port.

---

## Integration vorbestellungs-kasse

Siehe [Kern-Flows → CSV-Export für die Kasse](../domain/flows.md#csv-export-für-die-kasse)
für den Export-Contract. Kurzfassung: manueller CSV-Download im Admin-Panel, Import in
die Kasse wie gewohnt — keine Live-Verbindung zwischen den beiden Projekten.

Langfristige, nicht umgesetzte Option: Die Kasse pollt `/api/export/orders?since=<timestamp>`
und importiert automatisch — setzt aber eine Netzwerkverbindung vom Raspberry Pi zum
Shop-Server voraus.
