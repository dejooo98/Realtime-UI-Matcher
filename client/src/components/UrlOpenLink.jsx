/**
 * Safe external link for compared URLs (https/http only in normal use).
 */
export default function UrlOpenLink({ href, children }) {
	if (!href?.trim()) return null;
	const u = href.trim();
	return (
		<a
			className="url-open-link"
			href={u}
			target="_blank"
			rel="noopener noreferrer"
		>
			{children ?? "Open"}
		</a>
	);
}
