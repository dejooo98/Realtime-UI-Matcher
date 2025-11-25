import React from "react";
import VisualDiffTabs from "./VisualDiffTabs";
import StyleInspector from "./StyleInspector";

function downloadImage(dataUrl, filename) {
	if (!dataUrl) return;
	const link = document.createElement("a");
	link.href = dataUrl;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

export default function ResultsView({
	result,
	loading,
	passThreshold,
	styleResult,
}) {
	if (!result && !loading) {
		return (
			<section className="card card-results">
				<div className="empty-state">
					<h2>No results yet</h2>
					<p>
						Run a comparison from the Comparison tab, then come back here to see
						the details.
					</p>
				</div>
			</section>
		);
	}

	if (loading) {
		return (
			<section className="card card-results">
				<div className="loading-state">
					<div className="spinner" />
					<div>
						<h2>Capturing and comparing pixels</h2>
						<p>
							Depending on the mode, the server is either opening the URL and
							taking a screenshot or comparing the uploaded PNG images.
						</p>
					</div>
				</div>
			</section>
		);
	}

	const currentPassed =
		result && typeof result.matchScore === "number"
			? result.matchScore >= passThreshold
			: null;

	const sectionScores = Array.isArray(result.sectionScores)
		? result.sectionScores
		: [];

	const worstSection =
		sectionScores.length > 0
			? sectionScores.reduce(
					(lowest, s) =>
						lowest == null || s.matchScore < lowest.matchScore ? s : lowest,
					null
			  )
			: null;

	return (
		<section className="card card-results">
			<div className="results-wrapper">
				{/* Score summary */}
				<div className="score-card">
					<div className="score-main">
						<span className="score-label">Pixel match</span>
						<span className="score-value">
							{result.matchScore.toFixed(1)}
							<span className="score-suffix">%</span>
						</span>
						{currentPassed != null && (
							<span
								className={
									"score-badge " +
									(currentPassed ? "score-badge-pass" : "score-badge-fail")
								}
							>
								{currentPassed ? "PASS" : "FAIL"} · target {passThreshold}%
							</span>
						)}
					</div>
					<div className="score-meta">
						<span>
							Dimensions{" "}
							<strong>
								{result.width} × {result.height}
							</strong>
						</span>
						<span>
							Different pixels{" "}
							<strong>
								{result.diffPixels.toLocaleString("en-US")} /{" "}
								{result.totalPixels.toLocaleString("en-US")}
							</strong>
						</span>
					</div>
				</div>

				{/* Per section breakdown */}
				{sectionScores.length > 0 && (
					<section className="section-card">
						<div className="section-header">
							<div>
								<h2>Per section breakdown</h2>
								<p className="section-subtitle">
									The page is split into vertical slices. Use this to see which
									part of the viewport is causing most mismatch.
								</p>
							</div>
							{worstSection && (
								<div className="section-worst">
									<span className="section-worst-label">Worst section</span>
									<span className="section-worst-value">
										{worstSection.label} · {worstSection.matchScore.toFixed(1)}%
									</span>
								</div>
							)}
						</div>

						<div className="section-grid">
							{sectionScores.map((s) => (
								<div key={s.id} className="section-row">
									<div className="section-row-main">
										<div className="section-label">{s.label}</div>
										<div className="section-bar-wrapper">
											<div className="section-bar-bg">
												<div
													className="section-bar-fill"
													style={{ width: `${s.matchScore}%` }}
												/>
											</div>
											<div className="section-bar-score">
												{s.matchScore.toFixed(1)}%
											</div>
										</div>
									</div>
									<div className="section-row-meta">
										<span>
											Diff pixels{" "}
											<strong>
												{s.diffPixels.toLocaleString("en-US")} /{" "}
												{s.totalPixels.toLocaleString("en-US")}
											</strong>
										</span>
									</div>
								</div>
							))}
						</div>
					</section>
				)}

				{/* Export buttons */}
				<div className="export-row">
					<button
						type="button"
						className="btn-secondary export-btn"
						onClick={() => downloadImage(result.designImage, "design.png")}
					>
						Export design
					</button>
					<button
						type="button"
						className="btn-secondary export-btn"
						onClick={() =>
							downloadImage(result.screenshotImage, "implementation.png")
						}
					>
						Export implementation
					</button>
					<button
						type="button"
						className="btn-secondary export-btn"
						onClick={() => downloadImage(result.diffImage, "diff.png")}
					>
						Export diff
					</button>
				</div>

				{/* Thumbnails */}
				<div className="preview-grid">
					<div className="preview-column">
						<h3>Design</h3>
						<div className="preview-frame">
							<img src={result.designImage} alt="Design" />
						</div>
					</div>
					<div className="preview-column">
						<h3>Implementation</h3>
						<div className="preview-frame">
							<img src={result.screenshotImage} alt="Implementation" />
						</div>
					</div>
					<div className="preview-column">
						<h3>Diff</h3>
						<div className="preview-frame">
							<img src={result.diffImage} alt="Diff" />
						</div>
					</div>
				</div>

				{/* Visual inspection: overlay + heatmap */}
				<VisualDiffTabs
					designSrc={result.designImage}
					implementationSrc={result.screenshotImage}
					diffSrc={result.diffImage}
				/>

				{/* Style inspector */}
				<StyleInspector styleResult={styleResult} />

				<p className="hint-text">
					Darker areas on the diff map highlight stronger differences between
					the design and the implementation. Use the section breakdown, visual
					tools and the style inspector to find concrete layout, typography and
					color issues.
				</p>
			</div>
		</section>
	);
}
