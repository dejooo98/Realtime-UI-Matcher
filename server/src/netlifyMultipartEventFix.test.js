import { describe, expect, it } from "vitest";
import { fixMultipartLambdaEvent } from "./netlifyMultipartEventFix.js";

describe("fixMultipartLambdaEvent", () => {
	const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
	const rawMultipart = `--${boundary}\r\nContent-Disposition: form-data; name="x"\r\n\r\n1\r\n--${boundary}--\r\n`;
	const bodyAsB64 = Buffer.from(rawMultipart, "utf8").toString("base64");

	it("leaves event unchanged when multipart decodes correctly as utf8", () => {
		const event = {
			body: rawMultipart,
			isBase64Encoded: false,
			headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
		};
		expect(fixMultipartLambdaEvent(event)).toBe(event);
	});

	it("flips isBase64Encoded when body is base64 but flag is false", () => {
		const event = {
			body: bodyAsB64,
			isBase64Encoded: false,
			headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
		};
		const fixed = fixMultipartLambdaEvent(event);
		expect(fixed).not.toBe(event);
		expect(fixed.isBase64Encoded).toBe(true);
		expect(
			Buffer.from(fixed.body, "base64").toString("utf8")
		).toContain(`--${boundary}`);
	});

	it("returns non-multipart events unchanged", () => {
		const event = { body: "{}", isBase64Encoded: false, headers: {} };
		expect(fixMultipartLambdaEvent(event)).toBe(event);
	});
});
