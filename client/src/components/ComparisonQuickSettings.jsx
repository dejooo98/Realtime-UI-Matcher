import clsx from "clsx";

const VIEWPORT_PRESETS = [
	{ label: "Desktop", w: "1440" },
	{ label: "Laptop", w: "1280" },
	{ label: "Tablet", w: "1024" },
	{ label: "Mobile L", w: "768" },
	{ label: "Mobile", w: "375" },
];

export default function ComparisonQuickSettings({
	strictness,
	setStrictness,
	passThreshold,
	setPassThreshold,
	viewportWidth,
	setViewportWidth,
	captureOptions,
	setCaptureOptions,
	mode,
	theme,
	setTheme,
	onOpenSettings,
}) {
	return (
		<div className="comparison-quick-settings comparison-quick-settings--panel comparison-quick-settings--in-panel">
			<div className="comparison-quick-form" role="group" aria-label="Run options">
				<div className="comparison-quick-row">
					<div className="comparison-quick-field-label" id="cq-theme-label">
						Theme
					</div>
					<div
						className="comparison-quick-field"
						role="group"
						aria-labelledby="cq-theme-label"
					>
						<div className="comparison-quick-segmented" role="radiogroup">
							<button
								type="button"
								className={clsx(
									"comparison-quick-seg",
									theme === "light" && "comparison-quick-seg-active"
								)}
								onClick={() => setTheme("light")}
								aria-pressed={theme === "light"}
							>
								Light
							</button>
							<button
								type="button"
								className={clsx(
									"comparison-quick-seg",
									theme === "dark" && "comparison-quick-seg-active"
								)}
								onClick={() => setTheme("dark")}
								aria-pressed={theme === "dark"}
							>
								Dark
							</button>
						</div>
					</div>
				</div>

				<div className="comparison-quick-row comparison-quick-row--top">
					<div className="comparison-quick-field-label" id="cq-vp-label">
						Viewport
					</div>
					<div
						className="comparison-quick-field comparison-quick-field--vp"
						aria-labelledby="cq-vp-label"
					>
						<div className="comparison-quick-presets" role="list">
							{VIEWPORT_PRESETS.map(({ label, w }) => (
								<button
									key={w}
									type="button"
									className={clsx(
										"comparison-quick-preset",
										viewportWidth === w && "comparison-quick-preset-active"
									)}
									onClick={() => setViewportWidth(w)}
									title={`${label} · ${w}px`}
								>
									<span className="comparison-quick-preset-w">{w}</span>
									<span className="comparison-quick-preset-meta">{label}</span>
								</button>
							))}
						</div>
						<div className="comparison-quick-px-group">
							<label className="comparison-quick-px-label" htmlFor="cq-vp-input">
								Custom
							</label>
							<input
								id="cq-vp-input"
								className="input comparison-quick-px-input"
								type="number"
								min="320"
								max="3840"
								value={viewportWidth}
								onChange={(e) => setViewportWidth(e.target.value)}
								aria-label="Custom viewport width in pixels"
							/>
							<span className="comparison-quick-px-suffix" aria-hidden>
								px
							</span>
						</div>
					</div>
				</div>

				<div className="comparison-quick-row">
					<div className="comparison-quick-field-label" id="cq-diff-label">
						Diff
					</div>
					<div
						className="comparison-quick-field"
						role="group"
						aria-labelledby="cq-diff-label"
					>
						<div className="comparison-quick-chips">
							{["low", "normal", "high"].map((s) => (
								<button
									key={s}
									type="button"
									className={clsx(
										"comparison-quick-chip",
										strictness === s && "comparison-quick-chip-active"
									)}
									onClick={() => setStrictness(s)}
								>
									{s.charAt(0).toUpperCase() + s.slice(1)}
								</button>
							))}
						</div>
					</div>
				</div>

				<div className="comparison-quick-row">
					<div className="comparison-quick-field-label" id="cq-pass-label">
						Pass at
					</div>
					<div
						className="comparison-quick-field"
						role="group"
						aria-labelledby="cq-pass-label"
					>
						<div className="comparison-quick-chips">
							{[95, 98, 99].map((n) => (
								<button
									key={n}
									type="button"
									className={clsx(
										"comparison-quick-chip",
										passThreshold === n && "comparison-quick-chip-active"
									)}
									onClick={() => setPassThreshold(n)}
								>
									{n}%
								</button>
							))}
						</div>
					</div>
				</div>
			</div>

			<div className="comparison-quick-footer">
				<button
					type="button"
					className="comparison-quick-settings-btn"
					onClick={onOpenSettings}
				>
					All settings
				</button>
			</div>

			{mode === "url-url" && (
				<label className="comparison-quick-batch comparison-quick-batch--row">
					<input
						type="checkbox"
						checked={captureOptions.urlMultiViewport}
						onChange={(e) =>
							setCaptureOptions((prev) => ({
								...prev,
								urlMultiViewport: e.target.checked,
							}))
						}
					/>
					<span>
						<strong>Multi-viewport batch</strong>
						<span className="comparison-quick-batch-hint">
							{" "}
							— widths are edited in Settings
						</span>
					</span>
				</label>
			)}
		</div>
	);
}
