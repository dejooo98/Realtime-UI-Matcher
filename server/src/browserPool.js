/**
 * Browser for Puppeteer captures.
 * - Local dev: full `puppeteer` (bundled Chromium) when installed.
 * - Serverless, Render native, or fallback: `puppeteer-core` + `@sparticuz/chromium`.
 *
 * Do not set PUPPETEER_EXECUTABLE_PATH to /usr/bin/chromium on Render — that path
 * does not exist. When using Sparticuz we temporarily clear that env so Puppeteer
 * uses the bundled binary.
 */
import { isServerlessRuntime } from "./runtimeEnv.js";

const useServerlessChromium = () => isServerlessRuntime();

/** Render Web Services are long-lived Linux hosts without a system Chromium package. */
const useRenderNativeRuntime = () => process.env.RENDER === "true";

let browserPromise = null;

const CHROME_OVERRIDE_ENVS = [
	"PUPPETEER_EXECUTABLE_PATH",
	"CHROME_PATH",
	"GOOGLE_CHROME_BIN",
];

async function withClearedChromeOverrideEnvs(fn) {
	const saved = {};
	for (const k of CHROME_OVERRIDE_ENVS) {
		if (process.env[k] !== undefined) {
			saved[k] = process.env[k];
			delete process.env[k];
		}
	}
	try {
		return await fn();
	} finally {
		for (const [k, v] of Object.entries(saved)) {
			process.env[k] = v;
		}
	}
}

async function launchSparticuzChromium() {
	const puppeteer = (await import("puppeteer-core")).default;
	const chromium = (await import("@sparticuz/chromium")).default;
	const executablePath = await chromium.executablePath();
	return withClearedChromeOverrideEnvs(() =>
		puppeteer.launch({
			args: [
				...chromium.args,
				"--disable-dev-shm-usage",
				"--disable-blink-features=AutomationControlled",
			],
			defaultViewport: chromium.defaultViewport,
			executablePath,
			headless: chromium.headless,
		})
	);
}

async function launchBrowser() {
	if (useServerlessChromium() || useRenderNativeRuntime()) {
		return launchSparticuzChromium();
	}

	try {
		const puppeteer = (await import("puppeteer")).default;
		return await puppeteer.launch({
			headless: true,
			args: [
				"--no-sandbox",
				"--disable-setuid-sandbox",
				"--disable-blink-features=AutomationControlled",
			],
		});
	} catch {
		return launchSparticuzChromium();
	}
}

export async function getBrowser() {
	if (!browserPromise) {
		browserPromise = launchBrowser().catch((err) => {
			browserPromise = null;
			throw err;
		});
	}
	return browserPromise;
}

export async function closeBrowser() {
	if (!browserPromise) return;
	try {
		const browser = await browserPromise;
		await browser.close();
	} catch {
		/* ignore */
	} finally {
		browserPromise = null;
	}
}

function shutdown() {
	closeBrowser().finally(() => process.exit(0));
}

if (!useServerlessChromium()) {
	process.once("SIGINT", shutdown);
	process.once("SIGTERM", shutdown);
}
