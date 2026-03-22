/**
 * @param {File} file
 * @returns {Promise<string>}
 */
export function readFileAsDataUrl(file) {
	return new Promise((resolve, reject) => {
		const r = new FileReader();
		r.onload = () => resolve(String(r.result));
		r.onerror = () => reject(r.error ?? new Error("Failed to read file"));
		r.readAsDataURL(file);
	});
}

/**
 * Downscale large PNG uploads so multipart bodies stay under typical host (~6MB) limits.
 * @param {File} file
 * @param {number} [maxDimension]
 * @returns {Promise<File>}
 */
export async function resizePngFileToMaxDimension(file, maxDimension = 1280) {
	if (!(file instanceof File)) {
		return file;
	}
	let bitmap;
	try {
		bitmap = await createImageBitmap(file);
	} catch {
		return file;
	}
	const { width, height } = bitmap;
	if (width <= maxDimension && height <= maxDimension) {
		bitmap.close();
		return file;
	}
	const scale = Math.min(maxDimension / width, maxDimension / height);
	const w = Math.max(1, Math.round(width * scale));
	const h = Math.max(1, Math.round(height * scale));
	const canvas = document.createElement("canvas");
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		bitmap.close();
		return file;
	}
	ctx.drawImage(bitmap, 0, 0, w, h);
	bitmap.close();
	const blob = await new Promise((resolve) => {
		canvas.toBlob((b) => resolve(b), "image/png");
	});
	if (!blob) {
		return file;
	}
	const baseName = file.name.replace(/\.png$/i, "") || "image";
	return new File([blob], `${baseName}.png`, { type: "image/png" });
}
