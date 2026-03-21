// app.js — Express app factory (used by node src/index.js and Netlify Functions)
import express from "express";
import cors from "cors";
import multer from "multer";
import rateLimit from "express-rate-limit";

import {
	toPngBuffer,
	computeDiff,
	screenshotUrl,
	parseViewportWidth,
	parseThreshold,
	analyzeStyleForUrls,
	buildStyleReportFromSummaries,
	clampPngMaxDimension,
} from "./helper.js";
import {
	parseCaptureOptions,
	parseViewportWidthsList,
} from "./captureOptions.js";
import { assertSafeUrl, UrlSafetyError } from "./urlSafety.js";
import { parseMaskRegions } from "./mask.js";
import { isServerlessRuntime } from "./runtimeEnv.js";

const isServerless = isServerlessRuntime();

/** Netlify Functions: smaller body + in-memory rate limit is per instance */
const jsonLimit = isServerless ? "256kb" : "512kb";
const uploadMaxBytes = isServerless ? 5 * 1024 * 1024 : 12 * 1024 * 1024;
const apiRateMax = isServerless
	? Number(process.env.API_RATE_LIMIT_MAX ?? 60)
	: Number(process.env.API_RATE_LIMIT_MAX ?? 120);

export function createApp() {
	const app = express();
	const serverStartedAt = Date.now();

	if (process.env.TRUST_PROXY === "1" || isServerless) {
		app.set("trust proxy", 1);
	}

	const corsOriginEnv = process.env.CORS_ORIGIN?.trim();
	if (corsOriginEnv) {
		const origins = corsOriginEnv.split(",").map((o) => o.trim()).filter(Boolean);
		app.use(
			cors({
				origin: origins.length === 1 ? origins[0] : origins,
			})
		);
	} else {
		app.use(cors());
	}

	app.use(express.json({ limit: jsonLimit }));

	const apiLimiter = rateLimit({
		windowMs: 15 * 60 * 1000,
		max: apiRateMax,
		standardHeaders: true,
		legacyHeaders: false,
	});
	app.use("/api", apiLimiter);

	const upload = multer({
		storage: multer.memoryStorage(),
		limits: { fileSize: uploadMaxBytes },
	});

	function sendDiffResponse(res, baseA, baseB, diffMeta, extra = {}) {
		const {
			width,
			height,
			diffPixels,
			totalPixels,
			matchScore,
			diffBuffer,
			sectionScores,
		} = diffMeta;

		const {
			clientEchoImages = false,
			clientEchoDesign = false,
			...restExtra
		} = extra;

		const body = {
			width,
			height,
			diffPixels,
			totalPixels,
			matchScore,
			sectionScores,
			diffImage: `data:image/png;base64,${diffBuffer.toString("base64")}`,
			...restExtra,
		};

		/* Serverless: keep JSON under ~6MB — omit PNGs the browser already has. */
		if (clientEchoImages) {
			body.clientEchoImages = true;
		} else if (clientEchoDesign) {
			body.clientEchoDesign = true;
			body.screenshotImage = `data:image/png;base64,${baseB.toString("base64")}`;
		} else {
			body.designImage = `data:image/png;base64,${baseA.toString("base64")}`;
			body.screenshotImage = `data:image/png;base64,${baseB.toString("base64")}`;
		}

		res.json(body);
	}

	function isViewportError(message) {
		return message === "viewportWidth must be a positive number.";
	}

	function handleRouteError(res, error, fallbackMessage) {
		if (error instanceof UrlSafetyError) {
			return res.status(400).json({
				error: error.message,
				details: error.message,
			});
		}
		if (
			typeof error?.message === "string" &&
			error.message.startsWith("Selector not found:")
		) {
			return res.status(400).json({
				error: error.message,
				details: error.message,
			});
		}
		if (isViewportError(error.message)) {
			return res.status(400).json({
				error: error.message,
				details: error.message,
			});
		}
		if (
			typeof error?.message === "string" &&
			error.message.startsWith("CAPTURE_")
		) {
			const colon = error.message.indexOf(":");
			const code =
				colon > 0 ? error.message.slice(0, colon) : "CAPTURE_UNKNOWN";
			const detail =
				colon > 0
					? error.message.slice(colon + 1).trim()
					: error.message;
			return res.status(422).json({
				error: "The page could not be captured for comparison.",
				details: detail,
				code,
			});
		}
		console.error(fallbackMessage, error);
		return res.status(500).json({
			error: fallbackMessage.replace(/\.$/, ""),
			details: error.message,
		});
	}

	app.get("/health", (req, res) => {
		res.json({
			status: "ok",
			service: "realtime-ui-matcher",
			uptimeSec: Math.floor((Date.now() - serverStartedAt) / 1000),
			env: process.env.NODE_ENV || "development",
			runtime: isServerless ? "serverless" : "node",
		});
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
			const capture = parseCaptureOptions(req.body);
			const maskRegions = parseMaskRegions(req.body.maskRegions);

			const safeUrl = await assertSafeUrl(url);
			const shot = await screenshotUrl(safeUrl, width, capture);

			let designBuf = toPngBuffer(file.buffer);
			if (isServerless) {
				designBuf = clampPngMaxDimension(designBuf);
			}
			const screenshotBuf = toPngBuffer(shot.buffer);

			const diffMeta = computeDiff(
				designBuf,
				screenshotBuf,
				threshold,
				5,
				maskRegions
			);

			const extra = {};
			if (shot.a11y) extra.a11y = { implementation: shot.a11y };
			if (isServerless) extra.clientEchoDesign = true;

			sendDiffResponse(res, designBuf, screenshotBuf, diffMeta, extra);
		} catch (error) {
			handleRouteError(res, error, "Error during comparison.");
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

				const maskRegions = parseMaskRegions(req.body.maskRegions);

				let designBuf = toPngBuffer(designFile.buffer);
				let implBuf = toPngBuffer(implFile.buffer);
				if (isServerless) {
					designBuf = clampPngMaxDimension(designBuf);
					implBuf = clampPngMaxDimension(implBuf);
				}

				const diffMeta = computeDiff(
					designBuf,
					implBuf,
					threshold,
					5,
					maskRegions
				);

				sendDiffResponse(res, designBuf, implBuf, diffMeta, {
					...(isServerless ? { clientEchoImages: true } : {}),
				});
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
			const capture = parseCaptureOptions(req.body);
			const maskRegions = parseMaskRegions(req.body.maskRegions);

			const [safeA, safeB] = await Promise.all([
				assertSafeUrl(urlA),
				assertSafeUrl(urlB),
			]);

			const [shotA, shotB] = await Promise.all([
				screenshotUrl(safeA, width, capture),
				screenshotUrl(safeB, width, capture),
			]);

			const bufA = toPngBuffer(shotA.buffer);
			const bufB = toPngBuffer(shotB.buffer);

			const diffMeta = computeDiff(bufA, bufB, threshold, 5, maskRegions);

			const extra = {};
			if (shotA.a11y || shotB.a11y) {
				extra.a11y = { urlA: shotA.a11y, urlB: shotB.a11y };
			}
			if (
				shotA.cssSummary &&
				shotB.cssSummary &&
				!shotA.cssSummary.error &&
				!shotB.cssSummary.error
			) {
				extra.styleReport = buildStyleReportFromSummaries(
					shotA.cssSummary,
					shotB.cssSummary,
					{ urlDesign: safeA, urlImplementation: safeB }
				);
			}

			sendDiffResponse(res, bufA, bufB, diffMeta, extra);
		} catch (error) {
			handleRouteError(res, error, "Error during URL comparison.");
		}
	});

	app.post("/api/compare-urls-batch", async (req, res) => {
		try {
			const { urlA, urlB, viewportWidths, threshold: thr } = req.body;

			if (!urlA || !urlB) {
				return res.status(400).json({
					error: "urlA and urlB are required.",
				});
			}

			const widthsList = parseViewportWidthsList(viewportWidths);
			if (!widthsList?.length) {
				return res.status(400).json({
					error:
						"viewportWidths must be a non-empty JSON array of widths (e.g. [1440,768]).",
				});
			}

			const threshold = parseThreshold(thr);
			const capture = parseCaptureOptions(req.body);
			const maskRegions = parseMaskRegions(req.body.maskRegions);

			const [safeA, safeB] = await Promise.all([
				assertSafeUrl(urlA),
				assertSafeUrl(urlB),
			]);

			const results = [];
			let batchStyleReport = null;

			for (let i = 0; i < widthsList.length; i++) {
				const w = widthsList[i];
				const width = parseViewportWidth(String(w));
				const captureForRow =
					i === 0 && capture.includeCssSummary
						? capture
						: { ...capture, includeCssSummary: false };
				const [shotA, shotB] = await Promise.all([
					screenshotUrl(safeA, width, captureForRow),
					screenshotUrl(safeB, width, captureForRow),
				]);

				const bufA = toPngBuffer(shotA.buffer);
				const bufB = toPngBuffer(shotB.buffer);

				const diffMeta = computeDiff(bufA, bufB, threshold, 5, maskRegions);

				const row = {
					viewportWidth: width,
					width: diffMeta.width,
					height: diffMeta.height,
					diffPixels: diffMeta.diffPixels,
					totalPixels: diffMeta.totalPixels,
					matchScore: diffMeta.matchScore,
					sectionScores: diffMeta.sectionScores,
					designImage: `data:image/png;base64,${bufA.toString("base64")}`,
					screenshotImage: `data:image/png;base64,${bufB.toString("base64")}`,
					diffImage: `data:image/png;base64,${diffMeta.diffBuffer.toString("base64")}`,
				};

				if (shotA.a11y || shotB.a11y) {
					row.a11y = { urlA: shotA.a11y, urlB: shotB.a11y };
				}

				if (
					i === 0 &&
					shotA.cssSummary &&
					shotB.cssSummary &&
					!shotA.cssSummary.error &&
					!shotB.cssSummary.error
				) {
					batchStyleReport = buildStyleReportFromSummaries(
						shotA.cssSummary,
						shotB.cssSummary,
						{ urlDesign: safeA, urlImplementation: safeB }
					);
				}

				results.push(row);
			}

			res.json({
				results,
				...(batchStyleReport ? { styleReport: batchStyleReport } : {}),
			});
		} catch (error) {
			handleRouteError(res, error, "Error during batch URL comparison.");
		}
	});

	app.post("/api/analyze-style", async (req, res) => {
		try {
			const { urlDesign, urlImplementation, viewportWidth } = req.body;

			if (!urlDesign || !urlImplementation || !viewportWidth) {
				return res.status(400).json({
					error: "urlDesign, urlImplementation and viewportWidth are required.",
				});
			}

			const width = parseViewportWidth(viewportWidth);
			const capture = parseCaptureOptions(req.body);

			const [safeDesign, safeImpl] = await Promise.all([
				assertSafeUrl(urlDesign),
				assertSafeUrl(urlImplementation),
			]);

			const analysis = await analyzeStyleForUrls(
				safeDesign,
				safeImpl,
				width,
				capture
			);

			res.json(analysis);
		} catch (error) {
			handleRouteError(res, error, "Error during style analysis.");
		}
	});

	return app;
}
