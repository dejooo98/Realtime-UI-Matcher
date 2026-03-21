import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import Sidebar from "./components/Sidebar";
import ComparisonView from "./components/ComparisonView";
import ResultsView from "./components/ResultsView";
import HistoryView from "./components/HistoryView";
import SettingsView from "./components/SettingsView.jsx";
import AboutView from "./components/AboutView.jsx";
import ComparisonLoadingOverlay from "./components/ComparisonLoadingOverlay.jsx";
import { formatErrorForAlert, formatUserFacingError } from "./lib/api";
import {
	loadStoredTheme,
	persistTheme,
	loadHistoryLimit,
	persistHistoryLimit,
} from "./lib/prefs.js";
import { runComparison } from "./lib/runComparison";
import { applyPageSeo } from "./lib/seo.js";

function loadInitialHistory() {
	if (typeof window === "undefined") return [];
	try {
		const raw = window.localStorage.getItem("rum_history");
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function loadProjects() {
	if (typeof window === "undefined") return [];
	try {
		const raw = window.localStorage.getItem("rum_projects");
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

const DEFAULT_CAPTURE_OPTIONS = {
	waitUntil: "networkidle2",
	postDelayMs: 0,
	navTimeoutSec: 60,
	maxCaptureHeight: 3000,
	selector: "",
	disableAnimations: false,
	includeA11y: false,
	includeCssSummary: true,
	useFigmaEmbed: false,
	maskRegionsJson: "",
	urlMultiViewport: false,
	viewportWidthsJson: "[1440, 1024, 768, 375]",
};

function normalizeApiResult(data) {
	if (data && Array.isArray(data.results)) {
		return { batch: true, results: data.results };
	}
	return data;
}

function scoreFromResult(data) {
	if (data?.batch && Array.isArray(data.results)) {
		return Math.min(...data.results.map((r) => r.matchScore));
	}
	return data?.matchScore ?? 0;
}

function defaultUrlEnv() {
	return {
		staging: { designUrl: "", implUrl: "" },
		production: { designUrl: "", implUrl: "" },
	};
}

export default function App() {
	const [activeView, setActiveView] = useState("comparison");
	const [mode, setMode] = useState("design-url");

	const [theme, setTheme] = useState(() => loadStoredTheme());

	const [designFile, setDesignFile] = useState(null);
	const [implFile, setImplFile] = useState(null);

	const [url, setUrl] = useState("");
	const [urlEnv, setUrlEnv] = useState(() => defaultUrlEnv());
	const [activeUrlPair, setActiveUrlPair] = useState("staging");
	const designUrl = urlEnv[activeUrlPair].designUrl;
	const implUrl = urlEnv[activeUrlPair].implUrl;
	const setDesignUrl = (v) => {
		setUrlEnv((prev) => ({
			...prev,
			[activeUrlPair]: { ...prev[activeUrlPair], designUrl: v },
		}));
	};
	const setImplUrl = (v) => {
		setUrlEnv((prev) => ({
			...prev,
			[activeUrlPair]: { ...prev[activeUrlPair], implUrl: v },
		}));
	};
	const [viewportWidth, setViewportWidth] = useState("1440");

	/** URLs from the last successful run (for Results “open in new tab”). */
	const [compareMeta, setCompareMeta] = useState(null);

	const [strictness, setStrictness] = useState("normal");
	const [passThreshold, setPassThreshold] = useState(98);

	const [result, setResult] = useState(null);
	const [styleResult, setStyleResult] = useState(null);
	const [error, setError] = useState(
		/** @type {{ title: string, detail?: string } | null} */ (null)
	);

	const [captureOptions, setCaptureOptions] = useState(
		() => ({ ...DEFAULT_CAPTURE_OPTIONS })
	);

	const [history, setHistory] = useState(() => loadInitialHistory());
	const [historyLimit, setHistoryLimit] = useState(() => loadHistoryLimit(20));

	const [projects, setProjects] = useState(() => loadProjects());
	const [projectNameInput, setProjectNameInput] = useState("");

	/** Which comparison mode is running — drives loading overlay copy */
	const [pendingRunMode, setPendingRunMode] = useState(
		/** @type {string | null} */ (null)
	);

	const comparisonMutation = useMutation({
		mutationFn: runComparison,
		onSuccess: (payload, variables) => {
			const normalized = normalizeApiResult(payload.data);
			setResult(normalized);
			setStyleResult(payload.styleResult ?? null);
			setCompareMeta({
				mode: variables.mode,
				url: variables.url,
				designUrl: variables.designUrl,
				implUrl: variables.implUrl,
				activeUrlPair: variables.activeUrlPair,
			});
			addHistoryEntry(
				{
					mode: variables.mode,
					designFile: variables.designFile,
					implFile: variables.implFile,
					url: variables.url,
					designUrl: variables.designUrl,
					implUrl: variables.implUrl,
					viewportWidth: variables.viewportWidth,
					batch: Boolean(normalized?.batch),
				},
				normalized
			);
			setActiveView("results");

			const score = scoreFromResult(normalized);
			const passed = score >= passThreshold;
			toast.success(
				passed
					? `Passed · ${score.toFixed(1)}% (≥ ${passThreshold}%)`
					: `Below target · ${score.toFixed(1)}% (< ${passThreshold}%)`,
				{
					description: normalized.batch
						? "Multi-viewport comparison complete."
						: "Pixel comparison complete.",
				}
			);
		},
		onError: (err) => {
			setError(formatErrorForAlert(err));
			toast.error(formatUserFacingError(err));
		},
		onSettled: () => {
			setPendingRunMode(null);
		},
	});

	const loading = comparisonMutation.isPending;

	useEffect(() => {
		applyPageSeo(activeView);
	}, [activeView]);

	useEffect(() => {
		if (typeof document === "undefined") return;
		document.documentElement.classList.toggle("theme-dark", theme === "dark");
		document.documentElement.style.colorScheme =
			theme === "dark" ? "dark" : "light";
	}, [theme]);

	useEffect(() => {
		if (typeof window === "undefined") return;
		try {
			window.localStorage.setItem("rum_history", JSON.stringify(history));
		} catch {}
	}, [history]);

	useEffect(() => {
		persistTheme(theme);
	}, [theme]);

	useEffect(() => {
		persistHistoryLimit(historyLimit);
	}, [historyLimit]);

	useEffect(() => {
		const id = requestAnimationFrame(() => {
			setHistory((prev) => prev.slice(0, historyLimit));
		});
		return () => cancelAnimationFrame(id);
	}, [historyLimit]);

	useEffect(() => {
		if (typeof window === "undefined") return;
		try {
			window.localStorage.setItem("rum_projects", JSON.stringify(projects));
		} catch {}
	}, [projects]);

	const addHistoryEntry = (payload, data) => {
		const batch =
			Boolean(payload.batch) ||
			Boolean(data?.batch && Array.isArray(data.results));
		const target =
			payload.mode === "design-url"
				? `${payload.url} @ ${payload.viewportWidth}px`
				: payload.mode === "image-image"
				? `${payload.designFile?.name || "Design"} vs ${
						payload.implFile?.name || "Implementation"
				  }`
				: batch
				? `${payload.designUrl} vs ${payload.implUrl} (multi-viewport)`
				: `${payload.designUrl} vs ${payload.implUrl}`;

		const score = scoreFromResult(data);
		const entry = {
			id: Date.now(),
			at: new Date().toISOString(),
			mode: payload.mode,
			target,
			score,
			passed: score >= passThreshold,
		};

		setHistory((prev) => [entry, ...prev].slice(0, historyLimit));
	};

	const handleSaveProject = () => {
		const name = projectNameInput.trim() || `Project ${projects.length + 1}`;
		const st = urlEnv.staging;
		const pr = urlEnv.production;
		const entry = {
			id: Date.now(),
			name,
			designUrl: st.designUrl.trim(),
			implUrl: st.implUrl.trim(),
			stagingDesignUrl: st.designUrl.trim(),
			stagingImplUrl: st.implUrl.trim(),
			prodDesignUrl: pr.designUrl.trim(),
			prodImplUrl: pr.implUrl.trim(),
			activeUrlPair,
			viewportWidth,
		};
		setProjects((prev) => [entry, ...prev].slice(0, 30));
		setProjectNameInput("");
		toast.success("Project saved", { description: name });
	};

	const handleLoadProject = (id) => {
		const p = projects.find((x) => x.id === id);
		if (!p) return;
		setMode("url-url");
		const stagingD = p.stagingDesignUrl ?? p.designUrl ?? "";
		const stagingI = p.stagingImplUrl ?? p.implUrl ?? "";
		const prodD = p.prodDesignUrl ?? "";
		const prodI = p.prodImplUrl ?? "";
		setUrlEnv({
			staging: { designUrl: stagingD, implUrl: stagingI },
			production: { designUrl: prodD, implUrl: prodI },
		});
		setActiveUrlPair(
			p.activeUrlPair === "production" ? "production" : "staging"
		);
		if (p.viewportWidth) setViewportWidth(String(p.viewportWidth));
		setActiveView("comparison");
		toast.info("Loaded project URLs", { description: p.name });
	};

	const handleDeleteProject = (id) => {
		setProjects((prev) => prev.filter((p) => p.id !== id));
		toast.message("Project removed");
	};

	const handleResetCaptureDefaults = () => {
		setCaptureOptions({ ...DEFAULT_CAPTURE_OPTIONS });
		toast.success("Capture settings restored to defaults");
	};

	const handleResetAllComparisonDefaults = () => {
		setCaptureOptions({ ...DEFAULT_CAPTURE_OPTIONS });
		setStrictness("normal");
		setPassThreshold(98);
		setViewportWidth("1440");
		toast.success("All comparison defaults restored");
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		setError(null);
		setResult(null);
		setStyleResult(null);
		setCompareMeta(null);

		if (mode === "design-url") {
			if (!designFile) {
				setError({ title: "Please upload a design PNG file." });
				return;
			}
			if (!url) {
				setError({ title: "Please enter the URL you want to compare." });
				return;
			}
		}

		if (mode === "image-image") {
			if (!designFile) {
				setError({ title: "Please upload a design PNG file." });
				return;
			}
			if (!implFile) {
				setError({ title: "Please upload an implementation PNG file." });
				return;
			}
		}

		if (mode === "url-url") {
			if (!designUrl) {
				setError({
					title:
						"Please enter the design URL, for example a Figma prototype.",
				});
				return;
			}
			if (!implUrl) {
				setError({ title: "Please enter the implementation URL." });
				return;
			}
			if (captureOptions.urlMultiViewport) {
				try {
					const parsed = JSON.parse(
						captureOptions.viewportWidthsJson || "[]"
					);
					if (!Array.isArray(parsed) || parsed.length === 0) {
						setError({
							title:
								"Viewport widths must be a non-empty JSON array of numbers.",
						});
						return;
					}
				} catch {
					setError({ title: "Viewport widths must be valid JSON." });
					return;
				}
			}
		}

		setPendingRunMode(mode);
		comparisonMutation.mutate({
			mode,
			strictness,
			captureOptions,
			designFile,
			implFile,
			url,
			designUrl,
			implUrl,
			viewportWidth,
			activeUrlPair,
		});
	};

	const handleReset = () => {
		setDesignFile(null);
		setImplFile(null);
		setUrl("");
		setUrlEnv(defaultUrlEnv());
		setActiveUrlPair("staging");
		setViewportWidth("1440");
		setCaptureOptions({ ...DEFAULT_CAPTURE_OPTIONS });
		setError(null);
		setResult(null);
		setStyleResult(null);
		setCompareMeta(null);
		setPendingRunMode(null);
		comparisonMutation.reset();
	};

	return (
		<div className={`settings-root theme-${theme}`}>
			<Toaster
				theme={theme === "dark" ? "dark" : "light"}
				richColors
				closeButton
				position="top-center"
			/>
			<div className="settings-window settings-window--premium">
				<header className="settings-titlebar settings-titlebar--premium">
					<div className="traffic-lights">
						<span className="light light-red" />
						<span className="light light-amber" />
						<span className="light light-green" />
					</div>
					<div className="titlebar-center titlebar-brand">
						<span className="titlebar-product">Pixel QA studio</span>
						<span className="titlebar-title titlebar-title--premium">
							Realtime UI Matcher
						</span>
					</div>
					<div className="titlebar-right">
						<span className="titlebar-badge titlebar-badge--premium">
							Prototype · v0.1
						</span>
					</div>
				</header>

				<div className="settings-body">
					<Sidebar activeView={activeView} setActiveView={setActiveView} />

					<main className="settings-content">
						<header className="content-header content-header-premium">
							{activeView === "comparison" && (
								<>
									<p className="content-eyebrow">Capture &amp; compare</p>
									<h1>Comparison</h1>
									<p className="content-lead">
										Sources and workflow in the main area; run options on the
										right. How-to tips sit at the bottom of the sidebar. Capture
										defaults live in Settings.
									</p>
								</>
							)}

							{activeView === "results" && (
								<>
									<p className="content-eyebrow">Analysis</p>
									<h1>Results</h1>
									<p className="content-lead">
										Inspect match score, diff imagery, overlay tools, accessibility
										summary, and style checks in one place.
									</p>
								</>
							)}

							{activeView === "history" && (
								<>
									<p className="content-eyebrow">Timeline</p>
									<h1>History</h1>
									<p className="content-lead">
										Track how scores trend across recent runs and spot regressions
										early.
									</p>
								</>
							)}

							{activeView === "settings" && (
								<>
									<p className="content-eyebrow">Workspace</p>
									<h1>Settings</h1>
									<p className="content-lead">
										Theme, comparison targets, batch viewports, Puppeteer timing,
										capture options, and history size.
									</p>
								</>
							)}

							{activeView === "about" && (
								<>
									<p className="content-eyebrow">Product</p>
									<h1>About</h1>
									<p className="content-lead">
										What Realtime UI Matcher does, who it is for, and how it fits
										into design-to-code and visual QA workflows.
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
								viewportWidth={viewportWidth}
								setViewportWidth={setViewportWidth}
								captureOptions={captureOptions}
								setCaptureOptions={setCaptureOptions}
								theme={theme}
								setTheme={setTheme}
								url={url}
								setUrl={setUrl}
								designUrl={designUrl}
								setDesignUrl={setDesignUrl}
								implUrl={implUrl}
								setImplUrl={setImplUrl}
								activeUrlPair={activeUrlPair}
								setActiveUrlPair={setActiveUrlPair}
								designFile={designFile}
								setDesignFile={setDesignFile}
								implFile={implFile}
								setImplFile={setImplFile}
								loading={loading}
								error={error}
								onOpenSettings={() => setActiveView("settings")}
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
									compareMeta={compareMeta}
									onOpenComparison={() => setActiveView("comparison")}
								/>
							</div>
						)}

						{activeView === "history" && (
							<div className="content-history">
								<HistoryView
									history={history}
									onOpenComparison={() => setActiveView("comparison")}
								/>
							</div>
						)}

						{activeView === "settings" && (
							<SettingsView
								captureOptions={captureOptions}
								setCaptureOptions={setCaptureOptions}
								theme={theme}
								setTheme={setTheme}
								strictness={strictness}
								setStrictness={setStrictness}
								passThreshold={passThreshold}
								setPassThreshold={setPassThreshold}
								viewportWidth={viewportWidth}
								setViewportWidth={setViewportWidth}
								historyLimit={historyLimit}
								setHistoryLimit={setHistoryLimit}
								onResetCaptureDefaults={handleResetCaptureDefaults}
								onResetAllComparisonDefaults={handleResetAllComparisonDefaults}
								projects={projects}
								projectNameInput={projectNameInput}
								setProjectNameInput={setProjectNameInput}
								onSaveProject={handleSaveProject}
								onLoadProject={handleLoadProject}
								onDeleteProject={handleDeleteProject}
							/>
						)}

						{activeView === "about" && <AboutView />}
					</main>
				</div>

				<ComparisonLoadingOverlay visible={loading} mode={pendingRunMode} />
			</div>
		</div>
	);
}
