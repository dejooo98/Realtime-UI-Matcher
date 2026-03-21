import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Tooltip from "@radix-ui/react-tooltip";
import App from "./App";
import { queryClient } from "./lib/queryClient";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
	<StrictMode>
		<Tooltip.Provider delayDuration={280} skipDelayDuration={0}>
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>
		</Tooltip.Provider>
	</StrictMode>
);
