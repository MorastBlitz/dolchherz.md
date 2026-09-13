import type { MarkdownRenderChild } from 'obsidian';
import type DolchherzOrakel from './main';
import type { Richtwert } from './regeln/richtwerte';
import type { Karte, Roh, Rumpf } from './types';

/**
 * Kartenregister.
 *
 * Ein Kartentyp ist ein Objekt, das diese Schnittstelle erfüllt. Alles, was
 * nur für bestimmte Typen gilt — Kampfpunkte, Zustände, Vorlagen — ist eine
 * optionale Methode. Ein neuer Kartentyp kostet daher eine Datei und eine
 * Zeile im Register, ohne Änderung an Oberfläche oder Hauptmodul.
 */

/** Die Bereiche, in die ein Kartentyp zeichnet. */
export type Kartenbereiche = {
	/** Beschreibung und Wertezeilen. */
	kopf: HTMLElement;
	/** Fähigkeiten und andere Textinhalte. */
	merkmale: HTMLElement;
	/**
	 * Ein Block je Exemplar. Werte und Zustände desselben Exemplars gehören
	 * zusammen, damit bei mehreren Gegnern nicht erst alle Trefferpunkte und
	 * dann alle Zustände erscheinen.
	 */
	instanzen: HTMLElement;
	/** Hinweise, etwa Abweichungen von den Rang-Richtwerten. */
	hinweise: HTMLElement;
};

export type Renderkontext<T extends Karte = Karte> = {
	karte: T;
	/** Laufzeit-ID aus dem Codeblock; sie bestimmt die Zustandsverfolgung. */
	id: string;
	/** Anzahl platzierter Exemplare. */
	anzahl: number;
	filePath: string;
	plugin: DolchherzOrakel;
	component: MarkdownRenderChild;
	bereiche: Kartenbereiche;
	/** Liefert den Block eines Exemplars und legt ihn beim ersten Zugriff an. */
	instanzbereich(instanz: number): HTMLElement;
	/** Zeichnet den Wertekasten neu, etwa nach dem Setzen eines Zustands. */
	neuzeichnen: () => void;
};

export interface Kartendefinition<T extends Karte = Karte> {
	/** Wert des Feldes `art` im Codeblock, z.B. "gegner". */
	art: string;
	/** Darf mehrfach in einem Wertekasten platziert werden (Gegner ja, Schauplatz nein). */
	anzahlbar?: boolean;
	/** Anzeigename für Befehle und Menüs. */
	bezeichnung(): string;
	/** Erkennt Rohdaten dieses Typs, wenn kein `art`-Feld gesetzt ist. */
	erkennen(roh: Roh): boolean;
	/** Wandelt Rohdaten in das kanonische Modell um. */
	lesen(roh: Roh): Rumpf<T> | undefined;
	/** Einzeilige Zusatzangabe für den Suchdialog, z.B. "Rang 1 Solo". */
	untertitel(karte: T): string;
	/** Beschreibung für den Suchdialog. */
	beschreibung(karte: T): string;
	/** Zeichnet die Karte in die übergebenen Bereiche. */
	rendern(ctx: Renderkontext<T>): void;
	/**
	 * Kampfpunkte-Kategorie laut SRD, z.B. "Solo"; nur Gegner haben eine.
	 * Die Summierung übernimmt `berechneKampfpunkte`, damit Lakaien als
	 * Gruppe und nicht einzeln gezählt werden.
	 */
	kampfpunkttyp?(karte: T): string | undefined;
	/** Vorausgewählte Zustände; ohne Angabe gelten die Standardzustände. */
	zustaende?(karte: T): string[];
	/** Abweichungen von den Rang-Richtwerten. */
	hinweise?(karte: T): Richtwert[];
	/** YAML-Vorlage zum Einfügen per Befehl. */
	vorlage?(): string;
}

export type Lesergebnis = {
	definition: Kartendefinition<any>;
	rumpf: Rumpf;
};

export class Kartenregister {
	/**
	 * Die Definitionen werden absichtlich als `any` geführt: das Register ist
	 * heterogen, die Typprüfung findet innerhalb der jeweiligen Kartendatei statt.
	 */
	private readonly definitionen: Kartendefinition<any>[] = [];

	registriere(definition: Kartendefinition<any>): void {
		this.definitionen.push(definition);
	}

	alle(): Kartendefinition<any>[] {
		return this.definitionen;
	}

	nachArt(art: string): Kartendefinition<any> | undefined {
		return this.definitionen.find((definition) => definition.art === art);
	}

	/** Ermittelt den Kartentyp: zuerst über `art`, sonst über `erkennen`. */
	ermittle(roh: Roh): Kartendefinition<any> | undefined {
		const art = typeof roh.art === 'string' ? roh.art.trim() : '';
		if (art !== '') {
			const ueberArt = this.nachArt(art);
			if (ueberArt) return ueberArt;
		}
		return this.definitionen.find((definition) => definition.erkennen(roh));
	}

	/** Liest Rohdaten in das kanonische Modell, sofern ein Typ passt. */
	lese(roh: Roh): Lesergebnis | undefined {
		const definition = this.ermittle(roh);
		if (!definition) return undefined;
		const rumpf = definition.lesen(roh);
		if (!rumpf) return undefined;
		return { definition, rumpf };
	}
}

/** Textbausteine, die von mehreren Kartentypen verwendet werden. */
export function untertitelMitRang(rang?: number, typ?: string): string {
	return [rang !== undefined ? `Rang ${rang}` : undefined, typ]
		.filter((teil): teil is string => typeof teil === 'string' && teil !== '')
		.join(' ');
}
