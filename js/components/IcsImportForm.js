/**
 * Renders the ICS import form
 *
 * @param {object} props - Component properties
 * @param {string} props.icsUrl - Current ICS URL value
 * @param {string} props.buttonText - Button text
 * @param {boolean} props.isLoading - Whether the form is in loading state
 * @returns {string} - Component HTML
 */
export default function IcsImportForm(props = {}) {
	const { icsUrl = "", buttonText = "Fetch ICS Data", isLoading = false } = props;

	return `
		<div class="ics-form">
			<div class="form-group">
				<label for="ics-url">ICS File URL:</label>
				<input
					type="url"
					id="ics-url"
					placeholder="https://example.com/calendar.ics"
					value="${icsUrl}"
					${isLoading ? "disabled" : ""}
				/>
			</div>
			<button
				id="fetch-ics-btn"
				${isLoading ? "disabled" : ""}
			>
				${buttonText}
			</button>
		</div>
	`;
}
