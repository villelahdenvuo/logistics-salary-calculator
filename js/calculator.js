import { linkInputs } from "./storage.js";
import EditableConfigPanel from "./components/EditableConfigPanel.js";
import Results from "./components/Results.js";
import Tabs, { initializeTabs } from "./components/Tabs.js";
import SingleShiftTab from "./components/SingleShiftTab.js";
import CalendarImportTab from "./components/CalendarImportTab.js";
import ConfigToggle from "./components/ConfigToggle.js";
import { defaultShiftDuration, formatCurrency, formatNumber, formatTime } from "./config.js";
import { loadConfig, saveConfig, resetConfig } from "./config-manager.js";
import { initializeIcsImport } from "./ics-handler.js";
import {
	calculateShiftSalary,
	calculateEndTimeFromStart,
	formatDateForInput,
	normalizeToHour,
	shouldIncludeBreak,
	validateShiftTimes,
} from "./calculator-engine.js";

document.addEventListener("DOMContentLoaded", () => {
	// Load current configuration
	let currentConfig = loadConfig();

	// Create tabs
	const tabsContainer = document.getElementById("main-tabs-container");
	const tabs = [
		{
			id: "single-shift",
			label: "Single Shift Calculator",
			content: SingleShiftTab(),
		},
		{
			id: "calendar-import",
			label: "Calendar Import",
			content: CalendarImportTab(),
		},
	];

	// Render tabs
	tabsContainer.innerHTML = Tabs({ tabs, activeTab: "single-shift" });

	// Add global config toggle after tabs
	const configToggleHtml = ConfigToggle({ id: "global" });
	tabsContainer.insertAdjacentHTML("afterend", configToggleHtml);

	// Initialize tabs functionality
	initializeTabs("#main-tabs-container", (activeTabId) => {
		// Handle tab change logic if needed
		console.log("Active tab changed to:", activeTabId);

		// Re-initialize components when switching tabs
		setTimeout(() => {
			if (activeTabId === "single-shift") {
				initializeSingleShiftTab();
			} else if (activeTabId === "calendar-import") {
				initializeCalendarImportTab();
			}
		}, 0);
	});

	// Initialize the default active tab
	let singleShiftInitialized = false;
	let calendarImportInitialized = false;

	setTimeout(() => {
		initializeSingleShiftTab();
		initializeCalendarImportTab();
	}, 0);

	function initializeSingleShiftTab() {
		const shiftStartInput = document.getElementById("shift-start");
		const shiftEndInput = document.getElementById("shift-end");
		const calculateBtn = document.getElementById("calculate-btn");

		if (!shiftStartInput || !shiftEndInput || !calculateBtn) {
			return; // Elements not available yet
		}

		// Prevent multiple initialization
		if (singleShiftInitialized) {
			return;
		}
		singleShiftInitialized = true;

		// Function to automatically calculate salary when both times are available
		const autoCalculateIfReady = () => {
			if (shiftStartInput.value && shiftEndInput.value) {
				calculateBtn.click();
			}
		};

		const calculateEndTime = (e, value, _sourceElement) => {
			const normalizedStartTime = normalizeToHour(value);
			const endTime = calculateEndTimeFromStart(normalizedStartTime, defaultShiftDuration);
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

		// Add input event listeners to normalize times to the hour
		const normalizeTimeInput = (input) => {
			input.addEventListener("input", () => {
				if (input.value) {
					const normalizedDate = normalizeToHour(input.value);
					const formattedValue = formatDateForInput(normalizedDate);
					if (input.value !== formattedValue) {
						input.value = formattedValue;
						input.dispatchEvent(new Event("change"));
					}
				}
			});
		};

		normalizeTimeInput(shiftStartInput);
		normalizeTimeInput(shiftEndInput);

		if (shiftStartInput.value && !shiftEndInput.value) {
			calculateEndTime(null, shiftStartInput.value, shiftStartInput);
		} else if (shiftStartInput.value && shiftEndInput.value) {
			// Auto-calculate if both times are already set
			autoCalculateIfReady();
		}

		calculateBtn.addEventListener("click", () => {
			const shiftStart = normalizeToHour(shiftStartInput.value);
			const shiftEnd = normalizeToHour(shiftEndInput.value);
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
	}

	function initializeCalendarImportTab() {
		// Prevent multiple initialization
		if (calendarImportInitialized) {
			return;
		}
		calendarImportInitialized = true;

		// Initialize ICS import functionality
		const icsContainer = document.querySelector(".ics-import-section");

		if (icsContainer) {
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
		}
	}

	// Make populateConfigPanel globally available for ConfigToggle components
	window.populateConfigPanel = populateConfigPanel;

	function populateConfigPanel(panel) {
		// Render editable configuration panel
		panel.innerHTML = EditableConfigPanel({
			config: currentConfig,
		});

		// Add event listeners for config inputs
		setupConfigEventListeners(panel);
	}

	function setupConfigEventListeners(panel) {
		// Save configuration
		const saveBtn = panel.querySelector("#save-config");
		if (saveBtn) {
			saveBtn.addEventListener("click", saveConfiguration);
		}

		// Reset configuration
		const resetBtn = panel.querySelector("#reset-config");
		if (resetBtn) {
			resetBtn.addEventListener("click", resetConfiguration);
		}

		// Input change handlers
		const configInputs = panel.querySelectorAll(".config-input");
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
			// Re-render all open config panels with default values
			const openPanels = document.querySelectorAll(".config-panel.active");
			openPanels.forEach((panel) => populateConfigPanel(panel));
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

	function displayResults(results, includeBreak, age) {
		// Find results elements within the single shift tab
		const resultsDiv = document.getElementById("results");
		const resultsContent = document.getElementById("results-content");

		if (!resultsDiv || !resultsContent) {
			console.error("Results elements not found");
			return;
		}

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
});
