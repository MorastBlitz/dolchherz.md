import { type App, TFile, TFolder, parseYaml } from 'obsidian';
import GEGNER_DATEN from '../../data/gegner.json';
import SCHAUPLAETZE_DATEN from '../../data/schauplaetze.json';
import type { Kartendefinition, Kartenregister } from '../registry';
import type { Herkunft, Karte, Roh } from '../types';
import { slug, uebersetzeSchluessel } from './keys';

/**
 * Sprachen, die als Codeblock einen Wertekasten enthalten.
 *
 * `daggerheart` bleibt lesbar, damit Notizen aus der englischen Vorlage
 * weiter funktionieren. `statblock` fehlt bewusst: diese Sprache gehört zu
 * Fantasy Statblocks und würde sonst in jedem fremden Block eine Meldung
 * erzeugen.
 */
export const CODEMARKEN = ['dolchherz', 'daggerheart'];

export type Bibliothekseintrag = {
	karte: Karte;
	definition: Kartendefinition<any>;
};

const EINGEBAUTE_DATEN: Roh[] = [
	...(GEGNER_DATEN as unknown as Roh[]),
	...(SCHAUPLAETZE_DATEN as unknown as Roh[]),
];

/** Die mit dem Plugin ausgelieferten Wertekästen. */
export function eingebauteDaten(): { roh: Roh; herkunft: Herkunft }[] {
	return EINGEBAUTE_DATEN.map((roh) => ({ roh, herkunft: 'eingebaut' as const }));
}

export type Ordnerlesung = {
	/** False, wenn der eingestellte Ordner im Vault nicht existiert. */
	vorhanden: boolean;
	eintraege: { roh: Roh; herkunft: Herkunft }[];
	/** Pfade von Dateien, die nicht gelesen werden konnten. */
	fehler: string[];
};

/** True, wenn die Zeile einen Codeblock mit einem unserer Wertekästen eröffnet. */
export function istWertekastenAnfang(zeile: string): boolean {
	const treffer = zeile.trim().match(/^```(\S+)\s*$/);
	return treffer !== null && CODEMARKEN.includes(treffer[1]);
}

/** True, wenn die Zeile einen Codeblock schließt. */
export function istCodeblockEnde(zeile: string): boolean {
	return /^```\s*$/.test(zeile.trim());
}

/**
 * Entfernt einen Codeblock aus dem Dateiinhalt.
 *
 * Liefert `undefined`, wenn der Zeilenbereich keinen unserer Wertekästen
 * umschließt. Das schützt davor, bei veralteten Zeilennummern fremden Text
 * zu löschen.
 */
export function entferneCodeblock(
	inhalt: string,
	start: number,
	ende: number
): string | undefined {
	const zeilen = inhalt.split('\n');
	if (start < 0 || ende >= zeilen.length || start > ende) return undefined;
	if (!istWertekastenAnfang(zeilen[start] ?? '')) return undefined;
	if (!istCodeblockEnde(zeilen[ende] ?? '')) return undefined;

	zeilen.splice(start, ende - start + 1);

	// Eine durch das Entfernen entstandene Leerzeile mit ausdünnen.
	if (start > 0 && (zeilen[start] ?? '').trim() === '' && (zeilen[start - 1] ?? '').trim() === '') {
		zeilen.splice(start, 1);
	}

	return zeilen.join('\n');
}

function sammleDateien(ordner: TFolder, ergebnis: TFile[]): void {
	for (const kind of ordner.children) {
		if (kind instanceof TFile) ergebnis.push(kind);
		else if (kind instanceof TFolder) sammleDateien(kind, ergebnis);
	}
}

/** Liest Wertekästen aus den Codeblöcken einer Markdown-Datei. */
function leseCodebloecke(inhalt: string): Roh[] {
	const bloecke: Roh[] = [];
	const muster = new RegExp(
		`^\`\`\`(?:${CODEMARKEN.join('|')})\\s*$([\\s\\S]*?)^\`\`\`\\s*$`,
		'gm'
	);

	let treffer: RegExpExecArray | null;
	while ((treffer = muster.exec(inhalt)) !== null) {
		const daten: unknown = parseYaml(treffer[1] ?? '');
		if (typeof daten === 'object' && daten !== null && !Array.isArray(daten)) {
			bloecke.push(daten as Roh);
		}
	}
	return bloecke;
}

function alsListe(daten: unknown): Roh[] {
	if (Array.isArray(daten)) {
		return daten.filter(
			(eintrag): eintrag is Roh =>
				typeof eintrag === 'object' && eintrag !== null && !Array.isArray(eintrag)
		);
	}
	if (typeof daten === 'object' && daten !== null) return [daten as Roh];
	return [];
}

async function leseDatei(app: App, datei: TFile): Promise<Roh[]> {
	const inhalt = await app.vault.read(datei);

	if (datei.extension === 'json') {
		return alsListe(JSON.parse(inhalt));
	}
	if (datei.extension === 'yml' || datei.extension === 'yaml') {
		return alsListe(parseYaml(inhalt));
	}
	if (datei.extension === 'md') {
		return leseCodebloecke(inhalt);
	}
	return [];
}

/** Liest alle Wertekästen aus einem Vault-Ordner. */
export async function leseOrdner(app: App, ordnerPfad: string): Promise<Ordnerlesung> {
	const ordner = ordnerPfad !== '' ? app.vault.getFolderByPath(ordnerPfad) : null;
	if (!ordner) return { vorhanden: false, eintraege: [], fehler: [] };

	const dateien: TFile[] = [];
	sammleDateien(ordner, dateien);

	const eintraege: { roh: Roh; herkunft: Herkunft }[] = [];
	const fehler: string[] = [];

	for (const datei of dateien) {
		try {
			for (const roh of await leseDatei(app, datei)) {
				eintraege.push({ roh, herkunft: 'vault' });
			}
		} catch (fehlerObjekt) {
			console.error(`Dolchherz Orakel: ${datei.path} konnte nicht gelesen werden.`, fehlerObjekt);
			fehler.push(datei.path);
		}
	}

	return { vorhanden: true, eintraege, fehler };
}

/**
 * Baut die Bibliothek auf. Einträge werden in der übergebenen Reihenfolge
 * aufgenommen; die eingebauten Wertekästen stehen daher vor eigenen und
 * gewinnen bei aktivierter Duplikatprüfung.
 */
export function baueBibliothek(
	quellen: { roh: Roh; herkunft: Herkunft }[],
	register: Kartenregister,
	duplikateIgnorieren: boolean
): Bibliothekseintrag[] {
	const bibliothek: Bibliothekseintrag[] = [];
	const gesehen = new Set<string>();

	for (const quelle of quellen) {
		const kanonisch = uebersetzeSchluessel(quelle.roh);
		const gelesen = register.lese(kanonisch);
		if (!gelesen) continue;

		const schluessel = slug(gelesen.rumpf.name);
		if (schluessel === '') continue;
		if (duplikateIgnorieren && gesehen.has(schluessel)) continue;
		gesehen.add(schluessel);

		const karte = {
			...gelesen.rumpf,
			schluessel,
			herkunft: quelle.herkunft,
			roh: kanonisch,
		} as Karte;

		bibliothek.push({ karte, definition: gelesen.definition });
	}

	return bibliothek;
}
