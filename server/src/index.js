// index.js
import express from "express";
import cors from "cors";
import multer from "multer";

import {
	toPngBuffer,
	computeDiff,
	screenshotUrl,
	parseViewportWidth,
	parseThreshold,
	analyzeStyleForUrls,
} from "./helper.js";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

/* ---------- Shared response helper ---------- */

function sendDiffResponse(res, baseA, baseB, diffMeta) {
	const {
		width,
		height,
		diffPixels,
		totalPixels,
		matchScore,
		diffBuffer,
		sectionScores,
	} = diffMeta;

	res.json({
		width,
		height,
		diffPixels,
		totalPixels,
		matchScore,
		sectionScores,
		designImage: `data:image/png;base64,${baseA.toString("base64")}`,
		screenshotImage: `data:image/png;base64,${baseB.toString("base64")}`,
		diffImage: `data:image/png;base64,${diffBuffer.toString("base64")}`,
	});
}

/* ---------- Routes ---------- */

app.get("/health", (req, res) => {
	res.json({ status: "ok" });
});

/**
 * Design vs URL
 */
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

/**
 * Image vs Image
 */
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

/**
 * URL vs URL
 */
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

/**
 * Style analysis (URL design vs URL implementation)
 */
app.post("/api/analyze-style", async (req, res) => {
	try {
		const { urlDesign, urlImplementation, viewportWidth } = req.body;

		if (!urlDesign || !urlImplementation || !viewportWidth) {
			return res.status(400).json({
				error: "urlDesign, urlImplementation and viewportWidth are required.",
			});
		}

		const width = parseViewportWidth(viewportWidth);

		const analysis = await analyzeStyleForUrls(
			urlDesign,
			urlImplementation,
			width
		);

		res.json(analysis);
	} catch (error) {
		console.error("Analyze style error:", error);
		const message =
			error.message === "viewportWidth must be a positive number."
				? error.message
				: "Error during style analysis.";
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
