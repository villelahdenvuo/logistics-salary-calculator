import SalarySummary from "./SalarySummary.js";

/**
 * OverallSummary Component
 * Displays overall salary calculation summary for all enabled shifts
 */

/**
 * Renders overall calculation summary
 *
 * @param {object} props - Component properties
 * @param {object} props.grandTotal - Grand total calculations
 * @returns {string} - Component HTML
 */
export default function OverallSummary(props = {}) {
	const { grandTotal } = props;

	if (!grandTotal || grandTotal.shiftsCount === 0) {
		return SalarySummary({
			totals: null,
			title: "Overall Summary",
			className: "overall-summary",
			showShiftCount: true,
		});
	}

	return SalarySummary({
		totals: grandTotal,
		title: "Overall Summary",
		className: "overall-summary",
		showShiftCount: true,
	});
}
