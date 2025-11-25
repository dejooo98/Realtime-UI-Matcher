import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import ComparisonView from "./components/ComparisonView";
import ResultsView from "./components/ResultsView";
import HistoryView from "./components/HistoryView";

const API_DESIGN_URL = "http://localhost:4000/api/compare";
const API_IMAGE_IMAGE = "http://localhost:4000/api/compare-images";
const API_URL_URL = "http://localhost:4000/api/compare-urls";
const API_STYLE = "http://localhost:4000/api/analyze-style";

function thresholdFromStrictness(level) {
	if (level === "high") return 0.05;
	if (level === "low") return 0.2;
	return 0.1;
}

function loadInitialHistory() {
	if (typeof window === "undefined") return [];
	try {
		const raw = window.localStorage.getItem("rum_history");
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

export default function App() {
	const [activeView, setActiveView] = useState("comparison");
	const [mode, setMode] = useState("design-url"); // design-url | image-image | url-url

	const [theme, setTheme] = useState("light");

	const [designFile, setDesignFile] = useState(null);
	const [implFile, setImplFile] = useState(null);

	const [url, setUrl] = useState("");
	const [designUrl, setDesignUrl] = useState("");
	const [implUrl, setImplUrl] = useState("");
	const [viewportWidth, setViewportWidth] = useState("1440");

	const [strictness, setStrictness] = useState("normal");
	const [passThreshold, setPassThreshold] = useState(98);

	const [result, setResult] = useState(null);
	const [styleResult, setStyleResult] = useState(null); // style inspector data
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const [history, setHistory] = useState(() => loadInitialHistory());

	useEffect(() => {
		if (typeof window === "undefined") return;
		try {
			window.localStorage.setItem("rum_history", JSON.stringify(history));
		} catch {}
	}, [history]);

	const addHistoryEntry = (payload, data) => {
		const target =
			payload.mode === "design-url"
				? `${payload.url} @ ${payload.viewportWidth}px`
				: payload.mode === "image-image"
				? `${payload.designFile?.name || "Design"} vs ${
						payload.implFile?.name || "Implementation"
				  }`
				: `${payload.designUrl} vs ${payload.implUrl}`;

		const entry = {
			id: Date.now(),
			at: new Date().toISOString(),
			mode: payload.mode,
			target,
			score: data.matchScore,
			passed: data.matchScore >= passThreshold,
		};

		setHistory((prev) => [entry, ...prev].slice(0, 20));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setResult(null);
		setStyleResult(null); // reset style inspector on every new run

		if (mode === "design-url") {
			if (!designFile) {
				setError("Please upload a design PNG file.");
				return;
			}
			if (!url) {
				setError("Please enter the URL you want to compare.");
				return;
			}
		}

		if (mode === "image-image") {
			if (!designFile) {
				setError("Please upload a design PNG file.");
				return;
			}
			if (!implFile) {
				setError("Please upload an implementation PNG file.");
				return;
			}
		}

		if (mode === "url-url") {
			if (!designUrl) {
				setError("Please enter the design URL, for example a Figma prototype.");
				return;
			}
			if (!implUrl) {
				setError("Please enter the implementation URL.");
				return;
			}
		}

		try {
			setLoading(true);
			const threshold = thresholdFromStrictness(strictness);
			let data;

			// DESIGN vs URL
			if (mode === "design-url") {
				const formData = new FormData();
				formData.append("design", designFile);
				formData.append("url", url);
				formData.append("viewportWidth", viewportWidth);
				formData.append("threshold", String(threshold));

				const res = await fetch(API_DESIGN_URL, {
					method: "POST",
					body: formData,
				});

				if (!res.ok) {
					const errData = await res.json().catch(() => ({}));
					throw new Error(errData.error || "Error while running comparison.");
				}

				data = await res.json();
			}

			// IMAGE vs IMAGE
			if (mode === "image-image") {
				const formData = new FormData();
				formData.append("design", designFile);
				formData.append("implementation", implFile);
				formData.append("threshold", String(threshold));

				const res = await fetch(API_IMAGE_IMAGE, {
					method: "POST",
					body: formData,
				});

				if (!res.ok) {
					const errData = await res.json().catch(() => ({}));
					throw new Error(errData.error || "Error while comparing images.");
				}

				data = await res.json();
			}

			// URL vs URL
			if (mode === "url-url") {
				const res = await fetch(API_URL_URL, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						urlA: designUrl,
						urlB: implUrl,
						viewportWidth,
						threshold,
					}),
				});

				if (!res.ok) {
					const errData = await res.json().catch(() => ({}));
					throw new Error(errData.error || "Error while comparing URLs.");
				}

				data = await res.json();

				// extra. style analysis (best-effort, ne ruši glavni rezultat)
				try {
					const styleRes = await fetch(API_STYLE, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							urlDesign: designUrl,
							urlImplementation: implUrl,
							viewportWidth,
						}),
					});

					if (styleRes.ok) {
						const styleJson = await styleRes.json();
						setStyleResult(styleJson);
					}
				} catch (styleErr) {
					console.error("Style analysis failed:", styleErr);
					// tiho ignorišemo, da ne blokira main diff
				}
			}

			setResult(data);
			addHistoryEntry(
				{
					mode,
					designFile,
					implFile,
					url,
					designUrl,
					implUrl,
					viewportWidth,
				},
				data
			);
			setActiveView("results");
		} catch (err) {
			setError(err.message || "Something went wrong.");
		} finally {
			setLoading(false);
		}
	};

	const handleReset = () => {
		setDesignFile(null);
		setImplFile(null);
		setUrl("");
		setDesignUrl("");
		setImplUrl("");
		setViewportWidth("1440");
		setError("");
		setResult(null);
		setStyleResult(null);
	};

	return (
		<div className={`settings-root theme-${theme}`}>
			<div className="settings-window">
				<header className="settings-titlebar">
					<div className="traffic-lights">
						<span className="light light-red" />
						<span className="light light-amber" />
						<span className="light light-green" />
					</div>
					<div className="titlebar-center">
						<span className="titlebar-title">Realtime UI Matcher</span>
					</div>
					<div className="titlebar-right">
						<span className="titlebar-badge">Prototype · v0.1</span>
						<button
							type="button"
							className="theme-toggle-btn"
							onClick={() =>
								setTheme((prev) => (prev === "light" ? "dark" : "light"))
							}
						>
							{theme === "light" ? "Dark" : "Light"}
						</button>
					</div>
				</header>

				<div className="settings-body">
					<Sidebar
						activeView={activeView}
						setActiveView={setActiveView}
						hasResult={!!result}
						loading={loading}
					/>

					<main className="settings-content">
						<header className="content-header">
							{activeView === "comparison" && (
								<>
									<h1>Comparison</h1>
									<p>
										Choose mode, upload your design, URLs or images, tune
										sensitivity and set the viewport width. This screen prepares
										a pixel perfect check.
									</p>
								</>
							)}

							{activeView === "results" && (
								<>
									<h1>Results</h1>
									<p>
										Review the latest comparison result. See the score,
										pass/fail status, the three views, the overlay preview and
										the style inspector.
									</p>
								</>
							)}

							{activeView === "history" && (
								<>
									<h1>History</h1>
									<p>
										Browse recent comparison runs to see how your UI evolved
										over time.
									</p>
								</>
							)}
						</header>

						{activeView === "comparison" && (
							<ComparisonView
								mode={mode}
								setMode={setMode}
								strictness={strictness}
								setStrictness={setStrictness}
								passThreshold={passThreshold}
								setPassThreshold={setPassThreshold}
								url={url}
								setUrl={setUrl}
								designUrl={designUrl}
								setDesignUrl={setDesignUrl}
								implUrl={implUrl}
								setImplUrl={setImplUrl}
								viewportWidth={viewportWidth}
								setViewportWidth={setViewportWidth}
								designFile={designFile}
								setDesignFile={setDesignFile}
								implFile={implFile}
								setImplFile={setImplFile}
								loading={loading}
								error={error}
								onSubmit={handleSubmit}
								onReset={handleReset}
							/>
						)}

						{activeView === "results" && (
							<div className="content-results">
								<ResultsView
									result={result}
									loading={loading}
									passThreshold={passThreshold}
									styleResult={styleResult}
								/>
							</div>
						)}

						{activeView === "history" && (
							<div className="content-history">
								<HistoryView history={history} />
							</div>
						)}
					</main>
				</div>
			</div>
		</div>
	);
}
