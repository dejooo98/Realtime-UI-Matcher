/**
 * Detect Netlify Functions / AWS Lambda. Netlify does not always set NETLIFY or
 * AWS_LAMBDA_FUNCTION_NAME before app code runs; the Netlify entry sets
 * REALTIME_UI_MATCHER_SERVERLESS=1 (see netlify/functions/api.js).
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
