/**
 * Configuration Manager module
 * Handles loading, saving, and merging configuration values with localStorage
 */

import {
	salaryConfig as defaultSalaryConfig,
	tyelRates as defaultTyelRates,
	tvmRate as defaultTvmRate,
} from "./config.js";

const CONFIG_STORAGE_KEY = "logistics-calculator-config";

/**
 * Default configuration structure
 */
const defaultConfig = {
	salaryConfig: defaultSalaryConfig,
	tyelRates: defaultTyelRates,
	tvmRate: defaultTvmRate,
};

/**
 * Load configuration from localStorage, merging with defaults
 * @returns {object} Complete configuration object
 */
export function loadConfig() {
	try {
		const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			return mergeConfig(defaultConfig, parsed);
		}
	} catch (error) {
		console.warn("Failed to load configuration from localStorage:", error);
	}

	return { ...defaultConfig };
}

/**
 * Save configuration to localStorage
 * @param {object} config - Configuration object to save
 */
export function saveConfig(config) {
	try {
		localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
	} catch (error) {
		console.error("Failed to save configuration to localStorage:", error);
	}
}

/**
 * Reset configuration to defaults
 */
export function resetConfig() {
	try {
		localStorage.removeItem(CONFIG_STORAGE_KEY);
	} catch (error) {
		console.error("Failed to reset configuration:", error);
	}
	return { ...defaultConfig };
}

/**
 * Deep merge two configuration objects
 * @param {object} defaultConfig - Default configuration
 * @param {object} userConfig - User configuration
 * @returns {object} Merged configuration
 */
function mergeConfig(defaultConfig, userConfig) {
	const merged = { ...defaultConfig };

	// Merge salaryConfig
	if (userConfig.salaryConfig) {
		merged.salaryConfig = {
			...defaultConfig.salaryConfig,
			...userConfig.salaryConfig,
		};

		// Merge extras if they exist
		if (userConfig.salaryConfig.extras) {
			merged.salaryConfig.extras = {
				...defaultConfig.salaryConfig.extras,
			};

			// Only merge the rate property of extras, keep the original functions
			Object.keys(defaultConfig.salaryConfig.extras).forEach((key) => {
				if (userConfig.salaryConfig.extras[key]?.rate !== undefined) {
					merged.salaryConfig.extras[key] = {
						...defaultConfig.salaryConfig.extras[key],
						rate: userConfig.salaryConfig.extras[key].rate,
					};
				}
			});
		}
	}

	// Merge tyelRates
	if (userConfig.tyelRates) {
		merged.tyelRates = {
			...defaultConfig.tyelRates,
			...userConfig.tyelRates,
		};
	}

	// Merge tvmRate
	if (userConfig.tvmRate !== undefined) {
		merged.tvmRate = userConfig.tvmRate;
	}

	return merged;
}

/**
 * Update a specific configuration value
 * @param {string} path - Dot notation path to the config value (e.g., "salaryConfig.baseSalary")
 * @param {any} value - New value
 * @returns {object} Updated configuration
 */
export function updateConfigValue(path, value) {
	const config = loadConfig();
	const keys = path.split(".");
	let current = config;

	// Navigate to the parent of the target property
	for (let i = 0; i < keys.length - 1; i++) {
		if (!current[keys[i]]) {
			current[keys[i]] = {};
		}
		current = current[keys[i]];
	}

	// Set the value
	const lastKey = keys[keys.length - 1];
	current[lastKey] = value;

	saveConfig(config);
	return config;
}

/**
 * Get a specific configuration value
 * @param {string} path - Dot notation path to the config value
 * @returns {any} Configuration value
 */
export function getConfigValue(path) {
	const config = loadConfig();
	const keys = path.split(".");
	let current = config;

	for (const key of keys) {
		if (current[key] === undefined) {
			return undefined;
		}
		current = current[key];
	}

	return current;
}
