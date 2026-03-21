import { useEffect, useRef } from "react";
import clsx from "clsx";
import ErrorAlert from "./ErrorAlert";
import { Kbd } from "./ui/Kbd.jsx";
import FigmaWorkflowPanel from "./FigmaWorkflowPanel.jsx";
import ComparisonQuickSettings from "./ComparisonQuickSettings.jsx";
import { figmaUrlHint } from "../lib/figmaUrl.js";
import FigmaUrlHowTo from "./FigmaUrlHowTo.jsx";

function FigmaUrlFieldHint({ url, extra = "" }) {
	const h = figmaUrlHint(url);
	if (!h.isFigma) return null;
	return (
		<p className="figma-url-hint" role="status">
			Figma {h.kind} link
			{h.nodeId ? ` · node-id ${h.nodeId}` : ""}. {extra}
		</p>
	);
}

export default function ComparisonView({
	mode,
	setMode,
	strictness,
	setStrictness,
	passThreshold,
	setPassThreshold,
	viewportWidth,
	setViewportWidth,
	captureOptions,
	setCaptureOptions,
	theme,
	setTheme,
	url,
	setUrl,
	designUrl,
	setDesignUrl,
	implUrl,
	setImplUrl,
	activeUrlPair = "staging",
	setActiveUrlPair = () => {},
	designFile,
	setDesignFile,
	implFile,
	setImplFile,
	loading,
	error,
	onOpenSettings = () => {},
	onSubmit,
	onReset,
}) {
	const formRef = useRef(null);
	const rootRef = useRef(null);

	const batchWidthCount = (() => {
		try {
			const j = JSON.parse(captureOptions.viewportWidthsJson || "[]");
			return Array.isArray(j) ? j.length : 0;
		} catch {
			return 0;
		}
	})();

	useEffect(() => {
		const onKey = (e) => {
			const run = (e.ctrlKey || e.metaKey) && e.key === "Enter";
			if (!run) return;
			if (loading) return;
			const root = rootRef.current;
			const form = formRef.current;
			if (!root || !form) return;
			if (!root.contains(document.activeElement)) return;
			e.preventDefault();
			form.requestSubmit();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [loading]);

	return (
		<div
			className="content-comparison content-comparison--split"
			ref={rootRef}
		>
			<div className="comparison-main">
				<section className="card card-form card-premium comparison-card">
					<div className="card-header-premium">
						<div>
							<h2>Compare</h2>
							<p className="card-subtitle">
								Choose a mode and add sources. Run options stay on the right;
								<strong> How to use</strong> is in the sidebar.
							</p>
						</div>
						<span className="rum-section-badge">Workflow</span>
					</div>

					<div className={clsx("mode-toggle", "mode-toggle--premium")}>
						<button
							type="button"
							className={clsx(
								"mode-btn",
								"mode-btn--premium",
								mode === "design-url" && "mode-btn-active"
							)}
							onClick={() => setMode("design-url")}
						>
							Design vs URL
						</button>
						<button
							type="button"
							className={clsx(
								"mode-btn",
								"mode-btn--premium",
								mode === "image-image" && "mode-btn-active"
							)}
							onClick={() => setMode("image-image")}
						>
							Image vs Image
						</button>
						<button
							type="button"
							className={clsx(
								"mode-btn",
								"mode-btn--premium",
								mode === "url-url" && "mode-btn-active"
							)}
							onClick={() => setMode("url-url")}
						>
							URL vs URL
						</button>
					</div>

					<div className="comparison-composer">
						<div className="comparison-block comparison-block--sources">
							<div className="comparison-block-head">
								<span className="comparison-block-eyebrow">1 · Sources</span>
								<h3 className="comparison-block-title">Files &amp; live URLs</h3>
								<p className="comparison-block-lead">
									What to capture and diff — fields change with the mode above.
								</p>
							</div>
							<form
								ref={formRef}
								onSubmit={onSubmit}
								className="form-grid comparison-form-grid"
							>
								{mode !== "url-url" && (
									<div className="field-group">
										<label className="label">
											Design file
											<span className="label-hint">
												PNG export from Figma or any other design tool.
											</span>
										</label>
										<label className="file-drop">
											<input
												type="file"
												accept="image/png"
												onChange={(e) =>
													setDesignFile(e.target.files?.[0] || null)
												}
											/>
											<div className="file-drop-inner">
												<span className="file-title">
													{designFile
														? designFile.name
														: "Drag and drop or click to choose a PNG file"}
												</span>
												<span className="file-subtitle">
													The dimensions should match the viewport you are testing.
												</span>
											</div>
										</label>
									</div>
								)}

								{mode === "image-image" && (
									<>
										<div className="field-group">
											<label className="label">
												Implementation file
												<span className="label-hint">
													PNG screenshot of your implementation with the same
													dimensions.
												</span>
											</label>
											<label className="file-drop">
												<input
													type="file"
													accept="image/png"
													onChange={(e) =>
														setImplFile(e.target.files?.[0] || null)
													}
												/>
												<div className="file-drop-inner">
													<span className="file-title">
														{implFile
															? implFile.name
															: "Drag and drop or click to choose a PNG file"}
													</span>
													<span className="file-subtitle">
														Use the same viewport to keep the comparison clean.
													</span>
												</div>
											</label>
										</div>
										<p className="capture-option-hint settings-inline-hint">
											Ignore regions and other capture options live in the{" "}
											<strong>Settings</strong> tab.
										</p>
									</>
								)}

								{mode === "design-url" && (
									<>
										<div className="field-group">
											<label className="label">
												URL to compare
												<span className="label-hint">
													Public <strong>https://</strong> or{" "}
													<strong>http://</strong> only. Private IPs, localhost,
													and internal hosts are blocked for security.
												</span>
											</label>
											<input
												className="input"
												type="url"
												placeholder="https://example.com/page"
												value={url}
												onChange={(e) => setUrl(e.target.value)}
											/>
										</div>

										<p className="capture-option-hint settings-inline-hint">
											Viewport and pass target are in{" "}
											<strong>Run options</strong> on the right. Network timing,
											masks, and axe are in <strong>Settings</strong>.
										</p>
									</>
								)}

								{mode === "url-url" && (
									<>
										<div className="field-group url-env-field">
											<label className="label">
												Environment
												<span className="label-hint">
													Staging and production each remember their own design and
													implementation URLs. Switch here to compare the same
													frame against different deploys. Saving a project stores
													both pairs.
												</span>
											</label>
											<div
												className="url-env-toggle"
												role="group"
												aria-label="URL environment"
											>
												<button
													type="button"
													className={clsx(
														"url-env-btn",
														activeUrlPair === "staging" && "url-env-btn-active"
													)}
													onClick={() => setActiveUrlPair("staging")}
												>
													Staging
												</button>
												<button
													type="button"
													className={clsx(
														"url-env-btn",
														activeUrlPair === "production" && "url-env-btn-active"
													)}
													onClick={() => setActiveUrlPair("production")}
												>
													Production
												</button>
											</div>
										</div>

										<div className="field-group">
											<label className="label">
												Design URL
												<span className="label-hint">
													Public Figma prototype or design URL (must resolve to a
													public address).
												</span>
											</label>
											<input
												className="input"
												type="url"
												placeholder="https://www.figma.com/proto/..."
												value={designUrl}
												onChange={(e) => setDesignUrl(e.target.value)}
											/>
											<FigmaUrlFieldHint
												url={designUrl}
												extra={
													<>
														Paste the normal browser link — see{" "}
														<strong>Figma — how to use it here</strong> below. If you
														get 403, export a <strong>PNG</strong> and use{" "}
														<strong>Design vs URL</strong>.
													</>
												}
											/>
										</div>

										<div className="field-group">
											<label className="label">
												Implementation URL
												<span className="label-hint">
													Live, staging or local tunnel URL to compare against the
													design.
												</span>
											</label>
											<input
												className="input"
												type="url"
												placeholder="https://example.com/page"
												value={implUrl}
												onChange={(e) => setImplUrl(e.target.value)}
											/>
											<FigmaUrlFieldHint url={implUrl} />
										</div>

										<FigmaUrlHowTo
											designUrl={designUrl}
											onOpenSettings={onOpenSettings}
										/>

										{captureOptions.urlMultiViewport ? (
											<div className="batch-settings-banner">
												<p>
													<strong>Multi-viewport batch</strong> is on
													{batchWidthCount > 0 && (
														<>
															{" "}
															— <strong>{batchWidthCount}</strong> widths
															configured
														</>
													)}
													. Edit the list in Settings → URL batch.
												</p>
												<button type="button" onClick={onOpenSettings}>
													Open Settings
												</button>
											</div>
										) : (
											<p className="capture-option-hint settings-inline-hint">
												Viewport is set in <strong>Run options</strong> on the
												right. Enable batch viewports in{" "}
												<strong>Settings</strong> for responsive runs.
											</p>
										)}
									</>
								)}

								<ErrorAlert title={error?.title} detail={error?.detail} />

								<div className="actions actions-premium">
									<button type="submit" className="btn-primary" disabled={loading}>
										{loading ? "Running comparison…" : "Run comparison"}
									</button>
									<button
										type="button"
										className="btn-secondary"
										onClick={onReset}
										disabled={loading}
									>
										Reset
									</button>
									<p className="form-run-hint" aria-hidden={loading}>
										<span>Quick run:</span> <Kbd>Ctrl</Kbd>
										<span className="kbd-or">/</span>
										<Kbd>⌘</Kbd>
										<span className="kbd-plus">+</span>
										<Kbd>Enter</Kbd>
										<span>when focus is in this panel</span>
									</p>
								</div>
							</form>
						</div>

						<div className="comparison-block comparison-block--reference">
							<div className="comparison-block-head comparison-block-head--compact">
								<span className="comparison-block-eyebrow">2 · Optional</span>
								<h3 className="comparison-block-title">Figma &amp; live workflows</h3>
								<p className="comparison-block-lead">
									Curated notes and links — expand when you need them.
								</p>
							</div>
							<FigmaWorkflowPanel />
						</div>
					</div>
				</section>
			</div>

			<div className="comparison-rail" role="complementary" aria-label="Run options">
				<div className="comparison-block comparison-block--options comparison-block--rail">
					<div className="comparison-block-head">
						<span className="comparison-block-eyebrow">Run options</span>
						<h3 className="comparison-block-title">Viewport &amp; thresholds</h3>
						<p className="comparison-block-lead">
							Theme, width, diff sensitivity, and pass target for the next run.
						</p>
					</div>
					<ComparisonQuickSettings
						strictness={strictness}
						setStrictness={setStrictness}
						passThreshold={passThreshold}
						setPassThreshold={setPassThreshold}
						viewportWidth={viewportWidth}
						setViewportWidth={setViewportWidth}
						captureOptions={captureOptions}
						setCaptureOptions={setCaptureOptions}
						mode={mode}
						theme={theme}
						setTheme={setTheme}
						onOpenSettings={onOpenSettings}
					/>
				</div>
			</div>
		</div>
	);
}
