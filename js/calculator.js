import { linkInputs } from "./storage.js";
import ConfigPanel from "./components/ConfigPanel.js";
import Results from "./components/Results.js";
import {
	defaultShiftDuration,
	tyelRates,
	tvmRate,
	salaryConfig,
	formatCurrency,
	formatNumber,
	formatTime,
} from "./config.js";
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
	const ageInput = document.getElementById("age");
	const calculateBtn = document.getElementById("calculate-btn");
	const resultsDiv = document.getElementById("results");
	const resultsContent = document.getElementById("results-content");
	const toggleConfigBtn = document.getElementById("toggle-config");
	const configPanel = document.getElementById("config-panel");

	toggleConfigBtn.addEventListener("click", () => {
		configPanel.classList.toggle("active");
		if (configPanel.classList.contains("active")) {
			toggleConfigBtn.textContent = "Hide Configuration Values ▲";
			toggleConfigBtn.classList.add("active");
			populateConfigPanel();
		} else {
			toggleConfigBtn.textContent = "Show Configuration Values ▼";
			toggleConfigBtn.classList.remove("active");
		}
	});

	function populateConfigPanel() {
		configPanel.innerHTML = ConfigPanel({
			config: salaryConfig,
			tyelRates,
			tvmRate,
			formatCurrency,
		});
	}

	const calculateEndTime = (e, value, _sourceElement) => {
		const endTime = calculateEndTimeFromStart(value, defaultShiftDuration);
		if (endTime) {
			shiftEndInput.value = formatDateForInput(endTime);
			shiftEndInput.dispatchEvent(new Event("change"));
		}
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
		},
		{
			element: ageInput,
			storageKey: "age",
		},
	]);

	if (shiftStartInput.value && !shiftEndInput.value) {
		calculateEndTime(null, shiftStartInput.value, shiftStartInput);
	}

	calculateBtn.addEventListener("click", () => {
		const shiftStart = new Date(shiftStartInput.value);
		const shiftEnd = new Date(shiftEndInput.value);
		const age = parseInt(ageInput.value) || 18;

		const validation = validateShiftTimes(shiftStart, shiftEnd);
		if (!validation.isValid) {
			alert(validation.message);
			return;
		}

		const includeBreak = shouldIncludeBreak(shiftStart, shiftEnd, salaryConfig.breakDuration);
		const results = calculateShiftSalary(shiftStart, shiftEnd, salaryConfig, includeBreak, age);

		displayResults(results, includeBreak, age);
	});

	if (shiftStartInput.value && shiftEndInput.value) {
		calculateBtn.click();
	}

	function displayResults(results, includeBreak, age) {
		resultsContent.innerHTML = Results({
			results,
			config: salaryConfig,
			includeBreak,
			age,
			formatTime,
			formatCurrency,
			formatNumber,
		});

		resultsDiv.classList.add("active");

		const breakdownToggle = document.querySelector(".breakdown-toggle");
		const hourlyBreakdownContainer = document.querySelector(".hourly-breakdown-container");

		breakdownToggle.addEventListener("click", () => {
			breakdownToggle.classList.toggle("active");
			hourlyBreakdownContainer.classList.toggle("active");
		});
	}
});
