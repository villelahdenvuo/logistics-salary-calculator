/**
 * Configuration module for the shift calculator
 * Contains all constants and configuration values used in the application
 */

// Default shift duration in hours
export const defaultShiftDuration = 8;

// TyEL pension insurance rates for 2025
export const tyelRates = {
	under53: 7.15,
	between53and62: 8.65,
	over63: 7.15,
};

// TVM unemployment insurance rate for 2025
export const tvmRate = 0.59;

// Salary configuration
export const salaryConfig = {
	baseSalary: 12.95,
	breakDuration: 30, // 30 minutes for lunch break
	extras: {
		eveningWeekday: {
			name: "Evening Bonus Weekdays (Mon-Fri 18-22)",
			emoji: "🌆",
			rate: 3.73,
			applies: (date, hour) => {
				const day = date.getDay();
				// Monday to Friday (1-5), between 18-22
				return day >= 1 && day <= 5 && hour >= 18 && hour < 22;
			},
		},
		eveningSundayHoliday: {
			name: "Evening Bonus Sundays/Holidays (18-22)",
			emoji: "🌇",
			rate: 7.47,
			applies: (date, hour) => {
				const day = date.getDay();
				// Sunday (0), between 18-22
				// Note: Public holidays would need additional logic
				return day === 0 && hour >= 18 && hour < 22;
			},
		},
		nightWeekday: {
			name: "Night Bonus Weekdays (Mon-Sat 00-06 & 22-24)",
			emoji: "🌙",
			rate: 4.4,
			applies: (date, hour) => {
				const day = date.getDay();
				// Monday to Saturday (1-6), between 00-06 or 22-24
				return day >= 1 && day <= 6 && ((hour >= 0 && hour < 6) || (hour >= 22 && hour < 24));
			},
		},
		nightSundayHoliday: {
			name: "Night Bonus Sundays/Holidays (00-06 & 22-24)",
			emoji: "🌃",
			rate: 8.79,
			applies: (date, hour) => {
				const day = date.getDay();
				// Sunday (0), between 00-06 or 22-24
				// Note: Public holidays would need additional logic
				return day === 0 && ((hour >= 0 && hour < 6) || (hour >= 22 && hour < 24));
			},
		},
		saturday: {
			name: "Saturday Bonus (Sat 13-24)",
			emoji: "🏙️",
			rate: 5.46,
			applies: (date, hour) => {
				const day = date.getDay();
				// Saturday (6), between 13-24
				return day === 6 && hour >= 13 && hour < 24;
			},
		},
		sundayBase: {
			name: "Sunday Bonus (100% of base salary)",
			emoji: "🏖️",
			rate: null, // This will be calculated based on the base salary
			applies: (date, _hour) => {
				const day = date.getDay();
				// Sunday (0), all hours
				return day === 0;
			},
		},
	},
};

/**
 * Get the appropriate TyEL rate based on age
 * @param {number} age - The employee's age
 * @returns {number} The TyEL rate percentage
 */
export function getTyELRate(age) {
	if (!age || isNaN(age)) return 0; // No TyEL calculation if no age provided

	if (age < 53) return tyelRates.under53;
	if (age >= 53 && age <= 62) return tyelRates.between53and62;
	return tyelRates.over63;
}

/**
 * Format a number as currency (EUR)
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
	// Format using Finnish currency notation (12,95 €)
	return amount.toLocaleString("fi-FI", {
		style: "currency",
		currency: "EUR",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

/**
 * Format a number using Finnish notation
 * @param {number} number - The number to format
 * @returns {string} Formatted number string
 */
export function formatNumber(number) {
	// Format using Finnish number notation with comma as decimal separator
	return number.toLocaleString("fi-FI", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

/**
 * Format a time from a Date object
 * @param {Date} date - The date object containing the time to format
 * @returns {string} Formatted time string (HH:MM)
 */
export function formatTime(date) {
	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");
	return `${hours}:${minutes}`;
}

/**
 * Default configuration structure
 */
export const defaultConfig = {
	salaryConfig,
	tyelRates,
	tvmRate,
	age: 18, // Default age for TyEL calculation
};
