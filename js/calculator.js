import { linkInputs } from "./storage.js";
import EditableConfigPanel from "./components/EditableConfigPanel.js";
import Results from "./components/Results.js";
import { defaultShiftDuration, formatCurrency, formatNumber, formatTime } from "./config.js";
import { loadConfig, saveConfig, resetConfig } from "./config-manager.js";
import { initializeIcsImport } from "./ics-handler.js";
import {
	calculateShiftSalary,
	calculateEndTimeFromStart,
	formatDateForInput,
	shouldIncludeBreak,
	validateShiftTimes,
} from "./calculator-engine.js";

document.addEventListener("DOMContentLoaded", () => {
	const shiftStartInput = document.getElementById("shift-start");
	const shiftEndInput = document.getElementById("shift-end");
	const calculateBtn = document.getElementById("calculate-btn");
	const resultsDiv = document.getElementById("results");
	const resultsContent = document.getElementById("results-content");
	const toggleConfigBtn = document.getElementById("toggle-config");
	const configPanel = document.getElementById("config-panel");

	// Load current configuration
	let currentConfig = loadConfig();

	// Toggle configuration panel
	toggleConfigBtn.addEventListener("click", () => {
		configPanel.classList.toggle("active");
		if (configPanel.classList.contains("active")) {
			toggleConfigBtn.textContent = "Hide Configuration Settings ▲";
			toggleConfigBtn.classList.add("active");
			populateConfigPanel();
		} else {
			toggleConfigBtn.textContent = "Edit Configuration Settings ▼";
			toggleConfigBtn.classList.remove("active");
		}
	});

	function populateConfigPanel() {
		// Render editable configuration panel
		configPanel.innerHTML = EditableConfigPanel({
			config: currentConfig,
		});

		// Add event listeners for config inputs
		setupConfigEventListeners();
	}

	function setupConfigEventListeners() {
		// Save configuration
		const saveBtn = document.getElementById("save-config");
		if (saveBtn) {
			saveBtn.addEventListener("click", saveConfiguration);
		}

		// Reset configuration
		const resetBtn = document.getElementById("reset-config");
		if (resetBtn) {
			resetBtn.addEventListener("click", resetConfiguration);
		}

		// Input change handlers
		const configInputs = document.querySelectorAll(".config-input");
		configInputs.forEach((input) => {
			input.addEventListener("input", handleConfigInputChange);
		});
	}

	function handleConfigInputChange(event) {
		const input = event.target;
		const path = input.dataset.configPath;
		let value;

		// Handle age as integer, others as float
		if (path === "age") {
			value = parseInt(input.value) || 18;
		} else {
			value = parseFloat(input.value) || 0;
		}

		// Update the current config in memory (for immediate feedback)
		updateConfigInMemory(path, value);
	}

	function updateConfigInMemory(path, value) {
		const keys = path.split(".");
		let current = currentConfig;

		for (let i = 0; i < keys.length - 1; i++) {
			current = current[keys[i]];
		}

		const lastKey = keys[keys.length - 1];
		current[lastKey] = value;
	}

	function saveConfiguration() {
		try {
			saveConfig(currentConfig);
			showConfigStatus("Configuration saved successfully!", "success");
		} catch (error) {
			showConfigStatus("Failed to save configuration", "error");
			console.error("Save config error:", error);
		}
	}

	function resetConfiguration() {
		try {
			currentConfig = resetConfig();
			populateConfigPanel(); // Re-render with default values
			showConfigStatus("Configuration reset to defaults", "success");
		} catch (error) {
			showConfigStatus("Failed to reset configuration", "error");
			console.error("Reset config error:", error);
		}
	}

	function showConfigStatus(message, type) {
		const statusEl = document.getElementById("config-status");
		if (statusEl) {
			statusEl.textContent = message;
			statusEl.className = `config-status ${type}`;

			// Hide after 3 seconds
			setTimeout(() => {
				statusEl.style.display = "none";
			}, 3000);
		}
	}

	// Function to automatically calculate salary when both times are available
	const autoCalculateIfReady = () => {
		if (shiftStartInput.value && shiftEndInput.value) {
			calculateBtn.click();
		}
	};

	const calculateEndTime = (e, value, _sourceElement) => {
		const endTime = calculateEndTimeFromStart(value, defaultShiftDuration);
		if (endTime) {
			shiftEndInput.value = formatDateForInput(endTime);
			shiftEndInput.dispatchEvent(new Event("change"));

			// Since we just set the end time and we know start time exists, trigger calculation
			calculateBtn.click();
		}
	};

	const handleEndTimeChange = (_e, _value, _sourceElement) => {
		// Auto-calculate when end time changes and start time is also set
		autoCalculateIfReady();
	};

	linkInputs([
		{
			element: shiftStartInput,
			storageKey: "shiftStart",
			options: {
				onChange: calculateEndTime,
			},
		},
		{
			element: shiftEndInput,
			storageKey: "shiftEnd",
			options: {
				onChange: handleEndTimeChange,
			},
		},
	]);

	if (shiftStartInput.value && !shiftEndInput.value) {
		calculateEndTime(null, shiftStartInput.value, shiftStartInput);
	} else if (shiftStartInput.value && shiftEndInput.value) {
		// Auto-calculate if both times are already set
		autoCalculateIfReady();
	}

	calculateBtn.addEventListener("click", () => {
		const shiftStart = new Date(shiftStartInput.value);
		const shiftEnd = new Date(shiftEndInput.value);
		const age = currentConfig.age || 18; // Get age from configuration

		const validation = validateShiftTimes(shiftStart, shiftEnd);
		if (!validation.isValid) {
			alert(validation.message);
			return;
		}

		const includeBreak = shouldIncludeBreak(
			shiftStart,
			shiftEnd,
			currentConfig.salaryConfig.breakDuration,
		);
		const results = calculateShiftSalary(
			shiftStart,
			shiftEnd,
			currentConfig.salaryConfig,
			includeBreak,
			age,
			currentConfig.tyelRates,
			currentConfig.tvmRate,
		);

		displayResults(results, includeBreak, age);
	});

	function displayResults(results, includeBreak, age) {
		resultsContent.innerHTML = Results({
			results,
			config: currentConfig.salaryConfig,
			includeBreak,
			age,
			formatTime,
			formatCurrency,
			formatNumber,
		});

		resultsDiv.classList.add("active");

		const breakdownToggle = document.querySelector(".breakdown-toggle");
		const hourlyBreakdownContainer = document.querySelector(".hourly-breakdown-container");

		if (breakdownToggle && hourlyBreakdownContainer) {
			breakdownToggle.addEventListener("click", () => {
				breakdownToggle.classList.toggle("active");
				hourlyBreakdownContainer.classList.toggle("active");
			});
		}
	}

	// Initialize ICS import functionality with component-based approach
	const icsContainer = document.querySelector(".ics-import-section");

	// Create simple storage handler for ICS URL
	const icsUrlStorage = {
		save() {
			// This will be called by the handler when URL changes
		},
		load: () => localStorage.getItem("icsUrl") || "",
		clear: () => localStorage.removeItem("icsUrl"),
	};

	const icsImportHandler = initializeIcsImport(icsContainer, icsUrlStorage);

	// Update the save method to reference the handler
	icsUrlStorage.save = () => {
		const url = icsImportHandler.getUrl();
		if (url) localStorage.setItem("icsUrl", url);
	};
});
