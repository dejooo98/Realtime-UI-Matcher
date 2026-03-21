import { toast } from "sonner";
import { Kbd } from "./ui/Kbd.jsx";

const WAIT_OPTIONS = [
	{
		value: "networkidle2",
		label: "Network idle",
		hint: "Best for SPAs — waits until the network is mostly quiet.",
	},
	{
		value: "domcontentloaded",
		label: "DOM ready",
		hint: "Fast; HTML parsed. Good for mostly static pages.",
	},
	{
		value: "load",
		label: "Window load",
		hint: "After main-document stylesheets and images load.",
	},
	{
		value: "networkidle0",
		label: "Network idle (strict)",
		hint: "Stricter idle; can be slow with analytics or websockets.",
	},
];

const STRICTNESS_HINTS = {
	low: "More tolerant (threshold 0.2). Noisy pages or third-party embeds.",
	normal: "Balanced (0.1). Recommended default.",
	high: "Strict (0.05). Smaller visual drift and anti-aliasing differences surface.",
};

function scrollToSection(id) {
	document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function SettingsNav() {
	const links = [
		{ id: "settings-projects", label: "Saved URL pairs" },
		{ id: "settings-appearance", label: "Appearance" },
		{ id: "settings-comparison", label: "Comparison" },
		{ id: "settings-batch", label: "URL batch" },
		{ id: "settings-network", label: "Network & load" },
		{ id: "settings-capture", label: "Capture & mask" },
		{ id: "settings-data", label: "Data & shortcuts" },
	];
	return (
		<nav className="settings-nav" aria-label="Settings sections">
			<p className="settings-nav-label">On this page</p>
			{links.map(({ id, label }) => (
				<button
					key={id}
					type="button"
					className="settings-nav-link"
					onClick={() => scrollToSection(id)}
				>
					{label}
				</button>
			))}
		</nav>
	);
}

function ToggleSwitch({ checked, onChange, id, label }) {
	return (
		<button
			type="button"
			id={id}
			role="switch"
			aria-checked={checked}
			className="settings-switch"
			onClick={() => onChange(!checked)}
			aria-label={label}
		/>
	);
}

export default function SettingsView({
	captureOptions,
	setCaptureOptions,
	theme,
	setTheme,
	strictness,
	setStrictness,
	passThreshold,
	setPassThreshold,
	viewportWidth,
	setViewportWidth,
	historyLimit,
	setHistoryLimit,
	onResetCaptureDefaults,
	onResetAllComparisonDefaults,
	projects = [],
	projectNameInput = "",
	setProjectNameInput = () => {},
	onSaveProject = () => {},
	onLoadProject = () => {},
	onDeleteProject = () => {},
}) {
	const batchCount = (() => {
		try {
			const j = JSON.parse(captureOptions.viewportWidthsJson || "[]");
			return Array.isArray(j) ? j.length : 0;
		} catch {
			return 0;
		}
	})();

	return (
		<div className="settings-shell">
			<div className="settings-nav-wrap">
				<SettingsNav />
			</div>

			<div className="settings-main">
				<div className="settings-hero">
					<h2>Workspace preferences</h2>
					<p>
						Saved URL pairs, appearance, comparison defaults, batch viewports,
						Puppeteer timing, and capture behavior. These apply to the next run;
						Comparison still lets you override sources and mode.
					</p>
				</div>

				<section id="settings-projects" className="settings-section">
					<div className="settings-panel">
						<div className="settings-panel-head">
							<div className="settings-panel-icon" aria-hidden>
								📁
							</div>
							<div>
								<h3>Saved URL pairs</h3>
								<p className="settings-panel-desc">
									For <strong>URL vs URL</strong> comparisons only: store named
									staging and production design/implementation URLs so you can
									load them from Comparison without pasting again. Data stays in
									this browser.
								</p>
							</div>
						</div>
						<div className="settings-panel-body">
							<div className="settings-saved-projects">
								<label
									className="sidebar-projects-label"
									htmlFor="settings-project-name-input"
								>
									Saved projects
								</label>
								{projects.length === 0 && (
									<p className="sidebar-projects-empty">
										No projects yet. Switch to Comparison → URL vs URL, enter
										URLs, then save here with a name.
									</p>
								)}
								{projects.length > 0 && (
									<ul className="sidebar-project-list">
										{projects.map((p) => (
											<li key={p.id} className="sidebar-project-row">
												<button
													type="button"
													className="sidebar-project-load"
													onClick={() => onLoadProject(p.id)}
													title={p.name}
												>
													{p.name}
												</button>
												<button
													type="button"
													className="sidebar-project-delete"
													onClick={() => onDeleteProject(p.id)}
													aria-label={`Delete project ${p.name}`}
												>
													×
												</button>
											</li>
										))}
									</ul>
								)}
								<input
									id="settings-project-name-input"
									className="sidebar-project-input"
									type="text"
									placeholder="Project name"
									value={projectNameInput}
									onChange={(e) => setProjectNameInput(e.target.value)}
								/>
								<button
									type="button"
									className="sidebar-project-save"
									onClick={onSaveProject}
								>
									Save current URLs
								</button>
							</div>
						</div>
					</div>
				</section>

				<section id="settings-appearance" className="settings-section">
					<div className="settings-panel">
						<div className="settings-panel-head">
							<div className="settings-panel-icon" aria-hidden>
								◐
							</div>
							<div>
								<h3>Appearance</h3>
								<p className="settings-panel-desc">
									Interface theme for the studio shell and toasts.
								</p>
							</div>
						</div>
						<div className="settings-panel-body">
							<div className="settings-theme-grid">
								<button
									type="button"
									className={
										"settings-theme-card " +
										(theme === "light" ? "settings-theme-card-active" : "")
									}
									onClick={() => setTheme("light")}
								>
									<div className="settings-theme-card-title">
										<span aria-hidden>☀️</span> Light
									</div>
									<p className="settings-theme-card-desc">
										High contrast for daytime and bright displays.
									</p>
								</button>
								<button
									type="button"
									className={
										"settings-theme-card " +
										(theme === "dark" ? "settings-theme-card-active" : "")
									}
									onClick={() => setTheme("dark")}
								>
									<div className="settings-theme-card-title">
										<span aria-hidden>🌙</span> Dark
									</div>
									<p className="settings-theme-card-desc">
										Reduced glare for low-light review sessions.
									</p>
								</button>
							</div>
						</div>
					</div>
				</section>

				<section id="settings-comparison" className="settings-section">
					<div className="settings-panel">
						<div className="settings-panel-head">
							<div className="settings-panel-icon" aria-hidden>
								◎
							</div>
							<div>
								<h3>Comparison defaults</h3>
								<p className="settings-panel-desc">
									Pixel diff sensitivity, pass target, and default viewport width
									for single-width captures.
								</p>
							</div>
						</div>
						<div className="settings-panel-body">
							<div className="field-group">
								<label className="label">Diff sensitivity</label>
								<div className="settings-chip-row">
									{["low", "normal", "high"].map((s) => (
										<button
											key={s}
											type="button"
											className={
												"settings-chip " +
												(strictness === s ? "settings-chip-active" : "")
											}
											onClick={() => setStrictness(s)}
											title={STRICTNESS_HINTS[s]}
										>
											{s.charAt(0).toUpperCase() + s.slice(1)}
										</button>
									))}
								</div>
								<p className="capture-option-hint">
									{STRICTNESS_HINTS[strictness]}
								</p>
							</div>

							<div className="field-group">
								<label className="label">
									Passing score target{" "}
									<span className="settings-pass-value">{passThreshold}%</span>
								</label>
								<div className="settings-pass-slider">
									<input
										type="range"
										min={90}
										max={100}
										step={1}
										value={passThreshold}
										onChange={(e) =>
											setPassThreshold(Number(e.target.value))
										}
										aria-valuetext={`${passThreshold} percent`}
									/>
								</div>
								<p className="capture-option-hint">
									Results show PASS when the pixel match meets or exceeds this
									threshold.
								</p>
							</div>

							<div className="field-group">
								<label className="label">Default viewport width (px)</label>
								<div className="field-inline">
									<input
										className="input"
										type="number"
										min="320"
										max="3840"
										value={viewportWidth}
										onChange={(e) => setViewportWidth(e.target.value)}
										style={{ maxWidth: "140px" }}
									/>
									<div className="chip-row">
										{["1440", "1280", "1024", "768", "375"].map((size) => (
											<button
												type="button"
												key={size}
												className={
													viewportWidth === size ? "chip chip-active" : "chip"
												}
												onClick={() => setViewportWidth(size)}
											>
												{size}px
											</button>
										))}
									</div>
								</div>
							</div>

							<div className="settings-actions">
								<button
									type="button"
									className="settings-btn-ghost"
									onClick={() => {
										setStrictness("normal");
										setPassThreshold(98);
										setViewportWidth("1440");
										toast.message("Comparison defaults reset");
									}}
								>
									Reset comparison defaults
								</button>
							</div>
						</div>
					</div>
				</section>

				<section id="settings-batch" className="settings-section">
					<div className="settings-panel">
						<div className="settings-panel-head">
							<div className="settings-panel-icon" aria-hidden>
								⊞
							</div>
							<div>
								<h3>URL vs URL · multi-viewport</h3>
								<p className="settings-panel-desc">
									Run one comparison per width for responsive QA. When enabled,
									the JSON list replaces a single viewport for that mode.
								</p>
							</div>
						</div>
						<div className="settings-panel-body">
							<div className="settings-toggle-row">
								<div className="settings-toggle-copy">
									<strong>Compare multiple viewport widths</strong>
									<span>
										Batch mode: slower, runs once per width (max 20).{" "}
										{batchCount > 0 && (
											<>Currently <strong>{batchCount}</strong> widths.</>
										)}
									</span>
								</div>
								<ToggleSwitch
									checked={captureOptions.urlMultiViewport}
									onChange={(v) =>
										setCaptureOptions((prev) => ({
											...prev,
											urlMultiViewport: v,
										}))
									}
									label="Toggle multi-viewport batch"
								/>
							</div>

							{captureOptions.urlMultiViewport && (
								<div className="field-group">
									<label className="label">
										Viewport widths (JSON array)
										<span className="label-hint">
											Example: [1440, 1024, 768, 375]
										</span>
									</label>
									<textarea
										className="input textarea-input settings-mask-area"
										rows={4}
										spellCheck={false}
										value={captureOptions.viewportWidthsJson}
										onChange={(e) =>
											setCaptureOptions((prev) => ({
												...prev,
												viewportWidthsJson: e.target.value,
											}))
										}
									/>
								</div>
							)}
						</div>
					</div>
				</section>

				<section id="settings-network" className="settings-section">
					<div className="settings-panel">
						<div className="settings-panel-head">
							<div className="settings-panel-icon" aria-hidden>
								≋
							</div>
							<div>
								<h3>Network &amp; page load</h3>
								<p className="settings-panel-desc">
									How Puppeteer waits for navigation before screenshots (Design vs
									URL and URL vs URL).
								</p>
							</div>
						</div>
						<div className="settings-panel-body">
							<div className="field-group">
								<label className="label">Page load strategy</label>
								<div className="settings-wait-grid">
									{WAIT_OPTIONS.map((o) => (
										<button
											key={o.value}
											type="button"
											className={
												"settings-wait-tile " +
												(captureOptions.waitUntil === o.value
													? "settings-wait-tile-active"
													: "")
											}
											onClick={() =>
												setCaptureOptions((prev) => ({
													...prev,
													waitUntil: o.value,
												}))
											}
										>
											<p className="settings-wait-tile-title">{o.label}</p>
											<p className="settings-wait-tile-hint">{o.hint}</p>
										</button>
									))}
								</div>
							</div>

							<div className="settings-metrics">
								<div className="settings-metric">
									<label>Post-load delay (ms)</label>
									<input
										className="input"
										type="number"
										min={0}
										max={10000}
										step={100}
										value={captureOptions.postDelayMs}
										onChange={(e) =>
											setCaptureOptions((prev) => ({
												...prev,
												postDelayMs: Number(e.target.value) || 0,
											}))
										}
									/>
								</div>
								<div className="settings-metric">
									<label>Nav timeout (sec)</label>
									<input
										className="input"
										type="number"
										min={15}
										max={120}
										value={captureOptions.navTimeoutSec}
										onChange={(e) =>
											setCaptureOptions((prev) => ({
												...prev,
												navTimeoutSec: Number(e.target.value) || 60,
											}))
										}
									/>
								</div>
								<div className="settings-metric">
									<label>Max capture height (px)</label>
									<input
										className="input"
										type="number"
										min={400}
										max={8000}
										step={100}
										value={captureOptions.maxCaptureHeight}
										onChange={(e) =>
											setCaptureOptions((prev) => ({
												...prev,
												maxCaptureHeight: Number(e.target.value) || 3000,
											}))
										}
									/>
								</div>
							</div>
						</div>
					</div>
				</section>

				<section id="settings-capture" className="settings-section">
					<div className="settings-panel">
						<div className="settings-panel-head">
							<div className="settings-panel-icon" aria-hidden>
								◫
							</div>
							<div>
								<h3>Capture &amp; masking</h3>
								<p className="settings-panel-desc">
									Optional element clip, motion, axe scan, and ignore regions for
									pixel diffs.
								</p>
							</div>
						</div>
						<div className="settings-panel-body">
							<div className="field-group">
								<label className="label">CSS selector (optional)</label>
								<input
									className="input"
									type="text"
									autoComplete="off"
									placeholder="main, #app, .hero"
									value={captureOptions.selector}
									onChange={(e) =>
										setCaptureOptions((prev) => ({
											...prev,
											selector: e.target.value,
										}))
									}
								/>
							</div>

							<div className="settings-toggle-row">
								<div className="settings-toggle-copy">
									<strong>Disable CSS animations during capture</strong>
									<span>Reduces motion blur in screenshots.</span>
								</div>
								<ToggleSwitch
									checked={captureOptions.disableAnimations}
									onChange={(v) =>
										setCaptureOptions((prev) => ({
											...prev,
											disableAnimations: v,
										}))
									}
									label="Disable animations"
								/>
							</div>

							<div className="settings-toggle-row">
								<div className="settings-toggle-copy">
									<strong>Accessibility scan (axe)</strong>
									<span>Run after capture when the server supports it.</span>
								</div>
								<ToggleSwitch
									checked={captureOptions.includeA11y}
									onChange={(v) =>
										setCaptureOptions((prev) => ({
											...prev,
											includeA11y: v,
										}))
									}
									label="Include axe scan"
								/>
							</div>

							<div className="settings-toggle-row">
								<div className="settings-toggle-copy">
									<strong>CSS summary on capture (URL vs URL)</strong>
									<span>
										Sample colors, fonts, tag counts, and :root variables during
										the same navigation as screenshots — no extra browser pass
										when this stays on.
									</span>
								</div>
								<ToggleSwitch
									checked={captureOptions.includeCssSummary !== false}
									onChange={(v) =>
										setCaptureOptions((prev) => ({
											...prev,
											includeCssSummary: v,
										}))
									}
									label="CSS summary on capture"
								/>
							</div>

							<div className="settings-toggle-row">
								<div className="settings-toggle-copy">
									<strong>Figma embed URL for capture</strong>
									<span>
										Paste your normal Figma link in Comparison — you never paste
										an embed code. When this is on, the server opens Figma’s{" "}
										<code>figma.com/embed?…</code> player for that link (built
										automatically). Try it if the editor URL is blocked; otherwise
										leave it off.
									</span>
								</div>
								<ToggleSwitch
									checked={Boolean(captureOptions.useFigmaEmbed)}
									onChange={(v) =>
										setCaptureOptions((prev) => ({
											...prev,
											useFigmaEmbed: v,
										}))
									}
									label="Use Figma embed"
								/>
							</div>

							<div className="field-group">
								<label className="label">
									Ignore regions (JSON mask)
									<span className="label-hint">
										Rects in 0–1 space; differences inside are ignored (image vs
										image and URL captures).
									</span>
								</label>
								<textarea
									className="input textarea-input settings-mask-area"
									rows={5}
									spellCheck={false}
									placeholder='[{"x":0,"y":0.85,"width":1,"height":0.15}]'
									value={captureOptions.maskRegionsJson}
									onChange={(e) =>
										setCaptureOptions((prev) => ({
											...prev,
											maskRegionsJson: e.target.value,
										}))
									}
								/>
							</div>

							<div className="settings-actions">
								<button
									type="button"
									className="settings-btn-ghost"
									onClick={onResetCaptureDefaults}
								>
									Reset capture &amp; mask to defaults
								</button>
							</div>
						</div>
					</div>
				</section>

				<section id="settings-data" className="settings-section">
					<div className="settings-panel">
						<div className="settings-panel-head">
							<div className="settings-panel-icon" aria-hidden>
								☰
							</div>
							<div>
								<h3>Data &amp; keyboard</h3>
								<p className="settings-panel-desc">
									History list size and shortcuts that work across the app.
								</p>
							</div>
						</div>
						<div className="settings-panel-body">
							<div className="field-group">
								<label className="label">
									History entries to keep: <strong>{historyLimit}</strong>
								</label>
								<div className="settings-history-row">
									<input
										type="range"
										min={5}
										max={50}
										step={1}
										value={historyLimit}
										onChange={(e) =>
											setHistoryLimit(Number(e.target.value))
										}
									/>
								</div>
								<p className="capture-option-hint">
									Oldest runs drop off when you exceed this count (stored in this
									browser).
								</p>
							</div>

							<div className="field-group">
								<label className="label">Shortcuts</label>
								<ul className="settings-shortcuts">
									<li>
										<span>Run comparison (when focus in Comparison)</span>
										<span>
											<Kbd>Ctrl</Kbd>/<Kbd>⌘</Kbd> + <Kbd>Enter</Kbd>
										</span>
									</li>
									<li>
										<span>Visual inspection modes (Results)</span>
										<span>
											<Kbd>1</Kbd> · <Kbd>2</Kbd> · <Kbd>3</Kbd>
										</span>
									</li>
								</ul>
							</div>

							<div className="settings-actions">
								<button
									type="button"
									className="settings-btn-ghost"
									onClick={onResetAllComparisonDefaults}
								>
									Reset all defaults (capture + comparison + batch)
								</button>
							</div>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}
