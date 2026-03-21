import clsx from "clsx";

/**
 * Shared “How to use” copy — compact in sidebar, full width when needed.
 */
export default function HowToUseCard({ className = "" }) {
	return (
		<section
			className={clsx(
				"card card-hint card-hint-premium howto-use-card",
				className
			)}
		>
			<h2 className="howto-use-card-title">How to use</h2>
			<p className="card-subtitle howto-use-card-lead">
				Pick the mode that matches what you have and follow the steps below.
			</p>

			<ul className="howto-list">
				<li>
					<strong>Design vs URL.</strong> You have a static design image and a live
					page. Export the design as PNG at the target viewport, upload it as the
					design file, then enter the implementation URL.
				</li>
				<li>
					<strong>Image vs Image.</strong> You have two PNGs with the same
					dimensions. One from Figma or your design tool, one full-page screenshot
					from the browser. Upload both and compare them directly.
				</li>
				<li>
					<strong>URL vs URL.</strong> Two browser URLs (e.g. Figma prototype and
					staging). Paste URLs and choose staging/production pairs; viewport and
					batch widths live in Settings.
				</li>
			</ul>

			<p className="howto-tip">
				Tip. For reliable results, always keep the same viewport width and avoid
				animated content while capturing screenshots.
			</p>
		</section>
	);
}
