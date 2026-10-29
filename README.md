# Familienkosten

Eigenständiges Projekt für GitHub Pages: Personen als Spalten, Kostenarten als Zeilen, monatliche Euro-Beträge, Summen je Person und Familie, Jahreshochrechnung und CSV-Export. Responsive Oberfläche mit interaktiver Beispielvorschau. Änderungen werden explizit gespeichert.

## Architektur

`GitHub Pages (public/) → Node-API → MongoDB Atlas`

Die MongoDB-Unterstützung in `anonyymmfake-svg/kairo` verwendet die Umgebungsvariable `MONGODB_URI`. Dieses Projekt verwendet denselben Variablennamen und kann auf denselben Cluster zugreifen. Es verwendet ausdrücklich die separate Datenbank `familienkosten`, Collection `budgets`. Ob Kairo tatsächlich eine URI im Hosting gesetzt hat, ist nicht aus dem Repository ersichtlich. Der Bot und seine Collections werden nicht verändert.

## 1. Eigenes GitHub-Repository

Neues Repository `familienkosten` erstellen. Den Inhalt dieses Ordners in dessen Hauptverzeichnis hochladen. Keine `.env` oder Zugangsdaten hochladen.

## 2. Backend einrichten

Beispiel: auf Render einen Blueprint aus dem neuen Repository erstellen (`render.yaml`). Vor dem Anlegen eventuelle Kosten im Hosting prüfen. Erforderliche Servervariablen:

- `MONGODB_URI`: URI aus den Server-Einstellungen von Kairo übernehmen, sofern vorhanden. Nicht in GitHub oder Browser-Code eintragen. Empfohlen: auf demselben Cluster ein eigener MongoDB-Benutzer mit Schreib-/Leserechten ausschließlich auf `familienkosten`.
- `MONGODB_DB`: `familienkosten`.
- `FAMILY_PASSWORD`: ein starkes Familienpasswort mit mindestens 16 Zeichen.
- `ALLOWED_ORIGIN`: `https://anonyymmfake-svg.github.io` (ohne Repository-Pfad und abschließenden Slash).

Der MongoDB-Benutzer benötigt Zugriff auf die neue Datenbank. Die Atlas-Netzwerkfreigabe muss den Backend-Host zulassen. Zugangsdaten nicht im Chat veröffentlichen. Backend ausschließlich per HTTPS verwenden. Sitzungen sind acht Stunden gültig, werden nur im Arbeitsspeicher gehalten und verfallen bei Server-Neustarts. Login ist auf 20 Versuche je 15 Minuten und direkter Verbindungs-IP begrenzt; hinter einem gemeinsam genutzten Proxy gilt das gegebenenfalls für alle Besucher zusammen. Das gemeinsame Familienpasswort ist für einen einzelnen Haushalt gedacht, ohne individuelle Nutzerkonten.

## 3. GitHub Pages aktivieren

In `public/config.js` die HTTPS-URL des Backends als `window.API_URL` eintragen. In GitHub **Settings → Pages → Source → GitHub Actions** auswählen. Der Workflow veröffentlicht ausschließlich `public/`. Je nach GitHub-Tarif ist für Pages ein öffentliches Repository erforderlich; darin dürfen nur Quellcode und Konfiguration ohne Secrets stehen. Die Familiendaten werden von der API erst nach Anmeldung herausgegeben.

Erwartete URL nach erfolgreichem Deployment: `https://anonyymmfake-svg.github.io/familienkosten/`. Diese URL ist erst nach tatsächlich erfolgreicher Einrichtung verfügbar.

## Lokal

Node.js 22 oder neuer installieren. `npm install`, `.env.example` nach `.env` kopieren und ausfüllen. Für lokale Nutzung `ALLOWED_ORIGIN=http://localhost:3000` setzen; `npm start`. Browser auf `http://localhost:3000` öffnen. Leere `window.API_URL` nutzt dieselbe Domain. Die Beispielvorschau lässt sich auch über einen beliebigen lokalen statischen Server ohne MongoDB testen.

`npm test` prüft die Datenvalidierung. Beträge liegen ganzzahlig in Cent vor. Eine Versionsnummer verhindert, dass zwei Geräte stillschweigend Änderungen überschreiben. Bei Konflikten kann der ungespeicherte Stand zunächst per CSV exportiert und anschließend der aktuelle Stand geladen werden. Bei Datenbankfehlern gibt es keinen stillen lokalen Speicherersatz.

## Stand

Quellcode und Deployment-Konfiguration vorbereitet. GitHub-Repository, Live-Backend und Datenbankverbindung müssen noch eingerichtet beziehungsweise mit realen Server-Secrets verbunden werden. Es wurden keine Zugangsdaten aus Kairo kopiert.
