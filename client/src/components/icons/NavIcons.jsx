/** Inline nav icons — stroke uses currentColor for theme/active states */

const base = {
	width: 20,
	height: 20,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 2,
	strokeLinecap: "round",
	strokeLinejoin: "round",
	"aria-hidden": true,
};

export function IconCompare() {
	return (
		<svg {...base}>
			<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h2" />
			<path d="M15 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2" />
			<path d="M12 3v18" />
		</svg>
	);
}

export function IconResults() {
	return (
		<svg {...base}>
			<path d="M3 3v18h18" />
			<path d="M7 16l4-4 4 4 5-7" />
		</svg>
	);
}

export function IconHistory() {
	return (
		<svg {...base}>
			<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
			<path d="M3 3v5h5" />
			<path d="M12 7v5l4 2" />
		</svg>
	);
}

export function IconSettings() {
	return (
		<svg {...base}>
			<line x1="4" y1="21" x2="4" y2="14" />
			<line x1="4" y1="10" x2="4" y2="3" />
			<line x1="12" y1="21" x2="12" y2="12" />
			<line x1="12" y1="8" x2="12" y2="3" />
			<line x1="20" y1="21" x2="20" y2="16" />
			<line x1="20" y1="12" x2="20" y2="3" />
			<line x1="1" y1="14" x2="7" y2="14" />
			<line x1="9" y1="8" x2="15" y2="8" />
			<line x1="17" y1="16" x2="23" y2="16" />
		</svg>
	);
}

export function IconAbout() {
	return (
		<svg {...base}>
			<circle cx="12" cy="12" r="10" />
			<path d="M12 16v-4" />
			<path d="M12 8h.01" />
		</svg>
	);
}

export function IconTeams() {
	return (
		<svg {...base}>
			<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
			<circle cx="9" cy="7" r="4" />
			<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
			<path d="M16 3.13a4 4 0 0 1 0 7.75" />
		</svg>
	);
}

export function IconBrandMark() {
	return (
		<svg
			width={28}
			height={28}
			viewBox="0 0 32 32"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden
		>
			<rect width="32" height="32" rx="9" fill="url(#rumGrad)" />
			<path
				stroke="#fff"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M9 10h6v12H9V10zm8 4h6v8h-6v-8z"
			/>
			<defs>
				<linearGradient id="rumGrad" x1="6" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
					<stop stopColor="#0ea5e9" />
					<stop offset="1" stopColor="#007AFF" />
				</linearGradient>
			</defs>
		</svg>
	);
}
