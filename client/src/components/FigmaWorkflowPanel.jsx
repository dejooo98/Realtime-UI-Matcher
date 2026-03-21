import { WORKFLOW_LINKS } from "../config/workflowLinks";

/**
 * Curated workflow notes inspired by Pixelay (Figma plugin) and in-browser overlay
 * tools (see Medium piece on comparing live builds to Figma).
 */
export default function FigmaWorkflowPanel() {
	return (
		<details className="workflow-details workflow-details--embedded">
			<summary className="workflow-details-summary">
				Tips &amp; links — Pixelay, Over.fig, and related workflows
			</summary>
			<div className="workflow-details-body">
				<ul className="workflow-list">
					<li>
						Export a PNG (or use a frame) at the same width as your test viewport so
						pixels line up with the screenshot.
					</li>
					<li>
						<strong>Pixelay</strong> (Figma community plugin) supports multi-page /
						multi-viewport compares, transparency, split, and localhost workflows
						with HMR — useful patterns we mirror here with{" "}
						<strong>wipe</strong>, <strong>blend</strong>, and batch viewports.
					</li>
					<li className="workflow-links">
						<a
							href={WORKFLOW_LINKS.pixelayPlugin}
							target="_blank"
							rel="noopener noreferrer"
						>
							Pixelay on Figma Community
						</a>
						{" · "}
						<a
							href={WORKFLOW_LINKS.pixelayDocs}
							target="_blank"
							rel="noopener noreferrer"
						>
							Pixelay docs (Hypermatic)
						</a>
					</li>
					<li>
						The Medium article on one-click Figma vs web compare covers tools like{" "}
						<strong>Over.fig</strong> (semi-transparent design over a live tab). Our
						server-side compare is complementary: pixel diff, heatmap, and CI-friendly
						URLs.
					</li>
					<li className="workflow-links">
						<a
							href={WORKFLOW_LINKS.overfigArticle}
							target="_blank"
							rel="noopener noreferrer"
						>
							Medium: compare live website builds with Figma designs
						</a>
					</li>
					<li>
						For local dev behind a tunnel, expose an <strong>https://</strong> URL
						your deployment can reach; this app blocks private IPs and SSRF-prone
						targets by policy.
					</li>
				</ul>
			</div>
		</details>
	);
}
