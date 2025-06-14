/**
 * Renders a single shift block
 *
 * @param {object} props - Component properties
 * @param {object} props.shift - Shift data object
 * @param {string} props.shift.description - Shift description
 * @param {Date} props.shift.start - Shift start time
 * @param {Date} props.shift.end - Shift end time
 * @param {boolean} props.shift.isEnabled - Whether shift is enabled
 * @param {object} props.shift.calculation - Salary calculation results
 * @returns {string} - Component HTML
 */
export default function ShiftBlock(props = {}) {
	const { shift } = props;

	if (!shift) return "";

	const startTime = shift.start.toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
	const endTime = shift.end.toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});

	// Format calculation results if available
	const calculationDisplay =
		shift.calculation && shift.isEnabled
			? `
		<div class="shift-calculation">
			<div class="shift-hours">${shift.calculation.totalHours.toFixed(1)}h</div>
			<div class="shift-salary">${shift.calculation.netSalary.toLocaleString("fi-FI", {
				style: "currency",
				currency: "EUR",
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			})}</div>
		</div>
	`
			: "";

	return `
		<div class="shift-block ${shift.isEnabled ? "enabled" : "disabled"}" data-shift-id="${shift.id || ""}">
			<div class="shift-time">${startTime} - ${endTime}</div>
			<div class="shift-description">${shift.description}</div>
			${calculationDisplay}
			<input type="checkbox" class="shift-toggle" ${shift.isEnabled ? "checked" : ""}>
		</div>
	`;
}
