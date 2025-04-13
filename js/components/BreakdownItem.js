/**
 * Renders a breakdown item row with label and value
 *
 * @param {object} props - Component properties
 * @param {string} props.label - The label text
 * @param {string} props.value - The value text
 * @param {string} props.emoji - Optional emoji icon
 * @param {string} props.className - Optional CSS class name
 * @returns {string} - Component HTML
 */
export default function BreakdownItem(props = {}, _children = "") {
	const { label, value, emoji = "", className = "" } = props;

	return `
    <div class="breakdown-item ${className}">
      <span>${emoji ? `${emoji} ` : ""}${label}</span>
      <span>${value}</span>
    </div>
  `;
}
