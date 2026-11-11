import { existsSync } from "node:fs";
import { copyFile, cp, mkdir, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectPath = fileURLToPath(new URL("../", import.meta.url));
const vaultPath = join(projectPath, ".misc", "calendarz-test-vault");
const fixturesPath = join(projectPath, "test", "fixtures", "vault");
// The test vault uses Obsidian's default config directory before the app opens it.
// eslint-disable-next-line obsidianmd/hardcoded-config-path
const configDirName = ".obsidian";
const pluginPath = join(vaultPath, configDirName, "plugins", "calendarz");
const settingsPath = join(pluginPath, "data.json");

await mkdir(pluginPath, { recursive: true });

if (!existsSync(settingsPath)) {
	await cp(fixturesPath, vaultPath, {
		recursive: true,
		force: false,
		filter: (source) => basename(source) !== configDirName,
	});
	const settings = {
		displayMode: "dots",
		showWeekNumber: true,
		weekNoteEnabled: true,
	};
	try {
		await writeFile(settingsPath, JSON.stringify(settings, null, "\t") + "\n", { flag: "wx" });
	} catch (error) {
		if (error.code !== "EEXIST") throw error;
	}
}

for (const file of ["main.js", "manifest.json", "styles.css"]) {
	await copyFile(join(projectPath, file), join(pluginPath, file));
}

console.log(`Open this folder as a vault in Obsidian:\n${vaultPath}`);
