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
 * @returns {string} - Component HTML
 */
export default function IcsImportSection(props = {}) {
	const {
		icsUrl = "",
		buttonText = "Fetch ICS Data",
		isLoading = false,
		message = "",
		messageType = "success",
		weeklyShifts = {},
		totalShifts = 0,
	} = props;

	const form = IcsImportForm({ icsUrl, buttonText, isLoading });

	let results = "";
	if (Object.keys(weeklyShifts).length > 0) {
		// Show parsed shifts without success message
		const content = `
			<div style="margin-top: 15px;">
				<strong>Parsed Shifts (${totalShifts} total):</strong>
			</div>
			${WeeklyView({ weeklyShifts })}
		`;
		results = IcsResults({ content });
	} else if (totalShifts === 0 && messageType === "success") {
		// Show message when ICS file was parsed successfully but contains no shifts
		const content = `
			<div style="margin-top: 15px;">
				<p class="no-shifts">No shifts found in the ICS file. The file was processed successfully but contains no calendar events with shift data.</p>
			</div>
		`;
		results = IcsResults({ content });
	} else if (message && messageType === "error") {
		// Only show error messages
		results = IcsResults({ message, type: messageType });
	}

	return `
		<div class="ics-import-section">
			<h2>Import Shifts from ICS File</h2>
			${form}
			${results}
		</div>
	`;
}
