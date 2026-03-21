/**
 * Netlify Function: Express API (screenshots, diff, style) via serverless-http.
 * Rewrites in netlify.toml send /api/* and /health here.
 *
 * This folder has package.json "type":"module" so the handler loads as ESM.
 * A .mjs file was previously required() from a CJS shim and crashed at runtime.
 */
import "./preamble.js";
import serverless from "serverless-http";
import { createApp } from "../../server/src/app.js";
import { fixMultipartLambdaEvent } from "../../server/src/netlifyMultipartEventFix.js";

const app = createApp();
const handle = serverless(app);

export const handler = (event, context) => {
	return handle(fixMultipartLambdaEvent(event), context);
};
