import { describe, expect, it } from "vitest";
import { assertSafeUrl, UrlSafetyError } from "./urlSafety.js";

describe("assertSafeUrl", () => {
	it("rejects non-http(s) schemes", async () => {
		await expect(assertSafeUrl("file:///etc/passwd")).rejects.toThrow(
			UrlSafetyError
		);
		await expect(assertSafeUrl("javascript:alert(1)")).rejects.toThrow(
			UrlSafetyError
		);
	});

	it("rejects embedded credentials", async () => {
		await expect(
			assertSafeUrl("https://user:pass@example.com/")
		).rejects.toThrow(UrlSafetyError);
	});

	it("rejects localhost hostname", async () => {
		await expect(assertSafeUrl("http://localhost:3000/")).rejects.toThrow(
			UrlSafetyError
		);
	});

	it("rejects private IPv4 literals", async () => {
		await expect(assertSafeUrl("http://127.0.0.1/")).rejects.toThrow(
			UrlSafetyError
		);
		await expect(assertSafeUrl("http://10.0.0.1/")).rejects.toThrow(
			UrlSafetyError
		);
		await expect(assertSafeUrl("http://192.168.0.1/")).rejects.toThrow(
			UrlSafetyError
		);
	});

	it("returns trimmed URL for safe public https URL", async () => {
		const u = await assertSafeUrl("  https://example.com/path  ");
		expect(u).toBe("https://example.com/path");
	});
});
