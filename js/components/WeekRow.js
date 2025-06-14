import DayBlock from "./DayBlock.js";
import WeeklySummary from "./WeeklySummary.js";

/**
 * Renders a week row with all its days
 *
 * @param {object} props - Component properties
 * @param {string} props.weekKey - Week identifier (YYYY-WWW)
 * @param {object} props.weekData - Week data containing shifts
 * @param {number} props.weekData.year - Year
 * @param {number} props.weekData.week - Week number
 * @param {Array} props.weekData.shifts - Array of shifts for the week
 * @param {object} props.weekTotal - Weekly calculation total (optional)
 * @returns {string} - Component HTML
 */
export default function WeekRow(props = {}) {
	const { weekKey, weekData, weekTotal } = props;

	if (!weekKey || !weekData) return "";

	// Get Monday of this week
	const mondayDate = getMondayOfWeek(weekData.year, weekData.week);

	// Create 7 day blocks (Monday to Sunday)
	const dayBlocks = [];
	for (let i = 0; i < 7; i++) {
		const dayDate = new Date(mondayDate);
		dayDate.setDate(mondayDate.getDate() + i);

		// Find shifts for this day
		const dayShifts = weekData.shifts.filter((shift) => {
			const shiftDate = new Date(shift.start);
			return (
				shiftDate.getDate() === dayDate.getDate() &&
				shiftDate.getMonth() === dayDate.getMonth() &&
				shiftDate.getFullYear() === dayDate.getFullYear()
			);
		});

		dayBlocks.push(DayBlock({ date: dayDate, shifts: dayShifts }));
	}

	// Determine if all shifts in the week are enabled
	const allShifts = weekData.shifts || [];
	const enabledShifts = allShifts.filter((shift) => shift.isEnabled);
	const allEnabled = allShifts.length > 0 && enabledShifts.length === allShifts.length;
	const someEnabled = enabledShifts.length > 0 && enabledShifts.length < allShifts.length;

	return `
		<div class="week-row" data-week-key="${weekKey}" data-all-enabled="${allEnabled}" data-some-enabled="${someEnabled}">
			<div class="week-header">
				<input type="checkbox" class="week-toggle" ${allEnabled ? "checked" : ""}>
				<span class="week-label">${weekKey}</span>
			</div>
			<div class="week-days">
				${dayBlocks.join("")}
			</div>
			${weekTotal ? WeeklySummary({ weekTotal }) : ""}
		</div>
	`;
}

/**
 * Gets the Monday date for a given ISO week
 * @param {number} year - Year
 * @param {number} week - ISO week number
 * @returns {Date} Monday date of the week
 */
function getMondayOfWeek(year, week) {
	const jan4 = new Date(year, 0, 4);
	const daysToMonday = 1 - (jan4.getDay() || 7);
	const firstMonday = new Date(jan4);
	firstMonday.setDate(jan4.getDate() + daysToMonday);

	const targetMonday = new Date(firstMonday);
	targetMonday.setDate(firstMonday.getDate() + (week - 1) * 7);

	return targetMonday;
}
