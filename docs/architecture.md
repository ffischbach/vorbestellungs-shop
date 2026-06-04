# Architektur

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

```prisma
model Product {
  id           String        @id @default(cuid())
  name         String
  description  String?
  price        Decimal
  imageUrl     String?
  available    Boolean       @default(true)
  maxQuantity  Int?
  category     Category      @relation(fields: [categoryId], references: [id])
  categoryId   String
  allowedSlots PickupSlot[]
  orderItems   OrderItem[]
}

model Category {
  id       String    @id @default(cuid())
  name     String
  products Product[]
}

model PickupSlot {
  id          String     @id @default(cuid())
  label       String     // z.B. "11:00 – 12:00 Uhr"
  startTime   DateTime
  endTime     DateTime
  capacity    Int?       // null = unbegrenzt
  products    Product[]
  orders      Order[]
}

model Order {
  id           String      @id @default(cuid())
  createdAt    DateTime    @default(now())
  customerName String
  email        String
  pickupSlot   PickupSlot  @relation(fields: [pickupSlotId], references: [id])
  pickupSlotId String
  status       OrderStatus @default(PENDING)
  items        OrderItem[]
  reminderSent Boolean     @default(false)
}

model OrderItem {
  id        String  @id @default(cuid())
  quantity  Int
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
```

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

Sign-up ist nach dem ersten Setup zu deaktivieren (`disableSignUp: true` in `apps/web/lib/auth.ts`). Einen neuen Admin anlegen:

1. Temporär `disableSignUp: false` setzen und deployen
2. Account per API anlegen:
   ```bash
   curl -s -X POST https://<domain>/api/auth/sign-up/email \
     -H "Content-Type: application/json" \
     -d '{"email":"...", "name":"...", "password":"..."}'
   ```
3. Sofort wieder `disableSignUp: true` setzen und deployen

### TOTP in Production

`twoFactor()` Plugin ist nur in `NODE_ENV=production` aktiv. Beim ersten Login nach Account-Erstellung TOTP im Admin-Panel einrichten. Ohne aktiviertes TOTP kann sich der Admin zwar einloggen, sollte es aber umgehend aktivieren.

---

## Validierungsregeln

Validierungsregeln werden als JSON in der Datenbank gespeichert und zur Checkout-Zeit ausgewertet. Statt einer generischen Rule-Engine gibt es fest definierte Rule-Types mit einer konfigurierbaren UI im Admin-Panel.

```typescript
// packages/config/src/validation.ts

type ValidationRule =
  | {
      type: 'pickup_slot_match'
      // Alle Produkte im Warenkorb müssen den gewählten Slot erlauben
    }
  | {
      type: 'max_quantity_per_product'
      productId: string
      max: number
    }
  | {
      type: 'category_requires_slot'
      categoryId: string
      allowedSlotIds: string[]
    }
```

Die Regeln werden sequenziell geprüft. Schlägt eine Regel fehl, bekommt der Nutzer eine verständliche Fehlermeldung und die Bestellung wird nicht abgeschlossen.

---

## E-Mail Flow

```
Checkout abgeschlossen
  → OrderItem in DB anlegen (Status: PENDING)
  → Sofort: Bestätigungs-E-Mail via Nodemailer

Cron Job (täglich, 18:00 Uhr)
  → Alle Orders für den nächsten Tag abfragen
  → Für jede Order mit reminderSent = false:
      → Erinnerungs-E-Mail senden
      → reminderSent = true setzen
```

Der Cron-Endpoint liegt unter `/api/cron/reminder` und wird via Systemd-Timer oder einem einfachen `curl`-Cronjob auf dem Server aufgerufen. Kein externer Cron-Dienst nötig.

---

## Club-Konfiguration

`apps/web/club.config.ts` liest zur **Laufzeit** aus Umgebungsvariablen — dasselbe Docker-Image läuft für jeden Verein, die Konfiguration kommt per Env Vars rein:

```
CLUB_NAME, CLUB_LOGO_URL, CLUB_PRIMARY_COLOR, CLUB_ACCENT_COLOR
CLUB_EVENT_NAME, CLUB_EVENT_DATE, CLUB_CONTACT_EMAIL
```

Farben werden als CSS Custom Properties (`--color-primary`, `--color-accent`) in das Root-Layout injiziert. Client Components greifen ausschließlich über diese CSS-Variablen auf Farben zu, nie direkt auf Env Vars.

---

## Deployment-Pipeline

```
git push origin main
  → GitHub Actions CI (typecheck + lint + test)
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

Die Kasse läuft lokal auf einem Raspberry Pi und benötigt die Bestelldaten als CSV-Import.

**Aktueller Flow (WooCommerce):** DB-Query → CSV-Export → manueller Import

**Neuer Flow:**
1. Admin öffnet Bestellübersicht im Admin-Panel
2. Klick auf "CSV exportieren" → Download der Bestellungen im Kassen-kompatiblen Format
3. Import in vorbestellungs-kasse wie gewohnt

Der Export-Endpoint unter `/api/export/orders` liefert CSV im definierten Format. Das Format wird als gemeinsamer Standard zwischen beiden Projekten dokumentiert.

Langfristige Option: Die Kasse pollt `/api/export/orders?since=<timestamp>` und importiert automatisch — setzt aber eine Netzwerkverbindung vom Raspberry Pi zum Shop-Server voraus.
