import js from "@eslint/js";
import globals from "globals";

export default [
	{ ignores: ["node_modules"] },
	js.configs.recommended,
	{
		files: ["**/*.js"],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: "module",
			globals: globals.node,
		},
		rules: {
			"no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
			"no-empty": ["error", { allowEmptyCatch: true }],
		},
	},
	/* page.evaluate() bodies are browser code but parsed in Node */
	{
		files: ["src/helper.js", "src/capturePageSetup.js"],
		languageOptions: {
			globals: {
				...globals.node,
				...globals.browser,
			},
		},
	},
];
