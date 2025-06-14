import SalarySummary from "./SalarySummary.js";

/**
 * WeeklySummary Component
 * Displays weekly salary calculation summary for a group of shifts
 */

/**
 * Renders weekly calculation summary
 *
 * @param {object} props - Component properties
 * @param {string} props.weekKey - Week identifier (YYYY-WWW)
 * @param {object} props.weekTotal - Weekly total calculations
 * @returns {string} - Component HTML
 */
export default function WeeklySummary(props = {}) {
	const { weekTotal, weekKey } = props;

	if (!weekTotal || weekTotal.shiftsCount === 0) {
		return "";
	}

	return SalarySummary({
		totals: weekTotal,
		title: `Week ${weekKey ? weekKey.split("-W")[1] : ""} Summary`,
		className: "weekly-summary",
		showShiftCount: true,
	});
}
