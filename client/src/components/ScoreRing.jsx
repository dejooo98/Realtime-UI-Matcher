/**
 * Circular progress for 0–100 match score (premium results hero).
 */
export default function ScoreRing({
	score,
	passed,
	size = 112,
	stroke = 8,
	label = "match",
}) {
	const pct = Math.min(100, Math.max(0, Number(score) || 0));
	const r = (size - stroke) / 2;
	const cx = size / 2;
	const cy = size / 2;
	const circumference = 2 * Math.PI * r;
	const dashOffset = circumference - (pct / 100) * circumference;
	const strokeColor = passed ? "var(--rum-success)" : "var(--rum-accent)";

	return (
		<div
			className="score-ring-wrap"
			style={{ width: size, height: size }}
			role="img"
			aria-label={`Pixel match ${pct.toFixed(1)} percent`}
		>
			<svg
				width={size}
				height={size}
				viewBox={`0 0 ${size} ${size}`}
				className="score-ring-svg"
			>
				<circle
					className="score-ring-track"
					r={r}
					cx={cx}
					cy={cy}
					fill="none"
					strokeWidth={stroke}
				/>
				<circle
					className="score-ring-progress"
					r={r}
					cx={cx}
					cy={cy}
					fill="none"
					strokeWidth={stroke}
					stroke={strokeColor}
					strokeLinecap="round"
					strokeDasharray={circumference}
					strokeDashoffset={dashOffset}
					transform={`rotate(-90 ${cx} ${cy})`}
				/>
			</svg>
			<div className="score-ring-center">
				<span className="score-ring-value">{pct.toFixed(1)}</span>
				<span className="score-ring-suffix">%</span>
				<span className="score-ring-label">{label}</span>
			</div>
		</div>
	);
}
