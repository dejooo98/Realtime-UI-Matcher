import React, { useState } from "react";
import OverlayViewer from "./OverlayViewer";

export default function VisualDiffTabs({
	designSrc,
	implementationSrc,
	diffSrc,
}) {
	const [mode, setMode] = useState("overlay"); // "overlay" or "heatmap"
	const [zoom, setZoom] = useState(1);
	const [opacity, setOpacity] = useState(0.6);

	return (
		<section className="card card-results-visual">
			<div className="visual-header">
				<div>
					<h2>Visual inspection</h2>
					<p className="card-subtitle">
						Compare design and implementation visually. Use the split overlay or
						a heatmap that highlights only the pixels that differ.
					</p>
				</div>

				<div className="visual-tabs">
					<button
						type="button"
						className={
							"visual-tab-btn " +
							(mode === "overlay" ? "visual-tab-btn-active" : "")
						}
						onClick={() => setMode("overlay")}
					>
						Overlay slider
					</button>
					<button
						type="button"
						className={
							"visual-tab-btn " +
							(mode === "heatmap" ? "visual-tab-btn-active" : "")
						}
						onClick={() => setMode("heatmap")}
					>
						Diff heatmap
					</button>
				</div>
			</div>

			{mode === "overlay" ? (
				<OverlayViewer designSrc={designSrc} liveSrc={implementationSrc} />
			) : (
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
						<div
							className="heatmap-inner"
							style={{ transform: `scale(${zoom})` }}
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
						</div>
					</div>

					<p className="hint-text">
						The red layer shows only pixels that differ from the design. Zoom
						and scroll to locate specific layout, typography or spacing
						regressions.
					</p>
				</div>
			)}
		</section>
	);
}
