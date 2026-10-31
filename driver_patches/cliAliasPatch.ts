import type { Project, SourceFile } from "ts-morph";

function applyReplacements(sourceFile: SourceFile, replacements: Array<[string, string]>) {
	let text = sourceFile.getText();
	for (const [searchValue, replaceValue] of replacements) text = text.split(searchValue).join(replaceValue);
	sourceFile.replaceWithText(text);
}

// ----------------------
// Patchwrite CLI Aliases
// ----------------------
export function patchCliAlias(project: Project) {
	// --------------
	// cli/program.ts
	// --------------
	const cliProgramSourceFile = project.addSourceFileAtPath("packages/playwright-core/src/cli/program.ts");
	applyReplacements(cliProgramSourceFile, [
		["Playwright version:", "Patchwrite version:"],
		[
			"ensure browsers necessary for this version of Playwright are installed",
			"ensure browsers necessary for this version of Patchwrite are installed",
		],
		[
			"prints list of browsers from all playwright installations",
			"prints list of browsers from all patchwrite installations",
		],
		[
			"WARNING: It looks like you are running 'npx playwright install' without first",
			"WARNING: It looks like you are running 'npx patchwrite install' without first",
		],
		["then run Playwright's install command:", "then run Patchwrite's install command:"],
		["    npx playwright install", "    npx patchwrite install"],
		[
			"If your project does not yet depend on Playwright, first install the",
			"If your project does not yet depend on Patchwrite, first install the",
		],
		[
			"then run Playwright's install command to download the browsers:",
			"then run Patchwrite's install command to download the browsers:",
		],
		["    npm install @playwright/test", "    npm install -D patchwrite"],
		["Playwright Host validation warning", "Patchwrite Host validation warning"],
		[
			"Removes browsers used by this installation of Playwright from the system (chromium, firefox, webkit, ffmpeg). This does not include branded channels.",
			"Removes browsers used by this installation of Patchwrite from the system (chromium, firefox, webkit, ffmpeg). This does not include branded channels.",
		],
		[
			"Removes all browsers used by any Playwright installation from the system.",
			"Removes all browsers used by any Patchwrite installation from the system.",
		],
		[
			"Successfully uninstalled Playwright browsers for the current Playwright installation.",
			"Successfully uninstalled Patchwrite browsers for the current Patchwrite installation.",
		],
		[
			"used by other Playwright installations.\\nTo uninstall Playwright browsers for all installations, re-run with --all flag.",
			"used by other Patchwrite installations.\\nTo uninstall Patchwrite browsers for all installations, re-run with --all flag.",
		],
		[
			"timeout for Playwright actions in milliseconds, no timeout by default",
			"timeout for Patchwrite actions in milliseconds, no timeout by default",
		],
		["return `playwright`;", "return `patchwrite`;"],
		["return `${packageManagerCommand} playwright`;", "return `${packageManagerCommand} patchwrite`;"],
	]);

	// --------------------------
	// cli/programWithTestStub.ts
	// --------------------------
	const cliProgramWithTestStubSourceFile = project.addSourceFileAtPath(
		"packages/playwright-core/src/cli/programWithTestStub.ts",
	);
	applyReplacements(cliProgramWithTestStubSourceFile, [
		["yarn playwright", "yarn patchwrite"],
		["pnpm exec playwright", "pnpm exec patchwrite"],
		["npx playwright", "npx patchwrite"],
		["Run tests with Playwright Test.", "Run tests with Patchwrite Test."],
		["Show Playwright Test HTML report.", "Show Patchwrite Test HTML report."],
		["Merge Playwright Test Blob reports", "Merge Patchwrite Test Blob reports"],
	]);

	// --------------------------
	// sserver/android/android.ts
	// --------------------------
	const androidServerSourceFile = project.addSourceFileAtPath("packages/playwright-core/src/server/android/android.ts");
	applyReplacements(androidServerSourceFile, [["playwright install android", "patchwrite install android"]]);

	// ------------------------
	// server/registry/index.ts
	// ------------------------
	const serverRegistrySourceFile = project.addSourceFileAtPath("packages/playwright-core/src/server/registry/index.ts");
	applyReplacements(serverRegistrySourceFile, [
		[
			"Looks like ${sdkLanguage === 'javascript' ? 'Playwright Test or ' : ''}Playwright was just updated to ${preferredDockerVersion.driverVersion}.",
			"Looks like ${sdkLanguage === 'javascript' ? 'Patchwrite Test or ' : ''}Patchwrite was just updated to ${preferredDockerVersion.driverVersion}.",
		],
		[
			"Looks like ${sdkLanguage === 'javascript' ? 'Playwright Test or ' : ''}Playwright was just installed or updated.",
			"Looks like ${sdkLanguage === 'javascript' ? 'Patchwrite Test or ' : ''}Patchwrite was just installed or updated.",
		],
		["<3 Playwright Team", "<3 Patchwrite Team"],
		[
			"ERROR: Playwright does not support installing ${executable.name}",
			"ERROR: Patchwrite does not support installing ${executable.name}",
		],
		[
			"wait a few minutes if other Playwright is installing browsers in parallel",
			"wait a few minutes if other Patchwrite is installing browsers in parallel",
		],
		[
			"ERROR: Playwright does not support ${descriptor.name} on ${hostPlatform}",
			"ERROR: Patchwrite does not support ${descriptor.name} on ${hostPlatform}",
		],
		[
			"BEWARE: your OS is not officially supported by Playwright; downloading fallback build for ${hostPlatform}.",
			"BEWARE: your OS is not officially supported by Patchwrite; downloading fallback build for ${hostPlatform}.",
		],
		["::warning title=Playwright::${message}", "::warning title=Patchwrite::${message}"],
		["return `playwright ${parameters}`;", "return `patchwrite ${parameters}`;"],
	]);
}
