import type { Gegner, Schauplatz } from '../types';

/**
 * Plausibilitätsprüfung gegen die Rang-Richtwerte des SRD.
 *
 * Die Werte sind ausdrücklich Richtwerte; veröffentlichte Wertekästen weichen
 * bewusst davon ab. Die Prüfung ist deshalb optional und meldet nur Abweichungen,
 * sie verhindert nichts.
 */

export type Richtwert = {
	bezeichnung: string;
	erwartet: string;
	gefunden: string;
};

/** SRD "Richtwerte für Wertekästen von Gegner*innen". */
export const GEGNER_RICHTWERTE: Record<
	number,
	{ angriff: string; schwierigkeitsgrad: number; schwellen: [number, number] }
> = {
	1: { angriff: '+1', schwierigkeitsgrad: 11, schwellen: [7, 12] },
	2: { angriff: '+2', schwierigkeitsgrad: 14, schwellen: [10, 20] },
	3: { angriff: '+3', schwierigkeitsgrad: 17, schwellen: [20, 32] },
	4: { angriff: '+4', schwierigkeitsgrad: 20, schwellen: [25, 45] },
};

/** SRD "Richtwerte für Schauplätze nach Rang". */
export const SCHAUPLATZ_RICHTWERTE: Record<number, { schwierigkeitsgrad: number }> = {
	1: { schwierigkeitsgrad: 11 },
	2: { schwierigkeitsgrad: 14 },
	3: { schwierigkeitsgrad: 17 },
	4: { schwierigkeitsgrad: 20 },
};

function ersteZahl(wert?: string): number | undefined {
	if (wert === undefined) return undefined;
	const treffer = wert.match(/-?\d+/);
	return treffer ? Number.parseInt(treffer[0], 10) : undefined;
}

export function pruefeGegner(gegner: Gegner): Richtwert[] {
	const richtwert = gegner.rang !== undefined ? GEGNER_RICHTWERTE[gegner.rang] : undefined;
	if (!richtwert) return [];

	const hinweise: Richtwert[] = [];

	const schwierigkeit = ersteZahl(gegner.schwierigkeitsgrad);
	if (schwierigkeit !== undefined && schwierigkeit !== richtwert.schwierigkeitsgrad) {
		hinweise.push({
			bezeichnung: 'Schwierigkeitsgrad',
			erwartet: String(richtwert.schwierigkeitsgrad),
			gefunden: String(schwierigkeit),
		});
	}

	if (gegner.schwellen.length === 2) {
		const [mittel, schwer] = richtwert.schwellen;
		if (gegner.schwellen[0] !== mittel || gegner.schwellen[1] !== schwer) {
			hinweise.push({
				bezeichnung: 'Schwellen',
				erwartet: `${mittel}/${schwer}`,
				gefunden: gegner.schwellen.join('/'),
			});
		}
	}

	return hinweise;
}

export function pruefeSchauplatz(schauplatz: Schauplatz): Richtwert[] {
	const richtwert =
		schauplatz.rang !== undefined ? SCHAUPLATZ_RICHTWERTE[schauplatz.rang] : undefined;
	if (!richtwert) return [];

	const schwierigkeit = ersteZahl(schauplatz.schwierigkeitsgrad);
	if (schwierigkeit !== undefined && schwierigkeit !== richtwert.schwierigkeitsgrad) {
		return [
			{
				bezeichnung: 'Schwierigkeitsgrad',
				erwartet: String(richtwert.schwierigkeitsgrad),
				gefunden: String(schwierigkeit),
			},
		];
	}
	return [];
}
