const THEME_KEY = "rum_theme";
const HISTORY_LIMIT_KEY = "rum_historyLimit";

export function loadStoredTheme() {
	if (typeof window === "undefined") return "light";
	try {
		const v = window.localStorage.getItem(THEME_KEY);
		return v === "dark" ? "dark" : "light";
	} catch {
		return "light";
	}
}

export function persistTheme(theme) {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(THEME_KEY, theme);
	} catch {}
}

export function loadHistoryLimit(defaultLimit = 20) {
	if (typeof window === "undefined") return defaultLimit;
	try {
		const n = Number.parseInt(
			String(window.localStorage.getItem(HISTORY_LIMIT_KEY) ?? ""),
			10
		);
		if (Number.isFinite(n) && n >= 5 && n <= 100) return n;
	} catch {}
	return defaultLimit;
}

export function persistHistoryLimit(n) {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(HISTORY_LIMIT_KEY, String(n));
	} catch {}
}
