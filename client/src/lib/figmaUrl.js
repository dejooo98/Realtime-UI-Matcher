const FIGMA_HOST = /(^|\.)figma\.com$/i;

/**
 * @param {string} urlString
 */
export function isFigmaUrl(urlString) {
	try {
		const u = new URL(String(urlString).trim());
		return (
			(u.protocol === "http:" || u.protocol === "https:") &&
			FIGMA_HOST.test(u.hostname.toLowerCase())
		);
	} catch {
		return false;
	}
}

/**
 * @param {string} urlString
 * @returns {{ isFigma: boolean, kind?: string, nodeId?: string | null }}
 */
export function figmaUrlHint(urlString) {
	if (!isFigmaUrl(urlString)) return { isFigma: false };
	try {
		const u = new URL(urlString.trim());
		const path = u.pathname.toLowerCase();
		let kind = "other";
		if (path.includes("/proto/")) kind = "proto";
		else if (path.includes("/design/")) kind = "design";
		else if (path.includes("/file/")) kind = "file";
		const node = u.searchParams.get("node-id");
		return { isFigma: true, kind, nodeId: node || null };
	} catch {
		return { isFigma: true, kind: "other" };
	}
}

/**
 * Same normalization the server uses before navigation (https, drop tracking `t=`).
 * @param {string} urlString
 */
export function normalizeFigmaUrlForCapture(urlString) {
	const trimmed = String(urlString || "").trim();
	if (!isFigmaUrl(trimmed)) return trimmed;
	try {
		const u = new URL(trimmed);
		u.protocol = "https:";
		u.searchParams.delete("t");
		return u.toString();
	} catch {
		return trimmed;
	}
}

/**
 * URL the app opens when “Figma embed URL for capture” is enabled in Settings.
 * You normally do not paste this — the server builds it from your design link.
 * @param {string} urlString — browser Figma link (design/proto/file)
 * @returns {string} empty if not a Figma URL
 */
export function buildFigmaEmbedPageUrl(urlString) {
	if (!isFigmaUrl(urlString)) return "";
	const canonical = normalizeFigmaUrlForCapture(urlString);
	return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(canonical)}`;
}
