import { useLayoutEffect, useRef, useState } from "react";

/**
 * Pixelay-style distance measure: click two points on the preview to read
 * separation in source image pixels (uses the first <img> inside the stage).
 */
export default function PixelMeasureTool({
	children,
	enabled = true,
	stageClassName = "",
	stageStyle,
}) {
	const wrapRef = useRef(null);
	const [active, setActive] = useState(false);
	const [a, setA] = useState(null);
	const [b, setB] = useState(null);
	const [, bumpLayout] = useState(0);
	/** Derived in useLayoutEffect — no ref reads during render */
	const [line, setLine] = useState(null);

	useLayoutEffect(() => {
		const root = wrapRef.current;
		if (!root) return;
		const img = root.querySelector("img");
		const onLayout = () => bumpLayout((n) => n + 1);
		img?.addEventListener("load", onLayout);
		const ro = new ResizeObserver(onLayout);
		ro.observe(root);
		return () => {
			img?.removeEventListener("load", onLayout);
			ro.disconnect();
		};
	}, [children]);

	useLayoutEffect(() => {
		let cancelled = false;
		const id = requestAnimationFrame(() => {
			const stage = wrapRef.current;
			const img = stage?.querySelector("img");
			if (cancelled) return;
			if (!stage || !img?.naturalWidth || !a) {
				setLine(null);
				return;
			}
			const sr = stage.getBoundingClientRect();
			const ir = img.getBoundingClientRect();
			const ax = ir.left - sr.left + a.nx * ir.width;
			const ay = ir.top - sr.top + a.ny * ir.height;
			if (!b) {
				setLine({ ax, ay });
				return;
			}
			const bx = ir.left - sr.left + b.nx * ir.width;
			const by = ir.top - sr.top + b.ny * ir.height;
			const nw = img.naturalWidth;
			const nh = img.naturalHeight;
			const fdx = (b.nx - a.nx) * nw;
			const fdy = (b.ny - a.ny) * nh;
			const dist = Math.sqrt(fdx * fdx + fdy * fdy);
			setLine({
				ax,
				ay,
				bx,
				by,
				dist,
				dx: Math.round(fdx),
				dy: Math.round(fdy),
			});
		});
		return () => {
			cancelled = true;
			cancelAnimationFrame(id);
		};
	}, [a, b, bumpLayout, children]);

	const handleClick = (e) => {
		if (!active || !enabled) return;
		if (e.target.closest(".pixel-measure-toolbar")) return;
		const stage = wrapRef.current;
		const img = stage?.querySelector("img");
		if (!stage || !img?.naturalWidth) return;
		const ir = img.getBoundingClientRect();
		const x = e.clientX - ir.left;
		const y = e.clientY - ir.top;
		if (x < 0 || y < 0 || x > ir.width || y > ir.height) return;
		const nx = x / ir.width;
		const ny = y / ir.height;
		if (!a || (b && e.shiftKey)) {
			setA({ nx, ny });
			setB(null);
			return;
		}
		setB({ nx, ny });
	};

	const dist = line?.dist ?? null;
	const dx = line?.dx ?? null;
	const dy = line?.dy ?? null;

	return (
		<div className="pixel-measure-wrap">
			<div className="pixel-measure-toolbar">
				<button
					type="button"
					className={
						"pixel-measure-toggle " + (active ? "pixel-measure-toggle-on" : "")
					}
					onClick={() => {
						setActive((v) => !v);
						setA(null);
						setB(null);
					}}
					disabled={!enabled}
					aria-pressed={active}
				>
					{active ? "Measuring…" : "Pixel ruler"}
				</button>
				{active && (
					<span className="pixel-measure-hint">
						Two clicks · <kbd className="kbd">Shift</kbd>+click to reset first
						point · <kbd className="kbd">Esc</kbd> to exit
					</span>
				)}
				{dist != null && (
					<span className="pixel-measure-readout" aria-live="polite">
						<strong>{dist.toFixed(1)}</strong> px
						{dx != null && dy != null && (
							<span className="pixel-measure-delta">
								{" "}
								(Δx {dx}, Δy {dy})
							</span>
						)}
					</span>
				)}
			</div>
			<div
				ref={wrapRef}
				className={
					"pixel-measure-stage " +
					(active ? "pixel-measure-stage-active" : "") +
					(stageClassName ? " " + stageClassName : "")
				}
				style={stageStyle}
				onClick={handleClick}
				onKeyDown={(e) => {
					if (e.key === "Escape") {
						setActive(false);
						setA(null);
						setB(null);
					}
				}}
				role="presentation"
				tabIndex={active ? 0 : -1}
			>
				{children}
				{active && line && (
					<svg className="pixel-measure-svg" aria-hidden>
						<circle cx={line.ax} cy={line.ay} r={4} className="pixel-measure-dot" />
						{b && line.bx != null && line.by != null && (
							<>
								<line
									x1={line.ax}
									y1={line.ay}
									x2={line.bx}
									y2={line.by}
									className="pixel-measure-line"
								/>
								<circle
									cx={line.bx}
									cy={line.by}
									r={4}
									className="pixel-measure-dot"
								/>
							</>
						)}
					</svg>
				)}
			</div>
		</div>
	);
}
