/**
 * Renders a single shift block
 *
 * @param {object} props - Component properties
 * @param {object} props.shift - Shift data object
 * @param {string} props.shift.description - Shift description
 * @param {Date} props.shift.start - Shift start time
 * @param {Date} props.shift.end - Shift end time
 * @param {boolean} props.shift.isEnabled - Whether shift is enabled
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

	return `
		<div class="shift-block ${shift.isEnabled ? "enabled" : "disabled"}" data-shift-id="${shift.id || ""}" onclick="toggleShiftBlock(this)">
			<div class="shift-time">${startTime} - ${endTime}</div>
			<div class="shift-description">${shift.description}</div>
			<input type="checkbox" class="shift-toggle" ${shift.isEnabled ? "checked" : ""} onclick="event.stopPropagation()">
		</div>
	`;
}

/**
 * Toggles a shift block when clicked
 * @param {HTMLElement} shiftBlockElement - The shift block element that was clicked
 */
window.toggleShiftBlock = function (shiftBlockElement) {
	const checkbox = shiftBlockElement.querySelector(".shift-toggle");
	if (checkbox) {
		checkbox.checked = !checkbox.checked;
		// Update the visual state immediately
		const isEnabled = checkbox.checked;
		const shiftId = shiftBlockElement.dataset.shiftId;
		shiftBlockElement.className = `shift-block ${isEnabled ? "enabled" : "disabled"}`;
		// Preserve the data attribute
		if (shiftId) {
			shiftBlockElement.setAttribute("data-shift-id", shiftId);
		}

		// Trigger the change event to update the underlying data
		checkbox.dispatchEvent(new Event("change", { bubbles: true }));
	}
};
