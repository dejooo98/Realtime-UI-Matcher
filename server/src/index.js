import express from "express";
import cors from "cors";
import multer from "multer";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import puppeteer from "puppeteer";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

/* ---------- Helpers ---------- */

function toPngBuffer(data) {
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

function computeDiff(aInput, bInput, threshold = 0.1) {
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

	return { width, height, diffPixels, totalPixels, matchScore, diffBuffer };
}

async function screenshotUrl(url, width, maxHeight = 3000) {
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

function parseViewportWidth(raw) {
	const width = parseInt(raw, 10);
	if (!width || width <= 0) {
		throw new Error("viewportWidth must be a positive number.");
	}
	return width;
}

function parseThreshold(raw) {
	const t = parseFloat(raw);
	return Number.isFinite(t) ? t : 0.1;
}

function sendDiffResponse(res, baseA, baseB, diffMeta) {
	const { width, height, diffPixels, totalPixels, matchScore, diffBuffer } =
		diffMeta;

	res.json({
		width,
		height,
		diffPixels,
		totalPixels,
		matchScore,
		designImage: `data:image/png;base64,${baseA.toString("base64")}`,
		screenshotImage: `data:image/png;base64,${baseB.toString("base64")}`,
		diffImage: `data:image/png;base64,${diffBuffer.toString("base64")}`,
	});
}

/* ---------- Routes ---------- */

app.get("/health", (req, res) => {
	res.json({ status: "ok" });
});

app.post("/api/compare", upload.single("design"), async (req, res) => {
	try {
		const { url, viewportWidth, threshold: thr } = req.body;
		const file = req.file;

		if (!url || !file || !viewportWidth) {
			return res.status(400).json({
				error: "url, viewportWidth and design PNG file are required.",
			});
		}

		const width = parseViewportWidth(viewportWidth);
		const threshold = parseThreshold(thr);

		const screenshotRaw = await screenshotUrl(url, width);

		const designBuf = toPngBuffer(file.buffer);
		const screenshotBuf = toPngBuffer(screenshotRaw);

		const diffMeta = computeDiff(designBuf, screenshotBuf, threshold);

		sendDiffResponse(res, designBuf, screenshotBuf, diffMeta);
	} catch (error) {
		console.error("Compare error:", error);
		const message =
			error.message === "viewportWidth must be a positive number."
				? error.message
				: "Error during comparison.";
		res.status(500).json({ error: message, details: error.message });
	}
});

app.post(
	"/api/compare-images",
	upload.fields([
		{ name: "design", maxCount: 1 },
		{ name: "implementation", maxCount: 1 },
	]),
	async (req, res) => {
		try {
			const designFile = req.files?.design?.[0];
			const implFile = req.files?.implementation?.[0];
			const threshold = parseThreshold(req.body.threshold);

			if (!designFile || !implFile) {
				return res.status(400).json({
					error: "Both design and implementation PNG files are required.",
				});
			}

			const designBuf = toPngBuffer(designFile.buffer);
			const implBuf = toPngBuffer(implFile.buffer);

			const diffMeta = computeDiff(designBuf, implBuf, threshold);

			sendDiffResponse(res, designBuf, implBuf, diffMeta);
		} catch (error) {
			console.error("Compare images error:", error);
			res.status(500).json({
				error: "Error during image comparison.",
				details: error.message,
			});
		}
	}
);

app.post("/api/compare-urls", async (req, res) => {
	try {
		const { urlA, urlB, viewportWidth, threshold: thr } = req.body;

		if (!urlA || !urlB || !viewportWidth) {
			return res
				.status(400)
				.json({ error: "urlA, urlB and viewportWidth are required." });
		}

		const width = parseViewportWidth(viewportWidth);
		const threshold = parseThreshold(thr);

		const screenshotRawA = await screenshotUrl(urlA, width);
		const screenshotRawB = await screenshotUrl(urlB, width);

		const bufA = toPngBuffer(screenshotRawA);
		const bufB = toPngBuffer(screenshotRawB);

		const diffMeta = computeDiff(bufA, bufB, threshold);

		sendDiffResponse(res, bufA, bufB, diffMeta);
	} catch (error) {
		console.error("Compare URLs error:", error);
		const message =
			error.message === "viewportWidth must be a positive number."
				? error.message
				: "Error during URL comparison.";
		res.status(500).json({
			error: message,
			details: error.message,
		});
	}
});

app.listen(port, () => {
	console.log(
		`Realtime UI Matcher server listening on http://localhost:${port}`
	);
});
