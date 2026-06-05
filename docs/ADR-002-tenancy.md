# ADR-002: Single-Instance pro Verein (kein Multi-Tenant)

**Status:** Akzeptiert  
**Datum:** 2026

---

## Kontext

Mehrere Vereine sollen den Shop nutzen können. Zwei grundlegende Architektur-Optionen:

**Option A — Multi-Tenant:** Eine Deployment, alle Vereine in einer Datenbank, getrennt durch `club_id` auf jeder Tabelle.

**Option B — Single-Instance:** Jeder Verein betreibt eine eigene Instanz (eigener Docker-Container, eigene Datenbank).

---

## Entscheidung

**Option B — Single-Instance pro Verein.**

---

## Begründung

**Datenisolation:** Bei Single-Instance ist Datentrennung garantiert durch die Infrastruktur, nicht durch Anwendungslogik. Kein Risiko, dass ein Bug Daten eines anderen Vereins exponiert.

**Deployment-Komplexität:** Multi-Tenant erfordert `club_id` auf jeder DB-Tabelle, in jedem Query, in jedem API-Endpoint. Für ein Open-Source-Projekt erhöht das die Komplexität erheblich und macht es fehleranfälliger.

**DSGVO:** Jeder Verein hat seine eigene Datenbank. Löschung aller Daten eines Vereins = `DROP DATABASE`. Keine aufwändige Filterlogik nötig.

**Skalierung des Hostings:** Mehrere Vereine auf einem Server sind trotzdem möglich — als separate Docker-Compose-Projekte auf einem Host, geroutet via Caddy nach Domain. Die Kosten skalieren linear nach unten (5 Vereine auf einem CX22 = ~€1/Monat pro Verein).

**Einfacheres Onboarding:** Ein neuer Verein = `terraform apply` + `ansible-playbook`. Kein Admin-Interface zum Verwalten von Tenants.

---

## Konsequenzen

- Kein `club_id` im Datenmodell — das Schema bleibt einfach
- Club-spezifische Konfiguration via `club.config.ts` + Umgebungsvariablen
- Mehrere Vereine auf einem Server: separierte Docker-Compose-Projekte
- Updates müssen auf jeder Instanz einzeln ausgerollt werden (via Ansible oder manuellem Pull)
- Kein zentrales Dashboard über alle Vereine hinweg (kein Use-Case identifiziert)

---

## Revisited wenn...

Multi-Tenant wird relevant wenn ein "Hoster" dutzende Vereine verwalten möchte ohne Zugang zu deren Servern zu haben. Für die initiale Version ist das kein Ziel.
