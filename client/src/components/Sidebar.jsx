import React from "react";

export default function Sidebar({
	activeView,
	setActiveView,
	hasResult,
	loading,
}) {
	return (
		<aside className="settings-sidebar">
			<div className="sidebar-section">
				<div className="sidebar-section-label">GENERAL</div>

				<button
					type="button"
					className={
						"sidebar-item" +
						(activeView === "comparison" ? " sidebar-item-active" : "")
					}
					onClick={() => setActiveView("comparison")}
				>
					<span>Comparison</span>
				</button>

				<button
					type="button"
					className={
						"sidebar-item" +
						(activeView === "results" ? " sidebar-item-active" : "")
					}
					onClick={() => setActiveView("results")}
					disabled={!hasResult && !loading}
				>
					<span>Results</span>
					{!hasResult && !loading && (
						<span className="sidebar-pill">no run</span>
					)}
				</button>

				<button
					type="button"
					className={
						"sidebar-item" +
						(activeView === "history" ? " sidebar-item-active" : "")
					}
					onClick={() => setActiveView("history")}
				>
					<span>History</span>
				</button>
			</div>

			<div className="sidebar-section">
				<div className="sidebar-section-label">WORKSPACE</div>
				<button className="sidebar-item" disabled>
					<span>Projects</span>
				</button>
				<button className="sidebar-item" disabled>
					<span>Teams</span>
				</button>
			</div>
		</aside>
	);
}
