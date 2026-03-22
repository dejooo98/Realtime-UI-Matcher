/**
 * Browser for Puppeteer captures.
 * - Local dev: full `puppeteer` (bundled Chromium) when installed.
 * - Serverless (e.g. Lambda): `puppeteer-core` + `@sparticuz/chromium`.
 */
import { isServerlessRuntime } from "./runtimeEnv.js";

const useServerlessChromium = () => isServerlessRuntime();

let browserPromise = null;

async function launchBrowser() {
	if (useServerlessChromium()) {
		const puppeteer = (await import("puppeteer-core")).default;
		const chromium = (await import("@sparticuz/chromium")).default;

		const executablePath = await chromium.executablePath();

		return puppeteer.launch({
			args: [
				...chromium.args,
				"--disable-dev-shm-usage",
				"--disable-blink-features=AutomationControlled",
			],
			defaultViewport: chromium.defaultViewport,
			executablePath,
			headless: chromium.headless,
		});
	}

	try {
		const puppeteer = (await import("puppeteer")).default;
		return puppeteer.launch({
			headless: true,
			args: [
				"--no-sandbox",
				"--disable-setuid-sandbox",
				"--disable-blink-features=AutomationControlled",
			],
		});
	} catch {
		const puppeteer = (await import("puppeteer-core")).default;
		const chromium = (await import("@sparticuz/chromium")).default;
		const executablePath = await chromium.executablePath();
		return puppeteer.launch({
			args: [
				...chromium.args,
				"--disable-dev-shm-usage",
				"--disable-blink-features=AutomationControlled",
			],
			defaultViewport: chromium.defaultViewport,
			executablePath,
			headless: chromium.headless,
		});
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
