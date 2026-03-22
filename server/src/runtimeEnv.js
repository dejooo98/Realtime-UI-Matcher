/**
 * Detect Lambda-style serverless runtimes (NETLIFY, AWS_*, or
 * REALTIME_UI_MATCHER_SERVERLESS=1 for explicit opt-in).
 */
export function isServerlessRuntime() {
	return (
		process.env.REALTIME_UI_MATCHER_SERVERLESS === "1" ||
		Boolean(process.env.NETLIFY && String(process.env.NETLIFY) !== "false") ||
		Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
		Boolean(process.env.AWS_EXECUTION_ENV) ||
		Boolean(process.env.LAMBDA_TASK_ROOT)
	);
}
