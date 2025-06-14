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
 * @param {number} props.weekTotal.totalHours - Total hours worked
 * @param {number} props.weekTotal.baseSalary - Base salary total
 * @param {number} props.weekTotal.totalSalary - Total salary before deductions
 * @param {number} props.weekTotal.tyelDeduction - TyEL deduction
 * @param {number} props.weekTotal.tvmDeduction - TVM deduction
 * @param {number} props.weekTotal.netSalary - Net salary after deductions
 * @param {number} props.weekTotal.shiftsCount - Number of shifts
 * @returns {string} - Component HTML
 */
export default function WeeklySummary(props = {}) {
	const { weekTotal } = props;

	if (!weekTotal || weekTotal.shiftsCount === 0) {
		return "";
	}

	const formatCurrency = (amount) =>
		amount.toLocaleString("fi-FI", {
			style: "currency",
			currency: "EUR",
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		});

	const formatHours = (hours) => hours.toFixed(1);

	return `
		<div class="weekly-summary">
			<div class="weekly-summary-details">
				<div class="summary-row">
					<span class="summary-label">Total Hours:</span>
					<span class="summary-value">${formatHours(weekTotal.totalHours)}h</span>
				</div>
				<div class="summary-row">
					<span class="summary-label">Base Salary:</span>
					<span class="summary-value">${formatCurrency(weekTotal.baseSalary)}</span>
				</div>
				<div class="summary-row">
					<span class="summary-label">Gross Salary:</span>
					<span class="summary-value">${formatCurrency(weekTotal.totalSalary)}</span>
				</div>
				<div class="summary-row deduction">
					<span class="summary-label">TyEL Deduction:</span>
					<span class="summary-value">-${formatCurrency(weekTotal.tyelDeduction)}</span>
				</div>
				<div class="summary-row deduction">
					<span class="summary-label">TVM Deduction:</span>
					<span class="summary-value">-${formatCurrency(weekTotal.tvmDeduction)}</span>
				</div>
				<div class="summary-row total">
					<span class="summary-label">Net Salary:</span>
					<span class="summary-value">${formatCurrency(weekTotal.netSalary)}</span>
				</div>
			</div>
		</div>
	`;
}
