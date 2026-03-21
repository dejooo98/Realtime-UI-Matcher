/**
 * Inline validation / API error banner. Use `title` for the main line and
 * `detail` for secondary text (e.g. server `details` when different from `error`).
 */
export default function ErrorAlert({ title, detail }) {
	if (title == null || title === "") return null;

	return (
		<div className="alert alert-error" role="alert">
			<div className="alert-error-title">{title}</div>
			{detail ? <div className="alert-error-detail">{detail}</div> : null}
		</div>
	);
}
