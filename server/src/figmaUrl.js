/**
 * Figma URL helpers — normalize links and optionally use the embed player for capture.
 */

const FIGMA_HOST = /(^|\.)figma\.com$/i;

/**
 * @param {string} hostname
 */
export function isFigmaHostname(hostname) {
	return FIGMA_HOST.test(String(hostname || "").toLowerCase());
}

/**
 * @param {string} urlString
 */
export function isFigmaUrl(urlString) {
	try {
		const u = new URL(String(urlString).trim());
		return u.protocol === "http:" || u.protocol === "https:"
			? isFigmaHostname(u.hostname)
			: false;
	} catch {
		return false;
	}
}

/**
 * @param {string} urlString
 * @returns {{ isFigma: boolean, kind?: string, nodeId?: string | null }}
 */
export function figmaUrlMeta(urlString) {
	if (!isFigmaUrl(urlString)) return { isFigma: false };
	try {
		const u = new URL(urlString.trim());
		const path = u.pathname.toLowerCase();
		let kind = "other";
		if (path.includes("/proto/")) kind = "proto";
		else if (path.includes("/design/")) kind = "design";
		else if (path.includes("/file/")) kind = "file";
		else if (path.includes("/community/")) kind = "community";
		const node = u.searchParams.get("node-id");
		return {
			isFigma: true,
			kind,
			nodeId: node || null,
		};
	} catch {
		return { isFigma: true, kind: "other" };
	}
}

/**
 * Force https and trim; optional embed URL for cleaner full-page embed UI.
 * @param {string} urlString
 * @param {{ useEmbed?: boolean }} [opts]
 */
export function resolveFigmaCaptureUrl(urlString, opts = {}) {
	const { useEmbed = false } = opts;
	const trimmed = String(urlString || "").trim();
	if (!trimmed) return trimmed;
	if (!isFigmaUrl(trimmed)) return trimmed;
	let u;
	try {
		u = new URL(trimmed);
	} catch {
		return trimmed;
	}
	u.protocol = "https:";
	/* Tracking param can be dropped for capture; keeps URLs stable. */
	u.searchParams.delete("t");

	if (useEmbed) {
		const canonical = u.toString();
		return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(canonical)}`;
	}
	return u.toString();
}
