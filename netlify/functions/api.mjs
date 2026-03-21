/**
 * Netlify Function: Express API (screenshots, diff, style) via serverless-http.
 * Rewrites in netlify.toml send /api/* and /health here.
 */
import serverless from "serverless-http";
import { createApp } from "../../server/src/app.js";
import { fixMultipartLambdaEvent } from "../../server/src/netlifyMultipartEventFix.js";

const app = createApp();
const handle = serverless(app);

export const handler = (event, context) => {
	return handle(fixMultipartLambdaEvent(event), context);
};
