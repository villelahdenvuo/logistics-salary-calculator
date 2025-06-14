import ShiftBlock from "./ShiftBlock.js";

/**
 * Renders a day block with its shifts
 *
 * @param {object} props - Component properties
 * @param {Date} props.date - The date for this day
 * @param {Array} props.shifts - Array of shifts for this day
 * @returns {string} - Component HTML
 */
export default function DayBlock(props = {}) {
	const { date, shifts = [] } = props;

	if (!date) return "";

	const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
	const dayName = dayNames[(date.getDay() + 6) % 7]; // Convert Sunday=0 to Monday=0
	const dayHeader = `${dayName} ${date.getDate()}/${date.getMonth() + 1}`;

	const shiftsHtml =
		shifts.length === 0
			? '<div class="no-shift">-</div>'
			: shifts.map((shift) => ShiftBlock({ shift })).join("");

	return `
		<div class="day-block">
			<div class="day-header">${dayHeader}</div>
			<div class="day-shifts">
				${shiftsHtml}
			</div>
		</div>
	`;
}
