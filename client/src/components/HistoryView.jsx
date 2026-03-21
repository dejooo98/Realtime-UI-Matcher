import dayjs from "dayjs";

function HistorySparkline({ scores }) {
	if (scores.length < 2) return null;

	const w = 120;
	const h = 36;
	const pad = 4;
	const min = Math.min(...scores);
	const max = Math.max(...scores);
	const span = max - min || 1;

	const pts = scores.map((s, i) => {
		const x =
			scores.length === 1
				? w / 2
				: pad + (i / (scores.length - 1)) * (w - pad * 2);
		const t = (s - min) / span;
		const y = pad + (1 - t) * (h - pad * 2);
		return `${x},${y}`;
	});

	return (
		<div className="history-sparkline-wrap" aria-hidden>
			<span className="history-sparkline-label">Trend</span>
			<svg
				className="history-sparkline"
				viewBox={`0 0 ${w} ${h}`}
				width={w}
				height={h}
			>
				<polyline
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinejoin="round"
					strokeLinecap="round"
					points={pts.join(" ")}
				/>
			</svg>
		</div>
	);
}

export default function HistoryView({ history, onOpenComparison = () => {} }) {
	const chronological = [...history].reverse();
	const scores = chronological.map((h) => h.score);

	return (
		<section className="card history-card">
			<div className="history-card-head">
				<h2>Recent runs</h2>
				<HistorySparkline scores={scores} />
			</div>

			{history.length === 0 && (
				<div className="history-empty history-empty--cta">
					<p className="history-empty-text">No runs yet.</p>
					<p className="history-empty-hint">
						Each comparison you run appears here with score and pass/fail.
					</p>
					<button
						type="button"
						className="btn-primary history-empty-btn"
						onClick={onOpenComparison}
					>
						Start a comparison
					</button>
				</div>
			)}

			{history.length > 0 && (
				<div className="history-table history-table-premium">
					<div className="history-row history-row-head">
						<span>When</span>
						<span>Mode</span>
						<span>Target</span>
						<span>Score</span>
						<span>Status</span>
					</div>

					{history.map((run) => (
						<div key={run.id} className="history-row">
							<span title={dayjs(run.at).format("YYYY-MM-DD HH:mm")}>
								{dayjs(run.at).format("MMM D, YYYY · HH:mm")}
							</span>
							<span>
								{run.mode === "design-url"
									? "Design · URL"
									: run.mode === "image-image"
									? "Image · Image"
									: "URL · URL"}
							</span>
							<span className="history-target-cell">{run.target}</span>
							<span>{run.score.toFixed(1)}%</span>
							<span
								className={
									"history-status " +
									(run.passed ? "history-status-pass" : "history-status-fail")
								}
							>
								{run.passed ? "PASS" : "FAIL"}
							</span>
						</div>
					))}
				</div>
			)}
		</section>
	);
}
