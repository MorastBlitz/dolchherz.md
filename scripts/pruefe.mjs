import esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Bündelt den Prüflauf für Node und ersetzt dabei das Modul "obsidian" durch
 * eine Attrappe. Danach kann `.pruefung.cjs` mit Node ausgeführt werden.
 */

const hier = path.dirname(fileURLToPath(import.meta.url));
const wurzel = path.resolve(hier, "..");

await esbuild.build({
	entryPoints: [path.join(hier, "pruefe-daten.ts")],
	bundle: true,
	platform: "node",
	format: "cjs",
	target: "node18",
	outfile: path.join(wurzel, ".pruefung.cjs"),
	logLevel: "warning",
	plugins: [
		{
			name: "obsidian-attrappe",
			setup(build) {
				build.onResolve({ filter: /^obsidian$/ }, () => ({
					path: path.join(hier, "obsidian-stub.ts"),
				}));
			},
		},
	],
});
