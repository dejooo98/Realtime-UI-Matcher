/**
 * Picks free ports for API + Vite (avoids EADDRINUSE) and points the Vite
 * proxy at the API when the API is not on 4000.
 */
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import getPort, { portNumbers } from "get-port";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const apiPort = await getPort({ port: portNumbers(4000, 4020) });
const uiPort = await getPort({ port: portNumbers(5174, 5190) });

const env = {
	...process.env,
	PORT: String(apiPort),
	VITE_API_PROXY_TARGET: `http://127.0.0.1:${apiPort}`,
	VITE_DEV_PORT: String(uiPort),
};

console.log(
	`\nRealtime UI Matcher dev\n  API → http://127.0.0.1:${apiPort}\n  UI  → http://127.0.0.1:${uiPort}\n`
);

const opts = { cwd: root, env, stdio: "inherit" };

const server = spawn("npm", ["run", "dev", "-w", "server"], opts);
const client = spawn("npm", ["run", "dev", "-w", "client"], opts);

let shuttingDown = false;
function shutdown(signal) {
	if (shuttingDown) return;
	shuttingDown = true;
	try {
		server.kill(signal);
	} catch {
		/* ignore */
	}
	try {
		client.kill(signal);
	} catch {
		/* ignore */
	}
	setTimeout(() => process.exit(0), 500).unref();
}

process.on("SIGINT", () => shutdown("SIGTERM"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

function forwardExit(proc, other) {
	proc.on("exit", (code, sig) => {
		if (shuttingDown) return;
		if (sig) shutdown("SIGTERM");
		else if (code !== 0) {
			try {
				other.kill("SIGTERM");
			} catch {
				/* ignore */
			}
			process.exit(code ?? 1);
		}
	});
}

forwardExit(server, client);
forwardExit(client, server);
