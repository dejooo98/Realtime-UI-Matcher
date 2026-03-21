/**
 * Netlify Function: Express API (screenshots, diff, style) via serverless-http.
 * Rewrites in netlify.toml send /api/* and /health here.
 */
import serverless from "serverless-http";
import { createApp } from "../../server/src/app.js";

const app = createApp();
export const handler = serverless(app);
