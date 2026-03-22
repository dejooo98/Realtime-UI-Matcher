import { isServerlessRuntime } from "./runtimeEnv.js";

const WAIT_UNTIL = new Set([
	"networkidle2",
	"domcontentloaded",
	"load",
	"networkidle0",
]);

/**
 * Max time for page.goto in serverless mode. A too-low cap causes
 * "Navigation timeout of N ms exceeded" on slow hosts.
 * Set SERVERLESS_NAV_MAX_MS (5000–120000) to align with the host’s execution limit.
 * Default 25s; some providers cap total wall time much lower.
 */
function serverlessNavMaxMs() {
	const raw = process.env.SERVERLESS_NAV_MAX_MS;
	const n = Number.parseInt(String(raw ?? "").trim(), 10);
	if (Number.isFinite(n) && n >= 5000 && n <= 120_000) {
		return n;
	}
	return 25_000;
}

const SERVERLESS_POST_DELAY_MAX_MS = 1200;

/**
 * Parse capture options from JSON or multipart fields (strings).
 * @param {Record<string, unknown>} body
 */
export function parseCaptureOptions(body) {
	const raw = body ?? {};

	const waitUntil = WAIT_UNTIL.has(String(raw.waitUntil))
		? String(raw.waitUntil)
		: "domcontentloaded";

	const navSec = Number.parseInt(String(raw.navTimeoutSec ?? ""), 10);
	let navigationTimeoutMs = Number.isFinite(navSec)
		? Math.min(120_000, Math.max(15_000, navSec * 1000))
		: 60_000;

	const postMs = Number.parseInt(String(raw.postDelayMs ?? ""), 10);
	let postDelayMs = Number.isFinite(postMs)
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

	let includeA11y =
		String(raw.includeA11y) === "true" || raw.includeA11y === true;

	let includeCssSummary =
		String(raw.includeCssSummary) === "true" || raw.includeCssSummary === true;

	const useFigmaEmbed =
		String(raw.useFigmaEmbed) === "true" || raw.useFigmaEmbed === true;

	let waitUntilOut = waitUntil;
	let maxCaptureHeightOut = maxCaptureHeight;

	if (isServerlessRuntime()) {
		/* Smaller captures + faster navigation — avoid 504 when function budget is ~10s */
		maxCaptureHeightOut = Math.min(maxCaptureHeightOut, 2000);
		if (waitUntilOut === "networkidle2" || waitUntilOut === "networkidle0") {
			waitUntilOut = "domcontentloaded";
		}
		navigationTimeoutMs = Math.min(navigationTimeoutMs, serverlessNavMaxMs());
		postDelayMs = Math.min(postDelayMs, SERVERLESS_POST_DELAY_MAX_MS);
		includeCssSummary = false;
		includeA11y = false;
	}

	return {
		waitUntil: waitUntilOut,
		navigationTimeoutMs,
		postDelayMs,
		maxCaptureHeight: maxCaptureHeightOut,
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
