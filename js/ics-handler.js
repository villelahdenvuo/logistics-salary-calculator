/**
 * ICS Import Handler Module
 * Manages state and DOM interactions for ICS import functionality
 */

import { fetchIcsData, parseIcsData, groupShiftsByWeek, setGlobalShifts } from "./ics-import.js";
import IcsImportSection from "./components/IcsImportSection.js";

/**
 * ICS Import Handler class
 */
export class IcsImportHandler {
	constructor(container, storageHandler = null) {
		this.container = container;
		this.storageHandler = storageHandler;
		this.state = {
			icsUrl: "",
			isLoading: false,
			message: "",
			messageType: "success",
			weeklyShifts: {},
			totalShifts: 0,
			shifts: [],
		};

		this.init();
	}

	init() {
		this.render();
		this.attachEventListeners();

		// Load URL from storage if available
		if (this.storageHandler) {
			const savedUrl = this.storageHandler.load();
			if (savedUrl) {
				this.setState({ icsUrl: savedUrl });
			}
		}
	}

	setState(newState) {
		this.state = { ...this.state, ...newState };
		this.render();
	}

	render() {
		this.container.innerHTML = IcsImportSection(this.state);
		this.attachEventListeners();
	}

	attachEventListeners() {
		const urlInput = this.container.querySelector("#ics-url");
		const fetchButton = this.container.querySelector("#fetch-ics-btn");

		if (urlInput && fetchButton) {
			// Remove existing listeners by cloning the button
			const newFetchButton = fetchButton.cloneNode(true);
			fetchButton.parentNode.replaceChild(newFetchButton, fetchButton);

			// URL input change handler
			urlInput.addEventListener("input", (e) => {
				this.setState({ icsUrl: e.target.value });
				if (this.storageHandler) {
					this.storageHandler.save();
				}
			});

			// Fetch button click handler
			newFetchButton.addEventListener("click", () => this.handleFetch());
		}

		// Attach shift toggle listeners
		this.attachShiftToggleListeners();
		// Attach week toggle listeners
		this.attachWeekToggleListeners();
	}

	attachShiftToggleListeners() {
		const shiftToggles = this.container.querySelectorAll(".shift-toggle");
		shiftToggles.forEach((toggle) => {
			toggle.addEventListener("change", (e) => {
				const shiftBlock = toggle.closest(".shift-block");
				const shiftId = shiftBlock ? shiftBlock.dataset.shiftId : null;

				if (shiftId) {
					const shiftIndex = this.state.shifts.findIndex((shift) => shift.id === shiftId);
					if (shiftIndex !== -1) {
						this.state.shifts[shiftIndex].isEnabled = e.target.checked;
						shiftBlock.className = `shift-block ${e.target.checked ? "enabled" : "disabled"}`;
						// Update global shifts
						setGlobalShifts(this.state.shifts);

						// Update week toggle state
						this.updateWeekToggleState(toggle);
					}
				}
			});
		});
	}

	updateWeekToggleState(shiftToggle) {
		const weekRow = shiftToggle.closest(".week-row");
		if (!weekRow) return;

		const weekToggle = weekRow.querySelector(".week-toggle");
		const allShiftToggles = weekRow.querySelectorAll(".shift-toggle");

		if (!weekToggle || allShiftToggles.length === 0) return;

		const checkedShifts = Array.from(allShiftToggles).filter((toggle) => toggle.checked);
		const allChecked = checkedShifts.length === allShiftToggles.length;
		const someChecked = checkedShifts.length > 0;

		weekToggle.checked = allChecked;
		weekToggle.indeterminate = someChecked && !allChecked;
	}

	attachWeekToggleListeners() {
		const weekToggles = this.container.querySelectorAll(".week-toggle");
		weekToggles.forEach((toggle) => {
			toggle.addEventListener("change", (e) => {
				const weekRow = e.target.closest(".week-row");
				if (!weekRow) return;

				const isChecked = e.target.checked;
				const shiftToggles = weekRow.querySelectorAll(".shift-toggle");

				// Update all shift toggles in this week
				shiftToggles.forEach((shiftToggle) => {
					if (shiftToggle.checked !== isChecked) {
						shiftToggle.checked = isChecked;
						// Find the shift index and update the data
						const shiftBlock = shiftToggle.closest(".shift-block");
						const shiftId = shiftBlock ? shiftBlock.dataset.shiftId : null;

						if (shiftId) {
							const shiftIndex = this.state.shifts.findIndex((shift) => shift.id === shiftId);
							if (shiftIndex !== -1) {
								this.state.shifts[shiftIndex].isEnabled = isChecked;
								shiftBlock.className = `shift-block ${isChecked ? "enabled" : "disabled"}`;
							}
						}
					}
				});

				// Update global shifts
				setGlobalShifts(this.state.shifts);
			});
		});
	}

	async handleFetch() {
		const icsUrl = this.state.icsUrl.trim();

		if (!icsUrl) {
			this.setState({
				message: "Please enter a valid ICS file URL",
				messageType: "error",
				weeklyShifts: {},
				totalShifts: 0,
			});
			return;
		}

		try {
			this.setState({
				isLoading: true,
				message: "",
				messageType: "success",
			});

			// Save URL to storage if handler is provided
			if (this.storageHandler) {
				this.storageHandler.save();
			}

			console.log("🚀 Starting ICS fetch...");
			const result = await fetchIcsData(icsUrl);

			// Update button text if proxy was used
			if (result.usedProxy) {
				this.setState({
					buttonText: "Retrying with proxy...",
				});
			}

			console.log("🚀 Beginning ICS parsing...");
			const shifts = parseIcsData(result.data);
			console.log("🚀 Parsed shifts:", shifts);

			console.log("🚀 Grouping shifts by week...");
			const weeklyShifts = groupShiftsByWeek(shifts);
			console.log("🚀 Weekly shifts:", weeklyShifts);

			// Store shifts globally and in state
			setGlobalShifts(shifts);

			const successMessage = result.usedProxy
				? "ICS file fetched successfully via CORS proxy!"
				: "ICS file fetched successfully!";

			this.setState({
				isLoading: false,
				buttonText: "Fetch ICS Data",
				message: successMessage,
				messageType: "success",
				weeklyShifts,
				totalShifts: shifts.length,
				shifts,
			});

			console.log("✅ ICS import completed successfully");
		} catch (error) {
			console.error("❌ Error fetching ICS file:", error);
			this.setState({
				isLoading: false,
				buttonText: "Fetch ICS Data",
				message: `Failed to fetch ICS file: ${error.message}`,
				messageType: "error",
				weeklyShifts: {},
				totalShifts: 0,
			});
		}
	}

	// Utility methods for external access
	getUrl() {
		return this.state.icsUrl;
	}

	setUrl(url) {
		this.setState({ icsUrl: url });
		if (this.storageHandler) {
			this.storageHandler.save();
		}
	}

	clearUrl() {
		this.setState({
			icsUrl: "",
			message: "",
			weeklyShifts: {},
			totalShifts: 0,
			shifts: [],
		});
		if (this.storageHandler) {
			this.storageHandler.clear();
		}
	}

	getShifts() {
		return this.state.shifts;
	}

	getEnabledShifts() {
		return this.state.shifts.filter((shift) => shift.isEnabled);
	}
}

/**
 * Initialize ICS import functionality
 * @param {HTMLElement} container - Container element for the ICS import section
 * @param {object} storageHandler - Storage handler object (optional)
 * @returns {IcsImportHandler} Handler instance
 */
export function initializeIcsImport(container, storageHandler = null) {
	return new IcsImportHandler(container, storageHandler);
}
