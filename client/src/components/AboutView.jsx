export default function AboutView() {
	return (
		<div className="content-about content-about--wide">
			<header className="about-hero card card-premium">
				<div className="about-hero-glow" aria-hidden />
				<div className="about-hero-inner">
					<p className="about-hero-eyebrow">Realtime UI Matcher · RUM</p>
					<h2 className="about-hero-title">
						Pixel QA for design-to-code workflows
					</h2>
					<p className="about-hero-lead">
						Compare <strong>Figma or PNG exports</strong> to staging or
						production URLs, run <strong>URL vs URL</strong> checks, or diff two
						images—then read match scores, heatmaps, overlays, optional{" "}
						<strong>accessibility</strong> hints, and a searchable{" "}
						<strong>history</strong> of runs.
					</p>
				</div>
			</header>

			<section className="about-section" aria-labelledby="about-features-heading">
				<h2 id="about-features-heading" className="about-section-title">
					What you can do
				</h2>
				<div className="about-feature-grid">
					<article className="about-feature-card card card-premium">
						<h3 className="about-feature-title">Design vs live</h3>
						<p>
							Upload a design PNG and capture a page at your chosen viewport to
							measure <strong>visual fidelity</strong> and catch layout drift
							before release.
						</p>
					</article>
					<article className="about-feature-card card card-premium">
						<h3 className="about-feature-title">Environment parity</h3>
						<p>
							Use <strong>URL vs URL</strong> to compare staging to production or
							branch previews—ideal for <strong>visual regression</strong>{" "}
							sweeps.
						</p>
					</article>
					<article className="about-feature-card card card-premium">
						<h3 className="about-feature-title">Batch &amp; history</h3>
						<p>
							Run <strong>multi-viewport</strong> batches, tune diff
							sensitivity, set pass targets, and review trends in{" "}
							<strong>history</strong>.
						</p>
					</article>
				</div>
			</section>

			<section className="about-section" aria-labelledby="about-how-heading">
				<h2 id="about-how-heading" className="about-section-title">
					How it fits your QA stack
				</h2>
				<ol className="about-steps">
					<li>
						<span className="about-step-num">1</span>
						<div>
							<strong>Choose a mode</strong> — design vs URL, image vs image,
							or URL vs URL.
						</div>
					</li>
					<li>
						<span className="about-step-num">2</span>
						<div>
							<strong>Adjust quick settings</strong> — viewport, theme, pass
							target, and sensitivity.
						</div>
					</li>
					<li>
						<span className="about-step-num">3</span>
						<div>
							<strong>Run the comparison</strong> — server-side capture and
							pixel diff produce a score and artifacts.
						</div>
					</li>
					<li>
						<span className="about-step-num">4</span>
						<div>
							<strong>Review results</strong> — overlays, style checks, optional
							a11y summary, then iterate.
						</div>
					</li>
				</ol>
			</section>

			<section className="about-section" aria-labelledby="about-faq-heading">
				<h2 id="about-faq-heading" className="about-section-title">
					FAQ
				</h2>
				<div className="about-faq">
					<details className="about-faq-item">
						<summary>Is this a replacement for end-to-end tests?</summary>
						<p>
							RUM focuses on <strong>visual and layout correctness</strong>. Pair
							it with functional E2E tests for a fuller quality picture.
						</p>
					</details>
					<details className="about-faq-item">
						<summary>What does “match score” mean?</summary>
						<p>
							It reflects how closely two captures align at the pixel level,
							after your chosen sensitivity—use it as a signal alongside manual
							review of the diff.
						</p>
					</details>
					<details className="about-faq-item">
						<summary>Who built Realtime UI Matcher?</summary>
						<p>
							Realtime UI Matcher is developed by{" "}
							<a
								href="https://dejomarkovic.com"
								target="_blank"
								rel="noopener noreferrer"
							>
								Dejan Markovic
							</a>
							. Visit{" "}
							<a
								href="https://dejomarkovic.com"
								target="_blank"
								rel="noopener noreferrer"
							>
								dejomarkovic.com
							</a>{" "}
							for more projects and contact.
						</p>
					</details>
				</div>
			</section>

			<aside className="about-credits card card-premium" aria-label="Credits">
				<p className="about-credits-text">
					<span className="about-credits-label">Developed by</span>
					<a
						className="about-credits-name"
						href="https://dejomarkovic.com"
						target="_blank"
						rel="noopener noreferrer"
					>
						Dejan Markovic
					</a>
					<span className="about-credits-sep">·</span>
					<a
						className="about-credits-site"
						href="https://dejomarkovic.com"
						target="_blank"
						rel="noopener noreferrer"
					>
						dejomarkovic.com
					</a>
				</p>
			</aside>
		</div>
	);
}
