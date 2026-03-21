/** @typedef {'comparison' | 'results' | 'history' | 'settings' | 'about'} AppView */

const PAGES = /** @type {const} */ ({
	comparison: {
		title: "Comparison — Realtime UI Matcher",
		description:
			"Configure design vs URL, image vs image, or URL vs URL. Set viewport width, diff sensitivity, pass target, theme, and multi-viewport batch before you run a pixel comparison.",
	},
	results: {
		title: "Results — Realtime UI Matcher",
		description:
			"Inspect match score, diff imagery, overlay tools, style checks, and accessibility summary from your latest Realtime UI Matcher run.",
	},
	history: {
		title: "History — Realtime UI Matcher",
		description:
			"Browse past comparison runs and scores in Realtime UI Matcher to track visual regression trends over time.",
	},
	settings: {
		title: "Settings — Realtime UI Matcher",
		description:
			"Theme, capture timing, Puppeteer options, batch viewport list, comparison targets, and history size for Realtime UI Matcher.",
	},
	about: {
		title: "About — Realtime UI Matcher",
		description:
			"Learn what Realtime UI Matcher does: pixel QA, design-to-code fidelity, visual regression testing, and credits. Built by Dejan Markovic.",
	},
});

/**
 * @param {string} selector
 * @param {string} attr
 * @param {string} value
 */
function setMeta(selector, attr, value) {
	if (typeof document === "undefined") return;
	const el = document.querySelector(selector);
	if (el) el.setAttribute(attr, value);
}

/**
 * Updates document title and meta tags when the in-app view changes (SPA SEO).
 * @param {AppView} view
 */
export function applyPageSeo(view) {
	if (typeof document === "undefined") return;
	const page = PAGES[view] ?? PAGES.comparison;
	const origin =
		typeof window !== "undefined" ? window.location.origin : "";
	const path =
		typeof window !== "undefined" ? window.location.pathname || "/" : "/";
	const url = origin ? `${origin}${path}` : "";

	document.title = page.title;

	setMeta('meta[name="description"]', "content", page.description);
	setMeta('meta[property="og:title"]', "content", page.title);
	setMeta('meta[property="og:description"]', "content", page.description);
	setMeta('meta[name="twitter:title"]', "content", page.title);
	setMeta('meta[name="twitter:description"]', "content", page.description);

	if (url) {
		setMeta('link[rel="canonical"]', "href", url);
		setMeta('meta[property="og:url"]', "content", url);
	}
}

export { PAGES };
