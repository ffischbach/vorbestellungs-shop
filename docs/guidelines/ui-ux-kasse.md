# UI/UX Guidelines: Vorbestell-Kasse

> **Status:** Active
> **Zielgruppe:** Entwickler, AI Agents, die die Kasse implementieren
> **Companion-Projekt:** [vorbestellungs-kasse](https://github.com/ffischbach/vorbestellungs-kasse) (FastAPI + Python + SQLite, Raspberry Pi)

Dieses Dokument ist **selbstständig lesbar** — kein Zugriff auf den Vorbestellungsshop nötig.
Alle konkreten Werte (Farben, Größen, Klassen) sind direkt angegeben.

---

## 1. Design-Prinzipien

1. **Mobile & Tablet First, gleichwertig:** Die Kasse läuft auf einem Smartphone oder Tablet an der Kasse eines Vereinsfestes, für das Kunden vorher Produkte vorbestellt haben. Beide Geräteklassen sind primär.
2. **Eine Sache gut:** Der Kernflow ist: Name oder Bestellnummer eintippen oder QR-Code scannen → Bestellung sehen → abhaken. Alles andere ist Nebenfunktion.
3. **Widrige Bedingungen einplanen:** Lärm, Zeitdruck, nasse oder behandschuhte Hände. Touch-Targets sind deshalb größer als üblich.
4. **Status ist alles:** Jede Bestellung hat genau einen Status — offen oder erledigt. Dieser muss auf einen Blick erkennbar sein, ohne Text lesen zu müssen.
5. **Kein Marketing-Charakter:** Die Kasse ist ein Werkzeug für Vereinsmitglieder, kein Kundenshop. Sachlich, dicht, schnell.

---

## 2. Farben

Alle Farben als CSS Custom Properties. Der Verein kann Primär- und Akzentfarbe per Umgebungsvariable setzen — alle anderen Werte sind fest.

```css
/* Helles Theme (Standard) */
--background:          #FAFAFA;   /* Seitenhintergrund */
--foreground:          #171717;   /* Primärer Text, primäre Buttons */
--card:                #FFFFFF;   /* Kartenhintergrund */
--card-foreground:     #171717;
--muted:               #F5F5F5;   /* Sekundärer Hintergrund, erledigte Einträge */
--muted-foreground:    #525252;   /* Sekundärer Text */
--border:              #E5E5E5;   /* Trennlinien, Kartenkanten */
--input:               #E5E5E5;   /* Input-Rahmen */
--primary:             #171717;   /* Vereinsfarbe (überschreibbar) */
--primary-foreground:  #FFFFFF;
--destructive:         #DC2626;   /* Storno, Fehler */
--destructive-fg:      #FFFFFF;
--success:             #15803D;   /* Erledigt / Bezahlt */
--success-foreground:  #FFFFFF;
--warning:             #A16207;   /* Hinweise, Fast ausgebucht */
```

**Statusfarben für Bestellkarten:**

| Status | Hintergrund | Text | Badge |
| :--- | :--- | :--- | :--- |
| Offen | `#FFFFFF` (card) | `#171717` (foreground) | — |
| Erledigt | `#F5F5F5` (muted) | `#525252` (muted-foreground) | Grün `#15803D` |
| Storniert | `#F5F5F5` (muted) | `#525252` (muted-foreground) | Rot `#DC2626` |

**Regel:** Farbe ist niemals das einzige Unterscheidungsmerkmal — Status-Badges tragen immer zusätzlich einen Text-Label.

---

## 3. Typografie

Schriftart: **Geist Sans** (primär) und **Geist Mono** (Bestellnummern, Zahlen).

| Element | Größe | Gewicht | Besonderheiten |
| :--- | :--- | :--- | :--- |
| Bestellnummer | 24px (`text-2xl`) | 700 | `font-mono`, gut lesbar aus Distanz |
| Kundenname | 18px (`text-lg`) | 600 | Primäre Suchgröße |
| Produktzeile | 14px (`text-sm`) | 400 | |
| Betrag | 20px (`text-xl`) | 700 | Immer rechtsbündig |
| Status-Badge | 11px (`text-[11px]`) | 700 | `uppercase tracking-wider font-mono` |
| Labels / Hints | 12px (`text-xs`) | 400 | `text-muted-foreground` |

**Überschriften** (`h1`–`h3`): `font-weight: 700`, `letter-spacing: -0.03em`, `line-height: 1.1`.

**Pflicht:** Alle Inputs und Buttons mindestens `16px` — verhindert Auto-Zoom auf iOS.

---

## 4. Formen & Radien

Das Designsystem ist **sharp-edged** — keine abgerundeten Ecken auf Karten, Buttons und Inputs im Haupt-UI. Das schafft einen klaren, sachlichen Charakter.

| Element | Radius |
| :--- | :--- |
| Produktkarten / Bestellkarten | **0** (kein `rounded-*`) |
| Primäre Buttons (Haupt-CTA) | **0** (kein `rounded-*`) |
| Icon-Buttons (±-Stepper) | **0** |
| Inputs (Suchfeld) | **0** (`border border-input`) |
| Status-Badges | **0** |
| Modals / Dialoge | `rounded-lg` (6px) — Ausnahme für schwebende Elemente |
| Tooltips | `rounded-md` (4px) |

**Begründung:** Die Shop-Buttons und Karten verwenden bewusst keine `rounded-*`-Klassen, um einen robusten, nicht-verspielten Look zu erzeugen. Dieses Prinzip gilt 1:1 für die Kasse.

---

## 5. Button-System

Drei Varianten, alle ohne `border-radius`:

### Primär (Haupt-CTA)
```
Hintergrund: #171717  (--foreground)
Text:         #FFFFFF  (--background)
Höhe:         56px     (h-14) — Standard-CTA
              64px     (h-16) — "Erledigt"-Button auf Bestellkarte
Hover:        #171717 mit 80% Opacity
Active:       scale(0.98)  (active:scale-[0.98])
Disabled:     50% Opacity, cursor-not-allowed
```

### Sekundär (Zurück, Abbrechen)
```
Hintergrund: transparent
Rahmen:      1px solid #E5E5E5  (border border-border)
Text:        #171717
Höhe:        48px  (h-12)
Hover:       #F5F5F5 Hintergrund  (hover:bg-muted)
```

### Destruktiv (Storno)
```
Hintergrund: #DC2626/10  (bg-destructive/10)
Text:        #DC2626
Rahmen:      keiner
Hover:       #DC2626/20
Nie auf der Hauptfläche — immer hinter einem Confirmation-Step
```

### Icon-Button (z. B. Menü, Schließen)
```
Größe:        40px × 40px  (w-10 h-10) — Minimum für Nebenaktionen
              48px × 48px  für primäre Icon-Aktionen
Hintergrund: transparent oder #FFFFFF mit border border-border
```

---

## 6. Karten (Bestellkarten)

Analog zur Produktkarte im Shop:

```
Hintergrund:  #FFFFFF       (bg-card)
Rahmen:       1px solid #E5E5E5  (border border-border)
Radius:       0
Padding:      16px          (p-4)
```

**Struktur einer offenen Bestellkarte:**
```
┌────────────────────────────────────────┐
│  #A-042         [Status-Badge]         │  ← Kopfzeile
│  Max Mustermann                        │  ← Kundenname (text-lg font-semibold)
├────────────────────────────────────────┤
│  2× Pizza Margherita                   │  ← Produktzeilen (text-sm muted-fg)
│  1× Bier                               │
├────────────────────────────────────────┤
│  12,50 €             [✓  Erledigt]    │  ← border-t border-border, pt-3
└────────────────────────────────────────┘
```

Abstand zwischen Karten: `gap-3` (12px).

**Erledigte Karte:** Hintergrund wechselt auf `#F5F5F5` (muted), alle Texte auf `#525252` (muted-foreground), grüner Badge statt CTA-Button. Standardmäßig ausgeblendet (nur sichtbar im Toggle "Alle").

---

## 7. Inputs & Suchfeld

Das Suchfeld ist das zentrale UI-Element der Kasse.

```
Höhe:         48px   (h-12) — größer als der Shop-Standard (h-11)
Padding:      12px horizontal  (px-3)
Rahmen:       1px solid #E5E5E5
Radius:       0
Fokus:        border-color: #171717  (border-foreground, kein Ring)
Font:         16px minimum (verhindert iOS-Zoom)
Placeholder:  #525252  (muted-foreground)
```

Das Suchfeld ist beim Laden **autofokussiert** und wird nach jeder erledigten Bestellung **automatisch geleert**.

---

## 8. Layout & Spacing

```
Container-Breite:  max-w-2xl (672px) — wie im Shop, zentriert
Horizontal-Padding: px-5 (20px)
Vertikal-Gap:      py-8 (32px) für Sektionen
Karten-Gap:        gap-3 (12px)
```

**Header:**
```
border-b border-border
padding: py-5 px-5
Inhalt: Logo + Event-Name links, Live-Uhrzeit (Serverzeit) rechts
Position: static (nicht sticky) — Suchfeld übernimmt die Priorität
```

**Suchfeld-Bereich:**
```
position: sticky
top: 0
background: #FAFAFA
border-b border-border
padding: py-3 px-5
z-index: 10
```

**Filter-Toggle (Offen / Alle):**
Direkt unter dem Suchfeld, als `border-b-2`-Tab-Stil:
```
Aktiver Tab:   border-b-2 border-foreground text-foreground
Inaktiver Tab: border-b-2 border-transparent text-muted-foreground
Font:          text-sm font-medium
Padding:       px-3 py-1.5
```

---

## 9. Touch-Targets

| Element | Mindestgröße | Begründung |
| :--- | :--- | :--- |
| "Erledigt"-Button | 64px hoch | Primäraktion, Stresssituation |
| Alle anderen Buttons | 56px hoch | Größer als WCAG-Minimum (44px) |
| Icon-Buttons | 48px × 48px | |
| Abstand zwischen Targets | ≥ 12px | Fehltipp auf "Storno" ist schwerwiegend |

---

## 10. Animationen

**Im Shop** gibt es `fade-in-up` mit gestaffelten Delays für Produktkarten — bewusst einladend.

**In der Kasse keine Eintrittsanimationen.** Karten erscheinen sofort. Jede halbe Sekunde Verzögerung kostet reale Wartezeit an der Schlange.

Erlaubte Übergänge:
```
Erledigt-Feedback:   bg-transition 150ms ease-out (Hintergrund dimmt aus)
Hover auf Buttons:   transition-colors 150ms
Active-Press:        scale(0.98) sofort, zurück 100ms
```

Keine `opacity-0` + `animate-fade-in-up`, keine `stagger-*`-Delays, kein `scale-in`.

---

## 11. Feedback & Zustände

**Erledigt markieren (Optimistisches Update):**
Die Karte dimmt sofort aus, bevor der Server antwortet. Bei Server-Fehler springt sie zurück + rotes Banner oben.

**Fehler-Banner:**
```
bg-destructive/10 border border-destructive/30
text-sm text-destructive
Padding: p-3
Position: unter dem Suchfeld, über der Liste
Persistent (kein Auto-Dismiss) — in lauter Umgebung leicht übersehen
```

**Offline-Banner:**
```
bg-warning/10 border border-warning/30
text-sm text-warning-foreground
Text: "Offline — Änderungen werden gespeichert und synchronisiert."
```

**Leerer Zustand (alle erledigt):**
```
Icon: großes ✓ in --color-success
Text: "Alle Bestellungen erledigt."
Kein Link, kein CTA — der Verkäufer weiß was er tut
```

---

## 12. Storno-Flow (destruktive Aktion)

Nie direkt auf der Kartenoberfläche erreichbar. Immer zweistufig:

1. Versteckter Einstiegspunkt: Long-Press auf Karte oder `⋯`-Menü-Icon (`text-muted-foreground`, klein).
2. Confirmation-Dialog (Modal mit `rounded-lg`):
   - Titel: `"Bestellung #A-042 stornieren?"`
   - Text: `"Diese Aktion kann nicht rückgängig gemacht werden."`
   - Buttons nebeneinander: `"Abbrechen"` (sekundär, links) und `"Stornieren"` (destruktiv, rechts)
   - Destruktiv-Button: `bg-destructive/10 text-destructive`, kein roter Vollhintergrund

---

## 13. Barrierefreiheit

- Alle Icon-Buttons haben `aria-label`.
- Status-Badges niemals nur über Farbe — immer mit Text-Label.
- Jede Bestellkarte: `role="article"` mit `aria-label="Bestellung #A-042 von Max Mustermann, offen"`.
- Fokus-Indikator: `outline: 2px solid #171717; outline-offset: 2px` — sichtbar auch bei schlechtem Licht.
- Kontrast Status-Badges: ≥ 7:1 (WCAG AAA) — Außeneinsatz möglich.

---

## 14. Copywriting

Ton: sachlich, direkt, kein Du-Marketing.

| Kontext | Richtig | Falsch |
| :--- | :--- | :--- |
| Haupt-CTA | „Erledigt" | „Als abgeholt und bezahlt markieren" |
| Leere Liste | „Alle erledigt ✓" | „Es liegen keine offenen Bestellungen vor." |
| Offline | „Offline — wird synchronisiert." | „Error 503: Service Unavailable" |
| Storno-Dialog | „Bestellung #A-042 stornieren?" | „Achtung: Diese Aktion ist nicht umkehrbar!" |
| Suchergebnis leer | „Keine Bestellung gefunden." | „0 Ergebnisse für Ihre Suchanfrage" |
