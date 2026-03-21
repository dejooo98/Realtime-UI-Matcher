import { useEffect, useState } from "react";
import OverlayViewer from "./OverlayViewer";
import PixelMeasureTool from "./PixelMeasureTool";

export default function VisualDiffTabs({
	designSrc,
	implementationSrc,
	diffSrc,
}) {
	const [mode, setMode] = useState("overlay"); // overlay | heatmap | sidebyside
	const [zoom, setZoom] = useState(1);
	const [opacity, setOpacity] = useState(0.6);

	useEffect(() => {
		const onKey = (e) => {
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement ||
				e.target instanceof HTMLSelectElement ||
				(e.target instanceof HTMLElement && e.target.isContentEditable)
			) {
				return;
			}
			if (e.key === "1") setMode("overlay");
			if (e.key === "2") setMode("heatmap");
			if (e.key === "3") setMode("sidebyside");
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	return (
		<section className="card card-results-visual">
			<div className="visual-header">
				<div>
					<h2>Visual inspection</h2>
					<p className="card-subtitle">
						Overlay (wipe or blend), diff heatmap, or side-by-side. Shortcuts:{" "}
						<kbd className="kbd">1</kbd> overlay · <kbd className="kbd">2</kbd>{" "}
						heatmap · <kbd className="kbd">3</kbd> side by side.
					</p>
				</div>

				<div className="visual-tabs" role="tablist" aria-label="Visual compare mode">
					<button
						type="button"
						role="tab"
						aria-selected={mode === "overlay"}
						className={
							"visual-tab-btn " +
							(mode === "overlay" ? "visual-tab-btn-active" : "")
						}
						onClick={() => setMode("overlay")}
					>
						Overlay
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={mode === "heatmap"}
						className={
							"visual-tab-btn " +
							(mode === "heatmap" ? "visual-tab-btn-active" : "")
						}
						onClick={() => setMode("heatmap")}
					>
						Diff heatmap
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={mode === "sidebyside"}
						className={
							"visual-tab-btn " +
							(mode === "sidebyside" ? "visual-tab-btn-active" : "")
						}
						onClick={() => setMode("sidebyside")}
					>
						Side by side
					</button>
				</div>
			</div>

			{mode === "overlay" ? (
				<OverlayViewer designSrc={designSrc} liveSrc={implementationSrc} />
			) : mode === "heatmap" ? (
				<div className="heatmap-wrapper">
					<div className="heatmap-toolbar">
						<span className="heatmap-label">Zoom</span>
						<input
							className="heatmap-zoom-slider"
							type="range"
							min="0.5"
							max="2"
							step="0.1"
							value={zoom}
							onChange={(e) => setZoom(parseFloat(e.target.value))}
						/>
						<span className="heatmap-zoom-value">
							{Math.round(zoom * 100)}%
						</span>

						<div className="heatmap-divider" />

						<span className="heatmap-label">Diff intensity</span>
						<input
							className="heatmap-opacity-slider"
							type="range"
							min="0"
							max="1"
							step="0.05"
							value={opacity}
							onChange={(e) => setOpacity(parseFloat(e.target.value))}
						/>
						<span className="heatmap-zoom-value">
							{Math.round(opacity * 100)}%
						</span>
					</div>

					<div className="heatmap-frame">
						<PixelMeasureTool
							stageClassName="heatmap-inner"
							stageStyle={{ transform: `scale(${zoom})` }}
						>
							<img
								src={implementationSrc}
								alt="Implementation"
								className="heatmap-img-base"
							/>
							<img
								src={diffSrc}
								alt="Diff heatmap"
								className="heatmap-img-mask"
								style={{ opacity }}
							/>
						</PixelMeasureTool>
					</div>

					<p className="hint-text">
						The red layer shows pixels that differ from the design. Zoom and scroll
						to inspect layout, typography, or spacing. With zoom ≠ 100%, ruler
						readings are still scaled to source pixels when possible.
					</p>
				</div>
			) : (
				<div className="sidebyside-wrapper">
					<p className="hint-text sidebyside-lead">
						Pixelay-style side-by-side: design and implementation at the same scale
						for quick scanning.
					</p>
					<div className="sidebyside-grid">
						<figure className="sidebyside-figure">
							<figcaption className="sidebyside-caption">Design</figcaption>
							<div className="sidebyside-frame">
								<img src={designSrc} alt="Design" className="sidebyside-img" />
							</div>
						</figure>
						<figure className="sidebyside-figure">
							<figcaption className="sidebyside-caption">Live / implementation</figcaption>
							<div className="sidebyside-frame">
								<img
									src={implementationSrc}
									alt="Implementation"
									className="sidebyside-img"
								/>
							</div>
						</figure>
					</div>
				</div>
			)}
		</section>
	);
}
