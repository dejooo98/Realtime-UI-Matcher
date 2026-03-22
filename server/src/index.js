// index.js — HTTP server (local dev + production e.g. Render)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createApp } from "./app.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, "../../client/dist");

const app = createApp();

const isProduction =
	process.env.NODE_ENV === "production" || process.env.RENDER === "true";

if (isProduction && fs.existsSync(clientDist)) {
	app.use(
		express.static(clientDist, {
			index: false,
			maxAge: "1h",
		})
	);
	app.get("*", (req, res, next) => {
		if (req.path.startsWith("/api") || req.path === "/health") {
			return next();
		}
		res.sendFile(path.join(clientDist, "index.html"), (err) => {
			if (err) next(err);
		});
	});
} else if (isProduction) {
	console.warn(
		`client/dist not found at ${clientDist}; running API only. Build the client first.`
	);
}

const preferredPort = Number(process.env.PORT) || 4000;
const maxPort = preferredPort + 25;

function listen(port) {
	if (isProduction) {
		app.listen(port, "0.0.0.0", () => {
			console.log(`Realtime UI Matcher listening on port ${port}`);
		});
		return;
	}

	if (port > maxPort) {
		console.error(
			`No free port found between ${preferredPort} and ${maxPort}. Stop other processes using those ports.`
		);
		process.exit(1);
	}

	const server = app.listen(port, () => {
		console.log(
			`Realtime UI Matcher server listening on http://localhost:${port}`
		);
	});

	server.on("error", (err) => {
		if (err.code === "EADDRINUSE") {
			console.warn(`Port ${port} in use, trying ${port + 1}...`);
			listen(port + 1);
		} else {
			console.error(err);
			process.exit(1);
		}
	});
}

listen(preferredPort);
