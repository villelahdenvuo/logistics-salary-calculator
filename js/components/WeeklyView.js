import WeekRow from "./WeekRow.js";
import OverallSummary from "./OverallSummary.js";

/**
 * Renders the weekly calendar view for shifts
 *
 * @param {object} props - Component properties
 * @param {object} props.weeklyShifts - Grouped shifts by week
 * @param {object} props.weeklyTotals - Weekly calculation totals (optional)
 * @param {object} props.grandTotal - Grand total calculations (optional)
 * @returns {string} - Component HTML
 */
export default function WeeklyView(props = {}) {
	const { weeklyShifts = {}, weeklyTotals = {}, grandTotal = null } = props;

	const weekKeys = Object.keys(weeklyShifts).sort();

	if (weekKeys.length === 0) {
		return '<p class="no-shifts">No shifts found in the calendar.</p>';
	}

	const weekRows = weekKeys
		.map((weekKey) =>
			WeekRow({
				weekKey,
				weekData: weeklyShifts[weekKey],
				weekTotal: weeklyTotals[weekKey] || null,
			}),
		)
		.join("");

	return `
		<div class="weekly-view">
			${weekRows}
			${grandTotal ? OverallSummary({ grandTotal }) : ""}
		</div>
	`;
}
