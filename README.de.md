# PersonalTube

**Deine Kanäle, Empfehlungen aus Diskussionen und eine Videobibliothek unter deiner Kontrolle.**

[English](README.md) · [العربية](README.ar.md) · **Deutsch** · [Español](README.es.md)

PersonalTube ist ein lokales YouTube-Dashboard auf Grundlage von Andrej Karpathys [HackerTube-Idee](https://karpathy.bearblog.dev/hacker-tube/) und dem bereitgestellten Datenexport. Es verwendet den Katalog, nicht den ursprünglichen Anwendungscode von HackerTube. Diese Einführung ist auf Deutsch; die ausführlichen technischen Anleitungen sind überwiegend auf Englisch.

![Eigene Kanäle in PersonalTube](docs/images/my-channels-en-light.jpg)

*Illustrative Auswahl aus unterschiedlichen Veröffentlichungszeiträumen. Im normalen Betrieb zeigt der Feed das gewählte Fenster von 1–7 Tagen.*


YouTube-Empfehlungen prüfen jetzt das konkrete Suchthema und das gewünschte Niveau anhand begrenzter öffentlicher Videobeschreibungen und Kommentare. Pauschales Lob und nur benachbarte Themen reichen nicht: erforderlich sind konkrete Lernbelege oder begründete, themenbezogene Sehempfehlungen. Mindestens zwei positive Kommentare und mehr Zustimmung als Kritik bleiben nötig. Weniger oder keine Ergebnisse sind möglich; Modellurteile können falsch sein. [Regeln und Prüfungen](docs/YOUTUBE_ANALYSIS.md).

**Live-Prüfung (7. November 2026):** Codex und Claude analysierten über die App jeweils 157 neu abgerufene Kommentare. Codex zeigte 3 themenbezogene Ergebnisse, Claude 2. Die geprüften Belege nennen konkrete Konzepte; ein einzelnes Thema belegt keine allgemeine Genauigkeit. Bestehende Anmeldungen blieben erhalten, keine kostenpflichtige API wurde genutzt. [Ergebnisse und Grenzen](docs/VERIFICATION.md).

## Starten

1. [Node.js 22 oder 24](https://nodejs.org/en/download) mit npm installieren.
2. Dieses Repository über **Code → Download ZIP** herunterladen und entpacken. Ein privates Repository erfordert Zugriffsrechte. Alternativ:

```sh
git clone https://github.com/nasreldinali/Personal-Tube.git
cd Personal-Tube
```

3. Ein Terminal im Projektordner öffnen und starten:

```sh
npm start
```

4. [http://127.0.0.1:4173](http://127.0.0.1:4173) im Browser öffnen. Das Terminal geöffnet lassen; mit **Ctrl+C** beenden.

Kein `npm install`, Build oder Datenbankserver ist erforderlich. `index.html` nicht direkt öffnen. Die Oberfläche passt sich kleinen Bildschirmen an; der lokale Server ist jedoch nur auf demselben Computer erreichbar.

**macOS-Desktopsymbol:** Einmal `npm run desktop:install` ausführen. Danach **PersonalTube.app** auf dem Schreibtisch doppelt anklicken oder für einen Klick ins Dock ziehen. Die App öffnet eine laufende PersonalTube-Instanz oder startet den Server ohne Terminal im Hintergrund. Projektordner und Node.js am bisherigen Ort behalten. [Details](docs/DESKTOP_LAUNCHER.md).

Der Kurzbefehl aktiviert einen vorhandenen **Chrome-Tab** ohne Neuladen. Nur wenn keiner vorhanden ist, öffnet er einen neuen. macOS kann die Automation-Berechtigung für Chrome anfordern; Bedienungshilfen und Festplattenvollzugriff sind nicht erforderlich. Bei verweigerter Berechtigung erscheint ein Hinweis statt eines doppelten Tabs.

Chrome-Profile speichern getrennte Kanallisten. Verwende das ursprüngliche Profil oder [konfiguriere es lokal für den Kurzbefehl](docs/DESKTOP_LAUNCHER.md#multiple-chrome-profiles). Bei deaktivierter Aktualisierung erklärt die Seite die fehlende Verbindung oder den fehlenden Kanal und bietet die YouTube-Verbindung direkt an.

## Was ist möglich?

- Die enthaltene HackerTube-Bibliothek durchsuchen, Videos speichern und verfügbare Videos abspielen – ohne Analyse-Konto.
- Eigene Kanäle hinzufügen und nach Kategorie, Kanal, Zeitraum sowie Videos oder geschätzten Shorts filtern.
- Kommentare zu einem Thema aus unterstützten Quellen sammeln und automatisch analysieren; passende Empfehlungen mit belegenden Zitaten anzeigen.
- Manuelle oder zeitgesteuerte Aktualisierung wählen und den geschätzten YouTube-API-Verbrauch sehen.
- Englisch, Arabisch, Deutsch oder Spanisch sowie helles, dunkles oder Systemdesign wählen. Videotitel und Zitate bleiben in der Originalsprache; Katalogkategorien sind derzeit Englisch/Arabisch.

## Verbindungen und Kosten

**Verbindungen folgt einem klaren Ablauf: Verbindungsart → Dienst → verbinden, testen oder verwalten.** Abonnement, Cloud-API und lokales Modell zeigen nur die passenden Dienste. Die Abonnementauswahl zeigt jeweils ein Konto; das Durchsehen ändert weder das aktive Konto noch Anmeldungen und startet keinen Test. Das aktive Konto bleibt oben sichtbar. Die Kompatibilitätshilfe liegt unter **Nutzung & Hilfe**; MiniMax ist eine optionale Auswahl im Abonnementmenü.

**GitHub Copilot:** CLI 1.0.107 installieren, in der App anmelden, eine Probe testen und ausdrücklich auswählen. Anmeldung und Test ändern den aktiven Dienst oder Codex/Claude-Anmeldungen nicht. Nutzt dein GitHub-Kontingent ohne API-Ausweichlösung; kostenpflichtigen Mehrverbrauch bei GitHub deaktivieren. Eine Analyse mit einem echten Copilot-Konto ist hier noch nicht verifiziert. [Einrichtung und Grenzen](docs/COPILOT_SUBSCRIPTION.md).

**Settings & data** hat jetzt dieselbe feste Navigation wie Connections: YouTube, API-Verbrauch, Aktualisierung und Sicherung/Daten.

**MiniMax M Plan:** Unter **Connections → Subscription → MiniMax** den eigenen Aboschlüssel (`sk-cp-…`) speichern und ein Beispiel testen. Speichern/Testen ändern weder die Dienstauswahl noch Codex-/Claude-Anmeldungen. Erst **Use MiniMax** wählt den Dienst. Kein Pay-as-you-go-Ausweichdienst; MiniMax kann nach Verbrauch des Kontingents vorhandene Credit-Pakete nutzen. Ein echter Kontotest steht noch aus. [Einrichtung und Grenzen](docs/MINIMAX_SUBSCRIPTION.md).

| Funktion | Voraussetzung |
|---|---|
| Enthaltene Bibliothek | Node.js und Browser |
| Neue Kanaldaten und Live-Suche | Eigener YouTube-Data-API-Schlüssel |
| MiniMax-M-Plan-Abonnement | Eigener globaler Aboschlüssel; kein CLI nötig. Kontingent, danach eventuell vorhandene Credit-Pakete. |
| GitHub Copilot | Offizielle CLI 1.0.107, GitHub-Anmeldung und optionaler Probentest vor der Auswahl |
| Analyse per Codex-/Claude-Abonnement | Unterstützte Codex- oder Claude-Code-CLI und eigenes berechtigtes Konto |
| Cloud-Analyse | Eigener OpenAI-, Anthropic-, OpenRouter-, Gemini-, DeepSeek-, Mistral- oder Groq-Schlüssel und kompatible Modell-ID |
| Lokale Analyse | Laufendes Ollama, LM Studio oder einen kompatiblen lokalen Server mit einem geeigneten lokalen Modell |

In **Connections** zwischen Abonnement, Cloud-API und lokalem Modell wählen. Die Auswahl der Ansicht allein wechselt den aktiven Dienst nicht. **Mit einem Beispiel testen** prüft die gewählte Verbindung nach Bestätigung.

Die YouTube Data API ist innerhalb ihrer Kontingente kostenlos. Aktualisierungen, Suchanfragen und Metadaten verbrauchen Kontingent; die Wiedergabe selbst nicht. Der Zähler ist eine Schätzung dieses Browsers, kein offizieller Kontostand. Analyse kann Abonnementkontingent oder separate API-Kosten verursachen. Lokale Modelle benötigen eigene Hardware. Niemand nutzt Guthaben des Projektinhabers; es gibt keinen automatischen Wechsel zu einer kostenpflichtigen API.

Analyse-API-Schlüssel bleiben nur im Arbeitsspeicher des lokalen Servers. Ein Serverneustart entfernt diese Verbindungen. YouTube-Schlüssel liegen standardmäßig im Sitzungsspeicher des Browsers; dauerhaftes Merken ist optional. Backups enthalten keine Schlüssel.

[Verbindungsanleitung](docs/ANALYSIS_PROVIDERS.md) · [Benutzerhandbuch](docs/USER_GUIDE.md) · [Tests](docs/VERIFICATION.md) · [Mitwirken](CONTRIBUTING.md)

## Grenzen und Lizenz

Automatische Empfehlungen können falsch sein. Shorts werden anhand der Dauer geschätzt. YouTube Premium wird im eingebetteten Player nicht garantiert. Der Server ist für einen lokalen Nutzer gedacht und darf ohne zusätzliche Sicherheitsarchitektur nicht öffentlich bereitgestellt werden.

PersonalTube-Code und Dokumentation: [Apache 2.0](LICENSE). Der HackerTube/open-index-Katalog behält seine ODC-By-1.0-Bedingungen; Schriften und DEEDA-Markenmaterial haben eigene Hinweise. Siehe [NOTICE](NOTICE.md). PersonalTube ist ein unabhängiges Projekt, kein offizielles Produkt von Karpathy oder YouTube.

Die neue Ansicht **Connections** trennt Abonnement, Cloud-API, lokales Modell, YouTube sowie Verbrauch/Hilfe. **Find available models** liest die Modellliste des lokalen Servers, ohne Analyse oder Download. LLMs und kleine SLMs benötigen geeignete JSON-Ausgabe. Nicht jedes Chat-Abonnement ist integrierbar; Google unterstützt private Antigravity-Anmeldungen in Drittanbieter-Apps nicht; Copilot ist über die offizielle CLI integriert, Kimi Code wird für diesen automatischen Ablauf nicht angeboten. [Kompatibilität und Grenzen](docs/CONNECTION_CATALOG.md).

Unter **Abonnement → Mein Konto oder Abonnement finden** zeigt die Kontoauswahl den passenden Weg. Sie meldet dich nicht an, wechselt nicht den Anbieter und verbraucht kein Analysekontingent.

Die früheren MIT-Rechte bleiben erhalten; siehe den [historischen Lizenztext](docs/licenses/MIT-legacy.txt). Bei Weitergabe [NOTICE](NOTICE) und die Hinweise Dritter beilegen.
