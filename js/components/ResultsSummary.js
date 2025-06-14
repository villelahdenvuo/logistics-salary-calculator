import BreakdownItem from "./BreakdownItem.js";
import SalarySummary from "./SalarySummary.js";

/**
 * Renders the salary calculation summary section
 *
 * @param {object} props - Component properties
 * @param {object} props.results - Calculation results object
 * @param {object} props.config - Calculator configuration
 * @param {boolean} props.includeBreak - Whether lunch break was included
 * @param {number} props.age - Employee age
 * @param {Function} props.formatCurrency - Function to format currency
 * @param {Function} props.formatNumber - Function to format number
 * @returns {string} - Component HTML
 */
export default function ResultsSummary(props = {}) {
	const { results, config, includeBreak, formatCurrency, formatNumber } = props;

	// Detailed breakdown section
	const detailedBreakdown = `
		<div class="detailed-breakdown">
			<h3>Breakdown</h3>

			${BreakdownItem({
				label: "Base Hourly Wage:",
				value: `${formatCurrency(results.baseSalary)} (${formatNumber(
					results.totalHours,
				)} × ${formatCurrency(config.baseSalary)})`,
				emoji: "💵",
			})}

			${
				includeBreak
					? BreakdownItem({
							label: "Unpaid Lunch Break:",
							value: "-30 minutes",
						})
					: ""
			}

			${results.extras
				.map((extra) =>
					BreakdownItem({
						label: `${extra.name}:`,
						value: `${formatCurrency(extra.amount)} (${formatNumber(extra.hours)} h)`,
						emoji: extra.emoji || "",
					}),
				)
				.join("")}
		</div>
	`;

	// Create totals object for SalarySummary
	const totals = {
		totalHours: results.totalHours,
		baseSalary: results.baseSalary,
		totalSalary: results.totalSalary,
		tyelDeduction: results.tyelDeduction,
		tvmDeduction: results.tvmDeduction,
		netSalary: results.netSalary,
	};

	const summaryComponent = SalarySummary({
		totals,
		title: "Shift Summary",
		className: "shift-summary",
		showShiftCount: false,
	});

	return `
		${detailedBreakdown}
		${summaryComponent}
	`;
}
