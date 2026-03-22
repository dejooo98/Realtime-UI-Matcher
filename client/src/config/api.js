/**
 * API origin for fetches.
 * - Production (same host as the UI): leave unset → same-origin `/api/...`.
 * - Local dev: leave unset; Vite proxies `/api` and `/health` to the backend.
 * - Split deployment: set VITE_API_URL to the API origin (no trailing slash).
 */
const raw = import.meta.env.VITE_API_URL;
const base = typeof raw === "string" ? raw.replace(/\/$/, "") : "";

/**
 * @param {string} path - Absolute path starting with / (e.g. /api/compare)
 */
export function apiUrl(path) {
	const p = path.startsWith("/") ? path : `/${path}`;
	return `${base}${p}`;
}
