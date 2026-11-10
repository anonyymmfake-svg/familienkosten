# Wortweise – Vokabeltrainer

Deutsch–Englisch-Vokabeln eintragen, nach Lektionen ordnen und in zufälliger Reihenfolge lernen. Abfrage Deutsch → Englisch, Englisch → Deutsch oder beide Richtungen gemischt. Antworten werden eingegeben; mehrere richtige Übersetzungen mit Semikolon trennen. Groß-/Kleinschreibung und äußere Leerzeichen werden ignoriert. Falsche und aufgedeckte Wörter lassen sich am Rundenende wiederholen.

## Speicherung und Synchronisierung

GitHub Pages (`public/`) → bestehende Node-API auf Render → MongoDB Atlas.

Das bisherige Passwort bleibt gültig. `FAMILY_PASSWORD` erlaubt Lernen und – sofern kein `EDIT_PASSWORD` gesetzt ist – Bearbeiten. Wenn `EDIT_PASSWORD` gesetzt ist, ermöglicht nur dieses Passwort Änderungen. Alle angemeldeten Geräte verwenden dieselbe Sammlung. Änderungen explizit mit **Änderungen speichern** sichern; auf einem anderen Gerät **Stand neu laden** verwenden. Eine Versionsprüfung verhindert stilles Überschreiben bei parallelen Änderungen. Bei einem Konflikt zuerst eine JSON-Sicherung exportieren, dann den aktuellen Serverstand laden und gewünschte Änderungen übernehmen. Die Sicherung enthält alle Einträge und kann bei Bedarf manuell wieder eingetragen werden.

Vokabeln liegen in der separaten Collection `vocabulary`, Dokument `shared`, innerhalb von `MONGODB_DB` (bestehender Standard: `familienkosten`). Vorhandene Kostendaten in `budgets` werden nicht verändert. Sitzungen laufen nach acht Stunden ab und verfallen beim Backend-Neustart. Keine Passwörter oder Datenbankzugangsdaten in Browsercode oder GitHub hinterlegen.

## Deployment

Der bestehende GitHub-Actions-Workflow veröffentlicht `public/` bei einem Push auf `main`. Der bisherige Render-Service muss ebenfalls den aktuellen `main`-Stand aus diesem Repository bereitstellen (bei deaktiviertem Auto-Deploy einmal manuell deployen). Es sind keine neuen Umgebungsvariablen erforderlich:

- `MONGODB_URI`: bestehender Atlas-Zugang mit Zugriff auf die Collection `vocabulary`.
- `MONGODB_DB`: bestehende Datenbank, standardmäßig `familienkosten`.
- `FAMILY_PASSWORD`: bestehendes Passwort.
- `EDIT_PASSWORD`: optionales, abweichendes Bearbeitungspasswort.
- `ALLOWED_ORIGIN`: `https://anonyymmfake-svg.github.io`.

`public/config.js` verweist weiterhin auf `https://familienkosten.onrender.com`. Frontend: `https://anonyymmfake-svg.github.io/familienkosten/`.

## Lokal

Node.js 22 oder neuer. Abhängigkeiten mit `npm install` installieren. Servervariablen über `.env` setzen, `ALLOWED_ORIGIN=http://localhost:3000`, und `public/config.js` lokal auf `window.API_URL = ''` stellen. Mit `npm start` starten.

`node --test` prüft die bisherigen Kostenvalidatoren und die neuen Vokabeleingaben. `node --check server.js` und `node --check public/app.js` prüfen die Syntax.
