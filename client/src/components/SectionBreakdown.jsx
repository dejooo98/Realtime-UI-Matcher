// client/src/components/SectionBreakdown.jsx
import React from "react";

export default function SectionBreakdown({ sectionScores }) {
	if (!sectionScores || !sectionScores.length) {
		return null;
	}

	const worst = sectionScores.reduce((acc, s) =>
		s.matchScore < acc.matchScore ? s : acc
	);

	return (
		<section className="section-card">
			<div className="section-header">
				<div>
					<h2>Per section breakdown</h2>
					<p className="section-subtitle">
						The page is split into vertical slices. Use this to see which part
						of the viewport is causing most mismatch.
					</p>
				</div>
				<div className="section-worst">
					<span className="section-worst-label">Worst section</span>
					<span className="section-worst-value">
						{worst.label} · {(100 - worst.matchScore).toFixed(1)}%
					</span>
				</div>
			</div>

			<div className="section-grid">
				{sectionScores.map((s) => {
					const mismatch = 100 - s.matchScore;

					return (
						<div key={s.id} className="section-row">
							<div className="section-row-main">
								<div className="section-label">{s.label}</div>
								<div className="section-bar-wrapper">
									<div className="section-bar-bg">
										<div
											className="section-bar-fill"
											style={{ width: `${mismatch}%` }}
										/>
									</div>
									<div className="section-bar-score">
										{mismatch.toFixed(1)}%
									</div>
								</div>
							</div>
							<div className="section-row-meta">
								Diff pixels{" "}
								<strong>
									{s.diffPixels.toLocaleString("en-US")} /{" "}
									{s.totalPixels.toLocaleString("en-US")}
								</strong>
							</div>
						</div>
					);
				})}
			</div>
		</section>
	);
}
