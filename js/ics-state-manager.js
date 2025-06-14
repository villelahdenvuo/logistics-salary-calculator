/**
 * ICS State Manager Module
 * Handles state management for ICS import functionality
 */

import { fetchIcsData } from "./ics-fetcher.js";
import { parseIcsData, groupShiftsByWeek } from "./ics-parser.js";

/**
 * Global shifts storage
 */
let globalShifts = [];

/**
 * Sets the global shifts array
 * @param {Array} shifts - Array of shift objects
 */
export function setGlobalShifts(shifts) {
	globalShifts = shifts;
}

/**
 * Gets all shifts (both enabled and disabled)
 * @returns {Array} Array of all shift objects
 */
export function getAllShifts() {
	return globalShifts;
}

/**
 * Gets only the enabled shifts
 * @returns {Array} Array of enabled shift objects
 */
export function getGlobalEnabledShifts() {
	return globalShifts.filter((shift) => shift.isEnabled);
}

/**
 * ICS State Manager class
 */
export class IcsStateManager {
	constructor(storageHandler = null) {
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

		this.observers = [];
		this.loadInitialUrl();
	}

	/**
	 * Load URL from storage if available
	 */
	loadInitialUrl() {
		if (this.storageHandler) {
			const savedUrl = this.storageHandler.load();
			if (savedUrl) {
				this.setState({ icsUrl: savedUrl });
			}
		}
	}

	/**
	 * Subscribe to state changes
	 * @param {Function} callback - Callback function to call on state changes
	 */
	subscribe(callback) {
		this.observers.push(callback);
	}

	/**
	 * Unsubscribe from state changes
	 * @param {Function} callback - Callback function to remove
	 */
	unsubscribe(callback) {
		this.observers = this.observers.filter((obs) => obs !== callback);
	}

	/**
	 * Update state and notify observers
	 * @param {Object} newState - Partial state to update
	 * @param {boolean} silent - If true, don't notify observers (for internal updates)
	 */
	setState(newState, silent = false) {
		this.state = { ...this.state, ...newState };
		if (!silent) {
			this.notifyObservers();
		}
	}

	/**
	 * Notify all observers of state changes
	 */
	notifyObservers() {
		this.observers.forEach((observer) => observer(this.state));
	}

	/**
	 * Get current state
	 * @returns {Object} Current state
	 */
	getState() {
		return { ...this.state };
	}

	/**
	 * Update the ICS URL
	 * @param {string} url - New URL
	 */
	setUrl(url) {
		this.setState({ icsUrl: url });
		if (this.storageHandler) {
			this.storageHandler.save();
		}
	}

	/**
	 * Get current URL
	 * @returns {string} Current ICS URL
	 */
	getUrl() {
		return this.state.icsUrl;
	}

	/**
	 * Clear URL and reset state
	 */
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

	/**
	 * Get all shifts
	 * @returns {Array} Array of shift objects
	 */
	getShifts() {
		return this.state.shifts;
	}

	/**
	 * Get enabled shifts only
	 * @returns {Array} Array of enabled shift objects
	 */
	getEnabledShifts() {
		return this.state.shifts.filter((shift) => shift.isEnabled);
	}

	/**
	 * Update a specific shift's enabled state
	 * @param {string} shiftId - ID of the shift to update
	 * @param {boolean} isEnabled - New enabled state
	 */
	updateShiftEnabled(shiftId, isEnabled) {
		const shiftIndex = this.state.shifts.findIndex((shift) => shift.id === shiftId);
		if (shiftIndex !== -1) {
			const updatedShifts = [...this.state.shifts];
			updatedShifts[shiftIndex] = { ...updatedShifts[shiftIndex], isEnabled };

			// Update state silently to avoid re-render
			this.setState({ shifts: updatedShifts }, true);
			setGlobalShifts(updatedShifts);
			return true;
		}
		return false;
	}

	/**
	 * Update all shifts in a week
	 * @param {Array} weekShifts - Array of shifts in the week
	 * @param {boolean} isEnabled - New enabled state for all shifts
	 */
	updateWeekShifts(weekShifts, isEnabled) {
		const updatedShifts = [...this.state.shifts];
		let hasChanges = false;

		weekShifts.forEach((weekShift) => {
			const shiftIndex = updatedShifts.findIndex((shift) => shift.id === weekShift.id);
			if (shiftIndex !== -1) {
				updatedShifts[shiftIndex] = { ...updatedShifts[shiftIndex], isEnabled };
				hasChanges = true;
			}
		});

		if (hasChanges) {
			// Update state silently to avoid re-render
			this.setState({ shifts: updatedShifts }, true);
			setGlobalShifts(updatedShifts);
		}
		return hasChanges;
	}

	/**
	 * Fetch and parse ICS data
	 */
	async fetchAndParseIcs() {
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
}
