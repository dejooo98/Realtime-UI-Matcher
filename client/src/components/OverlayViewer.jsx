import { useState } from "react";
import PixelMeasureTool from "./PixelMeasureTool";

/** @typedef {'wipe' | 'blend'} OverlayCompareMode */

export default function OverlayViewer({ designSrc, liveSrc }) {
	const [compareMode, setCompareMode] = useState(
		/** @type {OverlayCompareMode} */ ("wipe")
	);
	const [position, setPosition] = useState(50);
	const [blendOpacity, setBlendOpacity] = useState(50);

	if (!designSrc || !liveSrc) return null;

	const wipeDesc =
		"Vertical wipe: drag the slider to reveal design on the left and live on the right.";
	const blendDesc =
		"Blend: design is stacked over the live capture; adjust transparency.";

	return (
		<section className="overlay-section">
			<div className="overlay-header">
				<div>
					<h3>Overlay preview</h3>
					<p>
						{compareMode === "wipe" ? wipeDesc : blendDesc} Use{" "}
						<strong>Pixel ruler</strong> below the toolbar to measure distances in
						pixels.
					</p>
				</div>
				<div className="overlay-controls-cluster">
					<div className="overlay-mode-toggle" role="group" aria-label="Overlay mode">
						<button
							type="button"
							className={
								"overlay-mode-btn " +
								(compareMode === "wipe" ? "overlay-mode-btn-active" : "")
							}
							onClick={() => setCompareMode("wipe")}
						>
							Wipe
						</button>
						<button
							type="button"
							className={
								"overlay-mode-btn " +
								(compareMode === "blend" ? "overlay-mode-btn-active" : "")
							}
							onClick={() => setCompareMode("blend")}
						>
							Blend
						</button>
					</div>
					{compareMode === "wipe" ? (
						<div className="overlay-slider-wrapper">
							<input
								type="range"
								min="0"
								max="100"
								value={position}
								onChange={(e) => setPosition(Number(e.target.value))}
								className="overlay-slider"
								aria-label="Wipe position"
							/>
							<span className="overlay-slider-label">{position.toFixed(0)}%</span>
						</div>
					) : (
						<div className="overlay-slider-wrapper">
							<span className="overlay-blend-label">Design opacity</span>
							<input
								type="range"
								min="0"
								max="100"
								value={blendOpacity}
								onChange={(e) => setBlendOpacity(Number(e.target.value))}
								className="overlay-slider"
								aria-label="Design layer opacity"
							/>
							<span className="overlay-slider-label">
								{blendOpacity.toFixed(0)}%
							</span>
						</div>
					)}
				</div>
			</div>

			<div className="overlay-frame">
				<PixelMeasureTool>
					<div className="overlay-inner">
						<img
							src={liveSrc}
							alt="Live implementation"
							className="overlay-img overlay-img-base"
						/>
						<img
							src={designSrc}
							alt="Design overlay"
							className="overlay-img overlay-img-top"
							style={
								compareMode === "wipe"
									? {
											clipPath: `inset(0 ${100 - position}% 0 0)`,
											opacity: 1,
									  }
									: {
											clipPath: "none",
											opacity: blendOpacity / 100,
									  }
							}
						/>
						{compareMode === "wipe" && (
							<div className="overlay-handle" style={{ left: `${position}%` }}>
								<div className="overlay-handle-line" />
								<div className="overlay-handle-knob" />
							</div>
						)}
					</div>
				</PixelMeasureTool>
			</div>
		</section>
	);
}
