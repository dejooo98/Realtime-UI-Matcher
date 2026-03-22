/**
 * Full-window blocking overlay while a comparison request is in flight.
 */
export default function ComparisonLoadingOverlay({ visible, mode }) {
	if (!visible) return null;

	const copy = {
		"url-url": {
			title: "Running URL vs URL comparison",
			body: "Opening both pages, capturing screenshots, then diffing. Image-only compares stay fast; live URLs depend on the site and host — often 30s–3min on a cold server or slow WordPress.",
		},
		"design-url": {
			title: "Running Design vs URL comparison",
			body: "Capturing the live URL then diffing against your PNG. Usually slower than image vs image — allow up to a few minutes on heavy pages or right after the API wakes from idle.",
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
