import type { Kartenzustand, PluginState, Zustandspfad } from './types';

/** Feld, unter dem die Zustände eines Exemplars liegen. */
const ZUSTANDSSAMMLUNG = 'zustaende';

/** Felder eines Exemplars; jeder andere Name ist ein Zustandsname. */
const INSTANZFELDER: readonly string[] = [
	'tp',
	'stress',
	'anwendungen',
	'countdown',
	ZUSTANDSSAMMLUNG,
	'voruebergehend',
];

/**
 * Zugriff auf den gespeicherten Kartenzustand.
 *
 * Der Zustandsbaum liegt unter `PluginState.karten[id]`; die ID stammt aus dem
 * Codeblock, sodass jedes platzierte Exemplar unabhängig verfolgt wird.
 * Werte sind Zahlen (markierte TP, gesetzte Zustände, Stand eines Countdowns);
 * ein Wert von 0 wird entfernt, damit die gespeicherten Daten schlank bleiben.
 */
export class Zustandsspeicher {
	constructor(
		private readonly daten: PluginState,
		private readonly sichern: () => void
	) {}

	private knoten(
		pfad: Zustandspfad,
		anlegen: boolean
	): Record<string | number, unknown> | undefined {
		let knoten = this.daten.karten as unknown as Record<string | number, unknown>;
		for (let i = 0; i < pfad.length - 1; i++) {
			const schluessel = pfad[i];
			const vorhanden = knoten[schluessel];
			if (typeof vorhanden !== 'object' || vorhanden === null) {
				if (!anlegen) return undefined;
				const neu: Record<string | number, unknown> = {};
				knoten[schluessel] = neu;
				knoten = neu;
			} else {
				knoten = vorhanden as Record<string | number, unknown>;
			}
		}
		return knoten;
	}

	lese(pfad: Zustandspfad): number | undefined {
		const eltern = this.knoten(pfad, false);
		if (!eltern) return undefined;
		const wert = eltern[pfad[pfad.length - 1]];
		return typeof wert === 'number' ? wert : undefined;
	}

	/** Objekt am Ende eines Pfades, sofern dort eines liegt. */
	private unterknoten(pfad: Zustandspfad): Record<string, unknown> | undefined {
		const eltern = this.knoten(pfad, false);
		if (!eltern) return undefined;
		const inhalt = eltern[pfad[pfad.length - 1]];
		return typeof inhalt === 'object' && inhalt !== null
			? (inhalt as Record<string, unknown>)
			: undefined;
	}

	/**
	 * Namen der gesetzten Zustände eines Exemplars.
	 *
	 * Die Felder eines Exemplars sind selbst keine Zustände. Sie werden hier
	 * übersprungen, damit sie nicht als Zustandsschaltflächen erscheinen.
	 */
	zustaende(id: string, instanz: number): string[] {
		const inhalt = this.unterknoten([id, instanz, ZUSTANDSSAMMLUNG]);
		if (!inhalt) return [];
		return Object.keys(inhalt).filter((name) => !INSTANZFELDER.includes(name));
	}

	setze(pfad: Zustandspfad, wert: number): void {
		const eltern = this.knoten(pfad, true);
		if (!eltern) return;
		const letzter = pfad[pfad.length - 1];
		if (wert === 0) delete eltern[letzter];
		else eltern[letzter] = wert;
		this.sichern();
	}

	private nachId(id: string, anlegen: boolean): Kartenzustand | undefined {
		let zustand = this.daten.karten[id];
		if (!zustand) {
			if (!anlegen) return undefined;
			zustand = {};
			this.daten.karten[id] = zustand;
		}
		return zustand;
	}

	anzahl(id: string): number {
		return this.nachId(id, false)?.anzahl ?? 1;
	}

	setzeAnzahl(id: string, anzahl: number): void {
		const zustand = this.nachId(id, true);
		if (!zustand) return;
		zustand.anzahl = Math.max(1, anzahl);
		this.sichern();
	}

	farbe(id: string): string | undefined {
		return this.nachId(id, false)?.farbe;
	}

	setzeFarbe(id: string, farbe: string): void {
		const zustand = this.nachId(id, true);
		if (!zustand) return;
		zustand.farbe = farbe;
		this.sichern();
	}

	/** Verwirft alle markierten Werte aller Karten. */
	allesZuruecksetzen(): void {
		this.daten.karten = {};
		this.sichern();
	}
}
