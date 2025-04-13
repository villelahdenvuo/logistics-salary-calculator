/**
 * Calculator Engine module
 * Contains all the calculation logic for shift salary calculations
 */

import { getTyELRate, tvmRate } from "./config.js";

/**
 * Calculates the complete salary breakdown for a shift
 * @param {Date} start - Shift start time
 * @param {Date} end - Shift end time
 * @param {Object} config - Salary configuration with base salary and extras
 * @param {boolean} includeBreak - Whether to include break deduction
 * @param {number} age - Employee's age for TyEL calculation
 * @returns {Object} Complete salary calculation results
 */
export function calculateShiftSalary(start, end, config, includeBreak, age) {
	// Track hourly breakdown with timestamps
	const hourlyBreakdown = [];
	// Summary of extras for total calculation
	const extrasBreakdown = {};

	let totalHours = 0;
	let totalSalary = 0;
	let breakDeduction = 0;

	// Initialize extras breakdown
	for (const extraKey in config.extras) {
		extrasBreakdown[extraKey] = {
			name: config.extras[extraKey].name,
			emoji: config.extras[extraKey].emoji,
			hours: 0,
			amount: 0,
		};
	}

	// Calculate in 1-hour increments
	let currentTime = new Date(start);

	while (currentTime < end) {
		const hour = currentTime.getHours();

		// Calculate how much of this hour is worked
		const nextHour = new Date(currentTime);
		nextHour.setHours(hour + 1, 0, 0, 0);
		const endOfThisSegment = new Date(Math.min(nextHour.getTime(), end.getTime()));

		const hoursWorked = (endOfThisSegment - currentTime) / (1000 * 60 * 60);
		totalHours += hoursWorked;

		// Base salary for this hour segment
		const baseSalaryForHour = config.baseSalary * hoursWorked;
		totalSalary += baseSalaryForHour;

		// Hour details object
		const hourDetails = {
			startTime: new Date(currentTime),
			endTime: new Date(endOfThisSegment),
			hoursWorked: hoursWorked,
			baseSalary: baseSalaryForHour,
			extras: [],
			totalForHour: baseSalaryForHour,
		};

		// Check which extras apply for this hour
		for (const extraKey in config.extras) {
			const extra = config.extras[extraKey];
			if (extra.applies(currentTime, hour)) {
				// For Sunday base calculation
				const rate = extraKey === "sundayBase" ? config.baseSalary : extra.rate;
				const extraAmount = rate * hoursWorked;

				// Update the total extras breakdown
				extrasBreakdown[extraKey].hours += hoursWorked;
				extrasBreakdown[extraKey].amount += extraAmount;

				// Add to the hourly breakdown
				hourDetails.extras.push({
					name: extra.name,
					emoji: extra.emoji,
					amount: extraAmount,
					rate: rate,
				});

				// Update the hour total
				hourDetails.totalForHour += extraAmount;
				totalSalary += extraAmount;
			}
		}

		// Add this hour to the breakdown
		hourlyBreakdown.push(hourDetails);

		// Move to next hour
		currentTime = nextHour;
	}

	// Apply lunch break deduction if applicable - ONLY to base salary
	let baseSalaryAfterBreak = config.baseSalary * totalHours;

	if (includeBreak) {
		const breakHours = config.breakDuration / 60;
		breakDeduction = breakHours;

		// Deduct break time from total hours and base salary only
		totalHours -= breakHours;
		baseSalaryAfterBreak = config.baseSalary * totalHours;

		// Recalculate total salary with the corrected base salary
		totalSalary = baseSalaryAfterBreak;

		// Add back the extras (which are not affected by the break)
		for (const extraKey in extrasBreakdown) {
			if (extrasBreakdown[extraKey].hours > 0) {
				totalSalary += extrasBreakdown[extraKey].amount;
			}
		}
	}

	// Calculate TyEL deduction if age is provided
	const tyelRate = getTyELRate(age);
	const tyelDeduction = tyelRate > 0 ? (totalSalary * tyelRate) / 100 : 0;

	// Calculate TVM deduction (always applied regardless of age)
	const tvmDeduction = (totalSalary * tvmRate) / 100;

	// Calculate net salary after all deductions
	const netSalary = totalSalary - tyelDeduction - tvmDeduction;

	// Filter out extras that don't apply
	const applicableExtras = Object.values(extrasBreakdown).filter((extra) => extra.hours > 0);

	return {
		totalHours: totalHours,
		baseSalary: baseSalaryAfterBreak,
		hourlyBreakdown: hourlyBreakdown,
		extras: applicableExtras,
		totalSalary: totalSalary,
		tyelRate: tyelRate,
		tyelDeduction: tyelDeduction,
		tvmRate: tvmRate,
		tvmDeduction: tvmDeduction,
		netSalary: netSalary,
		breakDeduction: breakDeduction,
	};
}

/**
 * Calculate end time based on start time and shift duration
 * @param {string|Date} startTime - Shift start time
 * @param {number} shiftDuration - Duration of shift in hours
 * @returns {Date|null} Calculated end time or null if start time is invalid
 */
export function calculateEndTimeFromStart(startTime, shiftDuration) {
	const start = new Date(startTime);
	if (isNaN(start.getTime())) {
		return null;
	}

	// Calculate end time by adding shift duration to start time
	return new Date(start.getTime() + shiftDuration * 60 * 60 * 1000);
}

/**
 * Format a date for datetime-local input
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string in YYYY-MM-DDThh:mm format
 */
export function formatDateForInput(date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");

	return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Determines if a shift duration requires a lunch break
 * @param {Date} start - Shift start time
 * @param {Date} end - Shift end time
 * @param {number} breakThreshold - Minimum duration in minutes to include break
 * @returns {boolean} Whether to include a break
 */
export function shouldIncludeBreak(start, end, breakThreshold) {
	const shiftDurationMinutes = (end - start) / (1000 * 60);
	return shiftDurationMinutes >= breakThreshold;
}

/**
 * Validate shift start and end times
 * @param {Date} start - Shift start time
 * @param {Date} end - Shift end time
 * @returns {Object} Validation result with isValid flag and error message
 */
export function validateShiftTimes(start, end) {
	if (isNaN(start.getTime()) || isNaN(end.getTime())) {
		return {
			isValid: false,
			message: "Please enter valid start and end times.",
		};
	}

	if (end <= start) {
		return { isValid: false, message: "End time must be after start time." };
	}

	return { isValid: true, message: null };
}
