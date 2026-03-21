/**
 * Netlify Function entry — MUST be CommonJS.
 * Netlify’s Lambda shim uses require(); ESM handlers cause ERR_REQUIRE_ESM.
 * The Express app stays ESM and is loaded via dynamic import().
 */
"use strict";

process.env.REALTIME_UI_MATCHER_SERVERLESS = "1";

const serverless = require("serverless-http");

let cachedHandle = null;

async function getHandle() {
	if (!cachedHandle) {
		const { createApp } = await import("../../server/src/app.js");
		const app = createApp();
		cachedHandle = serverless(app);
	}
	return cachedHandle;
}

exports.handler = async (event, context) => {
	const { fixMultipartLambdaEvent } = await import(
		"../../server/src/netlifyMultipartEventFix.js"
	);
	const handle = await getHandle();
	return handle(fixMultipartLambdaEvent(event), context);
};
