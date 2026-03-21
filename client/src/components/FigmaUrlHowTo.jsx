import { toast } from "sonner";
import {
	buildFigmaEmbedPageUrl,
	isFigmaUrl,
} from "../lib/figmaUrl.js";

/**
 * Shown when Design URL looks like Figma — explains paste vs embed toggle (no iframe code).
 */
export default function FigmaUrlHowTo({ designUrl, onOpenSettings }) {
	if (!designUrl?.trim() || !isFigmaUrl(designUrl)) return null;

	const embedUrl = buildFigmaEmbedPageUrl(designUrl);

	async function copyEmbedUrl() {
		if (!embedUrl) return;
		try {
			await navigator.clipboard.writeText(embedUrl);
			toast.success("Embed URL copied", {
				description:
					"Open it in a browser to see what the server loads when embed mode is on.",
			});
		} catch {
			toast.error("Could not copy — check browser permissions.");
		}
	}

	return (
		<div
			className="figma-howto-card"
			role="region"
			aria-label="Figma instructions for this app"
		>
			<h4 className="figma-howto-title">Figma — how to use it here</h4>
			<p className="figma-howto-lead">
				You do <strong>not</strong> paste embed HTML or an iframe. Paste the normal
				Figma link from your address bar (same as when the file is open in Chrome).
			</p>
			<ol className="figma-howto-list">
				<li>
					<strong>Most reliable:</strong> In Figma, select the frame →{" "}
					<strong>Export</strong> (PNG) at your test width, then switch this app to{" "}
					<strong>Design vs URL</strong> and upload the PNG. That avoids Figma
					blocking server screenshots.
				</li>
				<li>
					<strong>URL vs URL:</strong> Keep your{" "}
					<code className="figma-howto-code">figma.com/design/…</code> or{" "}
					<code className="figma-howto-code">…/proto/…</code> link in{" "}
					<strong>Design URL</strong>. In Figma use <strong>Share</strong> → set{" "}
					<strong>Anyone with the link</strong> to <strong>can view</strong>.
				</li>
				<li>
					<strong>“Embed” in Settings:</strong> Open{" "}
					<button
						type="button"
						className="figma-howto-linkbtn"
						onClick={onOpenSettings}
					>
						Settings
					</button>{" "}
					→ Capture → turn on <strong>Figma embed URL for capture</strong>. The
					server then opens Figma’s <em>embed player</em> for that same link — you
					still don’t paste anything extra.
				</li>
			</ol>
			<p className="figma-howto-note">
				If you still get <strong>403 / blocked</strong>, Figma is blocking automated
				capture from your network — use PNG export (step 1).
			</p>
			<div className="figma-howto-actions">
				<button
					type="button"
					className="btn-secondary figma-howto-copy"
					onClick={copyEmbedUrl}
				>
					Copy embed URL (debug)
				</button>
				<span className="figma-howto-actions-hint">
					Optional: paste in a browser to verify the embed player loads.
				</span>
			</div>
		</div>
	);
}
