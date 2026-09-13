import type { Kartenregister } from '../registry';
import { gegner } from './gegner';
import { schauplatz } from './schauplatz';

export { gegner, schauplatz };

/**
 * Registriert alle Kartentypen.
 *
 * Ein neuer Kartentyp braucht genau eine Datei in diesem Ordner und eine
 * Zeile hier. Befehle, Menüband-Einträge, Suchdialog, Rendering und
 * Zustandsverfolgung ergeben sich daraus automatisch.
 */
export function registriereKarten(register: Kartenregister): void {
	register.registriere(gegner);
	register.registriere(schauplatz);
}
