import { apiUrl } from "../config/api.js";

/** Default timeout — Puppeteer screenshots can take a while */
const DEFAULT_TIMEOUT_MS = 120_000;

export class ApiError extends Error {
	/**
	 * @param {string} message
	 * @param {{ status?: number; details?: string }} [meta]
	 */
	constructor(message, meta = {}) {
		super(message);
		this.name = "ApiError";
		this.status = meta.status;
		this.details = meta.details;
	}
}

/**
 * Structured error for {@link ErrorAlert} (title + optional detail).
 * @param {unknown} err
 * @returns {{ title: string, detail?: string }}
 */
export function formatErrorForAlert(err) {
	if (err instanceof ApiError) {
		const title = err.message || "Something went wrong";
		const detail =
			err.details && err.details !== err.message ? err.details : undefined;
		return detail ? { title, detail } : { title };
	}
	if (err instanceof Error) {
		const title = err.message || "Something went wrong";
		return { title };
	}
	return { title: String(err) };
}

/**
 * Single string (e.g. logs). Prefer {@link formatErrorForAlert} in UI.
 * @param {unknown} err
 */
export function formatUserFacingError(err) {
	const { title, detail } = formatErrorForAlert(err);
	return detail ? `${title}\n${detail}` : title;
}

export const endpoints = {
	compare: () => apiUrl("/api/compare"),
	compareImages: () => apiUrl("/api/compare-images"),
	compareUrls: () => apiUrl("/api/compare-urls"),
	compareUrlsBatch: () => apiUrl("/api/compare-urls-batch"),
	analyzeStyle: () => apiUrl("/api/analyze-style"),
};

/**
 * @param {Response} res
 */
async function readErrorPayload(res) {
	const data = await res.json().catch(() => ({}));
	let message =
		(typeof data.error === "string" && data.error) ||
		(typeof data.message === "string" && data.message) ||
		(typeof data.details === "string" && data.details) ||
		`HTTP ${res.status}`;

	let details =
		typeof data.details === "string" && data.details !== message
			? data.details
			: undefined;

	if (res.status === 429) {
		if (message === `HTTP ${res.status}` || !message) {
			message = "Too many requests. Please wait and try again.";
		}
		const retryAfter = res.headers.get("Retry-After");
		if (retryAfter) {
			const extra = `Retry after ${retryAfter}s.`;
			details = details ? `${details} ${extra}` : extra;
		}
	}

	return {
		message,
		details,
		status: res.status,
	};
}

function abortError() {
	return new ApiError("Request timed out. Is the server running?", {
		status: 0,
	});
}

/**
 * JSON request with timeout and consistent errors.
 * @param {string} url
 * @param {RequestInit & { timeoutMs?: number }} init
 */
export async function fetchJson(url, init = {}) {
	const { timeoutMs = DEFAULT_TIMEOUT_MS, ...rest } = init;
	const controller = new AbortController();
	const id = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const res = await fetch(url, { ...rest, signal: controller.signal });
		if (!res.ok) {
			const { message, details, status } = await readErrorPayload(res);
			throw new ApiError(message, { status, details });
		}
		return await res.json();
	} catch (e) {
		if (e instanceof ApiError) throw e;
		if (e && e.name === "AbortError") throw abortError();
		throw e;
	} finally {
		clearTimeout(id);
	}
}

/**
 * @param {string} url
 * @param {Record<string, unknown>} body
 * @param {{ timeoutMs?: number }} [options]
 */
export function postJson(url, body, options = {}) {
	const { timeoutMs } = options;
	return fetchJson(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
		...(timeoutMs != null ? { timeoutMs } : {}),
	});
}

/**
 * @param {string} url
 * @param {FormData} formData
 * @param {{ timeoutMs?: number }} [options]
 */
export async function postFormData(url, formData, options = {}) {
	const { timeoutMs = DEFAULT_TIMEOUT_MS } = options;
	const controller = new AbortController();
	const id = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const res = await fetch(url, {
			method: "POST",
			body: formData,
			signal: controller.signal,
		});
		if (!res.ok) {
			const { message, details, status } = await readErrorPayload(res);
			throw new ApiError(message, { status, details });
		}
		return await res.json();
	} catch (e) {
		if (e instanceof ApiError) throw e;
		if (e && e.name === "AbortError") throw abortError();
		throw e;
	} finally {
		clearTimeout(id);
	}
}

/**
 * Best-effort JSON POST (e.g. style analysis). Returns null on failure or non-OK.
 * @param {string} url
 * @param {Record<string, unknown>} body
 * @param {{ timeoutMs?: number }} [options]
 */
export async function postJsonIfOk(url, body, options = {}) {
	const { timeoutMs = 60_000 } = options;
	const controller = new AbortController();
	const id = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const res = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
			signal: controller.signal,
		});
		if (!res.ok) return null;
		return await res.json();
	} catch {
		return null;
	} finally {
		clearTimeout(id);
	}
}
