# UI/UX Guidelines: Vorbestellungsshop

> **Status:** Active  
> **Zielgruppe:** Entwickler, AI Agents  
> **Tech Stack:** Next.js 16 (App Router), Tailwind CSS, shadcn/ui, CSS Custom Properties (OKLCH)

---

## 1. Design-Prinzipien (Die "North Stars")

Jede Design-Entscheidung muss diesen Prinzipien folgen:

1.  **Mobile First:** viele Nutzer werden per Smartphone bestellen. Der gesamte Flow muss auf dem Handy schnell und einfach sein.
2.  **Klarheit vor Schönheit:** Es ist ein Utility-Shop, kein Lifestyle-Store. Der Nutzer muss in unter 60 Sekunden eine Pizza und ein Getränk bestellen können.
3.  **Digitale Barrierefreiheit:** Die Zielgruppe umfasst alle Altersklassen. Touch-Targets müssen groß sein, Kontraste hoch und Text lesbar.
4.  **Vertrauen schaffen:** Da keine Zahlung im Shop erfolgt, muss die UI klar kommunizieren: "Deine Bestellung ist reserviert, du zahlst und holst vor Ort ab."
5.  **Konsistenz über Customization:** Der Basismodus (Layout, Schriftarten, Komponenten-Verhalten) ist für alle Vereine identisch. Nur `primaryColor` und `accentColor` variieren per Umgebungsvariable.

---

## 2. Das Designsystem

### 2.1 Farben (Semantische Verwendung)

Wir nutzen das bereits etablierte OKLCH-System in `globals.css`. Die Custom Properties `--color-primary` und `--color-accent` werden zur Laufzeit aus `club.config.ts` gesetzt.

| Token | Zweck | Verwendung |
| :--- | :--- | :--- |
| `--color-background` | Hintergrund | Seitenhintergrund, immer sehr hell (fast weiß) |
| `--color-foreground` | Haupttext | Überschriften, Body-Text |
| `--color-primary` | **Vereinsfarbe** | Haupt-CTAs, aktive Navigation, Branding-Elemente |
| `--color-accent` | **Akzentfarbe** | Angebote, Highlights, Badges, wichtige Hinweise |
| `--color-muted` | Sekundärer Hintergrund | Karten, Input-Felder, abwechselnde Listenzeilen |
| `--color-destructive` | Fehler / Löschen | Fehlermeldungen, "Aus dem Warenkorb entfernen" |
| `--color-success` | Erfolg | Bestellbestätigung, "Hinzugefügt"-Status |
| `--color-warning` | Warnung | Fast ausgebucht, geringer Bestand |

**Regel:** `primaryColor` und `accentColor` sollten immer auf dem weißen Hintergrund (`--color-background`) einen Kontrast von mindestens **4.5:1** (WCAG AA) haben. Im Zweifelsfall werden die Farben automatisch abgedunkelt, um die Lesbarkeit zu garantieren.

### 2.2 Typografie

Wir verwenden die bereits eingerichtete Schriftart `Geist` (Sans & Mono).

| Element | Größe | Gewicht | Zeilenhöhe |
| :--- | :--- | :--- | :--- |
| **H1** (Event-Titel) | `2rem` (32px) | 700 | 1.2 |
| **H2** (Seiten-Titel) | `1.5rem` (24px) | 600 | 1.3 |
| **H3** (Karten-Titel) | `1.125rem` (18px) | 600 | 1.4 |
| **Body** | `1rem` (16px) | 400 | 1.6 |
| **Small / Caption** | `0.875rem` (14px) | 400 | 1.5 |
| **Price** | `1.25rem` (20px) | 700 | 1.2 |

**Regel:** Mindestens `1rem` (16px) für alle Eingaben (Inputs, Buttons), um ungewolltes Zoomen auf iOS zu verhindern.

### 2.3 Layout & Spacing

*   **Container:** Max-Breite `768px` (für maximale mobile Lesbarkeit). Auf Desktop zentriert mit weichem Hintergrund oder Schatten.
*   **Padding:** Standard `px-4` (16px) horizontal auf mobilen Geräten.
*   **Gap:** `gap-4` (16px) zwischen Hauptelementen.
*   **Karten-Radius:** `rounded-xl` (12px) für Produktkarten, `rounded-2xl` (16px) für Modals.

### 2.4 Touch-Targets (kritisch für Events mit Handschuhen/nassen Händen!)

*   **Mindestgröße:** `48px x 48px` für alle klickbaren Elemente.
*   **Buttons:** Mindesthöhe `48px`, optimal `56px` für Haupt-CTAs (z. B. "In den Warenkorb").
*   **Abstand:** Mindestens `8px` freier Raum zwischen zwei Touch-Targets, damit nicht versehentlich das falsche getroffen wird.

---

## 3. Globale Interaktionsmuster

### 3.1 Navigation (Shop-Bereich)

*   **Top-Navigation:** Sticky Header mit Vereinslogo und Event-Titel. Kein komplexes Menü – maximal ein Icon für den Warenkorb mit Badge (Anzahl der Artikel).
*   **Breadcrumb:** Nicht notwendig. Der Shop ist flach (Event → Kategorien → Produkte).
*   **Bottom-Bar (Mobile):** Sticky Bottom-Bar mit Summe und "Weiter zum Warenkorb"-Button, sobald Artikel im Warenkorb sind. Das ist effizienter als ein schwebender FAB (Floating Action Button).

### 3.2 Feedback & Loading States

*   **Ladezustände:** Skeleton-Screens für Produktlisten (verwendet bereits vorhandene shadcn Skeleton-Komponente). Keine Spinner im Zentrum der Seite.
*   **Erfolg:** Grüne Toast-Benachrichtigung (shadcn Sonner) bei "Zum Warenkorb hinzugefügt". Toast verschwindet nach 3 Sekunden.
*   **Fehler:** Inline-Fehler unter Input-Feldern. Für globale Fehler (z. B. Event ausverkauft) wird eine zentrale, gut sichtbare rot umrandete Karte oder ein Alert-Dialog verwendet.

---

## 4. Seiten-Spezifische Flows & Patterns

### 4.1 Startseite (`/`)

**Ziel:** Die Motivation zum Bestellen wecken und den Einstieg erleichtern.

*   **Hero-Bereich:**
    *   Event-Name (H1) und Event-Datum prominenter als das Vereinslogo.
    *   Falls ein Event-Bild vorhanden ist: Abgerundetes Banner (`rounded-2xl`), maximal 40% der Bildschirmhöhe.
*   **Abholzeit-Auswahl (Top-Priority):**
    *   Die Abholzeit sollte *vor* oder *direkt neben* der Produktauswahl wählbar sein.
    *   **Pattern:** Horizontales Scroll-Carousel mit Chips. Jeder Chip zeigt Zeitfenster und Verfügbarkeit (z. B. "18:00 - 18:30 • Nur noch 5 Plätze").
    *   Farbkodierung: Verfügbar (Primary Outline), Fast ausgebucht (Accent/Hintergrund), Ausgebucht (Muted/Disabled).
*   **Kategorien:** Horizontale Scroll-Liste von Chips unter der Zeit-Auswahl, um schnell zu filtern (z. B. "Getränke", "Essen", "Merch").

### 4.2 Produktliste / Kategorie-Ansicht

*   **Grid:** 1 Spalte auf Mobile, 2 Spalten ab Tablet (`grid-cols-1 md:grid-cols-2`).
*   **Produktkarte (Card):**
    *   Bild oben (Aspect-Ratio `4:3` oder `1:1`).
    *   Name (H3), Preis (groß, fett), kurze Beschreibung (2 Zeilen, dann `ellipsis`).
    *   **Varianten:** Falls ein Produkt Varianten hat (z. B. Pizza Größe), werden diese als Segmented Control oder Radio-Buttons *innerhalb* der Karte angezeigt. Keine separate Detailseite, wenn es nicht nötig ist.
    *   **Action:** "+" Button (groß, eindeutig) direkt neben dem Preis. Direktes Hinzufügen zur Menge 1. Alternativ: Stepper ( - 1 + ), wenn Menge > 0.

### 4.3 Warenkorb (`/cart`)

**Ziel:** Überblick, Korrektur, Übergang zum Checkout.

*   **Listen-Ansicht:**
    *   Jeder Artikel als Zeile: Thumbnail (klein), Name, gewählte Variante, Preis.
    *   Stepper ( - Menge + ) rechtsbündig.
    *   Swipe-to-Delete auf Mobile (optional, aber schnell) oder ein Mülleimer-Icon.
*   **Zusammenfassung:**
    *   Zwischensumme, ggf. Rabatte.
    *   Grosses, auffälliges Total am unteren Bildschirmrand.
*   **Sticky Bottom Bar:** Button "Weiter zur Abholzeit & Bestellung" (volle Breite, Primary-Farbe, 56px hoch).

### 4.4 Checkout / Bestellung abschließen (`/checkout`)

**Ziel:** Minimale Reibung, maximales Vertrauen.

*   **Schritt 1: Abholzeit (falls nicht bereits auf Startseite gewählt):**
    *   Radio-Group oder große, klickbare Karten mit Zeitfenstern.
    *   Deutlicher Hinweis: "Bitte sei pünktlich. Deine Bestellung wird kurz vor deiner Ankunft frisch zubereitet."
*   **Schritt 2: Kontaktdaten:**
    *   Name (Pflichtfeld).
    *   Telefonnummer (Pflichtfeld) – wichtig für Rückfragen vor Ort.
    *   E-Mail (optional, für Bestellbestätigung).
    *   *Keine Adresseingabe nötig!*
*   **Schritt 3: Zahlungsinfo (Nur Info!):**
    *   Klare Kommunikation: "Du zahlst vor Ort an der Abholstation." Keine Kreditkartenfelder.
    *   Kleines Info-Icon mit Tooltip: "Wir speichern keine Zahlungsdaten."
*   **Schritt 4: Bestätigung:**
    *   Zusammenfassung aller Daten.
    *   **Checkbox:** "Ich habe die Infos gelesen und bestätige meine Abholung im gewählten Zeitfenster."
    *   **Button:** "Kostenpflichtig bestellen" (Wording bewusst gewählt, da es eine verbindliche Reservierung ist, auch wenn der Kunde vor Ort zahlt).

### 4.5 Bestellbestätigung (`/order-success`)

*   **Großes Erfolgs-Icon** (grüner Haken).
*   **Bestellnummer** prominent angezeigt (wichtig für die Abholung!).
*   **Zusammenfassung der Abholzeit** nochmals in fett.
*   **Hinweis:** "Bitte halte diese Nummer oder deinen Namen an der Abholstation bereit."
*   **CTA:** "Weitere Produkte bestellen" (führt zurück zum Shop) und "Bestellung teilen" (Web Share API).

---

## 5. Admin-Bereich (Kurzübersicht)

*   **Layout:** Desktop-optimiert, aber responsive. Sidebar-Navigation (shadcn Sidebar) für Bereiche wie "Bestellungen", "Produkte", "Zeitfenster".
*   **Daten-Tabellen:** shadcn Table mit Sortierung, Filterung und Pagination. Sehr dichte Informationsdarstellung, da Admins schnell viele Bestellungen scannen müssen.

---

## 6. Barrierefreiheit (A11y) Checkliste

*   [ ] Alle Bilder haben aussagekräftige `alt`-Texte (Produktbild: "[Produktname]", Dekorative Bilder: `alt=""`).
*   [ ] Farbe ist niemals das einzige Mittel zur Informationsübermittlung (z. B. "Ausgebucht" hat zusätzlich einen Text-Label).
*   [ ] Fokus-Indikatoren sind überall sichtbar (`ring-2 ring-offset-2 ring-primary`).
*   [ ] ARIA-Labels für Icon-Buttons (z. B. `aria-label="In den Warenkorb legen"`).
*   [ ] Formularfelder sind immer mit `<label>` assoziiert.
*   [ ] `--color-destructive` und `--color-success` haben ausreichend Kontrast zum Hintergrund.

---

## 7. Content & Copywriting

*   **Sprache:** Du-Ansprache, freundlich, direkt.
    *   Gut: "In den Warenkorb"
    *   Schlecht: "Produkt dem virtuellen Einkaufswagen hinzufügen"
*   **Fehlermeldungen:** Nutzerhandlungsorientiert.
    *   Gut: "Bitte wähle ein Abholzeitfenster aus."
    *   Schlecht: "Error 400: Bad Request"
*   **Leere Zustände:** Hilfreich und nicht kalt.
    *   Warenkorb leer: "Dein Warenkorb ist noch leer. Schau dir unsere leckeren Angebote an!"

---

## 8. Responsive Breakpoints

Wir verwenden die Standard Tailwind-Breakpoints, mit Fokus auf die unteren beiden:

*   **Default (Mobile):** `< 640px`. 1 Spalte, große Touch-Targets, Bottom-Bar.
*   **Tablet (`md` / `768px`):** Sidebar-Navigation Admin, 2-Spalten-Grid im Shop.
*   **Desktop (`lg` / `1024px`):** Maximale Container-Breite von `1200px`, zentriertes Layout.

---

## 9. Wie pflegen wir diese Guidelines?

1.  **Living Document:** Diese Datei liegt im Repo unter `docs/ui-ux-guidelines.md`. Bei jeder neuen Komponente oder Flow-Änderung wird sie aktualisiert.
2.  **Storybook (Empfohlen):** Sobald die ersten 5-10 Kernkomponenten stehen (Button, Card, Input, TimeSlotPicker), sollte ein Storybook-Setup (`apps/web/.storybook`) erfolgen. Das dient als interaktive visuelle Referenz.
3.  **Code Reviews:** PRs werden nicht nur auf Logik, sondern auch auf Einhaltung der Guidelines geprüft (z. B. "Ist der Touch-Target groß genug?", "Ist die semantische Farbe verwendet?").

---

> **Nächster Schritt:** Implementierung der Design-Tokens und ersten Komponenten.
