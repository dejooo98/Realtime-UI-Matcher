function ColorSwatchRow({ label, colors }) {
	if (!Array.isArray(colors) || colors.length === 0) return null;
	return (
		<div className="style-palette-block">
			<span className="style-palette-label">{label}</span>
			<div className="style-palette-swatches" role="list">
				{colors.slice(0, 18).map((c, i) => (
					<span
						key={`${c}-${i}`}
						className="style-swatch"
						style={{ background: c }}
						title={c}
						role="listitem"
					/>
				))}
			</div>
		</div>
	);
}

function TagCountGrid({ tagCounts, title }) {
	if (!tagCounts || typeof tagCounts !== "object") return null;
	const entries = Object.entries(tagCounts).filter(([, n]) => n > 0);
	if (entries.length === 0) return null;
	return (
		<div className="style-tags-block">
			<h3 className="style-group-title">{title}</h3>
			<div className="style-tag-grid">
				{entries.map(([tag, n]) => (
					<span key={tag} className="style-tag-chip">
						<code>{tag}</code>
						<strong>{n}</strong>
					</span>
				))}
			</div>
		</div>
	);
}

function CssVarTable({ vars }) {
	if (!Array.isArray(vars) || vars.length === 0) return null;
	return (
		<div className="style-csv-block">
			<h3 className="style-group-title">CSS variables (:root)</h3>
			<div className="style-csv-table">
				{vars.slice(0, 24).map((row) => (
					<div key={row.name} className="style-csv-row">
						<code className="style-csv-name">{row.name}</code>
						<span className="style-csv-val">{row.value}</span>
					</div>
				))}
			</div>
		</div>
	);
}

function MetaBlock({ meta, side }) {
	if (!meta?.title && !meta?.description) return null;
	return (
		<div className="style-meta-block">
			<span className="style-meta-side">{side}</span>
			{meta.title ? (
				<p className="style-meta-line">
					<strong>Title</strong> {meta.title}
				</p>
			) : null}
			{meta.description ? (
				<p className="style-meta-line style-meta-desc">{meta.description}</p>
			) : null}
		</div>
	);
}

export default function StyleInspector({ styleResult }) {
	if (!styleResult) {
		return (
			<section className="style-card">
				<div className="style-header">
					<div>
						<h2>Style report</h2>
						<p className="style-subtitle">
							Run a URL vs URL comparison to see typography, colors, tag counts,
							and CSS tokens between design and implementation.
						</p>
					</div>
					<span className="style-badge">URL vs URL only</span>
				</div>
				<p className="style-empty">
					No style analysis data yet. Use URL vs URL with both URLs filled in.
				</p>
			</section>
		);
	}

	const checks = Array.isArray(styleResult.checks) ? styleResult.checks : [];
	const design = styleResult.design;
	const impl = styleResult.implementation;
	const figmaHints = styleResult.figmaHints;
	const overlap =
		typeof styleResult.paletteOverlap === "number"
			? styleResult.paletteOverlap
			: null;

	if (checks.length === 0 && !design && !impl) {
		return (
			<section className="style-card">
				<div className="style-header">
					<div>
						<h2>Style report</h2>
						<p className="style-subtitle">
							We tried to read computed styles from both pages.
						</p>
					</div>
				</div>
				<p className="style-empty">No style checks were generated.</p>
			</section>
		);
	}

	const matchCount = checks.filter((c) => c.match).length;

	return (
		<section className="style-card">
			<div className="style-header">
				<div>
					<h2>Style report</h2>
					<p className="style-subtitle">
						Computed styles, sampled palettes, HTML tag counts, and :root
						variables — compared side by side. When “CSS summary on capture” is
						enabled, this is produced in the same run as screenshots (no extra
						navigation).
					</p>
				</div>
				<div className="style-summary">
					<span className="style-summary-label">Checks passed</span>
					<span className="style-summary-value">
						{matchCount} / {checks.length}
					</span>
					{overlap != null && (
						<span className="style-summary-sub">
							Palette Jaccard {overlap}%
						</span>
					)}
				</div>
			</div>

			{figmaHints && (figmaHints.urlA?.isFigma || figmaHints.urlB?.isFigma) && (
				<div className="style-figma-hint card-nested">
					<strong>Figma</strong>{" "}
					{figmaHints.urlA?.isFigma && (
						<span>
							Design URL: {figmaHints.urlA.kind}
							{figmaHints.urlA.nodeId
								? ` · node ${figmaHints.urlA.nodeId}`
								: ""}
							.{" "}
						</span>
					)}
					{figmaHints.urlB?.isFigma && (
						<span>
							Implementation URL: {figmaHints.urlB.kind}
							{figmaHints.urlB.nodeId
								? ` · node ${figmaHints.urlB.nodeId}`
								: ""}
							.
						</span>
					)}{" "}
					Heavy prototypes may need a longer post-capture delay. Optional: enable
					“Figma embed URL for capture” in settings to load the embed player.
				</div>
			)}

			<div className="style-groups">
				{(design?.meta || impl?.meta) && (
					<div className="style-meta-grid">
						<MetaBlock meta={design?.meta} side="Design" />
						<MetaBlock meta={impl?.meta} side="Implementation" />
					</div>
				)}

				<div className="style-palette-row">
					<ColorSwatchRow label="Design palette (sampled)" colors={design?.palette} />
					<ColorSwatchRow
						label="Implementation palette (sampled)"
						colors={impl?.palette}
					/>
				</div>

				{(Array.isArray(design?.fontFamilies) && design.fontFamilies.length > 0) ||
				(Array.isArray(impl?.fontFamilies) && impl.fontFamilies.length > 0) ? (
					<div className="style-font-block">
						<h3 className="style-group-title">Font stacks (sampled)</h3>
						<div className="style-font-columns">
							<div>
								<span className="style-font-side">Design</span>
								<ul className="style-font-list">
									{(design?.fontFamilies || []).map((f) => (
										<li key={f}>{f}</li>
									))}
								</ul>
							</div>
							<div>
								<span className="style-font-side">Implementation</span>
								<ul className="style-font-list">
									{(impl?.fontFamilies || []).map((f) => (
										<li key={f}>{f}</li>
									))}
								</ul>
							</div>
						</div>
					</div>
				) : null}

				<div className="style-tags-two">
					<TagCountGrid tagCounts={design?.tagCounts} title="Design · tags" />
					<TagCountGrid
						tagCounts={impl?.tagCounts}
						title="Implementation · tags"
					/>
				</div>

				<div className="style-csv-two">
					<CssVarTable vars={design?.cssVariables} />
					<CssVarTable vars={impl?.cssVariables} />
				</div>
			</div>

			{checks.length > 0 && (
				<>
					<h3 className="style-group-title style-group-title--table">
						Detailed checks
					</h3>
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
									{check.detail ? (
										<span className="style-check-detail">{check.detail}</span>
									) : null}
								</div>
								<div className="style-cell-value">
									{check.design ?? (
										<span className="style-missing">Missing</span>
									)}
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
											(check.match
												? "style-status-ok"
												: "style-status-mismatch")
										}
									>
										{check.match ? "Match" : "Mismatch"}
									</span>
								</div>
							</div>
						))}
					</div>
				</>
			)}

			<p className="style-footnote">
				Palette overlap uses Jaccard similarity on normalized sampled colors from up
				to 400 elements. Tag counts and CSS variables depend on what the browser can
				read (cross-origin stylesheets may hide some variables).
			</p>
		</section>
	);
}
