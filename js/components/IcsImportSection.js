import IcsImportForm from "./IcsImportForm.js";
import IcsResults from "./IcsResults.js";
import WeeklyView from "./WeeklyView.js";

/**
 * Renders the complete ICS import section
 *
 * @param {object} props - Component properties
 * @param {string} props.icsUrl - Current ICS URL value
 * @param {string} props.buttonText - Button text
 * @param {boolean} props.isLoading - Whether the form is in loading state
 * @param {string} props.message - Message to display
 * @param {string} props.messageType - Message type ('success' or 'error')
 * @param {object} props.weeklyShifts - Grouped shifts by week
 * @param {number} props.totalShifts - Total number of shifts
 * @param {object} props.weeklyTotals - Weekly calculation totals (optional)
 * @param {object} props.grandTotal - Grand total calculations (optional)
 * @returns {string} - Component HTML
 */
export default function IcsImportSection(props = {}) {
	const {
		icsUrl = "",
		buttonText = "Fetch Calendar Data",
		isLoading = false,
		message = "",
		messageType = "success",
		weeklyShifts = {},
		totalShifts = 0,
		weeklyTotals = {},
		grandTotal = null,
	} = props;

	const form = IcsImportForm({ icsUrl, buttonText, isLoading });

	let results = "";
	if (Object.keys(weeklyShifts).length > 0) {
		// Show parsed shifts without success message
		const content = `
			<div style="margin-top: 15px;">
				<strong>Parsed Shifts (${totalShifts} total):</strong>
			</div>
			${WeeklyView({ weeklyShifts, weeklyTotals, grandTotal })}
		`;
		results = IcsResults({ content });
	} else if (totalShifts === 0 && messageType === "success" && message) {
		// Show message when ICS file was parsed successfully but contains no shifts
		const content = `
			<div style="margin-top: 15px;">
				<p class="no-shifts">No shifts found in the calendar. The file was processed successfully but contains no calendar events with shift data.</p>
			</div>
		`;
		results = IcsResults({ content });
	} else if (message && messageType === "error") {
		// Only show error messages
		results = IcsResults({ message, type: messageType });
	}

	return `
		${form}
		${results}
	`;
}
