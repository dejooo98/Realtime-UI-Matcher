import { describe, expect, it } from "vitest";
import { ApiError, formatErrorForAlert, formatUserFacingError } from "./api.js";

describe("formatErrorForAlert", () => {
	it("splits ApiError into title and detail when details differ", () => {
		const err = new ApiError("Error during comparison.", {
			details: "Navigation timeout",
		});
		expect(formatErrorForAlert(err)).toEqual({
			title: "Error during comparison.",
			detail: "Navigation timeout",
		});
	});

	it("omits detail when same as title", () => {
		const err = new ApiError("Same text", { details: "Same text" });
		expect(formatErrorForAlert(err)).toEqual({ title: "Same text" });
	});

	it("handles ApiError without details", () => {
		const err = new ApiError("Only message");
		expect(formatErrorForAlert(err)).toEqual({ title: "Only message" });
	});

	it("handles plain Error", () => {
		expect(formatErrorForAlert(new Error("plain"))).toEqual({
			title: "plain",
		});
	});

	it("stringifies unknown values", () => {
		expect(formatErrorForAlert(42)).toEqual({ title: "42" });
	});
});

describe("formatUserFacingError", () => {
	it("joins ApiError message and distinct details on separate lines", () => {
		const err = new ApiError("Error during comparison.", {
			details: "Navigation timeout",
		});
		expect(formatUserFacingError(err)).toBe(
			"Error during comparison.\nNavigation timeout"
		);
	});

	it("does not duplicate when details equals message", () => {
		const err = new ApiError("Same text", { details: "Same text" });
		expect(formatUserFacingError(err)).toBe("Same text");
	});

	it("handles ApiError without details", () => {
		const err = new ApiError("Only message");
		expect(formatUserFacingError(err)).toBe("Only message");
	});

	it("handles plain Error", () => {
		expect(formatUserFacingError(new Error("plain"))).toBe("plain");
	});

	it("stringifies unknown values", () => {
		expect(formatUserFacingError(42)).toBe("42");
	});
});
