/**
 * OverallSummary Component
 * Displays overall salary calculation summary for all enabled shifts
 */

/**
 * Renders overall calculation summary
 *
 * @param {object} props - Component properties
 * @param {object} props.grandTotal - Grand total calculations
 * @param {number} props.grandTotal.totalHours - Total hours worked
 * @param {number} props.grandTotal.baseSalary - Base salary total
 * @param {number} props.grandTotal.totalSalary - Total salary before deductions
 * @param {number} props.grandTotal.tyelDeduction - TyEL deduction
 * @param {number} props.grandTotal.tvmDeduction - TVM deduction
 * @param {number} props.grandTotal.netSalary - Net salary after deductions
 * @param {number} props.grandTotal.shiftsCount - Number of shifts
 * @returns {string} - Component HTML
 */
export default function OverallSummary(props = {}) {
	const { grandTotal } = props;

	if (!grandTotal || grandTotal.shiftsCount === 0) {
		return '<div class="overall-summary"><p class="no-shifts">No enabled shifts to calculate.</p></div>';
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
		<div class="overall-summary">
			<div class="overall-summary-header">
				<h3>Overall Summary</h3>
				<span class="shifts-count">${grandTotal.shiftsCount} enabled shift${grandTotal.shiftsCount !== 1 ? "s" : ""}</span>
			</div>
			<div class="overall-summary-details">
				<div class="summary-row">
					<span class="summary-label">Total Hours:</span>
					<span class="summary-value">${formatHours(grandTotal.totalHours)}h</span>
				</div>
				<div class="summary-row">
					<span class="summary-label">Base Salary:</span>
					<span class="summary-value">${formatCurrency(grandTotal.baseSalary)}</span>
				</div>
				<div class="summary-row">
					<span class="summary-label">Gross Salary:</span>
					<span class="summary-value">${formatCurrency(grandTotal.totalSalary)}</span>
				</div>
				<div class="summary-row deduction">
					<span class="summary-label">TyEL Deduction:</span>
					<span class="summary-value">-${formatCurrency(grandTotal.tyelDeduction)}</span>
				</div>
				<div class="summary-row deduction">
					<span class="summary-label">TVM Deduction:</span>
					<span class="summary-value">-${formatCurrency(grandTotal.tvmDeduction)}</span>
				</div>
				<div class="summary-row total">
					<span class="summary-label">Net Salary:</span>
					<span class="summary-value">${formatCurrency(grandTotal.netSalary)}</span>
				</div>
			</div>
		</div>
	`;
}
