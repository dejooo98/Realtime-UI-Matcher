/** Premium loading placeholder for the results view */
export default function ResultsSkeleton() {
	return (
		<section className="card card-results card-results-skeleton" aria-busy="true">
			<div className="results-skeleton">
				<div className="results-skeleton-hero">
					<div className="skeleton skeleton-ring" />
					<div className="results-skeleton-meta">
						<div className="skeleton skeleton-line skeleton-line-lg" />
						<div className="skeleton skeleton-line" />
						<div className="skeleton skeleton-line skeleton-line-short" />
					</div>
				</div>
				<div className="results-skeleton-actions">
					<div className="skeleton skeleton-pill" />
					<div className="skeleton skeleton-pill" />
				</div>
				<div className="results-skeleton-grid">
					<div className="skeleton skeleton-thumb" />
					<div className="skeleton skeleton-thumb" />
					<div className="skeleton skeleton-thumb" />
				</div>
				<p className="results-skeleton-caption skeleton-caption">
					Capturing screenshots and diffing pixels…
				</p>
			</div>
		</section>
	);
}
