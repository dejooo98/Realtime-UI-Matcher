import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import puppeteer from "puppeteer";

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

export function computeDiff(aInput, bInput, threshold = 0.1, sectionCount = 5) {
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

export async function screenshotUrl(url, width, maxHeight = 3000) {
	const browser = await puppeteer.launch({
		headless: "new",
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
	});

	try {
		const page = await browser.newPage();
		await page.setViewport({ width, height: 900 });
		await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

		const bodyHeight = await page.evaluate(
			() =>
				document.body.scrollHeight ||
				document.documentElement.scrollHeight ||
				900
		);

		await page.setViewport({
			width,
			height: Math.min(bodyHeight, maxHeight),
		});

		const buffer = await page.screenshot({
			fullPage: true,
			type: "png",
		});

		return buffer;
	} finally {
		await browser.close();
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

async function extractStylesFromPage(page) {
	return page.evaluate(() => {
		function getStyle(el) {
			if (!el) return null;
			const cs = window.getComputedStyle(el);
			return {
				fontSize: cs.fontSize,
				color: cs.color,
				backgroundColor: cs.backgroundColor,
				fontFamily: cs.fontFamily,
				fontWeight: cs.fontWeight,
				padding: cs.padding,
			};
		}

		const h1 = document.querySelector("h1");
		const primaryButton = document.querySelector("button, .btn, .btn-primary");

		return {
			h1: getStyle(h1),
			primaryButton: getStyle(primaryButton),
		};
	});
}

export async function analyzeStyleForUrls(urlDesign, urlImplementation, width) {
	const browser = await puppeteer.launch({
		headless: "new",
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
	});

	try {
		const pageDesign = await browser.newPage();
		const pageImpl = await browser.newPage();

		await pageDesign.setViewport({ width, height: 900 });
		await pageImpl.setViewport({ width, height: 900 });

		await Promise.all([
			pageDesign.goto(urlDesign, {
				waitUntil: "networkidle2",
				timeout: 60000,
			}),
			pageImpl.goto(urlImplementation, {
				waitUntil: "networkidle2",
				timeout: 60000,
			}),
		]);

		const [designStyles, implStyles] = await Promise.all([
			extractStylesFromPage(pageDesign),
			extractStylesFromPage(pageImpl),
		]);

		const checks = [];

		// H1 font-size
		checks.push({
			id: "h1-font-size",
			category: "Typography",
			label: "H1 font size",
			design: designStyles.h1?.fontSize ?? null,
			implementation: implStyles.h1?.fontSize ?? null,
			match:
				normalizePx(designStyles.h1?.fontSize) ===
				normalizePx(implStyles.h1?.fontSize),
		});

		// Primary button background
		checks.push({
			id: "primary-button-bg",
			category: "Buttons",
			label: "Primary button background",
			design: designStyles.primaryButton?.backgroundColor ?? null,
			implementation: implStyles.primaryButton?.backgroundColor ?? null,
			match:
				normalizeColorString(designStyles.primaryButton?.backgroundColor) ===
				normalizeColorString(implStyles.primaryButton?.backgroundColor),
		});

		return {
			design: designStyles,
			implementation: implStyles,
			checks,
		};
	} finally {
		await browser.close();
	}
}
