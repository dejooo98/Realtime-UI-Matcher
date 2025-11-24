import React, { useState } from "react";

export default function OverlayViewer({ designSrc, liveSrc }) {
	const [position, setPosition] = useState(50);

	if (!designSrc || !liveSrc) return null;

	return (
		<section className="overlay-section">
			<div className="overlay-header">
				<div>
					<h3>Overlay preview</h3>
					<p>
						Drag the slider to compare design and implementation on top of each
						other.
					</p>
				</div>
				<div className="overlay-slider-wrapper">
					<input
						type="range"
						min="0"
						max="100"
						value={position}
						onChange={(e) => setPosition(Number(e.target.value))}
						className="overlay-slider"
					/>
					<span className="overlay-slider-label">{position.toFixed(0)}%</span>
				</div>
			</div>

			<div className="overlay-frame">
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
						style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
					/>
					<div className="overlay-handle" style={{ left: `${position}%` }}>
						<div className="overlay-handle-line" />
						<div className="overlay-handle-knob" />
					</div>
				</div>
			</div>
		</section>
	);
}
