import { useState } from "react";
import { toast } from "sonner";
import ScoreRing from "./ScoreRing.jsx";
import ResultsSkeleton from "./ResultsSkeleton.jsx";
import VisualDiffTabs from "./VisualDiffTabs";
import StyleInspector from "./StyleInspector";
import SectionBreakdown from "./SectionBreakdown";
import UrlOpenLink from "./UrlOpenLink.jsx";

function dataUrlToUint8Array(dataUrl) {
	const m = /^data:image\/png;base64,(.+)$/.exec(dataUrl);
	if (!m) return null;
	const binary = atob(m[1]);
	const len = binary.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}

function downloadImage(dataUrl, filename) {
	if (!dataUrl) return;
	const link = document.createElement("a");
	link.href = dataUrl;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

async function buildZipBlob(result, styleResult) {
	const JSZip = (await import("jszip")).default;
	const zip = new JSZip();

	function addPng(path, dataUrl) {
		const bytes = dataUrlToUint8Array(dataUrl);
		if (bytes) zip.file(path, bytes);
	}

	if (result.batch && Array.isArray(result.results)) {
		for (const r of result.results) {
			const folder = `w${r.viewportWidth}`;
			addPng(`${folder}/design.png`, r.designImage);
			addPng(`${folder}/implementation.png`, r.screenshotImage);
			addPng(`${folder}/diff.png`, r.diffImage);
		}
	} else {
		addPng("design.png", result.designImage);
		addPng("implementation.png", result.screenshotImage);
		addPng("diff.png", result.diffImage);
	}

	if (styleResult && typeof styleResult === "object") {
		zip.file("style-report.json", JSON.stringify(styleResult, null, 2));
	}

	return zip.generateAsync({ type: "blob" });
}

function downloadBlob(blob, filename) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

function buildResultSummaryText(result, passThreshold, styleResult) {
	const batch = Boolean(result.batch && Array.isArray(result.results));
	const rows = batch ? result.results : [result];
	const aggregateScore = batch
		? Math.min(...rows.map((r) => r.matchScore))
		: result.matchScore;
	const passed =
		typeof aggregateScore === "number"
			? aggregateScore >= passThreshold
			: false;
	const lines = [
		"Realtime UI Matcher",
		`Pixel match: ${aggregateScore.toFixed(1)}% (${passed ? "PASS" : "FAIL"} vs ${passThreshold}% target)`,
	];
	if (!batch && result.width != null) {
		lines.push(`Dimensions: ${result.width}×${result.height}`);
		const dp = Number(result.diffPixels);
		const tp = Number(result.totalPixels);
		lines.push(
			`Diff pixels: ${Number.isFinite(dp) ? dp.toLocaleString("en-US") : result.diffPixels} / ${Number.isFinite(tp) ? tp.toLocaleString("en-US") : result.totalPixels}`
		);
	}
	if (batch) {
		lines.push(`Viewports: ${rows.map((r) => `${r.viewportWidth}px`).join(", ")}`);
	}
	if (styleResult?.paletteOverlap != null) {
		lines.push(`Palette Jaccard overlap: ${styleResult.paletteOverlap}%`);
	}
	if (Array.isArray(styleResult?.checks) && styleResult.checks.length > 0) {
		const ok = styleResult.checks.filter((c) => c.match).length;
		lines.push(`Style checks matched: ${ok}/${styleResult.checks.length}`);
	}
	return lines.join("\n");
}

function A11yPanel({ a11y }) {
	const [open, setOpen] = useState(false);
	if (!a11y) return null;

	const blocks = [];

	if (a11y.implementation) {
		blocks.push({ title: "Implementation", data: a11y.implementation });
	}
	if (a11y.urlA) {
		blocks.push({ title: "URL A (design)", data: a11y.urlA });
	}
	if (a11y.urlB) {
		blocks.push({ title: "URL B (implementation)", data: a11y.urlB });
	}

	if (blocks.length === 0) return null;

	return (
		<div className="a11y-panel card-nested">
			<button
				type="button"
				className="a11y-panel-toggle"
				onClick={() => setOpen((o) => !o)}
				aria-expanded={open}
			>
				Accessibility scan (axe) {open ? "▼" : "▶"}
			</button>
			{open && (
				<div className="a11y-panel-body">
					{blocks.map(({ title, data }) => (
						<div key={title} className="a11y-block">
							<h4>{title}</h4>
							{data.error && (
								<p className="a11y-error">{data.error}</p>
							)}
							{Array.isArray(data.violations) && data.violations.length > 0 && (
								<ul className="a11y-violations">
									{data.violations.map((v) => (
										<li key={v.id + (v.description || "")}>
											<strong>{v.id}</strong>
											{v.impact && (
												<span className="a11y-impact"> · {v.impact}</span>
											)}
											<div className="a11y-desc">{v.description || v.help}</div>
											{v.nodes != null && (
												<div className="a11y-nodes">
													Affected nodes: {v.nodes}
												</div>
											)}
										</li>
									))}
								</ul>
							)}
							{!data.error &&
								(!data.violations || data.violations.length === 0) && (
									<p className="a11y-ok">No violations reported (or scan empty).</p>
								)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}

function ResultBlock({
	result: r,
	passThreshold,
	styleResult,
	showStyleInspector,
}) {
	const currentPassed =
		r && typeof r.matchScore === "number"
			? r.matchScore >= passThreshold
			: null;

	return (
		<div className="result-block-inner">
			<div className="score-card">
				<div className="score-main">
					<span className="score-label">Pixel match</span>
					<span className="score-value">
						{r.matchScore.toFixed(1)}
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
							{r.width} × {r.height}
						</strong>
					</span>
					<span>
						Different pixels{" "}
						<strong>
							{r.diffPixels.toLocaleString("en-US")} /{" "}
							{r.totalPixels.toLocaleString("en-US")}
						</strong>
					</span>
				</div>
			</div>

			<div className="export-row">
				<button
					type="button"
					className="btn-secondary export-btn"
					onClick={() => downloadImage(r.designImage, "design.png")}
				>
					Export design
				</button>
				<button
					type="button"
					className="btn-secondary export-btn"
					onClick={() =>
						downloadImage(r.screenshotImage, "implementation.png")
					}
				>
					Export implementation
				</button>
				<button
					type="button"
					className="btn-secondary export-btn"
					onClick={() => downloadImage(r.diffImage, "diff.png")}
				>
					Export diff
				</button>
			</div>

			<div className="preview-grid">
				<div className="preview-column">
					<h3>Design</h3>
					<div className="preview-frame">
						<img src={r.designImage} alt="Design" />
					</div>
				</div>
				<div className="preview-column">
					<h3>Implementation</h3>
					<div className="preview-frame">
						<img src={r.screenshotImage} alt="Implementation" />
					</div>
				</div>
				<div className="preview-column">
					<h3>Diff</h3>
					<div className="preview-frame">
						<img src={r.diffImage} alt="Diff" />
					</div>
				</div>
			</div>

			<VisualDiffTabs
				designSrc={r.designImage}
				implementationSrc={r.screenshotImage}
				diffSrc={r.diffImage}
			/>

			<A11yPanel a11y={r.a11y} />

			{showStyleInspector && <StyleInspector styleResult={styleResult} />}

			{Array.isArray(r.sectionScores) && r.sectionScores.length > 0 && (
				<SectionBreakdown sectionScores={r.sectionScores} />
			)}
		</div>
	);
}

function CompareSourceLinks({ compareMeta }) {
	if (!compareMeta) return null;
	const { mode, designUrl, implUrl, url, activeUrlPair } = compareMeta;
	const envLabel =
		activeUrlPair === "production" ? "Production" : "Staging";

	if (mode === "url-url" && (designUrl || implUrl)) {
		return (
			<div className="compare-source-links card-nested">
				<div className="compare-source-links-header">
					<span className="compare-source-links-title">Compared URLs</span>
					{activeUrlPair && (
						<span className="compare-source-env-badge">{envLabel}</span>
					)}
				</div>
				<ul className="compare-source-links-list">
					{designUrl?.trim() && (
						<li>
							<span className="compare-source-label">Design</span>
							<code className="compare-source-url">{designUrl.trim()}</code>
							<UrlOpenLink href={designUrl.trim()} />
						</li>
					)}
					{implUrl?.trim() && (
						<li>
							<span className="compare-source-label">Implementation</span>
							<code className="compare-source-url">{implUrl.trim()}</code>
							<UrlOpenLink href={implUrl.trim()} />
						</li>
					)}
				</ul>
			</div>
		);
	}

	if (mode === "design-url" && url?.trim()) {
		return (
			<div className="compare-source-links card-nested">
				<div className="compare-source-links-header">
					<span className="compare-source-links-title">Compared URL</span>
				</div>
				<ul className="compare-source-links-list">
					<li>
						<span className="compare-source-label">Live page</span>
						<code className="compare-source-url">{url.trim()}</code>
						<UrlOpenLink href={url.trim()} />
					</li>
				</ul>
			</div>
		);
	}

	return null;
}

export default function ResultsView({
	result,
	loading,
	passThreshold,
	styleResult,
	compareMeta = null,
	onOpenComparison = () => {},
}) {
	const [zipBusy, setZipBusy] = useState(false);

	if (!result && !loading) {
		return (
			<section className="card card-results">
				<div className="empty-state empty-state--cta">
					<h2>No results yet</h2>
					<p>
						Run a comparison from the Comparison workspace, then return here for
						scores, diffs, and exports.
					</p>
					<button
						type="button"
						className="btn-primary empty-state-btn"
						onClick={onOpenComparison}
					>
						Go to Comparison
					</button>
				</div>
			</section>
		);
	}

	if (loading) {
		return <ResultsSkeleton />;
	}

	const batch = Boolean(result.batch && Array.isArray(result.results));
	const rows = batch ? result.results : [result];

	const aggregateScore = batch
		? Math.min(...rows.map((r) => r.matchScore))
		: result.matchScore;
	const aggregatePassed =
		typeof aggregateScore === "number"
			? aggregateScore >= passThreshold
			: null;

	const handleExportZip = async () => {
		setZipBusy(true);
		try {
			const blob = await buildZipBlob(result, styleResult);
			downloadBlob(blob, "ui-matcher-export.zip");
		} catch (err) {
			console.error(err);
			toast.error("Could not build ZIP — try again or copy summary instead.");
		} finally {
			setZipBusy(false);
		}
	};

	const handleExportStyleJson = () => {
		if (!styleResult) return;
		const blob = new Blob([JSON.stringify(styleResult, null, 2)], {
			type: "application/json",
		});
		downloadBlob(blob, "style-report.json");
		toast.success("Style report downloaded");
	};

	const handleCopySummary = async () => {
		const text = buildResultSummaryText(result, passThreshold, styleResult);
		try {
			await navigator.clipboard.writeText(text);
			toast.success("Summary copied to clipboard");
		} catch {
			toast.error("Could not copy — check browser permissions.");
		}
	};

	return (
		<section className="card card-results">
			<div className="results-wrapper">
				<div className="score-card score-card-aggregate score-card-premium">
					<ScoreRing
						score={aggregateScore}
						passed={aggregatePassed === true}
						label={batch ? "multi" : "match"}
					/>
					<div className="score-card-copy">
						<span className="score-label">
							{batch ? "Worst viewport (pixel match)" : "Pixel match"}
						</span>
						{aggregatePassed != null && (
							<span
								className={
									"score-badge " +
									(aggregatePassed ? "score-badge-pass" : "score-badge-fail")
								}
							>
								{aggregatePassed ? "PASS" : "FAIL"} · target {passThreshold}%
							</span>
						)}
						<div className="score-meta">
							{batch ? (
								<span>
									<strong>{rows.length}</strong> viewport
									{rows.length === 1 ? "" : "s"} · expand rows for detail
								</span>
							) : (
								<>
									<span>
										Dimensions{" "}
										<strong>
											{result.width} × {result.height}
										</strong>
									</span>
									<span>
										Diff pixels{" "}
										<strong>
											{Number.isFinite(Number(result.diffPixels))
												? Number(result.diffPixels).toLocaleString("en-US")
												: "—"}{" "}
											/{" "}
											{Number.isFinite(Number(result.totalPixels))
												? Number(result.totalPixels).toLocaleString("en-US")
												: "—"}
										</strong>
									</span>
								</>
							)}
						</div>
					</div>
				</div>

				<CompareSourceLinks compareMeta={compareMeta} />

				<div className="export-row">
					<button
						type="button"
						className="btn-secondary export-btn"
						onClick={handleCopySummary}
					>
						Copy summary
					</button>
					<button
						type="button"
						className="btn-secondary export-btn"
						onClick={handleExportZip}
						disabled={zipBusy}
					>
						{zipBusy ? "Building ZIP…" : "Download all as ZIP"}
					</button>
					{styleResult ? (
						<button
							type="button"
							className="btn-secondary export-btn"
							onClick={handleExportStyleJson}
						>
							Download style report (JSON)
						</button>
					) : null}
				</div>

				{batch ? (
					<div className="batch-results">
						{rows.map((r, i) => (
							<details
								key={`${r.viewportWidth}-${i}`}
								className="batch-result-details"
								open={i === 0}
							>
								<summary className="batch-result-summary">
									<span className="batch-vp">{r.viewportWidth}px</span>
									<span className="batch-score">
										{r.matchScore.toFixed(1)}% match
									</span>
								</summary>
								<ResultBlock
									result={r}
									passThreshold={passThreshold}
									styleResult={i === 0 ? styleResult : null}
									showStyleInspector={i === 0}
								/>
							</details>
						))}
					</div>
				) : (
					<ResultBlock
						result={result}
						passThreshold={passThreshold}
						styleResult={styleResult}
						showStyleInspector
					/>
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
