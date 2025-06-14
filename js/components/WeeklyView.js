import WeekRow from "./WeekRow.js";

/**
 * Renders the weekly calendar view for shifts
 *
 * @param {object} props - Component properties
 * @param {object} props.weeklyShifts - Grouped shifts by week
 * @returns {string} - Component HTML
 */
export default function WeeklyView(props = {}) {
	const { weeklyShifts = {} } = props;

	const weekKeys = Object.keys(weeklyShifts).sort();

	if (weekKeys.length === 0) {
		return '<p class="no-shifts">No shifts found in the ICS file.</p>';
	}

	const weekRows = weekKeys
		.map((weekKey) =>
			WeekRow({
				weekKey,
				weekData: weeklyShifts[weekKey],
			}),
		)
		.join("");

	return `
		<div class="weekly-view">
			${weekRows}
		</div>
	`;
}
