import BreakdownItem from "./BreakdownItem.js";

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
	const { results, config, includeBreak, age, formatCurrency, formatNumber } = props;

	return `
    <h3>Summary</h3>

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

    ${BreakdownItem({
			label: "Gross Total:",
			value: formatCurrency(results.totalSalary),
			className: "total-row",
		})}

    <h3>Deductions</h3>

    ${
			age && !isNaN(age) && results.tyelRate > 0
				? BreakdownItem({
						label: `TyEL Deduction (${results.tyelRate}%):`,
						value: `-${formatCurrency(results.tyelDeduction)}`,
						className: "deduction",
					})
				: ""
		}

    ${BreakdownItem({
			label: `Unemployment Insurance (${results.tvmRate}%):`,
			value: `-${formatCurrency(results.tvmDeduction)}`,
			className: "deduction",
		})}

    ${BreakdownItem({
			label: "Net Salary:",
			value: formatCurrency(results.netSalary),
			className: "net-total",
		})}
  `;
}
