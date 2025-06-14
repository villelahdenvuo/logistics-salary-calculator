/**
 * ICS State Manager Module
 * Handles state management for ICS import functionality
 */

import { fetchIcsData } from "./ics-fetcher.js";
import { parseIcsData, groupShiftsByWeek } from "./ics-parser.js";
import { calculateShiftSalary, shouldIncludeBreak } from "./calculator-engine.js";
import { loadConfig } from "./config-manager.js";

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
		this.config = loadConfig(); // Load calculation configuration
		this.state = {
			icsUrl: "",
			isLoading: false,
			message: "",
			messageType: "success",
			weeklyShifts: {},
			totalShifts: 0,
			shifts: [],
			weeklyTotals: {},
			grandTotal: null,
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
			weeklyTotals: {},
			grandTotal: null,
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
			updatedShifts[shiftIndex] = {
				...updatedShifts[shiftIndex],
				isEnabled,
				calculation: isEnabled ? this.calculateShiftSalary(updatedShifts[shiftIndex]) : null,
			};

			// Update the weeklyShifts structure to reflect the change
			const updatedWeeklyShifts = this.updateWeeklyShiftsData(updatedShifts);

			// Calculate totals with updated shifts
			const { weeklyTotals, grandTotal } = this.calculateTotalsForShifts(updatedShifts);

			// Update state and notify observers in one go
			this.setState({
				shifts: updatedShifts,
				weeklyShifts: updatedWeeklyShifts,
				weeklyTotals,
				grandTotal,
			});
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
				updatedShifts[shiftIndex] = {
					...updatedShifts[shiftIndex],
					isEnabled,
					calculation: isEnabled ? this.calculateShiftSalary(updatedShifts[shiftIndex]) : null,
				};
				hasChanges = true;
			}
		});

		if (hasChanges) {
			// Calculate totals with updated shifts
			const { weeklyTotals, grandTotal } = this.calculateTotalsForShifts(updatedShifts);

			// Update state and notify observers in one go
			this.setState({ shifts: updatedShifts, weeklyTotals, grandTotal });
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
				icsUrl: "",
				message: "Please enter a valid calendar URL",
				messageType: "error",
				weeklyShifts: {},
				totalShifts: 0,
				weeklyTotals: {},
				grandTotal: null,
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

			// Calculate salaries for enabled shifts
			console.log("🚀 Calculating shift salaries...");
			const shiftsWithCalculations = shifts.map((shift) => ({
				...shift,
				calculation: shift.isEnabled ? this.calculateShiftSalary(shift) : null,
			}));

			console.log("🚀 Grouping shifts by week...");
			const weeklyShifts = groupShiftsByWeek(shiftsWithCalculations);
			console.log("🚀 Weekly shifts:", weeklyShifts);

			// Store shifts globally and in state
			setGlobalShifts(shiftsWithCalculations);

			// Calculate totals for enabled shifts
			const { weeklyTotals, grandTotal } = this.calculateTotalsForShifts(shiftsWithCalculations);

			const successMessage = result.usedProxy
				? "Calendar fetched successfully via CORS proxy!"
				: "Calendar fetched successfully!";

			this.setState({
				isLoading: false,
				buttonText: "Fetch Calendar Data",
				message: successMessage,
				messageType: "success",
				weeklyShifts,
				totalShifts: shiftsWithCalculations.length,
				shifts: shiftsWithCalculations,
				weeklyTotals,
				grandTotal,
			});

			console.log("✅ ICS import completed successfully");
		} catch (error) {
			console.error("❌ Error fetching calendar:", error);
			this.setState({
				isLoading: false,
				buttonText: "Fetch Calendar Data",
				message: `Failed to fetch calendar: ${error.message}`,
				messageType: "error",
				weeklyShifts: {},
				totalShifts: 0,
				weeklyTotals: {},
				grandTotal: null,
			});
		}
	}

	/**
	 * Calculate salary for a single shift
	 * @param {Object} shift - Shift object with start and end times
	 * @returns {Object} Calculation results
	 */ calculateShiftSalary(shift) {
		const includeBreak = shouldIncludeBreak(
			shift.start,
			shift.end,
			this.config.salaryConfig.breakThreshold,
		);

		return calculateShiftSalary(
			shift.start,
			shift.end,
			this.config.salaryConfig,
			includeBreak,
			this.config.age,
			this.config.tyelRates,
			this.config.tvmRate,
		);
	}

	/**
	 * Calculate totals for enabled shifts
	 * @param {Array} shifts - Array of shifts to calculate totals for (optional, uses state.shifts if not provided)
	 * @returns {Object} Total calculations including weekly breakdown
	 */
	calculateTotals() {
		return this.calculateTotalsForShifts(this.state.shifts);
	}

	/**
	 * Calculate totals for given shifts array
	 * @param {Array} shifts - Array of shifts to calculate totals for
	 * @returns {Object} Total calculations including weekly breakdown
	 */
	calculateTotalsForShifts(shifts) {
		const enabledShifts = shifts.filter((shift) => shift.isEnabled);
		const weeklyTotals = {};
		const grandTotal = {
			totalHours: 0,
			baseSalary: 0,
			totalSalary: 0,
			tyelDeduction: 0,
			tvmDeduction: 0,
			netSalary: 0,
			shiftsCount: 0,
		};

		// Group shifts by week and calculate totals
		enabledShifts.forEach((shift) => {
			if (!shift.calculation) return;

			const weekKey = this.getWeekKey(shift.start);

			if (!weeklyTotals[weekKey]) {
				weeklyTotals[weekKey] = {
					totalHours: 0,
					baseSalary: 0,
					totalSalary: 0,
					tyelDeduction: 0,
					tvmDeduction: 0,
					netSalary: 0,
					shiftsCount: 0,
				};
			}

			// Add to weekly total
			weeklyTotals[weekKey].totalHours += shift.calculation.totalHours;
			weeklyTotals[weekKey].baseSalary += shift.calculation.baseSalary;
			weeklyTotals[weekKey].totalSalary += shift.calculation.totalSalary;
			weeklyTotals[weekKey].tyelDeduction += shift.calculation.tyelDeduction;
			weeklyTotals[weekKey].tvmDeduction += shift.calculation.tvmDeduction;
			weeklyTotals[weekKey].netSalary += shift.calculation.netSalary;
			weeklyTotals[weekKey].shiftsCount += 1;

			// Add to grand total
			grandTotal.totalHours += shift.calculation.totalHours;
			grandTotal.baseSalary += shift.calculation.baseSalary;
			grandTotal.totalSalary += shift.calculation.totalSalary;
			grandTotal.tyelDeduction += shift.calculation.tyelDeduction;
			grandTotal.tvmDeduction += shift.calculation.tvmDeduction;
			grandTotal.netSalary += shift.calculation.netSalary;
			grandTotal.shiftsCount += 1;
		});

		// Return null for grandTotal if no enabled shifts
		return {
			weeklyTotals,
			grandTotal: grandTotal.shiftsCount > 0 ? grandTotal : null,
		};
	}

	/**
	 * Get week key for a date (YYYY-WWW format)
	 * @param {Date} date - Date to get week key for
	 * @returns {string} Week key
	 */
	getWeekKey(date) {
		const year = date.getFullYear();
		const week = this.getISOWeek(date);
		return `${year}-W${String(week).padStart(2, "0")}`;
	}

	/**
	 * Get ISO week number for a date
	 * @param {Date} date - Date to get week for
	 * @returns {number} ISO week number
	 */
	getISOWeek(date) {
		const target = new Date(date.valueOf());
		const dayNr = (date.getDay() + 6) % 7;
		target.setDate(target.getDate() - dayNr + 3);
		const firstThursday = target.valueOf();
		target.setMonth(0, 1);
		if (target.getDay() !== 4) {
			target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
		}
		return 1 + Math.ceil((firstThursday - target) / 604800000);
	}

	/**
	 * Recalculate all shift salaries
	 */
	recalculateShifts() {
		const updatedShifts = this.state.shifts.map((shift) => ({
			...shift,
			calculation: shift.isEnabled ? this.calculateShiftSalary(shift) : null,
		}));

		// Calculate totals with updated shifts
		const { weeklyTotals, grandTotal } = this.calculateTotalsForShifts(updatedShifts);

		this.setState({ shifts: updatedShifts, weeklyTotals, grandTotal }, true);
		setGlobalShifts(updatedShifts);
	}

	/**
	 * Update multiple shifts' enabled state in a batch
	 * @param {Array} updates - Array of {shiftId, isEnabled} objects
	 */
	updateMultipleShifts(updates) {
		const updatedShifts = [...this.state.shifts];
		let hasChanges = false;

		updates.forEach(({ shiftId, isEnabled }) => {
			const shiftIndex = updatedShifts.findIndex((shift) => shift.id === shiftId);
			if (shiftIndex !== -1) {
				updatedShifts[shiftIndex] = {
					...updatedShifts[shiftIndex],
					isEnabled,
					calculation: isEnabled ? this.calculateShiftSalary(updatedShifts[shiftIndex]) : null,
				};
				hasChanges = true;
			}
		});

		if (hasChanges) {
			// Update the weeklyShifts structure to reflect the changes
			const updatedWeeklyShifts = this.updateWeeklyShiftsData(updatedShifts);

			// Calculate totals with updated shifts
			const { weeklyTotals, grandTotal } = this.calculateTotalsForShifts(updatedShifts);

			// Update state and notify observers
			this.setState({
				shifts: updatedShifts,
				weeklyShifts: updatedWeeklyShifts,
				weeklyTotals,
				grandTotal,
			});
			setGlobalShifts(updatedShifts);
		}
		return hasChanges;
	}

	/**
	 * Update the weeklyShifts structure with current shift data
	 * @param {Array} shifts - Current shifts array
	 * @returns {Object} Updated weeklyShifts structure
	 */
	updateWeeklyShiftsData(shifts) {
		const weeklyShifts = {};

		shifts.forEach((shift) => {
			const weekKey = this.getWeekKey(shift.start);

			if (!weeklyShifts[weekKey]) {
				const year = shift.start.getFullYear();
				const week = this.getISOWeek(shift.start);
				weeklyShifts[weekKey] = {
					year,
					week,
					shifts: [],
				};
			}

			weeklyShifts[weekKey].shifts.push(shift);
		});

		return weeklyShifts;
	}
}
