import clsx from "clsx";
import HowToUseCard from "./HowToUseCard.jsx";
import {
	IconAbout,
	IconBrandMark,
	IconCompare,
	IconHistory,
	IconResults,
	IconSettings,
} from "./icons/NavIcons.jsx";

function NavItem({
	icon: Icon,
	label,
	active,
	onClick,
	disabled,
	pill,
}) {
	return (
		<button
			type="button"
			className={clsx("sidebar-item", active && "sidebar-item-active")}
			onClick={onClick}
			disabled={disabled}
		>
			<span className="sidebar-item-icon" aria-hidden>
				<Icon />
			</span>
			<span className="sidebar-item-label">{label}</span>
			{pill}
		</button>
	);
}

export default function Sidebar({ activeView, setActiveView }) {
	return (
		<aside className="settings-sidebar">
			<div className="sidebar-brand">
				<div className="sidebar-brand-icon" aria-hidden>
					<IconBrandMark />
				</div>
				<div className="sidebar-brand-text">
					<div className="sidebar-brand-mark">RUM</div>
					<div className="sidebar-brand-name">Workspace</div>
				</div>
			</div>

			<div className="sidebar-main">
				<div className="sidebar-section">
					<div className="sidebar-section-label">General</div>

					<NavItem
						icon={IconCompare}
						label="Comparison"
						active={activeView === "comparison"}
						onClick={() => setActiveView("comparison")}
					/>

					<NavItem
						icon={IconResults}
						label="Results"
						active={activeView === "results"}
						onClick={() => setActiveView("results")}
					/>

					<NavItem
						icon={IconHistory}
						label="History"
						active={activeView === "history"}
						onClick={() => setActiveView("history")}
					/>

					<NavItem
						icon={IconSettings}
						label="Settings"
						active={activeView === "settings"}
						onClick={() => setActiveView("settings")}
					/>

					<NavItem
						icon={IconAbout}
						label="About"
						active={activeView === "about"}
						onClick={() => setActiveView("about")}
					/>
				</div>

				<HowToUseCard className="howto-use-card--sidebar" />
			</div>

			<footer className="sidebar-footer">
				<p className="sidebar-footer-text">
					Developed by{" "}
					<a
						className="sidebar-footer-link"
						href="https://dejomarkovic.com"
						target="_blank"
						rel="noopener noreferrer"
					>
						Dejan Markovic
					</a>
				</p>
			</footer>
		</aside>
	);
}
