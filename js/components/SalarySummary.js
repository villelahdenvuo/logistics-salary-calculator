import Component from "./Component.js";

/**
 * Generic Salary Summary component that can be used for both single shift and multiple shift summaries
 * @param {Object} props - Component properties
 * @param {Object} props.totals - Total calculations object
 * @param {number} props.totals.totalHours - Total hours worked
 * @param {number} props.totals.baseSalary - Base salary total
 * @param {number} props.totals.totalSalary - Total salary before deductions
 * @param {number} props.totals.tyelDeduction - TyEL deduction
 * @param {number} props.totals.tvmDeduction - TVM deduction
 * @param {number} props.totals.netSalary - Net salary after deductions
 * @param {number} props.totals.shiftsCount - Number of shifts (optional)
 * @param {string} props.title - Title for the summary section
 * @param {string} props.className - Additional CSS class name
 * @param {boolean} props.showShiftCount - Whether to show shift count
 * @returns {string} HTML string for the salary summary
 */
export default function SalarySummary({
	totals,
	title = "Salary Summary",
	className = "salary-summary",
	showShiftCount = false,
} = {}) {
	if (!totals) {
		return Component(
			{},
			`<div class="${className}"><p class="no-data">No data to display.</p></div>`,
		);
	}

	const formatCurrency = (amount) =>
		amount.toLocaleString("fi-FI", {
			style: "currency",
			currency: "EUR",
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		});

	const formatHours = (hours) => hours.toFixed(1);

	const shiftsCountDisplay =
		showShiftCount && totals.shiftsCount
			? `<span class="shifts-count">${totals.shiftsCount} shift${totals.shiftsCount !== 1 ? "s" : ""}</span>`
			: "";

	return Component(
		{},
		`
		<div class="${className}">
			<div class="summary-header">
				<h3>${title}</h3>
				${shiftsCountDisplay}
			</div>
			<div class="summary-details">
				<div class="summary-row">
					<span class="summary-label">Total Hours:</span>
					<span class="summary-value">${formatHours(totals.totalHours || 0)}h</span>
				</div>
				<div class="summary-row">
					<span class="summary-label">Base Salary:</span>
					<span class="summary-value">${formatCurrency(totals.baseSalary || 0)}</span>
				</div>
				<div class="summary-row">
					<span class="summary-label">Gross Salary:</span>
					<span class="summary-value">${formatCurrency(totals.totalSalary || 0)}</span>
				</div>
				<div class="summary-row deduction">
					<span class="summary-label">TyEL Deduction:</span>
					<span class="summary-value">-${formatCurrency(totals.tyelDeduction || 0)}</span>
				</div>
				<div class="summary-row deduction">
					<span class="summary-label">TVM Deduction:</span>
					<span class="summary-value">-${formatCurrency(totals.tvmDeduction || 0)}</span>
				</div>
				<div class="summary-row total">
					<span class="summary-label">Net Salary:</span>
					<span class="summary-value">${formatCurrency(totals.netSalary || 0)}</span>
				</div>
			</div>
		</div>
	`,
	);
}
