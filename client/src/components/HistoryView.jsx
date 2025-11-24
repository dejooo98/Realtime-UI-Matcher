import React from "react";

export default function HistoryView({ history }) {
	return (
		<section className="card history-card">
			<h2>Recent runs</h2>

			{history.length === 0 && <p className="history-empty">No runs yet.</p>}

			{history.length > 0 && (
				<div className="history-table">
					<div className="history-row history-row-head">
						<span>When</span>
						<span>Mode</span>
						<span>Target</span>
						<span>Score</span>
						<span>Status</span>
					</div>

					{history.map((run) => (
						<div key={run.id} className="history-row">
							<span>
								{new Date(run.at).toLocaleString(undefined, {
									dateStyle: "short",
									timeStyle: "short",
								})}
							</span>
							<span>
								{run.mode === "design-url"
									? "Design · URL"
									: run.mode === "image-image"
									? "Image · Image"
									: "URL · URL"}
							</span>
							<span>{run.target}</span>
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
