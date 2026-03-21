/**
 * Netlify / Lambda may send multipart bodies base64-encoded with a wrong
 * `isBase64Encoded` flag. serverless-http then decodes with utf8 and multer
 * sees no files → 400. Normalize the flag when the decoded bytes don't contain
 * the multipart boundary but the alternate decoding does.
 */

function getHeader(event, name) {
	const h = event.headers || {};
	const lower = name.toLowerCase();
	return h[lower] ?? h[name];
}

function extractMultipartBoundary(contentType) {
	const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || "");
	return m ? (m[1] || m[2]).trim() : null;
}

function multipartBodyLooksValid(buffer, boundary) {
	if (!boundary || buffer.length < 4) return false;
	const needle = Buffer.from(`--${boundary}`);
	if (buffer.length < needle.length) return false;
	const slice = buffer.subarray(0, Math.min(buffer.length, 65536));
	return slice.indexOf(needle) !== -1;
}

/**
 * @param {object} event - Lambda / Netlify handler event
 */
export function fixMultipartLambdaEvent(event) {
	if (!event || typeof event.body !== "string") return event;
	const ct = getHeader(event, "content-type");
	if (!ct || !/multipart\/form-data/i.test(ct)) return event;
	const boundary = extractMultipartBoundary(ct);
	if (!boundary) return event;

	const primary = Buffer.from(
		event.body,
		event.isBase64Encoded ? "base64" : "utf8"
	);
	if (multipartBodyLooksValid(primary, boundary)) return event;

	try {
		const alt = Buffer.from(
			event.body,
			event.isBase64Encoded ? "utf8" : "base64"
		);
		if (multipartBodyLooksValid(alt, boundary)) {
			return { ...event, isBase64Encoded: !event.isBase64Encoded };
		}
	} catch {
		/* ignore */
	}
	return event;
}
