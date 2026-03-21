import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiTarget =
	process.env.VITE_API_PROXY_TARGET || "http://localhost:4000";

const devPort = Number(process.env.VITE_DEV_PORT) || 5174;

export default defineConfig({
	plugins: [react()],
	server: {
		port: devPort,
		strictPort: false,
		proxy: {
			"/api": {
				target: apiTarget,
				changeOrigin: true,
			},
			"/health": {
				target: apiTarget,
				changeOrigin: true,
			},
		},
	},
});
