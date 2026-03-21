/**
 * Normalized rectangles: x, y, width, height in 0–1 relative to image size.
 * Pixels inside each region are copied from A onto B so they match (ignored in diff).
 * @param {PNG} pngA
 * @param {PNG} pngB
 * @param {Array<{ x: number; y: number; width: number; height: number }>} regions
 */
export function applyMaskRegions(pngA, pngB, regions) {
	if (!regions?.length) return;
	const { width, height } = pngA;
	for (const r of regions) {
		const x0 = Math.max(0, Math.floor(r.x * width));
		const y0 = Math.max(0, Math.floor(r.y * height));
		const x1 = Math.min(width, Math.ceil((r.x + r.width) * width));
		const y1 = Math.min(height, Math.ceil((r.y + r.height) * height));
		for (let y = y0; y < y1; y++) {
			for (let x = x0; x < x1; x++) {
				const idx = (width * y + x) * 4;
				pngB.data[idx] = pngA.data[idx];
				pngB.data[idx + 1] = pngA.data[idx + 1];
				pngB.data[idx + 2] = pngA.data[idx + 2];
				pngB.data[idx + 3] = pngA.data[idx + 3];
			}
		}
	}
}

/**
 * @param {unknown} raw — JSON string or parsed array
 * @returns {Array<{ x: number; y: number; width: number; height: number }>}
 */
export function parseMaskRegions(raw) {
	if (raw == null || raw === "") return [];
	let j;
	try {
		j = typeof raw === "string" ? JSON.parse(raw) : raw;
	} catch {
		return [];
	}
	if (!Array.isArray(j)) return [];
	const out = [];
	for (const r of j) {
		if (
			typeof r !== "object" ||
			r == null ||
			typeof r.x !== "number" ||
			typeof r.y !== "number" ||
			typeof r.width !== "number" ||
			typeof r.height !== "number"
		) {
			continue;
		}
		if (
			r.width <= 0 ||
			r.height <= 0 ||
			r.x < 0 ||
			r.y < 0 ||
			r.x + r.width > 1.001 ||
			r.y + r.height > 1.001
		) {
			continue;
		}
		out.push({
			x: r.x,
			y: r.y,
			width: r.width,
			height: r.height,
		});
		if (out.length >= 20) break;
	}
	return out;
}
