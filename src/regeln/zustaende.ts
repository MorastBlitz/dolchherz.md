/**
 * Zustände.
 *
 * Das SRD kennt drei Standardzustände, das Kennzeichen "vorübergehend" sowie
 * besondere Zustände, die sich aus dem Text der jeweiligen Fähigkeit ergeben
 * (z.B. Brand oder Abgelenkt). Zustände sind deshalb bewusst keine feste
 * Aufzählung: die drei Standardzustände liefern nur Beschriftung und
 * Kurzregel für die Oberfläche, jeder andere Name ist gleichwertig gültig.
 */

export type Standardzustand = {
	name: string;
	regel: string;
};

export const STANDARDZUSTAENDE: Standardzustand[] = [
	{
		name: 'Versteckt',
		regel: 'Alle Würfe gegen eine Versteckte Kreatur haben Nachteil. Der Zustand endet, sobald sie sich in die Sichtlinie eines Gegners bewegt oder einen Angriff ausführt.',
	},
	{
		name: 'Festgesetzt',
		regel: 'Kann sich nicht bewegen, aber aus ihrer gegenwärtigen Position heraus handeln.',
	},
	{
		name: 'Verwundbar',
		regel: 'Alle Würfe gegen eine Verwundbare Kreatur haben Vorteil.',
	},
];

export const STANDARDNAMEN: string[] = STANDARDZUSTAENDE.map((eintrag) => eintrag.name);

export function istStandardzustand(name: string): boolean {
	return STANDARDNAMEN.includes(name);
}

export function standardregel(name: string): string | undefined {
	return STANDARDZUSTAENDE.find((eintrag) => eintrag.name === name)?.regel;
}
