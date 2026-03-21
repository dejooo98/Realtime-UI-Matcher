import {
	endpoints,
	postFormData,
	postJson,
	postJsonIfOk,
} from "./api.js";
import {
	readFileAsDataUrl,
	resizePngFileToMaxDimension,
} from "./imageResize.js";

function thresholdFromStrictness(level) {
	if (level === "high") return 0.05;
	if (level === "low") return 0.2;
	return 0.1;
}

function buildCaptureJsonBody(captureOptions) {
	const body = {
		waitUntil: captureOptions.waitUntil,
		postDelayMs: captureOptions.postDelayMs,
		navTimeoutSec: captureOptions.navTimeoutSec,
		maxCaptureHeight: captureOptions.maxCaptureHeight,
		disableAnimations: captureOptions.disableAnimations,
		includeA11y: captureOptions.includeA11y,
		includeCssSummary: Boolean(captureOptions.includeCssSummary),
		useFigmaEmbed: Boolean(captureOptions.useFigmaEmbed),
	};
	if (captureOptions.selector?.trim()) {
		body.selector = captureOptions.selector.trim();
	}
	if (captureOptions.maskRegionsJson?.trim()) {
		body.maskRegions = captureOptions.maskRegionsJson.trim();
	}
	return body;
}

/**
 * Runs one comparison request (all modes). Returns raw API JSON + optional style analysis.
 * @param {{
 *   mode: string,
 *   strictness: string,
 *   captureOptions: object,
 *   designFile: File | null,
 *   implFile: File | null,
 *   url: string,
 *   designUrl: string,
 *   implUrl: string,
 *   viewportWidth: string,
 * }} input
 */
export async function runComparison(input) {
	const {
		mode,
		strictness,
		captureOptions,
		designFile,
		implFile,
		url,
		designUrl,
		implUrl,
		viewportWidth,
	} = input;

	const threshold = thresholdFromStrictness(strictness);
	let data;
	let styleResult = null;

	if (mode === "design-url") {
		const formData = new FormData();
		const design = await resizePngFileToMaxDimension(designFile);
		formData.append("design", design);
		formData.append("url", url.trim());
		formData.append("viewportWidth", viewportWidth);
		formData.append("threshold", String(threshold));
		formData.append("waitUntil", captureOptions.waitUntil);
		formData.append("postDelayMs", String(captureOptions.postDelayMs));
		formData.append("navTimeoutSec", String(captureOptions.navTimeoutSec));
		formData.append(
			"maxCaptureHeight",
			String(captureOptions.maxCaptureHeight)
		);
		formData.append(
			"disableAnimations",
			String(captureOptions.disableAnimations)
		);
		formData.append("includeA11y", String(captureOptions.includeA11y));
		if (captureOptions.selector?.trim()) {
			formData.append("selector", captureOptions.selector.trim());
		}
		if (captureOptions.maskRegionsJson?.trim()) {
			formData.append("maskRegions", captureOptions.maskRegionsJson.trim());
		}

		data = await postFormData(endpoints.compare(), formData);
		if (data.clientEchoDesign) {
			data.designImage = await readFileAsDataUrl(design);
		}
	} else if (mode === "image-image") {
		const formData = new FormData();
		const design = await resizePngFileToMaxDimension(designFile);
		const implementation = await resizePngFileToMaxDimension(implFile);
		formData.append("design", design);
		formData.append("implementation", implementation);
		formData.append("threshold", String(threshold));
		if (captureOptions.maskRegionsJson?.trim()) {
			formData.append("maskRegions", captureOptions.maskRegionsJson.trim());
		}

		data = await postFormData(endpoints.compareImages(), formData);
		if (data.clientEchoImages) {
			data.designImage = await readFileAsDataUrl(design);
			data.screenshotImage = await readFileAsDataUrl(implementation);
		}
	} else if (mode === "url-url") {
		const captureBody = buildCaptureJsonBody(captureOptions);

		if (captureOptions.urlMultiViewport) {
			const widths = JSON.parse(captureOptions.viewportWidthsJson);
			data = await postJson(endpoints.compareUrlsBatch(), {
				urlA: designUrl.trim(),
				urlB: implUrl.trim(),
				viewportWidths: widths,
				threshold,
				...captureBody,
			});
		} else {
			data = await postJson(endpoints.compareUrls(), {
				urlA: designUrl.trim(),
				urlB: implUrl.trim(),
				viewportWidth,
				threshold,
				...captureBody,
			});
		}

		let styleVp = viewportWidth;
		if (captureOptions.urlMultiViewport) {
			try {
				const arr = JSON.parse(captureOptions.viewportWidthsJson || "[]");
				if (Array.isArray(arr) && arr.length > 0) {
					styleVp = String(arr[0]);
				}
			} catch {
				/* keep */
			}
		}

		styleResult = data.styleReport ?? null;
		if (!styleResult) {
			styleResult = await postJsonIfOk(endpoints.analyzeStyle(), {
				urlDesign: designUrl.trim(),
				urlImplementation: implUrl.trim(),
				viewportWidth: styleVp,
				waitUntil: captureOptions.waitUntil,
				postDelayMs: captureOptions.postDelayMs,
				navTimeoutSec: captureOptions.navTimeoutSec,
				disableAnimations: captureOptions.disableAnimations,
				includeCssSummary: Boolean(captureOptions.includeCssSummary),
				useFigmaEmbed: Boolean(captureOptions.useFigmaEmbed),
			});
		}
	} else {
		throw new Error("Unknown comparison mode.");
	}

	return { data, styleResult };
}
