import { describe, expect, it } from "vitest";
import {
	isFigmaUrl,
	resolveFigmaCaptureUrl,
	figmaUrlMeta,
} from "./figmaUrl.js";

describe("figmaUrl", () => {
	it("detects figma hosts", () => {
		expect(isFigmaUrl("https://www.figma.com/proto/x/y")).toBe(true);
		expect(isFigmaUrl("https://figma.com/file/x")).toBe(true);
		expect(isFigmaUrl("https://example.com")).toBe(false);
	});

	it("forces https when normalizing", () => {
		const out = resolveFigmaCaptureUrl("http://www.figma.com/proto/a/b", {});
		expect(out).toMatch(/^https:/);
	});

	it("embed mode wraps in figma embed", () => {
		const u = "https://www.figma.com/design/ABC/Name?node-id=1-2";
		const out = resolveFigmaCaptureUrl(u, { useEmbed: true });
		expect(out).toContain("figma.com/embed");
		expect(out).toContain("url=");
	});

	it("figmaUrlMeta reads node-id", () => {
		const m = figmaUrlMeta(
			"https://www.figma.com/design/x/y?node-id=12-34"
		);
		expect(m.isFigma).toBe(true);
		expect(m.nodeId).toBe("12-34");
		expect(m.kind).toBe("design");
	});

	it("resolveFigmaCaptureUrl strips tracking param t", () => {
		const u =
			"https://www.figma.com/design/ABC/Name?node-id=1-2&t=abc123";
		const out = resolveFigmaCaptureUrl(u, {});
		expect(out).not.toContain("t=");
		expect(out).toContain("node-id=1-2");
	});
});
