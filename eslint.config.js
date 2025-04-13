// eslint.config.js
import prettierConfig from "eslint-config-prettier";

export default [
	{
		// Global ignores
		ignores: ["node_modules/**", ".git/**", "dist/**"],
	},
	{
		// Base config for all JavaScript files
		files: ["**/*.js"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: {
				document: "readonly",
				window: "readonly",
				console: "readonly",
				setTimeout: "readonly",
				clearTimeout: "readonly",
				setInterval: "readonly",
				clearInterval: "readonly",
				fetch: "readonly",
				alert: "readonly",
			},
		},
		linterOptions: {
			reportUnusedDisableDirectives: true,
		},
		rules: {
			// Possible Problems
			"no-duplicate-imports": "error",
			"no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
			"no-const-assign": "error",
			"no-dupe-args": "error",
			"no-dupe-class-members": "error",
			"no-dupe-else-if": "error",
			"no-dupe-keys": "error",
			"no-unreachable": "warn",
			"no-use-before-define": ["error", { functions: false, classes: true }],

			// Suggestions
			camelcase: ["warn", { properties: "never" }],
			eqeqeq: ["warn", "always"],
			"no-var": "warn",
			"prefer-const": "warn",
			"prefer-arrow-callback": "warn",
			"arrow-body-style": ["warn", "as-needed"],
		},
	},
	prettierConfig,
];
