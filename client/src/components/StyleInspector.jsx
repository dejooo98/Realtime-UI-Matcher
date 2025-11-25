import React from "react";

export default function StyleInspector({ styleResult }) {
	// Ako nema podataka, prikaži mali hint umesto praznine
	if (!styleResult) {
		return (
			<section className="style-card">
				<div className="style-header">
					<div>
						<h2>Style inspector</h2>
						<p className="style-subtitle">
							Run a URL vs URL comparison to see typography and button color
							checks between your design and implementation.
						</p>
					</div>
					<span className="style-badge">URL vs URL only</span>
				</div>
				<p className="style-empty">
					No style analysis data yet. Use the URL vs URL mode with a design URL
					and an implementation URL.
				</p>
			</section>
		);
	}

	const checks = Array.isArray(styleResult.checks) ? styleResult.checks : [];

	if (checks.length === 0) {
		return (
			<section className="style-card">
				<div className="style-header">
					<div>
						<h2>Style inspector</h2>
						<p className="style-subtitle">
							We tried to read typography and primary button styles from both
							pages.
						</p>
					</div>
				</div>
				<p className="style-empty">No style checks were generated.</p>
			</section>
		);
	}

	return (
		<section className="style-card">
			<div className="style-header">
				<div>
					<h2>Style inspector</h2>
					<p className="style-subtitle">
						One to one checks for H1 font size and primary button background
						color. Design vs implementation.
					</p>
				</div>
				<span className="style-badge">
					{checks.filter((c) => c.match).length} / {checks.length} matching
				</span>
			</div>

			<div className="style-table">
				<div className="style-row style-row-head">
					<div>Check</div>
					<div>Design</div>
					<div>Implementation</div>
					<div>Status</div>
				</div>
				{checks.map((check) => (
					<div key={check.id} className="style-row">
						<div className="style-cell-label">
							<span className="style-category">{check.category}</span>
							<span className="style-label">{check.label}</span>
						</div>
						<div className="style-cell-value">
							{check.design ?? <span className="style-missing">Missing</span>}
						</div>
						<div className="style-cell-value">
							{check.implementation ?? (
								<span className="style-missing">Missing</span>
							)}
						</div>
						<div className="style-cell-status">
							<span
								className={
									"style-status-pill " +
									(check.match ? "style-status-ok" : "style-status-mismatch")
								}
							>
								{check.match ? "Match" : "Mismatch"}
							</span>
						</div>
					</div>
				))}
			</div>

			<p className="style-footnote">
				Right now we check only H1 font size and the primary button background
				color. Later you can extend this to spacing, font families and more
				component types.
			</p>
		</section>
	);
}
