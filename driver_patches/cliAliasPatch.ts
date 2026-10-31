import type { Project, SourceFile } from "ts-morph";

function applyReplacements(sourceFile: SourceFile, replacements: Array<[string, string]>) {
	let text = sourceFile.getText();
	for (const [searchValue, replaceValue] of replacements) text = text.split(searchValue).join(replaceValue);
	sourceFile.replaceWithText(text);
}

// -----------------------
// Patchwright CLI Aliases
// -----------------------
export function patchCliAlias(project: Project) {
	// --------------
	// cli/program.ts
	// --------------
	const cliProgramSourceFile = project.addSourceFileAtPath("packages/playwright-core/src/cli/program.ts");
	applyReplacements(cliProgramSourceFile, [
		["Playwright version:", "Patchwright version:"],
		[
			"ensure browsers necessary for this version of Playwright are installed",
			"ensure browsers necessary for this version of Patchwright are installed",
		],
		[
			"prints list of browsers from all playwright installations",
			"prints list of browsers from all patchwright installations",
		],
		[
			"WARNING: It looks like you are running 'npx playwright install' without first",
			"WARNING: It looks like you are running 'npx patchwright install' without first",
		],
		["then run Playwright's install command:", "then run Patchwright's install command:"],
		["    npx playwright install", "    npx patchwright install"],
		[
			"If your project does not yet depend on Playwright, first install the",
			"If your project does not yet depend on Patchwright, first install the",
		],
		[
			"then run Playwright's install command to download the browsers:",
			"then run Patchwright's install command to download the browsers:",
		],
		["    npm install @playwright/test", "    npm install -D patchwright"],
		["Playwright Host validation warning", "Patchwright Host validation warning"],
		[
			"Removes browsers used by this installation of Playwright from the system (chromium, firefox, webkit, ffmpeg). This does not include branded channels.",
			"Removes browsers used by this installation of Patchwright from the system (chromium, firefox, webkit, ffmpeg). This does not include branded channels.",
		],
		[
			"Removes all browsers used by any Playwright installation from the system.",
			"Removes all browsers used by any Patchwright installation from the system.",
		],
		[
			"Successfully uninstalled Playwright browsers for the current Playwright installation.",
			"Successfully uninstalled Patchwright browsers for the current Patchwright installation.",
		],
		[
			"used by other Playwright installations.\\nTo uninstall Playwright browsers for all installations, re-run with --all flag.",
			"used by other Patchwright installations.\\nTo uninstall Patchwright browsers for all installations, re-run with --all flag.",
		],
		[
			"timeout for Playwright actions in milliseconds, no timeout by default",
			"timeout for Patchwright actions in milliseconds, no timeout by default",
		],
		["return `playwright`;", "return `patchwright`;"],
		["return `${packageManagerCommand} playwright`;", "return `${packageManagerCommand} patchwright`;"],
	]);

	// --------------------------
	// cli/programWithTestStub.ts
	// --------------------------
	const cliProgramWithTestStubSourceFile = project.addSourceFileAtPath(
		"packages/playwright-core/src/cli/programWithTestStub.ts",
	);
	applyReplacements(cliProgramWithTestStubSourceFile, [
		["yarn playwright", "yarn patchwright"],
		["pnpm exec playwright", "pnpm exec patchwright"],
		["npx playwright", "npx patchwright"],
		["Run tests with Playwright Test.", "Run tests with Patchwright Test."],
		["Show Playwright Test HTML report.", "Show Patchwright Test HTML report."],
		["Merge Playwright Test Blob reports", "Merge Patchwright Test Blob reports"],
	]);

	// --------------------------
	// sserver/android/android.ts
	// --------------------------
	const androidServerSourceFile = project.addSourceFileAtPath("packages/playwright-core/src/server/android/android.ts");
	applyReplacements(androidServerSourceFile, [["playwright install android", "patchwright install android"]]);

	// ------------------------
	// server/registry/index.ts
	// ------------------------
	const serverRegistrySourceFile = project.addSourceFileAtPath("packages/playwright-core/src/server/registry/index.ts");
	applyReplacements(serverRegistrySourceFile, [
		[
			"Looks like ${sdkLanguage === 'javascript' ? 'Playwright Test or ' : ''}Playwright was just updated to ${preferredDockerVersion.driverVersion}.",
			"Looks like ${sdkLanguage === 'javascript' ? 'Patchwright Test or ' : ''}Patchwright was just updated to ${preferredDockerVersion.driverVersion}.",
		],
		[
			"Looks like ${sdkLanguage === 'javascript' ? 'Playwright Test or ' : ''}Playwright was just installed or updated.",
			"Looks like ${sdkLanguage === 'javascript' ? 'Patchwright Test or ' : ''}Patchwright was just installed or updated.",
		],
		["<3 Playwright Team", "<3 Patchwright Team"],
		[
			"ERROR: Playwright does not support installing ${executable.name}",
			"ERROR: Patchwright does not support installing ${executable.name}",
		],
		[
			"wait a few minutes if other Playwright is installing browsers in parallel",
			"wait a few minutes if other Patchwright is installing browsers in parallel",
		],
		[
			"ERROR: Playwright does not support ${descriptor.name} on ${hostPlatform}",
			"ERROR: Patchwright does not support ${descriptor.name} on ${hostPlatform}",
		],
		[
			"BEWARE: your OS is not officially supported by Playwright; downloading fallback build for ${hostPlatform}.",
			"BEWARE: your OS is not officially supported by Patchwright; downloading fallback build for ${hostPlatform}.",
		],
		["::warning title=Playwright::${message}", "::warning title=Patchwright::${message}"],
		["return `playwright ${parameters}`;", "return `patchwright ${parameters}`;"],
	]);
}
