/**
 * Renders ICS import results container
 *
 * @param {object} props - Component properties
 * @param {string} props.message - Message to display (optional)
 * @param {string} props.type - Message type ('success' or 'error')
 * @param {string} props.content - Additional content HTML (optional)
 * @returns {string} - Component HTML
 */
export default function IcsResults(props = {}) {
	const { message = "", type = "success", content = "" } = props;

	if (!message && !content) return "";

	const messageClass = type === "error" ? "error-message" : "success-message";

	return `
		<div class="ics-results active">
			${message ? `<div class="${messageClass}">${message}</div>` : ""}
			${content}
		</div>
	`;
}
