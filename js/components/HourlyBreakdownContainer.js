import HourBreakdown from "./HourBreakdown.js";

/**
 * Renders the collapsible hourly breakdown section
 *
 * @param {object} props - Component properties
 * @param {Array} props.hourlyBreakdown - Array of hourly breakdown data
 * @param {Function} props.formatTime - Function to format time
 * @param {Function} props.formatCurrency - Function to format currency
 * @returns {string} - Component HTML
 */
export default function HourlyBreakdownContainer(props = {}) {
	const { hourlyBreakdown = [], formatTime, formatCurrency } = props;

	return `
    <div class="breakdown-toggle">
      <h3>Hourly Breakdown <span class="toggle-icon">▼</span></h3>
    </div>

    <div class="hourly-breakdown-container">
      ${hourlyBreakdown
				.map((hour) =>
					HourBreakdown({
						...hour,
						formatTime,
						formatCurrency,
					}),
				)
				.join("")}
    </div>
  `;
}
