/**
 * Full-window blocking overlay while a comparison request is in flight.
 */
export default function ComparisonLoadingOverlay({ visible, mode }) {
	if (!visible) return null;

	const copy = {
		"url-url": {
			title: "Running URL vs URL comparison",
			body: "Opening both pages in the browser, capturing screenshots, then computing the pixel diff. Large pages or Figma can take up to a minute — please wait.",
		},
		"design-url": {
			title: "Running Design vs URL comparison",
			body: "Uploading your design image, capturing the live page, then diffing pixels.",
		},
		"image-image": {
			title: "Running image vs image comparison",
			body: "Reading both images and computing the diff.",
		},
	};

	const { title, body } = copy[mode] ?? {
		title: "Running comparison",
		body: "Please wait — this may take up to a minute for slow pages.",
	};

	return (
		<div
			className="rum-loading-overlay"
			role="status"
			aria-live="polite"
			aria-busy="true"
			aria-label="Comparison in progress"
		>
			<div className="rum-loading-backdrop" aria-hidden />
			<div className="rum-loading-card">
				<div className="rum-loading-spinner" aria-hidden />
				<p className="rum-loading-title">{title}</p>
				<p className="rum-loading-body">{body}</p>
			</div>
		</div>
	);
}
