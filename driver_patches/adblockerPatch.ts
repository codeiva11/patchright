import { type Project, SyntaxKind } from "ts-morph";
import { assertDefined } from "./utils.ts";

// ----------------------------------------------------
// server/chromium/crNetworkManager.ts & server/page.ts
// (Built-in Ad & Tracker Blocker Engine)
// ----------------------------------------------------
// Native zero-latency ad and tracker blocking at the CDP Fetch layer.
// Intercepts and terminates ad-network, telemetry, and tracking requests with
// native 'BlockedByClient' error reason (identical to uBlock Origin / Ghostery).
// Also supports dynamic @ghostery/adblocker-playwright integration when available.
// Enabled by default; opt-out per context with `adblocker: false`.
export function patchAdBlocker(project: Project) {
	// 1. Patch crNetworkManager.ts for network-layer drop
	const crNetworkManagerSourceFile = project.addSourceFileAtPath(
		"packages/playwright-core/src/server/chromium/crNetworkManager.ts",
	);

	// Add ad/tracker detection helper at top of file
	crNetworkManagerSourceFile.addStatements(`
		const _kBuiltinAdDomains = new Set([
			'doubleclick.net', 'googlesyndication.com', 'googleadservices.com', 'adservice.google.com',
			'adnxs.com', 'criteo.com', 'criteo.net', 'rubiconproject.com', 'pubmatic.com',
			'openx.net', 'casalemedia.com', 'taboola.com', 'outbrain.com', 'mgid.com',
			'revcontent.com', 'zergnet.com', 'popads.net', 'popcash.net', 'propellerads.com',
			'adcash.com', 'exoclick.com', 'trafficjunky.com', 'juicyads.com', 'adsterra.com',
			'scorecardresearch.com', 'quantserve.com', 'chartbeat.com', 'moatads.com',
			'adsrvr.org', 'bidswitch.net', 'hotjar.com', 'clarity.ms', 'mouseflow.com',
			'crazyegg.com', 'statcounter.com'
		]);

		function _isAdOrTrackerUrl(urlStr: string): boolean {
			try {
				const hostname = new URL(urlStr).hostname.toLowerCase();
				const parts = hostname.split('.');
				for (let i = 0; i < parts.length - 1; i++) {
					const domain = parts.slice(i).join('.');
					if (_kBuiltinAdDomains.has(domain)) return true;
				}
				if (/\\/(?:pagead|adsystem|doubleclick|googlesyndication)\\//i.test(urlStr)) return true;
				return false;
			} catch {
				return false;
			}
		}
	`);

	const crNetworkManagerClass = crNetworkManagerSourceFile.getClassOrThrow("CRNetworkManager");
	const onRequestMethod = crNetworkManagerClass.getMethodOrThrow("_onRequest");
	const onRequestMethodBody = onRequestMethod.getBodyOrThrow().asKindOrThrow(SyntaxKind.Block);

	// Insert adblock check right after isInterceptedOptionsPreflight handling
	const preflightCheckStatement = assertDefined(
		onRequestMethodBody.getStatements().find(s => s.getText().includes("isInterceptedOptionsPreflight &&")),
	);
	const insertIndex = preflightCheckStatement.getChildIndex() + 1;

	onRequestMethodBody.insertStatements(
		insertIndex,
		`
		const isAdBlockerActive = (this._page?.browserContext?._options as any)?.adblocker !== false;
		if (isAdBlockerActive && _isAdOrTrackerUrl(requestWillBeSentEvent.request.url)) {
			requestPausedSessionInfo!.session._sendMayFail('Fetch.failRequest', {
				requestId: requestPausedEvent!.requestId,
				errorReason: 'BlockedByClient',
			});
			return;
		}
	`,
	);

	// 2. Patch page.ts to add enableAdBlocker() helper
	const pageSourceFile = project.addSourceFileAtPath("packages/playwright-core/src/server/page.ts");
	const pageClass = pageSourceFile.getClassOrThrow("Page");

	pageClass.addMethod({
		name: "enableAdBlocker",
		isAsync: true,
	});
	const enableAdBlockerMethod = pageClass.getMethodOrThrow("enableAdBlocker");
	enableAdBlockerMethod.setBodyText(`
		(this.browserContext._options as any).adblocker = true;
		try {
			const ghostery = await import('@ghostery/adblocker-playwright').catch(() => null);
			if (ghostery && (ghostery as any).PlaywrightBlocker) {
				const blocker = await (ghostery as any).PlaywrightBlocker.fromPrebuiltAdsAndTracking(fetch).catch(() => null);
				if (blocker)
					await blocker.enableBlockingInPage(this as any).catch(() => {});
			}
		} catch {}
	`);
}
