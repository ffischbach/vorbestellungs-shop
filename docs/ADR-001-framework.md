# ADR-001: Next.js als Full-Stack Framework

**Status:** Akzeptiert  
**Datum:** 2026

---

## Kontext

Für den Vorbestellungsshop wird ein Web-Framework benötigt das:
- Server-Side Rendering für Performance und SEO ermöglicht
- Frontend und Backend in einem Repo vereint (kein separates API-Backend)
- Mobile-First tauglich ist
- Eine aktive Community hat (wichtig für Open-Source-Projekt)
- Gut mit PostgreSQL + Prisma integriert

Initiale Präferenz war ein Kotlin-Backend (Ktor) mit einem JavaScript-Frontend — ein bewährter, typsicherer Stack aus Maintainer-Sicht.

---

## Entscheidung

**Next.js 15 (App Router, TypeScript)** als Full-Stack-Framework.

---

## Begründung

**Für Next.js (gegen getrenntes Kotlin-Backend):**

Ein separates Kotlin/Ktor-Backend hätte folgende Nachteile für dieses Projekt:
- Zwei separate Docker-Services (höherer RAM-Verbrauch auf einem kleinen VPS)
- CORS-Konfiguration, separate Deployments, zwei Build-Pipelines
- Höhere Einstiegshürde für externe Contributors bei einem Open-Source-Projekt
- Server Actions in Next.js 15 erfüllen denselben Zweck mit weniger Infrastruktur

Die Geschäftslogik (Validierungsregeln, Bestellverarbeitung) ist nicht so komplex, dass sie die JVM-Ökosystem-Vorteile (umfangreiches Test-Tooling, starke Typisierung auf komplexer Logik) rechtfertigen würde.

**Hinweis zur Kotlin-Option:** Wäre die `vorbestellungs-kasse` eine Web-App statt einer Raspberry-Pi-Desktop-App, würde ein geteilter Kotlin-Stack mehr Sinn ergeben. Da die Kasse in Python/FastAPI ist und lokal läuft, gibt es keinen Synergie-Vorteil.

---

## Konsequenzen

- TypeScript als einzige Sprache im gesamten Monorepo (außer Infra)
- Server Actions für Mutations (kein separates REST-Layer nötig)
- API Routes nur für Endpoints die von außen aufgerufen werden (Cron, Export, Health)
- Deployment als einzelner Docker-Container
