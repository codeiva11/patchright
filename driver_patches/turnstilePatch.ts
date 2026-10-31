import { type Project } from "ts-morph";
import { assertDefined } from "./utils.ts";

// -----------------
// server/page.ts
// -----------------
// Turnstile / challenge auto-solve, ported from real-browser-mcp-server
// (src/lib/cjs/module/turnstile.ts + pageController.ts): a background loop
// that detects an embedded challenge widget (Cloudflare Turnstile / the
// full-page "Just a moment..." challenge) and interacts with it using real
// trusted mouse events, exactly like a user clicking the checkbox. The
// widget lives in a cross-origin iframe, so it is located by coordinates
// (getBoundingClientRect) and clicked by position instead of selectors.
// Enabled by default; opt out per context with `turnstile: false`.
export function patchTurnstile(project: Project) {
	// Add source file to the project
	const pageSourceFile = project.addSourceFileAtPath("packages/playwright-core/src/server/page.ts");

	// -- nullProgress import (page.ts only imports the Progress *type*) --
	const progressImport = pageSourceFile.getImportDeclarationOrThrow("./progress");
	progressImport.replaceWithText(`import { nullProgress, type Progress } from './progress';`);

	// ------- Page Class -------
	const pageClass = pageSourceFile.getClassOrThrow("Page");

	// -- _turnstileSolverRunning Property --
	pageClass.addProperty({
		name: "_turnstileSolverRunning",
		type: "boolean",
		initializer: "false",
	});

	// -- _checkTurnstile Method --
	// Single evaluate round: returns { solved, coords }. `solved` is true
	// when the Turnstile response input already holds a token, so a solved
	// widget is never clicked again. Otherwise `coords` holds the widget
	// boxes to click (response-input parent first, then the known wrappers,
	// then the widget-size heuristic), mirroring the MCP implementation.
	pageClass.addMethod({
		name: "_checkTurnstile",
		isAsync: true,
		returnType: "Promise<boolean>",
	});
	const checkTurnstileMethod = pageClass.getMethodOrThrow("_checkTurnstile");
	checkTurnstileMethod.setBodyText(`
		try {
			if (this.isClosedOrClosingOrCrashed())
				return false;
			const frame = this.mainFrame();
			if (!frame)
				return false;
			const result = await frame.evaluateExpression(nullProgress, \`(() => {
				const responseInput = document.querySelector('[name="cf-turnstile-response"]');
				if (responseInput && responseInput.value)
					return { solved: true, coords: [] };
				const isChallenge = document.title.includes('Just a moment') ||
					document.title.includes('Attention Required') ||
					document.querySelector('#challenge-stage') !== null ||
					document.querySelector('.cf-turnstile') !== null;
				if (!isChallenge)
					return { solved: false, coords: [] };
				const coords = [];
				if (responseInput) {
					const parent = responseInput.parentElement;
					if (parent) {
						const rect = parent.getBoundingClientRect();
						if (rect.width > 0 && rect.height > 0)
							coords.push({ x: rect.x, y: rect.y, w: rect.width, h: rect.height });
					}
				}
				if (coords.length === 0) {
					document.querySelectorAll('.cf-turnstile, #challenge-stage').forEach(wrapper => {
						const iframes = wrapper.querySelectorAll('iframe');
						if (iframes.length > 0) {
							const rect = iframes[0].getBoundingClientRect();
							if (rect.width > 0 && rect.height > 0)
								coords.push({ x: rect.x, y: rect.y, w: rect.width, h: rect.height });
						} else {
							const emptyDivs = Array.from(wrapper.querySelectorAll('div')).filter(d => !d.querySelector('*'));
							if (emptyDivs.length > 0) {
								const target = emptyDivs.reduce((prev, current) => {
									const pRect = prev.getBoundingClientRect();
									const cRect = current.getBoundingClientRect();
									return (pRect.width * pRect.height > cRect.width * cRect.height) ? prev : current;
								});
								const rect = target.getBoundingClientRect();
								if (rect.width > 50 && rect.height > 20)
									coords.push({ x: rect.x, y: rect.y, w: rect.width, h: rect.height });
							}
						}
					});
				}
				if (coords.length === 0) {
					document.querySelectorAll('div, iframe').forEach(item => {
						try {
							const rect = item.getBoundingClientRect();
							const css = window.getComputedStyle(item);
							const isWidgetSize = rect.width >= 150 && rect.width <= 400 && rect.height >= 40 && rect.height <= 100;
							if (isWidgetSize) {
								if (item.tagName === 'IFRAME')
									coords.push({ x: rect.x, y: rect.y, w: rect.width, h: rect.height });
								else if (!item.querySelector('*')) {
									if (css.margin === '0px' && css.padding === '0px')
										coords.unshift({ x: rect.x, y: rect.y, w: rect.width, h: rect.height });
									else
										coords.push({ x: rect.x, y: rect.y, w: rect.width, h: rect.height });
								}
							}
						} catch (_) {}
					});
				}
				return { solved: false, coords };
			})()\`, { isFunction: false });
			if (!result || result.solved || !result.coords || result.coords.length === 0)
				return !!result?.solved;
			if (this.isClosedOrClosingOrCrashed() || (this.mouse as any)._buttons !== 0)
				return false;
			for (const item of result.coords) {
				try {
					// Click slightly offset from left center (typical checkbox position).
					const x = item.x + Math.min(30, item.w / 4);
					const y = item.y + item.h / 2;
					await this.mouse.click(nullProgress, x, y);
				} catch {}
			}
			return true;
		} catch {
			return false;
		}
	`);

	// -- _startTurnstileSolver Method --
	// Fire-and-forget background loop (1s cadence, same as the MCP
	// pageController). Stops when the page closes. Never throws.
	pageClass.addMethod({
		name: "_startTurnstileSolver",
	});
	const startTurnstileSolverMethod = pageClass.getMethodOrThrow("_startTurnstileSolver");
	startTurnstileSolverMethod.setBodyText(`
		if (this._turnstileSolverRunning)
			return;
		this._turnstileSolverRunning = true;
		const loop = async (): Promise<void> => {
			while (!this.isClosedOrClosingOrCrashed()) {
				await this._checkTurnstile().catch(() => {});
				await new Promise(resolve => setTimeout(resolve, 1000));
			}
		};
		loop().catch(() => {});
	`);

	// -- Page Constructor: start the solver unless opted out --
	const pageConstructor = assertDefined(pageClass.getConstructors()[0]);
	const initStatement = pageConstructor
		.getStatements()
		.find(statement => statement.getText().includes("this.isStorageStatePage"));
	if (initStatement) {
		initStatement.replaceWithText(`
		this.isStorageStatePage = browserContext.isCreatingStorageStatePage();
		const isTurnstileActive = (browserContext._options as any).turnstile !== undefined
			? !!(browserContext._options as any).turnstile
			: !process.env.PWTEST_MODE;
		if (isTurnstileActive)
			this._startTurnstileSolver();
	`);
	} else {
		pageConstructor.addStatements(`
		const isTurnstileActive = (browserContext._options as any).turnstile !== undefined
			? !!(browserContext._options as any).turnstile
			: !process.env.PWTEST_MODE;
		if (isTurnstileActive)
			this._startTurnstileSolver();
	`);
	}
}
