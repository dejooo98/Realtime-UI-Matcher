const WAIT_UNTIL = new Set([
	"networkidle2",
	"domcontentloaded",
	"load",
	"networkidle0",
]);

/**
 * Parse capture options from JSON or multipart fields (strings).
 * @param {Record<string, unknown>} body
 */
export function parseCaptureOptions(body) {
	const raw = body ?? {};

	const waitUntil = WAIT_UNTIL.has(String(raw.waitUntil))
		? String(raw.waitUntil)
		: "networkidle2";

	const navSec = Number.parseInt(String(raw.navTimeoutSec ?? ""), 10);
	const navigationTimeoutMs = Number.isFinite(navSec)
		? Math.min(120_000, Math.max(15_000, navSec * 1000))
		: 60_000;

	const postMs = Number.parseInt(String(raw.postDelayMs ?? ""), 10);
	const postDelayMs = Number.isFinite(postMs)
		? Math.min(10_000, Math.max(0, postMs))
		: 0;

	const maxH = Number.parseInt(String(raw.maxCaptureHeight ?? ""), 10);
	const maxCaptureHeight = Number.isFinite(maxH)
		? Math.min(8000, Math.max(400, maxH))
		: 3000;

	const sel = raw.selector;
	const selector =
		typeof sel === "string" && sel.trim() ? sel.trim().slice(0, 500) : undefined;

	const disableAnimations =
		String(raw.disableAnimations) === "true" ||
		raw.disableAnimations === true;

	const includeA11y =
		String(raw.includeA11y) === "true" || raw.includeA11y === true;

	const includeCssSummary =
		String(raw.includeCssSummary) === "true" || raw.includeCssSummary === true;

	const useFigmaEmbed =
		String(raw.useFigmaEmbed) === "true" || raw.useFigmaEmbed === true;

	return {
		waitUntil,
		navigationTimeoutMs,
		postDelayMs,
		maxCaptureHeight,
		...(selector ? { selector } : {}),
		disableAnimations,
		includeA11y,
		includeCssSummary,
		useFigmaEmbed,
	};
}

/**
 * @param {unknown} raw — JSON array string or array of widths
 * @returns {number[] | null}
 */
export function parseViewportWidthsList(raw) {
	if (raw == null || raw === "") return null;
	try {
		const j = typeof raw === "string" ? JSON.parse(raw) : raw;
		if (!Array.isArray(j) || j.length === 0) return null;
		const nums = [];
		for (const x of j) {
			const w = Number.parseInt(String(x), 10);
			if (w > 0 && w <= 3840) nums.push(w);
		}
		return nums.length ? nums.slice(0, 20) : null;
	} catch {
		return null;
	}
}
