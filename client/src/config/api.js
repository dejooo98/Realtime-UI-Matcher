/**
 * API origin for all fetches. Empty string = same origin (Vite dev proxy → backend).
 * Set VITE_API_URL in production when the API is on another host (e.g. https://api.example.com).
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
