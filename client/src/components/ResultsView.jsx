import React from "react";
import VisualDiffTabs from "./VisualDiffTabs";
import StyleInspector from "./StyleInspector";
import SectionBreakdown from "./SectionBreakdown";

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

				{/* Three thumbnails */}
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

				{/* Per section breakdown moved near the bottom */}
				{Array.isArray(result.sectionScores) &&
					result.sectionScores.length > 0 && (
						<SectionBreakdown sectionScores={result.sectionScores} />
					)}

				<p className="hint-text">
					Darker areas on the diff map highlight stronger differences between
					the design and the implementation. Use the visual tools, the style
					inspector and the section breakdown to find concrete layout,
					typography and spacing issues.
				</p>
			</div>
		</section>
	);
}
