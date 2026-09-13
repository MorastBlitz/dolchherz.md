/**
 * Zentrale Textverwaltung.
 *
 * Aktuell ist nur Deutsch hinterlegt. Eine weitere Sprache ist ein zusätzliches
 * Objekt in `TEXTE`; `t()` bleibt unverändert.
 */

const DE = {
	// Karten
	'karte.gegner': 'Gegner*in',
	'karte.schauplatz': 'Schauplatz',

	// Felder
	'feld.rang': 'Rang',
	'feld.typ': 'Typ',
	'feld.schwierigkeitsgrad': 'Schwierigkeitsgrad',
	'feld.ziele_taktiken': 'Ziele & Taktiken',
	'feld.angriffsmodifikator': 'Angriffsmodifikator',
	'feld.standardangriff': 'Standardangriff',
	'feld.erfahrung': 'Erfahrung',
	'feld.tp': 'TP',
	'feld.stress': 'Stress',
	'feld.schwellen': 'Schwellen',
	'feld.anregungen': 'Anregungen',
	'feld.moeglicheGegner': 'Mögliche Gegner*innen',

	// Schadensschwellen (SRD: Mittlere und Schwere Schadensschwelle)
	'schwelle.leicht': 'LEICHT',
	'schwelle.mittel': 'MITTEL',
	'schwelle.schwer': 'SCHWER',
	'schwelle.massiv': 'MASSIV',
	'schwelle.hinweis': 'Klick markiert TP, Alt+Klick löscht sie wieder.',

	// Fähigkeiten
	'faehigkeit.anwendungen': 'Anwendungen',
	'faehigkeit.countdown': 'Countdown',
	'faehigkeit.zufaellig': 'zufälliger Startwert',
	'faehigkeit.schleife': 'Schleife',
	'faehigkeit.furchtfaehig': 'Furchtfähigkeit',

	// Zustände
	'zustand.titel': 'Zustände',
	'zustand.hinzufuegen': 'Zustand hinzufügen',
	'zustand.platzhalter': 'Name des Zustands',
	'zustand.voruebergehend': 'vorübergehend',
	'zustand.standard': 'Standardzustand',
	'zustand.entfernen': 'Zustand entfernen',

	// Statusleiste
	'status.kampfpunkte': 'Kampfpunkte',
	'status.kampfpunkteTooltip': '{punkte} von {budget} Kampfpunkten für {anzahlSC} SC',
	'status.lakaien': 'Lakaiengruppen: {gruppen}',
	'status.horde': 'Hordengröße: {groesse}',

	// Befehle
	'befehl.vorlage': 'Vorlage einfügen: {typ}',
	'befehl.einfuegen': 'Einfügen aus Bibliothek: {typ}',
	'befehl.bibliothekAktualisieren': 'Bibliothek aktualisieren',
	'befehl.kartenzustandZuruecksetzen': 'Markierten Kartenzustand zurücksetzen',

	// Menüband
	'band.menue': 'dolchherz.md',

	// Suchdialog
	'suche.platzhalter': 'Wertekasten suchen …',
	'suche.leer': 'Keine passenden Wertekasten gefunden.',
	'suche.eigene': 'eigene Datei',

	// Oberfläche
	'ui.anzahlErhoehen': 'Anzahl erhöhen',
	'ui.anzahlVerringern': 'Anzahl verringern',
	'ui.angriffswurf': 'Angriffswurf',
	'ui.richtwertHinweis': 'Richtwerte',
	'ui.farbe': 'Kartenfarbe',
	'ui.beispielAnzeigen': 'Beispiel-Wertekasten anzeigen',
	'ui.kopieren': 'Wertekasten kopieren',
	'ui.loeschen': 'Wertekasten löschen',

	// Dialoge
	'dialog.abbrechen': 'Abbrechen',
	'dialog.loeschen': 'Löschen',
	'dialog.loeschenTitel': 'Wertekasten löschen',
	'dialog.loeschenFrage': '"{name}" aus dieser Notiz entfernen?',
	'dialog.loeschenHinweis':
		'Der Codeblock wird aus der Notiz entfernt. Das lässt sich nicht rückgängig machen.',

	// Meldungen
	'meldung.bibliothekGeladen': '{anzahl} Wertekasten geladen',
	'meldung.bibliothekLeer': 'Keine gültigen Wertekasten in "{ordner}" gefunden',
	'meldung.ordnerFehlt': 'Bibliotheksordner existiert nicht im Vault',
	'meldung.keinEditor': 'Kein aktiver Editor',
	'meldung.kartenZurueckgesetzt': 'Markierter Kartenzustand zurückgesetzt',
	'meldung.dateiFehler': 'Konnte {pfad} nicht lesen',
	'meldung.beispielEingefuegt': 'Beispiel-Wertekasten wurde eingefügt',
	'meldung.karteUnbekannt':
		'Unbekannter Wertekasten: Es fehlt ein gültiger Name oder das Feld "art" passt zu keinem Kartentyp.',
	'meldung.yamlFehler': 'Dieser Wertekasten ist kein gültiges YAML.',
	'meldung.kopiert': 'Wertekasten als Codeblock kopiert',
	'meldung.kopierenNichtMoeglich': 'Kopieren war nicht möglich',
	'meldung.geloescht': 'Wertekasten gelöscht',
	'meldung.loeschenNichtMoeglich':
		'Löschen war nicht möglich: Der Codeblock ließ sich in der Notiz nicht sicher zuordnen.',

	// Einstellungen
	'einstellung.darstellung': 'Darstellung',
	'einstellung.standardfarbe': 'Standardfarbe',
	'einstellung.farbwahl': 'Farbwahl je Karte anzeigen',
	'einstellung.massiveSchwelle': '"Massiv"-Schwelle anzeigen',
	'einstellung.massiveSchwelleBeschreibung':
		'Optionale Regel "Massive Schäden": vierter Knopf für Schaden ab dem Doppelten der Schweren Schwelle.',
	'einstellung.begegnung': 'Begegnung',
	'einstellung.anzahlSC': 'Anzahl der Spielcharaktere',
	'einstellung.anzahlSCBeschreibung':
		'Bestimmt das Kampfpunkte-Budget und die Größe von Lakaiengruppen.',
	'einstellung.anpassungen': 'Anpassungen des Kampfpunkte-Budgets',
	'einstellung.anpassungenBeschreibung':
		'Aus dem SRD, Abschnitt "Ausgewogene Begegnungen erschaffen". Startwert ist (3 × Anzahl SC) + 2.',
	'einstellung.bibliothek': 'Bibliothek',
	'einstellung.ordner': 'Ordner für eigene Wertekasten',
	'einstellung.ordnerBeschreibung':
		'JSON-, YAML- und Markdown-Dateien in diesem Ordner werden zusätzlich geladen.',
	'einstellung.ordnerPlatzhalter': 'z.B. Daggerheart/Eigene Wertekästen',
	'einstellung.duplikate': 'Einträge mit doppeltem Namen ignorieren',
	'einstellung.duplikateBeschreibung':
		'Bei gleichnamigen Wertekästen wird nur der zuerst gefundene verwendet.',
	'einstellung.richtwerte': 'Abweichungen von den Rang-Richtwerten melden',
	'einstellung.richtwerteBeschreibung':
		'Zeigt einen Hinweis im Wertekasten, wenn Werte von den SRD-Richtwerten des Rangs abweichen.',
} as const;

export type Textschluessel = keyof typeof DE;

export const SPRACHEN = ['de'] as const;
export type Sprache = typeof SPRACHEN[number];

const TEXTE: Record<Sprache, Record<Textschluessel, string>> = { de: DE };

let aktuelleSprache: Sprache = 'de';

export function setzeSprache(sprache: Sprache): void {
	aktuelleSprache = sprache;
}

/**
 * Liefert den Text zu einem Schlüssel und ersetzt `{platzhalter}`.
 * Unbekannte Platzhalter bleiben unverändert stehen.
 */
export function t(schluessel: Textschluessel, werte?: Record<string, string | number>): string {
	const text = TEXTE[aktuelleSprache][schluessel] ?? schluessel;
	if (!werte) return text;
	return text.replace(/\{(\w+)\}/g, (treffer, name: string) =>
		name in werte ? String(werte[name]) : treffer
	);
}
