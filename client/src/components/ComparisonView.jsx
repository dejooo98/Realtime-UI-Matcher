import React from "react";

export default function ComparisonView({
	mode,
	setMode,
	strictness,
	setStrictness,
	passThreshold,
	setPassThreshold,
	url,
	setUrl,
	designUrl,
	setDesignUrl,
	implUrl,
	setImplUrl,
	viewportWidth,
	setViewportWidth,
	designFile,
	setDesignFile,
	implFile,
	setImplFile,
	loading,
	error,
	onSubmit,
	onReset,
}) {
	const handlePresetClick = (size) => setViewportWidth(size);

	return (
		<div className="content-comparison">
			<section className="card card-form">
				<h2>Mode and source</h2>
				<p className="card-subtitle">
					Choose whether you compare a design against a URL, two images, or two
					URLs directly.
				</p>

				<div className="mode-toggle">
					<button
						type="button"
						className={
							"mode-btn" + (mode === "design-url" ? " mode-btn-active" : "")
						}
						onClick={() => setMode("design-url")}
					>
						Design vs URL
					</button>
					<button
						type="button"
						className={
							"mode-btn" + (mode === "image-image" ? " mode-btn-active" : "")
						}
						onClick={() => setMode("image-image")}
					>
						Image vs Image
					</button>
					<button
						type="button"
						className={
							"mode-btn" + (mode === "url-url" ? " mode-btn-active" : "")
						}
						onClick={() => setMode("url-url")}
					>
						URL vs URL
					</button>
				</div>

				<div className="field-inline">
					<div className="field-group">
						<label className="label">
							Diff sensitivity
							<span className="label-hint">
								How strictly pixel differences are detected.
							</span>
						</label>
						<div className="chip-row">
							<button
								type="button"
								className={strictness === "low" ? "chip chip-active" : "chip"}
								onClick={() => setStrictness("low")}
							>
								Loose
							</button>
							<button
								type="button"
								className={
									strictness === "normal" ? "chip chip-active" : "chip"
								}
								onClick={() => setStrictness("normal")}
							>
								Normal
							</button>
							<button
								type="button"
								className={strictness === "high" ? "chip chip-active" : "chip"}
								onClick={() => setStrictness("high")}
							>
								Strict
							</button>
						</div>
					</div>

					<div className="field-group">
						<label className="label">
							Passing score
							<span className="label-hint">
								Minimum match score to consider the page acceptable.
							</span>
						</label>
						<div className="chip-row">
							{[95, 98, 99].map((val) => (
								<button
									key={val}
									type="button"
									className={
										passThreshold === val ? "chip chip-active" : "chip"
									}
									onClick={() => setPassThreshold(val)}
								>
									{val}%
								</button>
							))}
						</div>
					</div>
				</div>

				<form onSubmit={onSubmit} className="form-grid">
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
									onChange={(e) => setDesignFile(e.target.files?.[0] || null)}
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
									onChange={(e) => setImplFile(e.target.files?.[0] || null)}
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
					)}

					{mode === "design-url" && (
						<>
							<div className="field-group">
								<label className="label">
									URL to compare
									<span className="label-hint">
										For example a staging or local environment URL.
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

							<div className="field-inline">
								<div className="field-group">
									<label className="label">
										Viewport width
										<span className="label-hint">
											In pixels. 1440 is a common desktop width.
										</span>
									</label>
									<input
										className="input"
										type="number"
										min="320"
										max="3840"
										value={viewportWidth}
										onChange={(e) => setViewportWidth(e.target.value)}
									/>
								</div>

								<div className="field-group">
									<label className="label">
										Preset
										<span className="label-hint">
											Fast access to popular widths.
										</span>
									</label>
									<div className="chip-row">
										{["1440", "1280", "1024", "768", "375"].map((size) => (
											<button
												type="button"
												key={size}
												className={
													viewportWidth === size ? "chip chip-active" : "chip"
												}
												onClick={() => handlePresetClick(size)}
											>
												{size}px
											</button>
										))}
									</div>
								</div>
							</div>
						</>
					)}

					{mode === "url-url" && (
						<>
							<div className="field-group">
								<label className="label">
									Design URL
									<span className="label-hint">
										Public Figma prototype or other design URL to capture.
									</span>
								</label>
								<input
									className="input"
									type="url"
									placeholder="https://www.figma.com/proto/..."
									value={designUrl}
									onChange={(e) => setDesignUrl(e.target.value)}
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
							</div>

							<div className="field-inline">
								<div className="field-group">
									<label className="label">
										Viewport width
										<span className="label-hint">
											In pixels. 1440 is a common desktop width.
										</span>
									</label>
									<input
										className="input"
										type="number"
										min="320"
										max="3840"
										value={viewportWidth}
										onChange={(e) => setViewportWidth(e.target.value)}
									/>
								</div>

								<div className="field-group">
									<label className="label">
										Preset
										<span className="label-hint">
											Fast access to popular widths.
										</span>
									</label>
									<div className="chip-row">
										{["1440", "1280", "1024", "768", "375"].map((size) => (
											<button
												type="button"
												key={size}
												className={
													viewportWidth === size ? "chip chip-active" : "chip"
												}
												onClick={() => handlePresetClick(size)}
											>
												{size}px
											</button>
										))}
									</div>
								</div>
							</div>
						</>
					)}

					{error && <div className="alert alert-error">{error}</div>}

					<div className="actions">
						<button type="submit" className="btn-primary" disabled={loading}>
							{loading ? "Running comparison..." : "Run comparison"}
						</button>
						<button
							type="button"
							className="btn-secondary"
							onClick={onReset}
							disabled={loading}
						>
							Reset
						</button>
					</div>
				</form>
			</section>

			<section className="card card-hint">
				<h2>How to use</h2>
				<p>
					Design vs URL. export your design as PNG, set the same viewport width
					and enter the page URL.
				</p>
				<p>
					Image vs Image. export the design as PNG, take a PNG screenshot of the
					implementation in the same viewport and compare the two files
					directly.
				</p>
				<p>
					URL vs URL. paste a public design URL such as a Figma prototype and
					the implementation URL, set the viewport width and run the comparison.
				</p>
			</section>
		</div>
	);
}
