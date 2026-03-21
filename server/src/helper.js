import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { getBrowser } from "./browserPool.js";
import { applyMaskRegions } from "./mask.js";
import { resolveFigmaCaptureUrl, figmaUrlMeta } from "./figmaUrl.js";
import {
	assertCapturePageOk,
	assertCapturePageOkContentOnly,
	resolveDualFigmaTiming,
	resolveFigmaTiming,
	setupCapturePage,
} from "./capturePageSetup.js";

/* -------------- Low-level helpers -------------- */

export function toPngBuffer(data) {
	if (!data) {
		throw new Error("Missing image data.");
	}
	if (Buffer.isBuffer(data)) {
		return data;
	}
	if (data instanceof Uint8Array) {
		return Buffer.from(data);
	}
	if (typeof data === "string") {
		return Buffer.from(data, "base64");
	}
	throw new Error("Unsupported image data type for PNG parsing.");
}

function buildSectionScores(diffPng, sectionCount = 5) {
	const { width, height, data } = diffPng;

	const sectionDiff = new Array(sectionCount).fill(0);
	const sectionTotal = new Array(sectionCount).fill(0);

	for (let y = 0; y < height; y++) {
		const sectionIndex = Math.min(
			sectionCount - 1,
			Math.floor((y / height) * sectionCount)
		);

		for (let x = 0; x < width; x++) {
			const idx = (width * y + x) * 4;
			const r = data[idx];
			const g = data[idx + 1];
			const b = data[idx + 2];
			const a = data[idx + 3];

			const isDiff = a !== 0 && (r !== 0 || g !== 0 || b !== 0);

			if (isDiff) {
				sectionDiff[sectionIndex]++;
			}
			sectionTotal[sectionIndex]++;
		}
	}

	const sectionScores = [];

	for (let i = 0; i < sectionCount; i++) {
		const total = sectionTotal[i] || 1;
		const diff = sectionDiff[i];
		const ratio = diff / total;
		const matchScore = Math.max(0, Math.min(100, 100 - ratio * 100));

		sectionScores.push({
			id: i,
			label: `Section ${i + 1}`,
			startRatio: i / sectionCount,
			endRatio: (i + 1) / sectionCount,
			diffPixels: diff,
			totalPixels: total,
			matchScore,
		});
	}

	return sectionScores;
}

/**
 * @param {Array<{ x: number; y: number; width: number; height: number }>} [maskRegions] — normalized 0–1 rects; differences inside are ignored
 */
export function computeDiff(
	aInput,
	bInput,
	threshold = 0.1,
	sectionCount = 5,
	maskRegions = []
) {
	const aBuffer = toPngBuffer(aInput);
	const bBuffer = toPngBuffer(bInput);

	const pngA = PNG.sync.read(aBuffer);
	const pngB = PNG.sync.read(bBuffer);

	const width = Math.min(pngA.width, pngB.width);
	const height = Math.min(pngA.height, pngB.height);

	if (!width || !height) {
		throw new Error("Invalid image dimensions.");
	}

	const aCropped = new PNG({ width, height });
	const bCropped = new PNG({ width, height });

	PNG.bitblt(pngA, aCropped, 0, 0, width, height, 0, 0);
	PNG.bitblt(pngB, bCropped, 0, 0, width, height, 0, 0);

	if (maskRegions.length > 0) {
		applyMaskRegions(aCropped, bCropped, maskRegions);
	}

	const diffPng = new PNG({ width, height });

	const diffPixels = pixelmatch(
		aCropped.data,
		bCropped.data,
		diffPng.data,
		width,
		height,
		{ threshold }
	);

	const totalPixels = width * height;
	const diffRatio = diffPixels / totalPixels;
	const matchScore = Math.max(0, Math.min(100, 100 - diffRatio * 100));
	const diffBuffer = PNG.sync.write(diffPng);

	const sectionScores = buildSectionScores(diffPng, sectionCount);

	return {
		width,
		height,
		diffPixels,
		totalPixels,
		matchScore,
		diffBuffer,
		sectionScores,
	};
}

function isServerlessRuntime() {
	return (
		Boolean(process.env.NETLIFY) ||
		Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME)
	);
}

/** Netlify/AWS sync functions have ~6MB response bodies; keep PNGs bounded. */
export const SERVERLESS_PNG_MAX_DIMENSION = 2048;

/**
 * Downscale PNG so max(width, height) ≤ maxDim (nearest-neighbor).
 * @param {Buffer | Uint8Array | string} input
 * @param {number} [maxDim]
 * @returns {Buffer}
 */
export function clampPngMaxDimension(
	input,
	maxDim = SERVERLESS_PNG_MAX_DIMENSION
) {
	const buf = toPngBuffer(input);
	const src = PNG.sync.read(buf);
	const w = src.width;
	const h = src.height;
	if (w <= maxDim && h <= maxDim) {
		return buf;
	}
	const scale = Math.min(maxDim / w, maxDim / h);
	const nw = Math.max(1, Math.round(w * scale));
	const nh = Math.max(1, Math.round(h * scale));
	const dst = new PNG({ width: nw, height: nh });

	for (let y = 0; y < nh; y++) {
		for (let x = 0; x < nw; x++) {
			const sx = Math.min(w - 1, Math.floor((x * w) / nw));
			const sy = Math.min(h - 1, Math.floor((y * h) / nh));
			const si = (w * sy + sx) << 2;
			const di = (nw * y + x) << 2;
			dst.data[di] = src.data[si];
			dst.data[di + 1] = src.data[si + 1];
			dst.data[di + 2] = src.data[si + 2];
			dst.data[di + 3] = src.data[si + 3];
		}
	}

	return PNG.sync.write(dst);
}

function maybeClampPngForServerless(buffer) {
	if (!isServerlessRuntime()) return buffer;
	return clampPngMaxDimension(buffer);
}

/**
 * @param {string} url
 * @param {number} width
 * @param {{
 *   waitUntil?: 'networkidle2' | 'domcontentloaded' | 'load' | 'networkidle0';
 *   navigationTimeoutMs?: number;
 *   postDelayMs?: number;
 *   maxCaptureHeight?: number;
 *   selector?: string;
 *   disableAnimations?: boolean;
 *   includeA11y?: boolean;
 *   includeCssSummary?: boolean;
 *   useFigmaEmbed?: boolean;
 * }} [options]
 * @returns {Promise<{ buffer: Buffer; a11y: object | null; cssSummary?: object | null }>}
 */
export async function screenshotUrl(url, width, options = {}) {
	const {
		waitUntil = "networkidle2",
		navigationTimeoutMs = 60_000,
		postDelayMs = 0,
		maxCaptureHeight = 3000,
		selector,
		disableAnimations = false,
		includeA11y = false,
		includeCssSummary = false,
		useFigmaEmbed = false,
	} = options;

	const navigateUrl = resolveFigmaCaptureUrl(url, { useEmbed: useFigmaEmbed });
	const { effectiveWait, effectivePostDelayMs } = resolveFigmaTiming(
		navigateUrl,
		waitUntil,
		postDelayMs
	);

	const browser = await getBrowser();
	const page = await browser.newPage();
	try {
		await setupCapturePage(page);
		await page.setViewport({ width, height: 900 });
		const response = await page.goto(navigateUrl, {
			waitUntil: effectiveWait,
			timeout: navigationTimeoutMs,
		});
		await assertCapturePageOk(page, response, navigateUrl);

		if (disableAnimations) {
			await page.addStyleTag({
				content:
					"*,*::before,*::after{animation-duration:0.001ms!important;animation-iteration-count:1!important;transition-duration:0.001ms!important;}",
			});
		}

		if (effectivePostDelayMs > 0) {
			await new Promise((r) => setTimeout(r, effectivePostDelayMs));
		}
		await assertCapturePageOkContentOnly(page, navigateUrl);

		let a11ySummary = null;
		if (includeA11y) {
			try {
				const AxePuppeteer = (await import("@axe-core/puppeteer")).default;
				const r = await new AxePuppeteer(page).analyze();
				a11ySummary = {
					violations: r.violations.slice(0, 30).map((v) => ({
						id: v.id,
						impact: v.impact,
						description: v.description,
						help: v.help,
						nodes: v.nodes.length,
					})),
					incomplete: r.incomplete?.length ?? 0,
				};
			} catch (e) {
				a11ySummary = { error: String(e?.message ?? e) };
			}
		}

		const runCssSummary = async () => {
			if (!includeCssSummary) return null;
			try {
				return await page.evaluate(extractPageCssSummaryInPage);
			} catch {
				return { error: "css_summary_failed" };
			}
		};

		if (selector) {
			const el = await page.$(selector);
			if (!el) {
				throw new Error(`Selector not found: ${selector}`);
			}
			await el.evaluate((node) =>
				node.scrollIntoView({ block: "center", inline: "nearest" })
			);
			const cssSummary = await runCssSummary();
			let buffer = await el.screenshot({ type: "png" });
			buffer = maybeClampPngForServerless(buffer);
			return { buffer, a11y: a11ySummary, cssSummary };
		}

		const bodyHeight = await page.evaluate(
			() =>
				document.body.scrollHeight ||
				document.documentElement.scrollHeight ||
				900
		);

		await page.setViewport({
			width,
			height: Math.min(bodyHeight, maxCaptureHeight),
		});

		const cssSummary = await runCssSummary();
		let buffer = await page.screenshot({
			fullPage: true,
			type: "png",
		});
		buffer = maybeClampPngForServerless(buffer);

		return { buffer, a11y: a11ySummary, cssSummary };
	} finally {
		await page.close();
	}
}

export function parseViewportWidth(raw) {
	const width = parseInt(raw, 10);
	if (!width || width <= 0) {
		throw new Error("viewportWidth must be a positive number.");
	}
	return width;
}

export function parseThreshold(raw) {
	const t = parseFloat(raw);
	return Number.isFinite(t) ? t : 0.1;
}

/* -------------- Style analysis -------------- */

function normalizePx(value) {
	if (!value) return null;
	const n = parseFloat(String(value).replace("px", "").trim());
	return Number.isFinite(n) ? n : null;
}

function normalizeColorString(value) {
	if (!value) return null;
	return String(value).trim().toLowerCase();
}

function normalizeFontFamily(value) {
	if (!value) return null;
	return String(value)
		.split(",")[0]
		.replace(/['"]/g, "")
		.trim()
		.toLowerCase();
}

function paletteJaccard(a, b) {
	const A = new Set(
		(a || []).map((c) => normalizeColorString(c)).filter(Boolean)
	);
	const B = new Set(
		(b || []).map((c) => normalizeColorString(c)).filter(Boolean)
	);
	if (A.size === 0 && B.size === 0) return 100;
	let inter = 0;
	for (const x of A) {
		if (B.has(x)) inter++;
	}
	const union = A.size + B.size - inter;
	return union ? Math.round((100 * inter) / union) : 0;
}

/**
 * Serialized into the browser by Puppeteer — keep self-contained.
 */
export function extractPageCssSummaryInPage() {
	function getStyle(el) {
		if (!el) return null;
		const cs = window.getComputedStyle(el);
		return {
			fontSize: cs.fontSize,
			lineHeight: cs.lineHeight,
			color: cs.color,
			backgroundColor: cs.backgroundColor,
			fontFamily: cs.fontFamily,
			fontWeight: cs.fontWeight,
			padding: cs.padding,
			margin: cs.margin,
			borderRadius: cs.borderRadius,
			letterSpacing: cs.letterSpacing,
		};
	}

	const body = document.body;
	const h1 = document.querySelector("h1");
	const h2 = document.querySelector("h2");
	const firstP = document.querySelector("p");
	const firstA = document.querySelector("a[href]");
	const primaryButton = document.querySelector(
		"button, [role='button'], .btn, .btn-primary, button[type='submit']"
	);

	const tagCounts = {};
	const tagNames = [
		"h1",
		"h2",
		"h3",
		"h4",
		"h5",
		"h6",
		"p",
		"a",
		"button",
		"img",
		"svg",
		"form",
		"input",
		"ul",
		"ol",
		"li",
		"section",
		"article",
		"nav",
		"header",
		"footer",
		"main",
	];
	for (const t of tagNames) {
		tagCounts[t] = document.querySelectorAll(t).length;
	}

	const palette = new Set();
	const fontFamilies = new Set();
	const maxEls = 400;
	const els = document.querySelectorAll("*");
	const n = Math.min(els.length, maxEls);
	for (let i = 0; i < n; i++) {
		const cs = window.getComputedStyle(els[i]);
		const fg = cs.color;
		const bg = cs.backgroundColor;
		if (fg && fg !== "rgba(0, 0, 0, 0)" && fg !== "transparent") {
			palette.add(fg);
		}
		if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
			palette.add(bg);
		}
		const ff = cs.fontFamily;
		if (ff) {
			fontFamilies.add(ff.split(",")[0].replace(/['"]/g, "").trim());
		}
	}

	const cssVars = [];
	try {
		const rootStyles = getComputedStyle(document.documentElement);
		for (let i = 0; i < rootStyles.length; i++) {
			const name = rootStyles[i];
			if (name && name.startsWith("--")) {
				cssVars.push({
					name,
					value: rootStyles.getPropertyValue(name).trim(),
				});
				if (cssVars.length >= 48) break;
			}
		}
	} catch {
		/* ignore */
	}

	const desc = document.querySelector('meta[name="description"]');

	return {
		meta: {
			title: document.title || "",
			description: desc ? desc.getAttribute("content") || "" : "",
		},
		tagCounts,
		keyElements: {
			body: getStyle(body),
			h1: getStyle(h1),
			h2: getStyle(h2),
			p: getStyle(firstP),
			link: getStyle(firstA),
			primaryButton: getStyle(primaryButton),
		},
		palette: [...palette].slice(0, 36),
		fontFamilies: [...fontFamilies].filter(Boolean).slice(0, 16),
		cssVariables: cssVars.slice(0, 48),
	};
}

/**
 * @param {object} design
 * @param {object} impl
 * @param {{ urlDesign?: string; urlImplementation?: string }} [urlMeta]
 */
export function buildStyleReportFromSummaries(design, impl, urlMeta = {}) {
	const dk = design?.keyElements || {};
	const ik = impl?.keyElements || {};
	const checks = [];

	checks.push({
		id: "h1-font-size",
		category: "Typography",
		label: "H1 font size",
		design: dk.h1?.fontSize ?? null,
		implementation: ik.h1?.fontSize ?? null,
		match:
			normalizePx(dk.h1?.fontSize) === normalizePx(ik.h1?.fontSize),
	});

	const dH2 = (design?.tagCounts?.h2 ?? 0) > 0;
	const iH2 = (impl?.tagCounts?.h2 ?? 0) > 0;
	let h2Match = false;
	if (!dH2 && !iH2) h2Match = true;
	else if (dH2 && iH2) {
		h2Match =
			normalizePx(dk.h2?.fontSize) === normalizePx(ik.h2?.fontSize);
	} else {
		h2Match = false;
	}
	checks.push({
		id: "h2-font-size",
		category: "Typography",
		label: "H2 font size",
		design: dk.h2?.fontSize ?? null,
		implementation: ik.h2?.fontSize ?? null,
		match: h2Match,
	});

	checks.push({
		id: "body-font-family",
		category: "Typography",
		label: "Body font (first in stack)",
		design: dk.body?.fontFamily ?? null,
		implementation: ik.body?.fontFamily ?? null,
		match:
			normalizeFontFamily(dk.body?.fontFamily) ===
			normalizeFontFamily(ik.body?.fontFamily),
	});

	checks.push({
		id: "body-text-color",
		category: "Colors",
		label: "Body text color",
		design: dk.body?.color ?? null,
		implementation: ik.body?.color ?? null,
		match:
			normalizeColorString(dk.body?.color) ===
			normalizeColorString(ik.body?.color),
	});

	checks.push({
		id: "body-background",
		category: "Colors",
		label: "Body background",
		design: dk.body?.backgroundColor ?? null,
		implementation: ik.body?.backgroundColor ?? null,
		match:
			normalizeColorString(dk.body?.backgroundColor) ===
			normalizeColorString(ik.body?.backgroundColor),
	});

	checks.push({
		id: "link-color",
		category: "Colors",
		label: "First link color",
		design: dk.link?.color ?? null,
		implementation: ik.link?.color ?? null,
		match:
			normalizeColorString(dk.link?.color) ===
			normalizeColorString(ik.link?.color),
	});

	checks.push({
		id: "primary-button-bg",
		category: "Buttons",
		label: "Primary button background",
		design: dk.primaryButton?.backgroundColor ?? null,
		implementation: ik.primaryButton?.backgroundColor ?? null,
		match:
			normalizeColorString(dk.primaryButton?.backgroundColor) ===
			normalizeColorString(ik.primaryButton?.backgroundColor),
	});

	const overlap = paletteJaccard(design?.palette, impl?.palette);
	checks.push({
		id: "palette-overlap",
		category: "Palette",
		label: "Sampled color overlap (Jaccard)",
		design: `${(design?.palette || []).length} swatches`,
		implementation: `${(impl?.palette || []).length} swatches`,
		match: overlap >= 20,
		detail: `${overlap}%`,
	});

	const { urlDesign = "", urlImplementation = "" } = urlMeta;

	return {
		design,
		implementation: impl,
		checks,
		paletteOverlap: overlap,
		figmaHints: {
			urlA: figmaUrlMeta(urlDesign),
			urlB: figmaUrlMeta(urlImplementation),
		},
	};
}

/**
 * @param {{
 *   waitUntil?: 'networkidle2' | 'domcontentloaded' | 'load' | 'networkidle0';
 *   navigationTimeoutMs?: number;
 *   postDelayMs?: number;
 *   disableAnimations?: boolean;
 *   useFigmaEmbed?: boolean;
 * }} [options]
 */
export async function analyzeStyleForUrls(
	urlDesign,
	urlImplementation,
	width,
	options = {}
) {
	const {
		waitUntil = "networkidle2",
		navigationTimeoutMs = 60_000,
		postDelayMs = 0,
		disableAnimations = false,
		useFigmaEmbed = false,
	} = options;

	const navDesign = resolveFigmaCaptureUrl(urlDesign, { useEmbed: useFigmaEmbed });
	const navImpl = resolveFigmaCaptureUrl(urlImplementation, {
		useEmbed: useFigmaEmbed,
	});

	const { effectiveWait, effectivePostDelayMs } = resolveDualFigmaTiming(
		navDesign,
		navImpl,
		waitUntil,
		postDelayMs
	);

	const browser = await getBrowser();
	const pageDesign = await browser.newPage();
	const pageImpl = await browser.newPage();

	try {
		await Promise.all([setupCapturePage(pageDesign), setupCapturePage(pageImpl)]);
		await pageDesign.setViewport({ width, height: 900 });
		await pageImpl.setViewport({ width, height: 900 });

		const [resDesign, resImpl] = await Promise.all([
			pageDesign.goto(navDesign, {
				waitUntil: effectiveWait,
				timeout: navigationTimeoutMs,
			}),
			pageImpl.goto(navImpl, {
				waitUntil: effectiveWait,
				timeout: navigationTimeoutMs,
			}),
		]);

		await assertCapturePageOk(pageDesign, resDesign, navDesign);
		await assertCapturePageOk(pageImpl, resImpl, navImpl);

		if (disableAnimations) {
			const css =
				"*,*::before,*::after{animation-duration:0.001ms!important;animation-iteration-count:1!important;transition-duration:0.001ms!important;}";
			await Promise.all([
				pageDesign.addStyleTag({ content: css }),
				pageImpl.addStyleTag({ content: css }),
			]);
		}

		if (effectivePostDelayMs > 0) {
			await new Promise((r) => setTimeout(r, effectivePostDelayMs));
		}

		await Promise.all([
			assertCapturePageOkContentOnly(pageDesign, navDesign),
			assertCapturePageOkContentOnly(pageImpl, navImpl),
		]);

		const [designSummary, implSummary] = await Promise.all([
			pageDesign.evaluate(extractPageCssSummaryInPage),
			pageImpl.evaluate(extractPageCssSummaryInPage),
		]);

		return buildStyleReportFromSummaries(designSummary, implSummary, {
			urlDesign,
			urlImplementation,
		});
	} finally {
		await Promise.all([pageDesign.close(), pageImpl.close()]);
	}
}
