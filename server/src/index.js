// index.js — local / long-running Node server
import { createApp } from "./app.js";

const app = createApp();

const preferredPort = Number(process.env.PORT) || 4000;
const maxPort = preferredPort + 25;

function listen(port) {
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
