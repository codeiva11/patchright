import { type Project } from "ts-morph";

// -----------------
// server/input.ts
// -----------------
// Human-like Bézier curve mouse trajectory generation in the core driver.
// Automatically produces natural acceleration, deceleration, and curved paths
// on mouse movements, hovers, and clicks, defeating bot detectors (DataDome,
// Akamai, Cloudflare, Kasada, CreepJS) that track linear mouse jumps.
// Enabled by default; opt-out per context via `humanize: false`.
export function patchInput(project: Project) {
	const inputSourceFile = project.addSourceFileAtPath("packages/playwright-core/src/server/input.ts");

	const mouseClass = inputSourceFile.getClassOrThrow("Mouse");
	const moveMethod = mouseClass.getMethodOrThrow("move");

	moveMethod.setBodyText(`
		const fromX = this._x;
		const fromY = this._y;
		this._x = x;
		this._y = y;
		const dx = x - fromX;
		const dy = y - fromY;
		const dist = Math.hypot(dx, dy);

		// If caller explicitly requested steps, or humanize is disabled, or distance is tiny
		const isHuman = (this._page.browserContext._options as any).humanize !== false;
		if (options.steps !== undefined || !isHuman || dist < 10) {
			const steps = options.steps ?? 1;
			for (let i = 1; i <= steps; i++) {
				const middleX = fromX + (x - fromX) * (i / steps);
				const middleY = fromY + (y - fromY) * (i / steps);
				await this._raw.move(progress, middleX, middleY, this._lastButton, this._buttons, this._keyboard._modifiers(), !!options.forClick);
			}
			return;
		}

		// Human curved trajectory with quadratic Bézier interpolation and easing
		const steps = Math.min(20, Math.max(5, Math.floor(dist / 30)));
		const spread = Math.min(dist * 0.18, 30);
		const midX = (fromX + x) / 2 + (Math.random() - 0.5) * spread;
		const midY = (fromY + y) / 2 + (Math.random() - 0.5) * spread;

		for (let i = 1; i <= steps; i++) {
			const t = i / steps;
			const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
			const inv = 1 - eased;
			const curX = Math.round(inv * inv * fromX + 2 * inv * eased * midX + eased * eased * x);
			const curY = Math.round(inv * inv * fromY + 2 * inv * eased * midY + eased * eased * y);
			await this._raw.move(progress, curX, curY, this._lastButton, this._buttons, this._keyboard._modifiers(), !!options.forClick);
		}
	`);
}
